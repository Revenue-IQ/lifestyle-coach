/**
 * Composes the demo MP4 from what record.mjs left in build/: the phone
 * recording, the timeline, the title and closing cards, the frame and the
 * bubbles. Needs ffmpeg and ffprobe on the path.
 *
 *   node compose.mjs                 writes inner-weather-demo.mp4 next to this file
 *   node compose.mjs --out x.mp4     writes somewhere else
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
const { layout, title, closing, scenes } = tl;
const screen = path.join(BUILD, 'screen.webm');

// record.mjs starts its clock the moment a black page turns white; find that flash in the recording.
const detect = spawnSync('ffmpeg', ['-hide_banner', '-i', screen, '-vf', 'blackdetect=d=0.3:pix_th=0.10', '-an', '-f', 'null', '-'], { encoding: 'utf8' });
const flash = detect.stderr.match(/black_end:\s*([\d.]+)/);
if (!flash) throw new Error('Could not find the sync flash at the start of build/screen.webm');
const zero = Number(flash[1]);
const duration = tl.closedAt; // seconds of recording after the flash that the timeline covers
const at = (t) => Math.max(0, t);

/** PNG width and height straight from the header. */
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', n(title.seconds), '-i', path.join(BUILD, 'title.png')];
inputs.push('-i', screen);
inputs.push('-framerate', String(FPS), '-loop', '1', '-t', n(closing.seconds), '-i', path.join(BUILD, 'closing.png'));
inputs.push('-framerate', String(FPS), '-loop', '1', '-i', path.join(BUILD, 'frame.png'));
const FIRST_BUBBLE = 4;
for (const s of scenes) inputs.push('-framerate', String(FPS), '-loop', '1', '-i', path.join(BUILD, `bubble-${s.id}.png`));

const f = [];
const { phone, bubble, colors } = layout;
const bg = colors.paper;

// The phone recording on the paper canvas, under the frame.
f.push(`color=c=${bg}:s=${layout.canvas.width}x${layout.canvas.height}:r=${FPS}:d=${n(duration)}[bg]`);
f.push(`[1:v]trim=start=${n(zero)}:end=${n(zero + duration)},setpts=PTS-STARTPTS,fps=${FPS},scale=${phone.width}:${phone.height}[screen]`);
f.push(`[bg][screen]overlay=${phone.x}:${phone.y}:shortest=1[c0]`);
f.push(`[c0][3:v]overlay=0:0:shortest=1[c1]`);

// One bubble at a time, fading in and out, vertically centred beside the phone.
let last = 'c1';
scenes.forEach((s, i) => {
  const start = at(s.start) + BUBBLE_GAP;
  const end = Math.max(start + 1.5, at(s.end) - BUBBLE_GAP);
  const { height } = pngSize(path.join(BUILD, `bubble-${s.id}.png`));
  const y = Math.round(bubble.centerY - height / 2);
  const inp = `${FIRST_BUBBLE + i}:v`;
  f.push(`[${inp}]format=rgba,fade=t=in:st=${n(start)}:d=${n(BUBBLE_FADE)}:alpha=1,fade=t=out:st=${n(end - BUBBLE_FADE)}:d=${n(BUBBLE_FADE)}:alpha=1[k${i}]`);
  f.push(`[${last}][k${i}]overlay=${bubble.x}:${y}:shortest=1:enable='between(t,${n(start)},${n(end)})'[c${i + 2}]`);
  last = `c${i + 2}`;
});

// White dips where the recording jumps to another page, and at both ends.
const cuts = scenes.filter((s) => s.cut && at(s.start) > 1).map((s) => at(s.start));
const dips = cuts.map((t) => `fade=t=out:st=${n(t - DIP)}:d=${n(DIP)}:c=white,fade=t=in:st=${n(t)}:d=${n(DIP)}:c=white`);
f.push(`[${last}]${[...dips, `fade=t=in:st=0:d=0.6:c=white`, `fade=t=out:st=${n(duration - 0.6)}:d=0.6:c=white`].join(',')},format=yuv420p[main]`);

// Title and closing cards, then everything in a row.
f.push(`[0:v]scale=${layout.canvas.width}:${layout.canvas.height},fade=t=in:st=0:d=0.6:c=white,fade=t=out:st=${n(title.seconds - 0.6)}:d=0.6:c=white,format=yuv420p[t]`);
f.push(`[2:v]scale=${layout.canvas.width}:${layout.canvas.height},fade=t=in:st=0:d=0.6:c=white,fade=t=out:st=${n(closing.seconds - 0.8)}:d=0.8:c=white,format=yuv420p[e]`);
f.push(`[t][main][e]concat=n=3:v=1:a=0,format=yuv420p[out]`);

const graph = path.join(BUILD, 'filter.txt');
fs.writeFileSync(graph, f.join(';\n'));

const cmd = [
  '-y', '-hide_banner', '-loglevel', 'error', '-stats',
  ...inputs,
  '-/filter_complex', graph,
  '-map', '[out]',
  '-r', String(FPS),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-movflags', '+faststart',
  OUT,
];
console.log(`Composing ${scenes.length} scenes, ${duration.toFixed(1)}s of screen (sync flash at ${zero.toFixed(2)}s) into ${OUT}`);
const res = spawnSync('ffmpeg', cmd, { stdio: 'inherit' });
if (res.status !== 0) process.exit(res.status ?? 1);

const total = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString().trim();
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`Done: ${Number(total).toFixed(1)}s, ${mb} MB.`);
