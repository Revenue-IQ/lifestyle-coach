/**
 * Records the Inner Weather demo: drives the local web app in a phone-sized
 * Chromium window, records the screen to build/screen.webm, and writes
 * build/timeline.json with when each scene (and its bubble) starts and ends.
 * compose.mjs turns that into the MP4. The scenes below are the storyboard;
 * storyboard.md describes them in words.
 *
 *   node record.mjs                       full run (two live coach calls)
 *   node record.mjs --stop-before coach   everything up to the coach, no model call
 *   node record.mjs --only steps          test the step ladder on a planted step
 *   node record.mjs --assets-only         redraw bubbles and cards after editing build/timeline.json
 *
 * Needs the API (8787) and the web app (8081) running with AUTH_MODE=dev, and
 * psql on the path to reset the demo account. Nothing here reads api/.env.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..', '..');
const BUILD = path.join(ROOT, 'build');
const WEB = process.env.DEMO_WEB_URL ?? 'http://localhost:8081';
const API = process.env.DEMO_API_URL ?? 'http://localhost:8787';
const EMAIL = process.env.DEMO_EMAIL ?? 'otter@example.com';
const DB = process.env.DATABASE_URL ?? 'postgres://localhost:5432/wellbeing';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] ?? true);
};
const STOP_BEFORE = flag('--stop-before');
const ONLY = flag('--only');
const ASSETS_ONLY = args.includes('--assets-only'); // redraw cards and bubbles from the last timeline, no recording

/** Layout shared with compose.mjs through timeline.json. */
export const LAYOUT = {
  canvas: { width: 1920, height: 1080 },
  phone: { width: 430, height: 932, x: 580, y: 74, radius: 28 },
  bubble: { x: 1070, centerY: 540, maxWidth: 620 },
  colors: { paper: '#FBF8F3', ink: '#1F2933', muted: '#6B7280', line: '#E7E2DA', accent: '#2F855A', card: '#FFFFFF' },
};

const TITLE = { heading: 'Inner Weather', sub: 'For people who feel stuck and want to know where to look first.', seconds: 4.5 };
const CLOSING = {
  heading: 'The rules it keeps',
  lines: [
    'Crisis language gets a plain notice, not a coach reply.',
    'Habits only, from sourced notes.',
    'Nothing is ever taken away.',
  ],
  // The lockup sits where the name was, with the app's own footer line under it.
  foot: 'Not therapy or a diagnosis. In crisis? Call or text 988.',
  seconds: 7,
};
const BRAND = {
  mark: path.join(REPO, 'mobile', 'assets', 'brand', 'mark.svg'),
  lockup: path.join(REPO, 'mobile', 'assets', 'brand', 'lockup.png'),
};

// ---------------------------------------------------------------------------
// Scenes. Each has a bubble (3 to 8 words, one on screen at a time), optional
// `cut` (a white dip hides a page change at the start), and `hold`, the least
// number of seconds the scene lasts so the bubble can be read.
// ---------------------------------------------------------------------------

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** A tappable thing by its name: buttons, and the links the router wraps rows and pills in. */
const btn = (page, name) => {
  const exact = typeof name === 'string';
  // Screens the router keeps mounted behind the current one are hidden, so only visible matches count.
  return page.getByRole('button', { name, exact }).or(page.getByRole('link', { name, exact })).filter({ visible: true });
};

async function tap(page, name, after = 900) {
  await btn(page, name).first().click();
  await pause(after);
}

async function scrollBy(page, dy, after = 700) {
  await page.mouse.move(LAYOUT.phone.width / 2, LAYOUT.phone.height / 2);
  await page.mouse.wheel(0, dy);
  await pause(after);
}

/** Type like a person: a short pause after each key. */
async function type(locator, text) {
  await locator.click();
  await locator.pressSequentially(text, { delay: 55 });
}

