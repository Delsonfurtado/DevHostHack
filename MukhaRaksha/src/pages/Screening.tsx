import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Printer,
  Camera,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText,
  UserCheck,
  Activity,
  Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Checkbox, ProgressSteps, RiskBadge, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import { calculateRisk, getRiskBg } from '../utils/riskEngine';
import type {
  Sex,
  HistoryQuestionnaire,
  SymptomQuestionnaire,
  OralSiteFinding,
  FindingStatus,
  Patient,
  Screening as ScreeningModel,
  CapturedImage,
} from '../types/models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SITES = [
  { key: 'lips', en: 'Lips', kn: 'ತುಟಿಗಳು' },
  { key: 'tongueTop', en: 'Tongue (Top)', kn: 'ನಾಲಿಗೆ (ಮೇಲ್ಭಾಗ)' },
  { key: 'tongueSides', en: 'Tongue (Sides / Under)', kn: 'ನಾಲಿಗೆ (ಪಕ್ಕ / ಕೆಳಭಾಗ)' },
  { key: 'floorOfMouth', en: 'Floor of Mouth', kn: 'ಬಾಯಿಯ ತಳ' },
  { key: 'innerCheeks', en: 'Inner Cheeks (Buccal Mucosa)', kn: 'ಒಳಗಿನ ಕೆನ್ನೆ' },
  { key: 'palate', en: 'Hard / Soft Palate', kn: 'ಅಂಗಳ' },
  { key: 'gums', en: 'Gums (Gingiva)', kn: 'ಒಸಡುಗಳು' },
  { key: 'pharynx', en: 'Back of Throat (Pharynx)', kn: 'ಗಂಟಲಿನ ಹಿಂಭಾಗ' },
];

