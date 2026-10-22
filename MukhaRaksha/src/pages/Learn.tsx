import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';

interface Slide {
  id: number;
  titleEn: string;
  titleKn: string;
  descEn: string;
  descKn: string;
  narrationEn: string;
  narrationKn: string;
  svgType: 'cells' | 'risk' | 'warning' | 'early' | 'selfexam' | 'quit' | 'myths';
}

const SLIDES: Slide[] = [
  {
    id: 1,
    titleEn: '1. What is Oral Cancer?',
    titleKn: '೧. ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಎಂದರೇನು?',
    descEn: 'Oral cancer begins when cells on the tongue, inner cheeks, gums, or lips grow abnormally, forming persistent sores or lumps.',
    descKn: 'ನಾಲಿಗೆ, ಒಳಗಿನ ಕೆನ್ನೆ, ಒಸಡು ಅಥವಾ ತುಟಿಗಳಲ್ಲಿ ಜೀವಕೋಶಗಳು ಅಸಹಜವಾಗಿ ಬೆಳೆದು, ವಾಸಿಯಾಗದ ಗಾಯ ಅಥವಾ ಗಡ್ಡೆಯಾಗುವುದೇ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್.',
    narrationEn: 'Oral cancer affects the lips, tongue, cheeks, and throat. It usually starts as a painless sore or white or red patch that does not go away.',
    narrationKn: 'ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ತುಟಿ, ನಾಲಿಗೆ, ಕೆನ್ನೆ ಮತ್ತು ಗಂಟಲಿನಲ್ಲಿ ಉಂಟಾಗುತ್ತದೆ. ಇದು ಸಾಮಾನ್ಯವಾಗಿ ನೋವಿಲ್ಲದ ಹುಣ್ಣು ಅಥವಾ ಬಿಳಿ-ಕೆಂಪು ಚುಕ್ಕೆಯಾಗಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.',
    svgType: 'cells',
  },
  {
    id: 2,
    titleEn: '2. Who is at High Risk?',
    titleKn: '೨. ಯಾರಿಗೆ ಹೆಚ್ಚಿನ ಅಪಾಯ?',
    descEn: 'Tobacco chewers, beedi/cigarette smokers, areca nut (pan) users, and heavy alcohol drinkers face up to 20x higher risk.',
    descKn: 'ತಂಬಾಕು ಅಗಿಯುವವರು, ಬೀಡಿ-ಸಿಗರೇಟ್ ಸೇದುವವರು, ಅಡಿಕೆ (ಪಾನ್) ಬಳಸುವವರು ಮತ್ತು ಮದ್ಯ ಸೇವಿಸುವವರಿಗೆ ೨೦ ಪಟ್ಟು ಹೆಚ್ಚು ಅಪಾಯವಿದೆ.',
    narrationEn: 'Areca nut and gutka chewing are the primary causes in Karnataka. Combining tobacco with alcohol dramatically multiplies cancer risk.',
    narrationKn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಅಡಿಕೆ ಮತ್ತು ಗುಟ್ಕಾ ಸೇವನೆ ಮುಖ್ಯ ಕಾರಣ. ತಂಬಾಕಿನ ಜೊತೆ ಮದ್ಯಪಾನ ಸೇರಿದಾಗ ಕ್ಯಾನ್ಸರ್ ಅಪಾಯ ಹತ್ತಾರು ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ.',
    svgType: 'risk',
  },
  {
    id: 3,
    titleEn: '3. Early Warning Signs',
    titleKn: '೩. ಆರಂಭಿಕ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು',
    descEn: 'Mouth ulcer lasting more than 2 weeks, white patches (leukoplakia), red patches (erythroplakia), or difficulty opening mouth wide.',
    descKn: '೨ ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಗುಣವಾಗದ ಬಾಯಿ ಹುಣ್ಣು, ಬಿಳಿ ಚುಕ್ಕೆ, ಕೆಂಪು ಚುಕ್ಕೆ, ಅಥವಾ ಬಾಯಿ ಪೂರ್ಣವಾಗಿ ತೆರೆಯಲು ಕಷ್ಟವಾಗುವುದು.',
    narrationEn: 'If a mouth sore does not heal within two weeks, do not ignore it. Red patches and mouth-opening difficulty are critical warning signs.',
    narrationKn: 'ಬಾಯಿಯ ಹುಣ್ಣು ೨ ವಾರಗಳಲ್ಲಿ ವಾಸಿಯಾಗದಿದ್ದರೆ ನಿರ್ಲಕ್ಷಿಸಬೇಡಿ. ಕೆಂಪು ಚುಕ್ಕೆ ಮತ್ತು ಬಾಯಿ ತೆರೆಯಲು ಕಷ್ಟವಾಗುವುದು ಗಂಭೀರ ಎಚ್ಚರಿಕೆಗಳು.',
    svgType: 'warning',
  },
  {
    id: 4,
    titleEn: '4. Why Early Detection Matters',
    titleKn: '೪. ಬೇಗ ಪತ್ತೆ ಮಾಡುವುದು ಏಕೆ ಮುಖ್ಯ?',
    descEn: 'When detected early in Stage 1, the 5-year survival rate exceeds 85%, and treatment is simpler and preserves speech and eating.',
    descKn: 'ಮೊದಲ ಹಂತದಲ್ಲಿಯೇ ಪತ್ತೆ ಹಚ್ಚಿದರೆ ಶೇಕಡಾ ೮೫ ಕ್ಕಿಂತ ಹೆಚ್ಚು ಗುಣಮುಖರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಚಿಕಿತ್ಸೆಯೂ ಸುಲಭವಾಗಿರುತ್ತದೆ.',
    narrationEn: 'Early detection saves lives. Stage one oral cancer is highly treatable. Never wait until pain begins.',
    narrationKn: 'ಬೇಗ ಪತ್ತೆ ಮಾಡಿದರೆ ಜೀವ ಉಳಿಸಬಹುದು. ಆರಂಭಿಕ ಹಂತದ ಕ್ಯಾನ್ಸರ್ ಸಂಪೂರ್ಣ ಗುಣವಾಗಬಲ್ಲದು. ನೋವು ಬರುವವರೆಗೆ ಕಾಯಬೇಡಿ.',
    svgType: 'early',
  },
  {
    id: 5,
    titleEn: '5. How to do Monthly Self-Exam',
    titleKn: '೫. ಮಾಸಿಕ ಸ್ವ-ಪರೀಕ್ಷೆ ಹೇಗೆ ಮಾಡುವುದು?',
    descEn: 'Stand before a mirror under bright light. Check your lips, tongue top and sides, cheeks, palate, and feel your neck for lumps.',
    descKn: 'ಕನ್ನಡಿಯ ಮುಂದೆ ಬೆಳಕಿನಲ್ಲಿ ನಿಲ್ಲಿ. ತುಟಿ, ನಾಲಿಗೆಯ ಮೇಲ್ಭಾಗ ಮತ್ತು ಪಕ್ಕಗಳು, ಕೆನ್ನೆ ಹಾಗೂ ಕತ್ತಿನಲ್ಲಿ ಗಡ್ಡೆಗಳಿವೆಯೇ ಪರೀಕ್ಷಿಸಿ.',
    narrationEn: 'Check your mouth once every month. Pull out your tongue and inspect both sides. Touch the floor of the mouth and your neck.',
    narrationKn: 'ಪ್ರತಿ ತಿಂಗಳು ಒಮ್ಮೆ ನಿಮ್ಮ ಬಾಯಿಯನ್ನು ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ. ನಾಲಿಗೆಯ ಪಕ್ಕದ ಭಾಗಗಳನ್ನು ಮತ್ತು ಕತ್ತನ್ನು ಬೆರಳುಗಳಿಂದ ಮುಟ್ಟಿ ನೋಡಿ.',
    svgType: 'selfexam',
  },
  {
    id: 6,
    titleEn: '6. Quitting Tobacco & Support',
    titleKn: '೬. ತಂಬಾಕು ತ್ಯಜಿಸುವುದು & ಸಹಾಯ',
    descEn: 'Cravings last only 3-5 minutes. Call National Tobacco Quitline at 1800-11-2356 (Toll-Free). Your mouth tissue begins repairing in 24 hours.',
    descKn: 'ತಂಬಾಕಿನ ಆಸೆ ೩-೫ ನಿಮಿಷ ಮಾತ್ರ ಇರುತ್ತದೆ. ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ ೧೮೦೦-೧೧-೨೩೫೬ ಗೆ ಕರೆ ಮಾಡಿ (ಉಚಿತ).',
    narrationEn: 'Within weeks of quitting, precancerous tissues begin to recover. Call the free toll-free quitline 1800-11-2356 for counselling.',
    narrationKn: 'ತಂಬಾಕು ಬಿಟ್ಟ ಕೆಲವೇ ವಾರಗಳಲ್ಲಿ ಬಾಯಿಯ ಜೀವಕೋಶಗಳು ಸಹಜ ಸ್ಥಿತಿಗೆ ಮರಳುತ್ತವೆ. ಉಚಿತ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ.',
    svgType: 'quit',
  },
  {
    id: 7,
    titleEn: '7. Myths vs Real Facts',
    titleKn: '೭. ತಪ್ಪು ಕಲ್ಪನೆ vs ವಾಸ್ತವ ಸತ್ಯ',
    descEn: 'Myth: "Areca nut without tobacco is harmless." Fact: Areca nut is a proven Group 1 human carcinogen on its own.',
    descKn: 'ತಪ್ಪು ತಿಳುವಳಿಕೆ: "ತಂಬಾಕು ಇಲ್ಲದ ಕೇವಲ ಅಡಿಕೆ ಹಾನಿಕಾರಕವಲ್ಲ." ಸತ್ಯ: ಅಡಿಕೆಯೇ ಸ್ವತಃ ಕ್ಯಾನ್ಸರ್‌ಕಾರಕ ಎಂದು ಸಾಬೀತಾಗಿದೆ.',
    narrationEn: 'Areca nut or betel nut alone causes severe oral submucous fibrosis and cancer, even without adding tobacco.',
    narrationKn: 'ತಂಬಾಕು ಬೆರೆಸದಿದ್ದರೂ ಕೇವಲ ಅಡಿಕೆ ಜಗಿಯುವುದರಿಂದಲೂ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಮತ್ತು ಬಾಯಿ ತೆರೆಯಲಾಗದ ಸ್ಥಿತಿ ಉಂಟಾಗುತ್ತದೆ.',
    svgType: 'myths',
  },
];

