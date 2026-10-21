import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../shared/api.js';
import { useAuth } from '../shared/Auth.jsx';

const links = [
  ['/admin', 'Overview'],
  ['/admin/users', 'Users'],
  ['/admin/review', 'Screening review'],
  ['/admin/facilities', 'Villages & facilities'],
  ['/admin/reports', 'Reports & exports'],
  ['/admin/announcements', 'Announcements'],
  ['/admin/audit', 'Audit log'],
  ['/admin/settings', 'System settings'],
];
export function AdminLayout() {
  const { user, signOut } = useAuth(),
    navigate = useNavigate(),
    [dark, setDark] = useState(localStorage.getItem('niramaya.adminTheme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('niramaya.adminTheme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <div className="portal admin-portal" data-theme={dark ? 'dark' : 'light'}>
      <header className="admin-top">
        <div className="portal-brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>Niramaya</strong>
            <small>HEALTH SERVICE ADMINISTRATION</small>
          </div>
        </div>
        <div className="portal-tools">
          <span className="demo-badge">DEMO DATA</span>
          <span className="admin-user">
            {user?.username} · {user?.role}
          </span>
          <button
            className="quiet-button"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <p className="nav-caption">OVERSIGHT</p>
          {links.map(([to, label]) => (
            <NavLink
              end={to === '/admin'}
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'admin-link active' : 'admin-link')}
            >
              {label}
            </NavLink>
          ))}
          <div className="admin-sidebar-note">
            Service monitoring only. Small counts are unreliable and do not show population
            prevalence.
          </div>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
      <footer className="persistent-disclaimer">
        Screening support only, not a diagnosis. Verify thresholds and triage rules against current
        WHO / NP-NCD guidance and local protocols before use.
      </footer>
    </div>
  );
}