const SCENES = [
  // --- What's bugging you -------------------------------------------------
  {
    id: 'bugging-1', flow: 'bugging', cut: true, hold: 4.5,
    bubble: 'It starts with how you feel',
    async run(page) {
      await page.goto(`${WEB}/`);
      await page.getByText('How have you been feeling?').filter({ visible: true }).first().waitFor({ timeout: 90_000 });
      await pause(400);
    },
  },
  {
    id: 'bugging-2', hold: 6,
    bubble: 'Tap whatever fits. No account yet.',
    async run(page) {
      await pause(800);
      await tap(page, 'Tired all the time', 700);
      await tap(page, "Can't sleep well", 700);
      await tap(page, 'Stressed or worried a lot', 900);
    },
  },
  {
    id: 'bugging-3', hold: 6.5,
    bubble: 'Then what your days are like',
    async run(page) {
      await tap(page, 'Next', 1200);
      await tap(page, 'On my phone late at night', 700);
      await tap(page, 'Lots of coffee or sugar', 700);
      await tap(page, 'Work never really stops', 900);
    },
  },
  {
    id: 'where-to-look', hold: 7,
    bubble: 'Where to look first, not a verdict',
    async run(page) {
      await tap(page, 'Show me where to look', 600);
      await page.getByText('Where to look first').filter({ visible: true }).first().waitFor();
      await pause(600);
    },
  },

  // --- Sign in --------------------------------------------------------------
  {
    id: 'sign-in', flow: 'sign-in', hold: 6.5,
    bubble: 'Only an email. No real name.',
    async run(page) {
      await tap(page, 'Save this and keep going', 900);
      const input = page.getByPlaceholder('you@example.com');
      await input.waitFor();
      await type(input, EMAIL);
      await pause(500);
    },
  },
  {
    id: 'first-points', hold: 5.5,
    bubble: 'First points, straight away',
    async run(page) {
      await tap(page, 'Continue', 300);
      await page.getByText('Hello there').filter({ visible: true }).first().waitFor({ timeout: 30_000 });
      await page.getByText(/\+20 points/).filter({ visible: true }).first().waitFor({ timeout: 15_000 }).catch(() => {});
      await pause(300);
    },
  },

  // --- Name and About you ----------------------------------------------------
  {
    id: 'name', flow: 'profile', hold: 6.5,
    bubble: 'Any name you like',
    async run(page) {
      await pause(1800);
      await tap(page, /^Name/, 1000);
      await page.getByText('Pick a name').filter({ visible: true }).first().waitFor();
      await tap(page, 'Pick one for me', 1300);
      await tap(page, 'Save', 300);
      await page.getByText(/^Hello, /).filter({ visible: true }).first().waitFor();
      await pause(400);
    },
  },
  {
    id: 'about-you', hold: 6.5,
    bubble: 'Every question says why it asks',
    async run(page) {
      await pause(1500);
      await tap(page, /^About you/, 1000);
      await page.getByText('A bit about you').filter({ visible: true }).first().waitFor();
      await pause(900);
      await type(page.locator('input').first(), '34');
      await pause(700);
      await tap(page, 'Save', 600);
    },
  },
  {
    id: 'skip', hold: 6,
    bubble: 'Skipping costs nothing',
    async run(page) {
      await pause(1200);
      await tap(page, 'Skip', 1200); // sex
      await tap(page, 'Skip', 1200); // weight
      await tap(page, 'Skip and finish', 300); // activity level
      await page.getByText(/^Hello, /).filter({ visible: true }).first().waitFor();
      await pause(300);
    },
  },

  // --- Two-week check-in (WHO-5) ------------------------------------------------
  {
    id: 'who5', flow: 'who5', hold: 9,
    bubble: 'Five questions about the last two weeks',
    async run(page) {
      await pause(1200);
      await tap(page, /^Two weeks/, 1000);
      await page.getByText('Two-week check-in').filter({ visible: true }).first().waitFor();
      await pause(1000);
      for (const answer of ['Most of the time', 'More than half of the time', 'Less than half of the time', 'Some of the time']) {
        await tap(page, answer, 1100);
      }
      await tap(page, 'More than half of the time', 800);
    },
  },
  {
    id: 'who5-score', hold: 6.5,
    bubble: 'Your starting line, out of 100',
    async run(page) {
      await tap(page, 'See my score', 300);
      await page.getByText('Your starting line').filter({ visible: true }).first().waitFor({ timeout: 20_000 });
      await pause(400);
    },
  },

  // --- Today ----------------------------------------------------------------------
  {
    id: 'today', flow: 'today', hold: 7,
    bubble: 'Two taps for today',
    async run(page) {
      await tap(page, 'Home', 300);
      await page.getByText(/^Hello, /).filter({ visible: true }).first().waitFor();
      await pause(1200);
      await tap(page, /^Right now/, 1000);
      await page.getByText('How are you right now?').filter({ visible: true }).first().waitFor();
      await pause(700);
      await btn(page, '4').nth(0).click();
      await pause(900);
      await btn(page, '3').nth(1).click();
      await pause(900);
      await tap(page, 'Save', 300);
      await page.getByText(/^Hello, /).filter({ visible: true }).first().waitFor();
    },
  },

  // --- Home: the picture so far -------------------------------------------------
  {
    id: 'home-picture', flow: 'home', hold: 5,
    bubble: 'Your picture so far',
    async run(page) {
      await pause(1400);
    },
  },
  {
    id: 'home-points', hold: 5,
    bubble: 'Points and levels. No streaks.',
    async run(page) {
      await pause(500);
    },
  },
  {
    id: 'home-look', hold: 5.5,
    bubble: 'Worth a look comes first',
    async run(page) {
      await scrollBy(page, 200, 900);
    },
  },
  {
    id: 'home-rest', hold: 5,
    bubble: 'Everything else waits quietly',
    async run(page) {
      await scrollBy(page, 400, 900);
    },
  },

  // --- Rating an area ----------------------------------------------------------------
  {
    id: 'area-open', flow: 'rate', hold: 6,
    bubble: 'Each area has a short questionnaire',
    async run(page) {
      await scrollBy(page, -1200, 600);
      await tap(page, /^Sleep/, 400);
      await page.getByText('Not rated yet').filter({ visible: true }).first().waitFor();
      await pause(1600);
      await tap(page, /^Rate it/, 400);
      await page.getByText('How it usually is').filter({ visible: true }).first().waitFor();
    },
  },
  {
    id: 'rate-answers', hold: 10,
    bubble: 'Honest answers, any of them skippable',
    async run(page) {
      await pause(1400);
      await tap(page, '5 to 6', 1200);
      await tap(page, 'They drift by an hour or two', 1200);
      await tap(page, '20 to 40 minutes', 1200);
      await tap(page, 'Skip', 1200); // phone in bed: skipped on purpose
      await tap(page, 'Most days', 1200);
      await tap(page, 'Groggy for a while', 1200);
      await tap(page, 'Several nights a week', 900);
    },
  },
  {
    id: 'rating', hold: 8,
    bubble: 'A rating out of 100, gaps named',
    async run(page) {
      await tap(page, 'See my rating', 300);
      await page.getByText('Where the points went').filter({ visible: true }).first().waitFor({ timeout: 20_000 });
      await pause(400);
    },
  },

  // --- Coach ---------------------------------------------------------------------------
  {
    id: 'gates', flow: 'coach', hold: 6.5,
    bubble: 'Two safety questions, asked once',
    async run(page) {
      await tap(page, /^Open Sleep/, 400);
      await page.getByText("What's pulling it down").filter({ visible: true }).first().waitFor();
      await pause(1800);
      await tap(page, 'Talk it through with the coach', 400);
      await page.getByText('Before we start').filter({ visible: true }).first().waitFor();
      await pause(1200);
      await tap(page, 'Yes', 900);
    },
  },
  {
    id: 'coach-opens', hold: 9,
    bubble: 'The coach speaks first',
    async run(page) {
      await tap(page, 'Continue', 300);
      // The opening message is a live model call; it can take a while.
      await page.getByPlaceholder('Say what you like...').waitFor({ timeout: 120_000 });
      await pause(600);
    },
  },
  {
    id: 'coach-knows', hold: 5.5,
    bubble: 'It already knows your rating',
    async run(page) {
      await pause(500);
    },
  },
  {
    id: 'reply', hold: 6,
    bubble: 'Reply in your own words',
    async run(page) {
      const input = page.getByPlaceholder('Say what you like...');
      await type(input, 'Caffeine, probably. I have coffee most afternoons. Can you add a step for stopping it after lunch?');
      await pause(500);
      await tap(page, 'Send', 300);
    },
  },
  {
    id: 'proposal', hold: 4.5,
    bubble: 'One small step, not a plan',
    async run(page, ctx) {
      // Wait for the reply; if the coach asked a question instead of proposing, one more turn.
      let proposed = await waitForProposal(page);
      if (!proposed) {
        ctx.extraCalls += 1;
        await type(page.getByPlaceholder('Say what you like...'), 'Yes, please add that as my step.');
        await tap(page, 'Send', 300);
        proposed = await waitForProposal(page);
      }
      if (!proposed) throw new Error('The coach did not propose a step');
      await pause(500);
    },
  },
  {
    id: 'sources', hold: 4,
    bubble: 'Sources under every message',
    async run(page) {
      await pause(300);
    },
  },
  {
    id: 'make-step', hold: 6,
    bubble: 'One tap makes it your step',
    async run(page) {
      await pause(1800);
      await tap(page, 'Make it my step', 300);
      await page.getByText('This is your step now').filter({ visible: true }).first().waitFor({ timeout: 20_000 });
      await pause(400);
    },
  },

  // --- Steps ------------------------------------------------------------------------------
  {
    id: 'step-log', flow: 'steps', hold: 9,
    bubble: 'Did it. Counted, never dated.',
    async run(page) {
      await tap(page, 'Back', 400);
      await page.getByText('Your step right now').filter({ visible: true }).first().waitFor();
      await pause(1800);
      await tap(page, /^Did it/, 1800);
      await tap(page, /^Did it/, 1800);
    },
  },
  {
    id: 'did-it-help', hold: 6.5,
    bubble: 'After three, one honest question',
    async run(page) {
      await tap(page, /^Did it/, 400);
      await page.getByText('Did it help?').filter({ visible: true }).first().waitFor({ timeout: 20_000 });
      await pause(1800);
      await tap(page, 'A bit', 400);
      await page.getByText(/^Keep going/).filter({ visible: true }).first().waitFor();
    },
  },
  {
    id: 'ladder', hold: 6.5,
    bubble: 'Three, then seven, then twenty-one',
    async run(page) {
      await pause(1800);
      await tap(page, /^Keep going/, 400);
      await page.getByText(/rung 2/).filter({ visible: true }).first().waitFor({ timeout: 20_000 });
      await pause(600);
    },
  },
  {
    id: 'home-steps', hold: 6,
    bubble: 'Nothing is ever taken away',
    async run(page) {
      await tap(page, 'Home', 300);
      await page.getByText('Your steps').filter({ visible: true }).first().waitFor();
      await pause(500);
    },
  },
];