interface QuizQuestion {
  questionEn: string;
  questionKn: string;
  optionsEn: string[];
  optionsKn: string[];
  correct: number;
  explainEn: string;
  explainKn: string;
}

const QUIZ: QuizQuestion[] = [
  {
    questionEn: 'How long should an unexplained mouth ulcer last before seeing a doctor?',
    questionKn: 'ಗುಣವಾಗದ ಬಾಯಿ ಹುಣ್ಣು ಎಷ್ಟು ದಿನಗಳ ನಂತರ ವೈದ್ಯರನ್ನು ಕಾಣಬೇಕು?',
    optionsEn: ['2 days', '1 week', 'More than 2 weeks', '6 months'],
    optionsKn: ['೨ ದಿನ', '೧ ವಾರ', '೨ ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು', '೬ ತಿಂಗಳು'],
    correct: 2,
    explainEn: 'Any mouth ulcer persisting over 2 weeks without healing must be clinically evaluated.',
    explainKn: '೨ ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲ ಉಳಿಯುವ ಯಾವುದೇ ಬಾಯಿ ಹುಣ್ಣನ್ನು ವೈದ್ಯರು ಪರೀಕ್ಷಿಸಬೇಕು.',
  },
  {
    questionEn: 'Is areca nut (betel nut) harmful if taken WITHOUT tobacco?',
    questionKn: 'ತಂಬಾಕು ಬೆರೆಸದೆ ಕೇವಲ ಅಡಿಕೆ ತಿಂದರೆ ಹಾನಿಕಾರಕವೇ?',
    optionsEn: ['No, it is safe', 'Yes, it causes cancer and trismus', 'Only if taken with milk', 'It improves teeth'],
    optionsKn: ['ಇಲ್ಲ, ಅದು ಸುರಕ್ಷಿತ', 'ಹೌದು, ಅಡಿಕೆಯೇ ಕ್ಯಾನ್ಸರ್ ಮತ್ತು ಬಾಯಿ ಗಟ್ಟಿಯಾಗಲು ಕಾರಣ', 'ಹಾಲಿನ ಜೊತೆ ತಿಂದರೆ ಮಾತ್ರ', 'ಅದು ಹಲ್ಲುಗಳನ್ನು ಗಟ್ಟಿಮಾಡುತ್ತದೆ'],
    correct: 1,
    explainEn: 'Areca nut is classified as a Group 1 carcinogen and causes oral submucous fibrosis.',
    explainKn: 'ಅಡಿಕೆಯು ಗ್ರೂಪ್ ೧ ಕ್ಯಾನ್ಸರ್‌ಕಾರಕವಾಗಿದ್ದು ಬಾಯಿ ಗಟ್ಟಿಯಾಗಲು (ಫೈಬ್ರೋಸಿಸ್) ಕಾರಣವಾಗುತ್ತದೆ.',
  },
  {
    questionEn: 'What is the color of oral patches with the highest malignant risk?',
    questionKn: 'ಕ್ಯಾನ್ಸರ್ ಆಗುವ ಅತಿ ಹೆಚ್ಚಿನ ಅಪಾಯವಿರುವ ಬಾಯಿಯ ಚುಕ್ಕೆಗಳ ಬಣ್ಣ ಯಾವುದು?',
    optionsEn: ['White (Leukoplakia)', 'Red (Erythroplakia)', 'Yellow (Pus)', 'Black (Pigment)'],
    optionsKn: ['ಬಿಳಿ ಚುಕ್ಕೆ', 'ಕೆಂಪು ಚುಕ್ಕೆ (ಎರಿಥ್ರೋಪ್ಲಾಕಿಯಾ)', 'ಹಳದಿ ಕೀವು', 'ಕಪ್ಪು ಕಲೆ'],
    correct: 1,
    explainEn: 'Erythroplakia (red velvety patches) has up to 90% risk of malignant transformation.',
    explainKn: 'ಕೆಂಪು ಚುಕ್ಕೆಗಳಲ್ಲಿ (ಎರಿಥ್ರೋಪ್ಲಾಕಿಯಾ) ಕ್ಯಾನ್ಸರ್ ಆಗುವ ಸಂಭವ ಶೇಕಡಾ ೯೦ ರಷ್ಟಿರುತ್ತದೆ.',
  },
  {
    questionEn: 'How often should adults perform an oral self-examination at home?',
    questionKn: 'ಮನೆಯಲ್ಲಿ ಬಾಯಿ ಸ್ವ-ಪರೀಕ್ಷೆಯನ್ನು ಎಷ್ಟು ದಿನಗಳಿಗೊಮ್ಮೆ ಮಾಡಬೇಕು?',
    optionsEn: ['Once a day', 'Once a month', 'Once a year', 'Only when there is severe pain'],
    optionsKn: ['ದಿನಕ್ಕೆ ಒಮ್ಮೆ', 'ತಿಂಗಳಿಗೆ ಒಮ್ಮೆ', 'ವರ್ಷಕ್ಕೆ ಒಮ್ಮೆ', 'ವಿಪರೀತ ನೋವಿದ್ದಾಗ ಮಾತ್ರ'],
    correct: 1,
    explainEn: 'A monthly 2-minute mirror self-check is the recommended standard for early detection.',
    explainKn: 'ತಿಂಗಳಿಗೊಮ್ಮೆ ೨ ನಿಮಿಷ ಕನ್ನಡಿಯ ಮುಂದೆ ಬಾಯಿ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳುವುದು ಅತ್ಯುತ್ತಮ ಅಭ್ಯಾಸ.',
  },
  {
    questionEn: 'What is the National Toll-Free Tobacco Quitline number in India?',
    questionKn: 'ಭಾರತದ ರಾಷ್ಟ್ರೀಯ ಉಚಿತ ತಂಬಾಕು ನಿಷೇಧ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆ ಯಾವುದು?',
    optionsEn: ['100', '1800-11-2356', '108', '1947'],
    optionsKn: ['೧೦೦', '೧೮೦೦-೧೧-೨೩೫೬', '೧೦೮', '೧೯೪೭'],
    correct: 1,
    explainEn: 'Call 1800-11-2356 for confidential, professional tobacco cessation counseling.',
    explainKn: 'ತಂಬಾಕು ತ್ಯಜಿಸಲು ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ೧೮೦೦-೧೧-೨೩೫೬ ಗೆ ಉಚಿತವಾಗಿ ಕರೆ ಮಾಡಿ.',
  },
];