export function AdminOverview() {
  const [data, setData] = useState(null),
    [analytics, setAnalytics] = useState(null),
    [error, setError] = useState(''),
    [filters, setFilters] = useState({ start_date: '', end_date: '', village_id: '', kind: '' });
  useEffect(() => {
    api
      .get('/api/admin/overview')
      .then(setData)
      .catch((e) => setError(e.message));
    loadAnalytics({});
  }, []);
  async function loadAnalytics(values) {
    try {
      const q = new URLSearchParams(Object.entries(values).filter(([, v]) => v));
      setAnalytics(await api.get(`/api/admin/analytics${q.size ? `?${q}` : ''}`));
    } catch (e) {
      setError(e.message);
    }
  }
  const daily = analytics?.daily || [],
    max = Math.max(1, ...daily.map((x) => x.n)),
    points = daily
      .map(
        (x, i) =>
          `${daily.length < 2 ? 300 : 30 + (i * 540) / (daily.length - 1)},${145 - (x.n / max) * 110}`,
      )
      .join(' ');
  return (
    <section>
      <p className="eyebrow">SYSTEM OVERVIEW ? DEMO DATA</p>
      <h1>Service activity</h1>
      <p className="lead">
        A high-level view of recorded screening activity. Small counts are not reliable estimates.
      </p>
      {error && <div className="notice">{error}</div>}
      <form
        className="panel filter-bar"
        onSubmit={(e) => {
          e.preventDefault();
          loadAnalytics(filters);
        }}
      >
        <label className="field">
          From
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
        </label>
        <label className="field">
          To
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </label>
        <label className="field">
          Village ID
          <input
            value={filters.village_id}
            onChange={(e) => setFilters({ ...filters, village_id: e.target.value })}
            placeholder="All assigned villages"
          />
        </label>
        <label className="field">
          Type
          <select
            value={filters.kind}
            onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
          >
            <option value="">All types</option>
            <option value="anaemia">Anaemia</option>
            <option value="oral">Oral</option>
          </select>
        </label>
        <button className="primary-button">Apply filters</button>
      </form>
      <div className="admin-kpis">
        <Kpi label="Anaemia screenings" value={data?.counts?.anaemia ?? '?'} />
        <Kpi label="Oral screenings" value={data?.counts?.oral ?? '?'} />
        <Kpi label="Active health workers" value={data?.counts?.workers ?? '?'} />
        <Kpi
          label="Referral completion"
          value={
            data?.referral_completion_percent == null
              ? 'Not enough data'
              : `${data.referral_completion_percent}%`
          }
        />
      </div>
      <div className="admin-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACTIVITY ? FILTERED</p>
              <h2>{analytics?.total ?? 0} screening records</h2>
            </div>
          </div>
          {analytics?.small_count_unreliable && (
            <p className="warning-note">
              Small count: treat these figures as unreliable for comparison or prevalence.
            </p>
          )}
          {daily.length ? (
            <svg
              className="trend-chart"
              viewBox="0 0 600 180"
              role="img"
              aria-labelledby="trend-title trend-desc"
            >
              <title id="trend-title">Daily screening count trend</title>
              <desc id="trend-desc">
                Counts of recorded screenings over the selected date range.
              </desc>
              <path d="M30 150 H570 M30 95 H570 M30 40 H570" stroke="#dce9e4" fill="none" />
              <polyline
                points={points}
                fill="none"
                stroke="#168b7d"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {daily.map((x, i) => (
                <circle
                  key={x.day}
                  cx={daily.length < 2 ? 300 : 30 + (i * 540) / (daily.length - 1)}
                  cy={145 - (x.n / max) * 110}
                  r="4"
                  fill="#0a665f"
                >
                  <title>
                    {x.day}: {x.n}
                  </title>
                </circle>
              ))}
            </svg>
          ) : (
            <p className="muted">No screenings in this filter range.</p>
          )}
          <p className="muted">Service monitoring only; no clinical performance claim.</p>
        </section>
        <section className="panel">
          <p className="eyebrow">DATA QUALITY</p>
          <h2>Use these figures carefully</h2>
          <ul>
            <li>Synthetic demo records are labelled.</li>
            <li>Small counts can be misleading.</li>
            <li>Lab matched error is not clinical validation.</li>
            <li>Review missing data and consent before reports.</li>
          </ul>
        </section>
      </div>
      <section className="panel heat-panel">
        <p className="eyebrow">VILLAGE SUMMARY</p>
        <h2>Activity by village and screening type</h2>
        <div className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Village</th>
                <th>Type</th>
                <th>Screenings</th>
                <th>Reliability</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.villages || []).map((x, i) => (
                <tr key={`${x.village_id}-${x.kind}-${i}`}>
                  <td>{x.village_id}</td>
                  <td>{x.kind}</td>
                  <td>{x.n}</td>
                  <td>{x.n < 10 ? 'Small count ? unreliable' : 'Service count only'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="warning-note">
        {data?.note || 'Thresholds, referral zones, and rules require clinical sign-off.'}
      </p>
    </section>
  );
}
function Kpi({ label, value }) {
  return (
    <div className="admin-kpi">
      <small>{label}</small>
      <b>{value}</b>
      <span>Service monitoring</span>
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState([]),
    [error, setError] = useState(''),
    [show, setShow] = useState(false),
    [form, setForm] = useState({
      username: '',
      role: 'client',
      village_id: 'demo-village-1',
      password: '',
    });
  async function load() {
    try {
      setUsers((await api.get('/api/admin/users')).users);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e) {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', form);
      setShow(false);
      setForm({ username: '', role: 'client', village_id: 'demo-village-1', password: '' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function toggle(u) {
    try {
      await api.patch(`/api/admin/users/${u.id}`, { disabled: !u.disabled });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">ACCESS MANAGEMENT</p>
      <div className="section-heading">
        <div>
          <h1>Users</h1>
          <p className="lead">
            Create accounts with least-privilege roles and a village assignment.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShow((x) => !x)}>
          ＋ Create user
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {show && (
        <form className="panel user-form" onSubmit={create}>
          <h2>New account</h2>
          <label className="field">
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Temporary password
            <input
              type="password"
              minLength="12"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <small>At least 12 characters; user must change on first sign in.</small>
          </label>
          <div className="field-row">
            <label className="field">
              Role
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="client">Client health worker</option>
                <option value="admin">PHC / district admin</option>
                <option value="superadmin">System administrator</option>
              </select>
            </label>
            <label className="field">
              Village / PHC ID
              <input
                value={form.village_id || ''}
                onChange={(e) => setForm({ ...form, village_id: e.target.value || null })}
              />
            </label>
          </div>
          <button className="primary-button">Create account</button>
        </form>
      )}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Village</th>
              <th>Status</th>
              <th>First-login password change</th>
              <th>Last login</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.village_id || '—'}</td>
                <td>{u.disabled ? 'Disabled' : 'Active'}</td>
                <td>{u.force_password_change ? 'Required' : 'Complete'}</td>
                <td>{u.last_login ? new Date(u.last_login * 1000).toLocaleString() : 'Never'}</td>
                <td>
                  <button
                    className="table-action"
                    onClick={async () => {
                      const temporary_password = prompt(
                        'Enter a one-time temporary password of at least 12 characters. It will be shown to you once.',
                      );
                      if (!temporary_password) return;
                      try {
                        await api.post(`/api/admin/users/${u.id}/reset-password`, {
                          temporary_password,
                        });
                        alert(
                          'Password reset. Give the temporary password directly to the account holder.',
                        );
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Reset password
                  </button>{' '}
                  <button className="table-action" onClick={() => toggle(u)}>
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]),
    [error, setError] = useState(''),
    [form, setForm] = useState({
      name: '',
      village_id: '',
      type: 'PHC',
      contact: '',
      directions_url: '',
    });
  async function load() {
    try {
      setFacilities((await api.get('/api/admin/facilities')).facilities);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/api/admin/facilities', form);
      setForm({ name: '', village_id: '', type: 'PHC', contact: '', directions_url: '' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">MASTER DATA</p>
      <h1>Villages and facilities</h1>
      <p className="lead">
        Maintain PHC and referral contact information. Confirm every phone number and directions
        link before publishing.
      </p>
      {error && <p className="form-error">{error}</p>}
      <form className="panel user-form" onSubmit={save}>
        <h2>Add facility</h2>
        <label className="field">
          Facility name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <div className="field-row">
          <label className="field">
            Village ID
            <input
              value={form.village_id}
              onChange={(e) => setForm({ ...form, village_id: e.target.value })}
            />
          </label>
          <label className="field">
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>PHC</option>
              <option>Referral hospital</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label className="field">
          Verified facility contact
          <input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </label>
        <label className="field">
          Directions URL (HTTPS)
          <input
            type="url"
            value={form.directions_url}
            onChange={(e) => setForm({ ...form, directions_url: e.target.value })}
          />
        </label>
        <button className="primary-button">Save facility</button>
      </form>
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Type</th>
              <th>Village</th>
              <th>Contact</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type}</td>
                <td>{f.village_id || 'All'}</td>
                <td>{f.contact || '—'}</td>
                <td>{f.demo ? 'DEMO DATA' : 'Managed'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReviewPage() {
  const [rows, setRows] = useState([]),
    [referrals, setReferrals] = useState([]),
    [labs, setLabs] = useState({}),
    [error, setError] = useState('');
  async function load() {
    try {
      const [screenings, items] = await Promise.all([
        api.get('/api/admin/screenings'),
        api.get('/api/admin/referrals'),
      ]);
      setRows(screenings.records);
      setReferrals(items.referrals);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function status(r, value) {
    try {
      await api.patch(`/api/admin/referrals/${r.id}`, {
        status: value,
        facility: r.facility || '',
        due_date: r.due_date,
        outcome: r.outcome,
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function outcome(r, value) {
    try {
      await api.post(`/api/admin/oral-screenings/${r.id}/outcome`, { outcome: value });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function labResult(r) {
    try {
      await api.post(`/api/admin/screenings/${r.id}/lab`, { hb: Number(labs[r.id] ?? r.lab_hb) });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">SCREENING & REFERRAL REVIEW</p>
      <h1>Screening records</h1>
      <p className="lead">
        Minimal pseudonymous review data. Confirmed Hb comparisons are local monitoring, not
        clinical validation.
      </p>
      {error && <p className="notice">{error}</p>}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Patient code</th>
              <th>Village</th>
              <th>Type</th>
              <th>Triage</th>
              <th>Created</th>
              <th>Lab / specialist outcome</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.patient_id}</td>
                <td>{r.village_id}</td>
                <td>{r.kind}</td>
                <td>{r.triage}</td>
                <td>{new Date(r.created * 1000).toLocaleString()}</td>
                <td>
                  {r.kind === 'oral' ? (
                    <select
                      aria-label={`Specialist outcome for record ${r.id}`}
                      value={r.specialist_outcome || ''}
                      onChange={(e) => outcome(r, e.target.value)}
                    >
                      <option value="">Not recorded</option>
                      <option>normal</option>
                      <option>OPMD confirmed</option>
                      <option>dysplasia</option>
                      <option>malignancy</option>
                      <option>other</option>
                    </select>
                  ) : (
                    <div className="lab-editor">
                      <input
                        aria-label={`Confirmed lab Hb for record ${r.id}`}
                        type="number"
                        min="2"
                        max="25"
                        step="0.1"
                        value={labs[r.id] ?? r.lab_hb ?? ''}
                        onChange={(e) => setLabs({ ...labs, [r.id]: e.target.value })}
                      />
                      <button className="table-action" onClick={() => labResult(r)}>
                        Save Hb
                      </button>
                    </div>
                  )}
                </td>
                <td>{r.demo ? 'DEMO' : '?'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Referral status</h2>
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Patient code</th>
              <th>Village</th>
              <th>Type</th>
              <th>Facility</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id}>
                <td>{r.patient_id}</td>
                <td>{r.village_id}</td>
                <td>{r.kind}</td>
                <td>{r.facility || 'Not assigned'}</td>
                <td>
                  <select
                    aria-label={`Referral status ${r.id}`}
                    value={r.status}
                    onChange={(e) => status(r, e.target.value)}
                  >
                    <option>issued</option>
                    <option>attended</option>
                    <option>not attended</option>
                    <option>confirmed outcome</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!referrals.length && <p className="muted">No referrals recorded.</p>}
      </div>
    </section>
  );
}
export function ReportsPage() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/api/admin/screenings')
      .then((x) => setRows(x.records))
      .catch((e) => setError(e.message));
  }, []);
  function csv() {
    const data = [
      ['record_id', 'patient_code', 'village', 'type', 'triage', 'created', 'demo'],
      ...rows.map((r) => [
        r.id,
        r.patient_id,
        r.village_id,
        r.kind,
        r.triage,
        new Date(r.created * 1000).toISOString(),
        r.demo ? 'yes' : 'no',
      ]),
    ];
    const blob = new Blob(
      [
        data
          .map((x) => x.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
          .join('\n'),
      ],
      { type: 'text/csv' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'niramaya-demo-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <section>
      <p className="eyebrow">REPORTS · PSEUDONYMOUS EXPORT</p>
      <h1>Reports and exports</h1>
      <p className="lead">Exports omit names, contact details, and addresses by design.</p>
      {error && <p className="notice">{error}</p>}
      <div className="panel report-card">
        <h2>Screening activity report</h2>
        <p>{rows.length} listed records · demo data included where present.</p>
        <button className="primary-button" onClick={csv}>
          Download CSV
        </button>
        <button className="secondary-button" onClick={() => window.print()}>
          Print report
        </button>
        <p className="warning-note">
          Aggregate counts are unreliable when small. Lab-matched error indicators are not clinical
          validation.
        </p>
      </div>
    </section>
  );
}

export function AuditPage() {
  const [data, setData] = useState({ events: [] }),
    [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/api/admin/audit')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section>
      <p className="eyebrow">ACCOUNTABILITY</p>
      <h1>Audit log</h1>
      <p className="lead">User access and changes are recorded for review.</p>
      {error && <p className="notice">{error}</p>}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(data.events || []).map((e) => (
              <tr key={e.id}>
                <td>{e.username || `user ${e.user_id}`}</td>
                <td>{e.action}</td>
                <td>{e.resource}</td>
                <td>{new Date(e.created * 1000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnnouncementPage() {
  const [rows, setRows] = useState([]),
    [title, setTitle] = useState(''),
    [body, setBody] = useState(''),
    [error, setError] = useState('');
  async function load() {
    try {
      setRows((await api.get('/api/admin/announcements')).announcements);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function send(e) {
    e.preventDefault();
    try {
      await api.post('/api/admin/announcements', {
        title,
        body,
        translations: { en: { title, body } },
        village_id: null,
      });
      setTitle('');
      setBody('');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">COMMUNICATION</p>
      <h1>Announcements</h1>
      <p className="lead">
        Posts are visible to authenticated workers. Add reviewed translations before targeting
        multilingual audiences.
      </p>
      {error && <p className="notice">{error}</p>}
      <form className="panel user-form" onSubmit={send}>
        <h2>Compose announcement</h2>
        <label className="field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          Message
          <textarea rows="4" value={body} onChange={(e) => setBody(e.target.value)} required />
        </label>
        <button className="primary-button">Publish to all assigned workers</button>
      </form>
      {rows.map((a) => (
        <article className="panel announcement" key={a.id}>
          <small>{new Date(a.created * 1000).toLocaleString()}</small>
          <h2>{a.title}</h2>
          <p>{a.body}</p>
        </article>
      ))}
    </section>
  );
}

export function SystemSettingsPage() {
  const [data, setData] = useState({ settings: {} }),
    [error, setError] = useState(''),
    [review, setReview] = useState('');
  const { user } = useAuth();
  useEffect(() => {
    api
      .get('/api/admin/settings')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  async function changePhoto() {
    const enabled =
      data.settings?.photo_uploads?.value !== true &&
      data.settings?.photo_uploads?.value !== 'true';
    if (review.trim().length < 20) {
      setError('Enter a documented privacy review of at least 20 characters.');
      return;
    }
    if (
      !confirm(
        `${enabled ? 'Enable' : 'Disable'} image uploads? Only enable after approval of the documented privacy review.`,
      )
    )
      return;
    try {
      await api.put('/api/admin/settings/photo-uploads', { enabled, privacy_review: review });
      setData(await api.get('/api/admin/settings'));
      setReview('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section>
      <p className="eyebrow">CONFIGURATION</p>
      <h1>System settings</h1>
      <p className="warning-note">
        Clinical sign-off is required before thresholds, rules, or consent wording change. Photo
        uploads are disabled by default.
      </p>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Value</th>
              <th>Version</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.settings || {}).map(([key, x]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{String(x.value)}</td>
                <td>{x.version}</td>
                <td>{x.updated ? new Date(x.updated * 1000).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel user-form">
        <h2>Photo uploads</h2>
        <p>
          Images are disabled unless a superadmin records a privacy review. Uploaded images are
          processed in memory and are not saved by this API.
        </p>
        {user?.role === 'superadmin' ? (
          <>
            <label className="field">
              Privacy review record
              <textarea
                rows="4"
                minLength="20"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Record approval reference, date, scope and retention assessment."
              />
            </label>
            <button className="secondary-button" onClick={changePhoto}>
              Change upload setting
            </button>
          </>
        ) : (
          <p>Only a system administrator can change this setting.</p>
        )}
      </div>
      <p className="muted">
        Threshold editing and version approval still require a separate clinical governance
        workflow.
      </p>
    </section>
  );
}
