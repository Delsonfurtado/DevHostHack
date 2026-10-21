"""Create synthetic local demo accounts. Run only for development."""

import os
import json
import time
from app.main import db
from app.security import password_hash

if os.getenv("APP_ENV", "development") != "development":
    raise SystemExit("Refusing to seed demo credentials outside APP_ENV=development")

con = db()
for username, role, village in (
    ("demo.worker", "client", "demo-village-1"),
    ("demo.admin", "admin", None),
    ("demo.superadmin", "superadmin", None),
):
    con.execute(
        "INSERT OR IGNORE INTO users(username,password_hash,role,village_id,force_password_change) VALUES(?,?,?,?,1)",
        (username, password_hash("DemoOnly-ChangeMe-2026!"), role, village),
    )
worker_id = con.execute("SELECT id FROM users WHERE username='demo.worker'").fetchone()[0]
admin_id = con.execute("SELECT id FROM users WHERE username='demo.admin'").fetchone()[0]
for village, phc in (("demo-village-1", "Demo PHC North"), ("demo-village-2", "Demo PHC South")):
    con.execute(
        "INSERT OR IGNORE INTO villages(id,name,phc,demo,created) VALUES(?,?,?,1,?)",
        (village, village.replace("-", " ").title(), phc, time.time()),
    )
for village, name, kind in (
    ("demo-village-1", "Demo Primary Health Centre North", "PHC"),
    ("demo-village-2", "Demo Referral Hospital South", "hospital"),
):
    con.execute(
        "INSERT OR IGNORE INTO facilities(name,village_id,type,contact,directions_url,demo,created) VALUES(?,?,?,'DEMO ONLY','',1,?)",
        (name, village, kind, time.time()),
    )
for idx, (village, kind, triage) in enumerate(
    (
        ("demo-village-1", "anaemia", "amber"),
        ("demo-village-1", "oral", "routine"),
        ("demo-village-2", "anaemia", "red"),
    ),
    1,
):
    patient = f"demo-patient-{idx}"
    con.execute(
        "INSERT OR IGNORE INTO patients(id,village_id,age_band,sex,created) VALUES(?,?,?,?,?)",
        (patient, village, "adult", "not recorded", time.time()),
    )
    con.execute(
        "INSERT OR IGNORE INTO screenings(client_key,patient_id,village_id,kind,consent,payload,triage,created,user_id,demo) VALUES(?,?,?,?,1,?,?,?, ?,1)",
        (
            f"demo-seed-{idx}",
            patient,
            village,
            kind,
            json.dumps({"demo_data": True, "note": "Synthetic example only"}),
            triage,
            time.time(),
            worker_id,
        ),
    )
red_id = con.execute("SELECT id FROM screenings WHERE client_key='demo-seed-3'").fetchone()[0]
if not con.execute("SELECT 1 FROM referrals WHERE screening_id=?", (red_id,)).fetchone():
    con.execute(
        "INSERT INTO referrals(screening_id,status,facility,created,updated) VALUES(?,'issued','Demo Referral Hospital South',?,?)",
        (red_id, time.time(), time.time()),
    )
if not con.execute("SELECT 1 FROM follow_ups WHERE patient_id='demo-patient-1'").fetchone():
    con.execute(
        "INSERT INTO follow_ups(patient_id,screening_id,due_date,note,created) VALUES('demo-patient-1',NULL,?,'Synthetic demo reminder',?)",
        (time.strftime("%Y-%m-%d"), time.time()),
    )
if not con.execute("SELECT 1 FROM announcements WHERE title='Demo campaign reminder'").fetchone():
    con.execute(
        "INSERT INTO announcements(title,body,translations,village_id,created,user_id) VALUES(?,?,?,?,?,?)",
        (
            "Demo campaign reminder",
            "Synthetic announcement for local development. Confirm all dates and protocols with the PHC team.",
            json.dumps(
                {
                    "en": {
                        "title": "Demo campaign reminder",
                        "body": "Synthetic development data only.",
                    }
                }
            ),
            "demo-village-1",
            time.time(),
            admin_id,
        ),
    )
con.commit()
con.close()
print(
    "DEMO DATA only — demo.worker / demo.admin / demo.superadmin; password: DemoOnly-ChangeMe-2026! Change before use."
)
