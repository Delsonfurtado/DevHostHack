import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { t, settings } = useApp();
  const [dotIndex, setDotIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(fadeTimer);
  }, []);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev: number) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Auto-navigate after 2.5 seconds
  useEffect(() => {
    const navTimer = setTimeout(() => {
      if (settings?.onboardingComplete) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    }, 2500);
    return () => clearTimeout(navTimer);
  }, [navigate, settings?.onboardingComplete]);

  const dots = [0, 1, 2].map((i) => (
    <span
      key={i}
      className="inline-block w-2 h-2 rounded-full mx-1 transition-all duration-300"
      style={{
        backgroundColor: dotIndex > i ? '#ffffff' : 'rgba(255,255,255,0.35)',
        transform: dotIndex === i ? 'scale(1.4)' : 'scale(1)',
      }}
    />
  ));

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between bg-teal-600 px-6 py-10"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
      aria-label={t('splash.appName')}
      role="main"
    >
      {/* Top spacer */}
      <div className="flex-1" />

      {/* Logo + App Name */}
      <div className="flex flex-col items-center gap-6">
        {/* Kannada 'ಮ' Logo Circle */}
        <div
          className="flex items-center justify-center rounded-full bg-white shadow-2xl"
          style={{ width: 120, height: 120 }}
          aria-hidden="true"
        >
          <span
            className="font-kannada text-teal-600 select-none"
            style={{ fontSize: 64, lineHeight: 1, fontWeight: 700 }}
          >
            ಮ
          </span>
        </div>

        {/* App name in Kannada */}
        <div className="text-center">
          <h1
            className="font-kannada text-white font-bold tracking-wide"
            style={{ fontSize: 32, lineHeight: 1.2 }}
          >
            ಮುಖರಕ್ಷ
          </h1>
          {/* App name in English */}
          <p className="text-teal-100 font-semibold text-xl mt-1 tracking-widest uppercase">
            MukhaRaksha
          </p>
        </div>

        {/* Tagline */}
        <p
          className="text-teal-100 text-center text-base max-w-xs"
          style={{ lineHeight: 1.5 }}
        >
          {t('splash.tagline')}
        </p>

        {/* Loading dots */}
        <div className="flex items-center mt-4" aria-label={t('splash.loading')} role="status">
          {dots}
        </div>
      </div>

      {/* Bottom area */}
      <div className="flex-1" />

      {/* Disclaimer */}
      <div className="w-full max-w-sm text-center">
        <p className="text-teal-200 text-xs leading-relaxed px-4">
          {t('splash.disclaimer')}
        </p>
        <p className="text-teal-300 text-xs mt-2 opacity-70">
          {t('splash.version')}
        </p>
      </div>
    </div>
  );
};

export default Splash;
