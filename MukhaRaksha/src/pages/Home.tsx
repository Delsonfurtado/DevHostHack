import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Camera,
  Baby,
  Heart,
  BarChart2,
  Tent,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Card, StatCard, SectionHeader, EmptyState } from '../components/ui';
import { db } from '../db/database';

/* ─────────────────────────── Helpers ──────────────────────────── */

function getTodayRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86_400_000; // + 24 h
  return { start, end };
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting.morning';
  if (hour < 17) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

function daysOverdue(dateMs: number): number {
  return Math.floor((Date.now() - dateMs) / 86_400_000);
}

/* ───────────────────────── Quick Action Cell ───────────────────── */

interface ActionItem {
  icon: React.ReactNode;
  labelKey: string;
  route: string;
  color: string;
  bg: string;
}

interface QuickActionCellProps {
  item: ActionItem;
  onPress: (route: string) => void;
}

const QuickActionCell: React.FC<QuickActionCellProps> = ({ item, onPress }) => {
  const { t } = useApp();
  return (
    <button
      onClick={() => onPress(item.route)}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 min-h-[90px] shadow-sm border border-gray-100 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${item.bg}`}
      aria-label={t(item.labelKey)}
    >
      <span className={`${item.color}`}>{item.icon}</span>
      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
        {t(item.labelKey)}
      </span>
    </button>
  );
};

/* ─────────────────────────── Main Component ────────────────────── */

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang, role, settings } = useApp();

  /* ── Live queries ── */

  const { start: todayStart, end: todayEnd } = useMemo(() => getTodayRange(), []);

  const todayScreenings = useLiveQuery(
    () =>
      db.screenings
        .where('createdAt')
        .between(todayStart, todayEnd)
        .toArray(),
    [todayStart, todayEnd]
  );

  const allScreenings = useLiveQuery(() => db.screenings.toArray(), []);

  const allPatients = useLiveQuery(() => db.patients?.toArray?.() ?? Promise.resolve([]), []);

  /* ── Derived counts ── */

  const overdueItems = useMemo(() => {
    if (!allScreenings) return [];
    const cutoff = Date.now();
    return allScreenings.filter((s: any) => {
      const followUp: number | undefined = s.followUpDate ?? s.referralDate;
      if (!followUp) return false;
      return followUp < cutoff && !s.appointmentKept;
    });
  }, [allScreenings]);

  const highRiskCases = useMemo(() => {
    if (!allScreenings) return [];
    return allScreenings.filter(
      (s: any) => s.riskLevel === 'high' || s.riskLevel === 'very_high'
    );
  }, [allScreenings]);

  const recentScreenings = useMemo(() => {
    if (!allScreenings) return [];
    return [...allScreenings]
      .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 3);
  }, [allScreenings]);

  const overdueTop3 = useMemo(() => overdueItems.slice(0, 3), [overdueItems]);

  /* ── Quick actions ── */

  const quickActions: ActionItem[] = [
    {
      icon: <ClipboardList size={26} />,
      labelKey: 'home.action.newScreening',
      route: '/screening/new',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      icon: <Camera size={26} />,
      labelKey: 'home.action.captureImage',
      route: '/capture',
      color: 'text-coral-500',
      bg: 'bg-orange-50',
    },
    {
      icon: <Baby size={26} />,
      labelKey: 'home.action.childCare',
      route: '/child-care',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: <Heart size={26} />,
      labelKey: 'home.action.selfExam',
      route: '/self-exam',
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      icon: <Users size={26} />,
      labelKey: 'home.action.habitCoach',
      route: '/habit-coach',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: <BarChart2 size={26} />,
      labelKey: 'home.action.dashboard',
      route: '/dashboard',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  /* ── Greeting ── */

  const greetingKey = getGreetingKey();
  const userName: string =
    (settings as any)?.workerName ?? (settings as any)?.userName ?? '';

  const isHealthWorker = role === 'health_worker';

  /* ── Render ── */

  return (
    <Layout>
      <div className="flex flex-col gap-5 px-4 pb-24 pt-4">

        {/* ── Greeting Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{t(greetingKey)}</p>
            <h1
              className={`text-2xl font-bold text-gray-800 mt-0.5 ${lang === 'kn' ? 'font-kannada' : ''}`}
            >
              {userName || t('home.greeting.defaultName')}
            </h1>
            {isHealthWorker && (
              <span className="inline-block mt-1 text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                {t('home.role.healthWorker')}
              </span>
            )}
          </div>

          {/* Camp Mode – health worker only */}
          {isHealthWorker && (
            <button
              onClick={() => navigate('/camp')}
              className="flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md active:scale-95 transition-transform min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label={t('home.campMode')}
            >
              <Tent size={16} />
              {t('home.campMode')}
            </button>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t('home.stat.todayScreenings')}
            value={todayScreenings?.length ?? 0}
            icon={<ClipboardList size={20} className="text-teal-600" />}
            color="teal"
          />
          <StatCard
            label={t('home.stat.overdueFollowUps')}
            value={overdueItems.length}
            icon={<AlertTriangle size={20} className="text-amber-500" />}
            color="amber"
            alert={overdueItems.length > 0}
          />
          <StatCard
            label={t('home.stat.highRisk')}
            value={highRiskCases.length}
            icon={<Heart size={20} className="text-red-500" />}
            color="red"
            alert={highRiskCases.length > 0}
          />
          <StatCard
            label={t('home.stat.totalPatients')}
            value={allPatients?.length ?? (allScreenings?.length ?? 0)}
            icon={<Users size={20} className="text-blue-600" />}
            color="blue"
          />
        </div>

        {/* ── Quick Actions ── */}
        <SectionHeader title={t('home.section.quickActions')} />
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <QuickActionCell
              key={action.route}
              item={action}
              onPress={(route) => navigate(route)}
            />
          ))}
        </div>

        {/* ── Overdue Follow-ups ── */}
        {isHealthWorker && (
          <>
            <SectionHeader
              title={t('home.section.overdueFollowUps')}
              action={
                overdueItems.length > 3
                  ? {
                      label: t('home.seeAll'),
                      onPress: () => navigate('/follow-ups'),
                    }
                  : undefined
              }
            />

            {overdueTop3.length === 0 ? (
              <EmptyState
                icon={<Calendar size={32} className="text-gray-300" />}
                message={t('home.noOverdue')}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {overdueTop3.map((item: any) => {
                  const overdueDays = daysOverdue(item.followUpDate ?? item.referralDate ?? 0);
                  return (
                    <Card key={item.id ?? item.patientId}>
                      <button
                        onClick={() =>
                          navigate(`/patient/${item.patientId ?? item.id}`)
                        }
                        className="w-full flex items-center gap-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        aria-label={`${item.patientName ?? t('home.unknownPatient')} – ${overdueDays} ${t('home.daysOverdue')}`}
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertTriangle size={18} className="text-amber-600" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.patientName ?? t('home.unknownPatient')}
                          </p>
                          <p className="text-xs text-amber-600 font-medium">
                            {overdueDays} {t('home.daysOverdue')}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Recent Screenings ── */}
        <SectionHeader
          title={t('home.section.recentScreenings')}
          action={
            (allScreenings?.length ?? 0) > 3
              ? { label: t('home.seeAll'), onPress: () => navigate('/screenings') }
              : undefined
          }
        />

        {recentScreenings.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={32} className="text-gray-300" />}
            message={t('home.noScreenings')}
            cta={{
              label: t('home.action.newScreening'),
              onPress: () => navigate('/screening/new'),
            }}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recentScreenings.map((s: any) => {
              const riskColor =
                s.riskLevel === 'high' || s.riskLevel === 'very_high'
                  ? 'text-red-600 bg-red-50'
                  : s.riskLevel === 'medium'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-green-700 bg-green-50';

              return (
                <Card key={s.id}>
                  <button
                    onClick={() =>
                      navigate(`/screening/${s.id}`)
                    }
                    className="w-full flex items-center gap-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    aria-label={`${s.patientName ?? t('home.unknownPatient')} – ${t(`risk.${s.riskLevel ?? 'unknown'}`)}`}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                      <ClipboardList size={18} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {s.patientName ?? t('home.unknownPatient')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString(
                              lang === 'kn' ? 'kn-IN' : 'en-IN',
                              { day: 'numeric', month: 'short' }
                            )
                          : '—'}
                      </p>
                    </div>
                    {s.riskLevel && (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${riskColor}`}
                      >
                        {t(`risk.${s.riskLevel}`)}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Disclaimer Banner ── */}
        <div className="mt-2 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            {t('disclaimer.short')}
          </p>
        </div>

      </div>
    </Layout>
  );
};

export default Home;
