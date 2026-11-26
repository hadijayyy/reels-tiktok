// Renders a film in parts (one per scene body + one per transition seam), joins them without re-encoding, and
// adds the mixed audio (public/audio/<slug>.mp3). Bundles once and keeps one browser, so after a fix only the
// changed scenes are rendered again instead of the whole film.
//
//   node scripts/render_parts.mjs <CompositionId> <slug> [--scene 3,5] [--missing] [--draft]
//                                 [--gl swangle|angle] [--concurrency N] [--out out/<slug>.mp4]
//
//   (default)    render every part (use after any change you cannot pin to scenes)
//   --scene 3,5  render only those scenes (0-based) and the transitions on both sides of each, re-use the rest
//   --missing    render only parts that do not exist yet (resume an interrupted render)
//   --draft      half resolution (540 x 960) into out/<slug>-draft.mp4, parts kept apart from the final ones:
//                about 3x faster, for checking timing, acting and camera before the final render
//
// Parts: scene bodies [from+8, next-8) and seams [cut-8, cut+8) around each cut (8 = HALF in Transitions.tsx,
// the frames where two scenes overlap), so a scene and its transitions can be replaced on their own.
// Output is checked with ffprobe: the joined video must have exactly FRAMES frames.
// 3D films need WebGL: --gl swangle (cloud, no GPU) or angle (a PC with a GPU); also read from $GL.

import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {openBrowser, renderMedia, selectComposition} from "@remotion/renderer";

const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").match(/^--(scene|gl|concurrency|out)$/));
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const [id, slug] = pos;
if (!id || !slug) {
  console.error("usage: node scripts/render_parts.mjs <CompositionId> <slug> [--scene 3,5] [--missing] [--draft] [--gl swangle|angle] [--concurrency N] [--out file]");
  process.exit(1);
}
const draft = args.includes("--draft");
const missing = args.includes("--missing");
const only = opt("scene") ? opt("scene").split(",").map(Number) : null;
const gl = opt("gl", process.env.GL ?? null);
const chromiumOptions = gl ? {gl} : {};
const concurrency = opt("concurrency") ? Number(opt("concurrency")) : null;
const out = opt("out", draft ? `out/${slug}-draft.mp4` : `out/${slug}.mp4`);
const HALF = 8;

const timing = readFileSync(`src/scenes/${slug}Timing.ts`, "utf8");
const FRAMES = Number(timing.match(/FRAMES = (\d+)/)[1]);
const scenes = JSON.parse(timing.match(/SCENES = (\[.*?\]);/s)[1]);

// parts in playing order
const parts = [];
scenes.forEach((s, i) => {
  if (i > 0) parts.push({name: `s${String(i).padStart(2, "0")}`, a: s.from - HALF, b: s.from + HALF, scenes: [i - 1, i]});
  const a = i === 0 ? 0 : s.from + HALF;
  const b = i === scenes.length - 1 ? FRAMES : scenes[i + 1].from - HALF;
  if (b > a) parts.push({name: `b${String(i).padStart(2, "0")}`, a, b, scenes: [i]});
});

const dir = `out/parts/${slug}${draft ? "-draft" : ""}`;
mkdirSync(dir, {recursive: true});
const file = (p) => `${dir}/${p.name}.mp4`;
const todo = parts.filter((p) => (only ? p.scenes.some((s) => only.includes(s)) : missing ? !existsSync(file(p)) : true));
const absent = parts.filter((p) => !todo.includes(p) && !existsSync(file(p)));
if (absent.length) {
  console.log(`parts not rendered yet, added: ${absent.map((p) => p.name).join(" ")}`);
  todo.push(...absent);
}
const frames = todo.reduce((n, p) => n + p.b - p.a, 0);
console.log(`${id}: ${todo.length}/${parts.length} parts, ${frames}/${FRAMES} frames${draft ? " (draft, half size)" : ""}`);

const t0 = Date.now();
if (todo.length) {
  const serveUrl = await bundle({entryPoint: path.resolve("src/index.ts")});
  const browser = await openBrowser("chrome", {chromiumOptions});
  const inputProps = {};
  const comp = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
  let done = 0;
  for (const p of todo) {
    const tp = Date.now();
    const tmp = `${file(p)}.tmp.mp4`;
    await renderMedia({
      composition: comp,
      serveUrl,
      codec: "h264",
      crf: draft ? 26 : 20,
      muted: true,
      imageFormat: "jpeg",
      jpegQuality: draft ? 70 : 90,
      scale: draft ? 0.5 : 1,
      frameRange: [p.a, p.b - 1],
      outputLocation: tmp,
      inputProps,
      chromiumOptions,
      puppeteerInstance: browser,
      overwrite: true,
      ...(concurrency ? {concurrency} : {}),
    });
    renameSync(tmp, file(p));
    done += p.b - p.a;
    const el = (Date.now() - t0) / 1000;
    console.log(`  ${p.name} frames ${p.a}-${p.b - 1} in ${Math.round((Date.now() - tp) / 1000)} s  (${done}/${frames}, ~${Math.round((el / done) * (frames - done))} s left)`);
  }
  await browser.close(true);
}

// join without re-encoding, then add the audio
const list = `${dir}/list.txt`;
writeFileSync(list, parts.map((p) => `file '${path.resolve(file(p))}'`).join("\n") + "\n");
const video = `${dir}/video.mp4`;
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video]);
const audio = `public/audio/${slug}.mp3`;
if (existsSync(audio)) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out]);
else {
  console.log(`no ${audio}: video without sound`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-c", "copy", out]);
}
rmSync(video, {force: true});
const n = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", out]).toString().trim());
console.log(`${out}: ${n} frames${n === FRAMES ? " (ok)" : ` (EXPECTED ${FRAMES})`} in ${Math.round((Date.now() - t0) / 1000)} s`);
if (n !== FRAMES) process.exitCode = 1;
