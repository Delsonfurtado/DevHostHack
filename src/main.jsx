import React, { Suspense, lazy, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/Auth.jsx';
import RouteGuard from './shared/RouteGuard.jsx';
import { api, setSession } from './shared/api.js';
import './style.css';
import './shared/portal.css';

const ClientLayout = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.ClientLayout })),
);
const HomePage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.HomePage })),
);
const ScreenPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.ScreenPage })),
);
const PatientsPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.PatientsPage })),
);
const ReferralsPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.ReferralsPage })),
);
const LearnPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.LearnPage })),
);
const SettingsPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.SettingsPage })),
);
const LegacyPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.LegacyPage })),
);
const ClientFacilitiesPage = lazy(() =>
  import('./client/ClientPortal.jsx').then((m) => ({ default: m.ClientFacilitiesPage })),
);
const AdminLayout = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.AdminLayout })),
);
const AdminOverview = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.AdminOverview })),
);
const UsersPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.UsersPage })),
);
const FacilitiesPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.FacilitiesPage })),
);
const ReviewPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.ReviewPage })),
);
const ReportsPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.ReportsPage })),
);
const AuditPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.AuditPage })),
);
const AnnouncementPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.AnnouncementPage })),
);
const SystemSettingsPage = lazy(() =>
  import('./admin/AdminPortal.jsx').then((m) => ({ default: m.SystemSettingsPage })),
);

function Login() {
  const { user, signIn } = useAuth(),
    nav = useNavigate(),
    [form, setForm] = useState({ username: '', password: '' }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    loc = useLocation();
  if (user) return <Navigate to={user.role === 'client' ? '/app/home' : '/admin'} replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await api.login(form);
      setSession(response);
      window.location.href = response.user.force_password_change
        ? '/change-password'
        : response.user.role === 'client'
          ? '/app/home'
          : '/admin';
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <section className="login-art">
        <div className="login-mark">N</div>
        <p className="eyebrow">CARE STARTS WITH A CONVERSATION</p>
        <h1>Support the next step with clarity.</h1>
        <p>A private workspace for community health workers and service administrators.</p>
        <span className="login-orbit" aria-hidden="true">
          ✳
        </span>
        <Link to="/self-check" className="self-check-link">
          For community members: try self-check mode →
        </Link>
      </section>
      <section className="login-side">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-mark">N</span>
            <div>
              <b>Niramaya</b>
              <small>SCREENING SUPPORT</small>
            </div>
          </div>
          <p className="eyebrow">SECURE WORKSPACE</p>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your health service account.</p>
          <form onSubmit={submit}>
            <label className="field">
              Username
              <input
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button full-width" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="login-privacy">
            <b>Privacy, at a glance</b>
            <p>
              No names, phone numbers, exact addresses, or images are required here. Use assigned
              pseudonymous IDs only.
            </p>
          </div>
          <p className="persistent-disclaimer">
            Screening support only, never a diagnosis. Confirm concerns with a clinician.
          </p>
        </div>
      </section>
    </main>
  );
}
function PasswordChange() {
  const { user, setUser, signOut } = useAuth(),
    nav = useNavigate(),
    [current, setCurrent] = useState(''),
    [next, setNext] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.changePassword({ current_password: current, new_password: next });
      setUser(await api.me());
      nav(user.role === 'client' ? '/app/home' : '/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <section className="login-side">
        <div className="login-card">
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h1>Change your password</h1>
          <p>
            Set a new password before opening the service workspace. Use at least 12 characters.
          </p>
          <form onSubmit={submit}>
            <label className="field">
              Current password
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>
            <label className="field">
              New password
              <input
                type="password"
                minLength="12"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button full-width" disabled={busy}>
              {busy ? 'Saving…' : 'Save new password'}
            </button>
          </form>
          <button className="text-link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>
      <section className="login-art">
        <p className="eyebrow">SAFETY FIRST</p>
        <h1>Protect access to community health records.</h1>
        <p>
          Never share your account password or include identifying details in a pseudonymous record.
        </p>
      </section>
    </main>
  );
}
function SelfCheck() {
  const [topic, setTopic] = useState('');
  return (
    <main className="self-check-page">
      <header className="portal-top">
        <div className="portal-brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>Niramaya</strong>
            <small>COMMUNITY INFORMATION</small>
          </div>
        </div>
        <Link className="secondary-link" to="/login">
          Health worker sign in
        </Link>
      </header>
      <section className="self-check-content">
        <p className="eyebrow">PRIVATE SELF-CHECK · NO ACCOUNT</p>
        <h1>Notice a change. Ask for care.</h1>
        <p className="lead">
          This page does not save answers or send information to the server. It cannot diagnose a
          condition.
        </p>
        <div className="lesson-grid">
          <article className="panel lesson">
            <span className="lesson-icon">◉</span>
            <h2>Check your mouth</h2>
            <p>
              In good light, look for a sore, red or white patch, lump, or change that does not go
              away. A mirror check cannot confirm the cause.
            </p>
            <button
              className="secondary-button"
              onClick={() =>
                setTopic(
                  'A sore or patch lasting more than two weeks, a lump, or difficulty opening your mouth should be checked by a health worker or clinician.',
                )
              }
            >
              When should I visit the PHC?
            </button>
          </article>
          <article className="panel lesson">
            <span className="lesson-icon">✳</span>
            <h2>Think about how you feel</h2>
            <p>
              Ongoing tiredness, weakness, breathlessness, or dizziness can have many causes. An Hb
              test and clinical assessment may be needed.
            </p>
            <button
              className="secondary-button"
              onClick={() =>
                setTopic(
                  'Seek urgent help for breathlessness at rest, chest pain, fainting, or severe weakness.',
                )
              }
            >
              When is it urgent?
            </button>
          </article>
        </div>
        {topic && (
          <div className="panel notice" role="status">
            {topic}
          </div>
        )}
        <div className="privacy-note">
          <b>Data use</b>
          <p>Your choices stay on this screen only and are not stored or sent.</p>
        </div>
        <p className="persistent-disclaimer">
          Screening support only, not a diagnosis. Seek assessment from a qualified health worker.
          Thresholds and rules require local clinical review.
        </p>
      </section>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="page-loader" role="status">
              Loading workspace…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/self-check" element={<SelfCheck />} />
            <Route
              path="/change-password"
              element={
                <RouteGuard>
                  <PasswordChange />
                </RouteGuard>
              }
            />
            <Route
              path="/app"
              element={
                <RouteGuard roles={['client']}>
                  <ClientLayout />
                </RouteGuard>
              }
            >
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="screen" element={<ScreenPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="facilities" element={<ClientFacilitiesPage />} />
              <Route path="legacy" element={<LegacyPage />} />
            </Route>
            <Route
              path="/admin"
              element={
                <RouteGuard roles={['admin', 'superadmin']}>
                  <AdminLayout />
                </RouteGuard>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="facilities" element={<FacilitiesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="announcements" element={<AnnouncementPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
