import Dexie, { type Table } from 'dexie';
import type {
  Patient,
  Screening,
  CapturedImage,
  CaseEvent,
  ChildScreening,
  SelfExam,
  HabitEntry,
  QuizResult,
  FacilityEntry,
  ChatMessage,
} from '../types/models';

export class MukhaRakshaDB extends Dexie {
  patients!: Table<Patient>;
  screenings!: Table<Screening>;
  images!: Table<CapturedImage>;
  caseEvents!: Table<CaseEvent>;
  childScreenings!: Table<ChildScreening>;
  selfExams!: Table<SelfExam>;
  habitEntries!: Table<HabitEntry>;
  quizResults!: Table<QuizResult>;
  facilities!: Table<FacilityEntry>;
  chatMessages!: Table<ChatMessage>;

  constructor() {
    super('MukhaRakshaDB');
    this.version(1).stores({
      patients: 'id, name, village, createdAt',
      screenings: 'id, patientId, riskLevel, stage, createdAt, updatedAt',
      images: 'id, patientId, screeningId, selfExamId, timestamp',
      caseEvents: 'id, screeningId, timestamp',
      childScreenings: 'id, caregiverName, createdAt',
      selfExams: 'id, userId, createdAt',
      habitEntries: 'id, date, createdAt',
      quizResults: 'id, createdAt',
      facilities: 'id, type, district',
      chatMessages: 'id, timestamp',
    });
  }
}

export const db = new MukhaRakshaDB();

// Seed default facilities
export async function seedFacilities() {
  const count = await db.facilities.count();
  if (count === 0) {
    const facilities: FacilityEntry[] = [
      {
        id: 'f1',
        name: 'Kidwai Memorial Institute of Oncology',
        nameKn: 'ಕಿಡ್ವಾಯ್ ಸ್ಮಾರಕ ಆಂಕೊಲಜಿ ಸಂಸ್ಥೆ',
        type: 'hospital',
        address: 'Dr M H Marigowda Road, Bengaluru - 560029',
        phone: '080-26094000',
        district: 'Bengaluru Urban',
        isGovt: true,
        specialties: ['oncology', 'oral_cancer', 'surgery', 'radiation'],
      },
      {
        id: 'f2',
        name: 'Rajiv Gandhi Institute of Chest Diseases',
        nameKn: 'ರಾಜೀವ್ ಗಾಂಧಿ ಎದೆ ರೋಗಗಳ ಸಂಸ್ಥೆ',
        type: 'hospital',
        address: 'Hosur Road, Bengaluru - 560029',
        phone: '080-26637012',
        district: 'Bengaluru Urban',
        isGovt: true,
        specialties: ['oncology'],
      },
      {
        id: 'f3',
        name: 'Government Dental College and Research Institute',
        nameKn: 'ಸರ್ಕಾರಿ ದಂತ ವೈದ್ಯ ಮಹಾವಿದ್ಯಾಲಯ ಮತ್ತು ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ',
        type: 'dental_college',
        address: 'Fort, Bengaluru - 560002',
        phone: '080-22261898',
        district: 'Bengaluru Urban',
        isGovt: true,
        specialties: ['dentistry', 'oral_surgery', 'oral_medicine'],
      },
      {
        id: 'f4',
        name: 'Dharwad District Hospital',
        nameKn: 'ಧಾರವಾಡ ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ',
        type: 'hospital',
        address: 'Dharwad - 580008',
        phone: '0836-2447100',
        district: 'Dharwad',
        isGovt: true,
        specialties: ['oncology', 'surgery'],
      },
      {
        id: 'f5',
        name: 'Mysore Medical College and Research Institute',
        nameKn: 'ಮೈಸೂರು ವೈದ್ಯಕೀಯ ಮಹಾವಿದ್ಯಾಲಯ',
        type: 'hospital',
        address: 'Irwin Road, Mysuru - 570001',
        phone: '0821-2523901',
        district: 'Mysuru',
        isGovt: true,
        specialties: ['oncology', 'oral_surgery'],
      },
    ];
    await db.facilities.bulkAdd(facilities);
  }
}