/** Waits until the coach stopped thinking, then says whether a step is on offer. */
async function waitForProposal(page) {
  await page.getByText('thinking...').filter({ visible: true }).first().waitFor({ timeout: 5_000 }).catch(() => {});
  await page.getByText('thinking...').filter({ visible: true }).first().waitFor({ state: 'hidden', timeout: 120_000 });
  await pause(800);
  return (await btn(page, 'Make it my step').count()) > 0;
}

// ---------------------------------------------------------------------------

function resetDemoAccount() {
  const sql = `delete from users where clerk_user_id = 'dev_${EMAIL.replace(/'/g, "''")}'`;
  execFileSync('psql', [DB, '-q', '-c', sql], { stdio: 'inherit' });
}

/** For --only steps: a planted active step so the ladder can be exercised without the coach. */
function plantStep() {
  const sql = `insert into steps (user_id, area, title, why, target_count)
    select id, 'sleep', 'Last coffee before lunch', 'Half of an afternoon coffee is still in you at bedtime.', 3
    from users where clerk_user_id = 'dev_${EMAIL}'`;
  execFileSync('psql', [DB, '-q', '-c', sql], { stdio: 'inherit' });
}

async function checkServers() {
  for (const [name, url] of [['API', `${API}/health`], ['web app', WEB]]) {
    const ok = await fetch(url).then((r) => r.ok).catch(() => false);
    if (!ok) throw new Error(`The ${name} is not answering at ${url}. Start it first (npm run api / npm run web).`);
  }
}

