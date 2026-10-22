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

  // Recent 3 screenings
  const recent3 = useMemo(() => {
    return [...allScreenings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
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
      iconColor: 'text-white',
      accent: 'bg-teal-600',
    },
    {
      title: t('captureImage'),
      desc: lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಮರಾ' : 'Quality Guard AI',
      route: '/capture',
      icon: Camera,
      gradient: 'from-rose-500 to-coral-500',
      iconColor: 'text-white',
      accent: 'bg-rose-500',
    },
    {
      title: t('childCare'),
      desc: 'ಪುಟ್ಟ ನಗು (0–12y)',
      route: '/child-care',
      icon: Baby,
      gradient: 'from-pink-500 to-rose-600',
      iconColor: 'text-white',
      accent: 'bg-pink-500',
    },
    {
      title: t('selfExam'),
      desc: lang === 'kn' ? 'ಮಾಸಿಕ ೨-ನಿಮಿಷ' : 'Monthly Mirror Check',
      route: '/self-exam',
      icon: Eye,
      gradient: 'from-indigo-600 to-indigo-700',
      iconColor: 'text-white',
      accent: 'bg-indigo-600',
    },
    {
      title: t('habitCoach'),
      desc: lang === 'kn' ? 'ತಂಬಾಕು ತ್ಯಜಿಸಿ' : 'Quit Tobacco Support',
      route: '/habit-coach',
      icon: Flame,
      gradient: 'from-amber-500 to-orange-600',
      iconColor: 'text-white',
      accent: 'bg-amber-500',
    },
    {
      title: t('dashboard'),
      desc: lang === 'kn' ? 'ಪ್ರಗತಿ ವಿಶ್ಲೇಷಣೆ' : 'Live Continuum Analytics',
      route: '/dashboard',
      icon: BarChart3,
      gradient: 'from-emerald-600 to-teal-700',
      iconColor: 'text-white',
      accent: 'bg-emerald-600',
    },
  ];

  return (
    <Layout showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Hero Welcome Card with Karnataka Healthcare Accent */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 shadow-md">
          {/* Subtle Background Glow Circles */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-coral-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-teal-100 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isHealthWorker
                  ? lang === 'kn'
                    ? 'ಆಶಾ / ಎಎನ್ಎಂ ಕಾರ್ಯಕರ್ತ ಮೋಡ್'
                    : 'ASHA / ANM Worker Mode'
                  : lang === 'kn'
                  ? 'ಸಾರ್ವಜನಿಕ / ರೋಗಿ ಮೋಡ್'
                  : 'Individual Health Mode'}
              </span>

              {isHealthWorker && (
                <button
                  onClick={() => navigate('/camp')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500 hover:bg-coral-600 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                >
                  <Tent size={13} />
                  {t('campMode')}
                </button>
              )}
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight text-white">
                {greeting}, {isHealthWorker ? 'ASHA Worker' : 'Welcome'}!
              </h2>
              <p className="text-xs text-teal-100/90 font-medium leading-relaxed mt-0.5">
                {lang === 'kn'
                  ? 'ಕರ್ನಾಟಕದ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಮುಂಚಿತ ಪತ್ತೆ ಮತ್ತು ರೆಫರಲ್ ಟ್ರ್ಯಾಕಿಂಗ್ ವ್ಯವಸ್ಥೆ.'
                  : 'Empowering early oral cancer screening, clinical capture guard, and referral tracking.'}
              </p>
            </div>

            {/* Quick Action Banner inside Hero */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-[11px] text-teal-200">
                {allScreenings.length} {lang === 'kn' ? 'ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ' : 'cases on device'}
              </span>
              <button
                onClick={() => navigate('/screen')}
                className="bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                + {t('newScreening')}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            label={t('todayScreenings')}
            value={todayCount}
            icon={<ClipboardList size={20} />}
            color="teal"
            onClick={() => navigate('/cases')}
          />
          <StatCard
            label={t('overdueFollowUps')}
            value={overdueScreenings.length}
            icon={<AlertTriangle size={20} />}
            color="amber"
            alert={overdueScreenings.length > 0}
            onClick={() => navigate('/cases')}
          />
          <StatCard
            label={t('highRiskCases')}
            value={highRiskCount}
            icon={<Heart size={20} />}
            color="red"
            alert={highRiskCount > 0}
            onClick={() => navigate('/cases')}
          />
          <StatCard
            label={lang === 'kn' ? 'ಒಟ್ಟು ರೋಗಿಗಳು' : 'Total Patients'}
            value={allPatients.length}
            icon={<Users size={20} />}
            color="blue"
            onClick={() => navigate('/cases')}
          />
        </div>

        {/* 6 Quick Action Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('quickActions')}
            </h3>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
              {lang === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಸಿದ್ಧ' : 'Offline Ready'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const IconComp = action.icon;
              return (
                <div
                  key={action.route}
                  onClick={() => navigate(action.route)}
                  className="card-interactive p-3.5 flex items-center gap-3 group"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${action.gradient} flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <IconComp size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {action.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {action.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Follow-ups Section */}
        {isHealthWorker && overdueScreenings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-rose-500 animate-pulse" />
                {t('overdueFollowUps')} ({overdueScreenings.length})
              </h3>
              <button
                onClick={() => navigate('/cases')}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5"
              >
                {t('viewAll')} <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-2">
              {overdueScreenings.slice(0, 3).map((s) => {
                const p = patientMap.get(s.patientId);
                const daysDiff = Math.max(
                  1,
                  Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)) - 14
                );
                return (
                  <Card
                    key={s.id}
                    onClick={() => navigate(`/cases/${s.id}`)}
                    className="p-3 border-l-4 border-l-rose-500 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {p?.name || 'Patient'}
                        </span>
                        <RiskBadge level={s.riskLevel} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {p?.village || 'Village'} • {s.referralFacility || 'District Hospital'}
                      </p>
                    </div>

                    <div className="shrink-0 pl-2">
                      <OverdueBadge days={daysDiff} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Cases Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('recentCases')}
            </h3>
            <button
              onClick={() => navigate('/cases')}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5"
            >
              {t('viewAll')} <ChevronRight size={13} />
            </button>
          </div>

          {recent3.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={36} className="text-slate-300" />}
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
            <div className="space-y-2">
              {recent3.map((s) => {
                const p = patientMap.get(s.patientId);
                return (
                  <Card
                    key={s.id}
                    onClick={() => navigate(`/cases/${s.id}`)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {p?.name || 'Patient'}
                        </span>
                        <RiskBadge level={s.riskLevel} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{p?.village || 'Village'}</span>
                        <span>•</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {t(`stages.${s.stage}`)}
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Ask MukhaRaksha AI Floating Banner */}
        <div
          onClick={() => navigate('/chat')}
          className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/15 border border-teal-500/30 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('chatTitle')}
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-teal-600 text-white">
                  AI / FAQ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'kn'
                  ? 'ಬಾಯಿ ಆರೋಗ್ಯ, ಅಡಿಕೆ ಮತ್ತು ಕ್ಯಾನ್ಸರ್ ಪ್ರಶ್ನೆಗಳಿಗೆ ತಕ್ಷಣದ ಉತ್ತರ'
                  : 'Ask clinical guidance, areca risks, and tobacco cessation'}
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
        </div>
      </div>
    </Layout>
  );
}
