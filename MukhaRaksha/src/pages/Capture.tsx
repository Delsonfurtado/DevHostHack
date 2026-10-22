import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, RefreshCw, Upload, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Eye, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { CapturedImage } from '../types/models';

interface QualityReport {
  blurScore: number;
  blurPass: boolean;
  lightingScore: number;
  underExposedPct: number;
  overExposedPct: number;
  lightingPass: boolean;
  oralContentScore: number;
  oralPass: boolean;
  overallPass: boolean;
}

const ORAL_SITES = [
  { id: 'tongueTop', labelEn: 'Tongue (Top)', labelKn: 'ನಾಲಿಗೆ (ಮೇಲ್ಭಾಗ)' },
  { id: 'tongueSides', labelEn: 'Tongue (Sides)', labelKn: 'ನಾಲಿಗೆ (ಪಕ್ಕ)' },
  { id: 'innerCheeks', labelEn: 'Inner Cheeks', labelKn: 'ಒಳಗಿನ ಕೆನ್ನೆ' },
  { id: 'lips', labelEn: 'Lips', labelKn: 'ತುಟಿಗಳು' },
  { id: 'floorOfMouth', labelEn: 'Floor of Mouth', labelKn: 'ಬಾಯಿಯ ತಳ' },
  { id: 'palate', labelEn: 'Palate (Roof)', labelKn: 'ಅಂಗಳ' },
];

