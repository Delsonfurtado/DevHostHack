import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Heart,
  Flame,
  IndianRupee,
  PhoneCall,
  Sparkles,
  TrendingDown,
  Award,
  CheckCircle2,
  Calendar,
  Save,
  Smile,
  Shield,
  Coffee,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { HabitEntry } from '../types/models';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HabitCoach() {
  const { t, lang } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [tobaccoUnits, setTobaccoUnits] = useState(0);
  const [arecaUnits, setArecaUnits] = useState(0);
  const [alcoholUnits, setAlcoholUnits] = useState(0);
  const [cravingLevel, setCravingLevel] = useState(3);
  const [note, setNote] = useState('');

  // Live Query of Habit Entries
  const entries = useLiveQuery(() => db.habitEntries.orderBy('date').toArray(), []) || [];

  // Streak & Money Saved Calculation
  const { streakDays, totalSavedRupees, riskReductionPct } = useMemo(() => {
    let streak = 0;
    const sorted = [...entries].reverse();

    for (const ent of sorted) {
      if (ent.tobaccoUnits === 0 && ent.arecaUnits === 0) {
        streak++;
      } else {
        break;
      }
    }

    // Money saved: Rs. 35 per tobacco pack / areca packet avoided
    const zeroDays = entries.filter((e) => e.tobaccoUnits === 0 && e.arecaUnits === 0).length;
    const totalSaved = zeroDays * 60; // Average daily savings in Karnataka

    // Risk reduction estimate (up to 50% after prolonged cessation)
    const riskRed = Math.min(50, Math.round(streak * 2.5));

    return { streakDays: streak, totalSavedRupees: totalSaved, riskReductionPct: riskRed };
  }, [entries]);

  // Motivational message
  const motivationMessage = useMemo(() => {
    const list = [
      lang === 'kn'
        ? 'ಪ್ರತಿ ಗಂಟೆ ತಂಬಾಕು ಇಲ್ಲದಿದ್ದರೆ, ನಿಮ್ಮ ಶ್ವಾಸಕೋಶ ಮತ್ತು ಬಾಯಿ ಹೊಸ ಜೀವ ಪಡೆಯುತ್ತದೆ.'
        : 'Every tobacco-free hour allows your oral mucosal cells to begin regenerating.',
      lang === 'kn'
        ? 'ಆಸೆ ಕೇವಲ ೩ ನಿಮಿಷಗಳ ಕಾಲ ಮಾತ್ರ ಇರುತ್ತದೆ. ಒಂದು ಲೋಟ ತಣ್ಣೀರು ಕುಡಿಯಿರಿ.'
        : 'Cravings peak for just 3 to 5 minutes. Take deep breaths and drink water.',
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಕುಟುಂಬವು ನಿಮ್ಮ ಈ ಆರೋಗ್ಯಕರ ಹೆಜ್ಜೆಯನ್ನು ನೋಡಿ ಹೆಮ್ಮೆಪಡುತ್ತದೆ.'
        : 'Your family and loved ones are cheering for your smoke-free journey.',
      lang === 'kn'
        ? 'ತಂಬಾಕು ತ್ಯಜಿಸಿದ ೨೪ ಗಂಟೆಗಳಲ್ಲಿ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ನಾಡಿಬಡಿತ ಸಹಜ ಸ್ಥಿತಿಗೆ ಮರಳುತ್ತದೆ.'
        : 'Within 24 hours of quitting, your blood pressure and pulse normalize.',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }, [lang]);

  // Save entry
  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entryId = 'habit_' + todayStr;
      const newEntry: HabitEntry = {
        id: entryId,
        date: todayStr,
        tobaccoUnits,
        arecaUnits,
        alcoholUnits,
        cravingLevel,
        note: note.trim() || undefined,
        createdAt: new Date(),
      };

      await db.habitEntries.put(newEntry);
      showToast(lang === 'kn' ? 'ಇಂದಿನ ವಿವರ ದಾಖಲಾಗಿದೆ!' : 'Daily habit log saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving habit entry', 'error');
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    return entries.slice(-14).map((e) => ({
      date: e.date.slice(5), // MM-DD
      tobacco: e.tobaccoUnits,
      areca: e.arecaUnits,
    }));
  }, [entries]);

  return (
    <Layout title={t('habitCoachTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Header & Motivational Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
              <Sparkles size={14} />
              {lang === 'kn' ? 'ದೈನಂದಿನ ಸ್ಫೂರ್ತಿ' : 'Daily Motivation'}
            </span>
            <ReadAloudBtn text={motivationMessage} className="text-teal-200" />
          </div>
          <p className="text-sm font-semibold leading-relaxed">{motivationMessage}</p>
        </div>

        {/* Streaks & Savings Metric Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center border-t-4 border-t-coral-500">
            <div className="flex items-center justify-center text-coral-500 mb-1">
              <Flame size={20} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {streakDays} {t('days')}
            </div>
            <div className="text-[10px] text-gray-400">{t('currentStreak')}</div>
          </Card>

          <Card className="p-3 text-center border-t-4 border-t-teal-500">
            <div className="flex items-center justify-center text-teal-600 mb-1">
              <IndianRupee size={20} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              ₹{totalSavedRupees}
            </div>
            <div className="text-[10px] text-gray-400">{t('moneySaved')}</div>
          </Card>

          <Card className="p-3 text-center border-t-4 border-t-green-500">
            <div className="flex items-center justify-center text-green-600 mb-1">
              <TrendingDown size={20} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              -{riskReductionPct}%
            </div>
            <div className="text-[10px] text-gray-400">
              {lang === 'kn' ? 'ಅಪಾಯ ಇಳಿಕೆ' : 'Risk Reduced'}
            </div>
          </Card>
        </div>

        {/* Today's Habit Log Form */}
        <form onSubmit={handleSaveHabit} className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Calendar size={14} />
              {t('todayHabits')} ({todayStr})
            </h3>

            {/* Tobacco Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t('tobacco')}</span>
                <span className="text-coral-600 font-bold">{tobaccoUnits} units</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={tobaccoUnits}
                onChange={(e) => setTobaccoUnits(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Areca Nut Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t('arecaNut')}</span>
                <span className="text-amber-600 font-bold">{arecaUnits} times</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={arecaUnits}
                onChange={(e) => setArecaUnits(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Alcohol Units */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t('alcoholUnits')}</span>
                <span className="text-purple-600 font-bold">{alcoholUnits} drinks</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={alcoholUnits}
                onChange={(e) => setAlcoholUnits(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            {/* Craving Level */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t('cravingLevel')}</span>
                <span className="text-teal-600 font-bold">{cravingLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={cravingLevel}
                onChange={(e) => setCravingLevel(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5">
              <Save size={14} />
              {t('save')} {lang === 'kn' ? 'ದಾಖಲಿಸಿ' : 'Today Log'}
            </button>
          </Card>
        </form>

        {/* 14-Day Habit Trend Chart */}
        {chartData.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {lang === 'kn' ? '೧೪ ದಿನಗಳ ತಂಬಾಕು ಇಳಿಕೆಯ ಚಾರ್ಟ್' : '14-Day Consumption Trend'}
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tobacco" stroke="#ff5a47" strokeWidth={2} name="Tobacco" />
                  <Line type="monotone" dataKey="areca" stroke="#f59e0b" strokeWidth={2} name="Areca" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Health Recovery Milestones */}
        <Card className="p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <Award size={15} />
            {lang === 'kn' ? 'ಆರೋಗ್ಯ ಚೇತರಿಕೆಯ ಮೈಲಿಗಲ್ಲುಗಳು' : 'Body Healing Timeline'}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-start gap-2">
              <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">24 Hours:</span> Carbon monoxide levels drop; taste and smell sharpen.
              </div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-start gap-2">
              <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">2 Weeks:</span> Oral circulation improves; mucosal burning diminishes.
              </div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-start gap-2">
              <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">1 Year:</span> Oral cancer and coronary heart disease risk drops by 50%.
              </div>
            </div>
          </div>
        </Card>

        {/* Tobacco Quit Helpline Card */}
        <Card className="p-4 bg-gradient-to-r from-red-50 to-coral-50 dark:from-red-950/30 dark:to-coral-950/30 border-red-200 dark:border-red-900 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
              <PhoneCall size={16} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-red-700 dark:text-red-400">
                {lang === 'kn' ? 'ರಾಷ್ಟ್ರೀಯ ಉಚಿತ ಸಹಾಯವಾಣಿ' : 'National Quitline Support'}
              </span>
              <div className="text-base font-extrabold text-red-900 dark:text-red-200">
                1800-11-2356
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-300">
            {lang === 'kn'
              ? 'ತಂಬಾಕು ಬಿಡಲು ಗೌಪ್ಯ, ತಜ್ಞ ಆಪ್ತಸಮಾಲೋಚನೆ ಪಡೆಯಲು ತಕ್ಷಣ ಉಚಿತವಾಗಿ ಕರೆ ಮಾಡಿ.'
              : 'Free, confidential support from government-trained cessation counselors in Kannada and English.'}
          </p>
          <a
            href="tel:1800112356"
            className="btn-danger w-full py-2 text-xs font-bold text-center block"
          >
            {lang === 'kn' ? 'ಈಗಲೇ ಕರೆ ಮಾಡಿ (ಉಚಿತ)' : 'Call Quitline Now (Toll Free)'}
          </a>
        </Card>
      </div>
    </Layout>
  );
}
