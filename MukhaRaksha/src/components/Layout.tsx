import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, FileText, BookOpen, MoreHorizontal, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DisclaimerBanner, LanguageToggle } from './ui';

const tabs = [
  { path: '/', icon: Home, key: 'home' },
  { path: '/screen', icon: Search, key: 'screen' },
  { path: '/cases', icon: FileText, key: 'cases' },
  { path: '/learn', icon: BookOpen, key: 'learn' },
  { path: '/more', icon: MoreHorizontal, key: 'more' },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showDisclaimer?: boolean;
  headerRight?: React.ReactNode;
}

export default function Layout({ children, title, showDisclaimer = false, headerRight }: LayoutProps) {
  const { t, lang, settings, darkMode, setDarkMode } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sleek Glassmorphic Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-xs shadow-teal-500/20">
              <span className="text-white text-base font-black">ಮ</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Client-Side Ready" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {title || (lang === 'kn' ? 'ಮುಖರಕ್ಷಾ' : 'MukhaRaksha')}
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                ASHA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಬಾಯಿ ಆರೋಗ್ಯ ಜಾಗೃತಿ' : 'Oral Cancer Screening PWA'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {headerRight}

          {/* Quick theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <LanguageToggle />
        </div>
      </header>

      {/* Persistent Disclaimer */}
      {showDisclaimer && <DisclaimerBanner />}

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Floating Glassmorphic Bottom Tab Bar */}
      <nav className="tab-bar">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-teal-50 to-teal-100/80 dark:from-teal-950/60 dark:to-teal-900/40 text-teal-600 dark:text-teal-400 shadow-2xs'
                        : ''
                    }`}
                  >
                    <tab.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span className="text-[10px] leading-tight">{t(tab.key)}</span>
                  {isActive && (
                    <span className="w-1 h-1 bg-teal-600 dark:bg-teal-400 rounded-full mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
