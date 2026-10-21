import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { triageOral } from './oralTriage.js';

// Kannada and Hindi clinical wording must be reviewed by native-speaking clinicians before use.
const copy = {
  en: {
    title: 'Oral screening',
    banner:
      'Screening aid only. Not a diagnosis. Any suspicious finding needs clinical examination by a dentist/doctor; biopsy is the only way to confirm.',
    age: 'Age band',
    sex: 'Sex',
    village: 'Village / PHC',
    consent: 'I explained this screening aid and received consent.',
    habits: 'Risk habits',
    times: 'Times/day',
    years: 'Years',
    placement: 'Habit placement (cheek/lip groove, same side)',
    symptoms: 'Symptoms reported',
    exam: 'Examination by site',
    site: 'Site',
    finding: 'Finding',
    size: 'Lesion size',
    ulcer: 'Ulcer present more than 2 weeks',
    mouth: 'Mouth opening',
    neck: 'Firm, non-tender neck node',
    photo: 'Optional lesion photo (local preview only; not uploaded, stored or analysed)',
    guidance: 'Use even light and hold steady; photo is for documentation/referral only.',
    run: 'Save screening and show triage',
    why: 'Why this result',
    absence: 'Absence of findings does not rule out disease.',
    counsel: 'Counselling',
    mirror:
      'Check your mouth regularly in a mirror for white or red patches, ulcers not healing after 2 weeks, or difficulty opening your mouth. Tobacco and areca nut can harm the mouth. Ask a health worker about quitting support.',
    danger: 'Warning signs that need clinical assessment',
    log: 'Oral log',
    dashboard: 'Village summary',
    outcome: 'Specialist outcome',
    status: 'Referral status',
    save: 'Save follow-up',
    small: 'Small counts are unreliable.',
    routine: 'Routine',
    high_risk: 'High-risk habit',
    refer: 'Refer',
    urgent: 'URGENT referral',
    normal: 'Normal',
    habitsList: [
      ['smokeless', 'Smokeless tobacco (gutka, khaini, zarda, tobacco with paan)'],
      ['quid', 'Betel quid / paan with or without tobacco'],
      ['areca', 'Areca nut (supari) alone'],
      ['smoking', 'Smoking (beedi, cigarette)'],
      ['alcohol', 'Alcohol'],
    ],
    symptomsList: [
      ['ulcer_over_2_weeks', 'Mouth ulcer not healing for more than 2 weeks'],
      ['white_patch', 'Persistent white patch'],
      ['red_patch', 'Persistent red patch'],
      ['burning', 'Burning/pain with spicy food'],
      ['opening', 'Difficulty opening mouth'],
      ['swallowing', 'Difficulty or pain swallowing/chewing'],
      ['voice', 'Voice change or persistent hoarseness'],
      ['teeth', 'Loosening of teeth without cause'],
      ['bleeding', 'Unexplained bleeding'],
      ['lump', 'Lump in mouth or neck'],
      ['numbness', 'Numbness'],
    ],
    sites: [
      'Cheek/buccal mucosa left',
      'Cheek/buccal mucosa right',
      'Lower lip/labial mucosa',
      'Tongue lateral',
      'Tongue dorsal',
      'Tongue ventral',
      'Floor of mouth',
      'Gingiva/alveolus',
      'Palate',
      'Retromolar area',
    ],
    types: [
      ['normal', 'Normal'],
      ['white', 'White patch (leukoplakia-like)'],
      ['red', 'Red patch (erythroplakia-like)'],
      ['mixed', 'Mixed red-white patch'],
      ['ulcer', 'Ulcer'],
      ['lump', 'Lump or growth'],
      ['fibrous', 'Fibrous bands or blanching (submucous fibrosis-like)'],
      ['other', 'Other'],
    ],
    sizes: [
      ['lt1', '< 1 cm'],
      ['1to2', '1–2 cm'],
      ['gt2', '> 2 cm'],
    ],
    dangerSigns:
      'Non-healing ulcer >2 weeks · red/mixed patch · lump/growth · lesion >2 cm · firm neck node · unexplained bleeding or numbness · swallowing difficulty',
  },
  hi: {
    title: 'मुंह की जांच',
    banner:
      'केवल स्क्रीनिंग सहायता। निदान नहीं। किसी भी संदिग्ध संकेत की दंत चिकित्सक/डॉक्टर से जांच जरूरी है; पुष्टि केवल बायोप्सी से होती है।',
    age: 'आयु वर्ग',
    sex: 'लिंग',
    village: 'गाँव / PHC',
    consent: 'मैंने जांच सहायता समझाई और सहमति ली।',
    habits: 'जोखिम वाली आदतें',
    times: 'बार/दिन',
    years: 'वर्ष',
    placement: 'इस जगह आदत से पदार्थ रखते हैं',
    symptoms: 'बताए गए लक्षण',
    exam: 'जगह के अनुसार जांच',
    site: 'जगह',
    finding: 'निशान',
    size: 'निशान का आकार',
    ulcer: 'छाला 2 सप्ताह से अधिक',
    mouth: 'मुंह खुलना',
    neck: 'गर्दन में सख्त, बिना दर्द की गांठ',
    photo: 'वैकल्पिक फोटो (केवल स्थानीय पूर्वावलोकन; न अपलोड, न सहेजी, न जांची जाती है)',
    guidance: 'समान रोशनी में स्थिर फोटो लें; केवल दस्तावेज़/रेफरल के लिए।',
    run: 'जांच सहेजें और सुझाव देखें',
    why: 'इस नतीजे का कारण',
    absence: 'निशान न दिखने से बीमारी खारिज नहीं होती।',
    counsel: 'सलाह',
    mirror:
      'आईने में सफेद/लाल धब्बे, 2 सप्ताह में न भरने वाले छाले या मुंह खोलने में कठिनाई देखें। तंबाकू और सुपारी मुंह को नुकसान पहुंचा सकते हैं। छोड़ने में मदद के लिए स्वास्थ्यकर्मी से पूछें।',
    danger: 'चिकित्सकीय जांच जरूरी करने वाले संकेत',
    log: 'मुंह जांच रिकॉर्ड',
    dashboard: 'गाँव सारांश',
    outcome: 'विशेषज्ञ का नतीजा',
    status: 'रेफरल स्थिति',
    save: 'फॉलो-अप सहेजें',
    small: 'कम संख्या अविश्वसनीय है।',
    routine: 'नियमित',
    high_risk: 'अधिक जोखिम आदत',
    refer: 'रेफरल',
    urgent: 'तत्काल रेफरल',
    normal: 'सामान्य',
    habitsList: [
      ['smokeless', 'धुआं रहित तंबाकू'],
      ['quid', 'तंबाकू सहित/बिना पान'],
      ['areca', 'सुपारी'],
      ['smoking', 'बीड़ी/सिगरेट'],
      ['alcohol', 'शराब'],
    ],
    symptomsList: [
      ['ulcer_over_2_weeks', '2 सप्ताह से अधिक का छाला'],
      ['white_patch', 'सफेद धब्बा'],
      ['red_patch', 'लाल धब्बा'],
      ['burning', 'मसाले से जलन/दर्द'],
      ['opening', 'मुंह खोलने में कठिनाई'],
      ['swallowing', 'निगलने/चबाने में कठिनाई'],
      ['voice', 'आवाज़ में बदलाव'],
      ['teeth', 'बिना कारण दांत हिलना'],
      ['bleeding', 'बिना कारण खून'],
      ['lump', 'मुंह/गर्दन में गांठ'],
      ['numbness', 'सुन्नपन'],
    ],
    sites: [
      'बायां गाल',
      'दायां गाल',
      'निचला होंठ',
      'जीभ किनारा',
      'जीभ ऊपर',
      'जीभ नीचे',
      'मुंह का तल',
      'मसूड़ा',
      'तालू',
      'पीछे का दाढ़ क्षेत्र',
    ],
    types: [
      ['normal', 'सामान्य'],
      ['white', 'सफेद धब्बा'],
      ['red', 'लाल धब्बा'],
      ['mixed', 'लाल-सफेद धब्बा'],
      ['ulcer', 'छाला'],
      ['lump', 'गांठ/वृद्धि'],
      ['fibrous', 'कठोर पट्टी/सफेदी'],
      ['other', 'अन्य'],
    ],
    sizes: [
      ['lt1', '<1 सेमी'],
      ['1to2', '1–2 सेमी'],
      ['gt2', '>2 सेमी'],
    ],
    dangerSigns:
      '2 सप्ताह से पुराना छाला · लाल/मिला धब्बा · गांठ · >2 सेमी निशान · गर्दन की गांठ · खून/सुन्नपन · निगलने में कठिनाई',
  },
  kn: {
    title: 'ಬಾಯಿ ತಪಾಸಣೆ',
    banner:
      'ತಪಾಸಣೆಗೆ ಮಾತ್ರದ ಸಹಾಯ. ರೋಗನಿರ್ಣಯವಲ್ಲ. ಅನುಮಾನಾಸ್ಪದ ಕಂಡುಬಂದರೆ ದಂತವೈದ್ಯರು/ವೈದ್ಯರ ಪರೀಕ್ಷೆ ಅಗತ್ಯ; ಬಯಾಪ್ಸಿ ಮಾತ್ರ ದೃಢಪಡಿಸುತ್ತದೆ.',
    age: 'ವಯಸ್ಸಿನ ಗುಂಪು',
    sex: 'ಲಿಂಗ',
    village: 'ಗ್ರಾಮ / PHC',
    consent: 'ಈ ತಪಾಸಣೆಯ ಬಗ್ಗೆ ತಿಳಿಸಿ ಒಪ್ಪಿಗೆ ಪಡೆದಿದ್ದೇನೆ.',
    habits: 'ಅಪಾಯದ ಅಭ್ಯಾಸಗಳು',
    times: 'ದಿನಕ್ಕೆ ಬಾರಿ',
    years: 'ವರ್ಷ',
    placement: 'ಈ ಸ್ಥಳದಲ್ಲಿ ಅಭ್ಯಾಸದ ವಸ್ತು ಇಡುತ್ತಾರೆ',
    symptoms: 'ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳು',
    exam: 'ಸ್ಥಳದ ಪ್ರಕಾರ ಪರೀಕ್ಷೆ',
    site: 'ಸ್ಥಳ',
    finding: 'ಕಂಡದ್ದು',
    size: 'ಗಾಯದ ಗಾತ್ರ',
    ulcer: '2 ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಹುಣ್ಣು',
    mouth: 'ಬಾಯಿ ತೆರೆಯುವಿಕೆ',
    neck: 'ಗಟ್ಟಿಯಾದ, ನೋವಿಲ್ಲದ ಕುತ್ತಿಗೆಯ ಗಡ್ಡೆ',
    photo: 'ಐಚ್ಛಿಕ ಚಿತ್ರ (ಸ್ಥಳೀಯ ಪೂರ್ವವೀಕ್ಷಣೆ ಮಾತ್ರ; ಅಪ್‌ಲೋಡ್/ಉಳಿಕೆ/ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲ)',
    guidance: 'ಸಮ ಬೆಳಕಿನಲ್ಲಿ ಸ್ಥಿರವಾಗಿ ಹಿಡಿಯಿರಿ; ದಾಖಲೆ/ರೆಫರಲ್‌ಗೆ ಮಾತ್ರ.',
    run: 'ತಪಾಸಣೆ ಉಳಿಸಿ ಮತ್ತು ಫಲಿತಾಂಶ ನೋಡಿ',
    why: 'ಈ ಫಲಿತಾಂಶದ ಕಾರಣ',
    absence: 'ಕಂಡುಬರದಿರುವುದು ರೋಗವಿಲ್ಲವೆಂದು ಖಚಿತಪಡಿಸುವುದಿಲ್ಲ.',
    counsel: 'ಸಲಹೆ',
    mirror:
      'ಕನ್ನಡಿಯಲ್ಲಿ ಬಿಳಿ/ಕೆಂಪು ಕಲೆ, 2 ವಾರದಲ್ಲಿ ಗುಣವಾಗದ ಹುಣ್ಣು, ಬಾಯಿ ತೆರೆಯಲು ತೊಂದರೆ ಇದೆಯೇ ನೋಡಿ. ತಂಬಾಕು ಮತ್ತು ಅಡಿಕೆ ಬಾಯಿಗೆ ಹಾನಿ ಮಾಡಬಹುದು. ಬಿಡಲು ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರ ಸಹಾಯ ಕೇಳಿ.',
    danger: 'ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಅಗತ್ಯದ ಎಚ್ಚರಿಕೆಗಳು',
    log: 'ಬಾಯಿ ತಪಾಸಣೆ ದಾಖಲೆ',
    dashboard: 'ಗ್ರಾಮದ ಸಾರಾಂಶ',
    outcome: 'ತಜ್ಞರ ಫಲಿತಾಂಶ',
    status: 'ರೆಫರಲ್ ಸ್ಥಿತಿ',
    save: 'ಮುಂದಿನ ಮಾಹಿತಿ ಉಳಿಸಿ',
    small: 'ಕಡಿಮೆ ಸಂಖ್ಯೆಗಳು ವಿಶ್ವಾಸಾರ್ಹವಲ್ಲ.',
    routine: 'ಸಾಮಾನ್ಯ',
    high_risk: 'ಅಪಾಯದ ಅಭ್ಯಾಸ',
    refer: 'ರೆಫರ್',
    urgent: 'ತುರ್ತು ರೆಫರಲ್',
    normal: 'ಸಾಮಾನ್ಯ',
    habitsList: [
      ['smokeless', 'ಹೊಗೆರಹಿತ ತಂಬಾಕು'],
      ['quid', 'ತಂಬಾಕು ಇರುವ/ಇಲ್ಲದ ಪಾನ್'],
      ['areca', 'ಅಡಿಕೆ'],
      ['smoking', 'ಬೀಡಿ/ಸಿಗರೇಟ್'],
      ['alcohol', 'ಮದ್ಯ'],
    ],
    symptomsList: [
      ['ulcer_over_2_weeks', '2 ವಾರಕ್ಕೂ ಹೆಚ್ಚು ಹುಣ್ಣು'],
      ['white_patch', 'ಬಿಳಿ ಕಲೆ'],
      ['red_patch', 'ಕೆಂಪು ಕಲೆ'],
      ['burning', 'ಖಾರದ ಆಹಾರದಿಂದ ಉರಿ/ನೋವು'],
      ['opening', 'ಬಾಯಿ ತೆರೆಯಲು ತೊಂದರೆ'],
      ['swallowing', 'ನುಂಗಲು/ಅಗಿಯಲು ತೊಂದರೆ'],
      ['voice', 'ಧ್ವನಿ ಬದಲಾವಣೆ'],
      ['teeth', 'ಕಾರಣವಿಲ್ಲದೆ ಹಲ್ಲು ಅಲುಗಾಡುವುದು'],
      ['bleeding', 'ಕಾರಣವಿಲ್ಲದ ರಕ್ತಸ್ರಾವ'],
      ['lump', 'ಬಾಯಿ/ಕುತ್ತಿಗೆ ಗಡ್ಡೆ'],
      ['numbness', 'ಮರಗಟ್ಟುವಿಕೆ'],
    ],
    sites: [
      'ಎಡ ಕೆನ್ನೆ',
      'ಬಲ ಕೆನ್ನೆ',
      'ಕೆಳ ತುಟಿ',
      'ನಾಲಿಗೆಯ ಬದಿ',
      'ನಾಲಿಗೆಯ ಮೇಲ್ಭಾಗ',
      'ನಾಲಿಗೆಯ ಕೆಳಭಾಗ',
      'ಬಾಯಿಯ ತಳ',
      'ಒಸಡು',
      'ಅಂಗುಳ',
      'ಹಿಂಬದಿ ಹಲ್ಲಿನ ಭಾಗ',
    ],
    types: [
      ['normal', 'ಸಾಮಾನ್ಯ'],
      ['white', 'ಬಿಳಿ ಕಲೆ'],
      ['red', 'ಕೆಂಪು ಕಲೆ'],
      ['mixed', 'ಕೆಂಪು-ಬಿಳಿ ಕಲೆ'],
      ['ulcer', 'ಹುಣ್ಣು'],
      ['lump', 'ಗಡ್ಡೆ/ಬೆಳವಣಿಗೆ'],
      ['fibrous', 'ನಾರುಪಟ್ಟಿ/ಬಿಳಿಚುವಿಕೆ'],
      ['other', 'ಇತರೆ'],
    ],
    sizes: [
      ['lt1', '<1 ಸೆಂ.ಮೀ.'],
      ['1to2', '1–2 ಸೆಂ.ಮೀ.'],
      ['gt2', '>2 ಸೆಂ.ಮೀ.'],
    ],
    dangerSigns:
      '2 ವಾರಕ್ಕಿಂತ ಹಳೆಯ ಹುಣ್ಣು · ಕೆಂಪು/ಮಿಶ್ರ ಕಲೆ · ಗಡ್ಡೆ · >2 ಸೆಂ.ಮೀ. ಗಾಯ · ಕುತ್ತಿಗೆ ಗಡ್ಡೆ · ರಕ್ತ/ಮರಗಟ್ಟುವಿಕೆ · ನುಂಗಲು ತೊಂದರೆ',
  },
};
const extra = {
  en: {
    persistent: 'Persistent',
    nonWipe: 'Does not rub off',
    normalOpening: '3 or more fingers / not reduced',
    reducedOpening: 'Fewer than 3 fingers / reduced',
    copy: 'Copy',
    print: 'Print',
    read: 'Read aloud',
    female: 'Female',
    male: 'Male',
    other: 'Other',
    prefer: 'Prefer not to say',
    referred: 'Referred',
    attended: 'Attended',
    notAttended: 'Not attended',
    outcomes: ['Normal', 'OPMD confirmed', 'Dysplasia', 'Malignancy', 'Other'],
    exposure: 'Habit exposure indicator (times/day × years; counselling only)',
    follow: {
      urgent: 'Prompt clinical evaluation by a doctor, dentist, or oral surgeon.',
      refer: 'Arrange dental or medical evaluation.',
      high_risk: 'Counselling and re-screening every 3–6 months.',
      routine: 'Routine care; re-screen annually if habit history develops.',
    },
  },
  hi: {
    persistent: 'लगातार',
    nonWipe: 'रगड़ने से नहीं मिटता',
    normalOpening: '3 या अधिक उंगली / कम नहीं',
    reducedOpening: '3 से कम उंगली / मुंह कम खुलना',
    copy: 'कॉपी करें',
    print: 'प्रिंट',
    read: 'आवाज़ में सुनें',
    female: 'महिला',
    male: 'पुरुष',
    other: 'अन्य',
    prefer: 'बताना नहीं चाहते',
    referred: 'रेफर किया',
    attended: 'जांच के लिए गए',
    notAttended: 'नहीं गए',
    outcomes: ['सामान्य', 'OPMD की पुष्टि', 'डिस्प्लेसिया', 'कैंसर', 'अन्य'],
    exposure: 'आदत का संकेत (बार/दिन × वर्ष; केवल सलाह के लिए)',
    follow: {
      urgent: 'डॉक्टर, दंत चिकित्सक या ओरल सर्जन से शीघ्र जांच कराएं।',
      refer: 'दंत चिकित्सक या डॉक्टर से जांच कराएं।',
      high_risk: 'सलाह लें और हर 3–6 महीने में फिर जांच कराएं।',
      routine: 'नियमित देखभाल; आदत होने पर हर साल फिर जांच कराएं।',
    },
  },
  kn: {
    persistent: 'ನಿರಂತರ',
    nonWipe: 'ಉಜ್ಜಿದರೂ ಹೋಗುವುದಿಲ್ಲ',
    normalOpening: '3 ಅಥವಾ ಹೆಚ್ಚು ಬೆರಳು / ಕಡಿಮೆಯಿಲ್ಲ',
    reducedOpening: '3 ಕ್ಕಿಂತ ಕಡಿಮೆ ಬೆರಳು / ಬಾಯಿ ಕಡಿಮೆ ತೆರೆಯುತ್ತದೆ',
    copy: 'ನಕಲಿಸಿ',
    print: 'ಮುದ್ರಿಸಿ',
    read: 'ಓದಿ ಕೇಳಿಸಿ',
    female: 'ಮಹಿಳೆ',
    male: 'ಪುರುಷ',
    other: 'ಇತರೆ',
    prefer: 'ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ',
    referred: 'ರೆಫರ್ ಮಾಡಲಾಗಿದೆ',
    attended: 'ಪರೀಕ್ಷೆಗೆ ಹಾಜರಾದರು',
    notAttended: 'ಹಾಜರಾಗಿಲ್ಲ',
    outcomes: ['ಸಾಮಾನ್ಯ', 'OPMD ದೃಢಪಟ್ಟಿದೆ', 'ಡಿಸ್ಪ್ಲಾಸಿಯಾ', 'ಕ್ಯಾನ್ಸರ್', 'ಇತರೆ'],
    exposure: 'ಅಭ್ಯಾಸದ ಸೂಚಕ (ಬಾರಿ/ದಿನ × ವರ್ಷ; ಸಲಹೆಗೆ ಮಾತ್ರ)',
    follow: {
      urgent: 'ವೈದ್ಯರು, ದಂತವೈದ್ಯರು ಅಥವಾ ಓರಲ್ ಸರ್ಜನ್‌ರನ್ನು ಶೀಘ್ರ ಭೇಟಿ ಮಾಡಿ.',
      refer: 'ದಂತವೈದ್ಯರು ಅಥವಾ ವೈದ್ಯರಿಂದ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.',
      high_risk: 'ಸಲಹೆ ಪಡೆದು ಪ್ರತಿ 3–6 ತಿಂಗಳಿಗೆ ಮರುತಪಾಸಣೆ ಮಾಡಿ.',
      routine: 'ಸಾಮಾನ್ಯ ಆರೈಕೆ; ಅಭ್ಯಾಸವಿದ್ದರೆ ವರ್ಷಕ್ಕೊಮ್ಮೆ ಮರುತಪಾಸಣೆ.',
    },
  },
};
// Rule phrasing is translated for the field interface; clinical translations require local clinician review.
const ruleLabels = {
  en: {
    ulcer_over_2_weeks: 'Ulcer present for more than 2 weeks',
    lump_or_growth: 'Lump or growth found',
    red_patch: 'Red patch found',
    mixed_patch: 'Mixed red-white patch found',
    lesion_over_2cm: 'Lesion larger than 2 cm',
    firm_neck_node: 'Firm neck node reported',
    persistent_white_patch: 'White patch persists or does not rub off',
    possible_fibrosis: 'Fibrous bands or reduced mouth opening',
    lesion_at_habit_site: 'Finding at a habit-placement site',
    symptom_bleeding: 'Unexplained bleeding',
    symptom_numbness: 'Unexplained numbness',
    symptom_swallowing: 'Unexplained swallowing difficulty',
    symptom_ulcer_over_2_weeks: 'Patient reports a non-healing ulcer for more than 2 weeks',
    burning_with_habit: 'Burning with spicy food and habit history',
    habit_no_visible_lesion: 'Habit history without a suspicious finding',
    no_suspicious_finding: 'No suspicious finding recorded',
  },
  hi: {
    ulcer_over_2_weeks: '2 सप्ताह से अधिक का छाला',
    lump_or_growth: 'मुंह या गर्दन में गांठ',
    red_patch: 'लाल धब्बा',
    mixed_patch: 'लाल-सफेद मिला धब्बा',
    lesion_over_2cm: '2 सेमी से बड़ा निशान',
    firm_neck_node: 'गर्दन में सख्त गांठ',
    persistent_white_patch: 'सफेद धब्बा बना रहता है या रगड़ने से नहीं मिटता',
    possible_fibrosis: 'कठोर पट्टी या मुंह खोलने में कमी',
    lesion_at_habit_site: 'आदत वाली जगह पर निशान',
    symptom_bleeding: 'बिना कारण खून',
    symptom_numbness: 'बिना कारण सुन्नपन',
    symptom_swallowing: 'निगलने में कठिनाई',
    symptom_ulcer_over_2_weeks: '2 सप्ताह से अधिक का न भरने वाला छाला',
    burning_with_habit: 'आदत के साथ मसाले से जलन',
    habit_no_visible_lesion: 'आदत है, संदिग्ध निशान नहीं दिखा',
    no_suspicious_finding: 'संदिग्ध निशान दर्ज नहीं हुआ',
  },
  kn: {
    ulcer_over_2_weeks: '2 ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಇರುವ ಹುಣ್ಣು',
    lump_or_growth: 'ಬಾಯಿ ಅಥವಾ ಕುತ್ತಿಗೆಯಲ್ಲಿ ಗಡ್ಡೆ',
    red_patch: 'ಕೆಂಪು ಕಲೆ',
    mixed_patch: 'ಕೆಂಪು-ಬಿಳಿ ಮಿಶ್ರ ಕಲೆ',
    lesion_over_2cm: '2 ಸೆಂ.ಮೀ.ಗಿಂತ ದೊಡ್ಡ ಗಾಯ',
    firm_neck_node: 'ಕುತ್ತಿಗೆಯಲ್ಲಿ ಗಟ್ಟಿ ಗಡ್ಡೆ',
    persistent_white_patch: 'ಬಿಳಿ ಕಲೆ ಉಳಿದಿದೆ ಅಥವಾ ಉಜ್ಜಿದರೂ ಹೋಗುವುದಿಲ್ಲ',
    possible_fibrosis: 'ನಾರುಪಟ್ಟಿ ಅಥವಾ ಬಾಯಿ ತೆರೆಯುವಿಕೆ ಕಡಿಮೆ',
    lesion_at_habit_site: 'ಅಭ್ಯಾಸದ ಸ್ಥಳದಲ್ಲಿ ಕಂಡದ್ದು',
    symptom_bleeding: 'ಕಾರಣವಿಲ್ಲದ ರಕ್ತಸ್ರಾವ',
    symptom_numbness: 'ಕಾರಣವಿಲ್ಲದ ಮರಗಟ್ಟುವಿಕೆ',
    symptom_swallowing: 'ನುಂಗಲು ತೊಂದರೆ',
    symptom_ulcer_over_2_weeks: '2 ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಗುಣವಾಗದ ಹುಣ್ಣು',
    burning_with_habit: 'ಅಭ್ಯಾಸದೊಂದಿಗೆ ಖಾರದಿಂದ ಉರಿ',
    habit_no_visible_lesion: 'ಅಭ್ಯಾಸ ಇದೆ, ಅನುಮಾನಾಸ್ಪದ ಗಾಯ ಕಾಣಲಿಲ್ಲ',
    no_suspicious_finding: 'ಅನುಮಾನಾಸ್ಪದ ಕಂಡುಬಂದಿಲ್ಲ',
  },
};
const uiText = {
  en: {
    mouthNote: 'Demonstrative threshold: fewer than about 3 fingers or reduced opening.',
    measure: 'Opening measurement',
    fingers: 'Finger-breadths',
    mm: 'Millimetres',
    activeHabits: 'active habit(s)',
    noRecords: 'No oral screenings recorded.',
    screened: 'screened',
    habitHistory: 'Habit history',
    urgentCount: 'Urgent',
    referCount: 'Refer',
    highCount: 'High risk',
    routineCount: 'Routine',
    attendance: 'Referral attendance',
    gap: 'referred vs attended gap',
    noData: 'No data yet.',
    photoAlt: 'Local lesion preview',
  },
  hi: {
    mouthNote: 'दर्शाने के लिए सीमा: लगभग 3 उंगली से कम या मुंह कम खुलना।',
    measure: 'मुंह खुलने का माप',
    fingers: 'उंगली की चौड़ाई',
    mm: 'मिलीमीटर',
    activeHabits: 'सक्रिय आदतें',
    noRecords: 'मुंह की जांच का कोई रिकॉर्ड नहीं।',
    screened: 'जांच',
    habitHistory: 'आदत का इतिहास',
    urgentCount: 'तत्काल',
    referCount: 'रेफरल',
    highCount: 'अधिक जोखिम',
    routineCount: 'नियमित',
    attendance: 'रेफरल पर उपस्थिति',
    gap: 'रेफर और उपस्थित का अंतर',
    noData: 'अभी कोई डेटा नहीं।',
    photoAlt: 'स्थानीय घाव का पूर्वावलोकन',
  },
  kn: {
    mouthNote: 'ತೋರಿಕೆಗೆ ಬಳಸಿದ ಮಿತಿ: ಸುಮಾರು 3 ಬೆರಳಿಗಿಂತ ಕಡಿಮೆ ಅಥವಾ ಬಾಯಿ ಕಡಿಮೆ ತೆರೆಯುವುದು.',
    measure: 'ಬಾಯಿ ತೆರೆಯುವ ಅಳತೆ',
    fingers: 'ಬೆರಳಿನ ಅಗಲ',
    mm: 'ಮಿಲಿಮೀಟರ್',
    activeHabits: 'ಸಕ್ರಿಯ ಅಭ್ಯಾಸ(ಗಳು)',
    noRecords: 'ಬಾಯಿ ತಪಾಸಣೆಯ ದಾಖಲೆಗಳಿಲ್ಲ.',
    screened: 'ತಪಾಸಣೆ',
    habitHistory: 'ಅಭ್ಯಾಸದ ಇತಿಹಾಸ',
    urgentCount: 'ತುರ್ತು',
    referCount: 'ರೆಫರ್',
    highCount: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
    routineCount: 'ಸಾಮಾನ್ಯ',
    attendance: 'ರೆಫರಲ್ ಹಾಜರಾತಿ',
    gap: 'ರೆಫರ್ ಮತ್ತು ಹಾಜರಾದವರ ಅಂತರ',
    noData: 'ಇನ್ನೂ ಮಾಹಿತಿ ಇಲ್ಲ.',
    photoAlt: 'ಸ್ಥಳೀಯ ಗಾಯದ ಪೂರ್ವವೀಕ್ಷಣೆ',
  },
};
ruleLabels.en.symptom_voice = 'Persistent voice change or hoarseness';
ruleLabels.en.symptom_teeth = 'Unexplained loosening of teeth';
ruleLabels.hi.symptom_voice = 'आवाज़ में लगातार बदलाव या भारीपन';
ruleLabels.hi.symptom_teeth = 'बिना कारण दांत ढीले होना';
ruleLabels.kn.symptom_voice = 'ಧ್ವನಿಯಲ್ಲಿ ನಿರಂತರ ಬದಲಾವಣೆ ಅಥವಾ ಒರಟುತನ';
ruleLabels.kn.symptom_teeth = 'ಕಾರಣವಿಲ್ಲದೆ ಹಲ್ಲು ಸಡಿಲವಾಗುವುದು';
ruleLabels.en.other_visible_finding = 'Other visible finding needs clinical review';
ruleLabels.hi.other_visible_finding = 'अन्य दिखने वाले निशान की चिकित्सकीय जांच जरूरी है';
ruleLabels.kn.other_visible_finding = 'ಇತರೆ ಕಾಣುವ ಗುರುತಿಗೆ ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಅಗತ್ಯ';
// Model-card wording is localized; clinical terms still need native-speaking clinician review.
export function OralModelCard({ lang = 'en' }) {
  const text = {
    en: [
      'Oral screening',
      'Rule-based triage; no machine learning and no measured sensitivity or specificity. Simplified reference criteria require verification against current NP-NCD / national oral cancer screening guidance and local protocols. Visual examination only; not a substitute for clinician examination or biopsy.',
    ],
    hi: [
      'मुंह की जांच',
      'नियम-आधारित सुझाव; मशीन लर्निंग नहीं और संवेदनशीलता/विशिष्टता का कोई मापा परिणाम नहीं। सरल संदर्भ मानदंडों को वर्तमान NP-NCD/राष्ट्रीय मुंह कैंसर जांच मार्गदर्शन और स्थानीय नियमों से सत्यापित करें। यह केवल दृश्य जांच है; डॉक्टर की जांच या बायोप्सी का विकल्प नहीं।',
    ],
    kn: [
      'ಬಾಯಿ ತಪಾಸಣೆ',
      'ನಿಯಮ ಆಧಾರಿತ ಮಾರ್ಗದರ್ಶನ; ಯಂತ್ರ ಕಲಿಕೆ ಇಲ್ಲ, ಸಂವೇದನಾಶೀಲತೆ ಅಥವಾ ನಿರ್ದಿಷ್ಟತೆಯ ಅಳತೆ ಇಲ್ಲ. ಸರಳ ಮಾನದಂಡಗಳನ್ನು ಪ್ರಸ್ತುತ NP-NCD/ರಾಷ್ಟ್ರೀಯ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಸ್ಥಳೀಯ ನಿಯಮಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಬೇಕು. ಇದು ದೃಶ್ಯ ತಪಾಸಣೆ ಮಾತ್ರ; ವೈದ್ಯರ ಪರೀಕ್ಷೆ ಅಥವಾ ಬಯಾಪ್ಸಿಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
    ],
  }[lang] || [
    'Oral screening',
    'Rule-based triage; no machine learning and no measured sensitivity or specificity. Simplified reference criteria require verification against current NP-NCD / national oral cancer screening guidance and local protocols. Visual examination only; not a substitute for clinician examination or biopsy.',
  ];
  return (
    <section className="callout">
      <h3>{text[0]}</h3>
      <p>{text[1]}</p>
    </section>
  );
}
const emptyHabit = () => ({ active: false, timesPerDay: '', years: '', placementSite: '' });
const SITE_CODES = [
  'cheek_left',
  'cheek_right',
  'lower_lip',
  'tongue_lateral',
  'tongue_dorsal',
  'tongue_ventral',
  'floor_mouth',
  'gingiva',
  'palate',
  'retromolar',
];
const initialHabits = ['smokeless', 'quid', 'areca', 'smoking', 'alcohol'].reduce(
  (o, k) => ((o[k] = emptyHabit()), o),
  {},
);
const initialFindings = () =>
  Array(10)
    .fill(0)
    .map(() => ({
      type: 'normal',
      size: '',
      over14Days: false,
      persistent: false,
      nonWipeable: false,
      habitPlacement: false,
    }));
