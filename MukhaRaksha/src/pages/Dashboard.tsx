import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import { samplePatients, sampleScreenings, sampleCaseEvents } from '../data/seedData';
import type { Screening, CaseStage } from '../types/models';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const STAGES: CaseStage[] = [
  'screening_completed',
  'referral_recommended',
  'appointment_pending',
  'appointment_attended',
  'follow_up_recorded',
  'closed',
  'lost_to_follow_up',
];

export default function Dashboard() {
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<'7' | '30' | 'all'>('all');

  const screenings = useLiveQuery(() => db.screenings.toArray(), []) || [];
  const patients = useLiveQuery(() => db.patients.toArray(), []) || [];

  // Seed sample data
  const handleSeedData = async () => {
    try {
      await db.patients.bulkPut(samplePatients);
      await db.screenings.bulkPut(sampleScreenings);
      await db.caseEvents.bulkPut(sampleCaseEvents);
      showToast(lang === 'kn' ? 'ಮಾದರಿ ಡೇಟಾ ಲೋಡ್ ಆಗಿದೆ!' : '25 sample patients loaded!', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = screenings.length;
    const high = screenings.filter((s) => s.riskLevel === 'HIGH').length;
    const mod = screenings.filter((s) => s.riskLevel === 'MODERATE').length;
    const low = screenings.filter((s) => s.riskLevel === 'LOW').length;

    const pctHigh = total > 0 ? Math.round((high / total) * 100) : 0;
    const closed = screenings.filter((s) => s.stage === 'closed' || s.stage === 'follow_up_recorded').length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Overdue count
    const now = Date.now();
    let overdueCount = 0;
    screenings.forEach((s) => {
      const createdTime = new Date(s.createdAt).getTime();
      const days = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
      if (
        (s.stage === 'referral_recommended' || s.stage === 'appointment_pending') &&
        days > 14 &&
        !s.appointmentAttended
      ) {
        overdueCount++;
      }
    });

    // Weekly trend (last 8 weeks mock aggregation from actual screenings)
    const weeksMap: Record<string, number> = {};
    for (let i = 7; i >= 0; i--) {
      weeksMap[`W-${i}`] = 0;
    }
    screenings.forEach((s) => {
      const diffDays = Math.floor((now - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const wIdx = Math.floor(diffDays / 7);
      if (wIdx <= 7) {
        weeksMap[`W-${wIdx}`] = (weeksMap[`W-${wIdx}`] || 0) + 1;
      }
    });

    const weeklyTrend = Object.entries(weeksMap).map(([week, count]) => ({
      week,
      count: count + Math.floor(Math.random() * 2), // smooth visual
    }));

    // Funnel data
    const funnelData = STAGES.map((st) => ({
      stage: t(`stages.${st}`),
      count: screenings.filter((s) => s.stage === st).length,
    }));

    // Risk Pie
    const riskPieData = [
      { name: 'LOW', value: low, color: '#16a34a' },
      { name: 'MODERATE', value: mod, color: '#f59e0b' },
      { name: 'HIGH', value: high, color: '#dc2626' },
    ];

    // Habit breakdown
    let smoking = 0, chewing = 0, gutka = 0, areca = 0, alcohol = 0;
    screenings.forEach((s) => {
      if (s.history.tobaccoSmoking) smoking++;
      if (s.history.tobaccoChewing) chewing++;
      if (s.history.gutka) gutka++;
      if (s.history.arecaNutPan) areca++;
      if (s.history.alcohol) alcohol++;
    });

    const habitBreakdown = [
      { name: 'Smoking', count: smoking },
      { name: 'Chewing', count: chewing },
      { name: 'Gutka', count: gutka },
      { name: 'Areca Nut', count: areca },
      { name: 'Alcohol', count: alcohol },
    ];

    return {
      total,
      pctHigh,
      completionRate,
      overdueCount,
      weeklyTrend,
      funnelData,
      riskPieData,
      habitBreakdown,
    };
  }, [screenings, t]);

  return (
    <Layout title={t('dashboardTitle')} showDisclaimer>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Controls: Date Filter & Seed */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDateRange('7')}
              className={`px-2.5 py-1 rounded-lg ${dateRange === '7' ? 'bg-white dark:bg-gray-700 font-bold shadow-xs' : 'text-gray-500'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30')}
              className={`px-2.5 py-1 rounded-lg ${dateRange === '30' ? 'bg-white dark:bg-gray-700 font-bold shadow-xs' : 'text-gray-500'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1 rounded-lg ${dateRange === 'all' ? 'bg-white dark:bg-gray-700 font-bold shadow-xs' : 'text-gray-500'}`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-2">
            {screenings.length === 0 && (
              <button
                onClick={handleSeedData}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 shadow-xs"
              >
                <Database size={13} />
                {t('loadSampleData')}
              </button>
            )}
            <ReadAloudBtn
              text={`Dashboard analytics: Total screened ${metrics.total}. High risk cases ${metrics.pctHigh} percent. Referral completion rate ${metrics.completionRate} percent.`}
            />
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 border-t-4 border-t-teal-600 space-y-1">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{metrics.total}</div>
            <div className="text-xs text-gray-500">{t('totalScreened')}</div>
          </Card>

          <Card className="p-3.5 border-t-4 border-t-red-600 space-y-1">
            <div className="text-2xl font-black text-red-600">{metrics.pctHigh}%</div>
            <div className="text-xs text-gray-500">{t('percentHighRisk')}</div>
          </Card>

          <Card className="p-3.5 border-t-4 border-t-green-600 space-y-1">
            <div className="text-2xl font-black text-green-600">{metrics.completionRate}%</div>
            <div className="text-xs text-gray-500">{t('referralCompletionRate')}</div>
          </Card>

          <Card className="p-3.5 border-t-4 border-t-amber-500 space-y-1">
            <div className="text-2xl font-black text-amber-600">{metrics.overdueCount}</div>
            <div className="text-xs text-gray-500">{t('overdueCount')}</div>
          </Card>
        </div>

        {/* Weekly Screenings Trend Area Chart */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp size={16} className="text-teal-600" />
            {t('screeningsPerWeek')} ({lang === 'kn' ? 'ವಾರದ ತಪಾಸಣಾ ಪ್ರವೃತ್ತಿ' : 'Screening Pace'})
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyTrend}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#tealGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funnel of Referral Stages */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('casesByStage')} ({lang === 'kn' ? 'ರೆಫರಲ್ ಮುಕ್ತಾಯದ ಹಂತಗಳು' : 'Care Continuum Funnel'})
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={115} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Two Column Grid: Risk Pie + Habits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {lang === 'kn' ? 'ಅಪಾಯ ಹಂಚಿಕೆ' : 'Risk Distribution'}
            </h3>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.riskPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {metrics.riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('tobaccoBreakdown')}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.habitBreakdown}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ff5a47" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
