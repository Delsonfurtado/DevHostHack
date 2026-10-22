import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  FileText,
  BookOpen,
  MoreHorizontal,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Sparkles,
  Camera,
  Baby,
  Eye,
  Flame,
  BarChart3,
  Tent,
  MessageSquare,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DisclaimerBanner, LanguageToggle } from './ui';

const MOBILE_TABS = [
  { path: '/', icon: Home, key: 'home' },
  { path: '/screen', icon: Search, key: 'screen' },
  { path: '/cases', icon: FileText, key: 'cases' },
  { path: '/learn', icon: BookOpen, key: 'learn' },
  { path: '/more', icon: MoreHorizontal, key: 'more' },
];

const DESKTOP_NAV_ITEMS = [
  { path: '/', icon: Home, labelEn: 'Dashboard Home', labelKn: 'ಮುಖಪುಟ' },
  { path: '/screen', icon: Search, labelEn: 'Screening Wizard', labelKn: 'ಹೊಸ ತಪಾಸಣೆ' },
  { path: '/cases', icon: FileText, labelEn: 'Cases & Referral Tracker', labelKn: 'ಪ್ರಕರಣಗಳ ನಿಗಾ' },
  { path: '/capture', icon: Camera, labelEn: 'Smart Capture Guard', labelKn: 'ಕ್ಯಾಮರಾ ಗಾರ್ಡ್' },
  { path: '/dashboard', icon: BarChart3, labelEn: 'Analytics Dashboard', labelKn: 'ವಿಶ್ಲೇಷಣಾ ಪಟ್ಟಿ' },
  { path: '/child-care', icon: Baby, labelEn: 'Child & Nutrition Care', labelKn: 'ಮಕ್ಕಳ ಪೌಷ್ಟಿಕ ಆರೈಕೆ' },
  { path: '/learn', icon: BookOpen, labelEn: 'Learn Hub & Explainer', labelKn: 'ಕಲಿಯಿರಿ ಮತ್ತು ವೀಡಿಯೋ' },
  { path: '/self-exam', icon: Eye, labelEn: 'Self-Exam Timeline', labelKn: 'ಮಾಸಿಕ ಸ್ವ-ಪರೀಕ್ಷೆ' },
  { path: '/habit-coach', icon: Flame, labelEn: 'Habit Coach & Cessation', labelKn: 'ತಂಬಾಕು ಮುಕ್ತಿ ಕೋಚ್' },
  { path: '/camp', icon: Tent, labelEn: 'Village Camp Mode', labelKn: 'ಆರೋಗ್ಯ ಶಿಬಿರ' },
  { path: '/chat', icon: MessageSquare, labelEn: 'Ask Gram Paricharya AI', labelKn: 'AI ಸಹಾಯಕ' },
  { path: '/more', icon: MoreHorizontal, labelEn: 'Settings & Directory', labelKn: 'ಸೆಟ್ಟಿಂಗ್ಸ್ & ಆಸ್ಪತ್ರೆಗಳು' },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showDisclaimer?: boolean;
  headerRight?: React.ReactNode;
}

