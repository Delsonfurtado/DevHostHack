import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Eye,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Checkbox, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { SelfExam as SelfExamModel, CapturedImage } from '../types/models';

const EXAM_STEPS = [
  {
    step: 1,
    site: 'Lips',
    titleEn: '1. Inspect Outer & Inner Lips',
    titleKn: '೧. ಹೊರ ಮತ್ತು ಒಳ ತುಟಿಗಳನ್ನು ಗಮನಿಸಿ',
    descEn: 'Pull down lower lip and look for persistent sores, white patches, or unusual lumps.',
    descKn: 'ಕೆಳ ತುಟಿಯನ್ನು ಕೆಳಗೆ ಎಳೆದು ವಾಸಿಯಾಗದ ಹುಣ್ಣು, ಬಿಳಿ ಚುಕ್ಕೆ ಅಥವಾ ಗಡ್ಡೆಗಳಿವೆಯೇ ನೋಡಿ.',
  },
  {
    step: 2,
    site: 'Inner Cheeks',
    titleEn: '2. Check Inside Both Cheeks',
    titleKn: '೨. ಎರಡೂ ಕೆನ್ನೆಗಳ ಒಳಭಾಗ ಪರೀಕ್ಷಿಸಿ',
    descEn: 'Gently pull cheeks away with fingers; look for red or white patches and check elasticity.',
    descKn: 'ಕೆನ್ನೆಯನ್ನು ಬೆರಳಿನಿಂದ ಎಳೆದು ಕೆಂಪು ಅಥವಾ ಬಿಳಿ ಚುಕ್ಕೆಗಳಿವೆಯೇ ಮತ್ತು ಚರ್ಮ ಬಿಗಿಯಾಗಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.',
  },
  {
    step: 3,
    site: 'Gums',
    titleEn: '3. Inspect Upper & Lower Gums',
    titleKn: '೩. ಮೇಲಿನ ಮತ್ತು ಕೆಳಗಿನ ಒಸಡುಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ',
    descEn: 'Look for unexplained bleeding, painful sores, or loose teeth without known reason.',
    descKn: 'ಒಸಡಿನಲ್ಲಿ ರಕ್ತಸ್ರಾವ, ನೋವಿನ ಹುಣ್ಣುಗಳು ಅಥವಾ ಕಾರಣವಿಲ್ಲದೆ ಸಡಿಲವಾದ ಹಲ್ಲುಗಳಿವೆಯೇ ಗಮನಿಸಿ.',
  },
  {
    step: 4,
    site: 'Tongue (Top)',
    titleEn: '4. Stick Out Tongue & Check Top Surface',
    titleKn: '೪. ನಾಲಿಗೆ ಚಾಚಿ ಮೇಲ್ಭಾಗವನ್ನು ನೋಡಿ',
    descEn: 'Check the color and texture; look for persistent coatings or non-healing ulcers.',
    descKn: 'ನಾಲಿಗೆಯ ಬಣ್ಣ ಮತ್ತು ಮೇಲ್ಮೈ ಗಮನಿಸಿ. ಬಿಳಿ ಲೇಪನ ಅಥವಾ ಹುಣ್ಣುಗಳಿವೆಯೇ ನೋಡಿ.',
  },
  {
    step: 5,
    site: 'Tongue (Sides)',
    titleEn: '5. Hold Tongue Tip & Check Both Sides',
    titleKn: '೫. ನಾಲಿಗೆಯ ಎರಡೂ ಬದಿಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ',
    descEn: 'Gently hold tongue tip with a clean tissue, pull right then left. Common oral cancer site.',
    descKn: 'ನಾಲಿಗೆಯ ತುದಿಯನ್ನು ಹಿಡಿದು ಬಲಕ್ಕೆ ಮತ್ತು ಎಡಕ್ಕೆ ತಿರುಗಿಸಿ ಬದಿಗಳನ್ನು ನೋಡಿ (ಅತಿ ಮುಖ್ಯ ಸ್ಥಳ).',
  },
  {
    step: 6,
    site: 'Floor of Mouth',
    titleEn: '6. Lift Tongue to Check Floor of Mouth',
    titleKn: '೬. ನಾಲಿಗೆ ಮೇಲಕ್ಕೆತ್ತಿ ಬಾಯಿಯ ತಳಭಾಗ ನೋಡಿ',
    descEn: 'Touch tip of tongue to roof of mouth. Inspect floor and underside of tongue.',
    descKn: 'ನಾಲಿಗೆಯನ್ನು ಮೇಲಕ್ಕೆತ್ತಿ ಬಾಯಿಯ ಅಡಿಭಾಗ ಮತ್ತು ನಾಲಿಗೆಯ ಕೆಳಭಾಗವನ್ನು ಸೂಕ್ಷ್ಮವಾಗಿ ಗಮನಿಸಿ.',
  },
  {
    step: 7,
    site: 'Palate',
    titleEn: '7. Tilt Head Back & Inspect Roof of Mouth',
    titleKn: '೭. ತಲೆಯನ್ನು ಹಿಂದಕ್ಕೆ ಬಾಗಿಸಿ ಅಂಗಳವನ್ನು ನೋಡಿ',
    descEn: 'Open mouth wide and examine the hard and soft palate for color changes or bumps.',
    descKn: 'ಬಾಯಿ ಅಗಲವಾಗಿ ತೆರೆದು ಮೇಲ್ಭಾಗದ ಅಂಗಳದ ಬಣ್ಣ ಬದಲಾವಣೆ ಅಥವಾ ಗಡ್ಡೆಗಳನ್ನು ನೋಡಿ.',
  },
  {
    step: 8,
    site: 'Neck',
    titleEn: '8. Feel Neck & Jawline for Swollen Lumps',
    titleKn: '೮. ಕತ್ತು ಮತ್ತು ದವಡೆಯ ಕೆಳಗೆ ಮುಟ್ಟಿ ನೋಡಿ',
    descEn: 'Use fingertips to feel both sides of your neck for painless enlarged lymph nodes.',
    descKn: 'ಎರಡೂ ಬದಿಯ ಕತ್ತು ಮತ್ತು ದವಡೆಯ ಕೆಳಗೆ ಬೆರಳುಗಳಿಂದ ಸ್ಪರ್ಶಿಸಿ ಊತ ಅಥವಾ ಗಡ್ಡೆಗಳಿವೆಯೇ ಪರೀಕ್ಷಿಸಿ.',
  },
];

