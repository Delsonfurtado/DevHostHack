import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, FileText, BookOpen, MoreHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DisclaimerBanner } from './ui';
import { LanguageToggle } from './ui';

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
  const { t, settings } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">ಮ</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {title || (settings.language === 'kn' ? 'ಮುಖರಕ್ಷಾ' : 'MukhaRaksha')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          <LanguageToggle />
        </div>
      </header>

      {/* Disclaimer */}
      {showDisclaimer && <DisclaimerBanner />}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <div className="flex items-center">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-teal-50 dark:bg-teal-900/30' : ''}`}>
                    <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="text-[10px] font-medium">{t(tab.key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
