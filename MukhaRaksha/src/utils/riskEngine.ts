// Transparent rule-based risk scoring engine
import type { HistoryQuestionnaire, SymptomQuestionnaire, OralSiteFinding, RiskLevel } from '../types/models';

interface RiskResult {
  level: RiskLevel;
  score: number;
  factors: string[];  // English
  factorsKn: string[]; // Kannada
}

export function calculateRisk(
  history: HistoryQuestionnaire,
  symptoms: SymptomQuestionnaire,
  findings: OralSiteFinding[]
): RiskResult {
  let score = 0;
  const factors: string[] = [];
  const factorsKn: string[] = [];

  function add(pts: number, en: string, kn: string) {
    score += pts;
    factors.push(en);
    factorsKn.push(kn);
  }

  // === HISTORY ===
  if (history.tobaccoSmoking) {
    add(10, 'Tobacco smoking', 'ತಂಬಾಕು ಹೊಗೆ');
  }
  if (history.tobaccoChewing) {
    add(12, 'Tobacco chewing', 'ತಂಬಾಕು ಅಗಿಯುವುದು');
  }
  if (history.gutka) {
    add(14, 'Gutka / Pan masala use', 'ಗುಟ್ಕಾ / ಪಾನ್ ಮಸಾಲಾ');
  }
  if (history.arecaNutPan) {
    add(10, 'Areca nut / Betel leaf (Pan)', 'ಅಡಿಕೆ / ವೀಳ್ಯದ ಎಲೆ');
  }
  if (history.alcohol) {
    add(8, 'Alcohol consumption', 'ಮದ್ಯಪಾನ');
  }
  if (history.tobaccoDurationYears && history.tobaccoDurationYears >= 10) {
    add(15, `Tobacco use for ${history.tobaccoDurationYears} years (long-term)`, `${history.tobaccoDurationYears} ವರ್ಷಗಳ ತಂಬಾಕು ಬಳಕೆ (ದೀರ್ಘಕಾಲೀನ)`);
  } else if (history.tobaccoDurationYears && history.tobaccoDurationYears >= 5) {
    add(8, `Tobacco use for ${history.tobaccoDurationYears} years`, `${history.tobaccoDurationYears} ವರ್ಷಗಳ ತಂಬಾಕು ಬಳಕೆ`);
  }
  if (history.tobaccoFrequencyPerDay && history.tobaccoFrequencyPerDay >= 10) {
    add(10, `Heavy tobacco use (${history.tobaccoFrequencyPerDay}x/day)`, `ಅಧಿಕ ತಂಬಾಕು (${history.tobaccoFrequencyPerDay} ಬಾರಿ/ದಿನ)`);
  }
  if (history.familyHistory) {
    add(12, 'Family history of oral cancer', 'ಕುಟುಂಬದಲ್ಲಿ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಇತಿಹಾಸ');
  }
  if (history.hpvOrImmuneIssues) {
    add(10, 'HPV or immune deficiency', 'ಎಚ್‌ಪಿವಿ ಅಥವಾ ದುರ್ಬಲ ರೋಗನಿರೋಧಕ ಶಕ್ತಿ');
  }
  if (history.poorDiet) {
    add(5, 'Poor diet (low in fruits/vegetables)', 'ಕಡಿಮೆ ಹಣ್ಣು-ತರಕಾರಿ ಸೇವನೆ');
  }
  if (history.previousOralLesions) {
    add(15, 'Previous oral lesions or precancerous conditions', 'ಹಿಂದೆ ಬಾಯಿ ಗಾಯ ಅಥವಾ ಪೂರ್ವ-ಕ್ಯಾನ್ಸರ್ ಸ್ಥಿತಿ');
  }

  // === SYMPTOMS ===
  if (symptoms.nonHealingUlcer) {
    if (symptoms.nonHealingUlcerDuration && symptoms.nonHealingUlcerDuration >= 3) {
      add(30, `Non-healing ulcer for ${symptoms.nonHealingUlcerDuration} weeks`, `${symptoms.nonHealingUlcerDuration} ವಾರ ಗುಣವಾಗದ ಹುಣ್ಣು`);
    } else {
      add(20, 'Non-healing mouth ulcer (>2 weeks)', '2 ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಗುಣವಾಗದ ಹುಣ್ಣು');
    }
  }
  if (symptoms.whitePatches) {
    add(25, 'White patches (Leukoplakia)', 'ಬಿಳಿ ಚುಕ್ಕೆ (ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ)');
  }
  if (symptoms.redPatches) {
    add(30, 'Red patches (Erythroplakia - high malignant potential)', 'ಕೆಂಪು ಚುಕ್ಕೆ (ಎರಿಥ್ರೋಪ್ಲಾಕಿಯಾ)');
  }
  if (symptoms.lumpOrThickening) {
    add(25, 'Lump or thickening in cheek/lip/neck', 'ಕೆನ್ನೆ/ತುಟಿ/ಕತ್ತಿನಲ್ಲಿ ಗಡ್ಡೆ');
  }
  if (symptoms.painOrBurning) {
    add(10, 'Pain or burning sensation in mouth', 'ಬಾಯಿಯಲ್ಲಿ ನೋವು ಅಥವಾ ಉರಿ');
  }
  if (symptoms.difficultyOpeningMouth) {
    add(20, 'Difficulty opening mouth (Trismus/Submucous fibrosis)', 'ಬಾಯಿ ತೆರೆಯಲು ಕಷ್ಟ');
  }
  if (symptoms.difficultySwallowing) {
    add(20, 'Difficulty swallowing or speaking', 'ನುಂಗಲು ಅಥವಾ ಮಾತನಾಡಲು ಕಷ್ಟ');
  }
  if (symptoms.loosTeeth) {
    add(15, 'Unexplained loose teeth', 'ಕಾರಣವಿಲ್ಲದ ಸಡಿಲ ಹಲ್ಲುಗಳು');
  }
  if (symptoms.unexplainedBleeding) {
    add(20, 'Unexplained bleeding in mouth', 'ಕಾರಣವಿಲ್ಲದ ರಕ್ತಸ್ರಾವ');
  }
  if (symptoms.numbness) {
    add(15, 'Numbness of lip/tongue/face', 'ತುಟಿ/ನಾಲಿಗೆ/ಮುಖದ ಮರಗಟ್ಟುವಿಕೆ');
  }
  if (symptoms.neckSwelling) {
    add(25, 'Neck swelling or lump', 'ಕತ್ತಿನ ಊತ ಅಥವಾ ಗಡ್ಡೆ');
  }

  // === ORAL FINDINGS ===
  const suspiciousFindings = findings.filter(f => f.status === 'suspicious');
  if (suspiciousFindings.length >= 3) {
    add(30, `Suspicious findings at ${suspiciousFindings.length} oral sites`, `${suspiciousFindings.length} ಬಾಯಿ ಸ್ಥಳಗಳಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಫಲಿತಾಂಶ`);
  } else if (suspiciousFindings.length >= 1) {
    const sites = suspiciousFindings.map(f => f.site).join(', ');
    add(15 * suspiciousFindings.length, `Suspicious finding at: ${sites}`, `ಅನುಮಾನಾಸ್ಪದ ಫಲಿತಾಂಶ: ${sites}`);
  }

  // === CLASSIFY ===
  let level: RiskLevel;
  if (score >= 50) {
    level = 'HIGH';
  } else if (score >= 20) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  return { level, score, factors, factorsKn };
}

export function getRiskColor(level: RiskLevel): string {
  if (level === 'HIGH') return 'text-red-600 dark:text-red-400';
  if (level === 'MODERATE') return 'text-amber-600 dark:text-amber-400';
  return 'text-green-600 dark:text-green-400';
}

export function getRiskBg(level: RiskLevel): string {
  if (level === 'HIGH') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  if (level === 'MODERATE') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
}

export function getRiskBadgeClass(level: RiskLevel): string {
  if (level === 'HIGH') return 'badge-high';
  if (level === 'MODERATE') return 'badge-moderate';
  return 'badge-low';
}
