import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tent,
  Users,
  Plus,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, RiskBadge, Modal, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { RiskLevel, Sex } from '../types/models';

interface CampPatient {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  risk: RiskLevel;
  notes?: string;
  time: string;
}

export default function CampMode() {
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [campActive, setCampActive] = useState(() => {
    return localStorage.getItem('mukharaksha_camp_active') === 'true';
  });

  const [campName, setCampName] = useState(() => {
    return localStorage.getItem('mukharaksha_camp_name') || 'Taluk Health Camp';
  });
  const [campLocation, setCampLocation] = useState(() => {
    return localStorage.getItem('mukharaksha_camp_loc') || 'Devanahalli PHC';
  });

  const [campPatients, setCampPatients] = useState<CampPatient[]>(() => {
    try {
      const saved = localStorage.getItem('mukharaksha_camp_patients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Quick form state
  const [qName, setQName] = useState('');
  const [qAge, setQAge] = useState('');
  const [qSex, setQSex] = useState<Sex>('male');
  const [qRisk, setQRisk] = useState<RiskLevel>('LOW');
  const [qNotes, setQNotes] = useState('');

  // Save camp state
  useEffect(() => {
    localStorage.setItem('mukharaksha_camp_active', String(campActive));
    localStorage.setItem('mukharaksha_camp_name', campName);
    localStorage.setItem('mukharaksha_camp_loc', campLocation);
    localStorage.setItem('mukharaksha_camp_patients', JSON.stringify(campPatients));
  }, [campActive, campName, campLocation, campPatients]);

  const handleStartCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim() || !campLocation.trim()) {
      showToast('Please enter camp name and location', 'error');
      return;
    }
    setCampActive(true);
    showToast(lang === 'kn' ? 'ಆರೋಗ್ಯ ಶಿಬಿರ ಪ್ರಾರಂಭವಾಯಿತು!' : 'Health camp session started!', 'success');
  };

  const handleEndCamp = () => {
    if (window.confirm(lang === 'kn' ? 'ಶಿಬಿರವನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಬೇಕೆ?' : 'Close this health camp session?')) {
      setShowSummaryModal(true);
      setCampActive(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName.trim() || !qAge) return;

    const newP: CampPatient = {
      id: 'cp_' + Date.now(),
      name: qName.trim(),
      age: parseInt(qAge, 10),
      sex: qSex,
      risk: qRisk,
      notes: qNotes.trim() || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCampPatients((prev) => [newP, ...prev]);

    // Also persist to Dexie Patient & Screening
    try {
      const pid = 'p_' + newP.id;
      const sid = 's_' + newP.id;
      const now = new Date();
      await db.patients.add({
        id: pid,
        name: newP.name,
        age: newP.age,
        sex: newP.sex,
        village: campLocation,
        phone: 'Camp',
        consentGiven: true,
        createdAt: now,
        updatedAt: now,
      });

      await db.screenings.add({
        id: sid,
        patientId: pid,
        history: {
          tobaccoSmoking: false,
          tobaccoChewing: newP.risk !== 'LOW',
          gutka: false,
          arecaNutPan: false,
          alcohol: false,
          familyHistory: false,
          hpvOrImmuneIssues: false,
          poorDiet: false,
          previousOralLesions: false,
        },
        symptoms: {
          nonHealingUlcer: newP.risk === 'HIGH',
          whitePatches: newP.risk === 'MODERATE',
          redPatches: false,
          lumpOrThickening: false,
          painOrBurning: false,
          difficultyOpeningMouth: false,
          difficultySwallowing: false,
          loosTeeth: false,
          unexplainedBleeding: false,
          numbness: false,
          neckSwelling: false,
        },
        oralFindings: [],
        imageIds: [],
        riskLevel: newP.risk,
        riskFactors: [newP.notes || 'Camp screening finding'],
        stage: newP.risk === 'HIGH' ? 'referral_recommended' : 'screening_completed',
        referralFacility: newP.risk === 'HIGH' ? 'District Hospital' : undefined,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.error(err);
    }

    setQName('');
    setQAge('');
    setQNotes('');
    setShowAddModal(false);
    showToast(lang === 'kn' ? 'ರೋಗಿ ದಾಖಲಿಸಲಾಗಿದೆ' : 'Patient recorded', 'success');
  };

  // Export Camp CSV
  const handleExportCampCSV = () => {
    const headers = ['Name', 'Age', 'Sex', 'Risk', 'Notes', 'Time'];
    const rows = campPatients.map((p) => [
      `"${p.name}"`,
      p.age,
      p.sex,
      p.risk,
      `"${p.notes || ''}"`,
      p.time,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${campName.replace(/\s+/g, '_')}_Summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highRiskCount = campPatients.filter((p) => p.risk === 'HIGH').length;
  const modRiskCount = campPatients.filter((p) => p.risk === 'MODERATE').length;
  const lowRiskCount = campPatients.filter((p) => p.risk === 'LOW').length;

  return (
    <Layout title={t('campModeTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Camp Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Tent size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('campModeTitle')}
              </h2>
              <p className="text-xs text-gray-500">{t('campModeSubtitle')}</p>
            </div>
          </div>
          <ReadAloudBtn
            text={
              lang === 'kn'
                ? 'ಕ್ಯಾಂಪ್ ಮೋಡ್ - ಹಳ್ಳಿ ಆರೋಗ್ಯ ಶಿಬಿರದಲ್ಲಿ ಸಾಮೂಹಿಕ ಮತ್ತು ತ್ವರಿತ ತಪಾಸಣೆ.'
                : 'Camp Mode bulk village screening interface for fast registration.'
            }
          />
        </div>

        {!campActive ? (
          /* Start Camp Setup Form */
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              {lang === 'kn' ? 'ಹೊಸ ಶಿಬಿರ ಪ್ರಾರಂಭಿಸಿ' : 'Setup Today\'s Health Camp'}
            </h3>

            <form onSubmit={handleStartCamp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('campName')} *
                </label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Gram Panchayat Oral Health Camp"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('campLocation')} *
                </label>
                <input
                  type="text"
                  value={campLocation}
                  onChange={(e) => setCampLocation(e.target.value)}
                  placeholder="e.g. Nelamangala Community Hall"
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-sm font-bold shadow-md">
                {lang === 'kn' ? 'ಶಿಬಿರ ಪ್ರಾರಂಭಿಸಿ' : 'Start Camp Session'}
              </button>
            </form>
          </Card>
        ) : (
          /* Active Camp Running Dashboard */
          <div className="space-y-4">
            {/* Active Session Status Card */}
            <div className="p-4 rounded-2xl bg-teal-600 text-white shadow-md space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                    🟢 Active Screening Camp
                  </span>
                  <h3 className="text-base font-bold">{campName}</h3>
                  <span className="text-xs text-teal-100 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {campLocation}
                  </span>
                </div>
                <button
                  onClick={handleEndCamp}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1.5 px-3 rounded-xl backdrop-blur-sm"
                >
                  End Camp
                </button>
              </div>

              {/* Tally Metrics */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-teal-500/40 text-center">
                <div>
                  <div className="text-xl font-bold">{campPatients.length}</div>
                  <div className="text-[10px] text-teal-200">Screened</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-300">{highRiskCount}</div>
                  <div className="text-[10px] text-teal-200">High Risk</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-200">{modRiskCount}</div>
                  <div className="text-[10px] text-teal-200">Moderate</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-200">{lowRiskCount}</div>
                  <div className="text-[10px] text-teal-200">Normal</div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary py-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                {t('addPatient')} (Fast)
              </button>
              <button
                onClick={() => navigate('/screen?campMode=true')}
                className="btn-secondary py-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ArrowRight size={16} />
                Full Screening Wizard
              </button>
            </div>

            {/* Screened Patients List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>{lang === 'kn' ? 'ಇಂದಿನ ರೋಗಿಗಳು' : 'Today\'s Roster'} ({campPatients.length})</span>
                {campPatients.length > 0 && (
                  <button onClick={handleExportCampCSV} className="text-teal-600 flex items-center gap-1 lowercase">
                    <Download size={13} /> csv
                  </button>
                )}
              </div>

              {campPatients.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  {lang === 'kn' ? 'ಇನ್ನೂ ರೋಗಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.' : 'No patients screened in this session yet.'}
                </p>
              ) : (
                campPatients.map((p) => (
                  <Card key={p.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                        <RiskBadge level={p.risk} />
                      </div>
                      <span className="text-gray-400">
                        {p.age} yrs • {p.sex} • {p.time}
                      </span>
                      {p.notes && <p className="text-gray-500 italic mt-0.5">{p.notes}</p>}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Quick Add Patient Modal */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={t('addPatient')}
        >
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {t('patientName')} *
              </label>
              <input
                type="text"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                placeholder="e.g. Shivanna"
                className="input-field text-sm"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('patientAge')} *
                </label>
                <input
                  type="number"
                  value={qAge}
                  onChange={(e) => setQAge(e.target.value)}
                  placeholder="50"
                  className="input-field text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('patientSex')}
                </label>
                <select
                  value={qSex}
                  onChange={(e) => setQSex(e.target.value as Sex)}
                  className="input-field text-sm"
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {t('riskLevel')} (Direct Finding)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['LOW', 'MODERATE', 'HIGH'] as RiskLevel[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQRisk(r)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      qRisk === r
                        ? r === 'HIGH'
                          ? 'bg-red-600 text-white border-red-600'
                          : r === 'MODERATE'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {t(r.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Findings / Notes
              </label>
              <input
                type="text"
                value={qNotes}
                onChange={(e) => setQNotes(e.target.value)}
                placeholder="e.g. Chewing pan 15 yrs, buccal leukoplakia"
                className="input-field text-sm"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
              {t('save')} & Next Patient
            </button>
          </form>
        </Modal>

        {/* Camp Summary Modal */}
        <Modal
          open={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          title={t('campSummary')}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl space-y-1">
              <span className="font-bold text-teal-900 dark:text-teal-200 block text-sm">
                {campName}
              </span>
              <span className="text-gray-500">{campLocation} • {new Date().toLocaleDateString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <span className="text-base font-bold block">{campPatients.length}</span>
                <span className="text-[10px] text-gray-500">Total</span>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-700">
                <span className="text-base font-bold block">{highRiskCount}</span>
                <span className="text-[10px]">High Risk</span>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-700">
                <span className="text-base font-bold block">{lowRiskCount}</span>
                <span className="text-[10px]">Normal</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportCampCSV}
                className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1"
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1"
              >
                <Printer size={14} />
                Print Summary
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