async function main() {
  if (ASSETS_ONLY) {
    const saved = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
    const browser = await chromium.launch();
    await renderAssets(browser, saved.scenes);
    await browser.close();
    console.log(`Redrew ${saved.scenes.length} bubbles and the cards.`);
    return;
  }
  await checkServers();
  fs.mkdirSync(BUILD, { recursive: true });
  resetDemoAccount();

  let scenes = SCENES;
  if (STOP_BEFORE) {
    const i = scenes.findIndex((s) => s.id === STOP_BEFORE || s.flow === STOP_BEFORE);
    if (i === -1) throw new Error(`No scene or flow called ${STOP_BEFORE}`);
    scenes = scenes.slice(0, i);
  }
  if (ONLY === 'steps') {
    // Sign in through the API once so the user row exists, plant the step, then run only the step scenes.
    await fetch(`${API}/api/me`, { headers: { 'x-dev-user-id': EMAIL } });
    plantStep();
    scenes = [
      {
        id: 'steps-setup', flow: 'steps', cut: true, hold: 1,
        bubble: 'Test run',
        async run(page) {
          await page.goto(`${WEB}/sign-in`);
          const input = page.getByPlaceholder('you@example.com');
          await input.waitFor({ timeout: 90_000 });
          await input.fill(EMAIL);
          await tap(page, 'Continue', 300);
          await page.getByText('Hello there').filter({ visible: true }).first().waitFor({ timeout: 30_000 });
          await tap(page, /^Sleep/, 400);
        },
      },
      ...SCENES.filter((s) => ['step-log', 'did-it-help', 'ladder', 'home-steps'].includes(s.id)).map((s) =>
        s.id === 'step-log' ? { ...s, run: async (page) => { await page.getByText('Your step right now').filter({ visible: true }).first().waitFor(); await tap(page, /^Did it/, 1500); await tap(page, /^Did it/, 1500); } } : s,
      ),
    ];
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: LAYOUT.phone.width, height: LAYOUT.phone.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: BUILD, size: { width: LAYOUT.phone.width, height: LAYOUT.phone.height } },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  // Sync marker: a black page that turns white the moment the clock starts.
  // compose.mjs finds that flash in the recording and lines the timeline up with it.
  await page.setContent('<html><body style="margin:0;background:#000"></body></html>');
  await pause(1500);
  const t0 = Date.now();
  await page.evaluate(() => { document.body.style.background = '#fff'; });
  const now = () => (Date.now() - t0) / 1000;
  const ctx = { extraCalls: 0 };
  const timeline = [];

  try {
    for (const scene of scenes) {
      const start = now();
      process.stdout.write(`${start.toFixed(1).padStart(6)}s  ${scene.id}\n`);
      await scene.run(page, ctx);
      const minEnd = start + (scene.hold ?? 4.5);
      if (now() < minEnd) await pause((minEnd - now()) * 1000);
      timeline.push({ id: scene.id, bubble: scene.bubble, flow: scene.flow ?? null, cut: !!scene.cut, start, end: now() });
    }
    await pause(1200);
  } catch (err) {
    await page.screenshot({ path: path.join(BUILD, 'failed.png') }).catch(() => {});
    throw err;
  } finally {
    const closedAt = now();
    const video = page.video();
    await context.close();
    const recorded = await video.path();
    fs.renameSync(recorded, path.join(BUILD, 'screen.webm'));
    fs.writeFileSync(
      path.join(BUILD, 'timeline.json'),
      JSON.stringify({ layout: LAYOUT, title: TITLE, closing: CLOSING, email: EMAIL, closedAt, scenes: timeline, extraCoachCalls: ctx.extraCalls }, null, 2),
    );
    await renderAssets(browser, timeline);
    await browser.close();
  }
  const calls = scenes.some((s) => s.id === 'coach-opens') ? 2 + ctx.extraCalls : 0;
  console.log(`\nRecorded ${timeline.length} scenes, ${timeline.at(-1)?.end.toFixed(0) ?? 0}s of screen, ${calls} live coach call(s).`);
}

