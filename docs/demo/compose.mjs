/**
 * Composes the demo MP4 from what record.mjs left in build/: the phone
 * recording, the timeline, the title and closing cards, the frame and the
 * bubbles. Needs ffmpeg and ffprobe on the path.
 *
 *   node compose.mjs                 writes inner-weather-demo.mp4 next to this file
 *   node compose.mjs --out x.mp4     writes somewhere else
 *   node compose.mjs --no-edits      ignores edits.json and uses the whole recording
 *   node compose.mjs --preview 12    only the first 12 seconds, quick, to check a cut
 *
 * edits.json, next to this file, shortens the cut without re-recording:
 *   { "drop": ["scene-id", ...],                    whole scenes taken out of the footage
 *     "trim": { "scene-id": { "start": 0.9, "end": 1.5 } },   seconds shaved off a scene's footage
 *     "cuts": { "scene-id": [[3.2, 8.9], [0, 1.5, "still"]] },   stretches inside a scene, from its start
 *     "speed": 1.25,                                 footage and bubbles this much faster
 *     "audio": "beat" | "drone" | "none" | "path/to/music.mp3",   the sound bed (default: the synthesized beat)
 *     "retake": { "clip": "build/retake.webm", "until": 24.0 },   footage before that recorded second comes
 *                                                    from a re-take of the opening scenes (record.mjs --retake)
 *     "title": 4.5, "closing": 7 }                  card lengths, optional
 * A join where the screen changes gets the same white dip as a change of flow; a cut marked
 * "still" (or the trimmed end of a scene) joins identical frames and gets none.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(ROOT, 'build');
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const OUT = outIndex === -1 ? path.join(ROOT, 'inner-weather-demo.mp4') : path.resolve(args[outIndex + 1]);

const FPS = 30;
const BUBBLE_FADE = 0.35; // seconds
const BUBBLE_GAP = 0.25; // a bubble appears this long after its scene starts and leaves this long before it ends
const DIP = 0.3; // white dip at a cut, each side
const n = (x) => x.toFixed(3);

const tl = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
const { layout } = tl;
const screen = path.join(BUILD, 'screen.webm');

const editsFile = path.join(ROOT, 'edits.json');
const edits = !args.includes('--no-edits') && fs.existsSync(editsFile) ? JSON.parse(fs.readFileSync(editsFile, 'utf8')) : {};
const title = { ...tl.title, seconds: edits.title ?? tl.title.seconds };
const closing = { ...tl.closing, seconds: edits.closing ?? tl.closing.seconds };

// record.mjs starts its clock the moment a black page turns white; find that flash in a recording.
function syncFlash(file) {
  const detect = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-vf', 'blackdetect=d=0.3:pix_th=0.10', '-an', '-f', 'null', '-'], { encoding: 'utf8' });
  const flash = detect.stderr.match(/black_end:\s*([\d.]+)/);
  if (!flash) throw new Error(`Could not find the sync flash at the start of ${file}`);
  return Number(flash[1]);
}
const zero = syncFlash(screen);
const recorded = tl.closedAt; // seconds of recording after the flash that the timeline covers

// A re-take of the opening scenes replaces the footage before `until`; its clock matches the original's.
const retake = edits.retake ? { file: path.resolve(ROOT, edits.retake.clip), until: edits.retake.until } : null;
if (retake) retake.zero = syncFlash(retake.file);

// ---------------------------------------------------------------------------
// The edit: which stretches of the recording are taken out, and the new clock.
// ---------------------------------------------------------------------------

const drop = new Set(edits.drop ?? []);
const trim = edits.trim ?? {};
const cutsIn = edits.cuts ?? {};
const speed = edits.speed ?? 1;
for (const id of [...drop, ...Object.keys(trim), ...Object.keys(cutsIn)]) {
  if (!tl.scenes.some((s) => s.id === id)) throw new Error(`edits.json names a scene that was not recorded: ${id}`);
}

// Each removed stretch is [from, to, jump]: jump says the screen differs on either side of the
// join (a dropped scene, or the start of a scene cut off), so it needs a dip. The static tail of
// a scene does not: the frames either side of that join are the same.
let removed = [];
for (const s of tl.scenes) {
  if (drop.has(s.id)) removed.push([s.start, s.end, true]);
  const t = trim[s.id];
  if (t?.start) removed.push([s.start, Math.min(s.end, s.start + t.start), true]);
  if (t?.end) removed.push([Math.max(s.start, s.end - t.end), s.end, false]);
  for (const [from, to, how] of cutsIn[s.id] ?? []) removed.push([s.start + from, Math.min(s.end, s.start + to), how !== 'still']);
}
removed.sort((a, b) => a[0] - b[0]);
removed = removed.reduce((acc, r) => {
  const lastR = acc.at(-1);
  if (lastR && r[0] <= lastR[1] + 0.001) {
    lastR[1] = Math.max(lastR[1], r[1]);
    lastR[2] = lastR[2] || r[2];
  } else acc.push([...r]);
  return acc;
}, []);

const kept = [];
const jumpStarts = new Set();
let cursor = 0;
for (const [a, b, jump] of removed) {
  if (a > cursor + 0.01) kept.push([cursor, a]);
  cursor = Math.max(cursor, b);
  if (jump) jumpStarts.add(cursor);
}
if (recorded > cursor + 0.01) kept.push([cursor, recorded]);
const footage = kept.reduce((sum, [a, b]) => sum + (b - a), 0);
const duration = footage / speed;

/** Old recording time to time in the cut; a moment that was removed maps to where the join is. */
function map(t) {
  let out = 0;
  for (const [a, b] of kept) {
    if (t <= a) return out / speed;
    if (t <= b) return (out + (t - a)) / speed;
    out += b - a;
  }
  return out / speed;
}

