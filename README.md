# Niramaya — browser-only anaemia screening decision-support aid

## Brand options

1. **Niramaya** (selected) — “A clearer next step.” Draws on *nirāmaya*, meaning free from illness/well-being; easy to say and not a government scheme name.
2. **RaktaSetu** — “A bridge from screening to care.” Suggests a practical connection between a first check and follow-up.
3. **Sahaaya** — “Support for the next step.” Short, warm, and grounded in the idea of assistance.

Niramaya is used throughout this prototype. It is a screening support tool, not a diagnostic device. No performance or clinical accuracy claim is made for the included demo estimator.

## Project tree

```text
backend/
  app/main.py                 FastAPI API, image features and SQLite audit log
  training/features.py        Shared ROI and six-feature definition
  training/train.py           Patient-grouped 5-fold Ridge training/export
  tests/test_core.py          Zone, bands, quality and feature parity tests
  requirements.txt
  Dockerfile
src/main.jsx                  React screens and PWA interface
src/style.css                 Responsive light/dark styles and reduced motion
public/manifest.webmanifest   Installable app metadata
public/sw.js                  Offline app-shell cache
docker-compose.yml
index.html, package.json, vite.config.js
```

## Run locally (client-only)

Requires Node 18+. The user-facing app has no runtime API or server dependency. Photo checks and the explicitly untrained demo estimate run in the browser; screening metadata and lab follow-up values stay in that browser's local storage. Images are processed in memory and never written to storage.

