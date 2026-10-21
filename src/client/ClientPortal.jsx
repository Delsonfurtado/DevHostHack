import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../shared/api.js';
import {
  pendingScreenings,
  removeSynced,
  queueScreening,
  clearOfflineData,
} from '../shared/offlineQueue.js';
import { tFor } from '../shared/i18n.js';
import { useAuth } from '../shared/Auth.jsx';
import { triageOral } from '../oralTriage.js';
import LegacyComponent from './LegacyScreen.jsx';
import { QRCodeSVG } from 'qrcode.react';

const tabs = [
  ['/app/home', 'home', '⌂'],
  ['/app/screen', 'screen', '＋'],
  ['/app/patients', 'patients', '◉'],
  ['/app/referrals', 'referrals', '↗'],
  ['/app/learn', 'learn', '✳'],
];
export function ClientLayout() {
  const { user, signOut } = useAuth(),
    [dark, setDark] = useState(localStorage.getItem('niramaya.theme') === 'dark'),
    [lang, setLang] = useState(localStorage.getItem('niramaya.language') || 'en'),
    [pending, setPending] = useState(0),
    [lastSync, setLastSync] = useState(localStorage.getItem('niramaya.lastSync') || ''),
    [syncing, setSyncing] = useState(false),
    [err, setErr] = useState(''),
    loc = useLocation(),
    navigate = useNavigate(),
    t = (k) => tFor(lang, k);
  async function refreshQueue() {
    try {
      setPending((await pendingScreenings()).length);
    } catch {
      setPending(0);
    }
  }
  useEffect(() => {
    refreshQueue();
  }, [loc.pathname]);
  async function sync() {
    setSyncing(true);
    setErr('');
    try {
      const rows = await pendingScreenings();
      if (!rows.length) {
        setPending(0);
        return;
      }
      const result = await api.post('/api/sync', { records: rows });
      await removeSynced(result.accepted.map((x) => x.client_key));
      const time = new Date(result.synced_at * 1000).toISOString();
      localStorage.setItem('niramaya.lastSync', time);
      setLastSync(time);
      await refreshQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSyncing(false);
    }
  }
  useEffect(() => {
    const fn = () => {
      if (navigator.onLine) sync();
    };
    window.addEventListener('online', fn);
    return () => window.removeEventListener('online', fn);
  }, []);
  useEffect(() => {
    localStorage.setItem('niramaya.language', lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('niramaya.theme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <div className="portal client-portal" data-theme={dark ? 'dark' : 'light'}>
      <header className="portal-top">
        <div className="portal-brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>Niramaya</strong>
            <small>COMMUNITY SCREENING SUPPORT</small>
          </div>
        </div>
        <div className="portal-tools">
          <span className="demo-badge">{t('demo')}</span>
          <label className="language-switch">
            <span className="sr-only">Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </label>
          <button
            className="quiet-button"
            onClick={() => setDark((x) => !x)}
            aria-label={dark ? 'Use light theme' : 'Use dark theme'}
          >
            {dark ? 'Light' : 'Dark'}
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            {t('logout')}
          </button>
        </div>
      </header>
      <div className="sync-strip" role="status">
        <span className={navigator.onLine ? 'status-dot online' : 'status-dot'}></span>
        {navigator.onLine ? t('synced') : 'Offline'} ·{' '}
        {pending ? `${t('pending')}: ${pending}` : t('synced')}
        <span className="sync-last">
          {t('lastSync')}: {lastSync ? new Date(lastSync).toLocaleString() : '—'}
        </span>
        {pending > 0 && (
          <button onClick={sync} disabled={syncing}>
            {syncing ? '…' : t('sync')}
          </button>
        )}
      </div>
      {err && (
        <div className="toast error-toast" role="alert">
          {err}
        </div>
      )}
      <div className="client-frame">
        <aside className="client-sidebar">
          <p className="nav-caption">WORKSPACE</p>
          {tabs.map(([path, key, icon]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span aria-hidden="true">{icon}</span>
              {t(key)}
            </NavLink>
          ))}
          <NavLink
            to="/app/settings"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            ⚙ {t('settings')}
          </NavLink>
          <div className="worker-card">
            <span className="avatar">{user?.username?.slice(0, 1)?.toUpperCase() || 'H'}</span>
            <div>
              <b>{user?.username}</b>
              <small>Health worker · {user?.village_id || 'assigned PHC'}</small>
            </div>
          </div>
        </aside>
        <main className="portal-main">
          <Outlet context={{ lang, t, user, refreshQueue, setLang, dark, setDark }} />
        </main>
      </div>
      <nav className="mobile-tabs" aria-label="Client navigation">
        {tabs.map(([path, key, icon]) => (
          <NavLink
            key={path}
            to={path}
            aria-label={t(key)}
            className={({ isActive }) => (isActive ? 'mobile-tab active' : 'mobile-tab')}
          >
            <span aria-hidden="true">{icon}</span>
            <small>{t(key)}</small>
          </NavLink>
        ))}
      </nav>
      <footer className="persistent-disclaimer">
        {t('disclaimer')} <span>{t('clinicalReview')}</span>
      </footer>
    </div>
  );
}

function useClientData(path, key) {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    api
      .get(path)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [path]);
  return { data, error, reload: () => api.get(path).then(setData) };
}
export function HomePage() {
  const { data, error } = useClientData('/api/client/home', 'home'),
    { pending } = useQueueCount();
  const nav = useNavigate();
  return (
    <section>
      <p className="eyebrow">TODAY · COMMUNITY HEALTH</p>
      <h1>Good day, health worker</h1>
      <p className="lead">A calm, consent-first place to plan the next step with each person.</p>
      {error && <p className="notice">{error}</p>}
      <div className="stats-grid">
        <Stat label="Screenings today" value={data?.today_screenings ?? '—'} icon="◉" />
        <Stat label="Referrals to follow" value={data?.pending_referrals ?? '—'} icon="↗" />
        <Stat label="Follow-ups due" value={data?.follow_ups_due ?? '—'} icon="◷" />
        <Stat label="Waiting to sync" value={pending} icon="↻" />
      </div>
      <div className="home-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">QUICK START</p>
              <h2>What would you like to do?</h2>
            </div>
          </div>
          <div className="quick-actions">
            <button className="quick-card" onClick={() => nav('/app/screen?kind=anaemia')}>
              <span className="quick-icon peach">＋</span>
              <b>New anaemia screening</b>
              <small>Consent first · no photo upload</small>
            </button>
            <button className="quick-card" onClick={() => nav('/app/screen?kind=oral')}>
              <span className="quick-icon mint">◉</span>
              <b>New oral screening</b>
              <small>Rule-based triage guidance</small>
            </button>
          </div>
        </section>
        <section className="panel tip-panel">
          <p className="eyebrow">TODAY’S HEALTH TIP</p>
          <span className="tip-illustration" aria-hidden="true">
            ✳
          </span>
          <h2>Make room for questions</h2>
          <p>
            Invite the person to describe what matters to them. A screening aid does not replace
            clinical assessment.
          </p>
          <button className="text-link" onClick={() => nav('/app/learn')}>
            Explore learning cards →
          </button>
        </section>
        <section className="panel todo-panel">
          <p className="eyebrow">MY TO-DO TODAY</p>
          <h2>Follow up with care</h2>
          <p>
            When referrals or follow-ups are saved, they’ll appear here. Use the pending-sync
            indicator before leaving an offline area.
          </p>
          <button className="secondary-button" onClick={() => nav('/app/referrals')}>
            Open referral tracker
          </button>
          <NavLink className="secondary-link" to="/app/facilities">
            Nearby PHCs and referral centres
          </NavLink>
        </section>
      </div>
      <AnnouncementFeed />
      <FollowUpPanel />
    </section>
  );
}
function useQueueCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    pendingScreenings()
      .then((x) => setCount(x.length))
      .catch(() => {});
  }, []);
  return { pending: count };
}
function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
    </div>
  );
}
function AnnouncementFeed() {
  const { data, error, reload } = useClientData('/api/client/announcements');
  async function mark(id) {
    try {
      await api.post(`/api/client/announcements/${id}/read`, {});
      await reload();
    } catch {}
  }
  return (
    <section className="panel announcement-feed">
      <p className="eyebrow">FROM YOUR PHC</p>
      <h2>Announcements</h2>
      {error ? (
        <p className="muted">Announcements are unavailable while offline.</p>
      ) : data?.announcements?.length ? (
        data.announcements.map((a) => (
          <article className="feed-item" key={a.id}>
            <div>
              <b>{a.title}</b>
              <p>{a.body}</p>
              <small>{new Date(a.created * 1000).toLocaleDateString()}</small>
            </div>
            <button
              className="table-action"
              disabled={Boolean(a.is_read)}
              onClick={() => mark(a.id)}
            >
              {a.is_read ? 'Read' : 'Mark read'}
            </button>
          </article>
        ))
      ) : (
        <p className="muted">No current announcements.</p>
      )}
    </section>
  );
}
function FollowUpPanel() {
  const { data, error } = useClientData('/api/client/follow-ups');
  const rows = data?.follow_ups || [];
  useEffect(() => {
    if (
      !rows.length ||
      localStorage.getItem('niramaya.notifications.enabled') !== 'true' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    )
      return;
    const due = rows.filter(
      (x) => x.status === 'due' && x.due_date <= new Date().toISOString().slice(0, 10),
    );
    if (due.length) {
      if (navigator.serviceWorker?.controller)
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification('Niramaya follow-up reminder', {
            body: `${due.length} follow-up(s) are due. Open the app to review.`,
          }),
        );
      else
        new Notification('Niramaya follow-up reminder', {
          body: `${due.length} follow-up(s) are due.`,
        });
    }
  }, [data]);
  return (
    <section className="panel followup-panel">
      <p className="eyebrow">MY TO-DO TODAY</p>
      <h2>Follow-ups</h2>
      {error ? (
        <p className="muted">Follow-up list is not available.</p>
      ) : rows.filter((x) => x.status === 'due').length ? (
        rows
          .filter((x) => x.status === 'due')
          .slice(0, 5)
          .map((x) => (
            <div className="feed-item" key={x.id}>
              <span className="followup-dot" />
              <div>
                <b>{x.patient_id}</b>
                <p>
                  Due {x.due_date} · {x.note || 'Check in with the person'}
                </p>
              </div>
            </div>
          ))
      ) : (
        <p className="muted">No follow-ups due. Review assigned referrals regularly.</p>
      )}
    </section>
  );
}

