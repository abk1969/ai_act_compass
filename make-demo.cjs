/**
 * make-demo.cjs
 * Records a sub-10-second 1920×1080 MP4 demo of AI Act Compass
 * suitable for a LinkedIn post.
 *
 * Flow: Welcome → Start → Provider → AI system → Subliminal → Verdict
 *
 * Steps:
 *   1. Spawns the Vite dev server on :5180
 *   2. Launches Playwright Chromium at 1920×1080 with video recording
 *   3. Injects a fake cursor SVG that tracks mouse moves
 *   4. Drives the app through the flow with deliberate, cinematic pacing
 *   5. Converts the WebM recording to H.264 MP4 via Playwright's bundled ffmpeg
 *   6. Outputs ./linkedin-demo.mp4
 *
 * Run:  node make-demo.cjs
 */

const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ──────────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────────
const PORT = 5180;
const URL  = `http://127.0.0.1:${PORT}/`;
const OUT  = path.join(__dirname, 'linkedin-demo.mp4');
const TMP  = path.join(__dirname, '_demo-tmp');
// Playwright's bundled ffmpeg only encodes VP8/WebM (a stripped build for
// its own video pipeline). For H.264 MP4 we need a full ffmpeg — use the
// `ffmpeg-static` npm package which ships a complete static binary.
const FFMPEG = require('ffmpeg-static');
const VIEWPORT = { width: 1920, height: 1080 };

