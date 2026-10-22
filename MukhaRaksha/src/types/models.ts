// Core data models for MukhaRaksha

export type Language = 'en' | 'kn';
export type UserRole = 'health_worker' | 'individual';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type CaseStage =
  | 'screening_completed'
  | 'referral_recommended'
  | 'appointment_pending'
  | 'appointment_attended'
  | 'follow_up_recorded'
  | 'closed'
  | 'lost_to_follow_up';

export type FindingStatus = 'normal' | 'suspicious' | 'not_examined';
export type QuestionnaireAnswer = 'yes' | 'no' | 'not_sure';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  village: string;
  phone: string;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryQuestionnaire {
  tobaccoSmoking: boolean;
  tobaccoChewing: boolean;
  gutka: boolean;
  arecaNutPan: boolean;
  alcohol: boolean;
  tobaccoDurationYears?: number;
  tobaccoFrequencyPerDay?: number;
  alcoholDurationYears?: number;
  familyHistory: boolean;
  hpvOrImmuneIssues: boolean;
  poorDiet: boolean;
  previousOralLesions: boolean;
}

export interface SymptomQuestionnaire {
  nonHealingUlcer: boolean;
  nonHealingUlcerDuration?: number; // weeks
  whitePatches: boolean;
  redPatches: boolean;
  lumpOrThickening: boolean;
  painOrBurning: boolean;
  difficultyOpeningMouth: boolean;
  difficultySwallowing: boolean;
  loosTeeth: boolean;
  unexplainedBleeding: boolean;
  numbness: boolean;
  neckSwelling: boolean;
}

export interface OralSiteFinding {
  site: string;
  status: FindingStatus;
  note?: string;
}

export interface CapturedImage {
  id: string;
  patientId?: string;
  screeningId?: string;
  selfExamId?: string;
  blob: Blob;
  thumbnail: string; // base64 data URL
  timestamp: Date;
  qualityPassed: boolean;
  qualityScore?: number;
  qualityFlags?: string[];
  site?: string;
  isLowQuality?: boolean;
}

export interface Screening {
  id: string;
  patientId: string;
  patient?: Patient;
  history: HistoryQuestionnaire;
  symptoms: SymptomQuestionnaire;
  questionnaireAnswers?: Record<string, QuestionnaireAnswer>;
  oralFindings: OralSiteFinding[];
  imageIds: string[];
  riskLevel: RiskLevel;
  riskFactors: string[]; // human-readable reasons
  stage: CaseStage;
  referralFacility?: string;
  appointmentDate?: Date;
  appointmentAttended?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  outcome?: string;
  isOverdue?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvent {
  id: string;
  screeningId: string;
  stage: CaseStage;
  note: string;
  timestamp: Date;
  author?: string;
}

export interface ChildScreening {
  id: string;
  childName: string;
  caregiverName: string;
  ageMonths: number;
  ageBand?: '0-5' | '6-8' | '9-11' | '12-23' | '2-5-years';
  dietType?: 'vegetarian' | 'vegetarian-eggs' | 'mixed';
  breastfeedingStatus?: 'yes' | 'no' | 'not_applicable_unsure';
  complementaryMeals?: 'none' | '1-2' | '3' | '3-and-snacks' | 'not_applicable_unsure';
  foodVariety?: 'usually' | 'sometimes' | 'rarely';
  proteinFoods?: 'daily_regularly' | 'sometimes' | 'rarely_never';
  fruitVegetableFrequency?: 'daily' | 'sometimes' | 'rarely';
  honeyAwareness?: 'yes' | 'no' | 'not_sure';
  chokingFoodPreparation?: 'age_safe' | 'sometimes_unsafe' | 'needs_guidance';
  usualDrinks?: 'milk_water' | 'sugary_drinks' | 'other_unsure';
  foodAllergies?: 'no_known' | 'yes' | 'unsure';
  appetite?: 'no_refusal' | 'sometimes' | 'frequently';
  growthConcern?: 'no' | 'yes' | 'not_sure';
  foodGuidanceLanguage?: 'en' | 'kn' | 'hi';
  sex?: Sex;
  breastfeeding?: boolean;
  formulaFeeding?: boolean;
  bottleAtNight?: boolean;
  sugarIntake?: 'low' | 'moderate' | 'high';
  brushingHabits?: 'none' | 'once' | 'twice' | 'more';
  thumbSuckingOrPacifier?: boolean;
  mouthSores?: boolean;
  whitePatches?: boolean;
  teethingIssues?: boolean;
  tobaccoExposureAtHome?: boolean;
  notes?: string;
  createdAt: Date;
}

export interface SelfExam {
  id: string;
  userId?: string;
  patientName: string;
  imageIds: string[];
  checklistItems: { item: string; checked: boolean }[];
  changeNoticed: boolean;
  notes?: string;
  createdAt: Date;
}

export interface HabitEntry {
  id: string;
  date: string; // YYYY-MM-DD
  tobaccoUnits: number;
  arecaUnits: number;
  alcoholUnits: number;
  cravingLevel: number; // 1-10
  note?: string;
  createdAt: Date;
}

export interface QuizResult {
  id: string;
  score: number;
  total: number;
  badge?: string;
  createdAt: Date;
}

export interface AppSettings {
  language: Language;
  role: UserRole;
  darkMode: boolean;
  pinEnabled: boolean;
  pinHash?: string;
  claudeApiKey?: string;
  customVideoUrl?: string;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
}

export interface FacilityEntry {
  id: string;
  name: string;
  nameKn: string;
  type: 'hospital' | 'dental_college' | 'chc' | 'phc' | 'other';
  address: string;
  phone?: string;
  district: string;
  isGovt: boolean;
  specialties: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
