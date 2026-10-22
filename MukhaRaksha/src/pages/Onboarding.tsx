import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/* ─────────────────────────── SVG Illustrations ─────────────────────────── */

const MouthHealthSVG: React.FC = () => (
  <svg
    viewBox="0 0 220 200"
    className="w-56 h-48"
    aria-hidden="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Face outline */}
    <ellipse cx="110" cy="95" rx="80" ry="85" fill="#FFF3E0" stroke="#FF8A65" strokeWidth="3" />
    {/* Eyes */}
    <circle cx="82" cy="72" r="9" fill="#37474F" />
    <circle cx="138" cy="72" r="9" fill="#37474F" />
    <circle cx="85" cy="69" r="3" fill="white" />
    <circle cx="141" cy="69" r="3" fill="white" />
    {/* Smile / Mouth */}
    <path d="M76 120 Q110 155 144 120" stroke="#E53935" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Teeth */}
    <rect x="85" y="120" width="14" height="12" rx="2" fill="white" stroke="#BDBDBD" strokeWidth="1" />
    <rect x="101" y="120" width="18" height="14" rx="2" fill="white" stroke="#BDBDBD" strokeWidth="1" />
    <rect x="121" y="120" width="14" height="12" rx="2" fill="white" stroke="#BDBDBD" strokeWidth="1" />
    {/* Red cross / health symbol */}
    <rect x="150" y="30" width="8" height="24" rx="2" fill="#E53935" />
    <rect x="143" y="37" width="22" height="8" rx="2" fill="#E53935" />
    {/* Nose */}
    <path d="M105 90 Q110 100 115 90" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const StethoscopeSVG: React.FC = () => (
  <svg
    viewBox="0 0 220 200"
    className="w-56 h-48"
    aria-hidden="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stethoscope tube */}
    <path
      d="M60 40 C60 80 80 100 110 110 C140 120 160 140 160 170"
      stroke="#00897B"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Second ear piece */}
      <path
      d="M80 40 C80 80 95 100 110 110"
      stroke="#00897B"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Ear pieces */}
    <circle cx="60" cy="36" r="10" fill="#004D40" />
    <circle cx="80" cy="36" r="10" fill="#004D40" />
    {/* Chest piece (diaphragm) */}
    <circle cx="160" cy="170" r="22" fill="#00897B" stroke="#004D40" strokeWidth="3" />
    <circle cx="160" cy="170" r="13" fill="#80CBC4" />
    {/* Heartbeat line */}
    <polyline
      points="80,130 92,130 98,115 106,148 114,118 120,130 140,130"
      stroke="#E53935"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Clipboard behind */}
    <rect x="10" y="60" width="50" height="65" rx="4" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2" />
    <line x1="18" y1="78" x2="52" y2="78" stroke="#81C784" strokeWidth="2" />
    <line x1="18" y1="90" x2="52" y2="90" stroke="#81C784" strokeWidth="2" />
    <line x1="18" y1="102" x2="40" y2="102" stroke="#81C784" strokeWidth="2" />
    <rect x="24" y="56" width="22" height="8" rx="2" fill="#4CAF50" />
  </svg>
);

const TrackingSVG: React.FC = () => (
  <svg
    viewBox="0 0 220 200"
    className="w-56 h-48"
    aria-hidden="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Timeline vertical line */}
    <line x1="70" y1="20" x2="70" y2="185" stroke="#B2DFDB" strokeWidth="3" strokeDasharray="6 4" />
    {/* Step 1 - Screening */}
    <circle cx="70" cy="45" r="16" fill="#00897B" />
    <polyline points="62,45 68,52 80,38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="96" y="34" width="100" height="22" rx="6" fill="#E0F2F1" />
    <rect x="104" y="40" width="60" height="6" rx="3" fill="#00897B" />
    <rect x="104" y="50" width="40" height="4" rx="2" fill="#80CBC4" />
    {/* Step 2 - Follow-up */}
    <circle cx="70" cy="105" r="16" fill="#FF8F00" />
    <rect x="63" y="98" width="14" height="3" rx="1.5" fill="white" />
    <rect x="63" y="104" width="14" height="3" rx="1.5" fill="white" />
    <rect x="63" y="110" width="9" height="3" rx="1.5" fill="white" />
    <rect x="96" y="94" width="100" height="22" rx="6" fill="#FFF8E1" />
    <rect x="104" y="100" width="60" height="6" rx="3" fill="#FF8F00" />
    <rect x="104" y="110" width="40" height="4" rx="2" fill="#FFE082" />
    {/* Step 3 - Cleared */}
    <circle cx="70" cy="165" r="16" fill="#43A047" />
    <polyline points="62,165 68,172 80,158" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="96" y="154" width="100" height="22" rx="6" fill="#E8F5E9" />
    <rect x="104" y="160" width="60" height="6" rx="3" fill="#43A047" />
    <rect x="104" y="170" width="40" height="4" rx="2" fill="#A5D6A7" />
  </svg>
);