// ---------------------------------------------------------------------------
// Still assets, drawn by the same browser so they use the app's typeface:
// the title and closing cards, the phone frame, and one PNG per bubble.
// ---------------------------------------------------------------------------

function fontFace(weight, file) {
  const p = path.join(REPO, 'node_modules', '@expo-google-fonts', 'geist', file, `Geist_${file}.ttf`);
  const b64 = fs.readFileSync(p).toString('base64');
  return `@font-face { font-family: Geist; font-weight: ${weight}; src: url(data:font/ttf;base64,${b64}) format('truetype'); }`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function baseCss() {
  const c = LAYOUT.colors;
  return `
    ${fontFace(500, '500Medium')} ${fontFace(600, '600SemiBold')}
    * { box-sizing: border-box; margin: 0; }
    html, body { background: transparent; font-family: Geist, sans-serif; color: ${c.ink}; -webkit-font-smoothing: antialiased; }
    .card { width: ${LAYOUT.canvas.width}px; height: ${LAYOUT.canvas.height}px; background: ${c.paper}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 200px; }
    .kicker { color: ${c.accent}; font-weight: 600; font-size: 30px; letter-spacing: 0.02em; margin-bottom: 28px; }
    h1 { font-weight: 600; font-size: 96px; letter-spacing: -0.02em; margin-bottom: 30px; }
    h2 { font-weight: 600; font-size: 64px; letter-spacing: -0.02em; margin-bottom: 44px; }
    .sub { color: ${c.muted}; font-weight: 500; font-size: 38px; line-height: 1.4; max-width: 1200px; }
    .lines { display: flex; flex-direction: column; gap: 26px; }
    .lines div { font-weight: 500; font-size: 42px; line-height: 1.35; }
    .mark { width: 160px; height: 160px; margin-bottom: 30px; }
    .lockup { width: 450px; height: auto; margin-top: 60px; }
    .foot { color: ${c.muted}; font-weight: 500; font-size: 26px; margin-top: 22px; }
    .bubble { display: inline-block; max-width: ${LAYOUT.bubble.maxWidth}px; background: ${c.card}; border: 1px solid ${c.line}; border-radius: 26px; padding: 24px 32px; font-weight: 500; font-size: 36px; line-height: 1.3; box-shadow: 0 10px 34px rgba(31, 41, 51, 0.08); }
    .frame { position: absolute; left: ${LAYOUT.phone.x}px; top: ${LAYOUT.phone.y}px; width: ${LAYOUT.phone.width}px; height: ${LAYOUT.phone.height}px; border-radius: ${LAYOUT.phone.radius}px; border: 1px solid ${c.line}; box-shadow: 0 30px 80px rgba(31, 41, 51, 0.16), 0 0 0 3000px ${c.paper}; }
  `;
}

async function renderAssets(browser, timeline) {
  const page = await browser.newPage({ viewport: LAYOUT.canvas, deviceScaleFactor: 1 });
  const css = baseCss();
  const shot = async (html, file, selector) => {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const target = selector ? page.locator(selector) : page;
    await target.screenshot({ path: path.join(BUILD, file), omitBackground: true });
  };

  const mark = `<img class="mark" alt="" src="data:image/svg+xml;base64,${fs.readFileSync(BRAND.mark).toString('base64')}">`;
  const lockup = `<img class="lockup" alt="Inner Weather" src="data:image/png;base64,${fs.readFileSync(BRAND.lockup).toString('base64')}">`;
  await shot(`<div class="card">${mark}<h1>${esc(TITLE.heading)}</h1><div class="sub">${esc(TITLE.sub)}</div></div>`, 'title.png');
  await shot(
    `<div class="card"><h2>${esc(CLOSING.heading)}</h2><div class="lines">${CLOSING.lines.map((l) => `<div>${esc(l)}</div>`).join('')}</div>${lockup}<div class="foot">${esc(CLOSING.foot)}</div></div>`,
    'closing.png',
  );
  await shot(`<div style="position:relative;width:${LAYOUT.canvas.width}px;height:${LAYOUT.canvas.height}px;overflow:hidden"><div class="frame"></div></div>`, 'frame.png');
  for (const scene of timeline) {
    await shot(`<div style="padding:40px"><div class="bubble" id="b">${esc(scene.bubble)}</div></div>`, `bubble-${scene.id}.png`, '#b');
  }
  await page.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
