import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  MessageSquare,
  FileCheck,
  User,
  MapPin,
  Phone,
  Image as ImageIcon,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, RiskBadge, StageBadge, OverdueBadge, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { Screening, Patient, CaseEvent, CaseStage, CapturedImage } from '../types/models';

const STAGES: CaseStage[] = [
  'screening_completed',
  'referral_recommended',
  'appointment_pending',
  'appointment_attended',
  'follow_up_recorded',
  'closed',
  'lost_to_follow_up',
];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useApp();

  const screening = useLiveQuery(() => (id ? db.screenings.get(id) : undefined), [id]);
  const patient = useLiveQuery(
    () => (screening?.patientId ? db.patients.get(screening.patientId) : undefined),
    [screening?.patientId]
  );
  const events = useLiveQuery(
    () => (id ? db.caseEvents.where('screeningId').equals(id).reverse().sortBy('timestamp') : []),
    [id]
  ) || [];

  const [attachedImages, setAttachedImages] = useState<CapturedImage[]>([]);
  const [selectedStage, setSelectedStage] = useState<CaseStage>('screening_completed');
  const [referralFacility, setReferralFacility] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [outcome, setOutcome] = useState('');
  const [newNote, setNewNote] = useState('');

  // Sync state when screening loads
  useEffect(() => {
    if (screening) {
      setSelectedStage(screening.stage);
      setReferralFacility(screening.referralFacility || '');
      setAppointmentDate(
        screening.appointmentDate
          ? new Date(screening.appointmentDate).toISOString().split('T')[0]
          : ''
      );
      setFollowUpDate(
        screening.followUpDate
          ? new Date(screening.followUpDate).toISOString().split('T')[0]
          : ''
      );
      setOutcome(screening.outcome || '');

      // Load attached images
      if (screening.imageIds && screening.imageIds.length > 0) {
        db.images.where('id').anyOf(screening.imageIds).toArray().then(setAttachedImages);
      }
    }
  }, [screening]);

  if (!screening || !patient) {
    return (
      <Layout title="Case Details">
        <div className="max-w-xl mx-auto p-6 text-center">
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  // Overdue calculation
  const now = Date.now();
  const createdTime = new Date(screening.createdAt).getTime();
  const daysSince = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
  const isOverdue =
    (screening.stage === 'referral_recommended' || screening.stage === 'appointment_pending') &&
    daysSince > 14 &&
    !screening.appointmentAttended;

  // Update Case
  const handleUpdateCase = async () => {
    if (!id) return;
    try {
      const stageChanged = selectedStage !== screening.stage;
      await db.screenings.update(id, {
        stage: selectedStage,
        referralFacility: referralFacility.trim() || undefined,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        outcome: outcome.trim() || undefined,
        appointmentAttended: selectedStage === 'appointment_attended' || selectedStage === 'follow_up_recorded' || selectedStage === 'closed',
        updatedAt: new Date(),
      });

      if (stageChanged) {
        await db.caseEvents.add({
          id: 'ev_' + Date.now(),
          screeningId: id,
          stage: selectedStage,
          note: `Stage updated to ${t(`stages.${selectedStage}`)}`,
          timestamp: new Date(),
          author: 'Health Worker',
        });
      }

      showToast(lang === 'kn' ? 'ಪ್ರಕರಣ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Case updated successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error updating case', 'error');
    }
  };

  // Add Note Event
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;

    try {
      await db.caseEvents.add({
        id: 'ev_' + Date.now(),
        screeningId: id,
        stage: screening.stage,
        note: newNote.trim(),
        timestamp: new Date(),
        author: 'Health Worker',
      });
      setNewNote('');
      showToast(lang === 'kn' ? 'ಟಿಪ್ಪಣಿ ಸೇರಿಸಲಾಗಿದೆ' : 'Note added to timeline', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout title={patient.name} showDisclaimer>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Navigation & Audio Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium"
          >
            <ArrowLeft size={18} />
            {t('back')}
          </button>
          <ReadAloudBtn
            text={`${patient.name}, ${patient.age} years old from ${patient.village}. Risk level: ${screening.riskLevel}. Current status: ${t(`stages.${screening.stage}`)}.`}
          />
        </div>

        {/* Patient Profile Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient.name}</h2>
                <RiskBadge level={screening.riskLevel} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <User size={13} /> {patient.age} yrs • {patient.sex}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {patient.village}
                </span>
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {patient.phone}
                  </span>
                )}
              </div>
            </div>

            <StageBadge stage={screening.stage} />
          </div>

          {isOverdue && (
            <div className="pt-2">
              <OverdueBadge days={daysSince - 14} />
            </div>
          )}

          {/* Screening Findings summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-gray-600 dark:text-gray-300">
              {t('riskFactors')}:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {screening.riskFactors.length === 0 ? (
                <span className="text-gray-400 italic">None flagged</span>
              ) : (
                screening.riskFactors.map((rf, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-medium text-[11px]"
                  >
                    {rf}
                  </span>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Attached Photos */}
        {attachedImages.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <ImageIcon size={14} />
              {lang === 'kn' ? 'ಲಗತ್ತಿಸಲಾದ ಚಿತ್ರಗಳು' : 'Screening Photos'} ({attachedImages.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border">
                  <img src={img.thumbnail} alt="Site" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {img.site || 'Mouth'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Referral & Follow-up Management Form */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={16} className="text-teal-600" />
            {t('updateStage')} & Referral Tracking
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {t('stage')}
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as CaseStage)}
                className="input-field text-sm"
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {t(`stages.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {t('referralFacility')}
              </label>
              <input
                type="text"
                value={referralFacility}
                onChange={(e) => setReferralFacility(e.target.value)}
                placeholder="e.g. Kidwai Memorial Institute of Oncology"
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('appointmentDate')}
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {t('followUpDate')}
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {t('outcome')} / Clinical Notes
              </label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
                placeholder="e.g. Biopsy performed at Kidwai. Benign leukoplakia. Recommended cessation support."
                className="input-field text-sm"
              />
            </div>

            <button onClick={handleUpdateCase} className="btn-primary w-full text-sm py-2.5">
              {t('save')} Updates
            </button>
          </div>
        </Card>

        {/* Timeline of Events */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-teal-600" />
            {t('caseTimeline')}
          </h3>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
            {events.length === 0 ? (
              <p className="text-xs text-gray-400 pl-8">No logged events yet.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="relative flex items-start gap-3 pl-1">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 z-10 text-[10px]">
                    ✓
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <StageBadge stage={ev.stage} />
                      <span className="text-[10px] text-gray-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200">{ev.note}</p>
                    {ev.author && (
                      <span className="text-[10px] text-gray-400 block">— {ev.author}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Note Input */}
          <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={lang === 'kn' ? 'ಹೊಸ ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ...' : 'Add a quick timeline note...'}
              className="input-field text-xs py-2 flex-1"
            />
            <button type="submit" className="btn-primary py-2 px-3 text-xs flex items-center gap-1">
              <Send size={14} />
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
