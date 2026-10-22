// Shared UI components

import React from 'react';
import { useApp } from '../context/AppContext';
import { Volume2, VolumeX, AlertCircle, CheckCircle, AlertTriangle, X, ChevronRight, ShieldAlert } from 'lucide-react';

// ─── Disclaimer Banner ─────────────────────────────────────────────────────────
export function DisclaimerBanner() {
  const { t, speak, stopSpeaking, isSpeaking } = useApp();
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-teal-500/10 dark:from-amber-950/40 dark:to-teal-950/30 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between gap-2.5 backdrop-blur-xs">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <ShieldAlert size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-[11px] leading-snug font-medium text-amber-800 dark:text-amber-300 truncate sm:whitespace-normal">
          {t('disclaimer')}
        </p>
      </div>
      <button
        onClick={isSpeaking ? stopSpeaking : () => speak(t('disclaimer'))}
        className="text-amber-700 dark:text-amber-300 hover:text-amber-900 bg-amber-100/70 dark:bg-amber-900/50 p-1.5 rounded-lg shrink-0 transition-colors"
        aria-label={t('readAloud')}
        title={isSpeaking ? t('stopReading') : t('readAloud')}
      >
        {isSpeaking ? <VolumeX size={13} className="text-red-500 animate-pulse" /> : <Volume2 size={13} />}
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200/60 dark:border-teal-800/60 text-xs font-semibold shadow-2xs transition-all active:scale-95 ${className}`}
      aria-label={isSpeaking ? t('stopReading') : t('readAloud')}
    >
      {isSpeaking ? <VolumeX size={13} className="text-rose-500 animate-pulse" /> : <Volume2 size={13} />}
      <span>{isSpeaking ? t('stopReading') : t('readAloud')}</span>
    </button>
  );
}

// ─── Risk Badge ────────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const { t } = useApp();
  const configs = {
    LOW: {
      style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      label: t('low'),
    },
    MODERATE: {
      style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      label: t('moderate'),
    },
    HIGH: {
      style: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse',
      dot: 'bg-rose-500',
      label: t('high'),
    },
  };
  const config = configs[level] || configs.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs ${config.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ─── Stage Badge ───────────────────────────────────────────────────────────────
export function StageBadge({ stage }: { stage: string }) {
  const { t } = useApp();
  const stageMap: Record<string, string> = {
    screening_completed: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    referral_recommended: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    appointment_pending: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    appointment_attended: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    follow_up_recorded: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    closed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    lost_to_follow_up: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };
  const label = t(`stages.${stage}`) || stage;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${stageMap[stage] || 'bg-slate-100 text-slate-700'}`}>
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-rose-50 to-red-100 dark:from-rose-950/60 dark:to-red-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-full text-[11px] font-bold shadow-2xs">
      <AlertTriangle size={11} className="text-rose-500 animate-bounce" />
      <span>{t('overdueLabel')}</span>
      <span className="w-1 h-1 rounded-full bg-rose-400" />
      <span>{t('overdueDays', { n: days })}</span>
    </span>
  );
}

// ─── Language Toggle ───────────────────────────────────────────────────────────
export function LanguageToggle() {
  const { lang, setLang } = useApp();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-200 text-xs font-bold border border-teal-200/80 dark:border-teal-800/80 transition-all shadow-2xs active:scale-95"
      aria-label="Toggle language"
    >
      <span className={`w-2 h-2 rounded-full ${lang === 'kn' ? 'bg-amber-500' : 'bg-teal-500'}`} />
      <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
    </button>
  );
}