const scenes = tl.scenes
  .filter((s) => !drop.has(s.id))
  .map((s) => ({ ...s, start: map(s.start + (trim[s.id]?.start ?? 0)), end: map(s.end - (trim[s.id]?.end ?? 0)) }))
  .filter((s) => s.end - s.start > 0.8);

// A dip wherever the footage jumps: a change of flow in the recording, or a join made here.
const joins = kept.slice(1).filter(([a]) => jumpStarts.has(a)).map(([a]) => map(a));
const cutTimes = [...scenes.filter((s) => s.cut).map((s) => s.start), ...joins]
  .filter((t) => t > 1 && t < duration - 1)
  .sort((a, b) => a - b)
  .filter((t, i, all) => i === 0 || t - all[i - 1] > 0.5);

/** PNG width and height straight from the header. */
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ---------------------------------------------------------------------------
// The ffmpeg graph.
// ---------------------------------------------------------------------------

const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', n(title.seconds), '-i', path.join(BUILD, 'title.png')];
inputs.push('-i', screen);
if (retake) inputs.push('-i', retake.file);
inputs.push('-framerate', String(FPS), '-loop', '1', '-t', n(closing.seconds), '-i', path.join(BUILD, 'closing.png'));
inputs.push('-framerate', String(FPS), '-loop', '1', '-i', path.join(BUILD, 'frame.png'));
const RETAKE_INPUT = retake ? 2 : null;
const CLOSING_INPUT = retake ? 3 : 2;
const FRAME_INPUT = CLOSING_INPUT + 1;
const FIRST_BUBBLE = FRAME_INPUT + 1;
for (const s of scenes) inputs.push('-framerate', String(FPS), '-loop', '1', '-i', path.join(BUILD, `bubble-${s.id}.png`));

const f = [];
const { phone, bubble, colors } = layout;
const bg = colors.paper;

// The kept stretches of the recording, in a row, on the paper canvas, under the frame.
// A stretch that crosses the re-take boundary is split so each piece has one source.
const pieces = [];
for (const [a, b] of kept) {
  if (retake && a < retake.until && b > retake.until) pieces.push([a, retake.until], [retake.until, b]);
  else pieces.push([a, b]);
}
const sourceOf = ([a]) => (retake && a < retake.until ? { input: RETAKE_INPUT, zero: retake.zero } : { input: 1, zero });
f.push(`color=c=${bg}:s=${layout.canvas.width}x${layout.canvas.height}:r=${FPS}:d=${n(duration)}[bg]`);
for (const input of retake ? [1, RETAKE_INPUT] : [1]) {
  const mine = pieces.map((p, i) => [p, i]).filter(([p]) => sourceOf(p).input === input);
  if (mine.length === 0) continue;
  f.push(`[${input}:v]split=${mine.length}${mine.map(([, i]) => `[p${i}]`).join('')}`);
}
pieces.forEach(([a, b], i) => {
  const src = sourceOf([a, b]);
  f.push(`[p${i}]trim=start=${n(src.zero + a)}:end=${n(src.zero + b)},setpts=PTS-STARTPTS[g${i}]`);
});
f.push(`${pieces.map((_, i) => `[g${i}]`).join('')}concat=n=${pieces.length}:v=1:a=0,setpts=PTS/${n(speed)},fps=${FPS},scale=${phone.width}:${phone.height}[screen]`);
f.push(`[bg][screen]overlay=${phone.x}:${phone.y}:shortest=1[c0]`);
f.push(`[c0][${FRAME_INPUT}:v]overlay=0:0:shortest=1[c1]`);