// ──────────────────────────────────────────────────────────────────────
// 2. Inject a fake cursor that tracks the OS cursor position.
//    Playwright's video recording does NOT capture the OS cursor, so we
//    paint our own SVG arrow that follows mousemove events.
// ──────────────────────────────────────────────────────────────────────
async function injectCursor(page) {
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = '__demo_cursor';
    cursor.innerHTML = `
      <svg width="22" height="26" viewBox="0 0 22 26" xmlns="http://www.w3.org/2000/svg" style="display:block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <path d="M2 1 L19 13 L11.5 14 L14 21 L11 22 L8.5 15 L2 19 Z"
              fill="#FFFFFF" stroke="#1A1915" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
    `;
    cursor.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:22px', 'height:26px',
      'pointer-events:none',
      'z-index:2147483647',
      'transform: translate(-2px, -2px)',
      'will-change: transform',
    ].join(';');
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
    // Pulse ring on click
    document.addEventListener('mousedown', (e) => {
      const ring = document.createElement('div');
      ring.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:2147483646',
        `left:${e.clientX - 18}px`, `top:${e.clientY - 18}px`,
        'width:36px', 'height:36px',
        'border:2px solid #CC785C', 'border-radius:50%',
        'animation: __demo_ring 380ms ease-out forwards',
      ].join(';');
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 400);
    });
    const style = document.createElement('style');
    style.textContent = `
      @keyframes __demo_ring {
        from { transform: scale(0.4); opacity: 0.9; }
        to   { transform: scale(1.4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });
}

// Smooth move + click helper. Steps interpolate the path so the cursor glides.
async function moveAndClick(page, locator, opts = {}) {
  const { hoverMs = 350, steps = 28 } = opts;
  const box = await locator.boundingBox();
  if (!box) throw new Error('locator has no bounding box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps });
  await page.waitForTimeout(hoverMs);
  await locator.click();
}

// ──────────────────────────────────────────────────────────────────────
// 3. Launch the Vite dev server
// ──────────────────────────────────────────────────────────────────────
function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', '--port', String(PORT), '--host', '127.0.0.1'], {
      cwd: __dirname, shell: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let resolved = false;
    proc.stdout.on('data', d => {
      const s = d.toString();
      if (!resolved && /ready in|Local:\s+http/.test(s)) {
        resolved = true;
        // Give Vite a moment to fully bind
        setTimeout(() => resolve(proc), 600);
      }
    });
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('exit', code => { if (!resolved) reject(new Error('dev server exited ' + code)); });
    setTimeout(() => { if (!resolved) reject(new Error('dev server timeout')); }, 30000);
  });
}

// ──────────────────────────────────────────────────────────────────────
// 4. Drive the demo
// ──────────────────────────────────────────────────────────────────────
async function record() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  console.log('→ Launching Chromium 1920×1080 with video recording…');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP, size: VIEWPORT },
  });
  const page = await ctx.newPage();

  console.log('→ Loading app…');
  // domcontentloaded is faster than networkidle (Vite HMR keeps a
  // long-lived ws open which delays networkidle by 500-1000ms).
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(180); // tiny tick for React hydration
  await injectCursor(page);

  // Park the cursor outside the hero so the welcome animations play unobstructed.
  await page.mouse.move(120, 120);
  await page.waitForTimeout(450); // Welcome stagger reveal — quick read

  // ── Start qualification ────────────────────────────────────────────
  const start = page.getByRole('button', { name: /Start qualification|Commencer la qualification/i });
  await moveAndClick(page, start, { hoverMs: 140, steps: 12 });
  await page.waitForTimeout(220);

  // ── Step 1: Provider ──────────────────────────────────────────────
  const provider = page.getByRole('radio', { name: /Provider/i }).first();
  await moveAndClick(page, provider, { hoverMs: 160, steps: 12 });
  await page.waitForTimeout(140);
  const cont1 = page.getByRole('button', { name: /^Continue$|^Continuer$/i });
  await moveAndClick(page, cont1, { hoverMs: 120, steps: 10 });
  await page.waitForTimeout(220);

  // ── Step 2: AI system ─────────────────────────────────────────────
  const aiSys = page.getByRole('radio', { name: /^AI system/i }).first();
  await moveAndClick(page, aiSys, { hoverMs: 160, steps: 12 });
  await page.waitForTimeout(140);
  const cont2 = page.getByRole('button', { name: /^Continue$|^Continuer$/i });
  await moveAndClick(page, cont2, { hoverMs: 120, steps: 10 });
  await page.waitForTimeout(220);

  // ── Step 3: Subliminal techniques (triggers PROHIBITED) ───────────
  const subliminal = page.getByRole('checkbox', { name: /Subliminal or manipulative/i });
  await moveAndClick(page, subliminal, { hoverMs: 200, steps: 14 });
  await page.waitForTimeout(200);
  const verdict = page.getByRole('button', { name: /View verdict|Voir le verdict/i });
  await moveAndClick(page, verdict, { hoverMs: 160, steps: 12 });

  // ── Verdict reveal — the climax. Hold long enough for the eye. ─────
  await page.waitForTimeout(900);

  console.log('→ Closing browser, finalising WebM…');
  await ctx.close();
  await browser.close();

  // Find the recorded WebM
  const webms = fs.readdirSync(TMP).filter(f => f.endsWith('.webm'));
  if (webms.length === 0) throw new Error('no WebM produced');
  return path.join(TMP, webms[0]);
}

// ──────────────────────────────────────────────────────────────────────
// 5. Convert WebM → H.264 MP4 (LinkedIn-ready)
// ──────────────────────────────────────────────────────────────────────
function convertToMp4(webm) {
  if (!FFMPEG) throw new Error('ffmpeg-static binary not resolved');
  // Speed multiplier: source ≈14 s, post-speed ≈9.3 s (sub-10 s for LinkedIn).
  // Tweak SPEED if you want a longer / shorter final clip.
  const SPEED = 1.5;
  const ptsScale = (1 / SPEED).toFixed(4); // setpts factor
  console.log(`→ Converting WebM → MP4 (speed ×${SPEED}) via`, FFMPEG);
  const args = [
    '-y',
    '-i', webm,
    '-filter:v', `setpts=${ptsScale}*PTS`,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-movflags', '+faststart',
    OUT,
  ];
  const r = spawnSync(FFMPEG, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed with code ' + r.status);
}

// ──────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('→ Starting Vite dev server on :' + PORT);
  const dev = await startDevServer();
  try {
    const webm = await record();
    convertToMp4(webm);
    fs.rmSync(TMP, { recursive: true, force: true });
    const stats = fs.statSync(OUT);
    console.log('\n✓ Demo ready:');
    console.log('   ' + OUT);
    console.log('   ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB · 1920×1080 · H.264 30fps');
    console.log('\n→ Drop this file into your LinkedIn post.');
  } finally {
    if (dev && !dev.killed) {
      try { dev.kill(); } catch (_) {}
    }
  }
})().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
