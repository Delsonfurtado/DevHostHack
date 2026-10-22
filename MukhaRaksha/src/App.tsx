import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ui';

// Lazy load pages
const Splash = lazy(() => import('./pages/Splash'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const Screening = lazy(() => import('./pages/Screening'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Capture = lazy(() => import('./pages/Capture'));
const Learn = lazy(() => import('./pages/Learn'));
const SelfExam = lazy(() => import('./pages/SelfExam'));
const HabitCoach = lazy(() => import('./pages/HabitCoach'));
const ChildCare = lazy(() => import('./pages/ChildCare'));
const More = lazy(() => import('./pages/More'));
const Chat = lazy(() => import('./pages/Chat'));
const CampMode = lazy(() => import('./pages/CampMode'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center animate-pulse">
          <span className="text-white text-xl font-bold">ಮ</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { settings } = useApp();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Home />} />
        <Route path="/screen" element={<Screening />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/self-exam" element={<SelfExam />} />
        <Route path="/habit-coach" element={<HabitCoach />} />
        <Route path="/child-care" element={<ChildCare />} />
        <Route path="/more" element={<More />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/camp" element={<CampMode />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