export default function Capture() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningIdParam = searchParams.get('screeningId') || '';
  const selfExamIdParam = searchParams.get('selfExamId') || '';

  const [selectedSite, setSelectedSite] = useState<string>('innerCheeks');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentImages, setRecentImages] = useState<CapturedImage[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load recent images
  const loadRecent = useCallback(async () => {
    try {
      const items = await db.images.orderBy('timestamp').reverse().limit(6).toArray();
      setRecentImages(items);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(lang === 'kn' ? 'ಕ್ಯಾಮರಾ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.' : 'Camera not accessible or permission denied. You can upload an image or use Demo mode.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Image Quality Analysis on Canvas
  const analyzeImage = (canvas: HTMLCanvasElement): QualityReport => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        blurScore: 0,
        blurPass: false,
        lightingScore: 0,
        underExposedPct: 0,
        overExposedPct: 0,
        lightingPass: false,
        oralContentScore: 0,
        oralPass: false,
        overallPass: false,
      };
    }

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Grayscale & Brightness
    let totalBrightness = 0;
    let underExposedCount = 0;
    let overExposedCount = 0;
    let pinkishOralCount = 0;

    const gray = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const pixelIdx = i / 4;
      gray[pixelIdx] = lum;

      totalBrightness += lum;
      if (lum < 35) underExposedCount++;
      if (lum > 225) overExposedCount++;

      // Check pinkish/reddish oral tissue profile
      if (r > 105 && r > g * 1.15 && r > b * 1.1) {
        pinkishOralCount++;
      }
    }

    const totalPixels = width * height;
    const meanBrightness = Math.round(totalBrightness / totalPixels);
    const underPct = Math.round((underExposedCount / totalPixels) * 100);
    const overPct = Math.round((overExposedCount / totalPixels) * 100);

    // 2. Laplacian Variance for Blur
    // 3x3 Laplacian kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    let lapSum = 0;
    let lapSqSum = 0;
    let lapCount = 0;

    // Sample across grid for performance
    const step = Math.max(1, Math.floor(Math.min(width, height) / 200));

    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        const center = gray[y * width + x];
        const top = gray[(y - 1) * width + x];
        const bottom = gray[(y + 1) * width + x];
        const left = gray[y * width + (x - 1)];
        const right = gray[y * width + (x + 1)];

        const lap = top + bottom + left + right - 4 * center;
        lapSum += lap;
        lapSqSum += lap * lap;
        lapCount++;
      }
    }

    const lapMean = lapSum / lapCount;
    const lapVariance = Math.round(lapSqSum / lapCount - lapMean * lapMean);

    const blurPass = lapVariance >= 65;
    const lightingPass = meanBrightness >= 55 && meanBrightness <= 210 && underPct <= 25 && overPct <= 20;
    const oralPct = Math.round((pinkishOralCount / totalPixels) * 100);
    const oralPass = oralPct >= 6; // At least 6% oral tissue tone detected

    return {
      blurScore: lapVariance,
      blurPass,
      lightingScore: meanBrightness,
      underExposedPct: underPct,
      overExposedPct: overPct,
      lightingPass,
      oralContentScore: oralPct,
      oralPass,
      overallPass: blurPass && lightingPass && oralPass,
    };
  };

  // Process a captured or loaded image
  const processCanvasImage = (canvas: HTMLCanvasElement) => {
    setIsAnalyzing(true);
    const report = analyzeImage(canvas);
    setQualityReport(report);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
      }
    }, 'image/jpeg', 0.9);

    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.85));
    setIsAnalyzing(false);
  };

  // Take photo from live video
  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    processCanvasImage(canvas);
  };

  // Upload from gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        processCanvasImage(canvas);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // Generate Demo Samples
  const loadDemoSample = (blurry: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background oral cavity texture
    const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 300);
    grad.addColorStop(0, '#e57373');
    grad.addColorStop(0.5, '#c2185b');
    grad.addColorStop(1, '#880e4f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Draw tongue / mucosa simulation
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.ellipse(320, 280, 180, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // High frequency texture (folds, papillae)
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const x = 200 + Math.random() * 240;
      const y = 200 + Math.random() * 140;
      ctx.arc(x, y, 4 + Math.random() * 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Teeth simulation
    ctx.fillStyle = '#fff9c4';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(200 + i * 30, 140, 24, 30);
    }

    if (blurry) {
      // Apply blur by downscaling and upscaling or canvas filter
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = 640;
      blurCanvas.height = 480;
      const bCtx = blurCanvas.getContext('2d');
      if (bCtx) {
        bCtx.filter = 'blur(10px)';
        bCtx.drawImage(canvas, 0, 0);
        processCanvasImage(blurCanvas);
        return;
      }
    }

    processCanvasImage(canvas);
  };

  // Retake
  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setQualityReport(null);
  };

  // Save to IndexedDB
  const handleSave = async (forceLowQuality = false) => {
    if (!capturedBlob || !capturedDataUrl) return;

    try {
      const id = 'img_' + Date.now();
      const newImg: CapturedImage = {
        id,
        screeningId: screeningIdParam || undefined,
        selfExamId: selfExamIdParam || undefined,
        blob: capturedBlob,
        thumbnail: capturedDataUrl,
        timestamp: new Date(),
        qualityPassed: qualityReport?.overallPass ?? false,
        qualityScore: qualityReport?.blurScore,
        site: selectedSite,
        isLowQuality: forceLowQuality || !(qualityReport?.overallPass ?? true),
      };

      await db.images.add(newImg);
      showToast(lang === 'kn' ? 'ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : 'Image successfully saved locally!', 'success');
      loadRecent();

      if (screeningIdParam) {
        navigate(`/screen?attachedImageId=${id}`);
      } else {
        handleRetake();
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'kn' ? 'ಚಿತ್ರ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ.' : 'Failed to save image.', 'error');
    }
  };

  return (
    <Layout title={t('captureTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Header / Intro */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium"
          >
            <ArrowLeft size={18} />
            {t('back')}
          </button>
          <ReadAloudBtn
            text={
              lang === 'kn'
                ? 'ಬಾಯಿ ಚಿತ್ರ ತೆಗೆಯಲು ಮಾರ್ಗದರ್ಶನ. ಕ್ಯಾಮೆರಾವನ್ನು ಸ್ಥಿರವಾಗಿ ಹಿಡಿದುಕೊಳ್ಳಿ.'
                : 'Smart Capture Guard oral imaging with real-time blur, lighting, and tissue checks.'
            }
          />
        </div>

        {/* Oral Site Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('selectSite')} ({lang === 'kn' ? 'ಭಾಗ ಆಯ್ಕೆ' : 'Target Site'})
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ORAL_SITES.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site.id)}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                  selectedSite === site.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                }`}
              >
                {lang === 'kn' ? site.labelKn : site.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport: Camera / Captured View */}
        <Card className="overflow-hidden p-0 relative border-2 border-teal-500/20">
          {!capturedDataUrl ? (
            <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Anatomical Camera Guide Overlay */}
              <div className="camera-overlay flex flex-col items-center justify-center p-4">
                <div className="w-52 h-64 border-2 border-dashed border-teal-400/80 rounded-full flex flex-col items-center justify-between py-6 px-3 bg-teal-900/10 backdrop-blur-[1px]">
                  <span className="text-[10px] font-bold text-teal-200 bg-black/60 px-2 py-0.5 rounded-full">
                    {lang === 'kn' ? 'ಅಂಗುಳ / ಗಂಟಲು' : 'Palate / Throat'}
                  </span>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white bg-teal-700/80 px-2.5 py-1 rounded-full shadow">
                      {ORAL_SITES.find((s) => s.id === selectedSite)?.labelEn || selectedSite}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-200 bg-black/60 px-2 py-0.5 rounded-full">
                    {lang === 'kn' ? 'ನಾಲಿಗೆ / ಕೆಳ ತುಟಿ' : 'Tongue / Lower Lip'}
                  </span>
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-gray-900/90 text-white p-6 flex flex-col items-center justify-center text-center gap-3">
                  <AlertTriangle className="text-amber-400" size={36} />
                  <p className="text-sm">{cameraError}</p>
                  <button onClick={startCamera} className="btn-secondary text-xs py-1.5 px-3">
                    <RefreshCw size={14} className="inline mr-1" /> {t('retake')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
              <img src={capturedDataUrl} alt="Captured" className="w-full h-full object-contain" />
              {qualityReport && (
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1 ${
                      qualityReport.overallPass ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {qualityReport.overallPass ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {qualityReport.overallPass ? t('passed') : t('failed')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Bar Under Viewport */}
          <div className="p-4 bg-white dark:bg-gray-800 flex items-center justify-around gap-2">
            {!capturedDataUrl ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                  title={t('uploadImage')}
                >
                  <Upload size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={takePhoto}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-white flex items-center justify-center">
                    <Camera size={26} />
                  </div>
                </button>

                <button
                  onClick={startCamera}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                  title="Switch / Reset"
                >
                  <RefreshCw size={20} />
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <button onClick={handleRetake} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2.5">
                  <RefreshCw size={16} />
                  {t('retake')}
                </button>

                {qualityReport?.overallPass ? (
                  <button onClick={() => handleSave(false)} className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5">
                    <CheckCircle2 size={16} />
                    {t('saveImage')}
                  </button>
                ) : (
                  <button onClick={() => handleSave(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-xl flex-1 text-xs flex items-center justify-center gap-1">
                    <AlertTriangle size={14} />
                    {t('saveAnyway')}
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Quality Guard Report Card */}
        {qualityReport && (
          <Card className="space-y-3 border-l-4 border-l-teal-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                {t('qualityCheck')}
              </h3>
              <span className={`text-xs font-bold ${qualityReport.overallPass ? 'text-green-600' : 'text-red-500'}`}>
                {qualityReport.overallPass
                  ? (lang === 'kn' ? 'ಗುಣಮಟ್ಟ ಸರಿಹೊಂದಿದೆ' : 'Optimal for Review')
                  : (lang === 'kn' ? 'ಗುಣಮಟ್ಟ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯ' : 'Quality Issues Detected')}
              </span>
            </div>

            {/* 1. Blur Check */}
            <div className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {qualityReport.blurPass ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between font-semibold">
                  <span>{t('blur')} (Sharpness)</span>
                  <span>Score: {qualityReport.blurScore} (Min: 65)</span>
                </div>
                {!qualityReport.blurPass && (
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">{t('blurMessage')}</p>
                )}
              </div>
            </div>

            {/* 2. Lighting Check */}
            <div className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {qualityReport.lightingPass ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between font-semibold">
                  <span>{t('lighting')} (Exposure)</span>
                  <span>Brightness: {qualityReport.lightingScore}/255</span>
                </div>
                {!qualityReport.lightingPass && (
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">{t('lightingMessage')}</p>
                )}
              </div>
            </div>

            {/* 3. Usability / Oral Pink Content Check */}
            <div className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {qualityReport.oralPass ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between font-semibold">
                  <span>{t('usability')}</span>
                  <span>Oral Content: {qualityReport.oralContentScore}% (Min: 6%)</span>
                </div>
                {!qualityReport.oralPass && (
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">{t('usabilityMessage')}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Demo Mode Section */}
        <Card className="bg-gradient-to-r from-teal-50 to-coral-50 dark:from-teal-950/20 dark:to-coral-950/20 border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-teal-600" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
              {t('demoMode')} (Live Test Bench)
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            {lang === 'kn'
              ? 'ಕ್ಯಾಮರಾ ಇಲ್ಲದೆ ಗುಣಮಟ್ಟದ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಲು ಮಾದರಿ ಚಿತ್ರಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ.'
              : 'Test blur and lighting validation logic live using generated oral tissue samples.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => loadDemoSample(false)}
              className="py-2 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 border border-teal-300 shadow-xs hover:bg-teal-50"
            >
              ✅ {t('clearSample')}
            </button>
            <button
              onClick={() => loadDemoSample(true)}
              className="py-2 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 text-coral-600 dark:text-coral-400 border border-coral-300 shadow-xs hover:bg-coral-50"
            >
              ⚠️ {t('blurrySample')}
            </button>
          </div>
        </Card>

        {/* Recent Local Captures */}
        {recentImages.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} />
              {lang === 'kn' ? 'ಸ್ಥಳೀಯ ಗ್ಯಾಲರಿ' : 'Recently Saved Captures'}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {recentImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100">
                  <img src={img.thumbnail} alt="Oral site" className="w-full h-full object-cover" />
                  <span className={`absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${img.qualityPassed ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}`}>
                    {img.site || 'Mouth'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
