# AI Act Compass

> Bilingual (EN / FR) qualification tool for **Regulation (EU) 2024/1689** — the EU AI Act.
> Walk through seven guided steps, get a motivated risk-tier verdict, a 30-day quickwin plan, and a printable compliance roadmap mapped to **ISO/IEC 42001:2023 (AIMS)** and **ISO/IEC 27090:2025 (AI cybersecurity)**.

![status](https://img.shields.io/badge/status-decision--support-CC785C?style=flat-square)
![regulation](https://img.shields.io/badge/Regulation-(EU)%202024%2F1689-1A1915?style=flat-square)
![iso](https://img.shields.io/badge/anchor-ISO%2FIEC%2042001%20%2B%2027090-6E6A60?style=flat-square)

---

## What it does

Given an AI system, in seven guided steps the tool determines whether it is:

- **Prohibited practice** — Article 5
- **High-risk (product pathway)** — Article 6(1) + Annex I
- **High-risk (Annex III pathway)** — Article 6(2) + Annex III, with art. 6(3)/(4) exceptions analysis
- **Limited risk** — Article 50 transparency triggers
- **Minimal risk** — out of specific regime
- **GPAI** standard or with systemic risk — Articles 51–55

For each verdict it outputs:

- A motivated regulatory **justification** (article-by-article)
- Three **30-day quickwins**
- A pillar-by-pillar **compliance checklist** (mapped to ISO 42001 / 27090)
- The applicable **regulatory timeline**
- A printable / PDF report

> **Decision-support only.** Final qualification requires qualified legal counsel and, for most high-risk systems, conformity assessment by a notified body (art. 43). This output is non-binding.

---

## Tech

- **React 18** + **Vite** + Tailwind (Play CDN)
- **Fraunces** variable serif + **JetBrains Mono** — editorial-juridical typography
- **html2pdf.js** + **jsPDF** — client-side PDF export with a dedicated print template (see `buildPrintHTML` in `ai-act-compass.jsx`)
- **lucide-react** — icons
- All static, no backend. Runs anywhere that serves static files.

---

## Quickstart

### Local development

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Production build

```bash
npm run build
npm run preview
# → http://localhost:4173
```

### Docker (production-like, port 8080)

```bash
docker compose up --build
# → http://localhost:8080
```

Or directly:

```bash
docker build -t ai-act-compass .
docker run --rm -p 8080:80 ai-act-compass
```

The image is multi-stage (Node 20 build → nginx 1.27 alpine runtime), ~30 MB final size, with a SPA-aware nginx config (`nginx.conf`), gzip, immutable cache for hashed assets, no-cache for `index.html`, and a `/health` endpoint for liveness probes.

---

## Project layout

```
.
├─ ai-act-compass.jsx     # Main app (~2 200 lines, all i18n + logic + UI)
├─ src/
│  ├─ main.jsx            # React entry
│  └─ design/design.css   # Design tokens (paper / ink / terracotta / risk-tier palette)
├─ index.html             # Vite entry + Tailwind config extension
├─ Dockerfile             # multi-stage build
├─ nginx.conf             # SPA + cache + headers
├─ docker-compose.yml     # local production-like preview
├─ make-demo.cjs          # generates a sub-10 s 1920×1080 MP4 demo (Playwright + ffmpeg)
└─ vite.config.js
```

---

## Design system

Editorial-juridical aesthetic with seven harmonised risk-tier palettes:

| Tier | Accent | Background | Use |
|---|---|---|---|
| Prohibited | `#B5443C` (oxblood) | `#FBE9E5` | Article 5 |
| High-risk | `#CC785C` (terracotta) | `#F8E6DD` | Annex I / III |
| Limited risk | `#C8923A` (ochre) | `#F5E9D2` | Article 50 |
| Minimal risk | `#5A7A4F` (sage) | `#E5EAD9` | out of regime |
| GPAI | `#815B47` (umber) | `#EFE4D8` | Art. 53–54 |
| GPAI / SR | `#5C3F2E` (sepia) | `#E5D6C5` | Art. 51–55 |

All tokens live in `src/design/design.css` as CSS custom properties.

---

## Demo

A 9.9 s · 1920 × 1080 · H.264 walkthrough of the full flow (Welcome → Provider → AI system → Subliminal techniques · Art. 5 → Verdict reveal) is attached to the latest release:

▶ **[Watch / download `linkedin-demo.mp4` (1 MB)](https://github.com/abk1969/ai_act_compass/releases/latest/download/linkedin-demo.mp4)** · also visible on the [release page](https://github.com/abk1969/ai_act_compass/releases/tag/v0.1.0).

To regenerate it after design changes:

```bash
node make-demo.cjs
# → ./linkedin-demo.mp4
```

The script drives Vite + headless Chromium, injects an SVG cursor that follows the mouse, replays the user flow with cinematic pacing, and encodes H.264 30 fps via `ffmpeg-static`. Sub-10 s on purpose — LinkedIn-ready.

---

## Licence

This project is decision-support tooling. Source files are made available for review and pedagogy. Choose a licence and add a `LICENSE` file before redistributing.

Source anchor: [`github.com/abk1969/ai-act-skills`](https://github.com/abk1969/ai-act-skills) v1.2.0.