export default function Learn() {
  const { t, lang, speak, stopSpeaking, isSpeaking, settings } = useApp();

  const [activeTab, setActiveTab] = useState<'explainer' | 'quiz' | 'topics'>('explainer');
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const slide = SLIDES[currentSlideIdx];

  // Narration for slide
  const narrateCurrentSlide = () => {
    const text = lang === 'kn' ? slide.narrationKn : slide.narrationEn;
    speak(text);
  };

  // Autoplay progression with Web Speech
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAuto) {
      narrateCurrentSlide();
      timer = setTimeout(() => {
        if (currentSlideIdx < SLIDES.length - 1) {
          setCurrentSlideIdx((prev) => prev + 1);
        } else {
          setIsPlayingAuto(false);
          stopSpeaking();
        }
      }, 7000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isPlayingAuto, currentSlideIdx, lang]);

  const handleNextSlide = () => {
    stopSpeaking();
    if (currentSlideIdx < SLIDES.length - 1) {
      setCurrentSlideIdx((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    stopSpeaking();
    if (currentSlideIdx > 0) {
      setCurrentSlideIdx((prev) => prev - 1);
    }
  };

  // Render SVG illustrations dynamically
  const renderIllustration = (type: Slide['svgType']) => {
    switch (type) {
      case 'cells':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <circle cx="60" cy="60" r="30" fill="#0d9488" opacity="0.3" />
            <circle cx="60" cy="60" r="20" fill="#0d9488" opacity="0.8" />
            <circle cx="130" cy="55" r="28" fill="#ff5a47" opacity="0.3" className="animate-pulse" />
            <circle cx="130" cy="55" r="18" fill="#ff5a47" opacity="0.9" />
            <path d="M90 60 L105 60" stroke="#999" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      case 'risk':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <rect x="30" y="35" width="35" height="50" rx="6" fill="#88201b" />
            <text x="47" y="65" fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">BEEDI</text>
            <circle cx="100" cy="60" r="22" fill="#c2410c" />
            <text x="100" y="64" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">PAN</text>
            <rect x="145" y="30" width="25" height="60" rx="4" fill="#6d28d9" />
            <text x="157" y="65" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">ALC</text>
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <path d="M100 25 L160 100 L40 100 Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
            <text x="100" y="85" fill="#b45309" fontSize="40" textAnchor="middle" fontWeight="bold">!</text>
          </svg>
        );
      case 'early':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <circle cx="100" cy="60" r="45" fill="#ccfbf1" stroke="#0d9488" strokeWidth="6" strokeDasharray="280" />
            <text x="100" y="68" fill="#0f766e" fontSize="24" textAnchor="middle" fontWeight="bold">85%+</text>
          </svg>
        );
      case 'selfexam':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <rect x="50" y="20" width="100" height="80" rx="12" fill="#f0fdfa" stroke="#0d9488" strokeWidth="3" />
            <circle cx="100" cy="50" r="16" fill="#2dd4bf" />
            <path d="M80 85 Q100 68 120 85" stroke="#0d9488" strokeWidth="3" fill="none" />
          </svg>
        );
      case 'quit':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <circle cx="100" cy="60" r="40" fill="#fee2e2" stroke="#dc2626" strokeWidth="4" />
            <line x1="72" y1="32" x2="128" y2="88" stroke="#dc2626" strokeWidth="6" />
            <rect x="85" y="45" width="30" height="30" rx="4" fill="#991b1b" />
          </svg>
        );
      case 'myths':
        return (
          <svg viewBox="0 0 200 120" className="w-48 h-32 mx-auto">
            <rect x="25" y="30" width="70" height="60" rx="8" fill="#fee2e2" />
            <text x="60" y="65" fill="#dc2626" fontSize="16" textAnchor="middle" fontWeight="bold">MYTH</text>
            <rect x="105" y="30" width="70" height="60" rx="8" fill="#dcfce7" />
            <text x="140" y="65" fill="#16a34a" fontSize="16" textAnchor="middle" fontWeight="bold">FACT</text>
          </svg>
        );
    }
  };

  // Quiz submit
  const handleQuizAnswer = (ansIdx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(ansIdx);
    if (ansIdx === QUIZ[quizIdx].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleQuizNext = () => {
    setSelectedAnswer(null);
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setQuizIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <Layout title={t('learnTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setActiveTab('explainer')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'explainer'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            {lang === 'kn' ? 'ವೀಡಿಯೋ ವಿವರಣೆ' : 'Explainer'}
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'quiz'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            {t('quizTitle')}
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'topics'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            {lang === 'kn' ? 'ಲೇಖನಗಳು' : 'Topics'}
          </button>
        </div>

        {/* TAB 1: ANIMATED SLIDE EXPLAINER / CUSTOM VIDEO */}
        {activeTab === 'explainer' && (
          <div className="space-y-4">
            {settings.customVideoUrl ? (
              <Card className="overflow-hidden p-0">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={settings.customVideoUrl}
                    title="Educational Video"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0 border-2 border-teal-500/20 shadow-md">
                {/* Visual Slide Canvas */}
                <div className="bg-gradient-to-br from-teal-900 to-gray-900 text-white p-6 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs text-teal-300 font-semibold z-10">
                    <span>
                      Slide {slide.id} of {SLIDES.length}
                    </span>
                    <button
                      onClick={narrateCurrentSlide}
                      className="p-1 rounded-full bg-teal-800/60 hover:bg-teal-700 text-white"
                      title="Read aloud"
                    >
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                  <div className="py-2 z-10">{renderIllustration(slide.svgType)}</div>

                  <div className="z-10">
                    <h3 className="text-base font-bold text-white mb-1">
                      {lang === 'kn' ? slide.titleKn : slide.titleEn}
                    </h3>
                  </div>

                  {/* Decorative backdrop glow */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* Subtitles & Narration Box */}
                <div className="p-4 bg-white dark:bg-gray-800 space-y-3">
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 leading-relaxed font-medium">
                    <span className="font-bold text-[10px] uppercase tracking-wider block text-teal-700 dark:text-teal-400 mb-0.5">
                      {t('subtitles')}:
                    </span>
                    {lang === 'kn' ? slide.descKn : slide.descEn}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handlePrevSlide}
                      disabled={currentSlideIdx === 0}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 disabled:opacity-30"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                        className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        {isPlayingAuto ? <Pause size={16} /> : <Play size={16} />}
                        {isPlayingAuto ? 'Pause Auto' : 'Auto Play Story'}
                      </button>
                      <button
                        onClick={narrateCurrentSlide}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                        title="Voice Audio"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>

                    <button
                      onClick={handleNextSlide}
                      disabled={currentSlideIdx === SLIDES.length - 1}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 disabled:opacity-30"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-1.5 pt-1">
                    {SLIDES.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          stopSpeaking();
                          setCurrentSlideIdx(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlideIdx ? 'w-6 bg-teal-600' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            {!quizFinished ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Question {quizIdx + 1} of {QUIZ.length}
                  </span>
                  <span className="font-bold text-teal-600">Score: {score}</span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full transition-all duration-300"
                    style={{ width: `${((quizIdx + 1) / QUIZ.length) * 100}%` }}
                  />
                </div>

                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {lang === 'kn' ? QUIZ[quizIdx].questionKn : QUIZ[quizIdx].questionEn}
                </h3>

                {/* Options */}
                <div className="space-y-2">
                  {(lang === 'kn' ? QUIZ[quizIdx].optionsKn : QUIZ[quizIdx].optionsEn).map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === QUIZ[quizIdx].correct;

                    let btnColor = 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
                    if (selectedAnswer !== null) {
                      if (isCorrect) btnColor = 'bg-green-100 dark:bg-green-950/40 border-green-500 text-green-900 dark:text-green-200 font-bold';
                      else if (isSelected) btnColor = 'bg-red-100 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${btnColor}`}
                      >
                        <span>{opt}</span>
                        {selectedAnswer !== null && isCorrect && <CheckCircle2 size={16} className="text-green-600" />}
                        {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={16} className="text-red-500" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on Answer */}
                {selectedAnswer !== null && (
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
                    <span className="font-bold block mb-0.5">
                      {selectedAnswer === QUIZ[quizIdx].correct ? '🎉 Correct!' : 'ℹ️ Explanation:'}
                    </span>
                    {lang === 'kn' ? QUIZ[quizIdx].explainKn : QUIZ[quizIdx].explainEn}
                  </div>
                )}

                {selectedAnswer !== null && (
                  <button onClick={handleQuizNext} className="btn-primary w-full py-2.5 text-xs font-bold">
                    {quizIdx < QUIZ.length - 1 ? t('next') : 'Finish Quiz'}
                  </button>
                )}
              </Card>
            ) : (
              /* Quiz Finished Badge Result */
              <Card className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Award size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {score >= 4 ? t('excellent') : score >= 3 ? t('good') : t('keepLearning')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('yourScore')}: <span className="font-bold text-teal-600">{score} / {QUIZ.length}</span>
                </p>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-xs text-teal-800 dark:text-teal-300 font-medium">
                  {score >= 4
                    ? (lang === 'kn' ? 'ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಜಾಗೃತಿ ರಾಯಭಾರಿ ಪದಕ ಗಳಿಸಿದ್ದೀರಿ!' : 'Oral Health Awareness Champion Badge Earned!')
                    : (lang === 'kn' ? 'ಸ್ಲೈಡ್‌ಗಳನ್ನು ಮತ್ತೊಮ್ಮೆ ನೋಡಿ ಮರುಪ್ರಯತ್ನಿಸಿ.' : 'Review the slides and try again to improve your score.')}
                </div>
                <button onClick={resetQuiz} className="btn-primary py-2.5 px-6 text-xs mx-auto flex items-center gap-1.5">
                  <RotateCcw size={14} />
                  {lang === 'kn' ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Retake Quiz'}
                </button>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: EXPANDED TOPICS */}
        {activeTab === 'topics' && (
          <div className="space-y-3">
            {/* Topic 1 */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {lang === 'kn' ? 'ಅಡಿಕೆ ಮತ್ತು ಗುಟ್ಕಾದ ಅಪಾಯಗಳು' : 'The Truth About Areca Nut & Gutka'}
                </h3>
                <ReadAloudBtn
                  text={
                    lang === 'kn'
                      ? 'ಅಡಿಕೆ ಮತ್ತು ಗುಟ್ಕಾ ಬಾಯಿಯ ಫೈಬ್ರೋಸಿಸ್‌ಗೆ ಪ್ರಮುಖ ಕಾರಣ. ಬಾಯಿ ತೆರೆಯುವುದು ಕಷ್ಟವಾದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.'
                      : 'Areca nut causes submucous fibrosis and cancer even without tobacco.'
                  }
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {lang === 'kn'
                  ? 'ಅಡಿಕೆಯಲ್ಲಿರುವ ಅರೆಕೋಲಿನ್ ಅಂಶವು ಬಾಯಿಯ ಒಳಗಿನ ಚರ್ಮವನ್ನು ಕಲ್ಲಿನಂತೆ ಗಟ್ಟಿಯಾಗಿಸುತ್ತದೆ. ಇದರಿಂದ ವ್ಯಕ್ತಿಗೆ ೨-೩ ಬೆರಳುಗಳಷ್ಟೂ ಬಾಯಿ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ.'
                  : 'Arecoline in areca nut stimulates collagen synthesis, leading to progressive stiffening of oral mucosa (Trismus). Never consider sweet supari safe.'}
              </p>
            </Card>

            {/* Topic 2 */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {lang === 'kn' ? 'ತಂಬಾಕು ತ್ಯಜಿಸಲು ೫ ಮಾರ್ಗಗಳು' : '5 Strategies to Beat Tobacco Cravings'}
                </h3>
                <ReadAloudBtn
                  text={
                    lang === 'kn'
                      ? 'ತಂಬಾಕು ತ್ಯಜಿಸಲು ಲವಂಗ ಅಥವಾ ಸೋಂಪು ಜಗಿಯಿರಿ. ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವ್ಯಾಯಾಮ ಮಾಡಿ.'
                      : 'Delay, distract, drink water, deep breathing and discuss with counsellors.'
                  }
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {lang === 'kn'
                  ? '೧. ಆಸೆ ಬಂದಾಗ ೫ ನಿಮಿಷ ಕಾಯಿರಿ. ೨. ಬಾಯಿಗೆ ಸೋಂಪು ಅಥವಾ ಏಲಕ್ಕಿ ಹಾಕಿ. ೩. ತಣ್ಣೀರು ಕುಡಿಯಿರಿ. ೪. ಆಳವಾದ ಉಸಿರಾಟ ಮಾಡಿ. ೫. ಉಚಿತ ೧೮೦೦-೧೧-೨೩೫೬ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ.'
                  : '1. Delay for 5 minutes. 2. Distract with a healthy alternative (cloves/cardamom). 3. Drink a glass of water. 4. Deep breathing. 5. Call Quitline 1800-11-2356.'}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