```bash
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally http://localhost:5173). The browser must be served on localhost or HTTPS for camera/PWA features. Records belong to this browser profile and are not synchronized or encrypted. Clearing this browser's site data removes them. Do not enter identifying information on shared devices.

## WHO thresholds

The displayed thresholds (g/dL) follow the values in the brief: child 6–59 months 11/10/7, child 5–11 years 11.5/11/8, age 12–14 years 12/11/8, non-pregnant woman 12/11/8, pregnant woman 11/10/7, man 13/11/8 (anaemia/moderate/severe). **Verify against latest WHO guidance and applicable local protocols before use.** Age/sex/pregnancy-specific interpretation and altitude or other adjustments are not implemented.

## Optional research trainer

No dataset or trained model is bundled. Use only a dataset whose license, consent, image provenance, patient-level identifiers, and laboratory Hb labels are suitable for your research. A CSV must include `image_path,patient_id,hb`; paths must resolve in the training environment. On Colab, upload the dataset and script, install `pandas scikit-learn pillow numpy`, then run:

```bash
cd backend/training
python train.py --csv /content/labels.csv --out ../model.json
```

The trainer uses 5-fold `GroupKFold` by patient ID and exports ridge coefficients, error interval, and held-out metrics. It requires at least five distinct patients. Review label quality, leakage, site/device variation, subgroup sample sizes, calibration, and prospective safety before interpreting metrics. AUROC uses the trainer's fixed 12 g/dL analysis threshold and is not a clinical performance claim. The subgroup table remains explicitly unreported until a sound subgroup evaluation is added.

The current client-only UI always uses the explicitly untrained demo estimator. Loading and using a trained model in the browser has not been implemented; exported coefficients are for research and parity work only.

The ROI is normalized `(0.20, 0.35, 0.60, 0.40)`. Feature order: normalized mean R, G, B followed by R/(G+1e-6), R/(B+1e-6), G/(B+1e-6). The backend and trainer share this contract and a parity test guards it.

## Deployment outline

- **Frontend:** deploy the repository to Vercel or Netlify with build command `npm run build` and publish directory `dist`. Configure SPA fallback to `/index.html` and serve over HTTPS. No API origin or backend deployment is needed for this client-only version.
- Free-tier limits and deployment settings change; check the host's current documentation. Add authentication, authorization, encryption, retention controls, operational monitoring, and local clinical governance before handling real records.

## Optional API reference

- The `backend/` directory is a standalone prototype/reference API and is not used by the client-only UI. Its quality endpoint checks sharpness, brightness, glare and coarse tissue-colour. Tissue detection is only a weak colour proxy.
- `POST /api/screen`: consented photo, group and symptoms; applies the quality gate, estimate, interval, zone, and audit log.
- `GET/PUT /api/model`, `GET /api/logs`, `POST /api/logs/{id}/lab`, `GET /api/stats`, `GET /api/groups`, `GET /api/health`.
- Red: danger sign or `(estimate + interval half-width) < threshold`; green: `(estimate - half-width) > threshold`; otherwise amber/abstain. Symptoms apply small heuristic reductions and are not validated.

## Tests and backend reference

`cd backend && pytest` runs the optional Python reference API's tests. The suite covers zone boundaries/danger signs, severity band boundaries, blank-image quality rejection, and backend/trainer feature parity. The offline browser app does not need Python.

## Three-minute demo script

**0:00–0:30** — “Niramaya helps an ANM or ASHA worker structure a screening conversation at a PHC. It is not a diagnostic device. No patient image is retained.” Point out the disclaimer and language controls.

**0:30–1:10** — Select a patient group and village, explain/tick consent, choose a sample eyelid image, and show the quality chips and retake instructions. Explain that the tissue signal is a coarse image check, not anatomical verification.

**1:10–1:50** — Mark a symptom and run the screen. Explain the estimate interval, group threshold, and why an overlapping interval abstains as amber. Show a danger sign forcing urgent red routing. Do not describe the demo heuristic as accurate.

**1:50–2:25** — Show the audit record, add a hypothetical confirmed lab Hb, and open the area dashboard. Explain that summaries are local operations indicators and not population prevalence.

**2:25–3:00** — Open the model card and show “Heuristic demo (NOT trained).” Describe the intended patient-level CV training workflow and say the prototype has no clinical validation. Close with the needed confirmatory test and clinician judgement.

## Eight-slide pitch outline

1. **Need:** rural PHC workers need a clear next action when anaemia is suspected.
2. **Users and setting:** ANM/ASHA/nursing workflow, intermittent connectivity, mobile-first interface.
3. **Solution:** consent, guided conjunctiva photo, quality gate, symptom context, triage zones.
4. **Safety design:** uncertainty interval and abstention, danger signs, referral prompt, confirmatory testing.
5. **Product demo:** screening flow and English/Hindi/Kannada interface.
6. **Technical approach:** browser in-memory image processing, six colour features, local audit trail, optional patient-grouped research validation path.
7. **Evidence and limits:** no bundled trained model; dataset suitability, subgroup fairness and clinical validity are open questions.
8. **Next steps:** partner with clinicians/PHCs, ethically sourced multi-site data, prospective evaluation, privacy/security/governance review.

## Limitations, risks and future scope

- The browser estimator is deliberately labelled **heuristic demo (NOT trained)**. A numerical output from it has no measured accuracy; do not use it for care decisions.
- Even a fitted six-feature ridge model is sensitive to phone camera, lighting, focus, skin/tissue appearance, image framing, and population differences. The API's “looks like tissue” check is a rough colour heuristic.
- The training script assumes dataset quality and patient IDs are trustworthy. A five-fold result from a small dataset is unstable; no prospective or clinical validation is provided. Fairness metrics are not computed.
- WHO thresholds in the UI must be verified against current guidance and local protocols. Severity bands here are simplified and do not implement all clinical modifiers.
- Symptom adjustments and interval width are demonstrative heuristics until independently justified and calibrated. The zone is decision support only; danger signs require clinical assessment.
- The client-only prototype has no user authentication, encrypted storage, retention/deletion controls, sync, or production monitoring. Browser local storage is readable by anyone with access to the device profile. Village, symptom, and screening metadata can be sensitive even without images.
- Future work: usability studies with frontline workers, legitimate consented and diverse paired image/lab datasets, locked external validation, subgroup fairness and calibration, clinical oversight, privacy/security review, local-language review, offline data sync safeguards, and regulated deployment assessment.
