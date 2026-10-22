// Shared UI components

import React from 'react';
import { useApp } from '../context/AppContext';
import { Volume2, VolumeX, AlertCircle, CheckCircle, AlertTriangle, X, ChevronRight } from 'lucide-react';

// ─── Disclaimer Banner ─────────────────────────────────────────────────────────
export function DisclaimerBanner() {
  const { t, speak, stopSpeaking, isSpeaking } = useApp();
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
      <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">{t('disclaimer')}</p>
      <button
        onClick={isSpeaking ? stopSpeaking : () => speak(t('disclaimer'))}
        className="text-amber-600 dark:text-amber-400 p-1"
        aria-label={t('readAloud')}
      >
        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  );
}

// ─── Read Aloud Button ─────────────────────────────────────────────────────────
export function ReadAloudBtn({ text, className = '' }: { text: string; className?: string }) {
  const { speak, stopSpeaking, isSpeaking, t } = useApp();
  return (
    <button
      onClick={isSpeaking ? stopSpeaking : () => speak(text)}
      className={`flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium ${className}`}
      aria-label={isSpeaking ? t('stopReading') : t('readAloud')}
    >
      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      {isSpeaking ? t('stopReading') : t('readAloud')}
    </button>
  );
}

// ─── Risk Badge ────────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const { t } = useApp();
  const classes = {
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    MODERATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  const labels = { LOW: t('low'), MODERATE: t('moderate'), HIGH: t('high') };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${classes[level]}`}>
      {labels[level]}
    </span>
  );
}

// ─── Stage Badge ───────────────────────────────────────────────────────────────
export function StageBadge({ stage }: { stage: string }) {
  const { t } = useApp();
  const stageMap: Record<string, string> = {
    screening_completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    referral_recommended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    appointment_pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    appointment_attended: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    follow_up_recorded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    closed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    lost_to_follow_up: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  const label = t(`stages.${stage}`) || stage;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${stageMap[stage] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick, ...rest }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) {
  return (
    <div
      className={`card p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'teal', onClick, alert, ...rest }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string; onClick?: () => void; alert?: boolean; [key: string]: any;
}) {
  return (
    <div
      className={`card p-4 flex items-center gap-3 ${alert ? 'border-amber-300 dark:border-amber-700' : ''} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      onClick={onClick}
      {...rest}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void; }
export function Toast({ message, type = 'info', onClose }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = { success: <CheckCircle size={18} />, error: <AlertCircle size={18} />, info: <AlertCircle size={18} /> };
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-teal-600',
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm w-[90vw] animate-slide-up`}>
      {icons[type]}
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

// ─── Toast Manager ──────────────────────────────────────────────────────────────
interface ToastState { id: string; message: string; type: 'success' | 'error' | 'info'; }
const toastListeners: Array<(t: ToastState) => void> = [];

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach(fn => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);
  React.useEffect(() => {
    const handler = (t: ToastState) => setToasts(prev => [...prev, t]);
    toastListeners.push(handler);
    return () => { const idx = toastListeners.indexOf(handler); if (idx >= 0) toastListeners.splice(idx, 1); };
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 pt-4 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        </div>
      ))}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </div>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }: {
  title: string;
  action?: (() => void) | { label: string; onPress: () => void | Promise<void> };
  actionLabel?: string;
}) {
  const handler = typeof action === 'function' ? action : action?.onPress;
  const label = actionLabel || (typeof action === 'object' ? action?.label : undefined);

  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      {handler && label && (
        <button onClick={handler} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium">
          {label} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, message, action, actionLabel, cta }: {
  icon: React.ReactNode;
  title?: string;
  subtitle?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
  cta?: { label: string; onPress: () => void | Promise<void> };
}) {
  const heading = title || message || 'No data';
  const handler = action || cta?.onPress;
  const btnLabel = actionLabel || cta?.label;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-gray-300 dark:text-gray-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">{heading}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>}
      {handler && btnLabel && (
        <button onClick={handler} className="btn-primary text-sm py-2 px-4">{btnLabel}</button>
      )}
    </div>
  );
}

// ─── Progress Steps ────────────────────────────────────────────────────────────
export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${idx < current ? 'bg-teal-600 text-white' : idx === current ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 ring-2 ring-teal-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
              {idx < current ? '✓' : idx + 1}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[60px] text-center leading-tight">{step}</span>
          </div>
          {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${idx < current ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-600'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, label, className = '' }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; className?: string;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked ? 'bg-teal-600 border-teal-600' : 'border-gray-300 dark:border-gray-500'}`}
      >
        {checked && <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3"><path d="M1 5l3.5 4L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{label}</span>
    </label>
  );
}

// ─── Overdue Badge ─────────────────────────────────────────────────────────────
export function OverdueBadge({ days }: { days: number }) {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
      <AlertTriangle size={10} />
      {t('overdueLabel')} · {t('overdueDays', { n: days })}
    </span>
  );
}

// ─── Language Toggle ───────────────────────────────────────────────────────────
export function LanguageToggle() {
  const { lang, setLang } = useApp();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-medium border border-teal-200 dark:border-teal-800 transition-colors"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
    </button>
  );
}
