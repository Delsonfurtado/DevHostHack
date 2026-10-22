# Gram Paricharya (ಗ್ರಾಮ ಪರಿಚರ್ಯೆ)

**Community Health Screening, Child Nutrition & Referral-Tracking PWA for Karnataka, India**

A fully **client-side** Progressive Web App designed for ASHA/ANM community health workers, caregivers, clinics, and the public in Karnataka.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **A – Smart Capture Guard** | Camera capture with on-device blur/lighting/oral-content quality checks using Canvas |
| **B – Screening Pathway** | 5-step wizard: patient details → history → symptoms → oral findings → explainable results |
| **C – Referral Tracker** | 7-stage case management (Kanban + list), overdue alerts, case timeline, PDF export |
| **D – Gram Paricharya Child & Nutrition Care** | Age-banded child nutrition questionnaire and food guidance in English, Kannada and Hindi |
| **E – Learn Hub** | Animated slide explainer with Web Speech API narration, quick quiz with badges |
| **F – Self-Exam Timeline** | Monthly guided self-exam with photo comparison slider and change-noticed alerts |
| **G – Habit Coach** | Daily tobacco/areca/alcohol log, quit streaks, money saved, motivational messages |
| **Chatbot** | AI (Claude API) or built-in FAQ chatbot in English and Kannada |
| **Camp Mode** | Bulk screening at village health camps |
| **Dashboard** | Live Recharts analytics: risk distribution, referral funnel, screenings per week |

---

## 🚀 Quick Start

```bash
# 1. Navigate to the project folder
cd MukhaRaksha

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

> **Note:** For camera access, open on HTTPS or localhost. Use Chrome/Edge/Firefox for best Web Speech API support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Database | Dexie (IndexedDB) |
| Charts | Recharts |
| Icons | lucide-react |
| PDF | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa + Workbox |
| Fonts | Noto Sans + Noto Sans Kannada (Google Fonts) |
| AI | Anthropic Claude API (optional, user-provided key) |

---

## 🌐 Internationalization

- **English** and **Kannada (ಕನ್ನಡ)** — every string, questionnaire, chart label and alert
- Toggle in the header, persisted across sessions
- Web Speech API voice readout (lang `kn-IN` / `en-IN`) on key screens

---

## 📱 PWA & Offline

- Installable on Android/iOS/Desktop
- Full offline support via Workbox service worker
- All data stored locally in IndexedDB — **no data leaves the device** unless you use the AI chatbot

---

## 🔒 Privacy

- No backend, no server, no tracking
- All patient data stored only on the device
- Optional PIN lock
- Export / backup / restore as JSON or CSV

---

## 📁 Folder Structure

```
src/
├── App.tsx              # Root with React Router
├── main.tsx             # Entry point
├── index.css            # Global styles
├── context/
│   └── AppContext.tsx   # Language, role, dark mode, settings
├── db/
│   └── database.ts      # Dexie IndexedDB setup
├── types/
│   └── models.ts        # TypeScript interfaces
├── i18n/
│   └── translations.ts  # EN + KN translations
├── utils/
│   └── riskEngine.ts    # Rule-based risk scoring
├── data/
│   └── seedData.ts      # 25 sample Karnataka patients
├── components/
│   ├── Layout.tsx        # App shell + tab bar
│   └── ui.tsx            # Shared components
└── pages/
    ├── Splash.tsx
    ├── Onboarding.tsx
    ├── Home.tsx
    ├── Screening.tsx
    ├── Cases.tsx
    ├── CaseDetail.tsx
    ├── Capture.tsx       # Feature A
    ├── ChildCare.tsx     # Feature D
    ├── Learn.tsx         # Feature E
    ├── SelfExam.tsx      # Feature F
    ├── HabitCoach.tsx    # Feature G
    ├── Chat.tsx
    ├── CampMode.tsx
    ├── Dashboard.tsx
    └── More.tsx
```

---

## 🎯 Roles

| Role | Home Screen |
|------|-------------|
| **Health Worker (ASHA/ANM)** | Screening stats, overdue follow-ups, camp mode, referral tracker |
| **Individual / Patient** | Self-exam, habit coach, learn hub, nearby facilities |

Set your role in **More → Settings → My Role**.

---

## 🤖 AI Chatbot Setup (Optional)

1. Go to **More → AI Assistant**
2. Paste your [Claude API key](https://console.anthropic.com/)
3. The chatbot will now use `claude-3-haiku-20240307` for responses in English and Kannada
4. Without a key, a built-in FAQ search is available

> **Important:** The AI never diagnoses. It provides awareness information only.

---

## ⚕️ Disclaimer

> This app supports screening and awareness. **It does not diagnose cancer.** Always consult a doctor or dentist.
>
> ಈ ಅಪ್ಲಿಕೇಶನ್ ತಪಾಸಣೆ ಮತ್ತು ಜಾಗೃತಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಇದು ಕ್ಯಾನ್ಸರ್ ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ. ಯಾವಾಗಲೂ ವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಿರಿ.

---

## 📞 Resources

- **Tobacco Quit Helpline**: 1800-11-2356 (Toll-free, India)
- **Kidwai Memorial Institute of Oncology**: 080-26094000 (Bengaluru)
- **Karnataka Health Department**: [karunadu.karnataka.gov.in](https://karunadu.karnataka.gov.in)

---

*Built with ❤️ for the health workers and communities of Karnataka*