const read = () => {
  try {
    return JSON.parse(localStorage.getItem('niramaya.oralLogs') || '[]');
  } catch {
    return [];
  }
};
export default function OralScreening({ lang = 'en', village = '', setVillage = () => {} }) {
  const t = copy[lang] || copy.en,
    x = { ...(extra[lang] || extra.en), ...(uiText[lang] || uiText.en) },
    rulesText = ruleLabels[lang] || ruleLabels.en,
    [view, setView] = useState('screen'),
    [ageBand, setAge] = useState(''),
    [sex, setSex] = useState(''),
    [consent, setConsent] = useState(false),
    [habits, setHabits] = useState(initialHabits),
    [symptoms, setSymptoms] = useState([]),
    [findings, setFindings] = useState(initialFindings),
    [mouthOpening, setMouth] = useState(''),
    [mouthValue, setMouthValue] = useState(''),
    [mouthUnit, setMouthUnit] = useState('fingers'),
    [neckNode, setNeck] = useState(false),
    [photo, setPhoto] = useState(''),
    [result, setResult] = useState(null),
    [logs, setLogs] = useState(read);
  const input = useMemo(
    () => ({
      consent,
      habits: Object.entries(habits).map(([type, h]) => ({
        type,
        ...h,
        timesPerDay: Number(h.timesPerDay) || 0,
        years: Number(h.years) || 0,
      })),
      symptoms,
      findings: findings
        .map((f, i) => ({ ...f, site: SITE_CODES[i] }))
        .filter((f) => f.type !== 'normal'),
      mouthOpening,
      mouthValue,
      mouthUnit,
      neckNode,
    }),
    [consent, habits, symptoms, findings, mouthOpening, mouthValue, mouthUnit, neckNode],
  );
  function save() {
    const triage = triageOral(input);
    if (triage.error) return;
    const row = {
      id: `oral-${Date.now()}`,
      timestamp: Date.now(),
      consent: true,
      village: village.trim() || 'Unspecified',
      ageBand,
      sex,
      habits: input.habits.filter((h) => h.active),
      findings: input.findings.map((f) => ({ ...f })),
      symptoms: [...symptoms],
      category: triage.category,
      rules: triage.rules,
      exposure: triage.exposure,
      mouthOpening,
      mouthValue,
      mouthUnit,
      neckNode,
      referralStatus: '',
      specialistOutcome: '',
    };
    const next = [row, ...read()];
    localStorage.setItem('niramaya.oralLogs', JSON.stringify(next));
    setLogs(next);
    setResult({ row, triage });
    setView('screen');
    setPhoto('');
  }
  function update(id, patch) {
    const next = read().map((row) => (row.id === id ? { ...row, ...patch } : row));
    localStorage.setItem('niramaya.oralLogs', JSON.stringify(next));
    setLogs(next);
  }
  const labels = { routine: t.routine, high_risk: t.high_risk, refer: t.refer, urgent: t.urgent };
  const note = result
    ? `Niramaya oral screening: ${labels[result.row.category]}. ${x.follow[result.row.category]} ${result.triage.rules.map((r) => rulesText[r.code] || r.text).join('; ')}. ${t.absence}`
    : '';
  const villages = [...new Set(logs.map((x) => x.village))];
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  return (
    <section className="oral-module">
      <div className="oral-banner" role="alert">
        <b>{t.banner}</b>
        <small>
          {lang === 'hi'
            ? 'वास्तविक मरीज का डेटा या पहचान की जानकारी न डालें।'
            : lang === 'kn'
              ? 'ನಿಜವಾದ ರೋಗಿಯ ಮಾಹಿತಿ ಅಥವಾ ಗುರುತನ್ನು ನಮೂದಿಸಬೇಡಿ.'
              : 'Do not enter real patient data or identifiers.'}
        </small>
      </div>
      <nav className="oral-tabs">
        <button onClick={() => setView('screen')}>{t.title}</button>
        <button onClick={() => setView('log')}>
          {t.log} ({logs.length})
        </button>
        <button onClick={() => setView('dashboard')}>{t.dashboard}</button>
      </nav>
      {view === 'screen' && (
        <div className="oral-grid">
          <div className="card oral-form">
            <h2>{t.title}</h2>
            <div className="oral-fields">
              <label>
                {t.age}
                <select value={ageBand} onChange={(e) => setAge(e.target.value)}>
                  <option value="">—</option>
                  {['Under 18', '18–29', '30–44', '45–59', '60+'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.sex}
                <select value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="">—</option>
                  <option>{x.female}</option>
                  <option>{x.male}</option>
                  <option>{x.other}</option>
                  <option>{x.prefer}</option>
                </select>
              </label>
              <label>
                {t.village}
                <input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  maxLength="80"
                />
              </label>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t.consent}</span>
            </label>
            <h3>{t.habits}</h3>
            {t.habitsList.map(([key, label]) => (
              <div className="oral-habit" key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={habits[key].active}
                    onChange={(e) =>
                      setHabits({ ...habits, [key]: { ...habits[key], active: e.target.checked } })
                    }
                  />
                  {label}
                </label>
                {habits[key].active && (
                  <div className="habit-fields">
                    <label>
                      {t.times}
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={habits[key].timesPerDay}
                        onChange={(e) =>
                          setHabits({
                            ...habits,
                            [key]: { ...habits[key], timesPerDay: e.target.value },
                          })
                        }
                      />
                    </label>
                    <label>
                      {t.years}
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={habits[key].years}
                        onChange={(e) =>
                          setHabits({ ...habits, [key]: { ...habits[key], years: e.target.value } })
                        }
                      />
                    </label>
                    <label>
                      {t.placement}
                      <select
                        value={habits[key].placementSite}
                        onChange={(e) =>
                          setHabits({
                            ...habits,
                            [key]: { ...habits[key], placementSite: e.target.value },
                          })
                        }
                      >
                        <option value="">—</option>
                        {t.sites.map((s, i) => (
                          <option key={s} value={SITE_CODES[i]}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            ))}
            <h3>{t.symptoms}</h3>
            <div className="oral-checks">
              {t.symptomsList.map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={symptoms.includes(key)}
                    onChange={(e) =>
                      setSymptoms(
                        e.target.checked ? [...symptoms, key] : symptoms.filter((x) => x !== key),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <h3>{t.exam}</h3>
            {t.sites.map((site, i) => (
              <div className="oral-site" key={site}>
                <b>{site}</b>
                <div className="oral-fields">
                  <label>
                    {t.finding}
                    <select
                      value={findings[i].type}
                      onChange={(e) =>
                        setFindings(
                          findings.map((f, j) => (j === i ? { ...f, type: e.target.value } : f)),
                        )
                      }
                    >
                      {t.types.map(([v, l]) => (
                        <option value={v} key={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {findings[i].type !== 'normal' && (
                    <>
                      <label>
                        {t.size}
                        <select
                          value={findings[i].size}
                          onChange={(e) =>
                            setFindings(
                              findings.map((f, j) =>
                                j === i ? { ...f, size: e.target.value } : f,
                              ),
                            )
                          }
                        >
                          <option value="">—</option>
                          {t.sizes.map(([v, l]) => (
                            <option value={v} key={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={findings[i].over14Days}
                          onChange={(e) =>
                            setFindings(
                              findings.map((f, j) =>
                                j === i ? { ...f, over14Days: e.target.checked } : f,
                              ),
                            )
                          }
                        />
                        {t.ulcer}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={findings[i].persistent}
                          onChange={(e) =>
                            setFindings(
                              findings.map((f, j) =>
                                j === i ? { ...f, persistent: e.target.checked } : f,
                              ),
                            )
                          }
                        />
                        {x.persistent}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={findings[i].nonWipeable}
                          onChange={(e) =>
                            setFindings(
                              findings.map((f, j) =>
                                j === i ? { ...f, nonWipeable: e.target.checked } : f,
                              ),
                            )
                          }
                        />
                        {x.nonWipe}
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={findings[i].habitPlacement}
                          onChange={(e) =>
                            setFindings(
                              findings.map((f, j) =>
                                j === i ? { ...f, habitPlacement: e.target.checked } : f,
                              ),
                            )
                          }
                        />
                        {t.placement}
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="oral-fields">
              <label>
                {t.mouth}
                <select value={mouthOpening} onChange={(e) => setMouth(e.target.value)}>
                  <option value="">—</option>
                  <option value="normal">{x.normalOpening}</option>
                  <option value="reduced">{x.reducedOpening}</option>
                </select>
                <small>{t.mouthNote}</small>
              </label>
              <label>
                {x.measure}
                <div className="oral-fields">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={mouthValue}
                    onChange={(e) => setMouthValue(e.target.value)}
                  />
                  <select value={mouthUnit} onChange={(e) => setMouthUnit(e.target.value)}>
                    <option value="fingers">{x.fingers}</option>
                    <option value="mm">{x.mm}</option>
                  </select>
                </div>
              </label>
              <label>
                {t.neck}
                <input
                  type="checkbox"
                  checked={neckNode}
                  onChange={(e) => setNeck(e.target.checked)}
                />
              </label>
            </div>
            <label className="photo-input">
              {t.photo}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) =>
                  setPhoto(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : '')
                }
              />
              <small>{t.guidance}</small>
            </label>
            {photo && <img className="oral-photo" src={photo} alt={x.photoAlt} />}
            <button
              className="primary"
              disabled={
                !consent ||
                !ageBand ||
                !sex ||
                Object.values(habits).some((h) => h.active && (!h.timesPerDay || !h.years))
              }
              onClick={save}
            >
              {t.run}
            </button>
          </div>
          <aside className="oral-side">
            {result ? (
              <section className={`card oral-result ${result.row.category}`}>
                <h2>
                  <span className="oral-icon" aria-hidden="true">
                    {result.row.category === 'urgent'
                      ? '⚠'
                      : result.row.category === 'routine'
                        ? '✓'
                        : '!'}
                  </span>{' '}
                  {labels[result.row.category]}
                </h2>
                <p>{x.follow[result.row.category]}</p>
                <p>
                  {x.exposure}: {result.triage.exposure.toFixed(1)}
                </p>
                <h3>{t.why}</h3>
                <ul>
                  {result.triage.rules.map((r) => (
                    <li key={r.code}>{rulesText[r.code] || r.text}</li>
                  ))}
                </ul>
                <b>{t.absence}</b>
                <div className="counsel">
                  <h3>{t.counsel}</h3>
                  <p>{t.mirror}</p>
                </div>
                <div className="actions">
                  <button onClick={() => navigator.clipboard?.writeText(note)}>{x.copy}</button>
                  <button onClick={() => window.print()}>{x.print}</button>
                  <button onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(note))}>
                    {x.read}
                  </button>
                </div>
                <QRCodeSVG value={note} size={112} includeMargin />
              </section>
            ) : (
              <section className="card oral-result">
                <h2>{t.title}</h2>
                <b>{t.absence}</b>
              </section>
            )}
            <section className="card">
              <h3>{t.danger}</h3>
              <p>{t.dangerSigns}</p>
            </section>
          </aside>
        </div>
      )}
      {view === 'log' && (
        <section className="card page-card">
          <h2>{t.log}</h2>
          {logs.map((row) => (
            <article className="oral-log" key={row.id}>
              <b>
                {new Date(row.timestamp).toLocaleString()} · {row.village} · {labels[row.category]}
              </b>
              <p>
                {row.ageBand} · {row.sex} · {row.habits.length} {t.activeHabits}
              </p>
              <p>{row.rules.map((r) => rulesText[r.code] || r.text).join('; ')}</p>
              <label>
                {t.status}
                <select
                  value={row.referralStatus}
                  onChange={(e) => update(row.id, { referralStatus: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="referred">{x.referred}</option>
                  <option value="attended">{x.attended}</option>
                  <option value="not attended">{x.notAttended}</option>
                </select>
              </label>
              <label>
                {t.outcome}
                <select
                  value={row.specialistOutcome}
                  onChange={(e) => update(row.id, { specialistOutcome: e.target.value })}
                >
                  <option value="">—</option>
                  {x.outcomes.map((label, i) => {
                    const v = ['normal', 'OPMD confirmed', 'dysplasia', 'malignancy', 'other'][i];
                    return (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            </article>
          ))}
          {!logs.length && <p>{t.noRecords}</p>}
        </section>
      )}
      {view === 'dashboard' && (
        <section className="card page-card">
          <h2>{t.dashboard}</h2>
          <p>{t.small}</p>
          {villages.map((v) => {
            const rows = logs.filter((x) => x.village === v),
              habit = rows.filter((x) => x.habits.length).length,
              ref = rows.filter((x) => Boolean(x.referralStatus)),
              att = rows.filter((x) => x.referralStatus === 'attended').length;
            return (
              <article className="oral-log" key={v}>
                <h3>
                  {v} · {rows.length} {x.screened}
                </h3>
                <p>
                  {x.habitHistory}: {rows.length ? Math.round((100 * habit) / rows.length) : 0}% ·{' '}
                  {x.urgentCount} {rows.filter((x) => x.category === 'urgent').length} ·{' '}
                  {x.referCount} {rows.filter((x) => x.category === 'refer').length} · {x.highCount}{' '}
                  {rows.filter((x) => x.category === 'high_risk').length} · {x.routineCount}{' '}
                  {rows.filter((x) => x.category === 'routine').length}
                </p>
                <p>
                  {x.attendance}: {ref.length ? Math.round((100 * att) / ref.length) : 0}% · {x.gap}
                  : {Math.max(0, ref.length - att)}
                </p>
              </article>
            );
          })}
          {!villages.length && <p>{x.noData}</p>}
        </section>
      )}
    </section>
  );
}
