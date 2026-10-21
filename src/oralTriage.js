// Demonstrative triage only. Thresholds/rules are to be verified against current NP-NCD / national oral cancer screening guidance and local protocols.
// Quitline 1800-11-2356 was requested as a counselling reference; verify the current number before any future UI use.
export function triageOral(input) {
  if (!input?.consent) return { error: 'consent_required', category: null, rules: [], exposure: 0 };
  const habits = (input.habits || []).filter((h) => h.active);
  const findings = input.findings || [];
  const symptoms = new Set(input.symptoms || []);
  const rules = [];
  const add = (code, text) => {
    if (!rules.some((r) => r.code === code)) rules.push({ code, text });
  };
  for (const f of findings) {
    if (f.type === 'ulcer' && (f.over14Days || Number(f.ulcerDays) > 14))
      add('ulcer_over_2_weeks', 'Ulcer present for more than 2 weeks');
    if (['lump', 'growth'].includes(f.type)) add('lump_or_growth', 'Lump or growth found');
    if (['red', 'mixed'].includes(f.type))
      add(
        f.type === 'red' ? 'red_patch' : 'mixed_patch',
        f.type === 'red' ? 'Red patch found' : 'Mixed red-white patch found',
      );
    if (f.size === 'gt2') add('lesion_over_2cm', 'Lesion larger than 2 cm');
    if (f.type === 'node') add('firm_neck_node', 'Firm neck node reported');
    if (f.type === 'white' && (f.persistent || f.nonWipeable))
      add('persistent_white_patch', 'White patch persists or does not rub off');
    if (f.type === 'fibrous' || input.mouthOpening === 'reduced')
      add('possible_fibrosis', 'Fibrous bands or reduced mouth opening');
    if (
      (f.habitPlacement || habits.some((h) => h.placementSite && h.placementSite === f.site)) &&
      habits.length
    )
      add('lesion_at_habit_site', 'Finding at a habit-placement site');
  }
  if (input.neckNode) add('firm_neck_node', 'Firm neck node reported');
  for (const s of ['bleeding', 'numbness', 'swallowing'])
    if (symptoms.has(s))
      add(`symptom_${s}`, `Unexplained ${s === 'swallowing' ? 'swallowing difficulty' : s}`);
  if (symptoms.has('lump')) add('lump_or_growth', 'Patient reports a lump in mouth or neck');
  if (symptoms.has('red_patch')) add('red_patch', 'Patient reports a persistent red patch');
  if (symptoms.has('white_patch'))
    add('persistent_white_patch', 'Patient reports a persistent white patch');
  if (symptoms.has('opening')) add('possible_fibrosis', 'Patient reports difficulty opening mouth');
  if (symptoms.has('voice')) add('symptom_voice', 'Persistent voice change or hoarseness');
  if (symptoms.has('teeth')) add('symptom_teeth', 'Unexplained loosening of teeth');
  if (
    findings.length &&
    !rules.some((r) =>
      [
        'ulcer_over_2_weeks',
        'lump_or_growth',
        'red_patch',
        'mixed_patch',
        'lesion_over_2cm',
        'firm_neck_node',
        'persistent_white_patch',
        'possible_fibrosis',
        'lesion_at_habit_site',
      ].includes(r.code),
    )
  )
    add('other_visible_finding', 'Other visible finding needs clinical review');
  const urgentCodes = new Set([
    'ulcer_over_2_weeks',
    'lump_or_growth',
    'red_patch',
    'mixed_patch',
    'lesion_over_2cm',
    'firm_neck_node',
    'symptom_bleeding',
    'symptom_numbness',
    'symptom_swallowing',
  ]);
  if (symptoms.has('ulcer_over_2_weeks'))
    add('symptom_ulcer_over_2_weeks', 'Patient reports a non-healing ulcer for more than 2 weeks');
  if (findings.some((f) => f.type === 'white' && (f.persistent || f.nonWipeable))) {
  }
  if (symptoms.has('burning') && habits.length)
    add('burning_with_habit', 'Burning with spicy food and habit history');
  const urgent = rules.some((r) => urgentCodes.has(r.code));
  const refer = rules.some((r) =>
    [
      'persistent_white_patch',
      'possible_fibrosis',
      'lesion_at_habit_site',
      'burning_with_habit',
      'symptom_voice',
      'symptom_teeth',
      'other_visible_finding',
    ].includes(r.code),
  );
  const exposure = habits.reduce(
    (sum, h) => sum + (Number(h.timesPerDay) || 0) * (Number(h.years) || 0),
    0,
  );
  let category, followup;
  if (urgent) {
    category = 'urgent';
    followup = 'Prompt clinical evaluation by a doctor, dentist, or oral surgeon.';
  } else if (refer) {
    category = 'refer';
    followup = 'Arrange dental or medical evaluation.';
  } else if (habits.length) {
    category = 'high_risk';
    followup = 'Counselling and re-screening every 3–6 months.';
  } else {
    category = 'routine';
    followup = 'Routine care; re-screen annually if habit history develops.';
  }
  if (!rules.length)
    add(
      habits.length ? 'habit_no_visible_lesion' : 'no_suspicious_finding',
      habits.length
        ? 'Habit history without a suspicious finding'
        : 'No suspicious finding recorded',
    );
  return {
    category,
    followup,
    rules,
    exposure,
    exposureLabel: 'habit exposure indicator (times/day × years; counselling only)',
    absenceWarning: 'Absence of findings does not rule out disease.',
  };
}
