"""A small, auditable anaemia screening decision-support demo."""

from __future__ import annotations

import json
import os
import sqlite3
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi import Body
from fastapi import Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field
from .oral_triage import triage_oral
from .security import issue_token, password_hash, password_verify, read_token

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.getenv("MODEL_PATH", ROOT / "model.json"))
DB_PATH = Path(os.getenv("DB_PATH", ROOT / "screenings.db"))
# Normalized central lower-conjunctiva ROI: x, y, width, height. Kept in sync with training/features.py.
ROI = (0.20, 0.35, 0.60, 0.40)
# Feature order/formulas are shared verbatim with training/features.py.
FEATURES = ["mean_r", "mean_g", "mean_b", "red_green", "red_blue", "green_blue"]
GROUPS: dict[str, dict[str, float]] = {
    "child_6_59m": {"label": "Child 6–59 months", "anaemia": 11, "moderate": 10, "severe": 7},
    "child_5_11y": {"label": "Child 5–11 years", "anaemia": 11.5, "moderate": 11, "severe": 8},
    "age_12_14": {"label": "Age 12–14 years", "anaemia": 12, "moderate": 11, "severe": 8},
    "woman_nonpregnant": {
        "label": "Non-pregnant woman",
        "anaemia": 12,
        "moderate": 11,
        "severe": 8,
    },
    "woman_pregnant": {"label": "Pregnant woman", "anaemia": 11, "moderate": 10, "severe": 7},
    "man": {"label": "Man", "anaemia": 13, "moderate": 11, "severe": 8},
}
DANGER = {"breathless_at_rest", "chest_pain", "fainting"}
app = FastAPI(
    title="Niramaya screening aid",
    version="0.1.0",
    description="Decision support only; not a diagnostic device.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
_login_attempts: dict[str, deque[float]] = defaultdict(deque)
_migrated_databases: set[str] = set()


@app.middleware("http")
async def enforce_api_roles(request, call_next):
    path = request.url.path
    if not path.startswith("/api/") or path in {
        "/api/health",
        "/api/groups",
        "/api/auth/login",
        "/api/auth/refresh",
    }:
        return await call_next(request)
    from starlette.responses import JSONResponse

    try:
        auth = request.headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse({"detail": "Sign in to continue."}, status_code=401)
        claims = read_token(auth[7:])
        con = db()
        user = con.execute(
            "SELECT id,role,disabled,force_password_change,village_id FROM users WHERE id=?",
            (claims["sub"],),
        ).fetchone()
        con.close()
        if not user or user["disabled"]:
            return JSONResponse({"detail": "Account unavailable."}, status_code=401)
        if (
            path.startswith("/api/admin/")
            or path
            in {"/api/logs", "/api/stats", "/api/model", "/api/oral/logs", "/api/oral/stats"}
            or path.startswith("/api/logs/")
            or path.startswith("/api/oral/logs/")
        ):
            allowed = user["role"] in {"admin", "superadmin"}
        else:
            allowed = user["role"] in {"client", "admin", "superadmin"}
        if not allowed:
            return JSONResponse(
                {"detail": "Your role cannot access this resource."}, status_code=403
            )
        if user["force_password_change"] and path not in {
            "/api/auth/me",
            "/api/auth/change-password",
        }:
            return JSONResponse(
                {"detail": "Change your demo password before using the service."}, status_code=403
            )
    except (ValueError, RuntimeError, KeyError):
        return JSONResponse({"detail": "Session expired. Sign in again."}, status_code=401)
    response = await call_next(request)
    if path not in {"/api/auth/me", "/api/auth/change-password"}:
        con = db()
        con.execute(
            "INSERT INTO audit_log(user_id,action,resource,created) VALUES(?,?,?,?)",
            (
                user["id"],
                "view" if request.method in {"GET", "HEAD"} else "change",
                path,
                time.time(),
            ),
        )
        con.commit()
        con.close()
    return response


@app.middleware("http")
async def prevent_health_data_caching(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, private"
        response.headers["Pragma"] = "no-cache"
    return response


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute(
        "CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, created REAL, village TEXT, group_key TEXT, zone TEXT, hb REAL, low REAL, high REAL, model_version TEXT, symptoms TEXT, lab_hb REAL)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS oral_logs (id INTEGER PRIMARY KEY, created REAL NOT NULL, village TEXT, age_band TEXT, sex TEXT, habits TEXT, findings TEXT, symptoms TEXT DEFAULT '[]', mouth_opening TEXT, neck_node INTEGER DEFAULT 0, triage TEXT, rules TEXT, referral_status TEXT DEFAULT '', outcome TEXT)"
    )
    con.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)")
    if not con.execute("SELECT 1 FROM schema_version").fetchone():
        con.execute("INSERT INTO schema_version VALUES(1)")
    con.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('client','admin','superadmin')), village_id TEXT, disabled INTEGER NOT NULL DEFAULT 0, force_password_change INTEGER NOT NULL DEFAULT 1, failed_logins INTEGER NOT NULL DEFAULT 0, locked_until REAL NOT NULL DEFAULT 0, last_login REAL)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, resource TEXT NOT NULL, created REAL NOT NULL)"
    )
    migration = ROOT / "migrations" / "001_portal_schema.sql"
    if migration.exists() and str(DB_PATH) not in _migrated_databases:
        con.executescript(migration.read_text(encoding="utf-8"))
        con.execute("UPDATE schema_version SET version=MAX(version,2)")
        _migrated_databases.add(str(DB_PATH))
    user_columns = {row[1] for row in con.execute("PRAGMA table_info(users)")}
    if "last_login" not in user_columns:
        con.execute("ALTER TABLE users ADD COLUMN last_login REAL")
    oral_columns = {row[1] for row in con.execute("PRAGMA table_info(oral_logs)")}
    for name, declaration in (
        ("symptoms", "TEXT DEFAULT '[]'"),
        ("mouth_opening", "TEXT"),
        ("neck_node", "INTEGER DEFAULT 0"),
    ):
        if name not in oral_columns:
            con.execute(f"ALTER TABLE oral_logs ADD COLUMN {name} {declaration}")
    return con


def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    from fastapi import HTTPException

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to continue.")
    try:
        claims = read_token(authorization[7:])
    except (ValueError, RuntimeError):
        raise HTTPException(401, "Session expired. Sign in again.")
    con = db()
    user = con.execute(
        "SELECT id,username,role,village_id,disabled,force_password_change FROM users WHERE id=?",
        (claims["sub"],),
    ).fetchone()
    con.close()
    if not user or user["disabled"]:
        raise HTTPException(401, "Account unavailable.")
    return dict(user)