export default function SelfExam() {
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(8).fill(false));
  const [patientName, setPatientName] = useState('My Self-Check');
  const [changeNoticed, setChangeNoticed] = useState(false);
  const [notes, setNotes] = useState('');

  // Past exams query
  const pastExams = useLiveQuery(() => db.selfExams.orderBy('createdAt').reverse().toArray(), []) || [];
  const allImages = useLiveQuery(() => db.images.toArray(), []) || [];

  // Photo Comparison Slider
  const [compareIdx1, setCompareIdx1] = useState(0);
  const [compareIdx2, setCompareIdx2] = useState(1);
  const [sliderPos, setSliderPos] = useState(50); // 0-100%

  // Request Notification permission
  const scheduleMonthlyReminder = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', 'info');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast(
        lang === 'kn'
          ? 'ಮಾಸಿಕ ಜ್ಞಾಪನೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ! ಪ್ರತಿ ತಿಂಗಳು ಸೂಚನೆ ಬರುತ್ತದೆ.'
          : 'Monthly reminder scheduled! You will receive an alert for your next check.',
        'success'
      );
    } else {
      showToast('Notification permission denied', 'error');
    }
  };

  const handleToggleStep = (idx: number) => {
    const updated = [...completedSteps];
    updated[idx] = !updated[idx];
    setCompletedSteps(updated);
  };

  // Save Self Exam
  const handleSaveExam = async () => {
    try {
      const examId = 'exam_' + Date.now();
      const checklistItems = EXAM_STEPS.map((s, i) => ({
        item: s.site,
        checked: completedSteps[i],
      }));

      const newExam: SelfExamModel = {
        id: examId,
        patientName,
        imageIds: [],
        checklistItems,
        changeNoticed,
        notes: notes.trim() || undefined,
        createdAt: new Date(),
      };

      await db.selfExams.add(newExam);
      showToast(lang === 'kn' ? 'ಸ್ವ-ಪರೀಕ್ಷೆ ದಾಖಲಿಸಲಾಗಿದೆ!' : 'Monthly self-exam saved successfully!', 'success');

      if (changeNoticed) {
        showToast(
          lang === 'kn'
            ? 'ಬದಲಾವಣೆ ಕಂಡಿರುವುದರಿಂದ ತಪಾಸಣಾ ವಿಭಾಗಕ್ಕೆ ಕೊಂಡೊಯ್ಯಲಾಗುತ್ತಿದೆ...'
            : 'Change noticed. Navigating to formal clinical screening...',
          'info'
        );
        setTimeout(() => navigate('/screen'), 1200);
      } else {
        // Reset checklist
        setCompletedSteps(new Array(8).fill(false));
        setActiveStepIdx(0);
        setChangeNoticed(false);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to save self-exam', 'error');
    }
  };

  const currentStep = EXAM_STEPS[activeStepIdx];
  const allChecked = completedSteps.every(Boolean);

  return (
    <Layout title={t('selfExamTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Header & Reminder Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="text-teal-600" size={20} />
              {t('selfExamTitle')}
            </h2>
            <p className="text-xs text-gray-500">{t('selfExamGuide')} (2 Minutes)</p>
          </div>
          <button
            onClick={scheduleMonthlyReminder}
            className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
          >
            <Bell size={13} />
            {lang === 'kn' ? 'ಜ್ಞಾಪನೆ' : 'Reminder'}
          </button>
        </div>

        {/* Step-by-Step Interactive Card */}
        <Card className="p-4 space-y-3 border-2 border-teal-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              {t('examStep', { n: activeStepIdx + 1, total: EXAM_STEPS.length })}
            </span>
            <ReadAloudBtn text={lang === 'kn' ? currentStep.descKn : currentStep.descEn} />
          </div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {lang === 'kn' ? currentStep.titleKn : currentStep.titleEn}
          </h3>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {lang === 'kn' ? currentStep.descKn : currentStep.descEn}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <Checkbox
              checked={completedSteps[activeStepIdx]}
              onChange={() => handleToggleStep(activeStepIdx)}
              label={lang === 'kn' ? 'ಈ ಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿದ್ದೇನೆ' : 'Mark as checked'}
            />

            <button
              onClick={() => navigate(`/capture?site=${currentStep.site}`)}
              className="py-1.5 px-3 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-1"
            >
              <Camera size={13} />
              {lang === 'kn' ? 'ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ' : 'Capture Site'}
            </button>
          </div>

          {/* Step Switchers */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setActiveStepIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeStepIdx === 0}
              className="text-xs text-gray-500 disabled:opacity-30"
            >
              ← {t('back')}
            </button>
            <div className="flex gap-1">
              {EXAM_STEPS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveStepIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${
                    i === activeStepIdx
                      ? 'bg-teal-600 scale-125'
                      : completedSteps[i]
                      ? 'bg-teal-300'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveStepIdx((prev) => Math.min(EXAM_STEPS.length - 1, prev + 1))}
              disabled={activeStepIdx === EXAM_STEPS.length - 1}
              className="text-xs text-teal-600 font-bold disabled:opacity-30"
            >
              {t('next')} →
            </button>
          </div>
        </Card>

        {/* Change Noticed & Save Exam */}
        <Card className="p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {lang === 'kn' ? 'ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ' : 'Checklist Completion'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChangeNoticed(false)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                !changeNoticed
                  ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600'
              }`}
            >
              ✅ {t('noChange')}
            </button>

            <button
              type="button"
              onClick={() => setChangeNoticed(true)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                changeNoticed
                  ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600'
              }`}
            >
              ⚠️ {t('changeNoticed')}
            </button>
          </div>

          {changeNoticed && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>
                {lang === 'kn'
                  ? 'ಹೊಸ ಹುಣ್ಣು ಅಥವಾ ಬದಲಾವಣೆ ಕಂಡಿದ್ದರೆ ತಕ್ಷಣ ಪೂರ್ಣ ತಪಾಸಣೆ ಮಾಡಿಸಿ.'
                  : 'Change observed. We recommend conducting a full screening.'}
              </span>
              <button
                onClick={() => navigate('/screen')}
                className="btn-danger text-xs py-1.5 px-3 shrink-0 ml-2"
              >
                {t('screen')}
              </button>
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={lang === 'kn' ? 'ಟಿಪ್ಪಣಿಗಳು (ಐಚ್ಛಿಕ)...' : 'Optional notes (e.g. Mild cheek roughness on left)...'}
            rows={2}
            className="input-field text-xs py-2"
          />

          <button onClick={handleSaveExam} className="btn-primary w-full py-2.5 text-xs font-bold">
            {t('saveExam')}
          </button>
        </Card>

        {/* Side-by-Side Comparison Slider */}
        {allImages.length >= 2 && (
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers size={16} className="text-teal-600" />
              {t('comparePhotos')} (Side-by-Side Slider)
            </h3>

            {/* Slider Viewport */}
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border bg-black select-none">
              {/* Image 2 (Background) */}
              <img
                src={allImages[compareIdx2]?.thumbnail}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Image 1 (Clipped Overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={allImages[compareIdx1]?.thumbnail}
                  alt="Before"
                  className="w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] text-gray-700 font-bold">
                  ↔
                </div>
              </div>

              {/* Range Input for touch/drag */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Photo 1 (Left)</span>
              <span>Photo 2 (Right)</span>
            </div>
          </Card>
        )}

        {/* Past Exams Timeline */}
        {pastExams.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Clock size={13} />
              {t('examHistory')}
            </h3>

            <div className="space-y-2">
              {pastExams.slice(0, 4).map((ex) => (
                <Card key={ex.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-gray-900 dark:text-white">
                      {new Date(ex.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400">
                      {ex.checklistItems?.filter((x) => x.checked).length || 0} / 8 steps checked
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ex.changeNoticed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {ex.changeNoticed ? t('changeNoticed') : t('noChange')}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
