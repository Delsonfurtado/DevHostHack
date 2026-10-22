import React, { useState } from 'react';
import {
  Baby,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Smile,
  Info,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
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
    ageBand: '' as '' | '0-5' | '6-8' | '9-11' | '12-23' | '2-5-years',
    dietType: '' as '' | 'vegetarian' | 'vegetarian-eggs' | 'mixed',
    breastfeedingStatus: '' as '' | 'yes' | 'no' | 'not_applicable_unsure',
    complementaryMeals: '' as '' | 'none' | '1-2' | '3' | '3-and-snacks' | 'not_applicable_unsure',
    foodVariety: '' as '' | 'usually' | 'sometimes' | 'rarely',
    proteinFoods: '' as '' | 'daily_regularly' | 'sometimes' | 'rarely_never',
    fruitVegetableFrequency: '' as '' | 'daily' | 'sometimes' | 'rarely',
    honeyAwareness: '' as '' | 'yes' | 'no' | 'not_sure',
    chokingFoodPreparation: '' as '' | 'age_safe' | 'sometimes_unsafe' | 'needs_guidance',
    usualDrinks: '' as '' | 'milk_water' | 'sugary_drinks' | 'other_unsure',
    foodAllergies: '' as '' | 'no_known' | 'yes' | 'unsure',
    appetite: '' as '' | 'no_refusal' | 'sometimes' | 'frequently',
    growthConcern: '' as '' | 'no' | 'yes' | 'not_sure',
    foodGuidanceLanguage: 'en' as 'en' | 'kn' | 'hi',
  });

  const ageBandMonths: Record<Exclude<typeof formData.ageBand, ''>, number> = {
    '0-5': 3, '6-8': 7, '9-11': 10, '12-23': 18, '2-5-years': 42,
  };
  const totalMonths = formData.ageBand ? ageBandMonths[formData.ageBand] : 0;
  const getAgeKey = (m: number): string => {
    if (m < 6) return '0-6';
    if (m < 12) return '6-12';
    if (m < 24) return '12-24';
    if (m < 60) return '24-60';
    return '60-144';
  };

  const currentGuidance = AGE_GUIDANCE[getAgeKey(totalMonths)] || AGE_GUIDANCE['12-24'];
  const hindiGuidance: Record<string, { give: string[]; avoid: string[]; dentist: string[] }> = {
    '0-6': { give: ['पहले 6 महीने केवल माँ का दूध दें।', 'खिलाने के बाद मसूड़ों को साफ, नम मुलायम कपड़े से धीरे साफ करें।'], avoid: ['12 महीने से कम उम्र में शहद बिल्कुल न दें।', 'बोतल मुँह में रखकर बच्चे को न सुलाएँ।'], dentist: ['गालों में ऐसी सफेद परत दिखे जो पोंछने से न हटे।', 'बच्चे को दूध पीने में परेशानी हो।'] },
    '6-12': { give: ['6 महीने के बाद नरम, गाढ़े घर के बने पूरक आहार शुरू करें।', 'पूरक भोजन के साथ स्तनपान जारी रखें।'], avoid: ['12 महीने से पहले शहद न दें; अतिरिक्त नमक और चीनी से बचें।', 'साबुत मेवे, अंगूर या कठोर गोल टुकड़े न दें।'], dentist: ['पहला दाँत निकलने पर या एक वर्ष की उम्र तक दंत-जाँच कराएँ।', 'तेज बुखार या मसूड़ों से खून हो तो चिकित्सक से संपर्क करें।'] },
    '12-24': { give: ['दाल, अंडे, सब्ज़ियों और फल सहित विविध पारिवारिक भोजन दें।', 'दिन में दो बार फ्लोराइड टूथपेस्ट की थोड़ी मात्रा से दाँत साफ करें।'], avoid: ['चिपचिपी मिठाइयाँ और मीठे पेय सीमित करें।', 'बच्चे के पास तंबाकू का धुआँ या सुपारी का सेवन न करें।'], dentist: ['दाँतों पर सफेद/भूरे धब्बे या दर्द दिखे तो जाँच कराएँ।', 'बाल-दंत चिकित्सक से सलाह लें।'] },
    '24-60': { give: ['विविध घर का भोजन, दालें, अंडे और मौसमी फल-सब्ज़ियाँ दें।', 'बड़ों की निगरानी में दिन में दो बार दाँत साफ कराएँ।'], avoid: ['बार-बार चॉकलेट, टॉफी और मीठे पेय देने से बचें।', 'घर में बच्चे के पास पान, गुटखा या तंबाकू का उपयोग न करें।'], dentist: ['दाँत में कीड़ा, दर्द या दाँतों के बीच खाना फँसने पर जाँच कराएँ।', 'नियमित दंत-जाँच कराएँ।'] },
    '60-144': { give: ['पौष्टिक विविध भोजन और फल-सब्ज़ियाँ दें।', 'सुबह और रात दो मिनट तक दाँत साफ करने में मदद करें।'], avoid: ['तंबाकू, गुटखा, सुपारी और सिगरेट से दूर रखें।', 'मीठे पेय और अधिक चीनी वाले नाश्ते सीमित करें।'], dentist: ['टेढ़े दाँत, मसूड़ों से खून या लगातार मुँह के छाले हों।', 'दाँतों की नियमित जाँच कराएँ।'] },
  };
  const ageKey = getAgeKey(totalMonths);
  const foodGuidance = formData.foodGuidanceLanguage === 'hi'
    ? (hindiGuidance[ageKey] || hindiGuidance['12-24'])
    : formData.foodGuidanceLanguage === 'kn'
      ? { give: currentGuidance.giveKn, avoid: currentGuidance.avoidKn, dentist: currentGuidance.dentistKn }
      : { give: currentGuidance.giveEn, avoid: currentGuidance.avoidEn, dentist: currentGuidance.dentistEn };
  const guidanceLabels = formData.foodGuidanceLanguage === 'hi'
    ? { give: 'अनुशंसित भोजन और अभ्यास', avoid: 'किन चीज़ों से बचें', dentist: 'चिकित्सक से कब मिलें' }
    : formData.foodGuidanceLanguage === 'kn'
      ? { give: 'ಶಿಫಾರಸು ಮಾಡಿದ ಆಹಾರ ಮತ್ತು ಅಭ್ಯಾಸಗಳು', avoid: 'ತಪ್ಪಿಸಬೇಕಾದ ಆಹಾರ ಮತ್ತು ಅಭ್ಯಾಸಗಳು', dentist: 'ವೈದ್ಯರನ್ನು ಯಾವಾಗ ಸಂಪರ್ಕಿಸಬೇಕು' }
      : { give: 'Recommended Foods & Practices', avoid: 'Items & Habits to Avoid', dentist: 'When to Seek Dental Care' };
  const ageBandTitle = formData.foodGuidanceLanguage === 'hi'
    ? ({ '0-6': '0–5 महीने', '6-12': '6–11 महीने', '12-24': '12–23 महीने', '24-60': '2–5 वर्ष', '60-144': '6–12 वर्ष' }[ageKey])
    : formData.foodGuidanceLanguage === 'kn' ? currentGuidance.bandKn : currentGuidance.band;
  const nutritionTips: string[] = [];
  const addNutritionTip = (en: string, kn: string, hi: string) => {
    nutritionTips.push(formData.foodGuidanceLanguage === 'hi' ? hi : formData.foodGuidanceLanguage === 'kn' ? kn : en);
  };
  if (formData.foodVariety === 'rarely') addNutritionTip('Offer a variety of safe, age-appropriate foods over time.', 'ವಯಸ್ಸಿಗೆ ತಕ್ಕ ಸುರಕ್ಷಿತ ವಿವಿಧ ಆಹಾರಗಳನ್ನು ಕ್ರಮೇಣ ನೀಡಿ.', 'समय के साथ उम्र के अनुसार सुरक्षित और विविध भोजन दें।');
  if (formData.proteinFoods === 'rarely_never') addNutritionTip('Offer suitable protein foods such as dal, beans, eggs, fish or meat.', 'ದಾಲ್, ಬೀನ್ಸ್, ಮೊಟ್ಟೆ, ಮೀನು ಅಥವಾ ಮಾಂಸದಂತಹ ಸೂಕ್ತ ಪ್ರೋಟೀನ್ ಆಹಾರ ನೀಡಿ.', 'दाल, बीन्स, अंडे, मछली या मांस जैसे उपयुक्त प्रोटीन वाले भोजन दें।');
  if (formData.fruitVegetableFrequency === 'rarely') addNutritionTip('Offer vegetables and fruits daily in safe, age-appropriate forms.', 'ತರಕಾರಿಗಳು ಮತ್ತು ಹಣ್ಣುಗಳನ್ನು ಪ್ರತಿದಿನ ಸುರಕ್ಷಿತವಾಗಿ, ವಯಸ್ಸಿಗೆ ತಕ್ಕ ರೂಪದಲ್ಲಿ ನೀಡಿ.', 'सब्ज़ियाँ और फल रोज़ाना सुरक्षित, उम्र के अनुसार रूप में दें।');
  if (formData.complementaryMeals === 'none' && totalMonths >= 6) addNutritionTip('Discuss an age-appropriate complementary feeding routine with a health worker.', 'ವಯಸ್ಸಿಗೆ ತಕ್ಕ ಪೂರಕ ಆಹಾರ ಕ್ರಮದ ಬಗ್ಗೆ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಚರ್ಚಿಸಿ.', 'उम्र के अनुसार पूरक आहार की दिनचर्या पर स्वास्थ्य कार्यकर्ता से बात करें।');
  if (['0-5', '6-8', '9-11'].includes(formData.ageBand) && formData.honeyAwareness !== 'yes') addNutritionTip('Do not give honey to a child under 12 months.', '12 ತಿಂಗಳಿಗಿಂತ ಕಡಿಮೆ ವಯಸ್ಸಿನ ಮಗುವಿಗೆ ಜೇನುತುಪ್ಪ ನೀಡಬೇಡಿ.', '12 महीने से कम उम्र के बच्चे को शहद न दें।');
  if (formData.chokingFoodPreparation !== 'age_safe') addNutritionTip('Prepare foods to reduce choking risk; avoid whole or hard pieces and ask a health worker for age-specific guidance.', 'ಉಸಿರುಗಟ್ಟುವ ಅಪಾಯ ಕಡಿಮೆ ಮಾಡಲು ಆಹಾರವನ್ನು ತಯಾರಿಸಿ; ದೊಡ್ಡ ಅಥವಾ ಗಟ್ಟಿಯಾದ ತುಂಡುಗಳನ್ನು ತಪ್ಪಿಸಿ ಮತ್ತು ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರ ಸಲಹೆ ಪಡೆಯಿರಿ.', 'दम घुटने का जोखिम घटाने के लिए भोजन तैयार करें; साबुत या कठोर टुकड़ों से बचें और उम्र के अनुसार सलाह लें।');
  if (formData.usualDrinks === 'sugary_drinks') addNutritionTip('Offer water and age-appropriate milk; limit sugary drinks and packaged juice.', 'ನೀರು ಮತ್ತು ವಯಸ್ಸಿಗೆ ತಕ್ಕ ಹಾಲು ನೀಡಿ; ಸಿಹಿ ಪಾನೀಯ ಮತ್ತು ಪ್ಯಾಕ್ ಮಾಡಿದ ಜ್ಯೂಸ್ ಮಿತಿಗೊಳಿಸಿ.', 'पानी और उम्र के अनुसार दूध दें; मीठे पेय और पैकेट जूस सीमित रखें।');
  if (formData.foodAllergies === 'yes' || formData.foodAllergies === 'unsure') addNutritionTip('Discuss suspected food allergies with a qualified health professional before changing the child’s diet.', 'ಆಹಾರ ಅಲರ್ಜಿ ಶಂಕೆಯಿದ್ದರೆ ಆಹಾರಕ್ರಮ ಬದಲಿಸುವ ಮೊದಲು ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಚರ್ಚಿಸಿ.', 'खाद्य एलर्जी का संदेह हो तो आहार बदलने से पहले स्वास्थ्य विशेषज्ञ से बात करें।');
  if (formData.appetite === 'frequently' || formData.growthConcern === 'yes' || formData.growthConcern === 'not_sure') addNutritionTip('Discuss appetite or growth concerns with a health worker or paediatrician.', 'ಹಸಿವು ಅಥವಾ ಬೆಳವಣಿಗೆಯ ಚಿಂತೆಯನ್ನು ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು ಅಥವಾ ಮಕ್ಕಳ ವೈದ್ಯರೊಂದಿಗೆ ಚರ್ಚಿಸಿ.', 'भूख या वृद्धि की चिंता पर स्वास्थ्य कार्यकर्ता या बाल-चिकित्सक से बात करें।');
  const ageBandLabel: Record<Exclude<typeof formData.ageBand, ''>, string> = {
    '0-5': '0–5 months', '6-8': '6–8 months', '9-11': '9–11 months', '12-23': '12–23 months', '2-5-years': '2–5 years',
  };
  const selectQuestion = <K extends keyof typeof formData,>(key: K, label: string, options: { value: (typeof formData)[K]; label: string }[]) => (
    <div><label htmlFor={String(key)} className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{label}</label>
      <select id={String(key)} className="input-field" value={String(formData[key])} onChange={(event) => setFormData((current) => ({ ...current, [key]: event.target.value as (typeof formData)[K] }))} required>
        <option value="">Select an answer</option>{options.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
      </select>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ageBand) {
      showToast('Please select the child age group.', 'error');
      return;
    }

    try {
      const newRec: ChildScreening = {
        id: 'child_' + Date.now(),
        childName: formData.childName.trim() || 'Child',
        caregiverName: formData.caregiverName.trim() || 'Caregiver',
        ageMonths: totalMonths,
        ageBand: formData.ageBand,
        dietType: formData.dietType || undefined,
        breastfeedingStatus: formData.breastfeedingStatus || undefined,
        complementaryMeals: formData.complementaryMeals || undefined,
        foodVariety: formData.foodVariety || undefined,
        proteinFoods: formData.proteinFoods || undefined,
        fruitVegetableFrequency: formData.fruitVegetableFrequency || undefined,
        honeyAwareness: formData.honeyAwareness || undefined,
        chokingFoodPreparation: formData.chokingFoodPreparation || undefined,
        usualDrinks: formData.usualDrinks || undefined,
        foodAllergies: formData.foodAllergies || undefined,
        appetite: formData.appetite || undefined,
        growthConcern: formData.growthConcern || undefined,
        foodGuidanceLanguage: formData.foodGuidanceLanguage,
        createdAt: new Date(),
      };

      await db.childScreenings.add(newRec);
      setSubmitted(true);
      showToast('Gram Sethu child nutrition guidance saved.', 'success');
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
                {t('childCareTitle')}
              </h2>
              <p className="text-xs text-gray-500">{t('childCareSubtitle')}</p>
            </div>
          </div>
          <ReadAloudBtn
            text={
              lang === 'kn'
                ? 'ಗ್ರಾಮ ಸೇತು - ಮಕ್ಕಳ ಮತ್ತು ಪೌಷ್ಟಿಕ ಆರೈಕೆ ಪ್ರಶ್ನಾವಳಿ.'
                : 'Gram Sethu - Child & Nutrition Care Questionnaire.'
            }
          />
        </div>

        {!submitted ? (
          /* QUESTIONNAIRE FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">Section 1: Child's information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold mb-1">Child's name (optional)</label><input className="input-field" value={formData.childName} onChange={(event) => setFormData({ ...formData, childName: event.target.value })} /></div>
                <div><label className="block text-sm font-semibold mb-1">Caregiver's name (optional)</label><input className="input-field" value={formData.caregiverName} onChange={(event) => setFormData({ ...formData, caregiverName: event.target.value })} /></div>
              </div>
              {selectQuestion('ageBand', "1. Child's age", [{ value: '0-5', label: '0–5 months' }, { value: '6-8', label: '6–8 months' }, { value: '9-11', label: '9–11 months' }, { value: '12-23', label: '12–23 months' }, { value: '2-5-years', label: '2–5 years' }])}
              {selectQuestion('dietType', '2. What type of diet does the child follow?', [{ value: 'vegetarian', label: 'Vegetarian' }, { value: 'vegetarian-eggs', label: 'Vegetarian with eggs' }, { value: 'mixed', label: 'Mixed diet (meat or fish included)' }])}
              {selectQuestion('breastfeedingStatus', '3. Is the child currently breastfed?', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_applicable_unsure', label: 'Not applicable / unsure' }])}
            </Card>
            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">Section 2: Daily food habits</h3>
              {selectQuestion('complementaryMeals', '4. How many complementary meals does the child eat daily? (For children 6 months or older)', [{ value: 'none', label: 'None' }, { value: '1-2', label: '1–2 meals' }, { value: '3', label: '3 meals' }, { value: '3-and-snacks', label: '3 meals and snacks' }, { value: 'not_applicable_unsure', label: 'Not applicable / unsure' }])}
              {selectQuestion('foodVariety', '5. Does the child eat a variety of age-appropriate foods?', [{ value: 'usually', label: 'Usually' }, { value: 'sometimes', label: 'Sometimes' }, { value: 'rarely', label: 'Rarely' }])}
              {selectQuestion('proteinFoods', '6. Does the child eat protein-rich foods such as dal, beans, eggs, fish or meat, as appropriate?', [{ value: 'daily_regularly', label: 'Daily or regularly' }, { value: 'sometimes', label: 'Sometimes' }, { value: 'rarely_never', label: 'Rarely or never' }])}
              {selectQuestion('fruitVegetableFrequency', '7. Does the child eat vegetables and fruits?', [{ value: 'daily', label: 'Daily' }, { value: 'sometimes', label: 'Sometimes' }, { value: 'rarely', label: 'Rarely' }])}
            </Card>
            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">Section 3: Food safety awareness</h3>
              {selectQuestion('honeyAwareness', '8. Does the caregiver know that honey must not be given to babies under 12 months?', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: 'Not sure' }])}
              {selectQuestion('chokingFoodPreparation', '9. How are foods that may cause choking prepared for the child?', [{ value: 'age_safe', label: "Prepared safely for the child's age" }, { value: 'sometimes_unsafe', label: 'Sometimes given whole or in hard pieces' }, { value: 'needs_guidance', label: 'Caregiver needs guidance' }])}
              {selectQuestion('usualDrinks', '10. What does the child usually drink?', [{ value: 'milk_water', label: 'Breast milk or age-appropriate milk and water' }, { value: 'sugary_drinks', label: 'Sugary drinks or packaged juice frequently' }, { value: 'other_unsure', label: 'Other / unsure' }])}
            </Card>
            <Card className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">Section 4: Health and nutrition concerns</h3>
              {selectQuestion('foodAllergies', '11. Does the child have any known or suspected food allergies?', [{ value: 'no_known', label: 'No known allergies' }, { value: 'yes', label: 'Yes' }, { value: 'unsure', label: 'Unsure' }])}
              {selectQuestion('appetite', '12. Does the child frequently refuse food or have a poor appetite?', [{ value: 'no_refusal', label: 'No' }, { value: 'sometimes', label: 'Sometimes' }, { value: 'frequently', label: 'Frequently' }])}
              {selectQuestion('growthConcern', "13. Has a health worker raised concerns about the child's weight or growth?", [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'not_sure', label: 'Not sure' }])}
            </Card>
            <Card>{selectQuestion('foodGuidanceLanguage', 'Preferred language for the food guidance', [{ value: 'en', label: 'English' }, { value: 'kn', label: 'Kannada' }, { value: 'hi', label: 'Hindi' }])}</Card>
            <button type="submit" className="btn-primary w-full py-3 text-sm shadow-md flex items-center justify-center gap-2"><Sparkles size={16} />Generate Gram Sethu Guidance</button>
          </form>
        ) : (
          /* GUIDANCE VIEW */
          <div className="space-y-4 animate-fade-in">
            {/* Age Band Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-100 block">
                  {formData.childName.trim() || 'Child'} ({formData.ageBand ? ageBandLabel[formData.ageBand] : ''})
                </span>
                <h3 className="text-base font-bold">
                  {ageBandTitle}
                </h3>
              </div>
              <Smile size={32} className="text-pink-100" />
            </div>

            {nutritionTips.length > 0 && (
              <Card className="space-y-2 border-l-4 border-l-amber-500">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {formData.foodGuidanceLanguage === 'hi' ? 'आपके जवाबों के अनुसार सुझाव' : formData.foodGuidanceLanguage === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರಗಳ ಆಧಾರದ ಸಲಹೆಗಳು' : 'Tips based on your answers'}
                </h3>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                  {nutritionTips.map((tip) => <li key={tip} className="flex gap-2"><span className="text-amber-600">•</span><span>{tip}</span></li>)}
                </ul>
              </Card>
            )}

            {/* Encourage follow-up for reported health concerns */}
            {(formData.foodAllergies === 'yes' || formData.appetite === 'frequently' || formData.growthConcern === 'yes') && (
              <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200">
                <AlertTriangle size={18} className="shrink-0 text-red-600" />
                <div>
                  <span className="font-bold block">{t('redFlag')}</span>
                  <span>
                    {formData.foodGuidanceLanguage === 'hi'
                      ? 'एलर्जी, भूख या वृद्धि को लेकर चिंता हो तो बच्चे के स्वास्थ्य कार्यकर्ता या बाल-चिकित्सक से सलाह लें।'
                      : formData.foodGuidanceLanguage === 'kn'
                        ? 'ಆಹಾರ ಅಲರ್ಜಿ, ಹಸಿವು ಅಥವಾ ಬೆಳವಣಿಗೆಯ ಬಗ್ಗೆ ಚಿಂತೆ ಇದ್ದರೆ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು ಅಥವಾ ಮಕ್ಕಳ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                        : 'If there are concerns about allergies, appetite or growth, discuss them with a health worker or paediatrician.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1. WHAT TO GIVE */}
            <Card className="space-y-2 border-l-4 border-l-green-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {guidanceLabels.give}
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {foodGuidance.give.map((item, i) => (
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
                  {guidanceLabels.avoid}
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {foodGuidance.avoid.map((item, i) => (
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
                  {guidanceLabels.dentist}
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                {foodGuidance.dentist.map((item, i) => (
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
