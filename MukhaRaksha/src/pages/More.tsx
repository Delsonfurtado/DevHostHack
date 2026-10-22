import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Settings,
  UserCheck,
  Globe,
  Moon,
  Sun,
  Key,
  Shield,
  Lock,
  Building2,
  Download,
  Upload,
  MessageSquare,
  Tent,
  Trash2,
  Plus,
  Phone,
  MapPin,
  ExternalLink,
  Info,
  ChevronRight,
  Sparkles,
  Video,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Toggle, Modal, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { FacilityEntry, UserRole } from '../types/models';

export default function More() {
  const { t, lang, setLang, role, setRole, darkMode, setDarkMode, settings, updateSettings } = useApp();
  const navigate = useNavigate();

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityForm, setFacilityForm] = useState<Partial<FacilityEntry>>({
    name: '',
    nameKn: '',
    type: 'hospital',
    address: '',
    phone: '',
    district: 'Bengaluru Urban',
    isGovt: true,
  });

  // Live facilities from DB
  const facilities = useLiveQuery(() => db.facilities.toArray(), []) || [];

  // Claude API Key Local State
  const [apiKeyInput, setApiKeyInput] = useState(settings.claudeApiKey || '');
  const [videoUrlInput, setVideoUrlInput] = useState(settings.customVideoUrl || '');

  const handleSaveApiKey = () => {
    updateSettings({ claudeApiKey: apiKeyInput.trim() });
    showToast(lang === 'kn' ? 'API ಕೀ ಉಳಿಸಲಾಗಿದೆ' : 'Claude API Key saved locally', 'success');
  };

  const handleSaveVideoUrl = () => {
    updateSettings({ customVideoUrl: videoUrlInput.trim() });
    showToast(lang === 'kn' ? 'ವೀಡಿಯೋ URL ಉಳಿಸಲಾಗಿದೆ' : 'Custom video URL updated', 'success');
  };

  // PIN Lock Handler
  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      showToast('PIN must be 4 digits', 'error');
      return;
    }
    updateSettings({ pinEnabled: true, pinHash: pinInput });
    setPinInput('');
    setShowPinModal(false);
    showToast(lang === 'kn' ? 'PIN ಲಾಕ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ' : 'PIN Lock enabled', 'success');
  };

  // Facility Form Handler
  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.name?.trim()) return;

    try {
      const newEntry: FacilityEntry = {
        id: 'fac_' + Date.now(),
        name: facilityForm.name.trim(),
        nameKn: facilityForm.nameKn?.trim() || facilityForm.name.trim(),
        type: (facilityForm.type as any) || 'hospital',
        address: facilityForm.address?.trim() || 'Karnataka',
        phone: facilityForm.phone?.trim() || '',
        district: facilityForm.district?.trim() || 'Bengaluru',
        isGovt: facilityForm.isGovt ?? true,
        specialties: ['oncology', 'oral_surgery'],
      };

      await db.facilities.add(newEntry);
      setShowFacilityModal(false);
      setFacilityForm({ name: '', nameKn: '', address: '', phone: '', district: '' });
      showToast(lang === 'kn' ? 'ಆಸ್ಪತ್ರೆ ವಿವರ ಸೇರಿಸಲಾಗಿದೆ' : 'Facility added to local directory', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving facility', 'error');
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (window.confirm(lang === 'kn' ? 'ಈ ಆಸ್ಪತ್ರೆಯನ್ನು ತೆಗೆಯಬೇಕೆ?' : 'Remove this facility?')) {
      await db.facilities.delete(id);
      showToast('Facility removed', 'info');
    }
  };

  // Data Export / Clear
  const handleExportCSV = async () => {
    const screenings = await db.screenings.toArray();
    const patients = await db.patients.toArray();
    const pMap = new Map(patients.map((p) => [p.id, p]));

    const headers = ['ScreeningID', 'PatientName', 'Age', 'Sex', 'Village', 'RiskLevel', 'Stage', 'Date'];
    const rows = screenings.map((s) => {
      const p = pMap.get(s.patientId);
      return [s.id, `"${p?.name || ''}"`, p?.age, p?.sex, `"${p?.village || ''}"`, s.riskLevel, s.stage, s.createdAt];
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `MukhaRaksha_Export_${Date.now()}.csv`;
    link.click();
    showToast('Cases exported to CSV', 'success');
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        lang === 'kn'
          ? 'ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿರುವ ಎಲ್ಲ ರೋಗಿ ಮತ್ತು ತಪಾಸಣಾ ವಿವರಗಳು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತವೆ. ಮುಂದುವರಿಯಬೇಕೆ?'
          : 'WARNING: This will permanently erase all local patient, screening, and habit data from this device. Proceed?'
      )
    ) {
      await db.delete();
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Layout title={t('settings')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* SECTION 1: ROLE & PREFERENCES */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <UserCheck size={14} />
            {lang === 'kn' ? 'ಪಾತ್ರ ಮತ್ತು ಆದ್ಯತೆಗಳು' : 'Profile & App Preferences'}
          </h3>

          {/* Role Switch */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              {t('role')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('health_worker')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  role === 'health_worker'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                }`}
              >
                🩺 {t('healthWorker')}
              </button>
              <button
                type="button"
                onClick={() => setRole('individual')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  role === 'individual'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                }`}
              >
                👤 {t('individual')}
              </button>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Globe size={16} className="text-teal-600" />
              {t('language')}
            </span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md font-semibold ${lang === 'en' ? 'bg-white dark:bg-gray-600 text-teal-700 shadow-xs' : 'text-gray-500'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('kn')}
                className={`px-2.5 py-1 rounded-md font-semibold ${lang === 'kn' ? 'bg-white dark:bg-gray-600 text-teal-700 shadow-xs' : 'text-gray-500'}`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              {darkMode ? <Moon size={16} className="text-teal-400" /> : <Sun size={16} className="text-amber-500" />}
              {t('darkMode')}
            </span>
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </div>
        </Card>

        {/* SECTION 2: AI ASSISTANT (OPTIONAL CLAUDE API KEY) */}
        <Card className="p-4 space-y-3 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              {lang === 'kn' ? 'ಐಚ್ಛಿಕ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Claude AI)' : 'AI Integration (Claude API)'}
            </h3>
            <span className="text-[10px] bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full font-bold">
              Client-Side
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'kn'
              ? 'ನಿಮ್ಮ ಸ್ವಂತ Anthropic API ಕೀಯನ್ನು ನಮೂದಿಸಿದರೆ ಬ್ರೌಸರ್‌ನಿಂದ ನೇರವಾಗಿ Claude Haiku ಮೂಲಕ ಪ್ರಶ್ನೋತ್ತರಗಳು ದೊರೆಯುತ್ತವೆ.'
              : 'Add your own Claude API key to power Ask MukhaRaksha in Kannada & English directly from the browser.'}
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="input-field text-xs py-2 flex-1 font-mono"
            />
            <button onClick={handleSaveApiKey} className="btn-primary py-2 px-3 text-xs shrink-0 font-bold">
              {t('save')}
            </button>
          </div>

          {/* Custom Video URL */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <Video size={13} /> {t('customVideoUrl')}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="input-field text-xs py-2 flex-1"
              />
              <button onClick={handleSaveVideoUrl} className="btn-secondary py-2 px-3 text-xs shrink-0 font-bold">
                {t('save')}
              </button>
            </div>
          </div>
        </Card>

        {/* SECTION 3: PRIVACY & PIN LOCK */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <Shield size={14} />
            {t('privacyNotice')}
          </h3>

          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-xl text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
            {t('privacyText')}
          </div>

          {/* PIN Lock */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                {t('pinLock')}
              </span>
              <span className="text-[10px] text-gray-400">
                {settings.pinEnabled ? 'PIN protection active' : 'Protect patient records'}
              </span>
            </div>
            <button
              onClick={() => setShowPinModal(true)}
              className="btn-secondary py-1.5 px-3 text-xs font-bold"
            >
              <Lock size={12} className="inline mr-1" />
              {settings.pinEnabled ? 'Change PIN' : t('setPin')}
            </button>
          </div>
        </Card>

        {/* SECTION 4: EDITABLE LOCAL FACILITIES DIRECTORY */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Building2 size={14} />
              {t('facilities')} ({facilities.length})
            </h3>
            <button
              onClick={() => setShowFacilityModal(true)}
              className="btn-primary py-1 px-2.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus size={13} />
              {t('addFacility')}
            </button>
          </div>

          <div className="space-y-2">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {lang === 'kn' ? fac.nameKn : fac.name}
                  </div>
                  <div className="text-gray-500 text-[11px] flex items-center gap-1">
                    <MapPin size={11} /> {fac.address}
                  </div>
                  {fac.phone && (
                    <div className="text-teal-600 font-medium flex items-center gap-1">
                      <Phone size={11} /> {fac.phone}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {fac.phone && (
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9]/g, '')}`}
                      className="p-1.5 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200"
                      title="Call"
                    >
                      <Phone size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteFacility(fac.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 5: DATA EXPORT & DANGER ZONE */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {lang === 'kn' ? 'ಡೇಟಾ ನಿರ್ವಹಣೆ' : 'Data Management & Storage'}
          </h3>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 font-bold"
            >
              <Download size={14} />
              {t('exportCSV')}
            </button>
          </div>

          <div className="pt-2 border-t border-red-100 dark:border-red-950">
            <button
              onClick={handleClearAllData}
              className="w-full py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              {lang === 'kn' ? 'ಎಲ್ಲ ಡೇಟಾ ಅಳಿಸಿ (ರಿಸೆಟ್)' : 'Clear All Local App Data'}
            </button>
          </div>
        </Card>

        {/* About App Footer */}
        <div className="text-center text-xs text-gray-400 py-3 space-y-1">
          <p className="font-bold text-gray-600 dark:text-gray-300">
            {t('appName')} (ಮುಖರಕ್ಷಾ) • {t('version')}
          </p>
          <p>Built for ASHA/ANM workers and Karnataka community dental healthcare.</p>
        </div>

        {/* Set PIN Modal */}
        <Modal open={showPinModal} onClose={() => setShowPinModal(false)} title={t('setPin')}>
          <form onSubmit={handleSetPin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Enter 4-Digit Security PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1234"
                className="input-field text-center text-xl tracking-widest font-mono"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
              Save Security PIN
            </button>
          </form>
        </Modal>

        {/* Add Facility Modal */}
        <Modal open={showFacilityModal} onClose={() => setShowFacilityModal(false)} title={t('addFacility')}>
          <form onSubmit={handleSaveFacility} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Facility Name (English) *</label>
              <input
                type="text"
                value={facilityForm.name}
                onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                placeholder="e.g. Mandya Institute of Medical Sciences"
                className="input-field text-xs py-2"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ)</label>
              <input
                type="text"
                value={facilityForm.nameKn}
                onChange={(e) => setFacilityForm({ ...facilityForm, nameKn: e.target.value })}
                placeholder="ಮಂಡ್ಯ ವೈದ್ಯಕೀಯ ವಿಜ್ಞಾನಗಳ ಸಂಸ್ಥೆ"
                className="input-field text-xs py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input
                type="text"
                value={facilityForm.address}
                onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
                placeholder="District Hospital Road, Mandya"
                className="input-field text-xs py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={facilityForm.phone}
                  onChange={(e) => setFacilityForm({ ...facilityForm, phone: e.target.value })}
                  placeholder="08232-224055"
                  className="input-field text-xs py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={facilityForm.district}
                  onChange={(e) => setFacilityForm({ ...facilityForm, district: e.target.value })}
                  placeholder="Mandya"
                  className="input-field text-xs py-2"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
              {t('save')} Facility
            </button>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
