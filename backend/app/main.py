"""A small, auditable anaemia screening decision-support demo."""
from __future__ import annotations

import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageStat
from pydantic import BaseModel, Field

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
    "woman_nonpregnant": {"label": "Non-pregnant woman", "anaemia": 12, "moderate": 11, "severe": 8},
    "woman_pregnant": {"label": "Pregnant woman", "anaemia": 11, "moderate": 10, "severe": 7},
    "man": {"label": "Man", "anaemia": 13, "moderate": 11, "severe": 8},
}
DANGER = {"breathless_at_rest", "chest_pain", "fainting"}
app = FastAPI(title="Niramaya screening aid", version="0.1.0", description="Decision support only; not a diagnostic device.")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, created REAL, village TEXT, group_key TEXT, zone TEXT, hb REAL, low REAL, high REAL, model_version TEXT, symptoms TEXT, lab_hb REAL)")
    return con


def features_from_rgb(rgb: np.ndarray) -> list[float]:
    """RGB uint8 ROI -> six normalized means and channel ratios. Matches training/features.py."""
    means = rgb.reshape(-1, 3).mean(axis=0) / 255.0
    r, g, b = means
    eps = 1e-6
    return [float(r), float(g), float(b), float(r / (g + eps)), float(r / (b + eps)), float(g / (b + eps))]


def quality_check(image: Image.Image) -> dict[str, Any]:
    gray = image.convert("L").resize((256, 256))
    arr = np.asarray(gray, dtype=np.float32)
    lap = -4 * arr + np.roll(arr, 1, 0) + np.roll(arr, -1, 0) + np.roll(arr, 1, 1) + np.roll(arr, -1, 1)
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
    if not sharp: tips.append("Hold the phone steady and tap to focus.")
    if not light: tips.append("Move to soft, even daylight; avoid shadows.")
    if glare: tips.append("Tilt away from direct light to remove glare.")
    if not tissue: tips.append("Frame the inner lower eyelid; this image may not show the target tissue.")
    return {"checks": checks, "passed": all(checks.values()), "tips": tips, "sharpness": round(float(lap.var()), 1), "brightness": round(brightness, 1), "glare_fraction": round(float(np.mean(np.all(rgb > 245, axis=2))), 3)}


def load_model() -> dict[str, Any] | None:
    try:
        model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
        if len(model.get("coefficients", [])) == 6 and len(model.get("feature_names", [])) == 6:
            return model
    except (OSError, json.JSONDecodeError):
        pass
    return None


def who_band(hb: float, group: str) -> str:
    cuts = GROUPS[group]
    if hb < cuts["severe"]: return "Severe"
    if hb < cuts["moderate"]: return "Moderate"
    if hb < cuts["anaemia"]: return "Mild"
    return "No anaemia by listed threshold"


def zone_for(hb: float, pad: float, cutoff: float, danger: bool) -> str:
    if danger or hb + pad < cutoff: return "red"
    if hb - pad > cutoff: return "green"
    return "amber"


@app.get("/api/health")
def health() -> dict[str, str]: return {"status": "ok", "mode": "trained" if load_model() else "heuristic demo (NOT trained)"}


@app.get("/api/groups")
def groups() -> dict[str, Any]: return {"groups": GROUPS, "note": "Verify against latest WHO guidance before clinical use."}


@app.post("/api/quality")
async def quality(image: UploadFile = File(...)) -> dict[str, Any]:
    try:
        raw = await image.read()
        if len(raw) > 12_000_000: raise HTTPException(413, "Image must be smaller than 12 MB.")
        im = Image.open(__import__("io").BytesIO(raw)); im.verify()
        im = Image.open(__import__("io").BytesIO(raw))
        return quality_check(im)
    except HTTPException: raise
    except Exception as exc: raise HTTPException(400, f"Could not read image: {exc}") from exc