export default function Screening() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attachedImageId = searchParams.get('attachedImageId');

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Patient Details
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    sex: 'male' as Sex,
    village: '',
    phone: '',
    consentGiven: false,
  });

  // Step 1: Health History
  const [history, setHistory] = useState<HistoryQuestionnaire>({
    tobaccoSmoking: false,
    tobaccoChewing: false,
    gutka: false,
    arecaNutPan: false,
    alcohol: false,
    tobaccoDurationYears: undefined,
    tobaccoFrequencyPerDay: undefined,
    familyHistory: false,
    hpvOrImmuneIssues: false,
    poorDiet: false,
    previousOralLesions: false,
  });

  // Step 2: Symptoms
  const [symptoms, setSymptoms] = useState<SymptomQuestionnaire>({
    nonHealingUlcer: false,
    nonHealingUlcerDuration: undefined,
    whitePatches: false,
    redPatches: false,
    lumpOrThickening: false,
    painOrBurning: false,
    difficultyOpeningMouth: false,
    difficultySwallowing: false,
    loosTeeth: false,
    unexplainedBleeding: false,
    numbness: false,
    neckSwelling: false,
  });

  // Step 3: Oral Findings
  const [findings, setFindings] = useState<OralSiteFinding[]>(
    SITES.map((s) => ({ site: s.en, status: 'normal' as FindingStatus }))
  );
  const [attachedImages, setAttachedImages] = useState<CapturedImage[]>([]);

  // Load attached images if any
  useEffect(() => {
    if (attachedImageId) {
      db.images.get(attachedImageId).then((img) => {
        if (img) {
          setAttachedImages((prev) => (prev.some((x) => x.id === img.id) ? prev : [...prev, img]));
        }
      });
    }
  }, [attachedImageId]);

  // Validation
  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!patientData.name.trim()) {
        showToast(lang === 'kn' ? 'ದಯವಿಟ್ಟು ರೋಗಿಯ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter patient name', 'error');
        return false;
      }
      const ageNum = parseInt(patientData.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        showToast(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ವಯಸ್ಸು ನಮೂದಿಸಿ' : 'Please enter valid age', 'error');
        return false;
      }
      if (!patientData.village.trim()) {
        showToast(lang === 'kn' ? 'ಹಳ್ಳಿ ಅಥವಾ ಪಟ್ಟಣ ನಮೂದಿಸಿ' : 'Please enter village or town', 'error');
        return false;
      }
      if (!patientData.consentGiven) {
        showToast(lang === 'kn' ? 'ತಪಾಸಣೆಗೆ ಮೌಖಿಕ ಒಪ್ಪಿಗೆ ಅಗತ್ಯ' : 'Patient verbal consent is required', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4 Risk Calculation
  const riskResult = calculateRisk(history, symptoms, findings);

  // Save to IndexedDB
  const handleSaveScreening = async () => {
    try {
      const patientId = 'p_' + Date.now();
      const screeningId = 's_' + Date.now();
      const now = new Date();

      const newPatient: Patient = {
        id: patientId,
        name: patientData.name.trim(),
        age: parseInt(patientData.age, 10),
        sex: patientData.sex,
        village: patientData.village.trim(),
        phone: patientData.phone.trim() || 'N/A',
        consentGiven: patientData.consentGiven,
        createdAt: now,
        updatedAt: now,
      };

      const newScreening: ScreeningModel = {
        id: screeningId,
        patientId,
        history,
        symptoms,
        oralFindings: findings,
        imageIds: attachedImages.map((img) => img.id),
        riskLevel: riskResult.level,
        riskFactors: lang === 'kn' ? riskResult.factorsKn : riskResult.factors,
        stage: riskResult.level === 'HIGH' ? 'referral_recommended' : 'screening_completed',
        referralFacility: riskResult.level === 'HIGH' ? 'Kidwai Memorial Institute of Oncology / Dental College' : undefined,
        createdAt: now,
        updatedAt: now,
      };

      await db.patients.add(newPatient);
      await db.screenings.add(newScreening);

      // Auto add timeline event
      await db.caseEvents.add({
        id: 'ev_' + Date.now(),
        screeningId,
        stage: newScreening.stage,
        note: `Initial screening completed. Risk assigned: ${riskResult.level}`,
        timestamp: now,
        author: 'Health Worker',
      });

      showToast(lang === 'kn' ? 'ತಪಾಸಣೆ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : 'Screening record saved successfully!', 'success');
      navigate(`/cases/${screeningId}`);
    } catch (e) {
      console.error(e);
      showToast(lang === 'kn' ? 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ.' : 'Failed to save screening.', 'error');
    }
  };

  // Export Bilingual PDF
  const handlePrintPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text('MukhaRaksha / ಮುಖರಕ್ಷಾ', 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text('Oral Cancer Screening & Referral Summary Report', 14, 27);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 33);

      doc.setDrawColor(200);
      doc.line(14, 36, 196, 36);

      // Patient Info Table
      autoTable(doc, {
        startY: 40,
        head: [['Field', 'Patient Details']],
        body: [
          ['Name', patientData.name],
          ['Age / Sex', `${patientData.age} Years / ${patientData.sex.toUpperCase()}`],
          ['Location / Village', patientData.village],
          ['Phone', patientData.phone || 'N/A'],
          ['Risk Level', riskResult.level],
        ],
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
      });

      // Findings Summary
      const findingsBody = findings.map((f) => [f.site, f.status.toUpperCase()]);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Oral Cavity Site', 'Screening Finding']],
        body: findingsBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Risk Factors
      const factorList = riskResult.factors.length > 0 ? riskResult.factors.map((f) => [f]) : [['No critical risk factors flagged']];
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Identified Risk Factors / Red Flags']],
        body: factorList,
        theme: 'plain',
        headStyles: { fillColor: riskResult.level === 'HIGH' ? [220, 38, 38] : [245, 158, 11] },
      });

      // Footer Recommendation
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      const advice =
        riskResult.level === 'HIGH'
          ? 'URGENT: Professional clinical examination recommended within 7 days.'
          : riskResult.level === 'MODERATE'
          ? 'Re-screen in 2-4 weeks or visit local primary dental center.'
          : 'Low risk. Continue routine monthly oral self-examination.';
      doc.text(advice, 14, finalY);

      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        'Disclaimer: MukhaRaksha is a screening & awareness aid. It does not provide medical diagnosis.',
        14,
        finalY + 10
      );

      doc.save(`MukhaRaksha_Screening_${patientData.name.replace(/\s+/g, '_')}.pdf`);
      showToast(lang === 'kn' ? 'PDF ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ' : 'PDF generated successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error generating PDF', 'error');
    }
  };

  const stepsLabels = [
    lang === 'kn' ? 'ವಿವರ' : 'Details',
    lang === 'kn' ? 'ಇತಿಹಾಸ' : 'History',
    lang === 'kn' ? 'ಲಕ್ಷಣ' : 'Symptoms',
    lang === 'kn' ? 'ಪರೀಕ್ಷೆ' : 'Exam',
    lang === 'kn' ? 'ಫಲಿತಾಂಶ' : 'Result',
  ];

  return (
    <Layout title={t('newScreeningTitle')} showDisclaimer>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Client-Side Privacy Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 text-xs text-teal-900 dark:text-teal-200 shadow-2xs">
          <Sparkles size={15} className="text-teal-600 shrink-0" />
          <span className="leading-snug">
            <strong>{lang === 'kn' ? '100% ಸ್ಥಳೀಯ ಮತ್ತು ಗೌಪ್ಯ' : '100% Client-Side Privacy'}:</strong>{' '}
            {lang === 'kn'
              ? 'ಎಲ್ಲಾ ರೋಗಿ ಮಾಹಿತಿ ಮತ್ತು ತಪಾಸಣಾ ಚಿತ್ರಗಳು ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನ IndexedDB ಯಲ್ಲಿ ಮಾತ್ರ ಉಳಿಯುತ್ತವೆ.'
              : 'All patient records and clinical images are stored securely on this device without external transmission.'}
          </span>
        </div>

        {/* Step Progress Tracker */}
        <ProgressSteps steps={stepsLabels} current={currentStep} />

        {/* STEP 0: PATIENT DETAILS */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck className="text-teal-600" size={20} />
                {t('patientDetails')}
              </h2>
              <ReadAloudBtn text={lang === 'kn' ? 'ರೋಗಿಯ ಮೂಲ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' : 'Enter patient demographic details and verify verbal consent.'} />
            </div>

            <Card className="space-y-4 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('patientName')} *
                  </label>
                  <input
                    type="text"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('patientAge')} *
                    </label>
                    <input
                      type="number"
                      value={patientData.age}
                      onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                      placeholder="e.g. 48"
                      className="input-field"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('patientSex')}
                    </label>
                    <select
                      value={patientData.sex}
                      onChange={(e) => setPatientData({ ...patientData, sex: e.target.value as Sex })}
                      className="input-field"
                    >
                      <option value="male">{t('male')}</option>
                      <option value="female">{t('female')}</option>
                      <option value="other">{t('other')}</option>
                      <option value="prefer_not_to_say">{t('preferNotToSay')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('village')} *
                  </label>
                  <input
                    type="text"
                    value={patientData.village}
                    onChange={(e) => setPatientData({ ...patientData, village: e.target.value })}
                    placeholder="e.g. Ramanagara"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('phone')} (10 Digits)
                  </label>
                  <input
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="input-field"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <Checkbox
                  checked={patientData.consentGiven}
                  onChange={(v) => setPatientData({ ...patientData, consentGiven: v })}
                  label={t('consentCheckbox')}
                  className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900"
                />
              </div>
            </Card>
          </div>
        )}

        {/* STEP 1: HEALTH & HABIT HISTORY */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="text-teal-600" size={20} />
                {t('historyTitle')}
              </h2>
              <ReadAloudBtn text={lang === 'kn' ? 'ತಂಬಾಕು, ಅಡಿಕೆ ಮತ್ತು ಮದ್ಯಪಾನದ ಇತಿಹಾಸ' : 'Screening questions regarding tobacco, betel nut, alcohol and medical history.'} />
            </div>

            <Card className="space-y-4 p-5">
              <div className="font-semibold text-xs uppercase tracking-wider text-teal-800 dark:text-teal-300">
                {t('tobaccoUse')} & Substance Habits
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Checkbox
                  checked={history.tobaccoSmoking}
                  onChange={(v) => setHistory({ ...history, tobaccoSmoking: v })}
                  label={t('tobaccoSmoking')}
                />
                <Checkbox
                  checked={history.tobaccoChewing}
                  onChange={(v) => setHistory({ ...history, tobaccoChewing: v })}
                  label={t('tobaccoChewing')}
                />
                <Checkbox
                  checked={history.gutka}
                  onChange={(v) => setHistory({ ...history, gutka: v })}
                  label={t('gutka')}
                />
                <Checkbox
                  checked={history.arecaNutPan}
                  onChange={(v) => setHistory({ ...history, arecaNutPan: v })}
                  label={t('arecaNutPan')}
                />
                <Checkbox
                  checked={history.alcohol}
                  onChange={(v) => setHistory({ ...history, alcohol: v })}
                  label={t('alcohol')}
                />
              </div>

              {/* Conditional duration and frequency */}
              {(history.tobaccoSmoking || history.tobaccoChewing || history.gutka || history.arecaNutPan) && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-xl space-y-3 mt-2 border border-teal-200 dark:border-teal-800">
                  <div className="text-xs font-semibold text-teal-900 dark:text-teal-200">
                    {lang === 'kn' ? 'ತಂಬಾಕು ವಿವರಣೆ' : 'Tobacco Exposure Details'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-600 dark:text-gray-300 mb-1">
                        {t('tobaccoDuration')}
                      </label>
                      <input
                        type="number"
                        value={history.tobaccoDurationYears || ''}
                        onChange={(e) =>
                          setHistory({ ...history, tobaccoDurationYears: parseInt(e.target.value) || undefined })
                        }
                        placeholder="e.g. 15"
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 dark:text-gray-300 mb-1">
                        {t('tobaccoFrequency')}
                      </label>
                      <input
                        type="number"
                        value={history.tobaccoFrequencyPerDay || ''}
                        onChange={(e) =>
                          setHistory({ ...history, tobaccoFrequencyPerDay: parseInt(e.target.value) || undefined })
                        }
                        placeholder="e.g. 6"
                        className="input-field text-sm py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 font-semibold text-xs uppercase tracking-wider text-teal-800 dark:text-teal-300 mt-3 mb-1">
                {lang === 'kn' ? 'ಆರೋಗ್ಯ ಇತಿಹಾಸ' : 'Clinical History'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Checkbox
                  checked={history.familyHistory}
                  onChange={(v) => setHistory({ ...history, familyHistory: v })}
                  label={t('familyHistory')}
                />
                <Checkbox
                  checked={history.hpvOrImmuneIssues}
                  onChange={(v) => setHistory({ ...history, hpvOrImmuneIssues: v })}
                  label={t('hpvOrImmuneIssues')}
                />
                <Checkbox
                  checked={history.poorDiet}
                  onChange={(v) => setHistory({ ...history, poorDiet: v })}
                  label={t('poorDiet')}
                />
                <Checkbox
                  checked={history.previousOralLesions}
                  onChange={(v) => setHistory({ ...history, previousOralLesions: v })}
                  label={t('previousOralLesions')}
                />
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: SYMPTOMS QUESTIONNAIRE */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                {t('symptomsTitle')}
              </h2>
              <ReadAloudBtn text={lang === 'kn' ? 'ಬಾಯಿಯ ರೋಗಲಕ್ಷಣಗಳ ಪರೀಕ್ಷೆ' : 'Check patient for any current symptoms or oral discomfort.'} />
            </div>

            <Card className="space-y-4 p-5">
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                <Checkbox
                  checked={symptoms.nonHealingUlcer}
                  onChange={(v) => setSymptoms({ ...symptoms, nonHealingUlcer: v })}
                  label={t('nonHealingUlcer')}
                  className="font-bold text-amber-900 dark:text-amber-200"
                />

                {symptoms.nonHealingUlcer && (
                  <div className="ml-7 mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      {t('ulcerDuration')}
                    </label>
                    <input
                      type="number"
                      value={symptoms.nonHealingUlcerDuration || ''}
                      onChange={(e) =>
                        setSymptoms({ ...symptoms, nonHealingUlcerDuration: parseInt(e.target.value) || undefined })
                      }
                      placeholder="e.g. 3"
                      className="input-field text-sm py-1.5 max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Checkbox
                  checked={symptoms.whitePatches}
                  onChange={(v) => setSymptoms({ ...symptoms, whitePatches: v })}
                  label={t('whitePatches')}
                />
                <Checkbox
                  checked={symptoms.redPatches}
                  onChange={(v) => setSymptoms({ ...symptoms, redPatches: v })}
                  label={t('redPatches')}
                />
                <Checkbox
                  checked={symptoms.lumpOrThickening}
                  onChange={(v) => setSymptoms({ ...symptoms, lumpOrThickening: v })}
                  label={t('lumpOrThickening')}
                />
                <Checkbox
                  checked={symptoms.difficultyOpeningMouth}
                  onChange={(v) => setSymptoms({ ...symptoms, difficultyOpeningMouth: v })}
                  label={t('difficultyOpeningMouth')}
                />
                <Checkbox
                  checked={symptoms.difficultySwallowing}
                  onChange={(v) => setSymptoms({ ...symptoms, difficultySwallowing: v })}
                  label={t('difficultySwallowing')}
                />
                <Checkbox
                  checked={symptoms.painOrBurning}
                  onChange={(v) => setSymptoms({ ...symptoms, painOrBurning: v })}
                  label={t('painOrBurning')}
                />
                <Checkbox
                  checked={symptoms.loosTeeth}
                  onChange={(v) => setSymptoms({ ...symptoms, loosTeeth: v })}
                  label={t('loosTeeth')}
                />
                <Checkbox
                  checked={symptoms.unexplainedBleeding}
                  onChange={(v) => setSymptoms({ ...symptoms, unexplainedBleeding: v })}
                  label={t('unexplainedBleeding')}
                />
                <Checkbox
                  checked={symptoms.numbness}
                  onChange={(v) => setSymptoms({ ...symptoms, numbness: v })}
                  label={t('numbness')}
                />
                <Checkbox
                  checked={symptoms.neckSwelling}
                  onChange={(v) => setSymptoms({ ...symptoms, neckSwelling: v })}
                  label={t('neckSwelling')}
                />
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: VISUAL SCREENING FINDINGS & ATTACH IMAGES */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-teal-600" size={20} />
                  {t('oralFindingsTitle')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('oralFindingsSubtitle')}</p>
              </div>
              <ReadAloudBtn text={lang === 'kn' ? 'ಬಾಯಿಯ ಎಲ್ಲ ಭಾಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಗುರುತಿಸಿ' : 'Carefully inspect each oral site and select findings.'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SITES.map((siteItem) => {
                const currentFinding = findings.find((f) => f.site === siteItem.en)?.status || 'normal';
                return (
                  <Card key={siteItem.key} className="p-3.5 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {lang === 'kn' ? siteItem.kn : siteItem.en}
                      </div>
                      <div className="text-[10px] text-gray-400">{siteItem.en}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(['normal', 'suspicious', 'not_examined'] as FindingStatus[]).map((status) => {
                        const isSel = currentFinding === status;
                        let btnStyle = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
                        if (isSel) {
                          if (status === 'normal') btnStyle = 'bg-green-600 text-white font-bold shadow-xs';
                          if (status === 'suspicious') btnStyle = 'bg-amber-600 text-white font-bold shadow-xs';
                          if (status === 'not_examined') btnStyle = 'bg-gray-500 text-white font-bold shadow-xs';
                        }
                        const labelMap: Record<FindingStatus, string> = {
                          normal: t('normal'),
                          suspicious: t('suspicious'),
                          not_examined: t('notExamined'),
                        };
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              const updated = [...findings];
                              const foundIdx = updated.findIndex((f) => f.site === siteItem.en);
                              if (foundIdx >= 0) {
                                updated[foundIdx].status = status;
                              } else {
                                updated.push({ site: siteItem.en, status });
                              }
                              setFindings(updated);
                            }}
                            className={`py-1.5 px-2.5 text-xs rounded-lg transition-all ${btnStyle}`}
                          >
                            {labelMap[status]}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Attach Images from Feature A */}
            <Card className="p-4 border-dashed border-2 border-teal-300 dark:border-teal-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Camera size={16} />
                  {t('attachImages')} ({attachedImages.length})
                </span>
                <button
                  onClick={() => navigate('/capture?screeningId=temp')}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs"
                >
                  <Camera size={14} />
                  {lang === 'kn' ? 'ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ' : 'Launch Camera'}
                </button>
              </div>

              {attachedImages.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-2">{t('noImagesAttached')}</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border">
                      <img src={img.thumbnail} alt="Oral site" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">
                        {img.site || 'Site'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 4: EXPLAINABLE RESULTS & NEXT STEPS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-teal-600" size={20} />
                {t('resultsTitle')}
              </h2>
              <ReadAloudBtn
                text={
                  lang === 'kn'
                    ? `ತಪಾಸಣೆ ಫಲಿತಾಂಶ: ${riskResult.level === 'HIGH' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : riskResult.level === 'MODERATE' ? 'ಮಧ್ಯಮ ಅಪಾಯ' : 'ಕಡಿಮೆ ಅಪಾಯ'}. ${
                        riskResult.level === 'HIGH' ? t('highAdvice') : riskResult.level === 'MODERATE' ? t('moderateAdvice') : t('lowAdvice')
                      }`
                    : `Screening Result: ${riskResult.level} Risk. ${
                        riskResult.level === 'HIGH' ? t('highAdvice') : riskResult.level === 'MODERATE' ? t('moderateAdvice') : t('lowAdvice')
                      }`
                }
              />
            </div>

            {/* Desktop 2-column result layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Risk Banner & Explanation */}
              <div className="space-y-4">
                {/* Risk Banner */}
                <div className={`p-5 rounded-2xl border ${getRiskBg(riskResult.level)} space-y-2.5 shadow-2xs`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      {t('riskLevel')}
                    </span>
                    <RiskBadge level={riskResult.level} />
                  </div>

                  <div className="text-sm font-semibold text-gray-900 dark:text-white pt-1 leading-relaxed">
                    {riskResult.level === 'HIGH' && t('highAdvice')}
                    {riskResult.level === 'MODERATE' && t('moderateAdvice')}
                    {riskResult.level === 'LOW' && t('lowAdvice')}
                  </div>
                </div>

                {/* Explainable Panel: Why this result? */}
                <Card className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={18} className="text-teal-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('whyThisResult')}</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {riskResult.factors.length === 0 ? (
                      <p className="text-gray-500 italic">
                        {lang === 'kn'
                          ? 'ಯಾವುದೇ ಗಂಭೀರ ತಂಬಾಕು ಅಥವಾ ಹುಣ್ಣಿನ ಅಪಾಯಕಾರಿ ಅಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
                          : 'No critical tobacco exposure or prolonged mucosal lesions recorded.'}
                      </p>
                    ) : (
                      (lang === 'kn' ? riskResult.factorsKn : riskResult.factors).map((factor, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">{factor}</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Findings Summary Table & Action Buttons */}
              <div className="space-y-4">
                {/* Summary Findings Table */}
                <Card className="space-y-2.5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {lang === 'kn' ? 'ಪರೀಕ್ಷಿಸಿದ ಭಾಗಗಳ ವಿವರ' : 'Visual Examination Summary'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {findings.map((f, i) => (
                      <div key={i} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center border border-gray-100 dark:border-gray-700/60">
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-1">{f.site}</span>
                        <span
                          className={`font-bold uppercase text-[10px] shrink-0 ${
                            f.status === 'suspicious'
                              ? 'text-red-500'
                              : f.status === 'normal'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {f.status === 'suspicious' ? t('suspicious') : f.status === 'normal' ? t('normal') : t('notExamined')}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Actions: Save & PDF */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    onClick={handlePrintPDF}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold shadow-xs"
                  >
                    <Printer size={18} />
                    {t('printSummary')}
                  </button>
                  <button
                    onClick={handleSaveScreening}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold shadow-sm"
                  >
                    <Save size={18} />
                    {t('saveScreening')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              {t('back')}
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 && (
            <button
              onClick={handleNext}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1 shadow-sm"
            >
              {t('continue')}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
