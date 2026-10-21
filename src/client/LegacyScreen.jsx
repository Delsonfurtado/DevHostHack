import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import OralScreening, { OralModelCard } from '../OralScreening.jsx';
import '../style.css';
const ROI = { x: 0.2, y: 0.35, w: 0.6, h: 0.4 };
const FEATURES = ['mean_r', 'mean_g', 'mean_b', 'red_green', 'red_blue', 'green_blue'];
const CUTS = {
  child_6_59m: { anaemia: 11, moderate: 10, severe: 7 },
  child_5_11y: { anaemia: 11.5, moderate: 11, severe: 8 },
  age_12_14: { anaemia: 12, moderate: 11, severe: 8 },
  woman_nonpregnant: { anaemia: 12, moderate: 11, severe: 8 },
  woman_pregnant: { anaemia: 11, moderate: 10, severe: 7 },
  man: { anaemia: 13, moderate: 11, severe: 8 },
};
const SYMPTOM_REDUCTION = {
  tiredness: 0.15,
  breathless_light_activity: 0.3,
  pale_palms_nails: 0.4,
  not_taking_ifa: 0.1,
};
const DANGER = new Set(['breathless_at_rest', 'chest_pain', 'fainting']);
const readStore = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const saveStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
function localQuality(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas'),
          w = 256,
          h = 256;
        c.width = w;
        c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, w, h);
        const d = x.getImageData(0, 0, w, h).data,
          g = new Float32Array(w * h);
        let brightness = 0,
          glare = 0,
          red = 0,
          green = 0,
          blue = 0;
        for (let i = 0, j = 0; i < d.length; i += 4, j++) {
          g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          brightness += g[j];
          red += d[i];
          green += d[i + 1];
          blue += d[i + 2];
          if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) glare++;
        }
        let lap = 0,
          lap2 = 0;
        for (let yy = 1; yy < h - 1; yy++)
          for (let xx = 1; xx < w - 1; xx++) {
            const p = yy * w + xx,
              v = -4 * g[p] + g[p - 1] + g[p + 1] + g[p - w] + g[p + w];
            lap += v;
            lap2 += v * v;
          }
        const sharpness = lap2 / ((w - 2) * (h - 2)) - (lap / ((w - 2) * (h - 2))) ** 2,
          mean = brightness / (w * h),
          checks = {
            sharp: sharpness >= 18,
            light: mean >= 45 && mean <= 220,
            glare: glare / (w * h) <= 0.08,
            tissue: red > green * 0.92 && red > blue * 0.92,
          };
        const tips = [];
        if (!checks.sharp) tips.push('Hold the phone steady and tap to focus.');
        if (!checks.light) tips.push('Move to soft, even daylight; avoid shadows.');
        if (!checks.glare) tips.push('Tilt away from direct light to remove glare.');
        if (!checks.tissue)
          tips.push('This image may not show the target tissue; frame the inner lower eyelid.');
        resolve({
          checks,
          passed: Object.values(checks).every(Boolean),
          tips,
          sharpness: Number(sharpness.toFixed(1)),
          brightness: Number(mean.toFixed(1)),
          glare_fraction: Number((glare / (w * h)).toFixed(3)),
        });
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(Error('Could not read image'));
    };
    img.src = url;
  });
}
function localFeatures(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 80;
        c.height = 60;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(
          img,
          img.width * ROI.x,
          img.height * ROI.y,
          img.width * ROI.w,
          img.height * ROI.h,
          0,
          0,
          80,
          60,
        );
        const d = x.getImageData(0, 0, 80, 60).data,
          n = d.length / 4;
        let r = 0,
          g = 0,
          b = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
        }
        r /= n * 255;
        g /= n * 255;
        b /= n * 255;
        resolve([r, g, b, r / (g + 1e-6), r / (b + 1e-6), g / (b + 1e-6)]);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(Error('Could not read image'));
    };
    img.src = url;
  });
}
const dict = {
  en: {
    screen: 'Screen',
    oralTab: 'Oral screening',
    log: 'Log',
    model: 'Model',
    area: 'Area dashboard',
    title: 'A clearer next step for anaemia screening',
    sub: 'A photo can guide a conversation. It cannot diagnose.',
    group: 'Patient group',
    village: 'Village / PHC',
    consent: 'I have explained this screening aid and received consent.',
    choose: 'Choose or take eyelid photo',
    guide: 'Gently lower the lower eyelid. Keep the pink inner lid inside the guide.',
    symptoms: 'Symptoms and signs',
    danger: 'Danger sign · urgent',
    check: 'Check screening result',
    quality: 'Photo quality',
    result: 'Screening result',
    range: 'Estimate range',
    amberwhy:
      'The uncertainty range crosses the group threshold. Retake the photo or use an Hb strip test.',
    disclaimer:
      'Decision-support aid only. Not a diagnostic device. Confirm with a laboratory test and clinician judgement.',
    upload: 'Select photo',
    voice: 'Read aloud',
    print: 'Print',
    copy: 'Copy note',
    abha: 'ABHA ID (optional)',
    language: 'Language',
    dark: 'Dark mode',
    welcome: 'Namaste',
    review: 'Review safely with the patient',
    loading: 'Checking photo…',
  },
  hi: {
    screen: 'जाँच',
    log: 'रिकॉर्ड',
    model: 'मॉडल',
    area: 'क्षेत्र डैशबोर्ड',
    title: 'एनीमिया जाँच के लिए अगला स्पष्ट कदम',
    sub: 'फोटो बातचीत में मदद कर सकती है। यह निदान नहीं है।',
    group: 'मरीज़ का समूह',
    village: 'गाँव / PHC',
    consent: 'मैंने इस जाँच सहायता के बारे में बताया और सहमति ली है।',
    choose: 'पलक की फोटो लें या चुनें',
    guide: 'निचली पलक को धीरे नीचे करें। गुलाबी भीतरी भाग को चौखटे में रखें।',
    symptoms: 'लक्षण और संकेत',
    danger: 'खतरे का संकेत · तुरंत',
    check: 'जाँच का परिणाम देखें',
    quality: 'फोटो की गुणवत्ता',
    result: 'जाँच का परिणाम',
    range: 'अनुमान सीमा',
    amberwhy:
      'अनिश्चितता सीमा समूह की सीमा को पार करती है। फिर से फोटो लें या Hb स्ट्रिप टेस्ट करें।',
    disclaimer:
      'केवल निर्णय सहायता। निदान उपकरण नहीं। लैब टेस्ट और चिकित्सक की राय से पुष्टि करें।',
    upload: 'फोटो चुनें',
    voice: 'आवाज़ में सुनें',
    print: 'प्रिंट',
    copy: 'नोट कॉपी करें',
    abha: 'ABHA ID (वैकल्पिक)',
    language: 'भाषा',
    dark: 'डार्क मोड',
    welcome: 'नमस्ते',
    review: 'मरीज़ के साथ सुरक्षित रूप से समीक्षा करें',
    loading: 'फोटो जाँची जा रही à¤¹à¥ˆ…',
  },
  kn: {
    screen: 'ಪರಿಶೀಲನೆ',
    log: 'ದಾಖಲೆ',
    model: 'ಮಾದರಿ',
    area: 'ಪ್ರದೇಶ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    title: 'ರಕ್ತಹೀನತೆ ತಪಾಸಣೆಗೆ ಸ್ಪಷ್ಟ ಮುಂದಿನ ಹೆಜ್ಜೆ',
    sub: 'ಚಿತ್ರವು ಮಾತುಕತೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ.',
    group: 'ರೋಗಿಯ ಗುಂಪು',
    village: 'ಗ್ರಾಮ / PHC',
    consent: 'ಈ ತಪಾಸಣಾ ಸಹಾಯವನ್ನು ವಿವರಿಸಿ ಒಪ್ಪಿಗೆ ಪಡೆದಿದ್ದೇನೆ.',
    choose: 'ಕಣ್ಣಿನ ಒಳಪದರದ ಚಿತ್ರ ತೆಗೆಯಿರಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ',
    guide: 'ಕೆಳ ಕಣ್ಣಿನ ರೆಪ್ಪೆಯನ್ನು ನಿಧಾನವಾಗಿ ಕೆಳಗಿಳಿಸಿ. ಗುಲಾಬಿ ಒಳಭಾಗವನ್ನು ಚೌಕಟ್ಟಿನಲ್ಲಿ ಇರಿಸಿ.',
    symptoms: 'ಲಕ್ಷಣಗಳು ಮತ್ತು ಸೂಚನೆಗಳು',
    danger: 'ಅಪಾಯ ಸೂಚನೆ · ತುರ್ತು',
    check: 'ತಪಾಸಣೆ ಫಲಿತಾಂಶ ನೋಡಿ',
    quality: 'ಚಿತ್ರದ ಗುಣಮಟ್ಟ',
    result: 'ತಪಾಸಣೆ ಫಲಿತಾಂಶ',
    range: 'ಅಂದಾಜು ವ್ಯಾಪ್ತಿ',
    amberwhy:
      'ಅನಿಶ್ಚಿತ ವ್ಯಾಪ್ತಿ ಗುಂಪಿನ ಮಿತಿಯನ್ನು ದಾಟುತ್ತದೆ. ಮತ್ತೆ ಚಿತ್ರ ತೆಗೆಯಿರಿ ಅಥವಾ Hb ಸ್ಟ್ರಿಪ್ ಪರೀಕ್ಷೆ ಮಾಡಿ.',
    disclaimer:
      'ನಿರ್ಧಾರ ಸಹಾಯ ಮಾತ್ರ. ರೋಗನಿರ್ಣಯ ಸಾಧನವಲ್ಲ. ಪ್ರಯೋಗಾಲಯ ಪರೀಕ್ಷೆ ಮತ್ತು ವೈದ್ಯರ ಅಭಿಪ್ರಾಯದಿಂದ ದೃಢೀಕರಿಸಿ.',
    upload: 'ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    voice: 'ಓದಿ ಕೇಳಿಸಿ',
    print: 'ಮುದ್ರಿಸಿ',
    copy: 'ಟಿಪ್ಪಣಿ ನಕಲಿಸಿ',
    abha: 'ABHA ID (ಐಚ್ಛಿಕ)',
    language: 'ಭಾಷೆ',
    dark: 'ಡಾರ್ಕ್ ಮೋಡ್',
    welcome: 'ನಮಸ್ಕಾರ',
    review: 'ರೋಗಿಯೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ',
    loading: 'ಚಿತ್ರ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
  },
};
const groups = [
  ['child_6_59m', 'Child 6–59 months'],
  ['child_5_11y', 'Child 5–11 years'],
  ['age_12_14', 'Age 12–14 years'],
  ['woman_nonpregnant', 'Non-pregnant woman'],
  ['woman_pregnant', 'Pregnant woman'],
  ['man', 'Man'],
];
const symptomList = [
  ['tiredness', 'Tiredness'],
  ['breathless_light_activity', 'Breathless on light activity'],
  ['pale_palms_nails', 'Pale palms or nails'],
  ['not_taking_ifa', 'Not taking iron-folic acid'],
  ['breathless_at_rest', 'Breathless at rest', true],
  ['chest_pain', 'Chest pain', true],
  ['fainting', 'Fainting', true],
];
function Logo() {
  return (
    <svg viewBox="0 0 48 48" aria-label="Niramaya logo">
      <defs>
        <linearGradient id="g">
          <stop stopColor="#28b6a3" />
          <stop offset="1" stopColor="#087f78" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="16" fill="url(#g)" />
      <path
        d="M11 26c4-8 9-12 14-12 6 0 9 4 12 12-3 7-7 10-13 10S14 33 11 26Z"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
      />
      <circle cx="24" cy="26" r="4" fill="white" />
      <path d="M24 8v5M8 26h4M36 26h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export default function LegacyScreen() {
  const [lang, setLang] = useState('en'),
    [tab, setTab] = useState('screen'),
    [dark, setDark] = useState(false),
    [group, setGroup] = useState(''),
    [village, setVillage] = useState(''),
    [consent, setConsent] = useState(false),
    [file, setFile] = useState(null),
    [quality, setQuality] = useState(null),
    [symptoms, setSymptoms] = useState([]),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [model, setModel] = useState({
      trained: false,
      name: 'Heuristic sample (NOT trained)',
      dataset: 'None',
      metrics: {},
      fairness: [],
    }),
    [logs, setLogs] = useState([]),
    [stats, setStats] = useState({ villages: [], local_mae: null, lab_count: 0, drift: false }),
    [lab, setLab] = useState({}),
    [abha, setAbha] = useState(''),
    [error, setError] = useState('');
  const t = dict[lang];
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (import.meta.env.DEV)
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      else navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    loadData();
  }, []);
  function loadData() {
    const next = readStore('niramaya.logs', []);
    setLogs(next);
    const by = {};
    for (const row of next) {
      const key = row.village + '|' + row.zone;
      by[key] = (by[key] || 0) + 1;
    }
    const villages = Object.entries(by).map(([key, n]) => {
      const [village, zone] = key.split('|');
      return { village, zone, n };
    });
    const pairs = next.filter((x) => x.lab_hb != null);
    const mae = pairs.length
      ? pairs.reduce((a, x) => a + Math.abs(x.hb - x.lab_hb), 0) / pairs.length
      : null;
    setStats({
      villages,
      local_mae: mae,
      lab_count: pairs.length,
      drift: mae != null && mae > 1.5,
    });
  }
  async function selectFile(f) {
    setFile(f);
    setResult(null);
    setQuality(null);
    setError('');
    if (!f) return;
    setBusy(true);
    try {
      setQuality(await localQuality(f));
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }
  async function screen() {
    setBusy(true);
    setError('');
    try {
      const hb = 10.4,
        pad = 2,
        cutoff = CUTS[group].anaemia,
        interval = [8.4, 12.4],
        zone =
          symptoms.some((s) => DANGER.has(s)) || hb + pad < cutoff
            ? 'red'
            : hb - pad > cutoff
              ? 'green'
              : 'amber',
        cuts = CUTS[group],
        severity =
          hb < cuts.severe
            ? 'Severe'
            : hb < cuts.moderate
              ? 'Moderate'
              : hb < cuts.anaemia
                ? 'Mild'
                : 'No anaemia by listed threshold',
        danger_sign = symptoms.some((s) => DANGER.has(s)),
        now = Date.now(),
        j = {
          id: 'sample-' + now,
          created: now / 1000,
          village: village || 'sample only',
          group_key: group,
          zone,
          hb,
          low: interval[0],
          high: interval[1],
          interval,
          cutoff,
          severity,
          model_name: 'Fixed sample value ? NOT measured',
          model_version: 'sample-fixed-v0',
          symptoms: [...symptoms],
          lab_hb: null,
          danger_sign,
          referral_note:
            'sample ONLY: fictional value. Do not use for care. Confirm with an Hb test and clinician assessment.',
          explanation:
            'This fixed sample value is fictional. It is not calculated from the photo or symptoms.',
          sample: true,
        };
      setResult(j);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }
  function saveLab(id) {
    const value = Number(lab[id]);
    if (!Number.isFinite(value) || value < 2 || value > 25) return;
    const next = readStore('niramaya.logs', []).map((row) =>
      row.id === id ? { ...row, lab_hb: value } : row,
    );
    saveStore('niramaya.logs', next);
    loadData();
  }
  function showSample() {
    const row = {
      id: 'sample-' + Date.now(),
      created: Date.now() / 1000,
      village: 'Illustrative sample',
      group_key: 'woman_pregnant',
      zone: 'amber',
      hb: 10.4,
      low: 8.4,
      high: 12.4,
      interval: [8.4, 12.4],
      cutoff: 11,
      severity: 'Mild',
      model_name: 'Illustrative sample · NOT a measurement',
      model_version: 'sample-preset',
      symptoms: [],
      lab_hb: null,
      danger_sign: false,
      referral_note: 'Sample only: confirm with an Hb test and clinician assessment.',
      explanation:
        'This fictional sample illustrates an uncertainty range that overlaps the group threshold.',
      sample: true,
    };
    setResult(row);
    setGroup('woman_pregnant');
    setConsent(false);
    setFile(null);
    setQuality(null);
    setSymptoms([]);
  }
  const labels = groups.find((x) => x[0] === group)?.[1] || 'Choose group';
  const note = result
    ? `Niramaya screening note · ${result.zone.toUpperCase()} · estimate ${result.hb} g/dL (range ${result.interval.join('–')}) · ${result.referral_note}${abha ? ' · ABHA ' + abha : ''}`
    : '';
  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="top">
        <div className="brand">
          <Logo />
          <div>
            <b>Niramaya</b>
            <small>SCREENING SUPPORT</small>
          </div>
        </div>
        <div className="head-actions">
          <label className="sr" htmlFor="lang">
            {t.language}
          </label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          <button className="icon-btn" onClick={() => setDark(!dark)} aria-label={t.dark}>
            ◐
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{t.welcome} · PRIMARY HEALTH CARE</span>
            <h1>{t.title}</h1>
            <p>{t.sub}</p>
          </div>
          <div className="hero-mark">
            <Logo />
            <span>Care starts with a conversation</span>
          </div>
        </section>
        <nav className="tabs" aria-label="Main sections">
          {[
            ['screen', t.screen],
            ['oral', lang === 'hi' ? 'मुंह की जांच' : lang === 'kn' ? 'ಬಾಯಿ ತಪಾಸಣೆ' : t.oralTab],
            ['log', t.log],
            ['model', t.model],
            ['area', t.area],
          ].map(([id, label]) => (
            <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>
              {label}
            </button>
          ))}
        </nav>
        {tab === 'oral' && <OralScreening lang={lang} village={village} setVillage={setVillage} />}
        {tab === 'screen' && (
          <div className="layout">
            <section className="card form-card">
              <div className="step">
                <i>1</i>
                <div>
                  <h2>Patient details</h2>
                  <small>Choose the right reference threshold</small>
                </div>
              </div>
              <label>
                {t.group}
                <select value={group} onChange={(e) => setGroup(e.target.value)}>
                  <option value="">Select patient group</option>
                  {groups.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.village}
                <input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Rampur PHC"
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{t.consent}</span>
              </label>
              <div className="step">
                <i>2</i>
                <div>
                  <h2>{t.choose}</h2>
                  <small>{t.guide}</small>
                </div>
              </div>
              <label className="upload">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => selectFile(e.target.files?.[0])}
                />
                <span className="camera">⌖</span>
                <b>{t.upload}</b>
                <small>JPG or PNG · processed in memory</small>
              </label>
              {file && (
                <div className="preview">
                  <img src={URL.createObjectURL(file)} alt="Selected eyelid photo" />
                  <div className="guidebox">
                    <span className="scanline" />
                  </div>
                </div>
              )}
              {file && (
                <div className="quality">
                  <b>{t.quality}</b>
                  <small className="tip">
                    Guidance only in sample mode: any selected image can continue.
                  </small>
                  <div className="chips">
                    {['sharp', 'light', 'glare', 'tissue'].map((key) => (
                      <span key={key} className={quality?.checks?.[key] ? 'good' : 'bad'}>
                        {quality?.checks?.[key] ? '✓' : '!'} {key}
                      </span>
                    ))}
                  </div>
                  {quality?.tips?.map((x) => (
                    <small className="tip" key={x}>
                      {x}
                    </small>
                  ))}
                  {busy && !quality && <small>{t.loading}</small>}
                </div>
              )}
              <div className="step">
                <i>3</i>
                <div>
                  <h2>{t.symptoms}</h2>
                  <small>Select what the patient reports or you observe</small>
                </div>
              </div>
              <div className="symptoms">
                {symptomList.map(([id, label, danger]) => (
                  <label key={id} className={danger ? 'symptom danger' : 'symptom'}>
                    <input
                      type="checkbox"
                      checked={symptoms.includes(id)}
                      onChange={(e) =>
                        setSymptoms(
                          e.target.checked ? [...symptoms, id] : symptoms.filter((x) => x !== id),
                        )
                      }
                    />
                    <span>{danger ? '⚠' : '○'}</span>
                    {danger ? t.danger + ': ' + label : label}
                  </label>
                ))}
              </div>
              <button
                className="primary"
                disabled={!file || !group || !consent || busy}
                onClick={screen}
              >
                {busy ? t.loading : 'Show sample result'}
                <span>→</span>
              </button>
              <button className="text-btn" onClick={showSample}>
                Show sample result - no photo or backend
              </button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <p className="micro">
                {model?.trained ? 'Trained model' : 'Heuristic sample (NOT trained)'} · no image is
                saved
              </p>
            </section>
            <aside className="rightcol">
              {result ? (
                <section className={`card result ${result.zone}`}>
                  <div className="result-head">
                    <div>
                      <span className="eyebrow">{t.result}</span>
                      <h2>
                        {result.zone === 'green'
                          ? 'LOW RISK'
                          : result.zone === 'red'
                            ? 'REFER'
                            : 'UNCERTAIN'}
                      </h2>
                    </div>
                    <span className="zone-icon">
                      {result.zone === 'green' ? '✓' : result.zone === 'red' ? '!' : '?'}
                    </span>
                  </div>
                  {result.sample && (
                    <p className="warning">
                      FICTIONAL sample DATA - not a patient result, photo estimate, or clinical
                      measurement. This sample is not saved in the log.
                    </p>
                  )}
                  <div className="hb">
                    <strong>{result.hb.toFixed(1)}</strong>
                    <span>
                      g/dL
                      <br />
                      <small>estimate</small>
                    </span>
                  </div>
                  <p>
                    {result.severity} · threshold {result.cutoff} g/dL
                  </p>
                  <b>
                    {t.range}: {result.interval[0]}–{result.interval[1]} g/dL
                  </b>
                  <div className="range">
                    <div
                      className="threshold"
                      style={{ left: `${Math.min(95, Math.max(5, (result.cutoff / 20) * 100))}%` }}
                    />
                    <div
                      className="interval"
                      style={{
                        left: `${(result.interval[0] / 20) * 100}%`,
                        width: `${((result.interval[1] - result.interval[0]) / 20) * 100}%`,
                      }}
                    />
                    <i style={{ left: `${(result.hb / 20) * 100}%` }} />
                  </div>
                  <div className="range-label">
                    <span>3</span>
                    <span>20 g/dL</span>
                  </div>
                  <p>{result.zone === 'amber' ? t.amberwhy : result.explanation}</p>
                  {result.danger_sign && (
                    <p className="danger-call">⚠ Danger sign present — urgent assessment.</p>
                  )}
                  <div className="model-pill">{result.model_name}</div>
                  <label>
                    {t.abha}
                    <input
                      value={abha}
                      onChange={(e) => setAbha(e.target.value)}
                      placeholder="Optional identifier"
                    />
                  </label>
                  <div className="actions">
                    <button onClick={() => navigator.clipboard?.writeText(note)}>{t.copy}</button>
                    <button onClick={() => window.print()}>{t.print}</button>
                    <button
                      onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(note))}
                    >
                      {t.voice}
                    </button>
                  </div>
                  <div className="qr" aria-label="Referral note QR code">
                    <QR value={note} />
                  </div>
                  <small>Share only with patient consent.</small>
                </section>
              ) : (
                <section className="card empty-result">
                  <span className="spark">✳</span>
                  <h2>{t.review}</h2>
                  <p>Complete the photo and symptom steps to see a screening result here.</p>
                  <div className="safety">
                    <b>Safety first</b>
                    <p>
                      Danger signs need urgent clinical attention, regardless of an image estimate.
                    </p>
                  </div>
                </section>
              )}
              <section className="card threshold-card">
                <span className="eyebrow">REFERENCE · VERIFY LATEST WHO GUIDANCE</span>
                <h3>{labels}</h3>
                <p>
                  Thresholds guide triage only. Results require confirmation with an Hb test and
                  clinician judgement.
                </p>
                <button className="text-btn" onClick={() => setTab('model')}>
                  About this model →
                </button>
              </section>
            </aside>
          </div>
        )}
        {tab === 'model' && (
          <section className="card page-card">
            <span className="eyebrow">TRANSPARENCY</span>
            <h2>Model card</h2>
            <div className="badge">
              {model?.trained ? 'TRAINED · RESEARCH ONLY' : 'HEURISTIC sample · NOT TRAINED'}
            </div>
            <p>{model?.name || 'Heuristic sample (NOT trained)'}</p>
            <p>
              Dataset: {model?.dataset || 'No dataset loaded'} · images:{' '}
              {model?.metrics?.images ?? '—'} · patients: {model?.metrics?.patients ?? '—'}
            </p>
            <div className="metric-grid">
              {[
                ['AUROC', model?.metrics?.auroc],
                ['MAE (g/dL)', model?.metrics?.mae],
                ['Sensitivity', model?.metrics?.sensitivity],
                ['Specificity', model?.metrics?.specificity],
                ['Interval width', model?.metrics?.interval_width],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <b>{v == null ? '—' : typeof v === 'number' ? v.toFixed(2) : v}</b>
                </div>
              ))}
            </div>
            <h3>Subgroup fairness</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Patients</th>
                    <th>MAE</th>
                    <th>Sensitivity</th>
                  </tr>
                </thead>
                <tbody>
                  {(model?.fairness?.length
                    ? model.fairness
                    : [{ group: 'Not reported', patients: '—', mae: '—', sensitivity: '—' }]
                  ).map((x, i) => (
                    <tr key={i}>
                      <td>{x.group}</td>
                      <td>{x.patients}</td>
                      <td>{x.mae}</td>
                      <td>{x.sensitivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="callout">
              Open datasets may be small and unrepresentative. This light colour-feature model has
              not been clinically validated. Estimates must not replace lab testing.
            </p>
            <OralModelCard lang={lang} />
          </section>
        )}
        {tab === 'log' && (
          <section className="card page-card">
            <span className="eyebrow">AUDIT TRAIL</span>
            <h2>Screening log</h2>
            {stats?.drift && (
              <p className="warning">
                ⚠ Local drift flag: observed MAE is above 1.5 g/dL. Review with clinical
                supervision.
              </p>
            )}
            <p>
              Stored records include village, zone, symptoms and model version. Images are never
              saved.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID / time</th>
                    <th>Village</th>
                    <th>Group</th>
                    <th>Zone</th>
                    <th>Hb estimate</th>
                    <th>Lab Hb</th>
                    <th>Save lab</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((x) => (
                    <tr key={x.id}>
                      <td>
                        #{x.id}
                        <small>{new Date(x.created * 1000).toLocaleString()}</small>
                      </td>
                      <td>{x.village}</td>
                      <td>{x.group_key}</td>
                      <td>
                        <span className={'tag ' + x.zone}>{x.zone}</span>
                      </td>
                      <td>{x.hb?.toFixed(1)}</td>
                      <td>{x.lab_hb ?? '—'}</td>
                      <td>
                        <input
                          aria-label={'Lab Hb for record ' + x.id}
                          type="number"
                          step=".1"
                          value={lab[x.id] || ''}
                          onChange={(e) => setLab({ ...lab, [x.id]: e.target.value })}
                        />
                        <button onClick={() => saveLab(x.id)}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!logs.length && <p>No screenings recorded yet.</p>}
          </section>
        )}
        {tab === 'area' && (
          <section className="card page-card">
            <span className="eyebrow">ANONYMOUS AGGREGATES</span>
            <h2>Area dashboard</h2>
            <p>For service review only. Counts are not evidence of population prevalence.</p>
            {stats?.drift && (
              <p className="warning">
                Local MAE drift warning: {stats.local_mae} g/dL across {stats.lab_count} lab-matched
                records.
              </p>
            )}
            <div className="zone-bars">
              {['green', 'amber', 'red'].map((z) => {
                const n = (stats?.villages || [])
                  .filter((x) => x.zone === z)
                  .reduce((a, b) => a + b.n, 0);
                return (
                  <div key={z}>
                    <span>
                      {z} · {n}
                    </span>
                    <i
                      className={z}
                      style={{
                        width: `${Math.max(n ? 8 : 0, Math.min(100, (n / (logs.length || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <h3>Village summary</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Village</th>
                    <th>Green</th>
                    <th>Amber</th>
                    <th>Red</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...new Set((stats?.villages || []).map((x) => x.village))].map((v) => (
                    <tr key={v}>
                      <td>{v}</td>
                      {['green', 'amber', 'red'].map((z) => (
                        <td key={z}>
                          {stats.villages.find((x) => x.village === v && x.zone === z)?.n || 0}
                        </td>
                      ))}
                      <td>
                        {stats.villages.filter((x) => x.village === v).reduce((a, b) => a + b.n, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Local MAE: {stats?.local_mae ?? 'Not enough confirmed lab results'} · matched tests:{' '}
              {stats?.lab_count ?? 0}
            </p>
          </section>
        )}
      </main>
      <footer>{t.disclaimer}</footer>
    </div>
  );
}
function QR({ value }) {
  return (
    <QRCodeSVG
      value={value || 'Niramaya screening aid'}
      size={112}
      level="M"
      includeMargin
      aria-label="Referral note QR code"
    />
  );
}