@app.post("/api/screen")
async def screen(image: UploadFile = File(...), group: str = Form(...), symptoms: str = Form("[]"), village: str = Form("Unspecified"), consent: bool = Form(...)) -> dict[str, Any]:
    if not consent: raise HTTPException(400, "Consent is required.")
    if group not in GROUPS: raise HTTPException(400, "Unknown patient group.")
    try: symptom_list = json.loads(symptoms)
    except json.JSONDecodeError: raise HTTPException(400, "Symptoms must be a JSON list.")
    raw = await image.read()
    if len(raw) > 12_000_000: raise HTTPException(413, "Image must be smaller than 12 MB.")
    try:
        import io
        im = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc: raise HTTPException(400, "Invalid image.") from exc
    q = quality_check(im)
    if not q["passed"]: raise HTTPException(422, detail={"message": "Retake the photo before screening.", "quality": q})
    x0, y0, w, h = ROI
    crop = im.crop((int(im.width*x0), int(im.height*y0), int(im.width*(x0+w)), int(im.height*(y0+h)))).resize((80, 60))
    f = features_from_rgb(np.asarray(crop))
    model = load_model()
    if model:
        hb = float(np.dot(np.asarray(model["coefficients"], dtype=float), f) + float(model.get("intercept", 0)))
        pad = max(0.5, float(model.get("interval_half_width", 1.0)))
        version = str(model.get("version", "trained-unknown")); model_name = str(model.get("name", "Ridge colour model"))
    else:
        # Deliberately broad, illustrative value; never present as trained or clinically meaningful.
        hb = float(np.clip(10.5 + (f[0]-f[1])*3.5, 6, 15)); pad = 2.0
        version = "demo-heuristic-v0"; model_name = "Heuristic demo (NOT trained)"
    symptom_weights = {"tiredness": .15, "breathless_light_activity": .3, "pale_palms_nails": .4, "not_taking_ifa": .1}
    reduction = sum(symptom_weights.get(s, 0) for s in symptom_list)
    hb = float(np.clip(hb - reduction, 3, 20))
    low, high = max(3, hb-pad), min(20, hb+pad)
    danger = bool(DANGER.intersection(symptom_list))
    cutoff = GROUPS[group]["anaemia"]
    zone = zone_for(hb, pad, cutoff, danger)
    note = "Urgent clinical assessment: danger sign reported." if danger else ("Refer for confirmatory Hb test and clinician assessment." if zone == "red" else "Confirm with Hb strip or laboratory test if symptoms persist.")
    con = db(); cur = con.execute("INSERT INTO logs(created,village,group_key,zone,hb,low,high,model_version,symptoms) VALUES(?,?,?,?,?,?,?,?,?)", (time.time(), village, group, zone, hb, low, high, version, json.dumps(symptom_list))); log_id = cur.lastrowid; con.commit(); con.close()
    return {"id": log_id, "zone": zone, "hb": round(hb,1), "interval": [round(low,1),round(high,1)], "cutoff": cutoff, "severity": who_band(hb,group), "referral_note": note, "model_name": model_name, "model_version": version, "quality": q, "explanation": "Amber means the uncertainty range overlaps the group threshold; retake or use an Hb strip test." if zone == "amber" else "This estimate is a screening aid and needs confirmation.", "danger_sign": danger}


@app.get("/api/model")
def model_info() -> dict[str, Any]:
    model = load_model()
    if not model: return {"trained": False, "name": "Heuristic demo (NOT trained)", "version": "demo-heuristic-v0", "dataset": "None", "metrics": {}, "fairness": []}
    return {"trained": True, **model}


class ModelPayload(BaseModel):
    coefficients: list[float] = Field(min_length=6, max_length=6)
    feature_names: list[str] = Field(min_length=6, max_length=6)
    intercept: float
    version: str


@app.put("/api/model")
def put_model(payload: ModelPayload) -> dict[str, Any]:
    if payload.feature_names != FEATURES: raise HTTPException(400, "Feature names/order do not match this backend.")
    MODEL_PATH.write_text(json.dumps(payload.model_dump(), indent=2), encoding="utf-8")
    return {"loaded": True, "version": payload.version}


@app.get("/api/logs")
def logs() -> dict[str, Any]:
    con=db(); rows=[dict(r) for r in con.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 300")]; con.close()
    for row in rows: row["symptoms"]=json.loads(row["symptoms"])
    return {"logs": rows}


@app.post("/api/logs/{log_id}/lab")
def add_lab(log_id: int, body: dict[str, float]) -> dict[str, Any]:
    value=body.get("lab_hb")
    if value is None or not 2 <= value <= 25: raise HTTPException(400,"lab_hb must be between 2 and 25 g/dL")
    con=db(); cur=con.execute("UPDATE logs SET lab_hb=? WHERE id=?",(value,log_id)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,"Log entry not found")
    return {"saved": True}


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    con=db(); rows=[dict(r) for r in con.execute("SELECT village,zone,COUNT(*) n FROM logs GROUP BY village,zone")]; labs=[tuple(r) for r in con.execute("SELECT hb,lab_hb FROM logs WHERE lab_hb IS NOT NULL")]; con.close()
    mae=float(np.mean([abs(a-b) for a,b in labs])) if labs else None
    return {"villages": rows,"local_mae":round(mae,2) if mae is not None else None,"lab_count":len(labs),"drift": bool(mae is not None and mae>1.5),"note":"Local monitoring only; small samples are not validation."}
