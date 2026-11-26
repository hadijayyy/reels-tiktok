// Layout check for a film: bundles the project ONCE, renders two stills per scene (and more on request)
// with one shared browser, and joins them into contact sheets. Replaces dozens of `remotion still` runs,
// each of which bundled the project again (~25 s apiece) and could hang without a message.
//
//   node scripts/check_layout.mjs <CompositionId> <slug> [--per 2|3] [--frames 120,900] [--scene 4,5]
//                                 [--scale 0.35] [--out out/check] [--jobs 3] [--gl swangle|angle]
//
// Frames come from src/scenes/<slug>Timing.ts: per scene, 20 frames after its first caption cue and 14 before
// its end (--per 3 adds a frame 16 after its second cue). --scene limits the check to some scenes (0-based;
// use it after fixing a few scenes), --frames renders exactly those frames. Check mode is on, so anything
// outside the safe area is outlined in red ("LUAR AREA") and also listed here from the browser log.
// Output: <out>/f<frame>.png, <out>/sheet_<n>.png (three scenes per sheet, one row each). Read the sheets.

import {execFileSync} from "node:child_process";
import {mkdirSync, readFileSync, rmSync} from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {openBrowser, renderStill, selectComposition} from "@remotion/renderer";

const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--"));
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const [id, slug] = pos;
if (!id || !slug) {
  console.error("usage: node scripts/check_layout.mjs <CompositionId> <slug> [--per 2|3] [--frames a,b] [--scene 0,1] [--scale 0.35] [--out out/check] [--jobs 3]");
  process.exit(1);
}
const per = Number(opt("per", "2"));
const scale = Number(opt("scale", "0.35"));
const jobs = Number(opt("jobs", "3"));
const out = opt("out", "out/check");
// 3D films (src/cartoon) need WebGL: swangle in the cloud (no GPU), angle on a PC with a GPU. Also read from $GL.
const gl = opt("gl", process.env.GL ?? null);
const chromiumOptions = gl ? {gl} : {};

const timing = readFileSync(`src/scenes/${slug}Timing.ts`, "utf8");
const scenes = JSON.parse(timing.match(/SCENES = (\[.*?\]);/s)[1]);
const cues = JSON.parse(timing.match(/CUES = (\[.*\]);/s)[1]);

const only = opt("scene") ? opt("scene").split(",").map(Number) : null;
const plan = []; // {scene, frame}
if (opt("frames")) {
  for (const f of opt("frames").split(",").map(Number)) {
    const si = scenes.findIndex((s) => f >= s.from && f < s.from + s.len);
    plan.push({scene: Math.max(si, 0), frame: f});
  }
} else {
  scenes.forEach((s, i) => {
    if (only && !only.includes(i)) return;
    const mine = cues.filter((c) => c.from >= s.from - 2 && c.from < s.from + s.len);
    const first = mine[0] ? mine[0].from : s.from;
    plan.push({scene: i, frame: Math.min(first + 20, s.from + s.len - 2)});
    if (per >= 3 && mine[1]) plan.push({scene: i, frame: Math.min(mine[1].from + 16, s.from + s.len - 2)});
    plan.push({scene: i, frame: s.from + s.len - 14});
  });
}

rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});

console.log(`bundling once, ${plan.length} stills (scale ${scale}) ...`);
const t0 = Date.now();
const serveUrl = await bundle({entryPoint: path.resolve("src/index.ts")});
const inputProps = {narration: null, check: true};
const browser = await openBrowser("chrome", {chromiumOptions});
const comp = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});

const warnings = new Map();
const renderOne = async ({frame}, attempt = 1) => {
  try {
    await renderStill({
      chromiumOptions,
      composition: comp,
      serveUrl,
      frame,
      scale,
      inputProps,
      output: `${out}/f${frame}.png`,
      puppeteerInstance: browser,
      timeoutInMilliseconds: 90000,
      overwrite: true,
      onBrowserLog: (log) => {
        if (log.text.includes("LUAR AREA")) warnings.set(`${frame}:${log.text}`, {frame, text: log.text});
      },
    });
  } catch (e) {
    if (attempt < 2) return renderOne({frame}, attempt + 1);
    console.error(`frame ${frame} failed twice: ${String(e.message).split("\n")[0]}`);
  }
};
const queue = [...plan];
await Promise.all(
  Array.from({length: jobs}, async () => {
    while (queue.length) await renderOne(queue.shift());
  }),
);
await browser.close(true);
console.log(`stills done in ${Math.round((Date.now() - t0) / 1000)} s`);

// contact sheets: one row per scene (its frames side by side), three scenes per sheet, stacked vertically
const byScene = new Map();
for (const p of plan) byScene.set(p.scene, [...(byScene.get(p.scene) ?? []), p.frame]);
const rows = [...byScene.entries()];
const sheets = [];
for (let k = 0; k < rows.length; k += 3) {
  const chunk = rows.slice(k, k + 3);
  const files = [];
  chunk.forEach(([scene, frames], r) => {
    const rowFile = `${out}/row_${scene}.png`;
    const ins = frames.flatMap((f) => ["-i", `${out}/f${f}.png`]);
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...ins, "-filter_complex", frames.length > 1 ? `hstack=inputs=${frames.length}` : "null", rowFile]);
      files.push(rowFile);
    } catch {
      console.error(`row for scene ${scene} missing (a still failed)`);
    }
  });
  if (!files.length) continue;
  const sheet = `${out}/sheet_${sheets.length}.png`;
  const ins = files.flatMap((f) => ["-i", f]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...ins, "-filter_complex", files.length > 1 ? `vstack=inputs=${files.length}` : "null", sheet]);
  sheets.push({sheet, scenes: chunk.map(([s]) => s)});
}
sheets.forEach((s) => console.log(`${s.sheet}  scenes ${s.scenes.join(", ")}`));
if (warnings.size) {
  console.log("LUAR AREA (keluar area aman):");
  [...warnings.values()].sort((a, b) => a.frame - b.frame).forEach((w) => {
    const scene = scenes.findIndex((s) => w.frame >= s.from && w.frame < s.from + s.len);
    console.log(`  scene ${scene} frame ${w.frame}: ${w.text.replace(/^.*LUAR AREA:?\s*/, "")}`);
  });
} else {
  console.log("Tidak ada LUAR AREA.");
}
