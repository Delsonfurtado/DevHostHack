import React, { useState } from 'react';
import {
  Baby,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Heart,
  Save,
  RotateCcw,
  Smile,
  Info,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Checkbox, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { ChildScreening } from '../types/models';

interface AgeGuidance {
  band: string;
  bandKn: string;
  giveEn: string[];
  giveKn: string[];
  avoidEn: string[];
  avoidKn: string[];
  dentistEn: string[];
  dentistKn: string[];
}

const AGE_GUIDANCE: Record<string, AgeGuidance> = {
  '0-6': {
    band: '0–6 Months (Infancy)',
    bandKn: '೦–೬ ತಿಂಗಳು (ಶಿಶು ಹಂತ)',
    giveEn: [
      'Exclusive breastfeeding on demand (nothing else needed).',
      'Clean gums gently with a clean, damp soft cloth after feeding.',
      'Allow plenty of tummy time and skin-to-skin bonding.',
    ],
    giveKn: [
      'ಕೇವಲ ತಾಯಿಯ ಎದೆಹಾಲು ಮಾತ್ರ ನೀಡಿ (ಬೇರೇನೂ ಬೇಡ).',
      'ಹಾಲುಣಿಸಿದ ನಂತರ ಶುದ್ಧ, ತೇವವಾದ ಹತ್ತಿ ಬಟ್ಟೆಯಿಂದ ಒಸಡುಗಳನ್ನು ನಿಧಾನವಾಗಿ ಒರೆಸಿ.',
      'ಮಗುವಿನ ಬಾಯಿಯನ್ನು ಯಾವಾಗಲೂ ಸ್ವಚ್ಛವಾಗಿಡಿ.',
    ],
    avoidEn: [
      'AVOID honey strictly (risk of infant botulism poisoning).',
      'AVOID animal milk, tea, coffee, sugar water or gripe water.',
      'AVOID putting baby to sleep with a milk bottle in mouth.',
    ],
    avoidKn: [
      'ಜೇನುತುಪ್ಪವನ್ನು ಕಡ್ಡಾಯವಾಗಿ ನೀಡಬೇಡಿ (ಬೊಟುಲಿಸಮ್ ವಿಷಬಾಧೆಯ ಅಪಾಯ).',
      'ಹಸುವಿನ ಹಾಲು, ಸಕ್ಕರೆ ನೀರು ಅಥವಾ ಪ್ಯಾಕ್ ಮಾಡಿದ ಡ್ರಿಂಕ್ಸ್ ನೀಡಬೇಡಿ.',
      'ಬಾಟಲ್ ಬಾಯಲ್ಲಿಟ್ಟು ಮಗುವನ್ನು ಮಲಗಿಸಬೇಡಿ.',
    ],
    dentistEn: [
      'If you notice white curds inside cheeks that cannot be wiped away (oral thrush).',
      'If baby has difficulty feeding or tongue-tie symptoms.',
    ],
    dentistKn: [
      'ಒರೆಸಿದರೂ ಹೋಗದ ಬಿಳಿ ಕೆನೆಯಂತಹ ಚುಕ್ಕೆಗಳು ಬಾಯಿಯಲ್ಲಿದ್ದರೆ.',
      'ಹಾಲು ಕುಡಿಯಲು ತೀವ್ರ ತೊಂದರೆ ಅಥವಾ ನಾಲಿಗೆ ಗಂಟು ಇದ್ದರೆ.',
    ],
  },
  '6-12': {
    band: '6–12 Months (Weaning)',
    bandKn: '೬–೧೨ ತಿಂಗಳು (ಅನ್ನಪ್ರಾಶನ ಹಂತ)',
    giveEn: [
      'Introduce soft home-cooked foods: mashed ragi sari, soft rice with dal, mashed banana, boiled pumpkin/carrot, boiled egg yolk if tolerated.',
      'Continue breastfeeding alongside complementary foods.',
      'Offer boiled cooled water in an open cup, not a bottle.',
    ],
    giveKn: [
      'ಮೃದುವಾದ ಮನೆಯ ಆಹಾರ ಪ್ರಾರಂಭಿಸಿ: ರಾಗಿ ಸರಿ, ಬೇಳೆ ಅನ್ನ, ಮಸೆದ ಬಾಳೆಹಣ್ಣು, ಬೇಯಿಸಿದ ಕ್ಯಾರೆಟ್/ಕುಂಬಳಕಾಯಿ, ಮೊಟ್ಟೆ.',
      'ಆಹಾರದ ಜೊತೆಗೆ ತಾಯಿಯ ಎದೆಹಾಲು ಮುಂದುವರಿಸಿ.',
      'ಕುದಿಸಿ ಆರಿಸಿದ ನೀರನ್ನು ಸಣ್ಣ ಲೋಟದಲ್ಲಿ ಕುಡಿಸಿ (ಬಾಟಲ್ ಬೇಡ).',
    ],
    avoidEn: [
      'AVOID honey, added table sugar, and salt before 1 year of age.',
      'AVOID cow\'s milk as the main beverage.',
      'AVOID whole nuts, whole grapes or hard round foods (severe choking hazard).',
      'AVOID biscuits, packaged baby puffs, and packaged juices.',
    ],
    avoidKn: [
      '೧ ವರ್ಷದವರೆಗೆ ಸಕ್ಕರೆ, ಉಪ್ಪು ಮತ್ತು ಜೇನುತುಪ್ಪ ಸಂಪೂರ್ಣವಾಗಿ ತಪ್ಪಿಸಿ.',
      'ಮುಖ್ಯ ಆಹಾರವಾಗಿ ಹಸುವಿನ ಹಾಲು ನೀಡಬೇಡಿ.',
      'ಇಡೀ ಬೀಜಗಳು, ದ್ರಾಕ್ಷಿ ಅಥವಾ ಗಟ್ಟಿ ಕಾಳುಗಳು ನೀಡಬೇಡಿ (ಗಂಟಲಿಗೆ ಸಿಲುಕುವ ಅಪಾಯ).',
      'ಪ್ಯಾಕೆಟ್ ಬಿಸ್ಕತ್ತು ಮತ್ತು ಜ್ಯೂಸ್ ನೀಡಬೇಡಿ.',
    ],
    dentistEn: [
      'First dental visit when the first tooth erupts or by age 1.',
      'Teething irritability with high fever or bleeding gums.',
    ],
    dentistKn: [
      'ಮೊದಲ ಹಲ್ಲು ಬಂದಾಗ ಅಥವಾ ೧ನೇ ಹುಟ್ಟುಹಬ್ಬದೊಳಗೆ ಮೊದಲ ದಂತ ತಪಾಸಣೆ ಮಾಡಿಸಿ.',
      'ಹಲ್ಲು ಮೂಡುವಾಗ ವಿಪರೀತ ಜ್ವರ ಅಥವಾ ಒಸಡಿನಲ್ಲಿ ರಕ್ತ ಬಂದರೆ.',
    ],
  },
  '12-24': {
    band: '12–24 Months (Toddler)',
    bandKn: '೧–೨ ವರ್ಷ (ನಡೆಯುವ ಹಂತ)',
    giveEn: [
      'Nutritious family foods rich in calcium, iron, and green leafy vegetables.',
      'Begin brushing with a smear (grain of rice size) of fluoride toothpaste twice a day.',
      'Encourage self-feeding with fingers and spoon.',
    ],
    giveKn: [
      'ಮನೆಯಲ್ಲಿ ತಯಾರಿಸಿದ ಸಮತೋಲಿತ ಪೌಷ್ಟಿಕ ಆಹಾರ, ರಾಗಿ, ಹಸಿರು ತರಕಾರಿಗಳು.',
      'ಅಕ್ಕಿ ಕಾಳಿನಷ್ಟು ಪ್ರಮಾಣದ ಫ್ಲೋರೈಡ್ ಟೂತ್‌ಪೇಸ್ಟ್‌ನಿಂದ ದಿನಕ್ಕೆ ೨ ಬಾರಿ ನಿಧಾನವಾಗಿ ಹಲ್ಲುಜ್ಜಿ.',
      'ಲೋಟದಿಂದ ನೀರು ಮತ್ತು ಹಾಲು ಕುಡಿಯುವುದನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿ.',
    ],
    avoidEn: [
      'AVOID sticky candies, toffees, lollipops and sugary snacks.',
      'AVOID sweet bedtime bottles or sipping on juices throughout the day.',
      'AVOID secondhand smoke and areca nut / gutka near the child.',
    ],
    avoidKn: [
      'ಅಂಟಿಕೊಳ್ಳುವ ಚಾಕೊಲೇಟ್, ಸಕ್ಕರೆ ಮಿಠಾಯಿ ಮತ್ತು ಸಿಹಿತಿಂಡಿಗಳನ್ನು ತಪ್ಪಿಸಿ.',
      'ರಾತ್ರಿ ಮಲಗುವಾಗ ಬಾಟಲ್ ಹಾಲು ಅಥವಾ ಸಿಹಿ ಪಾನೀಯ ಕೊಡಬೇಡಿ.',
      'ಮಗುವಿನ ಬಳಿ ತಂಬಾಕು ಹೊಗೆ ಅಥವಾ ಅಡಿಕೆ ಜಗಿಯುವುದನ್ನು ಕಡ್ಡಾಯವಾಗಿ ನಿಷೇಧಿಸಿ.',
    ],
    dentistEn: [
      'Brown or chalky white spots on front teeth (early childhood caries).',
      'Falls or injuries affecting baby teeth.',
    ],
    dentistKn: [
      'ಮುಂಭಾಗದ ಹಲ್ಲುಗಳ ಮೇಲೆ ಕಂದು ಅಥವಾ ಬಿಳಿ ಕಲೆಗಳು ಕಾಣಿಸಿಕೊಂಡರೆ.',
      'ಬಿದ್ದು ಹಲ್ಲಿಗೆ ಅಥವಾ ತುಟಿಗೆ ಪೆಟ್ಟಾದರೆ.',
    ],
  },
  '24-60': {
    band: '2–5 Years (Preschool)',
    bandKn: '೨–೫ ವರ್ಷ (ಶಾಲಾಪೂರ್ವ ಹಂತ)',
    giveEn: [
      'Pea-sized amount of toothpaste under adult supervision (ensure child spits it out).',
      'Crunchy fresh fruits like apples, guava, cucumbers which naturally cleanse teeth.',
      'Encourage drinking plain water after all meals.',
    ],
    giveKn: [
      'ಬಟಾಣಿ ಕಾಳಿನಷ್ಟು ಟೂತ್‌ಪೇಸ್ಟ್ ಬಳಸಿ ಹಿರಿಯರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ ಹಲ್ಲುಜ್ಜಿಸಿ (ಉಗುಳಲು ಕಲಿಸಿ).',
      'ತಾಜಾ ಸೇಬು, ಪೇರಲ, ಸೌತೆಕಾಯಿಯಂತಹ ಹಣ್ಣುಗಳನ್ನು ನೀಡಿ.',
      'ಊಟವಾದ ತಕ್ಷಣ ಬಾಯಿ ಮುಕ್ಕಳಿಸಲು ಕಲಿಸಿ.',
    ],
    avoidEn: [
      'AVOID frequent chocolates, toffees, and aerated soda drinks.',
      'AVOID prolonged thumb-sucking or dummy/pacifier use beyond 3 years.',
      'AVOID pan/gutka or tobacco exposure anywhere in the household.',
    ],
    avoidKn: [
      'ಆಗಾಗ ಚಾಕೊಲೇಟ್, ತಂಪು ಪಾನೀಯಗಳು ಮತ್ತು ಬೇಕರಿ ತಿನಿಸುಗಳನ್ನು ತಪ್ಪಿಸಿ.',
      '೩ ವರ್ಷ ಮೀರಿದ ನಂತರ ಬೆರಳು ಚೀಪುವ ಅಥವಾ ರಬ್ಬರ್ ನಿಪ್ಪಲ್ ಅಭ್ಯಾಸ ಮುಂದುವರಿಯಬಾರದು.',
      'ಮನೆಯಲ್ಲಿ ಯಾರೂ ಮಗುವಿನ ಮುಂದೆ ಪಾನ್, ಗುಟ್ಕಾ ಅಥವಾ ತಂಬಾಕು ಬಳಸಬಾರದು.',
    ],
    dentistEn: [
      'Cavities, toothache, or food trapping between teeth.',
      'Routine dental check-up every 6 months.',
    ],
    dentistKn: [
      'ಹಲ್ಲು ಕುಳಿ (ಕ್ಯಾವಿಟಿ), ಹಲ್ಲು ನೋವು ಅಥವಾ ಊತವಿದ್ದರೆ.',
      'ಪ್ರತಿ ೬ ತಿಂಗಳಿಗೊಮ್ಮೆ ನಿಯಮಿತ ದಂತ ತಪಾಸಣೆ.',
    ],
  },
  '60-144': {
    band: '6–12 Years (School Age)',
    bandKn: '೬–೧೨ ವರ್ಷ (ಶಾಲಾ ಹಂತ)',
    giveEn: [
      'Brush teeth twice daily for two full minutes (morning and before bedtime).',
      'Dental sealants for permanent molars to prevent cavities.',
      'Use mouthguards during contact sports to protect developing teeth.',
    ],
    giveKn: [
      'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ (ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಮಲಗುವ ಮುನ್ನ) ಪೂರ್ಣ ೨ ನಿಮಿಷ ಹಲ್ಲುಜ್ಜಬೇಕು.',
      'ಶಾಶ್ವತ ದವಡೆ ಹಲ್ಲುಗಳಿಗೆ ದಂತ ಸೀಲಾಂಟ್ (ರಕ್ಷಾ ಕವಚ) ಹಾಕಿಸಿ.',
      'ಕ್ರೀಡೆಗಳಲ್ಲಿ ಆಡುವಾಗ ಹಲ್ಲುಗಳ ರಕ್ಷಣೆಗೆ ಮೌತ್‌ಗಾರ್ಡ್ ಬಳಸಿ.',
    ],
    avoidEn: [
      'STRICTLY AVOID any experimentation with gutka, areca nut, beedis or cigarettes.',
      'AVOID regular consumption of packaged energy drinks and high-sugar snacks.',
      'AVOID using teeth to crack nuts, tear plastic or open bottle caps.',
    ],
    avoidKn: [
      'ಗುಟ್ಕಾ, ಅಡಿಕೆ, ಸಿಗರೇಟ್ ಅಥವಾ ತಂಬಾಕು ಉತ್ಪನ್ನಗಳನ್ನು ಮುಟ್ಟದಂತೆ ಕಟ್ಟುನಿಟ್ಟಿನ ಎಚ್ಚರ ವಹಿಸಿ.',
      'ಸಕ್ಕರೆ ಅಂಶವಿರುವ ತಂಪು ಪಾನೀಯಗಳು ಮತ್ತು ಜಂಕ್ ಫುಡ್ ಸೇವನೆ ಕಡಿಮೆ ಮಾಡಿ.',
      'ಹಲ್ಲಿನಿಂದ ಬಾಟಲ್ ಮುಚ್ಚಳ ಅಥವಾ ಗಟ್ಟಿ ವಸ್ತುಗಳನ್ನು ಕಡಿಯಬಾರದು.',
    ],
    dentistEn: [
      'Crooked teeth alignment (orthodontic check by age 7).',
      'Bleeding gums, loose permanent teeth, or persistent ulcers.',
    ],
    dentistKn: [
      'ಹಲ್ಲುಗಳು ಓರೆ-ಕೋರೆಯಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದರೆ.',
      'ಒಸಡಿನಲ್ಲಿ ರಕ್ತಸ್ರಾವ ಅಥವಾ ವಾಸಿಯಾಗದ ಬಾಯಿ ಹುಣ್ಣುಗಳಿದ್ದರೆ.',
    ],
  },
};

export default function ChildCare() {
  const { t, lang } = useApp();

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    childName: '',
    caregiverName: '',
    ageInputType: 'months' as 'months' | 'years',
    ageVal: 18,
    sugarIntake: 'moderate' as 'low' | 'moderate' | 'high',
    brushingHabits: 'once' as 'none' | 'once' | 'twice' | 'more',
    bottleAtNight: false,
    thumbSucking: false,
    mouthSores: false,
    whitePatches: false,
    teethingIssues: false,
    tobaccoExposure: false,
    notes: '',
  });

  // Calculate age band
  const totalMonths = formData.ageInputType === 'years' ? formData.ageVal * 12 : formData.ageVal;

  const getAgeKey = (m: number): string => {
    if (m < 6) return '0-6';
    if (m < 12) return '6-12';
    if (m < 24) return '12-24';
    if (m < 60) return '24-60';
    return '60-144';
  };

  const currentGuidance = AGE_GUIDANCE[getAgeKey(totalMonths)] || AGE_GUIDANCE['12-24'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childName.trim() || !formData.caregiverName.trim()) {
      showToast(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಮಗುವಿನ ಮತ್ತು ಪಾಲಕರ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter child and caregiver name', 'error');
      return;
    }

    try {
      const newRec: ChildScreening = {
        id: 'child_' + Date.now(),
        childName: formData.childName.trim(),
        caregiverName: formData.caregiverName.trim(),
        ageMonths: totalMonths,
        bottleAtNight: formData.bottleAtNight,
        sugarIntake: formData.sugarIntake,
        brushingHabits: formData.brushingHabits,
        thumbSuckingOrPacifier: formData.thumbSucking,
        mouthSores: formData.mouthSores,
        whitePatches: formData.whitePatches,
        teethingIssues: formData.teethingIssues,
        tobaccoExposureAtHome: formData.tobaccoExposure,
        notes: formData.notes.trim() || undefined,
        createdAt: new Date(),
      };

      await db.childScreenings.add(newRec);
      setSubmitted(true);
      showToast(lang === 'kn' ? 'ಮಕ್ಕಳ ತಪಾಸಣೆ ಮಾರ್ಗದರ್ಶನ ಸಿದ್ಧವಾಗಿದೆ!' : 'Child oral guidance generated and saved!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showToast('Error saving child screening', 'error');
    }
  };

  return (
    <Layout title={t('childCareTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Header Title with Subtitle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-sm">
              <Baby size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('childCareTitle')} / ಪುಟ್ಟ ನಗು
              </h2>
              <p className="text-xs text-gray-500">{t('childCareSubtitle')}</p>
            </div>
          </div>
          <ReadAloudBtn
            text={
              lang === 'kn'
                ? 'ಪುಟ್ಟ ನಗು - ೦ ರಿಂದ ೧೨ ವರ್ಷದ ಮಕ್ಕಳ ಬಾಯಿ ಆರೋಗ್ಯ ಮತ್ತು ಪೋಷಣೆಯ ಮಾರ್ಗದರ್ಶನ.'
                : 'Little Smiles oral health and nutrition guidance for children zero to 12 years.'
            }
          />
        </div>

        {!submitted ? (
          /* QUESTIONNAIRE FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
                {lang === 'kn' ? 'ಮಗು ಮತ್ತು ಪಾಲಕರ ವಿವರ' : 'Child & Caregiver Details'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('childName')} *
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="e.g. Aarav / Ananya"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('caregiverName')} *
                </label>
                <input
                  type="text"
                  value={formData.caregiverName}
                  onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                  placeholder="e.g. Meenakshi (Mother)"
                  className="input-field"
                  required
                />
              </div>

              {/* Age Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {formData.ageInputType === 'months' ? t('ageMonths') : t('ageYears')} *
                  </label>
                  <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ageInputType: 'months', ageVal: 12 })}
                      className={`px-2 py-0.5 rounded ${formData.ageInputType === 'months' ? 'bg-white dark:bg-gray-600 font-bold shadow-xs' : 'text-gray-500'}`}
                    >
                      {lang === 'kn' ? 'ತಿಂಗಳು (0-59)' : 'Months'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ageInputType: 'years', ageVal: 6 })}
                      className={`px-2 py-0.5 rounded ${formData.ageInputType === 'years' ? 'bg-white dark:bg-gray-600 font-bold shadow-xs' : 'text-gray-500'}`}
                    >
                      {lang === 'kn' ? 'ವರ್ಷ (5-12)' : 'Years'}
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  value={formData.ageVal}
                  onChange={(e) => setFormData({ ...formData, ageVal: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={formData.ageInputType === 'months' ? 0 : 5}
                  max={formData.ageInputType === 'months' ? 59 : 12}
                />
              </div>
            </Card>

            {/* Habits & Observations */}
            <Card className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
                {lang === 'kn' ? 'ದೈನಂದಿನ ಆಹಾರ ಮತ್ತು ಬಾಯಿ ಅಭ್ಯಾಸಗಳು' : 'Feeding & Dental Habits'}
              </h3>

              <Checkbox
                checked={formData.bottleAtNight}
                onChange={(v) => setFormData({ ...formData, bottleAtNight: v })}
                label={lang === 'kn' ? 'ರಾತ್ರಿ ಮಲಗುವಾಗ ಬಾಟಲ್ ಹಾಲು ಕುಡಿಯುವುದು' : 'Takes a feeding bottle to bed at night'}
              />
              <Checkbox
                checked={formData.thumbSucking}
                onChange={(v) => setFormData({ ...formData, thumbSucking: v })}
                label={lang === 'kn' ? 'ಬೆರಳು ಚೀಪುವ ಅಥವಾ ರಬ್ಬರ್ ನಿಪ್ಪಲ್ ಅಭ್ಯಾಸ' : 'Thumb-sucking or regular pacifier habit'}
              />
              <Checkbox
                checked={formData.tobaccoExposure}
                onChange={(v) => setFormData({ ...formData, tobaccoExposure: v })}
                label={lang === 'kn' ? 'ಮನೆಯಲ್ಲಿ ಮಗುವಿನ ಮುಂದೆ ತಂಬಾಕು/ಅಡಿಕೆ ಬಳಕೆ ಇದೆ' : 'Child is exposed to tobacco smoke or areca nut chewing at home'}
              />

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  {lang === 'kn' ? 'ಲಕ್ಷಣಗಳ ಗಮನಿಸುವಿಕೆ' : 'Reported Symptoms'}
                </span>
                <Checkbox
                  checked={formData.mouthSores}
                  onChange={(v) => setFormData({ ...formData, mouthSores: v })}
                  label={lang === 'kn' ? 'ಬಾಯಿಯಲ್ಲಿ ಹುಣ್ಣು ಅಥವಾ ನೋವು ಇದೆ' : 'Child has mouth sores, ulcers, or pain'}
                />
                <Checkbox
                  checked={formData.whitePatches}
                  onChange={(v) => setFormData({ ...formData, whitePatches: v })}
                  label={lang === 'kn' ? 'ಬಾಯಿಯಲ್ಲಿ ಬಿಳಿ ಚುಕ್ಕೆಗಳು / ಕೆನೆ ಇದೆ' : 'White patches or curd-like coating in mouth'}
                />
                <Checkbox
                  checked={formData.teethingIssues}
                  onChange={(v) => setFormData({ ...formData, teethingIssues: v })}
                  label={lang === 'kn' ? 'ಹಲ್ಲು ಮೂಡುವಾಗ ಊತ ಅಥವಾ ಕಿರಿಕಿರಿ ಇದೆ' : 'Severe teething irritability or swollen gums'}
                />
              </div>
            </Card>

            <button type="submit" className="btn-primary w-full py-3 text-sm shadow-md flex items-center justify-center gap-2">
              <Sparkles size={16} />
              {lang === 'kn' ? 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ' : 'View Age-Banded Guidance'}
            </button>
          </form>
        ) : (
          /* GUIDANCE VIEW */
          <div className="space-y-4 animate-fade-in">
            {/* Age Band Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-100 block">
                  {formData.childName} ({totalMonths} {lang === 'kn' ? 'ತಿಂಗಳು' : 'months'})
                </span>
                <h3 className="text-base font-bold">
                  {lang === 'kn' ? currentGuidance.bandKn : currentGuidance.band}
                </h3>
              </div>
              <Smile size={32} className="text-pink-100" />
            </div>

            {/* Red Flag Warning if sores / white patches checked */}
            {(formData.mouthSores || formData.whitePatches) && (
              <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200">
                <AlertTriangle size={18} className="shrink-0 text-red-600" />
                <div>
                  <span className="font-bold block">{t('redFlag')}</span>
                  <span>
                    {lang === 'kn'
                      ? 'ಮಗುವಿನಲ್ಲಿ ವಾಸಿಯಾಗದ ಹುಣ್ಣು ಅಥವಾ ಬಿಳಿ ಚುಕ್ಕೆಗಳು ಕಂಡುಬಂದಲ್ಲಿ ವಿಳಂಬ ಮಾಡದೆ ದಂತ ವೈದ್ಯರನ್ನು ಅಥವಾ ಮಕ್ಕಳ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.'
                      : 'Persistent oral lesions, white coating, or bleeding gums in young children require clinical evaluation.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1. WHAT TO GIVE */}
            <Card className="space-y-2 border-l-4 border-l-green-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('whatToGive')} ({lang === 'kn' ? 'ಏನು ಕೊಡಬೇಕು' : 'Recommended Foods & Practices'})
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {(lang === 'kn' ? currentGuidance.giveKn : currentGuidance.giveEn).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* 2. WHAT TO AVOID */}
            <Card className="space-y-2 border-l-4 border-l-red-500">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('whatToAvoid')} ({lang === 'kn' ? 'ಏನು ತಪ್ಪಿಸಬೇಕು' : 'Items & Habits to Strictly Avoid'})
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {(lang === 'kn' ? currentGuidance.avoidKn : currentGuidance.avoidEn).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* 3. WHEN TO SEE A DENTIST */}
            <Card className="space-y-2 border-l-4 border-l-teal-600">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('whenToSeeDentist')} ({lang === 'kn' ? 'ವೈದ್ಯರನ್ನು ಯಾವಾಗ ನೋಡಬೇಕು' : 'Dental Visit Indicators'})
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {(lang === 'kn' ? currentGuidance.dentistKn : currentGuidance.dentistEn).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">ℹ</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Disclaimer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[11px] text-gray-500 flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5 text-gray-400" />
              <span>{t('childCareDisclaimer')}</span>
            </div>

            {/* Button to Re-enter */}
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              {lang === 'kn' ? 'ಮತ್ತೊಂದು ಮಗುವಿನ ವಿವರ' : 'Screen Another Child'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
