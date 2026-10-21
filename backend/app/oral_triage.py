"""Rule-based oral screening triage prototype; criteria require clinical verification."""
# Rules and thresholds are to be verified against current NP-NCD / national oral cancer screening guidance and local protocols.

URGENT = {
    "ulcer_over_2_weeks",
    "lump_or_growth",
    "red_patch",
    "mixed_patch",
    "lesion_over_2cm",
    "firm_neck_node",
    "symptom_bleeding",
    "symptom_numbness",
    "symptom_swallowing",
}


def triage_oral(data: dict) -> dict:
    if not data.get("consent"):
        return {"error": "consent_required", "category": None, "rules": [], "exposure": 0}
    habits = [h for h in data.get("habits", []) if h.get("active")]
    findings = data.get("findings", [])
    symptoms = set(data.get("symptoms", []))
    rules = []

    def add(code, text):
        if not any(r["code"] == code for r in rules):
            rules.append({"code": code, "text": text})

    for f in findings:
        if f.get("type") == "ulcer" and (
            f.get("over14Days") or float(f.get("ulcerDays", 0) or 0) > 14
        ):
            add("ulcer_over_2_weeks", "Ulcer present for more than 2 weeks")
        if f.get("type") in {"lump", "growth"}:
            add("lump_or_growth", "Lump or growth found")
        if f.get("type") in {"red", "mixed"}:
            add(
                "red_patch" if f["type"] == "red" else "mixed_patch",
                "Red patch found" if f["type"] == "red" else "Mixed red-white patch found",
            )
        if f.get("size") == "gt2":
            add("lesion_over_2cm", "Lesion larger than 2 cm")
        if f.get("type") == "node":
            add("firm_neck_node", "Firm neck node reported")
        if f.get("type") == "white" and (f.get("persistent") or f.get("nonWipeable")):
            add("persistent_white_patch", "White patch persists or does not rub off")
        if f.get("type") == "fibrous" or data.get("mouthOpening") == "reduced":
            add("possible_fibrosis", "Fibrous bands or reduced mouth opening")
        if (
            f.get("habitPlacement")
            or any(
                h.get("placementSite") and h.get("placementSite") == f.get("site") for h in habits
            )
        ) and habits:
            add("lesion_at_habit_site", "Finding at a habit-placement site")
    if data.get("neckNode"):
        add("firm_neck_node", "Firm neck node reported")
    for symptom in ("bleeding", "numbness", "swallowing"):
        if symptom in symptoms:
            add(
                f"symptom_{symptom}",
                f"Unexplained {'swallowing difficulty' if symptom == 'swallowing' else symptom}",
            )
    if "lump" in symptoms:
        add("lump_or_growth", "Patient reports a lump in mouth or neck")
    if "red_patch" in symptoms:
        add("red_patch", "Patient reports a persistent red patch")
    if "white_patch" in symptoms:
        add("persistent_white_patch", "Patient reports a persistent white patch")
    if "opening" in symptoms:
        add("possible_fibrosis", "Patient reports difficulty opening mouth")
    if "voice" in symptoms:
        add("symptom_voice", "Persistent voice change or hoarseness")
    if "teeth" in symptoms:
        add("symptom_teeth", "Unexplained loosening of teeth")
    if findings and not any(
        r["code"]
        in {
            "ulcer_over_2_weeks",
            "lump_or_growth",
            "red_patch",
            "mixed_patch",
            "lesion_over_2cm",
            "firm_neck_node",
            "persistent_white_patch",
            "possible_fibrosis",
            "lesion_at_habit_site",
        }
        for r in rules
    ):
        add("other_visible_finding", "Other visible finding needs clinical review")
    if "ulcer_over_2_weeks" in symptoms:
        add(
            "symptom_ulcer_over_2_weeks",
            "Patient reports a non-healing ulcer for more than 2 weeks",
        )
    if "burning" in symptoms and habits:
        add("burning_with_habit", "Burning with spicy food and habit history")
    urgent = any(r["code"] in URGENT for r in rules)
    refer = any(
        r["code"]
        in {
            "persistent_white_patch",
            "possible_fibrosis",
            "lesion_at_habit_site",
            "burning_with_habit",
            "symptom_voice",
            "symptom_teeth",
            "other_visible_finding",
        }
        for r in rules
    )
    exposure = sum(
        (float(h.get("timesPerDay", 0) or 0) * float(h.get("years", 0) or 0)) for h in habits
    )
    if urgent:
        category, followup = (
            "urgent",
            "Prompt clinical evaluation by a doctor, dentist, or oral surgeon.",
        )
    elif refer:
        category, followup = "refer", "Arrange dental or medical evaluation."
    elif habits:
        category, followup = "high_risk", "Counselling and re-screening every 3–6 months."
    else:
        category, followup = (
            "routine",
            "Routine care; re-screen annually if habit history develops.",
        )
    if not rules:
        add(
            "habit_no_visible_lesion" if habits else "no_suspicious_finding",
            "Habit history without a suspicious finding"
            if habits
            else "No suspicious finding recorded",
        )
    return {
        "category": category,
        "followup": followup,
        "rules": rules,
        "exposure": exposure,
        "exposureLabel": "habit exposure indicator (times/day × years; counselling only)",
        "absenceWarning": "Absence of findings does not rule out disease.",
    }
