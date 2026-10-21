import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { triageOral } from './oralTriage.js';

const cases = JSON.parse(
  readFileSync(new URL('../shared/oral_triage_cases.json', import.meta.url)),
);
for (const c of cases)
  test(`shared triage: ${c.name}`, () => {
    const result = triageOral(c.input);
    assert.equal(result.category, c.category);
    assert.deepEqual(
      result.rules.map((r) => r.code),
      c.codes,
    );
  });
test('urgent findings override habits and lower urgency', () => {
  const r = triageOral({
    consent: true,
    habits: [{ active: true }],
    findings: [{ type: 'white', persistent: true }, { type: 'red' }],
  });
  assert.equal(r.category, 'urgent');
});
test('habit at matching site triggers referral', () => {
  const r = triageOral({
    consent: true,
    habits: [{ active: true, placementSite: 'left cheek' }],
    findings: [{ site: 'left cheek', type: 'other' }],
  });
  assert.equal(r.category, 'refer');
});
test('consent is required before triage can be recorded', () => {
  assert.equal(
    triageOral({ consent: false, findings: [{ type: 'red' }] }).error,
    'consent_required',
  );
});