/* ──────────────────────────── Slide Data Type ───────────────────────────── */

interface Slide {
  illustration: React.ReactNode;
  titleKey: string;
  subtitleKey: string;
  accentColor: string;
}

/* ─────────────────────────────── Component ─────────────────────────────── */

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { t, settings } = useApp();
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);

  const slides: Slide[] = [
    {
      illustration: <MouthHealthSVG />,
      titleKey: 'onboarding.slide1.title',
      subtitleKey: 'onboarding.slide1.subtitle',
      accentColor: 'bg-teal-600',
    },
    {
      illustration: <StethoscopeSVG />,
      titleKey: 'onboarding.slide2.title',
      subtitleKey: 'onboarding.slide2.subtitle',
      accentColor: 'bg-teal-700',
    },
    {
      illustration: <TrackingSVG />,
      titleKey: 'onboarding.slide3.title',
      subtitleKey: 'onboarding.slide3.subtitle',
      accentColor: 'bg-teal-800',
    },
  ];

  const isLast = current === slides.length - 1;

  const animateAndRun = (fn: () => void) => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      fn();
    }, 250);
  };

  const handleNext = () => {
    if (isLast) {
      handleGetStarted();
    } else {
      animateAndRun(() => setCurrent((prev) => prev + 1));
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Mark onboarding as complete via settings update
    if (settings && (settings as any).update) {
      (settings as any).update({ onboardingComplete: true });
    }
    // Persist via AppContext if available — fallback to localStorage
    try {
      const stored = localStorage.getItem('mukharaksha_settings');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'mukharaksha_settings',
        JSON.stringify({ ...parsed, onboardingComplete: true })
      );
    } catch {
      /* ignore */
    }
    navigate('/');
  };

  const slide = slides[current];

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Coloured header blob */}
      <div
        className={`${slide.accentColor} transition-colors duration-500 pt-12 pb-20 flex flex-col items-center rounded-b-[48px] shadow-lg`}
      >
        {/* Skip button */}
        {!isLast && (
          <div className="w-full flex justify-end px-6 mb-4">
            <button
              onClick={handleSkip}
              className="text-teal-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors min-h-[44px]"
              aria-label={t('onboarding.skip')}
            >
              {t('onboarding.skip')}
            </button>
          </div>
        )}

        {/* Illustration */}
        <div
          className="flex items-center justify-center"
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? 'translateX(-30px)' : 'translateX(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          {slide.illustration}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center px-8 pt-8 pb-6">
        <div
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3 leading-snug">
            {t(slide.titleKey)}
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-xs mx-auto">
            {t(slide.subtitleKey)}
          </p>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mt-8" role="tablist" aria-label={t('onboarding.slideIndicator')}>
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`${t('onboarding.slideLabel')} ${i + 1}`}
              onClick={() => animateAndRun(() => setCurrent(i))}
              className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              style={{
                width: i === current ? 28 : 10,
                height: 10,
                backgroundColor: i === current ? '#0d9488' : '#CBD5E1',
              }}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Button */}
        <div className="w-full max-w-xs mt-6 space-y-3">
          <button
            onClick={handleNext}
            className="w-full bg-teal-600 text-white font-semibold text-lg py-4 rounded-2xl shadow-md hover:bg-teal-700 active:scale-95 transition-all min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          >
            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>

          {isLast && (
            <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
              {t('onboarding.disclaimer')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