// One bubble at a time, fading in and out, vertically centred beside the phone.
let last = 'c1';
scenes.forEach((s, i) => {
  const start = s.start + BUBBLE_GAP;
  const end = Math.max(start + 1.5, s.end - BUBBLE_GAP);
  const { height } = pngSize(path.join(BUILD, `bubble-${s.id}.png`));
  const y = Math.round(bubble.centerY - height / 2);
  const inp = `${FIRST_BUBBLE + i}:v`;
  f.push(`[${inp}]format=rgba,fade=t=in:st=${n(start)}:d=${n(BUBBLE_FADE)}:alpha=1,fade=t=out:st=${n(end - BUBBLE_FADE)}:d=${n(BUBBLE_FADE)}:alpha=1[k${i}]`);
  f.push(`[${last}][k${i}]overlay=${bubble.x}:${y}:shortest=1:enable='between(t,${n(start)},${n(end)})'[c${i + 2}]`);
  last = `c${i + 2}`;
});

// White dips at every jump: a white layer that fades up and away around the cut. (A plain fade
// filter will not do: a fade-in blanks everything before it and a fade-out everything after.)
cutTimes.forEach((t, i) => {
  f.push(
    `color=c=white:s=${layout.canvas.width}x${layout.canvas.height}:r=${FPS}:d=${n(duration)},format=rgba,fade=t=in:st=${n(t - DIP)}:d=${n(DIP)}:alpha=1,fade=t=out:st=${n(t)}:d=${n(DIP)}:alpha=1[w${i}]`,
  );
  f.push(`[${last}][w${i}]overlay=0:0:shortest=1:enable='between(t,${n(t - DIP - 0.05)},${n(t + DIP + 0.05)})'[d${i}]`);
  last = `d${i}`;
});
// Fade from white at the start and to white at the end.
f.push(`[${last}]fade=t=in:st=0:d=0.6:c=white,fade=t=out:st=${n(duration - 0.6)}:d=0.6:c=white,format=yuv420p[main]`);

// Title and closing cards, then everything in a row.
f.push(`[0:v]scale=${layout.canvas.width}:${layout.canvas.height},fade=t=in:st=0:d=0.6:c=white,fade=t=out:st=${n(title.seconds - 0.6)}:d=0.6:c=white,format=yuv420p[t]`);
f.push(`[${CLOSING_INPUT}:v]scale=${layout.canvas.width}:${layout.canvas.height},fade=t=in:st=0:d=0.6:c=white,fade=t=out:st=${n(closing.seconds - 0.8)}:d=0.8:c=white,format=yuv420p[e]`);
f.push(`[t][main][e]concat=n=3:v=1:a=0,format=yuv420p[out]`);

