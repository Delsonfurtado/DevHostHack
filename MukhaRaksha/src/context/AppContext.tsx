import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, UserRole, AppSettings } from '../types/models';
import { translations } from '../i18n/translations';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  role: UserRole;
  setRole: (role: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const defaultSettings: AppSettings = {
  language: 'en',
  role: 'health_worker',
  darkMode: false,
  pinEnabled: false,
  onboardingComplete: false,
  notificationsEnabled: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('mukharaksha_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lang = settings.language;
  const role = settings.role;
  const darkMode = settings.darkMode;

  useEffect(() => {
    localStorage.setItem('mukharaksha_settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const setLang = useCallback((l: Language) => updateSettings({ language: l }), [updateSettings]);
  const setRole = useCallback((r: UserRole) => updateSettings({ role: r }), [updateSettings]);
  const setDarkMode = useCallback((v: boolean) => updateSettings({ darkMode: v }), [updateSettings]);

  // Nested key resolver
  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const dict = translations[lang] as Record<string, unknown>;
    const parts = key.split('.');
    let val: unknown = dict;
    for (const part of parts) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[part];
      } else {
        val = undefined;
        break;
      }
    }
    if (val === undefined) {
      // fallback to English
      let fallback: unknown = translations.en as Record<string, unknown>;
      for (const part of parts) {
        if (fallback && typeof fallback === 'object') {
          fallback = (fallback as Record<string, unknown>)[part];
        } else {
          fallback = undefined;
          break;
        }
      }
      val = fallback ?? key;
    }
    let result = typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }
    return result;
  }, [lang]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    utter.rate = 0.9;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return (
    <AppContext.Provider value={{ lang, setLang, t, role, setRole, darkMode, setDarkMode, settings, updateSettings, speak, stopSpeaking, isSpeaking }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