export function ScreenPage() {
  const { t, user, refreshQueue } = useOutletContext(),
    loc = useLocation(),
    params = new URLSearchParams(loc.search),
    [step, setStep] = useState(1),
    [kind, setKind] = useState(params.get('kind') || 'anaemia'),
    [pid, setPid] = useState(''),
    [age, setAge] = useState('adult'),
    [sex, setSex] = useState('not recorded'),
    [consent, setConsent] = useState(false),
    [finding, setFinding] = useState(''),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(''),
    [draftMsg, setDraftMsg] = useState('');
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('niramaya.screeningDraft') || 'null');
      if (d) {
        setStep(d.step || 1);
        setKind(d.kind || 'anaemia');
        setPid(d.pid || '');
        setAge(d.age || 'adult');
        setSex(d.sex || 'not recorded');
        setConsent(Boolean(d.consent));
        setFinding(d.finding || '');
      }
    } catch {}
  }, []);
  function saveDraft() {
    localStorage.setItem(
      'niramaya.screeningDraft',
      JSON.stringify({ step, kind, pid, age, sex, consent, finding, saved_at: Date.now() }),
    );
    setDraftMsg('Draft saved on this device. It has not been sent to the server.');
  }
  async function submit() {
    setError('');
    if (!consent) {
      setError('Please record consent before continuing.');
      return;
    }
    if (!pid.trim()) {
      setError('Enter a pseudonymous ID for this person.');
      return;
    }
    try {
      const clinical =
        kind === 'oral'
          ? triageOral({ consent, findings: finding ? [{ type: finding }] : [] })
          : null;
      const triage = clinical?.category || 'demo';
      const row = {
        client_key: crypto.randomUUID(),
        patient_id: pid.trim(),
        village_id: user?.village_id || 'demo-village-1',
        age_band: age,
        sex,
        kind,
        consent,
        payload: { demo_data: true, screening_type: kind, oral_triage: clinical || undefined },
        triage,
      };
      if (navigator.onLine) {
        try {
          await api.post('/api/sync', { records: [row] });
          setSaved(true);
        } catch (e) {
          if (e.status && e.status < 500) throw e;
          await queueScreening(row);
          setSaved(true);
        }
      } else {
        await queueScreening(row);
        setSaved(true);
      }
      localStorage.removeItem('niramaya.screeningDraft');
      await refreshQueue();
    } catch (e) {
      setError(e.message);
    }
  }
  if (saved)
    return (
      <section className="panel success-panel">
        <span className="success-mark">✓</span>
        <p className="eyebrow">SCREENING SAVED</p>
        <h1>Next step recorded</h1>
        <p>
          This pseudonymous record is stored. If you were offline, it will sync when a connection
          returns.
        </p>
        <button
          className="primary-button"
          onClick={() => {
            setSaved(false);
            setConsent(false);
            setPid('');
            setFinding('');
            setStep(1);
          }}
        >
          Start another screening
        </button>
      </section>
    );
  return (
    <section className="wizard-wrap">
      <p className="eyebrow">GUIDED WORKFLOW · {step} OF 2</p>
      <h1>Start a screening</h1>
      <p className="lead">Ask permission first. You can save a draft on this device at any step.</p>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`Step ${step} of 2`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={step * 50}
      >
        <span style={{ width: `${step * 50}%` }} />
      </div>
      <div className="panel wizard-panel">
        {step === 1 ? (
          <>
            <h2>Consent and screening type</h2>
            <p className="muted">
              Explain what will be recorded and that the screening is not a diagnosis.
            </p>
            <label className="field">
              Screening type
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="anaemia">Anaemia support (demo flow)</option>
                <option value="oral">Oral screening (rule-based)</option>
              </select>
            </label>
            <label className="consent-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t('consent')}</span>
            </label>
            <div className="privacy-note">
              <b>{t('privacy')}</b>
              <p>
                {t('anonymous')} Records are encrypted in transit when deployed over HTTPS and are
                visible to assigned service roles.
              </p>
            </div>
            <div className="wizard-actions">
              <button className="secondary-button" onClick={saveDraft}>
                Save draft locally
              </button>
              <button className="primary-button" disabled={!consent} onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Minimal record details</h2>
            <label className="field">
              {t('patientId')}
              <input
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                placeholder="e.g. V1-0042"
                autoComplete="off"
              />
              <small>
                Use a locally assigned code. Do not enter a name, phone number, or address.
              </small>
            </label>
            <div className="field-row">
              <label className="field">
                {t('ageBand')}
                <select value={age} onChange={(e) => setAge(e.target.value)}>
                  <option value="child_6_59m">Child 6–59 months</option>
                  <option value="child_5_11y">Child 5–11 years</option>
                  <option value="age_12_14">12–14 years</option>
                  <option value="adult">Adult</option>
                  <option value="older_adult">Older adult</option>
                </select>
              </label>
              <label className="field">
                {t('sex')}
                <select value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option>not recorded</option>
                  <option>woman</option>
                  <option>man</option>
                  <option>another / prefer not to say</option>
                </select>
              </label>
            </div>
            {kind === 'oral' && (
              <label className="field">
                Observed finding
                <select value={finding} onChange={(e) => setFinding(e.target.value)}>
                  <option value="">No finding selected</option>
                  <option value="ulcer">Ulcer</option>
                  <option value="red">Red patch</option>
                  <option value="white">White patch</option>
                  <option value="lump">Lump or growth</option>
                  <option value="node">Neck node</option>
                </select>
              </label>
            )}
            <div className="warning-note">
              {kind === 'anaemia'
                ? 'Anaemia result remains illustrative; this workflow does not calculate Hb.'
                : 'Rule-based triage is demonstrative; refer concerning findings for clinical assessment.'}{' '}
              Thresholds and rules require review against current guidance.
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <p className="muted" role="status">
              {draftMsg}
            </p>
            <div className="wizard-actions">
              <button className="secondary-button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="secondary-button" onClick={saveDraft}>
                Save draft locally
              </button>
              <button className="primary-button" onClick={submit}>
                {t('submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
export function PatientsPage() {
  const { data, error } = useClientData('/api/client/patients'),
    [query, setQuery] = useState(''),
    [profile, setProfile] = useState(null),
    [profileError, setProfileError] = useState('');
  const rows = (data?.patients || []).filter((p) =>
    `${p.id} ${p.village_id}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function open(id) {
    try {
      setProfile(await api.get(`/api/client/patients/${encodeURIComponent(id)}`));
      setProfileError('');
    } catch (e) {
      setProfileError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">PEOPLE ? PSEUDONYMOUS</p>
      <h1>Patients</h1>
      <p className="lead">Only minimal coded details are held in this prototype.</p>
      <label className="search-field">
        <span>Search ID or village</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search records"
        />
      </label>
      {error ? (
        <p className="notice">{error}</p>
      ) : rows.length ? (
        <div className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Village</th>
                <th>Age band</th>
                <th>Screenings</th>
                <th>Last screening</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.village_id}</td>
                  <td>{p.age_band}</td>
                  <td>{p.screenings}</td>
                  <td>
                    {p.last_screening
                      ? new Date(p.last_screening * 1000).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <button className="table-action" onClick={() => open(p.id)}>
                      View timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No synced patient records yet"
          body="Records will appear here after your first screening syncs."
        />
      )}
      {profileError && <p className="notice">{profileError}</p>}
      {profile && (
        <section className="panel patient-profile">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PSEUDONYMOUS PROFILE</p>
              <h2>{profile.patient.id}</h2>
            </div>
            <button className="table-action" onClick={() => setProfile(null)}>
              Close
            </button>
          </div>
          <p>
            {profile.patient.village_id} ? {profile.patient.age_band} ? {profile.patient.sex}
          </p>
          <h3>Screening timeline</h3>
          {profile.screenings.map((row) => (
            <div className="feed-item" key={row.id}>
              <span>
                {row.kind} ? {row.triage}
              </span>
              <small>{new Date(row.created * 1000).toLocaleString()}</small>
            </div>
          ))}
          <h3>Referral history</h3>
          {profile.referrals.length ? (
            profile.referrals.map((r) => (
              <div className="feed-item" key={r.id}>
                <span>
                  {r.status} ? {r.facility || 'Facility not assigned'}
                </span>
                <small>{r.due_date || 'No due date'}</small>
              </div>
            ))
          ) : (
            <p className="muted">No referral history.</p>
          )}
          <h3>Follow-ups</h3>
          {profile.follow_ups.map((f) => (
            <div className="feed-item" key={f.id}>
              <span>
                {f.status}: {f.note || 'Check in'}
              </span>
              <small>{f.due_date}</small>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
export function ReferralsPage() {
  const { data, error } = useClientData('/api/client/referrals');
  return (
    <section>
      <p className="eyebrow">CONTINUITY OF CARE</p>
      <h1>Referral tracker</h1>
      <p className="lead">Follow issued referrals and record a clear next step.</p>
      {error ? (
        <p className="notice">{error}</p>
      ) : data?.referrals?.length ? (
        <div className="record-list">
          {data.referrals.map((r) => {
            const note = `Niramaya referral ${r.id}. Pseudonymous code ${r.patient_id}. Screening type ${r.kind}. Please assess clinically.`;
            return (
              <article className="panel referral-card" key={r.id}>
                <div className="referral-row">
                  <span className="triage-icon" aria-hidden="true">
                    ↗
                  </span>
                  <div>
                    <b>{r.patient_id}</b>
                    <p>
                      {r.kind} · {r.village_id}
                    </p>
                    {r.facility && <p>{r.facility}</p>}
                  </div>
                  <span className="status-pill">{r.status}</span>
                </div>
                <div className="referral-tools">
                  <QRCodeSVG
                    value={note}
                    size={74}
                    level="M"
                    aria-label={`QR referral note ${r.id}`}
                  />
                  <div>
                    <button
                      className="table-action"
                      onClick={() => navigator.clipboard?.writeText(note)}
                    >
                      Copy referral note
                    </button>{' '}
                    <button
                      className="table-action"
                      onClick={() => speechSynthesis?.speak(new SpeechSynthesisUtterance(note))}
                    >
                      Read aloud
                    </button>{' '}
                    <button className="table-action" onClick={() => window.print()}>
                      Print slip
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No referrals waiting"
          body="When a saved triage requires referral, it will be listed here."
        />
      )}
    </section>
  );
}
export function ClientFacilitiesPage() {
  const { data, error } = useClientData('/api/client/facilities');
  return (
    <section>
      <p className="eyebrow">LOCAL SERVICE DIRECTORY · DEMO DATA</p>
      <h1>Nearby health facilities</h1>
      <p className="lead">
        Confirm contact details and availability with the PHC before sharing them with a patient.
      </p>
      {error ? (
        <p className="notice">{error}</p>
      ) : (
        <div className="lesson-grid">
          {(data?.facilities || []).map((f) => (
            <article className="panel lesson" key={f.id}>
              <p className="eyebrow">
                {f.type} {f.demo ? '· DEMO' : ''}
              </p>
              <h2>{f.name}</h2>
              <p>{f.village_id || 'All assigned villages'}</p>
              <p>{f.contact || 'Contact not listed'}</p>
              {f.contact && !f.demo && (
                <a className="secondary-link" href={`tel:${f.contact}`}>
                  Call facility
                </a>
              )}
              {f.directions_url && (
                <a
                  className="secondary-link"
                  href={f.directions_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions ↗
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
const lessons = [
  [
    'Food that supports health',
    'Include iron-rich foods such as pulses, leafy greens, and locally available options. A clinician can advise on testing and treatment.',
    '🥬',
  ],
  [
    'IFA tablets',
    'Take iron and folic acid supplements only according to local health-worker or clinician guidance.',
    '✳',
  ],
  [
    'Oral self-check',
    'Look for persistent sores, patches, lumps, or difficulty opening the mouth. A self-check cannot diagnose disease.',
    '◉',
  ],
  [
    'Tobacco and areca',
    'Stopping tobacco and areca use lowers exposure to known oral health risks. Ask a health worker about support.',
    '🌿',
  ],
  [
    'When to seek care',
    'Breathlessness at rest, chest pain, fainting, or a persistent oral lesion needs prompt clinical assessment.',
    '＋',
  ],
];
export function LearnPage() {
  const [answer, setAnswer] = useState('');
  return (
    <section>
      <p className="eyebrow">LEARN · COMMUNITY EDUCATION</p>
      <h1>Small steps, useful knowledge</h1>
      <p className="lead">
        Short, plain-language reminders for a conversation with a qualified health worker.
      </p>
      <div className="lesson-grid">
        {lessons.map(([title, body, icon]) => (
          <article className="panel lesson" key={title}>
            <span className="lesson-icon" aria-hidden="true">
              {icon}
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
            <button
              className="text-link"
              onClick={() =>
                speechSynthesis?.speak(new SpeechSynthesisUtterance(`${title}. ${body}`))
              }
            >
              ▶ Read aloud
            </button>
          </article>
        ))}
      </div>
      <div className="panel quiz">
        <h2>Quick check</h2>
        <p>Can an oral self-check confirm cancer?</p>
        <button
          className="secondary-button"
          onClick={() =>
            setAnswer('No. It can help notice a change, but a clinician must assess it.')
          }
        >
          Show answer
        </button>
        {answer && <p role="status">{answer}</p>}
      </div>
    </section>
  );
}
export function SettingsPage() {
  const { lang, t, setLang, user, refreshQueue } = useOutletContext();
  const [msg, setMsg] = useState(''),
    [notifications, setNotifications] = useState(
      localStorage.getItem('niramaya.notifications.enabled') === 'true',
    ),
    [confirmImport, setConfirmImport] = useState(false);
  async function clearLocal() {
    if (!confirm('Clear locally queued screenings and this browser legacy demo log?')) return;
    await clearOfflineData();
    localStorage.removeItem('niramaya.logs');
    localStorage.removeItem('niramaya.oralLogs');
    setMsg('Local records cleared from this device. Synced server records are unchanged.');
  }
  async function enableNotifications() {
    if (!('Notification' in window)) {
      setMsg('This browser does not support local notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotifications(enabled);
    localStorage.setItem('niramaya.notifications.enabled', String(enabled));
    setMsg(
      enabled
        ? 'Local follow-up reminders enabled.'
        : 'Notifications were not enabled. In-app reminders remain available.',
    );
  }
  async function importLegacy() {
    try {
      const anaemia = JSON.parse(localStorage.getItem('niramaya.logs') || '[]'),
        oral = JSON.parse(localStorage.getItem('niramaya.oralLogs') || '[]');
      const eligible = [
        ...anaemia.filter((x) => x.consent === true).map((x) => ({ row: x, kind: 'anaemia' })),
        ...oral.filter((x) => x.consent === true).map((x) => ({ row: x, kind: 'oral' })),
      ];
      if (!eligible.length) {
        setMsg(
          'No legacy rows with an explicit consent record are eligible. The old log was kept unchanged.',
        );
        return;
      }
      const records = eligible.map(({ row: x, kind }) => ({
        client_key: crypto.randomUUID(),
        patient_id: `legacy-${crypto.randomUUID()}`,
        village_id: user?.village_id,
        age_band: x.ageBand || x.group_key || 'unknown',
        sex: x.sex || 'not recorded',
        kind,
        consent: true,
        payload: {
          demo_data: true,
          screening_type: kind,
          ...(kind === 'oral'
            ? { oral_triage: { rules: x.rules || [] }, findings: [], symptoms: [] }
            : {}),
        },
        triage: kind === 'oral' ? x.category || 'routine' : 'demo',
      }));
      if (!user?.village_id) {
        setMsg('Your account has no assigned village. Ask an administrator before import.');
        return;
      }
      try {
        await api.post('/api/sync', { records });
      } catch (e) {
        if (e.status && e.status < 500) throw e;
        for (const row of records) await queueScreening(row);
      }
      localStorage.setItem('niramaya.legacyImported', 'true');
      localStorage.removeItem('niramaya.logs');
      localStorage.removeItem('niramaya.oralLogs');
      setConfirmImport(false);
      await refreshQueue();
      setMsg(
        `${records.length} eligible demo row(s) imported. Original measurements were not carried over.`,
      );
    } catch (e) {
      setMsg(e.message);
    }
  }
  let oldCount = 0,
    eligibleCount = 0;
  try {
    const old = JSON.parse(localStorage.getItem('niramaya.logs') || '[]');
    oldCount = old.length;
    eligibleCount = old.filter((x) => x.consent === true).length;
  } catch {}
  return (
    <section>
      <p className="eyebrow">PREFERENCES</p>
      <h1>Settings and help</h1>
      <div className="settings-grid">
        <div className="panel">
          <h2>Language</h2>
          <label className="field">
            <span>Interface language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
          </label>
          <p className="muted">{t('clinicalReview')}</p>
        </div>
        <div className="panel">
          <h2>Appearance</h2>
          <label className="field">
            <span>Theme</span>
            <select
              value={dark ? 'dark' : 'light'}
              onChange={(e) => setDark(e.target.value === 'dark')}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <div className="panel">
          <h2>Follow-up reminders</h2>
          <p>Reminders are local to this device and only appear when you open the app.</p>
          <button className="secondary-button" onClick={enableNotifications}>
            {notifications ? 'Notifications enabled' : 'Enable local reminders'}
          </button>
        </div>
        <div className="panel">
          <h2>One-time legacy import</h2>
          <p>
            {oldCount} old browser row(s) found. Import is limited to rows carrying an explicit
            consent record. Old fixed sample values are discarded and imported as demo records.
          </p>
          <button
            className="secondary-button"
            disabled={!eligibleCount || localStorage.getItem('niramaya.legacyImported') === 'true'}
            onClick={() => setConfirmImport(true)}
          >
            Review eligible import ({eligibleCount})
          </button>
          {confirmImport && (
            <div className="privacy-note">
              <p>
                Confirm that you are authorized to import these records and that each has a
                documented consent record. Unsynced imports will stay on this device until sync.
              </p>
              <button className="primary-button" onClick={importLegacy}>
                Import consented rows
              </button>
            </div>
          )}
        </div>
        <div className="panel">
          <h2>Local data</h2>
          <p>
            Offline queue is stored in this browser IndexedDB. Clearing site data removes unsynced
            items.
          </p>
          <button className="secondary-button" onClick={clearLocal}>
            Clear local data
          </button>
          {msg && <p role="status">{msg}</p>}
        </div>
        <div className="panel">
          <h2>Privacy and help</h2>
          <p>
            {t('anonymous')} Never enter real names or contact details. Contact your PHC supervisor
            for access or clinical questions.
          </p>
          <button className="secondary-button" onClick={() => window.print()}>
            Print help sheet
          </button>
        </div>
        <div className="panel">
          <h2>Existing prototype flow</h2>
          <p>
            Open the original sample screens. Results there remain fictional and are not connected
            to this patient record.
          </p>
          <NavLink className="secondary-link" to="/app/legacy">
            Open demo screens
          </NavLink>
        </div>
      </div>
    </section>
  );
}
export function LegacyPage() {
  return (
    <section className="legacy-shell">
      <p className="warning-note">
        Legacy demo screens. They remain illustrative and do not create a server screening result.
      </p>
      <LegacyComponent />
    </section>
  );
}
function Empty({ title, body }) {
  return (
    <div className="panel empty-state">
      <span className="empty-art" aria-hidden="true">
        ✳
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