// The sound bed. The default is a calm drone made here, so it needs no file and no licence:
// a low fifth (G and D) with slow swells, a soft bowl strike every 22 seconds, a little
// filtered noise for air, all levelled to -23 LUFS, under the video by design.
const audio = edits.audio ?? 'beat';
const total = title.seconds + duration + closing.seconds;
const audioMaps = [];
const levelAndFade = `loudnorm=I=-19:TP=-1.5:LRA=9,afade=t=in:d=1.5,afade=t=out:st=${n(total - 4)}:d=4,aformat=channel_layouts=stereo:sample_rates=48000`;
if (audio === 'beat') {
  // A light, upbeat loop at 104 BPM, all from one expression evaluated per sample:
  // a plucked arpeggio over C, Am, F, G (two bars each), a round bass every two beats,
  // a soft kick on one and three, a quiet hi-hat on the eighths, and a faint pad.
  const E = 60 / 104 / 2; // one eighth note
  const step = `floor(t/${E})`;
  const pat = `mod(${step},8)`;
  const k = `if(lt(${pat},4),${pat},if(lt(${pat},7),6-${pat},1))`; // up and down the chord: 0 1 2 3 2 1 0 1
  const c = `mod(floor(t/${16 * E}),4)`;
  const pick = (a, b, d, e) => `if(eq(${k},0),${a},if(eq(${k},1),${b},if(eq(${k},2),${d},${e})))`;
  const semis = `if(eq(${c},0),${pick(0, 4, 7, 12)},if(eq(${c},1),${pick(-3, 0, 4, 9)},if(eq(${c},2),${pick(-7, -3, 0, 5)},${pick(-5, -1, 2, 7)})))`;
  const rootSemis = `if(eq(${c},0),0,if(eq(${c},1),-3,if(eq(${c},2),-7,-5)))`;
  const fq = `(523.25*pow(2,(${semis})/12))`;
  const ts = `(t-${step}*${E})`;
  const pluck = `0.32*if(eq(${pat},0),1,0.72)*exp(-6*${ts})*(sin(2*PI*${fq}*${ts})+0.35*sin(4*PI*${fq}*${ts})+0.1*sin(6*PI*${fq}*${ts}))`;
  const fb = `(130.81*pow(2,(${rootSemis})/12))`;
  const tb = `(t-floor(t/${4 * E})*${4 * E})`;
  const bass = `0.4*exp(-1.6*${tb})*(sin(2*PI*${fb}*${tb})+0.25*sin(4*PI*${fb}*${tb}))`;
  const tk = `(t-floor(t/${4 * E})*${4 * E})`;
  const kick = `0.6*exp(-14*${tk})*sin(2*PI*(45*${tk}+(110/35)*(1-exp(-35*${tk}))))`;
  const hat = `(2*random(0)-1)*exp(-45*${ts})*if(eq(mod(${step},2),1),0.08,0.035)`;
  const fr = `(261.63*pow(2,(${rootSemis})/12))`;
  const pad = `0.04*(sin(2*PI*${fr}*t)+sin(3*PI*${fr}*t))`;
  f.push(`aevalsrc=exprs='${[pluck, bass, kick, hat, pad].join('+')}':s=48000:d=${n(total)}[dry]`);
  f.push(`[dry]aecho=0.7:0.45:110|230|370:0.3|0.2|0.12,lowpass=f=7000,${levelAndFade}[aout]`);
  audioMaps.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '160k');
} else if (audio === 'drone') {
  const partial = (amp, hz, swellHz, phase, depth) => `${amp}*sin(2*PI*${hz}*t)*(${1 - depth}+${depth}*sin(2*PI*${swellHz}*t+${phase}))`;
  const bowl = `0.22*(sin(2*PI*523.25*t)+0.45*sin(2*PI*1046.5*t)+0.2*sin(2*PI*1569.75*t)+0.1*sin(2*PI*2093*t))*exp(-0.9*(t+21.5-22*floor((t+21.5)/22)))`;
  const tone = [
    partial(0.2, 98, 0.07, 0, 0.2),
    partial(0.15, 196, 0.11, 1, 0.25),
    partial(0.11, 294, 0.05, 2, 0.3),
    partial(0.05, 392, 0.13, 0, 0.3),
    partial(0.045, 587.3, 0.09, 3, 0.5),
    bowl,
  ].join('+');
  f.push(`aevalsrc=exprs='${tone}':s=48000:d=${n(total)}[tone]`);
  f.push(`anoisesrc=color=pink:amplitude=0.03:d=${n(total)}:r=48000,highpass=f=80,lowpass=f=600[air]`);
  f.push(`[tone]aecho=0.6:0.5:700|1300|2100:0.3|0.22|0.15,lowpass=f=2500[wet]`);
  f.push(`[wet][air]amix=inputs=2:normalize=0,${levelAndFade}[aout]`);
  audioMaps.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '160k');
} else if (audio !== 'none') {
  const idx = inputs.filter((a) => a === '-i').length;
  inputs.push('-stream_loop', '-1', '-i', path.resolve(ROOT, audio));
  f.push(`[${idx}:a]atrim=0:${n(total)},${levelAndFade}[aout]`);
  audioMaps.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '160k');
}

const graph = path.join(BUILD, 'filter.txt');
fs.writeFileSync(graph, f.join(';\n'));
fs.writeFileSync(path.join(BUILD, 'cut.json'), JSON.stringify({ kept, pieces, retake, duration, scenes, cutTimes }, null, 2));

const previewIndex = args.indexOf('--preview'); // --preview 12: only the first 12 seconds, fast encode, for checking a cut
const preview = previewIndex === -1 ? null : Number(args[previewIndex + 1]);
const cmd = [
  '-y', '-hide_banner', '-loglevel', 'error', '-stats',
  ...inputs,
  '-/filter_complex', graph,
  '-map', '[out]',
  ...audioMaps,
  '-t', n(total), // the sound bed is not allowed to outlast the picture
  ...(preview ? ['-t', n(preview), '-preset', 'ultrafast'] : []),
  '-r', String(FPS),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-movflags', '+faststart',
  OUT,
];
const dropped = tl.scenes.length - scenes.length;
console.log(
  `Composing ${scenes.length} scenes (${dropped} dropped, ${(recorded - footage).toFixed(1)}s cut, ${speed}x), ${duration.toFixed(1)}s of screen (sync flash at ${zero.toFixed(2)}s) into ${OUT}`,
);
const res = spawnSync('ffmpeg', cmd, { stdio: 'inherit' });
if (res.status !== 0) process.exit(res.status ?? 1);

const length = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString().trim();
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`Done: ${Number(length).toFixed(1)}s, ${mb} MB, sound: ${audio}.`);