def require_roles(*roles: str):
    def check(user: dict[str, Any] = Depends(current_user)):
        from fastapi import HTTPException

        if user["role"] not in roles:
            raise HTTPException(403, "Your role cannot access this resource.")
        return user

    return check


class LoginPayload(BaseModel):
    username: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=200)


class PasswordChangePayload(BaseModel):
    current_password: str = Field(min_length=8, max_length=200)
    new_password: str = Field(min_length=12, max_length=200)


class SyncRecord(BaseModel):
    client_key: str = Field(min_length=8, max_length=100)
    patient_id: str = Field(min_length=4, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    village_id: str = Field(min_length=2, max_length=80)
    age_band: str = Field(min_length=2, max_length=40)
    sex: str = Field(min_length=1, max_length=30)
    kind: str
    consent: bool
    payload: dict[str, Any]
    triage: str = Field(default="", max_length=80)


class SyncBatch(BaseModel):
    records: list[SyncRecord] = Field(max_length=100)


class CreateUserPayload(BaseModel):
    username: str = Field(min_length=3, max_length=80, pattern=r"^[a-zA-Z0-9._-]+$")
    role: str
    village_id: str | None = None
    password: str = Field(min_length=12, max_length=200)


class UserStatusPayload(BaseModel):
    disabled: bool


class UserPasswordResetPayload(BaseModel):
    temporary_password: str = Field(min_length=12, max_length=200)


class LabResultPayload(BaseModel):
    hb: float = Field(ge=2, le=25)


class AnnouncementPayload(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    body: str = Field(min_length=2, max_length=4000)
    translations: dict[str, Any] = Field(default_factory=dict)
    village_id: str | None = None


class PhotoSettingPayload(BaseModel):
    enabled: bool
    privacy_review: str = Field(min_length=20, max_length=2000)


class ReferralStatusPayload(BaseModel):
    status: str
    facility: str = Field(default="", max_length=200)
    due_date: str | None = None
    outcome: str | None = Field(default=None, max_length=1000)


class FollowUpPayload(BaseModel):
    patient_id: str = Field(min_length=4, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    screening_id: int | None = None
    due_date: str = Field(min_length=10, max_length=10)
    note: str = Field(default="", max_length=1000)


class FollowUpStatusPayload(BaseModel):
    status: str


class FacilityPayload(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    village_id: str | None = Field(default=None, max_length=80)
    type: str = Field(min_length=2, max_length=40)
    contact: str = Field(default="", max_length=40)
    directions_url: str = Field(default="", max_length=500)


class VillagePayload(BaseModel):
    id: str = Field(min_length=2, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=2, max_length=160)
    phc: str = Field(default="", max_length=160)


@app.get("/api/client/home")
def client_home(user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin"))):
    con = db()
    today = time.strftime("%Y-%m-%d", time.localtime())
    total = con.execute(
        "SELECT COUNT(*) FROM screenings WHERE user_id=? AND date(created,'unixepoch','localtime')=?",
        (user["id"], today),
    ).fetchone()[0]
    pending = con.execute(
        "SELECT COUNT(*) FROM referrals r JOIN screenings s ON s.id=r.screening_id WHERE s.user_id=? AND r.status IN ('issued','not attended')",
        (user["id"],),
    ).fetchone()[0]
    due = con.execute(
        "SELECT COUNT(*) FROM follow_ups f JOIN screenings s ON s.patient_id=f.patient_id WHERE s.user_id=? AND f.status='due' AND f.due_date<=date('now','localtime')",
        (user["id"],),
    ).fetchone()[0]
    con.close()
    return {
        "demo_data": True,
        "today_screenings": total,
        "pending_referrals": pending,
        "follow_ups_due": due,
    }


@app.post("/api/sync")
def sync_records(batch: SyncBatch, user: dict[str, Any] = Depends(require_roles("client"))):
    con = db()
    accepted = []
    try:
        for item in batch.records:
            if not item.consent:
                raise HTTPException(400, "Consent is required for every screening.")
            if item.kind not in {"anaemia", "oral"}:
                raise HTTPException(400, "Unknown screening type.")
            if user["role"] == "client" and item.village_id != user.get("village_id"):
                raise HTTPException(403, "This worker is not assigned to that village.")
            if len(json.dumps(item.payload, ensure_ascii=False)) > 12000:
                raise HTTPException(413, "Screening payload is too large.")
            allowed_payload = {
                "demo_data",
                "screening_type",
                "oral_triage",
                "findings",
                "symptoms",
                "group_key",
                "patient_group",
            }
            if set(item.payload) - allowed_payload:
                raise HTTPException(
                    400,
                    "Screening payload contains unsupported fields. Do not submit names, contact details, addresses, or images.",
                )
            con.execute(
                "INSERT OR IGNORE INTO villages(id,name,demo,created) VALUES(?,?,1,?)",
                (item.village_id, item.village_id, time.time()),
            )
            con.execute(
                "INSERT OR IGNORE INTO patients(id,village_id,age_band,sex,created) VALUES(?,?,?,?,?)",
                (item.patient_id, item.village_id, item.age_band, item.sex, time.time()),
            )
            patient = con.execute(
                "SELECT village_id FROM patients WHERE id=?", (item.patient_id,)
            ).fetchone()
            if patient["village_id"] != item.village_id:
                raise HTTPException(
                    409, "That pseudonymous ID is already assigned to a different village."
                )
            previous = con.execute(
                "SELECT id,user_id FROM screenings WHERE client_key=?", (item.client_key,)
            ).fetchone()
            if previous and previous["user_id"] != user["id"]:
                raise HTTPException(409, "This sync key belongs to another account.")
            con.execute(
                "INSERT OR IGNORE INTO screenings(client_key,patient_id,village_id,kind,consent,payload,triage,created,user_id,demo) VALUES(?,?,?,?,1,?,?,?,?,1)",
                (
                    item.client_key,
                    item.patient_id,
                    item.village_id,
                    item.kind,
                    json.dumps(item.payload),
                    item.triage,
                    time.time(),
                    user["id"],
                ),
            )
            row = con.execute(
                "SELECT id FROM screenings WHERE client_key=?", (item.client_key,)
            ).fetchone()
            accepted.append({"client_key": item.client_key, "screening_id": row["id"]})
            if item.kind == "oral":
                oral = item.payload.get("oral_triage") or {}
                con.execute(
                    "INSERT OR IGNORE INTO oral_screenings(screening_id,findings,symptoms,rules) VALUES(?,?,?,?)",
                    (
                        row["id"],
                        json.dumps(item.payload.get("findings", [])),
                        json.dumps(item.payload.get("symptoms", [])),
                        json.dumps(oral.get("rules", [])),
                    ),
                )
            if item.triage in {"urgent", "refer", "high_risk", "red"}:
                con.execute(
                    "INSERT OR IGNORE INTO referrals(screening_id,status,created,updated) SELECT ?, 'issued', ?, ? WHERE NOT EXISTS(SELECT 1 FROM referrals WHERE screening_id=?)",
                    (row["id"], time.time(), time.time(), row["id"]),
                )
        con.commit()
    except Exception:
        con.rollback()
        con.close()
        raise
    con.close()
    return {"accepted": accepted, "synced_at": time.time()}


@app.get("/api/client/patients")
def client_patients(user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin"))):
    con = db()
    rows = con.execute(
        "SELECT p.id,p.village_id,p.age_band,p.sex,COUNT(s.id) screenings,MAX(s.created) last_screening FROM patients p LEFT JOIN screenings s ON s.patient_id=p.id WHERE s.user_id=? GROUP BY p.id ORDER BY last_screening DESC LIMIT 500",
        (user["id"],),
    ).fetchall()
    con.close()
    return {"patients": [dict(r) for r in rows]}


@app.get("/api/client/patients/{patient_id}")
def client_patient(patient_id: str, user: dict[str, Any] = Depends(require_roles("client"))):
    con = db()
    patient = con.execute(
        "SELECT p.* FROM patients p WHERE p.id=? AND EXISTS(SELECT 1 FROM screenings s WHERE s.patient_id=p.id AND s.user_id=?)",
        (patient_id, user["id"]),
    ).fetchone()
    if not patient:
        con.close()
        raise HTTPException(404, "Patient record not found.")
    screenings = con.execute(
        "SELECT id,kind,triage,created,demo FROM screenings WHERE patient_id=? AND user_id=? ORDER BY created DESC",
        (patient_id, user["id"]),
    ).fetchall()
    referrals = con.execute(
        "SELECT r.id,r.screening_id,r.status,r.facility,r.due_date,r.outcome FROM referrals r JOIN screenings s ON s.id=r.screening_id WHERE s.patient_id=? AND s.user_id=? ORDER BY r.created DESC",
        (patient_id, user["id"]),
    ).fetchall()
    followups = con.execute(
        "SELECT id,due_date,status,note FROM follow_ups WHERE patient_id=? ORDER BY due_date",
        (patient_id,),
    ).fetchall()
    con.close()
    return {
        "patient": dict(patient),
        "screenings": [dict(x) for x in screenings],
        "referrals": [dict(x) for x in referrals],
        "follow_ups": [dict(x) for x in followups],
    }


@app.get("/api/client/referrals")
def client_referrals(
    user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin")),
):
    con = db()
    rows = con.execute(
        "SELECT r.*,s.patient_id,s.village_id,s.kind FROM referrals r JOIN screenings s ON s.id=r.screening_id WHERE s.user_id=? ORDER BY r.created DESC LIMIT 300",
        (user["id"],),
    ).fetchall()
    con.close()
    return {"referrals": [dict(r) for r in rows]}


@app.get("/api/client/follow-ups")
def client_follow_ups(user: dict[str, Any] = Depends(require_roles("client"))):
    con = db()
    rows = con.execute(
        "SELECT f.id,f.patient_id,f.screening_id,f.due_date,f.status,f.note FROM follow_ups f JOIN screenings s ON s.patient_id=f.patient_id WHERE s.user_id=? ORDER BY f.due_date LIMIT 300",
        (user["id"],),
    ).fetchall()
    con.close()
    return {"follow_ups": [dict(x) for x in rows]}


@app.get("/api/client/announcements")
def client_announcements(
    user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin")),
):
    con = db()
    rows = con.execute(
        "SELECT a.*,CASE WHEN ar.read_at IS NULL THEN 0 ELSE 1 END is_read FROM announcements a LEFT JOIN announcement_reads ar ON ar.announcement_id=a.id AND ar.user_id=? WHERE a.active=1 AND (a.village_id IS NULL OR a.village_id=?) ORDER BY a.created DESC LIMIT 100",
        (user["id"], user.get("village_id")),
    ).fetchall()
    con.close()
    return {"announcements": [dict(r) for r in rows]}


@app.get("/api/client/facilities")
def client_facilities(
    user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin")),
):
    con = db()
    rows = con.execute(
        "SELECT id,name,village_id,type,contact,directions_url,demo FROM facilities WHERE village_id IS NULL OR village_id=? ORDER BY name",
        (user.get("village_id"),),
    ).fetchall()
    con.close()
    return {"facilities": [dict(r) for r in rows], "demo_data": True}


@app.get("/api/admin/villages")
def admin_villages(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute("SELECT * FROM villages ORDER BY name").fetchall()
    con.close()
    return {"villages": [dict(r) for r in rows]}


@app.post("/api/admin/villages")
def add_village(
    body: VillagePayload, user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))
):
    con = db()
    try:
        con.execute(
            "INSERT INTO villages(id,name,phc,demo,created) VALUES(?,?,?,0,?)",
            (body.id, body.name, body.phc, time.time()),
        )
        con.commit()
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(409, "Village ID already exists.")
    con.close()
    return {"created": True}


@app.get("/api/admin/facilities")
def admin_facilities(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute("SELECT * FROM facilities ORDER BY name").fetchall()
    con.close()
    return {"facilities": [dict(r) for r in rows]}


@app.post("/api/admin/facilities")
def add_facility(
    body: FacilityPayload, user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))
):
    if body.directions_url and not body.directions_url.startswith("https://"):
        raise HTTPException(400, "Directions link must use HTTPS.")
    con = db()
    cur = con.execute(
        "INSERT INTO facilities(name,village_id,type,contact,directions_url,demo,created,user_id) VALUES(?,?,?,?,?,0,?,?)",
        (
            body.name,
            body.village_id,
            body.type,
            body.contact,
            body.directions_url,
            time.time(),
            user["id"],
        ),
    )
    con.commit()
    fid = cur.lastrowid
    con.close()
    return {"id": fid, "created": True}


@app.post("/api/client/announcements/{announcement_id}/read")
def read_announcement(
    announcement_id: int, user: dict[str, Any] = Depends(require_roles("client"))
):
    con = db()
    row = con.execute(
        "SELECT id FROM announcements WHERE id=? AND active=1 AND (village_id IS NULL OR village_id=?)",
        (announcement_id, user.get("village_id")),
    ).fetchone()
    if not row:
        con.close()
        raise HTTPException(404, "Announcement not found.")
    con.execute(
        "INSERT OR IGNORE INTO announcement_reads VALUES(?,?,?)",
        (announcement_id, user["id"], time.time()),
    )
    con.commit()
    con.close()
    return {"read": True}


@app.get("/api/admin/users")
def admin_users(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute(
        "SELECT id,username,role,village_id,disabled,force_password_change,last_login FROM users ORDER BY id"
    ).fetchall()
    con.close()
    return {"users": [dict(r) for r in rows]}


@app.post("/api/admin/users")
def create_user(
    body: CreateUserPayload, user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))
):
    if body.role not in {"client", "admin", "superadmin"}:
        raise HTTPException(400, "Invalid role.")
    if user["role"] != "superadmin" and body.role != "client":
        raise HTTPException(403, "Only superadmin may create administrators.")
    if user["role"] == "client" and not body.village_id:
        raise HTTPException(400, "A village assignment is required for clients.")
    con = db()
    try:
        cur = con.execute(
            "INSERT INTO users(username,password_hash,role,village_id,force_password_change) VALUES(?,?,?,?,1)",
            (body.username.lower(), password_hash(body.password), body.role, body.village_id),
        )
        con.commit()
        uid = cur.lastrowid
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(409, "That username already exists.")
    con.close()
    return {"id": uid, "created": True, "demo_data": True}


@app.patch("/api/admin/users/{user_id}")
def set_user_status(
    user_id: int,
    body: UserStatusPayload,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    con = db()
    target = con.execute("SELECT role FROM users WHERE id=?", (user_id,)).fetchone()
    if not target:
        con.close()
        raise HTTPException(404, "User not found.")
    if target["role"] == "superadmin" and user["role"] != "superadmin":
        con.close()
        raise HTTPException(403, "Only superadmin can change a superadmin account.")
    con.execute(
        "UPDATE users SET disabled=?,force_password_change=1 WHERE id=?",
        (int(body.disabled), user_id),
    )
    con.commit()
    con.close()
    return {"updated": True}


@app.post("/api/admin/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    body: UserPasswordResetPayload,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    con = db()
    target = con.execute("SELECT role FROM users WHERE id=?", (user_id,)).fetchone()
    if not target:
        con.close()
        raise HTTPException(404, "User not found.")
    if target["role"] in {"admin", "superadmin"} and user["role"] != "superadmin":
        con.close()
        raise HTTPException(403, "Only superadmin may reset administrator accounts.")
    con.execute(
        "UPDATE users SET password_hash=?,force_password_change=1,failed_logins=0,locked_until=0 WHERE id=?",
        (password_hash(body.temporary_password), user_id),
    )
    con.commit()
    con.close()
    return {"reset": True, "force_password_change": True}


@app.get("/api/admin/screenings")
def admin_screenings(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute(
        "SELECT s.id,s.patient_id,s.village_id,s.kind,s.triage,s.created,s.demo,s.user_id,o.specialist_outcome,l.hb lab_hb FROM screenings s LEFT JOIN oral_screenings o ON o.screening_id=s.id LEFT JOIN lab_results l ON l.screening_id=s.id ORDER BY s.created DESC LIMIT 1000"
    ).fetchall()
    con.close()
    return {"records": [dict(r) for r in rows], "demo_data": True}


@app.get("/api/admin/analytics")
def admin_analytics(
    start_date: str | None = None,
    end_date: str | None = None,
    village_id: str | None = None,
    kind: str | None = None,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    clauses = []
    values = []
    if start_date:
        try:
            time.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(400, "start_date must use YYYY-MM-DD")
        clauses.append("date(created,'unixepoch','localtime')>=?")
        values.append(start_date)
    if end_date:
        try:
            time.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(400, "end_date must use YYYY-MM-DD")
        clauses.append("date(created,'unixepoch','localtime')<=?")
        values.append(end_date)
    if village_id:
        clauses.append("village_id=?")
        values.append(village_id)
    if kind:
        if kind not in {"anaemia", "oral"}:
            raise HTTPException(400, "kind must be anaemia or oral")
        clauses.append("kind=?")
        values.append(kind)
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    con = db()
    daily = con.execute(
        "SELECT date(created,'unixepoch','localtime') day,COUNT(*) n FROM screenings"
        + where
        + " GROUP BY day ORDER BY day",
        values,
    ).fetchall()
    villages = con.execute(
        "SELECT village_id,kind,COUNT(*) n FROM screenings"
        + where
        + " GROUP BY village_id,kind ORDER BY village_id",
        values,
    ).fetchall()
    total = con.execute("SELECT COUNT(*) FROM screenings" + where, values).fetchone()[0]
    con.close()
    return {
        "total": total,
        "daily": [dict(x) for x in daily],
        "villages": [dict(x) for x in villages],
        "small_count_unreliable": total < 30,
        "demo_data": True,
    }


@app.post("/api/admin/oral-screenings/{screening_id}/outcome")
def save_oral_outcome(
    screening_id: int,
    body: dict[str, str],
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    outcome = body.get("outcome", "")
    if outcome not in {"", "normal", "OPMD confirmed", "dysplasia", "malignancy", "other"}:
        raise HTTPException(400, "Invalid specialist outcome.")
    con = db()
    cur = con.execute(
        "UPDATE oral_screenings SET specialist_outcome=? WHERE screening_id=?",
        (outcome or None, screening_id),
    )
    con.commit()
    con.close()
    if not cur.rowcount:
        raise HTTPException(404, "Oral screening record not found.")
    return {"saved": True}


@app.post("/api/admin/screenings/{screening_id}/lab")
def save_lab_result(
    screening_id: int,
    body: LabResultPayload,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    con = db()
    row = con.execute(
        "SELECT id FROM screenings WHERE id=? AND kind='anaemia'", (screening_id,)
    ).fetchone()
    if not row:
        con.close()
        raise HTTPException(404, "Anaemia screening not found.")
    con.execute(
        "INSERT INTO lab_results(screening_id,hb,confirmed,created,user_id) VALUES(?,?,1,?,?) ON CONFLICT(screening_id) DO UPDATE SET hb=excluded.hb,created=excluded.created,user_id=excluded.user_id",
        (screening_id, body.hb, time.time(), user["id"]),
    )
    con.commit()
    con.close()
    return {"saved": True, "note": "Monitoring only; not clinical validation."}


@app.patch("/api/admin/referrals/{referral_id}")
def update_referral(
    referral_id: int,
    body: ReferralStatusPayload,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    if body.status not in {"issued", "attended", "not attended", "confirmed outcome"}:
        raise HTTPException(400, "Invalid referral status.")
    con = db()
    cur = con.execute(
        "UPDATE referrals SET status=?,facility=?,due_date=?,outcome=?,updated=? WHERE id=?",
        (body.status, body.facility, body.due_date, body.outcome, time.time(), referral_id),
    )
    con.commit()
    con.close()
    if not cur.rowcount:
        raise HTTPException(404, "Referral not found.")
    return {"updated": True}


@app.get("/api/admin/referrals")
def admin_referrals(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute(
        "SELECT r.*,s.patient_id,s.village_id,s.kind FROM referrals r JOIN screenings s ON s.id=r.screening_id ORDER BY r.created DESC LIMIT 1000"
    ).fetchall()
    con.close()
    return {"referrals": [dict(x) for x in rows]}


@app.post("/api/admin/follow-ups")
def create_follow_up(
    body: FollowUpPayload, user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))
):
    try:
        time.strptime(body.due_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "due_date must use YYYY-MM-DD.")
    con = db()
    patient = con.execute("SELECT id FROM patients WHERE id=?", (body.patient_id,)).fetchone()
    if not patient:
        con.close()
        raise HTTPException(404, "Patient record not found.")
    cur = con.execute(
        "INSERT INTO follow_ups(patient_id,screening_id,due_date,note,created) VALUES(?,?,?,?,?)",
        (body.patient_id, body.screening_id, body.due_date, body.note, time.time()),
    )
    con.commit()
    fid = cur.lastrowid
    con.close()
    return {"id": fid, "created": True}


@app.patch("/api/admin/follow-ups/{follow_up_id}")
def update_follow_up(
    follow_up_id: int,
    body: FollowUpStatusPayload,
    user: dict[str, Any] = Depends(require_roles("admin", "superadmin")),
):
    if body.status not in {"due", "done", "cancelled"}:
        raise HTTPException(400, "Invalid follow-up status.")
    con = db()
    cur = con.execute("UPDATE follow_ups SET status=? WHERE id=?", (body.status, follow_up_id))
    con.commit()
    con.close()
    if not cur.rowcount:
        raise HTTPException(404, "Follow-up not found.")
    return {"updated": True}


@app.get("/api/admin/audit")
def admin_audit(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute(
        "SELECT a.id,a.user_id,u.username,a.action,a.resource,a.created FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 1000"
    ).fetchall()
    con.close()
    return {"events": [dict(r) for r in rows]}


@app.get("/api/admin/announcements")
def admin_announcements(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    rows = con.execute("SELECT * FROM announcements ORDER BY created DESC LIMIT 300").fetchall()
    con.close()
    return {"announcements": [dict(r) for r in rows]}


@app.post("/api/admin/announcements")
def create_announcement(
    body: AnnouncementPayload, user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))
):
    con = db()
    cur = con.execute(
        "INSERT INTO announcements(title,body,translations,village_id,created,user_id) VALUES(?,?,?,?,?,?)",
        (
            body.title,
            body.body,
            json.dumps(body.translations, ensure_ascii=False),
            body.village_id,
            time.time(),
            user["id"],
        ),
    )
    con.commit()
    created = cur.lastrowid
    con.close()
    return {"id": created, "published": True}


@app.get("/api/admin/settings")
def admin_settings(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    defaults = {
        "photo_uploads": {"value": "disabled", "version": 1, "updated": None},
        "clinical_review_required": {"value": True, "version": 1, "updated": None},
        "retention_days": {"value": "not configured", "version": 1, "updated": None},
    }
    con = db()
    rows = con.execute("SELECT key,value,version,updated FROM settings").fetchall()
    con.close()
    for row in rows:
        defaults[row["key"]] = {
            "value": json.loads(row["value"]),
            "version": row["version"],
            "updated": row["updated"],
        }
    return {"settings": defaults}


@app.post("/api/auth/login")
def login(body: LoginPayload, request: Request) -> dict[str, Any]:
    ip = request.client.host if request.client else "unknown"
    attempts = _login_attempts[ip]
    now = time.time()
    while attempts and now - attempts[0] > 300:
        attempts.popleft()
    if len(attempts) >= 10:
        raise HTTPException(
            429,
            "Too many sign-in attempts. Wait a few minutes and try again.",
            headers={"Retry-After": "300"},
        )
    attempts.append(now)
    con = db()
    row = con.execute(
        "SELECT * FROM users WHERE username=?", (body.username.strip().lower(),)
    ).fetchone()
    now = time.time()
    if (
        not row
        or row["disabled"]
        or row["locked_until"] > now
        or not password_verify(body.password, row["password_hash"])
    ):
        if row:
            failed = row["failed_logins"] + 1
            con.execute(
                "UPDATE users SET failed_logins=?,locked_until=? WHERE id=?",
                (failed, now + 900 if failed >= 5 else 0, row["id"]),
            )
        con.commit()
        con.close()
        raise HTTPException(401, "Invalid credentials or account temporarily locked.")
    con.execute(
        "UPDATE users SET failed_logins=0,locked_until=0,last_login=? WHERE id=?", (now, row["id"])
    )
    con.execute(
        "INSERT INTO audit_log(user_id,action,resource,created) VALUES(?,?,?,?)",
        (row["id"], "login", "session", now),
    )
    con.commit()
    con.close()
    user = dict(row)
    return {
        "access_token": issue_token(user),
        "refresh_token": issue_token(user, "refresh", 604800),
        "token_type": "bearer",
        "user": {
            "id": row["id"],
            "username": row["username"],
            "role": row["role"],
            "village_id": row["village_id"],
            "force_password_change": bool(row["force_password_change"]),
        },
    }


@app.post("/api/auth/refresh")
def refresh(authorization: str | None = Header(default=None)) -> dict[str, str]:
    try:
        claims = read_token((authorization or "")[7:], "refresh")
    except (ValueError, RuntimeError):
        raise HTTPException(401, "Refresh session expired. Sign in again.")
    con = db()
    row = con.execute("SELECT * FROM users WHERE id=? AND disabled=0", (claims["sub"],)).fetchone()
    con.close()
    if not row:
        raise HTTPException(401, "Account unavailable.")
    return {"access_token": issue_token(dict(row)), "token_type": "bearer"}


@app.get("/api/auth/me")
def me(user: dict[str, Any] = Depends(current_user)):
    return {k: user[k] for k in ("id", "username", "role", "village_id", "force_password_change")}


@app.post("/api/auth/change-password")
def change_password(body: PasswordChangePayload, user: dict[str, Any] = Depends(current_user)):
    con = db()
    row = con.execute("SELECT password_hash FROM users WHERE id=?", (user["id"],)).fetchone()
    if not row or not password_verify(body.current_password, row["password_hash"]):
        con.close()
        raise HTTPException(400, "Current password is incorrect.")
    if body.new_password == body.current_password:
        con.close()
        raise HTTPException(400, "Choose a different password.")
    con.execute(
        "UPDATE users SET password_hash=?,force_password_change=0,failed_logins=0,locked_until=0 WHERE id=?",
        (password_hash(body.new_password), user["id"]),
    )
    con.execute(
        "INSERT INTO audit_log(user_id,action,resource,created) VALUES(?,?,?,?)",
        (user["id"], "change", "account.password", time.time()),
    )
    con.commit()
    con.close()
    return {"changed": True}


def photo_uploads_enabled() -> bool:
    con = db()
    row = con.execute("SELECT value FROM settings WHERE key='photo_uploads' ").fetchone()
    con.close()
    return bool(row and json.loads(row["value"]) is True)


@app.put("/api/admin/settings/photo-uploads")
def set_photo_uploads(
    body: PhotoSettingPayload, user: dict[str, Any] = Depends(require_roles("superadmin"))
):
    con = db()
    row = con.execute("SELECT version FROM settings WHERE key='photo_uploads'").fetchone()
    version = (row["version"] + 1) if row else 1
    con.execute(
        "INSERT INTO settings(key,value,version,updated,user_id) VALUES('photo_uploads',?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,version=excluded.version,updated=excluded.updated,user_id=excluded.user_id",
        (json.dumps(body.enabled), version, time.time(), user["id"]),
    )
    con.execute(
        "INSERT INTO audit_log(user_id,action,resource,created) VALUES(?,?,?,?)",
        (
            user["id"],
            "change",
            "settings.photo_uploads privacy_review=" + body.privacy_review,
            time.time(),
        ),
    )
    con.commit()
    con.close()
    return {"enabled": body.enabled, "version": version}


@app.get("/api/admin/overview")
def admin_overview(user: dict[str, Any] = Depends(require_roles("admin", "superadmin"))):
    con = db()
    counts = {
        "anaemia": con.execute("SELECT COUNT(*) FROM screenings WHERE kind='anaemia'").fetchone()[
            0
        ],
        "oral": con.execute("SELECT COUNT(*) FROM screenings WHERE kind='oral'").fetchone()[0],
        "workers": con.execute(
            "SELECT COUNT(*) FROM users WHERE role='client' AND disabled=0"
        ).fetchone()[0],
    }
    categories = {
        r["triage"]: r["n"]
        for r in con.execute(
            "SELECT triage,COUNT(*) n FROM screenings WHERE kind='oral' GROUP BY triage"
        )
    }
    referrals = con.execute(
        "SELECT COUNT(*) total,SUM(status IN ('attended','confirmed outcome')) attended FROM referrals"
    ).fetchone()
    con.close()
    return {
        "demo_data": True,
        "counts": counts,
        "oral_categories": categories,
        "referral_completion_percent": round(100 * referrals["attended"] / referrals["total"], 1)
        if referrals["total"]
        else None,
        "note": "Synthetic/demo service indicators only; small counts are unreliable.",
    }


def features_from_rgb(rgb: np.ndarray) -> list[float]:
    """RGB uint8 ROI -> six normalized means and channel ratios. Matches training/features.py."""
    means = rgb.reshape(-1, 3).mean(axis=0) / 255.0
    r, g, b = means
    eps = 1e-6
    return [
        float(r),
        float(g),
        float(b),
        float(r / (g + eps)),
        float(r / (b + eps)),
        float(g / (b + eps)),
    ]


def quality_check(image: Image.Image) -> dict[str, Any]:
    gray = image.convert("L").resize((256, 256))
    arr = np.asarray(gray, dtype=np.float32)
    lap = (
        -4 * arr
        + np.roll(arr, 1, 0)
        + np.roll(arr, -1, 0)
        + np.roll(arr, 1, 1)
        + np.roll(arr, -1, 1)
    )
    sharp = float(lap.var()) >= 18
    brightness = float(arr.mean())
    light = 45 <= brightness <= 220
    rgb = np.asarray(image.convert("RGB").resize((128, 128)), dtype=np.uint8)
    glare = float(np.mean(np.all(rgb > 245, axis=2))) > 0.08
    # Coarse visual proxy only; cannot verify anatomy or camera framing.
    red = float(rgb[..., 0].mean())
    tissue = red > float(rgb[..., 1].mean()) * 0.92 and red > float(rgb[..., 2].mean()) * 0.92
    checks = {"sharp": sharp, "light": light, "glare": not glare, "tissue": tissue}
    tips = []
    if not sharp:
        tips.append("Hold the phone steady and tap to focus.")
    if not light:
        tips.append("Move to soft, even daylight; avoid shadows.")
    if glare:
        tips.append("Tilt away from direct light to remove glare.")
    if not tissue:
        tips.append("Frame the inner lower eyelid; this image may not show the target tissue.")
    return {
        "checks": checks,
        "passed": all(checks.values()),
        "tips": tips,
        "sharpness": round(float(lap.var()), 1),
        "brightness": round(brightness, 1),
        "glare_fraction": round(float(np.mean(np.all(rgb > 245, axis=2))), 3),
    }


def load_model() -> dict[str, Any] | None:
    try:
        model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
        if (
            model.get("clinically_reviewed") is True
            and len(str(model.get("clinical_review_note", "")).strip()) >= 20
            and len(model.get("coefficients", [])) == 6
            and len(model.get("feature_names", [])) == 6
        ):
            return model
    except (OSError, json.JSONDecodeError):
        pass
    return None


def who_band(hb: float, group: str) -> str:
    cuts = GROUPS[group]
    if hb < cuts["severe"]:
        return "Severe"
    if hb < cuts["moderate"]:
        return "Moderate"
    if hb < cuts["anaemia"]:
        return "Mild"
    return "No anaemia by listed threshold"


def zone_for(hb: float, pad: float, cutoff: float, danger: bool) -> str:
    if danger or hb + pad < cutoff:
        return "red"
    if hb - pad > cutoff:
        return "green"
    return "amber"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "trained" if load_model() else "heuristic demo (NOT trained)"}


@app.get("/api/groups")
def groups() -> dict[str, Any]:
    return {"groups": GROUPS, "note": "Verify against latest WHO guidance before clinical use."}


@app.post("/api/quality")
async def quality(
    image: UploadFile = File(...),
    user: dict[str, Any] = Depends(require_roles("client", "admin", "superadmin")),
) -> dict[str, Any]:
    if not photo_uploads_enabled():
        raise HTTPException(
            403,
            "Photo uploads are disabled by default. Ask a superadmin to complete a documented privacy review first.",
        )
    try:
        raw = await image.read()
        if len(raw) > 12_000_000:
            raise HTTPException(413, "Image must be smaller than 12 MB.")
        im = Image.open(__import__("io").BytesIO(raw))
        im.verify()
        im = Image.open(__import__("io").BytesIO(raw))
        return quality_check(im)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(400, f"Could not read image: {exc}") from exc


@app.post("/api/screen")
async def screen(
    image: UploadFile = File(...),
    group: str = Form(...),
    symptoms: str = Form("[]"),
    village: str = Form("Unspecified"),
    consent: bool = Form(...),
    user: dict[str, Any] = Depends(require_roles("client")),
) -> dict[str, Any]:
    if not consent:
        raise HTTPException(400, "Consent is required.")
    if not photo_uploads_enabled():
        raise HTTPException(
            403,
            "Photo uploads are disabled by default. Ask a superadmin to complete a documented privacy review first.",
        )
    if user.get("village_id") != village:
        raise HTTPException(403, "This worker is not assigned to that village.")
    if group not in GROUPS:
        raise HTTPException(400, "Unknown patient group.")
    try:
        symptom_list = json.loads(symptoms)
    except json.JSONDecodeError:
        raise HTTPException(400, "Symptoms must be a JSON list.")
    raw = await image.read()
    if len(raw) > 12_000_000:
        raise HTTPException(413, "Image must be smaller than 12 MB.")
    try:
        import io

        im = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, "Invalid image.") from exc
    q = quality_check(im)
    if not q["passed"]:
        raise HTTPException(
            422, detail={"message": "Retake the photo before screening.", "quality": q}
        )
    x0, y0, w, h = ROI
    crop = im.crop(
        (
            int(im.width * x0),
            int(im.height * y0),
            int(im.width * (x0 + w)),
            int(im.height * (y0 + h)),
        )
    ).resize((80, 60))
    f = features_from_rgb(np.asarray(crop))
    model = load_model()
    if model:
        hb = float(
            np.dot(np.asarray(model["coefficients"], dtype=float), f)
            + float(model.get("intercept", 0))
        )
        pad = max(0.5, float(model.get("interval_half_width", 1.0)))
        version = str(model.get("version", "trained-unknown"))
        model_name = str(model.get("name", "Ridge colour model"))
    else:
        # Deliberately broad, illustrative value; never present as trained or clinically meaningful.
        hb = float(np.clip(10.5 + (f[0] - f[1]) * 3.5, 6, 15))
        pad = 2.0
        version = "demo-heuristic-v0"
        model_name = "Heuristic demo (NOT trained)"
    symptom_weights = {
        "tiredness": 0.15,
        "breathless_light_activity": 0.3,
        "pale_palms_nails": 0.4,
        "not_taking_ifa": 0.1,
    }
    reduction = sum(symptom_weights.get(s, 0) for s in symptom_list)
    hb = float(np.clip(hb - reduction, 3, 20))
    low, high = max(3, hb - pad), min(20, hb + pad)
    danger = bool(DANGER.intersection(symptom_list))
    cutoff = GROUPS[group]["anaemia"]
    zone = zone_for(hb, pad, cutoff, danger)
    note = (
        "Urgent clinical assessment: danger sign reported."
        if danger
        else (
            "Refer for confirmatory Hb test and clinician assessment."
            if zone == "red"
            else "Confirm with Hb strip or laboratory test if symptoms persist."
        )
    )
    con = db()
    cur = con.execute(
        "INSERT INTO logs(created,village,group_key,zone,hb,low,high,model_version,symptoms) VALUES(?,?,?,?,?,?,?,?,?)",
        (time.time(), village, group, zone, hb, low, high, version, json.dumps(symptom_list)),
    )
    log_id = cur.lastrowid
    con.commit()
    con.close()
    return {
        "id": log_id,
        "zone": zone,
        "hb": round(hb, 1),
        "interval": [round(low, 1), round(high, 1)],
        "cutoff": cutoff,
        "severity": who_band(hb, group),
        "referral_note": note,
        "model_name": model_name,
        "model_version": version,
        "quality": q,
        "explanation": "Amber means the uncertainty range overlaps the group threshold; retake or use an Hb strip test."
        if zone == "amber"
        else "This estimate is a screening aid and needs confirmation.",
        "danger_sign": danger,
    }


@app.get("/api/model")
def model_info() -> dict[str, Any]:
    model = load_model()
    if not model:
        return {
            "trained": False,
            "name": "Heuristic demo (NOT trained)",
            "version": "demo-heuristic-v0",
            "dataset": "None",
            "metrics": {},
            "fairness": [],
        }
    return {"trained": True, **model}


class ModelPayload(BaseModel):
    coefficients: list[float] = Field(min_length=6, max_length=6)
    feature_names: list[str] = Field(min_length=6, max_length=6)
    intercept: float
    version: str
    clinically_reviewed: bool = False
    clinical_review_note: str = Field(default="", max_length=2000)


@app.put("/api/model")
def put_model(
    payload: ModelPayload, user: dict[str, Any] = Depends(require_roles("superadmin"))
) -> dict[str, Any]:
    if payload.feature_names != FEATURES:
        raise HTTPException(400, "Feature names/order do not match this backend.")
    if not payload.clinically_reviewed or len(payload.clinical_review_note.strip()) < 20:
        raise HTTPException(
            400, "A documented clinical review confirmation is required before loading a model."
        )
    data = payload.model_dump()
    data["reviewed_by"] = user["username"]
    data["reviewed_at"] = time.time()
    MODEL_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"loaded": True, "version": payload.version}


@app.get("/api/logs")
def logs() -> dict[str, Any]:
    con = db()
    rows = [dict(r) for r in con.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 300")]
    con.close()
    for row in rows:
        row["symptoms"] = json.loads(row["symptoms"])
    return {"logs": rows}


@app.post("/api/logs/{log_id}/lab")
def add_lab(log_id: int, body: dict[str, float]) -> dict[str, Any]:
    value = body.get("lab_hb")
    if value is None or not 2 <= value <= 25:
        raise HTTPException(400, "lab_hb must be between 2 and 25 g/dL")
    con = db()
    cur = con.execute("UPDATE logs SET lab_hb=? WHERE id=?", (value, log_id))
    con.commit()
    con.close()
    if not cur.rowcount:
        raise HTTPException(404, "Log entry not found")
    return {"saved": True}


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    con = db()
    rows = [
        dict(r)
        for r in con.execute("SELECT village,zone,COUNT(*) n FROM logs GROUP BY village,zone")
    ]
    labs = [tuple(r) for r in con.execute("SELECT hb,lab_hb FROM logs WHERE lab_hb IS NOT NULL")]
    con.close()
    mae = float(np.mean([abs(a - b) for a, b in labs])) if labs else None
    return {
        "villages": rows,
        "local_mae": round(mae, 2) if mae is not None else None,
        "lab_count": len(labs),
        "drift": bool(mae is not None and mae > 1.5),
        "note": "Local monitoring only; small samples are not validation.",
    }


@app.post("/api/oral/screen")
def oral_screen(
    body: dict[str, Any] = Body(...), user: dict[str, Any] = Depends(require_roles("client"))
) -> dict[str, Any]:
    if not body.get("consent"):
        raise HTTPException(400, "Consent is required.")
    if body.get("village", user.get("village_id")) != user.get("village_id"):
        raise HTTPException(403, "This worker is not assigned to that village.")
    result = triage_oral(body)
    record = {
        "created": time.time(),
        "village": body.get("village", "Unspecified"),
        "age_band": body.get("ageBand"),
        "sex": body.get("sex"),
        "habits": body.get("habits", []),
        "findings": body.get("findings", []),
        "symptoms": body.get("symptoms", []),
        "mouth_opening": json.dumps(
            {
                "category": body.get("mouthOpening"),
                "value": body.get("mouthValue"),
                "unit": body.get("mouthUnit"),
            }
        ),
        "neck_node": bool(body.get("neckNode")),
        "triage": result["category"],
        "rules": result["rules"],
    }
    con = db()
    cur = con.execute(
        "INSERT INTO oral_logs(created,village,age_band,sex,habits,findings,symptoms,mouth_opening,neck_node,triage,rules,referral_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            record["created"],
            record["village"],
            record["age_band"],
            record["sex"],
            json.dumps(record["habits"]),
            json.dumps(record["findings"]),
            json.dumps(record["symptoms"]),
            record["mouth_opening"],
            int(record["neck_node"]),
            record["triage"],
            json.dumps(record["rules"]),
            "",
        ),
    )
    record["id"] = cur.lastrowid
    con.commit()
    con.close()
    return {**result, "id": record["id"], "created": record["created"]}


@app.get("/api/oral/logs")
def oral_logs() -> dict[str, Any]:
    con = db()
    rows = [dict(r) for r in con.execute("SELECT * FROM oral_logs ORDER BY id DESC LIMIT 500")]
    con.close()
    for row in rows:
        for key in ("habits", "findings", "symptoms", "rules"):
            row[key] = json.loads(row[key] or "[]")
        row["mouth_opening"] = json.loads(row["mouth_opening"] or "{}")
    return {"logs": rows}


@app.post("/api/oral/logs/{log_id}/outcome")
def oral_outcome(log_id: int, body: dict[str, str] = Body(...)) -> dict[str, bool]:
    outcome = body.get("outcome")
    status = body.get("referral_status")
    if outcome not in {None, "", "normal", "OPMD confirmed", "dysplasia", "malignancy", "other"}:
        raise HTTPException(400, "Invalid specialist outcome.")
    if status not in {"", "referred", "attended", "not attended"}:
        raise HTTPException(400, "Invalid referral status.")
    con = db()
    cur = con.execute(
        "UPDATE oral_logs SET outcome=?, referral_status=? WHERE id=?", (outcome, status, log_id)
    )
    con.commit()
    con.close()
    if not cur.rowcount:
        raise HTTPException(404, "Oral screening record not found")
    return {"saved": True}


@app.get("/api/oral/stats")
def oral_stats() -> dict[str, Any]:
    con = db()
    records = [
        dict(r) for r in con.execute("SELECT village,triage,habits,referral_status FROM oral_logs")
    ]
    con.close()
    summary: dict[str, Any] = {}
    for row in records:
        village = row["village"] or "Unspecified"
        item = summary.setdefault(
            village,
            {
                "village": village,
                "screened": 0,
                "habit_count": 0,
                "triage": {"urgent": 0, "refer": 0, "high_risk": 0, "routine": 0},
                "referred": 0,
                "attended": 0,
            },
        )
        item["screened"] += 1
        item["habit_count"] += bool(
            [h for h in json.loads(row["habits"] or "[]") if h.get("active", True)]
        )
        item["triage"][row["triage"]] = item["triage"].get(row["triage"], 0) + 1
        item["referred"] += row["referral_status"] in {"referred", "attended", "not attended"}
        item["attended"] += row["referral_status"] == "attended"
    villages = list(summary.values())
    for item in villages:
        item["habit_percent"] = (
            round(100 * item["habit_count"] / item["screened"], 1) if item["screened"] else 0
        )
        item["referral_completion_rate"] = (
            round(100 * item["attended"] / item["referred"], 1) if item["referred"] else None
        )
        item["referred_attended_gap"] = max(0, item["referred"] - item["attended"])
    return {
        "villages": villages,
        "screened": len(records),
        "note": "Small counts are unreliable; service monitoring only, not prevalence.",
    }