export default function Layout({ children, title, showDisclaimer = false, headerRight }: LayoutProps) {
  const { t, lang, role, setRole, darkMode, setDarkMode, deviceMode, setDeviceMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isHealthWorker = role === 'health_worker';

  // Determine whether to force Phone frame or Desktop view
  const isForcedPhone = deviceMode === 'phone';
  const isForcedDesktop = deviceMode === 'desktop';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ─── Top Master Bar with Device Switcher ───────────────────────────────────── */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-800 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200 hidden sm:inline">
            Gram Paricharya (ಗ್ರಾಮ ಪರಿಚರ್ಯೆ) • Karnataka Community Health Portal
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300 font-mono">
            100% Client-Side PWA
          </span>
        </div>

        {/* Device Switcher Pills (Phone UI vs PC UI) */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setDeviceMode('auto')}
            className={`px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
              deviceMode === 'auto'
                ? 'bg-teal-600 text-white font-bold shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Automatic Responsive Layout"
          >
            <span className="text-[10px]">Auto</span>
          </button>
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
              deviceMode === 'desktop'
                ? 'bg-teal-600 text-white font-bold shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop PC Multi-Column Layout"
          >
            <Laptop size={12} />
            <span className="text-[10px] hidden sm:inline">PC UI</span>
          </button>
          <button
            onClick={() => setDeviceMode('phone')}
            className={`px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
              deviceMode === 'phone'
                ? 'bg-teal-600 text-white font-bold shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile Phone Viewport Preview"
          >
            <Smartphone size={12} />
            <span className="text-[10px] hidden sm:inline">Phone UI</span>
          </button>
        </div>
      </div>

      {/* ─── Render either Forced Phone Frame OR Full Desktop/Responsive Shell ───── */}
      {isForcedPhone ? (
        /* PHONE SIMULATOR FRAME FOR PC/DESKTOP SCREENS */
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-slate-200 dark:bg-slate-900 overflow-y-auto">
          <div className="w-[390px] h-[844px] max-h-[92vh] bg-white dark:bg-slate-950 rounded-[44px] shadow-2xl border-[10px] border-slate-800 dark:border-slate-700 flex flex-col overflow-hidden relative">
            {/* Top Speaker / Dynamic Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-800 rounded-full z-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Phone Internal Header */}
            <header className="pt-7 pb-2.5 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 z-40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  ಗ
                </div>
                <div>
                  <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {title || (lang === 'kn' ? 'ಗ್ರಾಮ ಪರಿಚರ್ಯೆ' : 'Gram Paricharya')}
                  </h1>
                  <span className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold">
                    {isHealthWorker ? 'ASHA Mode' : 'Citizen Mode'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                </button>
                <LanguageToggle />
              </div>
            </header>

            {/* Disclaimer */}
            {showDisclaimer && <DisclaimerBanner />}

            {/* Mobile Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto pb-20">
              {children}
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 z-50 py-1.5 px-3">
              <div className="flex items-center justify-around">
                {MOBILE_TABS.map((tab) => (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    end={tab.path === '/'}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center gap-0.5 transition-all ${
                        isActive
                          ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                          : 'text-slate-400 font-medium'
                      }`
                    }
                  >
                    <tab.icon size={19} />
                    <span className="text-[9px] leading-tight">{t(tab.key)}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      ) : (
        /* PC DESKTOP & RESPONSIVE AUTO LAYOUT */
        <div className="flex-1 flex overflow-hidden">
          {/* ─── Left Desktop Sidebar (Visible on md and up, or forced desktop) ──────── */}
          <aside
            className={`${
              isForcedDesktop ? 'flex' : 'hidden md:flex'
            } flex-col w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800/90 h-[calc(100vh-32px)] sticky top-8 z-30 shadow-xs`}
          >
            {/* Sidebar Brand Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-teal-500/20">
                ಗ
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Gram Paricharya
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                    ಗ್ರಾಮ ಪರಿಚರ್ಯೆ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Community Health & Nutrition Care
                </p>
              </div>
            </div>

            {/* Role Switcher Pill inside Sidebar */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isHealthWorker ? 'ASHA / ANM' : 'Individual'}
                </span>
              </div>
              <button
                onClick={() => setRole(isHealthWorker ? 'individual' : 'health_worker')}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs"
              >
                Switch
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                {lang === 'kn' ? 'ಮುಖ್ಯ ಮೆನು' : 'Main Clinical Menu'}
              </div>

              {DESKTOP_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-600'} />
                    <span className="truncate">{lang === 'kn' ? item.labelKn : item.labelEn}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Sidebar Bottom Banner & Quitline */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <a
                href="tel:1800112356"
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-50 to-coral-50 dark:from-rose-950/40 dark:to-coral-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall size={14} className="text-rose-600" />
                  <span>Quitline: 1800-11-2356</span>
                </div>
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">Free</span>
              </a>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-teal-600" />
                  Client-Side DB
                </span>
                <span>v1.0.0</span>
              </div>
            </div>
          </aside>

          {/* ─── Main Content Canvas (Responsive Desktop / Phone) ───────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Desktop Top Header Bar */}
            <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
              <div className="flex items-center gap-3">
                {/* Mobile Hamburger / Logo */}
                <div className={`${isForcedDesktop ? 'hidden' : 'md:hidden'} flex items-center gap-2`}>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ಗ
                  </div>
                </div>

                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {title || (lang === 'kn' ? 'ಗ್ರಾಮ ಪರಿಚರ್ಯೆ' : 'Gram Paricharya')}
                  </h1>
                  <p className="text-xs text-slate-400 hidden sm:block">
                    {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಸಮುದಾಯ ಆರೋಗ್ಯ ಮತ್ತು ಪೌಷ್ಟಿಕ ಆರೈಕೆ' : 'Karnataka Community Health & Nutrition Care'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {headerRight}

                {/* Dark mode switch */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle theme"
                  aria-label="Toggle theme"
                >
                  {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
                </button>

                <LanguageToggle />
              </div>
            </header>

            {/* Disclaimer Banner */}
            {showDisclaimer && <DisclaimerBanner />}

            {/* Main Page Content Body */}
            <main className={`flex-1 ${isForcedDesktop ? 'pb-8' : 'pb-24 md:pb-12'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                {children}
              </div>
            </main>

            {/* Mobile Bottom Tab Bar (hidden on PC desktop unless mobile) */}
            <nav
              className={`${
                isForcedDesktop ? 'hidden' : 'md:hidden'
              } tab-bar`}
            >
              <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-1">
                {MOBILE_TABS.map((tab) => (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    end={tab.path === '/'}
                    className={({ isActive }) =>
                      `flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                          : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 font-medium'
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
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
