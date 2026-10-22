// Seed data: ~25 realistic patients across all stages
import type { Patient, Screening, CaseEvent } from '../types/models';

// Simple UUID polyfill using crypto.randomUUID
function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export const samplePatients: Patient[] = [
  { id: 'p1', name: 'Raju Nayak', age: 52, sex: 'male', village: 'Devanahalli', phone: '9876543210', consentGiven: true, createdAt: daysAgo(30), updatedAt: daysAgo(30) },
  { id: 'p2', name: 'Lakshmi Devi', age: 45, sex: 'female', village: 'Kolar', phone: '9845612345', consentGiven: true, createdAt: daysAgo(25), updatedAt: daysAgo(25) },
  { id: 'p3', name: 'Basavaraju K', age: 61, sex: 'male', village: 'Tumkur', phone: '9741238901', consentGiven: true, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: 'p4', name: 'Savitha Reddy', age: 38, sex: 'female', village: 'Mysuru', phone: '8123456789', consentGiven: true, createdAt: daysAgo(18), updatedAt: daysAgo(18) },
  { id: 'p5', name: 'Manjunath B', age: 47, sex: 'male', village: 'Dharwad', phone: '7654321098', consentGiven: true, createdAt: daysAgo(15), updatedAt: daysAgo(15) },
  { id: 'p6', name: 'Kamala Bai', age: 55, sex: 'female', village: 'Chitradurga', phone: '9900112233', consentGiven: true, createdAt: daysAgo(14), updatedAt: daysAgo(14) },
  { id: 'p7', name: 'Venkatesh Gowda', age: 63, sex: 'male', village: 'Hassan', phone: '9123456780', consentGiven: true, createdAt: daysAgo(12), updatedAt: daysAgo(12) },
  { id: 'p8', name: 'Meena Patil', age: 42, sex: 'female', village: 'Belagavi', phone: '8765432109', consentGiven: true, createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: 'p9', name: 'Suresh Kumar', age: 58, sex: 'male', village: 'Shivamogga', phone: '9988776655', consentGiven: true, createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  { id: 'p10', name: 'Geetha Naik', age: 33, sex: 'female', village: 'Udupi', phone: '9000123456', consentGiven: true, createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: 'p11', name: 'Prakash Hebbar', age: 50, sex: 'male', village: 'Mangaluru', phone: '9876001234', consentGiven: true, createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  { id: 'p12', name: 'Ratna Bai', age: 67, sex: 'female', village: 'Bidar', phone: '7788990011', consentGiven: true, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 'p13', name: 'Srinivas Rao', age: 44, sex: 'male', village: 'Raichur', phone: '8899001122', consentGiven: true, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: 'p14', name: 'Pushpa Kumari', age: 39, sex: 'female', village: 'Ballari', phone: '9765432100', consentGiven: true, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 'p15', name: 'Nagaraj M', age: 56, sex: 'male', village: 'Gadag', phone: '9654321000', consentGiven: true, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 'p16', name: 'Ambika Devi', age: 48, sex: 'female', village: 'Davangere', phone: '8800990011', consentGiven: true, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 'p17', name: 'Rajesh Bhat', age: 35, sex: 'male', village: 'Sirsi', phone: '9988112233', consentGiven: true, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 'p18', name: 'Sumitra Gowda', age: 72, sex: 'female', village: 'Mandya', phone: '8877665544', consentGiven: true, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 'p19', name: 'Krishnamurthy S', age: 60, sex: 'male', village: 'Channapatna', phone: '9900001111', consentGiven: true, createdAt: daysAgo(0), updatedAt: daysAgo(0) },
  { id: 'p20', name: 'Indira Bai', age: 41, sex: 'female', village: 'Kalaburagi', phone: '7711223344', consentGiven: true, createdAt: daysAgo(0), updatedAt: daysAgo(0) },
  { id: 'p21', name: 'Mallikarjun S', age: 54, sex: 'male', village: 'Koppal', phone: '9955667788', consentGiven: true, createdAt: daysAgo(16), updatedAt: daysAgo(16) },
  { id: 'p22', name: 'Rukmini Bai', age: 49, sex: 'female', village: 'Chikkamagaluru', phone: '8866778899', consentGiven: true, createdAt: daysAgo(22), updatedAt: daysAgo(22) },
  { id: 'p23', name: 'Dinesh Patel', age: 37, sex: 'male', village: 'Kodagu', phone: '9777889900', consentGiven: true, createdAt: daysAgo(28), updatedAt: daysAgo(28) },
  { id: 'p24', name: 'Kavitha Rao', age: 53, sex: 'female', village: 'Chikkaballapur', phone: '9666778800', consentGiven: true, createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  { id: 'p25', name: 'Hanumantharaya', age: 65, sex: 'male', village: 'Ramanagara', phone: '9444556600', consentGiven: true, createdAt: daysAgo(11), updatedAt: daysAgo(11) },
];

export const sampleScreenings: Screening[] = [
  {
    id: 's1', patientId: 'p1',
    history: { tobaccoSmoking: true, tobaccoChewing: true, gutka: false, arecaNutPan: true, alcohol: true, tobaccoDurationYears: 20, tobaccoFrequencyPerDay: 10, alcoholDurationYears: 15, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: true, previousOralLesions: true },
    symptoms: { nonHealingUlcer: true, nonHealingUlcerDuration: 4, whitePatches: true, redPatches: false, lumpOrThickening: false, painOrBurning: true, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Inner Cheeks', status: 'suspicious' }, { site: 'Tongue (sides)', status: 'suspicious' }, { site: 'Lips', status: 'normal' }],
    imageIds: [], riskLevel: 'HIGH', riskFactors: ['Non-healing ulcer for 4 weeks', 'White patches', 'Tobacco smoking', 'Tobacco chewing', 'Previous oral lesions'],
    stage: 'appointment_attended', referralFacility: 'Kidwai Memorial Institute of Oncology', appointmentDate: daysAgo(5), appointmentAttended: true, followUpDate: daysFromNow(21), createdAt: daysAgo(30), updatedAt: daysAgo(5),
  },
  {
    id: 's2', patientId: 'p2',
    history: { tobaccoSmoking: false, tobaccoChewing: true, gutka: true, arecaNutPan: true, alcohol: false, tobaccoDurationYears: 8, tobaccoFrequencyPerDay: 5, familyHistory: true, hpvOrImmuneIssues: false, poorDiet: false, previousOralLesions: false },
    symptoms: { nonHealingUlcer: true, nonHealingUlcerDuration: 3, whitePatches: true, redPatches: false, lumpOrThickening: false, painOrBurning: true, difficultyOpeningMouth: true, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Inner Cheeks', status: 'suspicious' }, { site: 'Gums', status: 'suspicious' }],
    imageIds: [], riskLevel: 'HIGH', riskFactors: ['Gutka use', 'Non-healing ulcer', 'Difficulty opening mouth', 'Family history'],
    stage: 'referral_recommended', referralFacility: 'Government Dental College Bengaluru', appointmentDate: daysFromNow(5), createdAt: daysAgo(25), updatedAt: daysAgo(2),
  },
  {
    id: 's3', patientId: 'p3',
    history: { tobaccoSmoking: true, tobaccoChewing: false, gutka: false, arecaNutPan: false, alcohol: true, tobaccoDurationYears: 30, tobaccoFrequencyPerDay: 15, alcoholDurationYears: 20, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: true, previousOralLesions: false },
    symptoms: { nonHealingUlcer: false, nonHealingUlcerDuration: 0, whitePatches: false, redPatches: true, lumpOrThickening: true, painOrBurning: false, difficultyOpeningMouth: false, difficultySwallowing: true, loosTeeth: false, unexplainedBleeding: true, numbness: false, neckSwelling: true },
    oralFindings: [{ site: 'Tongue (top)', status: 'suspicious' }, { site: 'Back of Throat', status: 'suspicious' }, { site: 'Neck', status: 'suspicious' }],
    imageIds: [], riskLevel: 'HIGH', riskFactors: ['Red patches', 'Neck swelling', 'Difficulty swallowing', 'Unexplained bleeding'],
    stage: 'closed', appointmentAttended: true, outcome: 'Referred to Kidwai. Biopsy done. Under treatment.', createdAt: daysAgo(20), updatedAt: daysAgo(1),
  },
  {
    id: 's4', patientId: 'p4',
    history: { tobaccoSmoking: false, tobaccoChewing: false, gutka: false, arecaNutPan: true, alcohol: false, tobaccoDurationYears: 3, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: false, previousOralLesions: false },
    symptoms: { nonHealingUlcer: false, whitePatches: true, redPatches: false, lumpOrThickening: false, painOrBurning: true, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Inner Cheeks', status: 'suspicious' }, { site: 'Lips', status: 'normal' }],
    imageIds: [], riskLevel: 'MODERATE', riskFactors: ['White patches', 'Pain/burning', 'Areca nut use'],
    stage: 'appointment_pending', referralFacility: 'Mysore Medical College', appointmentDate: daysFromNow(7), createdAt: daysAgo(18), updatedAt: daysAgo(3),
  },
  {
    id: 's5', patientId: 'p5',
    history: { tobaccoSmoking: true, tobaccoChewing: true, gutka: true, arecaNutPan: false, alcohol: true, tobaccoDurationYears: 15, tobaccoFrequencyPerDay: 8, familyHistory: true, hpvOrImmuneIssues: false, poorDiet: true, previousOralLesions: true },
    symptoms: { nonHealingUlcer: true, nonHealingUlcerDuration: 5, whitePatches: true, redPatches: true, lumpOrThickening: true, painOrBurning: true, difficultyOpeningMouth: true, difficultySwallowing: true, loosTeeth: true, unexplainedBleeding: true, numbness: true, neckSwelling: true },
    oralFindings: [{ site: 'Tongue (sides)', status: 'suspicious' }, { site: 'Floor of Mouth', status: 'suspicious' }, { site: 'Gums', status: 'suspicious' }, { site: 'Neck', status: 'suspicious' }],
    imageIds: [], riskLevel: 'HIGH', riskFactors: ['Multiple severe symptoms', 'Long-term tobacco', 'Family history'],
    stage: 'follow_up_recorded', referralFacility: 'Kidwai Memorial Institute', appointmentAttended: true, followUpDate: daysAgo(2), createdAt: daysAgo(15), updatedAt: daysAgo(2),
  },
  {
    id: 's6', patientId: 'p6',
    history: { tobaccoSmoking: false, tobaccoChewing: false, gutka: false, arecaNutPan: true, alcohol: false, tobaccoDurationYears: 5, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: false, previousOralLesions: false },
    symptoms: { nonHealingUlcer: false, whitePatches: false, redPatches: false, lumpOrThickening: false, painOrBurning: false, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Lips', status: 'normal' }, { site: 'Tongue (top)', status: 'normal' }],
    imageIds: [], riskLevel: 'LOW', riskFactors: ['Areca nut use'],
    stage: 'screening_completed', createdAt: daysAgo(14), updatedAt: daysAgo(14),
  },
  {
    id: 's7', patientId: 'p7',
    history: { tobaccoSmoking: true, tobaccoChewing: true, gutka: false, arecaNutPan: true, alcohol: true, tobaccoDurationYears: 25, tobaccoFrequencyPerDay: 12, alcoholDurationYears: 20, familyHistory: false, hpvOrImmuneIssues: true, poorDiet: true, previousOralLesions: true },
    symptoms: { nonHealingUlcer: true, nonHealingUlcerDuration: 6, whitePatches: false, redPatches: true, lumpOrThickening: true, painOrBurning: true, difficultyOpeningMouth: false, difficultySwallowing: true, loosTeeth: false, unexplainedBleeding: true, numbness: true, neckSwelling: true },
    oralFindings: [{ site: 'Tongue (sides)', status: 'suspicious' }, { site: 'Floor of Mouth', status: 'suspicious' }, { site: 'Palate', status: 'suspicious' }],
    imageIds: [], riskLevel: 'HIGH', riskFactors: ['6-week ulcer', 'Red patches', 'Neck swelling', 'HPV/immunity'],
    stage: 'lost_to_follow_up', referralFacility: 'District Hospital Dharwad', createdAt: daysAgo(12), updatedAt: daysAgo(1),
  },
  {
    id: 's8', patientId: 'p8',
    history: { tobaccoSmoking: false, tobaccoChewing: false, gutka: false, arecaNutPan: false, alcohol: false, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: false, previousOralLesions: false },
    symptoms: { nonHealingUlcer: false, whitePatches: false, redPatches: false, lumpOrThickening: false, painOrBurning: false, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Lips', status: 'normal' }, { site: 'Tongue (top)', status: 'normal' }, { site: 'Gums', status: 'normal' }],
    imageIds: [], riskLevel: 'LOW', riskFactors: [],
    stage: 'closed', outcome: 'No abnormality detected. Advised self-exam monthly.', createdAt: daysAgo(10), updatedAt: daysAgo(10),
  },
  {
    id: 's9', patientId: 'p9',
    history: { tobaccoSmoking: true, tobaccoChewing: false, gutka: false, arecaNutPan: false, alcohol: true, tobaccoDurationYears: 12, tobaccoFrequencyPerDay: 6, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: true, previousOralLesions: false },
    symptoms: { nonHealingUlcer: true, nonHealingUlcerDuration: 2, whitePatches: true, redPatches: false, lumpOrThickening: false, painOrBurning: false, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Inner Cheeks', status: 'suspicious' }],
    imageIds: [], riskLevel: 'MODERATE', riskFactors: ['Ulcer 2 weeks', 'White patches', 'Smoking'],
    stage: 'referral_recommended', referralFacility: 'Shivamogga District Hospital', createdAt: daysAgo(8), updatedAt: daysAgo(1),
  },
  {
    id: 's10', patientId: 'p10',
    history: { tobaccoSmoking: false, tobaccoChewing: false, gutka: false, arecaNutPan: false, alcohol: false, familyHistory: false, hpvOrImmuneIssues: false, poorDiet: false, previousOralLesions: false },
    symptoms: { nonHealingUlcer: false, whitePatches: false, redPatches: false, lumpOrThickening: false, painOrBurning: true, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: false },
    oralFindings: [{ site: 'Gums', status: 'normal' }],
    imageIds: [], riskLevel: 'LOW', riskFactors: ['Pain/burning (mild)'],
    stage: 'screening_completed', createdAt: daysAgo(7), updatedAt: daysAgo(7),
  },
  // More screenings for remaining patients
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `s${i + 11}`, patientId: `p${i + 11}`,
    history: { tobaccoSmoking: i % 3 === 0, tobaccoChewing: i % 2 === 0, gutka: i % 4 === 0, arecaNutPan: i % 3 !== 0, alcohol: i % 5 === 0, tobaccoDurationYears: i % 2 === 0 ? (i + 3) : undefined, familyHistory: i % 6 === 0, hpvOrImmuneIssues: false, poorDiet: i % 4 === 0, previousOralLesions: i % 7 === 0 },
    symptoms: { nonHealingUlcer: i % 5 === 0, nonHealingUlcerDuration: i % 5 === 0 ? 3 : undefined, whitePatches: i % 4 === 0, redPatches: i % 8 === 0, lumpOrThickening: i % 7 === 0, painOrBurning: i % 3 === 0, difficultyOpeningMouth: false, difficultySwallowing: false, loosTeeth: false, unexplainedBleeding: false, numbness: false, neckSwelling: i % 9 === 0 },
    oralFindings: [{ site: 'Inner Cheeks', status: (i % 3 === 0 ? 'suspicious' : 'normal') as 'suspicious' | 'normal' }],
    imageIds: [],
    riskLevel: (i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MODERATE' : 'LOW') as 'HIGH' | 'MODERATE' | 'LOW',
    riskFactors: i % 2 === 0 ? ['Tobacco use', 'White patches'] : ['Areca nut use'],
    stage: (['screening_completed', 'referral_recommended', 'appointment_pending', 'appointment_attended', 'follow_up_recorded', 'closed', 'lost_to_follow_up'] as const)[i % 7],
    createdAt: daysAgo(i + 1),
    updatedAt: daysAgo(Math.max(0, i - 2)),
  })),
];

export const sampleCaseEvents: CaseEvent[] = [
  { id: 'e1', screeningId: 's1', stage: 'screening_completed', note: 'Screening completed by ASHA worker Sunita. High risk identified.', timestamp: daysAgo(30), author: 'ASHA Sunita' },
  { id: 'e2', screeningId: 's1', stage: 'referral_recommended', note: 'Referred to Kidwai Memorial Institute of Oncology. Appointment letter given.', timestamp: daysAgo(29), author: 'ANM Kavitha' },
  { id: 'e3', screeningId: 's1', stage: 'appointment_pending', note: 'Appointment booked for 15 days from now. Patient informed.', timestamp: daysAgo(25), author: 'ANM Kavitha' },
  { id: 'e4', screeningId: 's1', stage: 'appointment_attended', note: 'Patient attended OPD at Kidwai. Doctor examined. Biopsy ordered.', timestamp: daysAgo(5), author: 'ASHA Sunita' },
  { id: 'e5', screeningId: 's2', stage: 'screening_completed', note: 'Screening at village camp. Multiple risk factors. Referred.', timestamp: daysAgo(25), author: 'ANM Rekha' },
  { id: 'e6', screeningId: 's2', stage: 'referral_recommended', note: 'Referral to Government Dental College written.', timestamp: daysAgo(24), author: 'ANM Rekha' },
  { id: 'e7', screeningId: 's3', stage: 'closed', note: 'Case closed. Patient under active treatment at Kidwai.', timestamp: daysAgo(1), author: 'Health Worker' },
  { id: 'e8', screeningId: 's5', stage: 'follow_up_recorded', note: 'Follow-up recorded. Patient responded well to initial treatment.', timestamp: daysAgo(2), author: 'Doctor' },
];
