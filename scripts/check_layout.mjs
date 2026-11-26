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
//
// 3D films (scenes that import src/cartoon) first run a PROBE (story/probe.ts): every 3rd frame of every scene
// (--step) plus right after each caption cue is evaluated without drawing, in seconds. It lists characters cut
// by the frame edge or under the Reels UI, and labels that are shown but off screen, as frame ranges. The
// middle frame of each problem is added to the stills, and the stills (with WebGL) also flag a camera placed
// inside a solid. --no-probe skips it, --probe forces it for 2D films, --probe-only skips the stills.

import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, rmSync} from "node:fs";
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
const sceneFile = `src/scenes/${id}.tsx`;
const is3d = existsSync(sceneFile) && readFileSync(sceneFile, "utf8").includes("../cartoon");
const doProbe = args.includes("--probe") || (is3d && !args.includes("--no-probe"));
const probeOnly = args.includes("--probe-only");
const step = Number(opt("step", "3"));
const per = Number(opt("per", is3d ? "3" : "2"));
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

console.log(doProbe ? "bundling once, probe + stills ..." : `bundling once, ${plan.length} stills (scale ${scale}) ...`);
const t0 = Date.now();
const serveUrl = await bundle({entryPoint: path.resolve("src/index.ts")});
const inputProps = {narration: null, check: true};
const browser = await openBrowser("chrome", {chromiumOptions});
const sceneOf = (f) => scenes.findIndex((s) => f >= s.from && f < s.from + s.len);

const PROBLEM = /(LUAR AREA|LABEL TIDAK TERLIHAT|KAMERA DI DALAM BENDA)(?: \[f=(\d+)\])?:?\s*(.*)$/;
let probeProblems = 0;
if (doProbe) {
  const tp = Date.now();
  const probeProps = {narration: null, check: true, probe: true, step};
  const pcomp = await selectComposition({serveUrl, id, inputProps: probeProps, puppeteerInstance: browser});
  const found = []; // {frame, kind, text}
  for (let i = 0; i < scenes.length; i++) {
    if (only && !only.includes(i)) continue;
    await renderStill({
      chromiumOptions, composition: pcomp, serveUrl, frame: i, scale: 0.05, inputProps: probeProps,
      output: `${out}/probe.png`, puppeteerInstance: browser, timeoutInMilliseconds: 120000, overwrite: true,
      onBrowserLog: (log) => {
        const m = log.text.match(PROBLEM);
        if (m && m[2]) found.push({frame: Number(m[2]), kind: m[1], text: m[3]});
      },
    });
  }
  rmSync(`${out}/probe.png`, {force: true});
  // group: same problem (numbers in brackets ignored) on nearby frames -> one range
  const groups = new Map();
  for (const w of found) {
    const key = `${w.kind}|${w.text.replace(/\(.*\)\s*$/, "").trim()}`;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  const ranges = [];
  for (const [key, list] of groups) {
    const fs = [...new Set(list.map((w) => w.frame))].sort((a, b) => a - b);
    let a = fs[0];
    let prev = fs[0];
    const flush = () => {
      const mid = fs.filter((f) => f >= a && f <= prev)[Math.floor(fs.filter((f) => f >= a && f <= prev).length / 2)];
      const sample = list.find((w) => w.frame === mid);
      ranges.push({a, b: prev, mid, kind: key.split("|")[0], text: sample.text});
    };
    for (const f of fs.slice(1)) {
      if (f - prev > step * 4) {
        flush();
        a = f;
      }
      prev = f;
    }
    flush();
  }
  ranges.sort((x, y) => x.a - y.a);
  probeProblems = ranges.length;
  console.log(`probe: ${scenes.length} scenes, every ${step} frames, in ${Math.round((Date.now() - tp) / 1000)} s`);
  if (ranges.length) {
    console.log("MASALAH (probe):");
    for (const r of ranges) console.log(`  scene ${sceneOf(r.a)} frame ${r.a}${r.b > r.a ? `-${r.b}` : ""}: ${r.kind}: ${r.text}`);
    if (!opt("frames")) for (const r of ranges) if (!plan.some((p) => p.frame === r.mid)) plan.push({scene: sceneOf(r.mid), frame: r.mid});
    plan.sort((x, y) => x.frame - y.frame);
  } else console.log("probe: tidak ada masalah.");
  if (probeOnly) {
    await browser.close(true);
    process.exit(ranges.length ? 2 : 0);
  }
}
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
        if (PROBLEM.test(log.text)) warnings.set(`${frame}:${log.text}`, {frame, text: log.text});
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
  console.log("MASALAH di still (LUAR AREA = keluar area aman):");
  [...warnings.values()].sort((a, b) => a.frame - b.frame).forEach((w) => {
    const scene = scenes.findIndex((s) => w.frame >= s.from && w.frame < s.from + s.len);
    const m = w.text.match(PROBLEM);
    console.log(`  scene ${scene} frame ${w.frame}: ${m ? `${m[1]}: ${m[3]}` : w.text}`);
  });
} else {
  console.log("Tidak ada masalah di still.");
}
if (warnings.size || probeProblems) process.exitCode = 2;
