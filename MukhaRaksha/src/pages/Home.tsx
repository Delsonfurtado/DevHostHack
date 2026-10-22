import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Camera,
  Baby,
  Heart,
  BarChart3,
  Tent,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  ShieldAlert,
  MessageSquare,
  Activity,
  Flame,
  Eye,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Card, StatCard, SectionHeader, EmptyState, RiskBadge, OverdueBadge, ReadAloudBtn } from '../components/ui';
import { db } from '../db/database';
import type { Screening, Patient } from '../types/models';

export default function Home() {
  const navigate = useNavigate();
  const { t, lang, role } = useApp();

  const isHealthWorker = role === 'health_worker';

  // Live queries
  const allScreenings = useLiveQuery(() => db.screenings.toArray(), []) || [];
  const allPatients = useLiveQuery(() => db.patients.toArray(), []) || [];

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    allPatients.forEach((p) => map.set(p.id, p));
    return map;
  }, [allPatients]);

  // Today's Screenings
  const todayCount = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return allScreenings.filter((s) => new Date(s.createdAt).getTime() >= startOfToday).length;
  }, [allScreenings]);

  // Overdue Check
  const overdueScreenings = useMemo(() => {
    const now = Date.now();
    return allScreenings.filter((s) => {
      const createdTime = new Date(s.createdAt).getTime();
      const days = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
      const isRefOverdue =
        (s.stage === 'referral_recommended' || s.stage === 'appointment_pending') &&
        days > 14 &&
        !s.appointmentAttended;

      const isFollowUpOverdue =
        s.followUpDate && now > new Date(s.followUpDate).getTime() && s.stage !== 'closed';

      return isRefOverdue || isFollowUpOverdue;
    });
  }, [allScreenings]);

  // High risk count
  const highRiskCount = useMemo(() => {
    return allScreenings.filter((s) => s.riskLevel === 'HIGH').length;
  }, [allScreenings]);

  // Recent 5 screenings
  const recentScreenings = useMemo(() => {
    return [...allScreenings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allScreenings]);

  // Time based greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return t('goodMorning');
    if (hr < 17) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  // Quick Action Config
  const quickActions = [
    {
      title: t('newScreening'),
      desc: lang === 'kn' ? '೫ ಹಂತದ ತಪಾಸಣೆ' : '5-Step Wizard',
      route: '/screen',
      icon: ClipboardList,
      gradient: 'from-teal-600 to-teal-700',
    },
    {
      title: t('captureImage'),
      desc: lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಮರಾ' : 'Quality Guard AI',
      route: '/capture',
      icon: Camera,
      gradient: 'from-rose-500 to-coral-500',
    },
    {
      title: t('childCare'),
      desc: 'ಮಕ್ಕಳ ಪೌಷ್ಟಿಕ ಆರೈಕೆ',
      route: '/child-care',
      icon: Baby,
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      title: t('selfExam'),
      desc: lang === 'kn' ? 'ಮಾಸಿಕ ೨-ನಿಮಿಷ' : 'Monthly Mirror Check',
      route: '/self-exam',
      icon: Eye,
      gradient: 'from-indigo-600 to-indigo-700',
    },
    {
      title: t('habitCoach'),
      desc: lang === 'kn' ? 'ತಂಬಾಕು ತ್ಯಜಿಸಿ' : 'Quit Tobacco Support',
      route: '/habit-coach',
      icon: Flame,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: t('dashboard'),
      desc: lang === 'kn' ? 'ಪ್ರಗತಿ ವಿಶ್ಲೇಷಣೆ' : 'Live Continuum Analytics',
      route: '/dashboard',
      icon: BarChart3,
      gradient: 'from-emerald-600 to-teal-700',
    },
  ];

  return (
    <Layout showDisclaimer>
      <div className="space-y-5">
        {/* Responsive Grid: Phone (1 column) vs Desktop PC (Multi-column Dashboard) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── Left / Main Column (lg:col-span-8) ──────────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">
            {/* Hero Welcome Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 sm:p-7 shadow-md">
              <div className="absolute -top-12 -right-12 w-52 h-52 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-coral-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-100 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isHealthWorker
                      ? lang === 'kn'
                        ? 'ಆಶಾ / ಎಎನ್ಎಂ ಕಾರ್ಯಕರ್ತ ಪೋರ್ಟಲ್'
                        : 'ASHA / ANM Healthcare Portal'
                      : lang === 'kn'
                      ? 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್'
                      : 'Citizen Healthcare Mode'}
                  </span>

                  {isHealthWorker && (
                    <button
                      onClick={() => navigate('/camp')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                    >
                      <Tent size={14} />
                      {t('campMode')}
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {greeting}, {isHealthWorker ? 'ASHA Healthcare Worker' : 'Welcome'}!
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed mt-1 max-w-2xl">
                    {lang === 'kn'
                      ? 'ಕರ್ನಾಟಕದ ಗ್ರಾಮೀಣ ಮತ್ತು ನಗರ ಪ್ರದೇಶಗಳಲ್ಲಿ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಮುಂಚಿತ ಪತ್ತೆ, ಇಮೇಜ್ ಗಾರ್ಡ್ ಮತ್ತು ರೆಫರಲ್ ಟ್ರ್ಯಾಕಿಂಗ್.'
                      : 'Comprehensive oral cancer triage, on-device camera quality guard, and seamless referral closure continuum.'}
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                  <span className="text-xs text-teal-200">
                    {allScreenings.length} {lang === 'kn' ? 'ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ' : 'cases recorded locally'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/screen')}
                      className="bg-white hover:bg-teal-50 text-teal-800 text-xs sm:text-sm font-bold py-2 px-4 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      + {t('newScreening')}
                    </button>
                    <button
                      onClick={() => navigate('/cases')}
                      className="bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-xl backdrop-blur-sm transition-all"
                    >
                      {t('cases')} & Kanban
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Stat Cards Row (Responsive Grid: 2 cols on mobile, 4 cols on PC) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label={t('todayScreenings')}
                value={todayCount}
                icon={<ClipboardList size={22} />}
                color="teal"
                onClick={() => navigate('/cases')}
              />
              <StatCard
                label={t('overdueFollowUps')}
                value={overdueScreenings.length}
                icon={<AlertTriangle size={22} />}
                color="amber"
                alert={overdueScreenings.length > 0}
                onClick={() => navigate('/cases')}
              />
              <StatCard
                label={t('highRiskCases')}
                value={highRiskCount}
                icon={<Heart size={22} />}
                color="red"
                alert={highRiskCount > 0}
                onClick={() => navigate('/cases')}
              />
              <StatCard
                label={lang === 'kn' ? 'ಒಟ್ಟು ರೋಗಿಗಳು' : 'Total Patients'}
                value={allPatients.length}
                icon={<Users size={22} />}
                color="blue"
                onClick={() => navigate('/cases')}
              />
            </div>

            {/* 6 Quick Action Grid (Responsive: 2 cols on mobile, 3 cols on PC) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('quickActions')}
                </h3>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  {lang === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಲಭ್ಯವಿದೆ' : 'Offline Ready'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const IconComp = action.icon;
                  return (
                    <div
                      key={action.route}
                      onClick={() => navigate(action.route)}
                      className="card-interactive p-4 flex flex-col justify-between gap-3 group"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${action.gradient} flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {action.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {action.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Cases Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('recentCases')}
                </h3>
                <button
                  onClick={() => navigate('/cases')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5 hover:underline"
                >
                  {t('viewAll')} <ChevronRight size={14} />
                </button>
              </div>

              {recentScreenings.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList size={38} className="text-slate-300" />}
                  title={lang === 'kn' ? 'ಇನ್ನೂ ತಪಾಸಣೆ ನಡೆದಿಲ್ಲ' : 'No screenings recorded yet'}
                  subtitle={
                    lang === 'kn'
                      ? 'ಹೊಸ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ಡೆಮೋ ಡೇಟಾ ಲೋಡ್ ಮಾಡಿ.'
                      : 'Start a new oral screening or explore with sample patient data.'
                  }
                  action={() => navigate('/screen')}
                  actionLabel={t('newScreening')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentScreenings.map((s) => {
                    const p = patientMap.get(s.patientId);
                    return (
                      <Card
                        key={s.id}
                        onClick={() => navigate(`/cases/${s.id}`)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {p?.name || 'Patient'}
                            </span>
                            <RiskBadge level={s.riskLevel} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{p?.village || 'Village'}</span>
                            <span>•</span>
                            <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <ChevronRight size={16} className="text-slate-400 shrink-0 ml-2" />
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column (lg:col-span-4 on PC) ─────────────────────────────── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Ask Gram Paricharya AI Quick Assistant Box */}
            <Card className="p-4 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/15 border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t('chatTitle')}
                    </h4>
                    <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">
                      Clinical AI Assistant
                    </span>
                  </div>
                </div>
                <span className="text-[9px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'kn'
                  ? 'ಬಾಯಿ ಹುಣ್ಣು, ಅಡಿಕೆ ದುಷ್ಪರಿಣಾಮ, ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ ಅಥವಾ ತಂಬಾಕು ಬಿಡುವ ಕುರಿತು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'
                  : 'Ask clinical guidance, areca nut carcinogenicity, or tobacco cessation distraction techniques.'}
              </p>

              <button
                onClick={() => navigate('/chat')}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                Launch AI Assistant <ArrowRight size={14} />
              </button>
            </Card>

            {/* Overdue Follow-ups Alert List */}
            {isHealthWorker && (
              <Card className="p-4 space-y-3 border-rose-200 dark:border-rose-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-rose-500 animate-pulse" />
                    {t('overdueFollowUps')} ({overdueScreenings.length})
                  </h3>
                  <button
                    onClick={() => navigate('/cases')}
                    className="text-[11px] font-bold text-teal-600 hover:underline"
                  >
                    Manage
                  </button>
                </div>

                {overdueScreenings.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>No overdue cases pending!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueScreenings.slice(0, 4).map((s) => {
                      const p = patientMap.get(s.patientId);
                      const daysDiff = Math.max(
                        1,
                        Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)) - 14
                      );
                      return (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/cases/${s.id}`)}
                          className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate block">
                              {p?.name || 'Patient'}
                            </span>
                            <span className="text-[11px] text-slate-500">{p?.village}</span>
                          </div>
                          <OverdueBadge days={daysDiff} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {/* National Tobacco Quitline Banner */}
            <Card className="p-4 bg-gradient-to-r from-red-50 to-coral-50 dark:from-red-950/30 dark:to-coral-950/30 border-red-200 dark:border-red-900 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                    National Quitline (India)
                  </span>
                  <span className="text-base font-black text-red-900 dark:text-red-200">
                    1800-11-2356
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {lang === 'kn'
                  ? 'ಉಚಿತ ಆಪ್ತಸಮಾಲೋಚನೆ ಪಡೆಯಲು ಕರೆ ಮಾಡಿ.'
                  : 'Toll-free tobacco cessation support in Kannada & English.'}
              </p>
              <a
                href="tel:1800112356"
                className="btn-danger w-full py-2 text-xs font-bold text-center block"
              >
                Call Quitline (1800-11-2356)
              </a>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
