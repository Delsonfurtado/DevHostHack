import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  List,
  Columns,
  BarChart3,
  Search,
  Filter,
  Download,
  Upload,
  Sparkles,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, RiskBadge, StageBadge, OverdueBadge, EmptyState, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import { samplePatients, sampleScreenings, sampleCaseEvents } from '../data/seedData';
import type { Screening, Patient, CaseStage, RiskLevel } from '../types/models';
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

export default function Cases() {
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'dashboard'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Live queries from Dexie
  const patients = useLiveQuery(() => db.patients.toArray(), []) || [];
  const screenings = useLiveQuery(() => db.screenings.toArray(), []) || [];

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  // Overdue check logic
  // Overdue if: referral_recommended/appointment_pending for > 14 days OR followUpDate passed
  const isScreeningOverdue = (s: Screening): { overdue: boolean; days: number } => {
    const now = Date.now();
    const createdTime = new Date(s.createdAt).getTime();
    const daysSince = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));

    if (
      (s.stage === 'referral_recommended' || s.stage === 'appointment_pending') &&
      daysSince > 14 &&
      !s.appointmentAttended
    ) {
      return { overdue: true, days: daysSince - 14 };
    }

    if (s.followUpDate) {
      const followUpTime = new Date(s.followUpDate).getTime();
      if (now > followUpTime && s.stage !== 'closed') {
        const diffDays = Math.floor((now - followUpTime) / (1000 * 60 * 60 * 24));
        return { overdue: true, days: Math.max(1, diffDays) };
      }
    }

    return { overdue: false, days: 0 };
  };

  // Filtered screenings
  const filteredCases = useMemo(() => {
    return screenings.filter((s) => {
      const p = patientMap.get(s.patientId);
      const nameMatch = !searchQuery || (p?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const villageMatch = !searchQuery || (p?.village.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesSearch = nameMatch || villageMatch;

      const matchesRisk = selectedRisk === 'ALL' || s.riskLevel === selectedRisk;
      const matchesStage = selectedStage === 'ALL' || s.stage === selectedStage;

      const overdueInfo = isScreeningOverdue(s);
      const matchesOverdue = !showOverdueOnly || overdueInfo.overdue;

      return matchesSearch && matchesRisk && matchesStage && matchesOverdue;
    });
  }, [screenings, patientMap, searchQuery, selectedRisk, selectedStage, showOverdueOnly]);

  // Seed sample data (25 patients across all stages)
  const handleSeedData = async () => {
    try {
      await db.patients.bulkPut(samplePatients);
      await db.screenings.bulkPut(sampleScreenings);
      await db.caseEvents.bulkPut(sampleCaseEvents);
      showToast(
        lang === 'kn' ? '೨೫ ರೋಗಿಗಳ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ!' : '25 realistic patient cases loaded into IndexedDB!',
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Error seeding sample data', 'error');
    }
  };

  // Clear data
  const handleClearData = async () => {
    if (window.confirm(lang === 'kn' ? 'ಎಲ್ಲಾ ಮಾದರಿ ಡೇಟಾ ತೆಗೆಯಬೇಕೆ?' : 'Clear all sample data?')) {
      await db.patients.clear();
      await db.screenings.clear();
      await db.caseEvents.clear();
      showToast(lang === 'kn' ? 'ಡೇಟಾ ತೆಗೆಯಲಾಗಿದೆ' : 'Data cleared', 'info');
    }
  };

  // Interactive Demo Walkthrough
  const handleDemoWalkthrough = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    showToast(
      lang === 'kn' ? 'ಡೆಮೋ ವಾಕ್‌ಥ್ರೂ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...' : 'Starting step-by-step Demo Walkthrough for sample case...',
      'info'
    );

    try {
      // Ensure s2 exists
      let target = await db.screenings.get('s2');
      if (!target) {
        await handleSeedData();
        target = await db.screenings.get('s2');
      }

      if (!target) {
        setIsDemoRunning(false);
        return;
      }

      const stagesInOrder: CaseStage[] = [
        'screening_completed',
        'referral_recommended',
        'appointment_pending',
        'appointment_attended',
        'follow_up_recorded',
        'closed',
      ];

      for (let i = 0; i < stagesInOrder.length; i++) {
        const nextStage = stagesInOrder[i];
        await new Promise((res) => setTimeout(res, 1400));

        await db.screenings.update('s2', {
          stage: nextStage,
          updatedAt: new Date(),
          appointmentAttended: i >= 3,
        });

        await db.caseEvents.add({
          id: 'demo_ev_' + Date.now() + '_' + i,
          screeningId: 's2',
          stage: nextStage,
          note: `Demo progression: Advanced to ${nextStage}`,
          timestamp: new Date(),
          author: 'Demo Bot',
        });

        showToast(
          lang === 'kn'
            ? `ರೋಗಿ ಲಕ್ಷ್ಮಿ ದೇವಿ: ಹಂತ ನವೀಕರಿಸಲಾಗಿದೆ -> ${t(`stages.${nextStage}`)}`
            : `Lakshmi Devi progressed to: ${t(`stages.${nextStage}`)}`,
          'success'
        );
      }

      showToast(
        lang === 'kn' ? 'ಡೆಮೋ ಯಶಸ್ವಿಯಾಗಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ!' : 'Demo walkthrough completed! Check live dashboard update.',
        'success'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsDemoRunning(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (screenings.length === 0) {
      showToast('No cases to export', 'info');
      return;
    }
    const headers = ['ScreeningID', 'PatientName', 'Age', 'Sex', 'Village', 'Phone', 'RiskLevel', 'Stage', 'Date'];
    const rows = screenings.map((s) => {
      const p = patientMap.get(s.patientId);
      return [
        s.id,
        `"${p?.name || 'Unknown'}"`,
        p?.age || '',
        p?.sex || '',
        `"${p?.village || ''}"`,
        p?.phone || '',
        s.riskLevel,
        s.stage,
        new Date(s.createdAt).toISOString().split('T')[0],
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MukhaRaksha_Cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'kn' ? 'CSV ರಫ್ತು ಮಾಡಲಾಗಿದೆ' : 'Cases exported to CSV', 'success');
  };

  // Backup JSON
  const handleBackupJSON = async () => {
    const data = {
      patients: await db.patients.toArray(),
      screenings: await db.screenings.toArray(),
      caseEvents: await db.caseEvents.toArray(),
      backupDate: new Date().toISOString(),
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `MukhaRaksha_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup JSON downloaded', 'success');
  };

  // Restore JSON
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.patients) await db.patients.bulkPut(json.patients);
        if (json.screenings) await db.screenings.bulkPut(json.screenings);
        if (json.caseEvents) await db.caseEvents.bulkPut(json.caseEvents);
        showToast(lang === 'kn' ? 'ಡೇಟಾ ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ!' : 'Data restored successfully!', 'success');
      } catch (err) {
        showToast('Invalid JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Metrics for Dashboard
  const metrics = useMemo(() => {
    const total = screenings.length;
    const high = screenings.filter((s) => s.riskLevel === 'HIGH').length;
    const pctHigh = total > 0 ? Math.round((high / total) * 100) : 0;
    const closed = screenings.filter((s) => s.stage === 'closed' || s.stage === 'follow_up_recorded').length;
    const compRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    let overdueCount = 0;
    screenings.forEach((s) => {
      if (isScreeningOverdue(s).overdue) overdueCount++;
    });

    // Stage Distribution
    const stageCounts: Record<string, number> = {};
    STAGES.forEach((st) => (stageCounts[st] = 0));
    screenings.forEach((s) => {
      stageCounts[s.stage] = (stageCounts[s.stage] || 0) + 1;
    });

    const funnelData = STAGES.map((st) => ({
      name: t(`stages.${st}`),
      count: stageCounts[st] || 0,
    }));

    // Risk Pie
    const riskData = [
      { name: 'LOW', value: screenings.filter((s) => s.riskLevel === 'LOW').length, color: '#16a34a' },
      { name: 'MODERATE', value: screenings.filter((s) => s.riskLevel === 'MODERATE').length, color: '#f59e0b' },
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

    const habitData = [
      { name: 'Smoking', count: smoking },
      { name: 'Chewing', count: chewing },
      { name: 'Gutka', count: gutka },
      { name: 'Areca Nut', count: areca },
      { name: 'Alcohol', count: alcohol },
    ];

    return { total, pctHigh, compRate, overdueCount, funnelData, riskData, habitData };
  }, [screenings, t]);

  return (
    <Layout title={t('caseManagement')} showDisclaimer>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Top Control Bar: Seed / Demo & Backup */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSeedData}
              className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Database size={14} />
              {t('loadSampleData')} (25)
            </button>
            <button
              onClick={handleDemoWalkthrough}
              disabled={isDemoRunning}
              className="py-1.5 px-3 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
            >
              <Sparkles size={14} />
              {isDemoRunning ? 'Running Demo...' : t('demoWalkthrough')}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1"
              title="Export CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleBackupJSON}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-xs font-medium"
              title="Backup JSON"
            >
              JSON
            </button>
            <label className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-xs font-medium cursor-pointer">
              <Upload size={14} />
              <input type="file" accept=".json" onChange={handleRestoreJSON} className="hidden" />
            </label>
            {screenings.length > 0 && (
              <button
                onClick={handleClearData}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium"
                title="Clear Data"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* View Switcher: List | Kanban | Dashboard */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            <List size={16} />
            {lang === 'kn' ? 'ಪಟ್ಟಿ ನೋಟ' : 'List View'} ({filteredCases.length})
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'kanban'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            <Columns size={16} />
            {lang === 'kn' ? 'ಕಾನ್‌ಬಾನ್ ಬೋರ್ಡ್' : 'Kanban Board'}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-gray-500'
            }`}
          >
            <BarChart3 size={16} />
            {t('dashboardTitle')}
          </button>
        </div>

        {/* Search & Filter Bar (for List and Kanban) */}
        {activeTab !== 'dashboard' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'kn' ? 'ಹೆಸರು ಅಥವಾ ಹಳ್ಳಿಯ ಮೂಲಕ ಹುಡುಕಿ...' : 'Search patient name or village...'}
                className="input-field pl-10 text-sm py-2.5"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Risk Filter */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
              >
                <option value="ALL">{t('all')} Risk</option>
                <option value="HIGH">🔴 {t('high')}</option>
                <option value="MODERATE">🟡 {t('moderate')}</option>
                <option value="LOW">🟢 {t('low')}</option>
              </select>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium max-w-[160px]"
              >
                <option value="ALL">{t('all')} Stages</option>
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {t(`stages.${st}`)}
                  </option>
                ))}
              </select>

              {/* Overdue Only Toggle */}
              <button
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showOverdueOnly
                    ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:border-red-800'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                <AlertTriangle size={13} className={showOverdueOnly ? 'text-red-500' : 'text-gray-400'} />
                {t('overdue')} Only
              </button>
            </div>
          </div>
        )}

        {/* 1. LIST VIEW */}
        {activeTab === 'list' && (
          <div className="space-y-2.5">
            {filteredCases.length === 0 ? (
              <EmptyState
                icon={<Filter size={40} />}
                title={t('noData')}
                subtitle={lang === 'kn' ? 'ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಪ್ರಕರಣಗಳು ಸಿಗಲಿಲ್ಲ.' : 'No cases match your filters. Try loading sample data.'}
                action={handleSeedData}
                actionLabel={t('loadSampleData')}
              />
            ) : (
              filteredCases.map((s) => {
                const p = patientMap.get(s.patientId);
                const overdueInfo = isScreeningOverdue(s);
                return (
                  <Card
                    key={s.id}
                    onClick={() => navigate(`/cases/${s.id}`)}
                    className="p-3.5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          {p?.name || 'Patient'}
                        </span>
                        <RiskBadge level={s.riskLevel} />
                        {overdueInfo.overdue && <OverdueBadge days={overdueInfo.days} />}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {p?.village || 'Village'} ({p?.age}y / {p?.sex})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                      <StageBadge stage={s.stage} />
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* 2. KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {STAGES.map((stage) => {
              const stageCases = filteredCases.filter((s) => s.stage === stage);
              return (
                <div
                  key={stage}
                  className="w-72 shrink-0 bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-3 space-y-2 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[70vh]"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {t(`stages.${stage}`)}
                    </span>
                    <span className="text-xs font-bold bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full shadow-xs">
                      {stageCases.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    {stageCases.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 italic">No cases in this stage</div>
                    ) : (
                      stageCases.map((s) => {
                        const p = patientMap.get(s.patientId);
                        const overdueInfo = isScreeningOverdue(s);
                        return (
                          <div
                            key={s.id}
                            onClick={() => navigate(`/cases/${s.id}`)}
                            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 cursor-pointer active:scale-98 transition-transform space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">
                                {p?.name || 'Patient'}
                              </span>
                              <RiskBadge level={s.riskLevel} />
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {p?.village} • {p?.age} yrs
                            </div>
                            {overdueInfo.overdue && (
                              <div className="pt-1">
                                <OverdueBadge days={overdueInfo.days} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. LIVE DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{metrics.total}</div>
                <div className="text-xs text-gray-500">{t('totalScreened')}</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.pctHigh}%</div>
                <div className="text-xs text-gray-500">{t('percentHighRisk')}</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.compRate}%</div>
                <div className="text-xs text-gray-500">{t('referralCompletionRate')}</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{metrics.overdueCount}</div>
                <div className="text-xs text-gray-500">{t('overdueCount')}</div>
              </Card>
            </div>

            {/* Referral Funnel Chart */}
            <Card className="p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('casesByStage')} ({lang === 'kn' ? 'ಹಂತವಾರು ಪ್ರಕರಣಗಳು' : 'Care Continuum Funnel'})
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Risk Distribution & Habits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {lang === 'kn' ? 'ಅಪಾಯದ ಹಂಚಿಕೆ' : 'Risk Distribution'}
                </h3>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.riskData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {metrics.riskData.map((entry, index) => (
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
                    <BarChart data={metrics.habitData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff5a47" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
