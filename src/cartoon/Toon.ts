/*
 * Our own flat cartoon cast, drawn on a canvas and shown as a card in the 3D world (see Cast.tsx).
 * Big round head, bean torso, single-stroke ink limbs with dot hands, a white sticker rim around the
 * whole figure. Design space: 600 x 1000 units, soles at y = 975, centre x = 300.
 *
 * Arm and leg angles: [a, b] in degrees. a = upper limb, measured from straight DOWN, positive = away
 * from the body (90 = straight out sideways, 180 = straight up, 270 = across the body).
 * b = elbow/knee bend added on top: the forearm points at a + b. Use the pose presets below first.
 */
import {INK, mixHex, rnd, shadeHex} from "./look";
import {DRAFT} from "./quality";

export type Expr = "neutral" | "happy" | "joy" | "shock" | "scared" | "angry" | "sad" | "smug" | "think" | "determined" | "tired" | "nervous";
export type Limb = [number, number];
export type Pose = {
  armL: Limb; // canvas-left arm (the character's right)
  armR: Limb;
  legL: Limb;
  legR: Limb;
  liftL: number; // 0..1 knee lifted toward the camera (walking, sitting)
  liftR: number;
  lean: number; // degrees, + leans to the right of the canvas (the way the character faces)
  tilt: number; // head tilt, degrees
  bob: number; // upper body offset in design units (+ = down)
  lookX: number; // pupils -1..1
  lookY: number;
  blink: number; // 0 open .. 1 closed
  talk: number; // 0..1 mouth open while speaking
  squash: number; // 1 = normal; <1 squashes toward the feet (landing, fear)
};

export type Hair = "none" | "short" | "spiky" | "curly" | "long" | "bun" | "side";
export type Hat = "none" | "peci" | "cap" | "hijab" | "helmet" | "tophat" | "straw" | "crown" | "bearskin";
export type Build = "adult" | "kid" | "stout" | "tall";
export type Item = "none" | "candle" | "book" | "paper" | "hammer" | "torch" | "phone" | "key" | "coin" | "stick" | "bag" | "cup";

export type Who = {
  name?: string; // shown in check warnings
  skin: string;
  shirt: string;
  pants: string;
  shoes?: string;
  hair?: Hair;
  hairColor?: string;
  hat?: Hat;
  hatColor?: string;
  beard?: string;
  moustache?: string;
  glasses?: boolean;
  tie?: string;
  skirt?: string;
  apron?: string;
  sash?: string; // a diagonal band across the chest (uniforms)
  build?: Build;
  seed?: number;
};

/* ---------- ready-made cast (our own designs) ---------- */

export const SKIN = {light: "#f8d9bd", tan: "#eab48a", brown: "#c98b5e", dark: "#8d5a3b", yellow: "#f2c46b"};

export const CAST: Record<string, Who> = {
  pemuda: {name: "pemuda", skin: SKIN.tan, shirt: "#3f7fc4", pants: "#3a3d52", hair: "short", hairColor: "#2b1d16"},
  pemudi: {name: "pemudi", skin: SKIN.light, shirt: "#e46a6a", pants: "#3a3d52", skirt: "#4a4f7a", hair: "long", hairColor: "#3a241a"},
  hijabi: {name: "hijabi", skin: SKIN.tan, shirt: "#5aa38a", pants: "#3a3d52", skirt: "#355d74", hat: "hijab", hatColor: "#e9b04f"},
  bapak: {name: "bapak", skin: SKIN.brown, shirt: "#e8e2d2", pants: "#4a3f36", hat: "peci", hatColor: "#1d1b1e", moustache: "#2a1d16", build: "stout"},
  kakek: {name: "kakek", skin: SKIN.tan, shirt: "#8a6d4a", pants: "#4a4038", hair: "side", hairColor: "#e8e6e0", beard: "#ecebe6", glasses: true},
  anak: {name: "anak", skin: SKIN.tan, shirt: "#f2b33d", pants: "#3b6aa0", hair: "spiky", hairColor: "#2b1d16", build: "kid"},
  ilmuwan: {name: "ilmuwan", skin: SKIN.light, shirt: "#f4f2ec", pants: "#3a3d52", hair: "curly", hairColor: "#c7c3bb", glasses: true, tie: "#c44d3c"},
  tukang: {name: "tukang", skin: SKIN.brown, shirt: "#e07b39", pants: "#3e4a5a", hat: "helmet", hatColor: "#f3c234", apron: "#7a5a3a"},
  bos: {name: "bos", skin: SKIN.light, shirt: "#2c2f3c", pants: "#23252e", hat: "tophat", hatColor: "#1a1a1f", moustache: "#3a2a1e", tie: "#b8322e", build: "stout"},
  prajurit: {name: "prajurit", skin: SKIN.yellow, shirt: "#c8322e", pants: "#1e2030", hat: "bearskin", hatColor: "#1a1418", sash: "#f2efe6"},
  raja: {name: "raja", skin: SKIN.light, shirt: "#6a3fa0", pants: "#2a2238", hat: "crown", hatColor: "#f2c236", beard: "#8a5a32", build: "stout"},
  petani: {name: "petani", skin: SKIN.brown, shirt: "#6f8f4a", pants: "#4a3f36", hat: "straw", hatColor: "#e0be6a"},
};

/* ---------- poses ---------- */

export const BASE: Pose = {armL: [8, 6], armR: [8, 6], legL: [6, 0], legR: [6, 0], liftL: 0, liftR: 0, lean: 0, tilt: 0, bob: 0, lookX: 0, lookY: 0, blink: 0, talk: 0, squash: 1};

/** A blink every ~3.4 s, offset per character, about 4 frames long. */
export const blinkAt = (t: number, seed = 0) => {
  const p = (t + rnd(seed, 1) * 3.4) % 3.4;
  return p < 0.13 ? Math.sin((p / 0.13) * Math.PI) : 0;
};

const breathe = (t: number, seed: number) => Math.sin(t * 2.3 + seed) * 3.5;

export const P = {
  idle: (t: number, seed = 0): Pose => ({...BASE, armL: [8 + Math.sin(t * 2.3 + seed) * 2, 6], armR: [8 - Math.sin(t * 2.1 + seed) * 2, 6], bob: breathe(t, seed), blink: blinkAt(t, seed)}),
  /** Talking: small hand gestures and the mouth flapping (k = 0 stops the mouth). */
  talk: (t: number, seed = 0, k = 1): Pose => ({
    ...P.idle(t, seed),
    armR: [30 + Math.sin(t * 3.1 + seed) * 14, 55 + Math.sin(t * 4.3 + seed) * 20],
    talk: k * Math.max(0, Math.sin(t * 15 + seed) * 0.6 + Math.sin(t * 9.3 + seed * 2) * 0.4),
    tilt: Math.sin(t * 2.2 + seed) * 3,
  }),
  walk: (t: number, speed = 1, seed = 0): Pose => {
    const ph = t * 7.5 * speed + seed;
    return {...BASE, liftL: Math.max(0, Math.sin(ph)), liftR: Math.max(0, -Math.sin(ph)), armL: [14 + Math.sin(ph) * 16, 10], armR: [14 - Math.sin(ph) * 16, 10], bob: -Math.abs(Math.sin(ph)) * 9, lean: 4, blink: blinkAt(t, seed)};
  },
  run: (t: number, seed = 0): Pose => {
    const ph = t * 13 + seed;
    return {...BASE, liftL: Math.max(0, Math.sin(ph)) * 1.2, liftR: Math.max(0, -Math.sin(ph)) * 1.2, armL: [40 + Math.sin(ph) * 30, 70], armR: [40 - Math.sin(ph) * 30, 70], bob: -Math.abs(Math.sin(ph)) * 16, lean: 12, blink: blinkAt(t, seed)};
  },
  point: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armR: [100, -8], lookX: 0.8}),
  wave: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armR: [140, 25 + Math.sin(t * 12) * 22]}),
  cheer: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [160, 10], armR: [160, 10], bob: -Math.abs(Math.sin(t * 9 + seed)) * 18}),
  think: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armR: [24, 172], lookX: 0.5, lookY: -0.6, tilt: 6}),
  shrug: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [52, 88], armR: [52, 88], tilt: -6}),
  hold: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [14, 238], armR: [14, 238], lookY: 0.5}),
  lift: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [165, 0], armR: [165, 0], lookY: -0.8, bob: 6}),
  pull: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [150, 20], armR: [150, 20], lean: -12, lookY: -0.6, bob: 8 + Math.sin(t * 6) * 4}),
  push: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [255, 10], armR: [95, 0], lean: 14, bob: 6}),
  scared: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [150, 45], armR: [150, 45], lean: -6, bob: 8 + Math.sin(t * 40) * 2, squash: 0.97}),
  facepalm: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armR: [22, 190], tilt: 10, lookY: 0.8}),
  crossed: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [22, 228], armR: [22, 228]}),
  hips: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [42, -72], armR: [42, -72]}),
  sit: (t: number, seed = 0): Pose => ({...P.idle(t, seed), liftL: 0.9, liftR: 0.9, legL: [10, 0], legR: [10, 0], bob: 4}),
  slump: (t: number, seed = 0): Pose => ({...P.idle(t, seed), armL: [4, 0], armR: [4, 0], tilt: 14, lean: 6, bob: 14, lookY: 0.9}),
  jump: (t: number, k: number): Pose => ({...BASE, armL: [150, 10], armR: [150, 10], liftL: 0.5 * k, liftR: 0.5 * k, bob: -10, blink: 0}),
};

/** Blend two poses (k 0..1), e.g. from idle into point over a few frames. */
export const blend = (a: Pose, b: Pose, k: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * k;
  const lim = (x: Limb, y: Limb): Limb => [l(x[0], y[0]), l(x[1], y[1])];
  return {
    armL: lim(a.armL, b.armL), armR: lim(a.armR, b.armR), legL: lim(a.legL, b.legL), legR: lim(a.legR, b.legR),
    liftL: l(a.liftL, b.liftL), liftR: l(a.liftR, b.liftR), lean: l(a.lean, b.lean), tilt: l(a.tilt, b.tilt), bob: l(a.bob, b.bob),
    lookX: l(a.lookX, b.lookX), lookY: l(a.lookY, b.lookY), blink: Math.max(a.blink, b.blink) * (k < 0.5 ? 1 - k : k), talk: l(a.talk, b.talk), squash: l(a.squash, b.squash),
  };
};

/* ---------- drawing ---------- */

type G = CanvasRenderingContext2D;
type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

const BUILDS: Record<Build, {R: number; tw: number; th: number; leg: number; up: number; fore: number}> = {
  adult: {R: 150, tw: 150, th: 220, leg: 300, up: 118, fore: 112},
  kid: {R: 140, tw: 118, th: 150, leg: 190, up: 86, fore: 82},
  stout: {R: 152, tw: 200, th: 225, leg: 280, up: 118, fore: 112},
  tall: {R: 144, tw: 140, th: 250, leg: 350, up: 132, fore: 126},
};

const SOLE = 975;
const CX = 300;
const LINE = 13;

/** Direction for an angle measured from straight down, + away from the body on side s (-1 left, +1 right). */
const dirOf = (deg: number, s: number): Pt => [Math.sin(rad(deg)) * s, Math.cos(rad(deg))];

const stroke = (g: G, pts: Pt[], w: number, col = INK) => {
  g.strokeStyle = col;
  g.lineWidth = w;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
  g.stroke();
};

const dot = (g: G, p: Pt, r: number, col = INK) => {
  g.fillStyle = col;
  g.beginPath();
  g.arc(p[0], p[1], r, 0, Math.PI * 2);
  g.fill();
};

const drawItem = (g: G, item: Item, h: Pt, s: number) => {
  const [x, y] = h;
  g.save();
  g.translate(x, y);
  g.lineWidth = 8;
  g.strokeStyle = INK;
  g.lineJoin = "round";
  const box = (bx: number, by: number, w: number, hh: number, c: string, r = 6) => {
    g.fillStyle = c;
    g.beginPath();
    g.roundRect(bx, by, w, hh, r);
    g.fill();
    g.stroke();
  };
  switch (item) {
    case "candle":
      box(-14, -70, 28, 70, "#f4ecd8", 4);
      g.fillStyle = "#ffcf4a";
      g.beginPath();
      g.ellipse(0, -92, 12, 22, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fff6c8";
      g.beginPath();
      g.ellipse(0, -86, 5, 10, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case "torch":
      box(-10, -120, 20, 150, "#7a5232", 4);
      g.fillStyle = "#ff8a2a";
      g.beginPath();
      g.moveTo(-30, -120);
      g.quadraticCurveTo(0, -210, 30, -120);
      g.closePath();
      g.fill();
      g.fillStyle = "#ffd75a";
      g.beginPath();
      g.moveTo(-15, -120);
      g.quadraticCurveTo(0, -170, 15, -120);
      g.closePath();
      g.fill();
      break;
    case "book":
      box(-50, -40, 100, 72, "#c44d3c");
      stroke(g, [[0, -40], [0, 32]], 6);
      break;
    case "paper":
      box(-40, -90, 80, 100, "#f7f3e8", 3);
      for (let i = 0; i < 4; i++) stroke(g, [[-26, -70 + i * 18], [26, -70 + i * 18]], 4, "#9a948a");
      break;
    case "hammer":
      box(-8, -130, 16, 150, "#8a5a32", 4);
      box(-46 * s, -150, 92, 36, "#7d8590", 6);
      break;
    case "phone":
      box(-26, -60, 52, 92, "#24262e", 10);
      g.fillStyle = "#7fd0ff";
      g.fillRect(-18, -50, 36, 66);
      break;
    case "key":
      g.strokeStyle = "#e2b33a";
      g.lineWidth = 12;
      g.beginPath();
      g.arc(0, -50, 20, 0, Math.PI * 2);
      g.stroke();
      stroke(g, [[0, -30], [0, 30], [16, 30]], 12, "#e2b33a");
      break;
    case "coin":
      g.fillStyle = "#f2c236";
      g.beginPath();
      g.arc(0, -30, 30, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      break;
    case "stick":
      stroke(g, [[0, -200], [0, 120]], 16, "#7a5232");
      break;
    case "bag":
      box(-45, 10, 90, 80, "#a8743a", 12);
      stroke(g, [[-25, 10], [0, -14], [25, 10]], 8);
      break;
    case "cup":
      box(-26, -50, 52, 60, "#f4f2ec", 8);
      break;
    case "none":
      break;
  }
  g.restore();
};

type Brow = [number, number]; // [raise (- = up), inner-end tilt (+ = inner end down)]
const BROWS: Record<Expr, [Brow, Brow]> = {
  neutral: [[0, 0], [0, 0]],
  happy: [[-6, -4], [-6, -4]],
  joy: [[-12, -6], [-12, -6]],
  shock: [[-34, -4], [-34, -4]],
  scared: [[-20, -16], [-20, -16]],
  angry: [[6, 20], [6, 20]],
  sad: [[-6, -18], [-6, -18]],
  smug: [[-16, -4], [2, 10]],
  think: [[-14, -8], [2, 8]],
  determined: [[4, 14], [4, 14]],
  tired: [[6, -6], [6, -6]],
  nervous: [[-12, -14], [-12, -14]],
};

const drawFace = (g: G, cx: number, cy: number, R: number, who: Who, expr: Expr, p: Pose) => {
  const ex = R * 0.36;
  const ey = cy + R * 0.02;
  const big = expr === "shock" ? 1.28 : expr === "scared" ? 1.16 : 1;
  const rx = R * 0.18 * big;
  const ry = R * 0.23 * big;
  const pr = R * (expr === "shock" || expr === "scared" ? 0.06 : 0.085);
  const lid = expr === "tired" ? 0.55 : expr === "smug" ? 0.45 : expr === "angry" || expr === "determined" ? 0.28 : expr === "sad" ? 0.22 : 0;
  // eyes
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (expr === "joy") {
      stroke(g, [[x - rx, ey + 4], [x, ey - ry * 0.7], [x + rx, ey + 4]], 9);
      continue;
    }
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    dot(g, [x + p.lookX * rx * 0.45, ey + p.lookY * ry * 0.4], pr);
    const shut = Math.max(lid, p.blink);
    if (shut > 0) {
      g.save();
      g.beginPath();
      g.ellipse(x, ey, rx + 1, ry + 1, 0, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = shadeHex(who.skin, 0.93);
      const tiltLid = expr === "angry" || expr === "determined" ? s * -10 : expr === "sad" ? s * 10 : 0;
      g.beginPath();
      g.moveTo(x - rx - 4, ey - ry - 4);
      g.lineTo(x + rx + 4, ey - ry - 4);
      g.lineTo(x + rx + 4, ey - ry + shut * ry * 2 - tiltLid);
      g.lineTo(x - rx - 4, ey - ry + shut * ry * 2 + tiltLid);
      g.closePath();
      g.fill();
      stroke(g, [[x - rx - 4, ey - ry + shut * ry * 2 + tiltLid], [x + rx + 4, ey - ry + shut * ry * 2 - tiltLid]], 7);
      g.restore();
    }
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // brows
  const br = BROWS[expr];
  [-1, 1].forEach((s, i) => {
    const [up, inner] = br[i];
    const x = cx + s * ex;
    const y = ey - ry - 16 + up;
    stroke(g, [[x + s * rx * 0.95, y - inner * 0.3], [x - s * rx * 0.95, y + inner]], 10);
  });
  // nose
  stroke(g, [[cx + 4, cy + R * 0.2], [cx + 12, cy + R * 0.3], [cx, cy + R * 0.33]], 6, shadeHex(who.skin, 0.62));
  // moustache / beard
  const my = cy + R * 0.52;
  if (who.beard) {
    g.fillStyle = who.beard;
    g.beginPath();
    g.moveTo(cx - R * 0.78, cy + R * 0.3);
    g.quadraticCurveTo(cx - R * 0.7, cy + R * 1.18, cx, cy + R * 1.2);
    g.quadraticCurveTo(cx + R * 0.7, cy + R * 1.18, cx + R * 0.78, cy + R * 0.3);
    g.quadraticCurveTo(cx, cy + R * 0.62, cx - R * 0.78, cy + R * 0.3);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.stroke();
  }
  // mouth
  const open = Math.max(p.talk, expr === "shock" ? 0.9 : expr === "scared" ? 0.7 : expr === "joy" ? 0.8 : 0);
  const mw = R * 0.24;
  g.lineCap = "round";
  if (open > 0.08) {
    const oh = R * 0.26 * open;
    g.fillStyle = "#6a2430";
    g.beginPath();
    if (expr === "shock") g.ellipse(cx, my + oh * 0.4, mw * 0.55, oh * 0.9, 0, 0, Math.PI * 2);
    else if (expr === "joy" || expr === "happy") {
      g.moveTo(cx - mw * 1.2, my - 4);
      g.quadraticCurveTo(cx, my - 10, cx + mw * 1.2, my - 4);
      g.quadraticCurveTo(cx, my + oh * 2.2, cx - mw * 1.2, my - 4);
    } else if (expr === "scared" || expr === "angry") {
      g.roundRect(cx - mw * 1.1, my - oh * 0.3, mw * 2.2, oh * 1.2, 8);
    } else g.ellipse(cx, my + oh * 0.3, mw * 0.8, oh * 0.8, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.stroke();
    if (expr === "scared" || expr === "angry") {
      g.fillStyle = "#ffffff";
      g.fillRect(cx - mw * 1.0, my - oh * 0.3 + 4, mw * 2.0, Math.min(14, oh * 0.4));
    } else if (expr === "joy" || expr === "happy") {
      g.fillStyle = "#e86e78";
      g.beginPath();
      g.ellipse(cx, my + oh * 1.25, mw * 0.55, oh * 0.4, 0, Math.PI, 0);
      g.fill();
    }
  } else {
    const curve: Record<Expr, number> = {neutral: 2, happy: 16, joy: 18, shock: 0, scared: -6, angry: -12, sad: -14, smug: 10, think: -2, determined: -4, tired: -2, nervous: 0};
    const c = curve[expr];
    if (expr === "smug") stroke(g, [[cx - mw, my], [cx + mw * 0.2, my + 6], [cx + mw * 1.1, my - 14]], 9);
    else if (expr === "nervous") stroke(g, [[cx - mw, my], [cx - mw * 0.5, my - 6], [cx, my], [cx + mw * 0.5, my - 6], [cx + mw, my]], 8);
    else if (expr === "think") stroke(g, [[cx - mw * 0.2, my + 2], [cx + mw * 0.8, my - 3]], 9);
    else {
      g.strokeStyle = INK;
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(cx - mw, my);
      g.quadraticCurveTo(cx, my + c, cx + mw, my);
      g.stroke();
    }
  }
  if (who.moustache) {
    g.fillStyle = who.moustache;
    g.strokeStyle = INK;
    g.lineWidth = 6;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + s * R * 0.15, my - R * 0.1, R * 0.17, R * 0.08, s * 0.25, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }
  if (who.glasses) {
    g.strokeStyle = INK;
    g.lineWidth = 7;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(cx + s * ex, ey, rx * 1.45, 0, Math.PI * 2);
      g.stroke();
    }
    stroke(g, [[cx - ex + rx * 1.45, ey], [cx + ex - rx * 1.45, ey]], 7);
  }
  if (expr === "nervous") {
    g.fillStyle = "#8fd3ff";
    g.strokeStyle = INK;
    g.lineWidth = 5;
    g.beginPath();
    const sx = cx + R * 0.82;
    const sy = cy - R * 0.25;
    g.moveTo(sx, sy - 26);
    g.quadraticCurveTo(sx + 16, sy, sx, sy + 12);
    g.quadraticCurveTo(sx - 16, sy, sx, sy - 26);
    g.fill();
    g.stroke();
  }
};

/** Hair or hat parts drawn BEHIND the head. */
const drawBack = (g: G, cx: number, cy: number, R: number, who: Who) => {
  const hc = who.hairColor ?? "#2b1d16";
  if (who.hat === "hijab") {
    g.fillStyle = who.hatColor ?? "#e9b04f";
    g.beginPath();
    g.moveTo(cx - R * 1.12, cy - R * 0.1);
    g.bezierCurveTo(cx - R * 1.2, cy - R * 1.35, cx + R * 1.2, cy - R * 1.35, cx + R * 1.12, cy - R * 0.1);
    g.quadraticCurveTo(cx + R * 1.3, cy + R * 1.3, cx + R * 0.95, cy + R * 1.75);
    g.lineTo(cx - R * 0.95, cy + R * 1.75);
    g.quadraticCurveTo(cx - R * 1.3, cy + R * 1.3, cx - R * 1.12, cy - R * 0.1);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = LINE;
    g.stroke();
  } else if (who.hair === "long" || who.hair === "bun") {
    g.fillStyle = hc;
    g.beginPath();
    g.roundRect(cx - R * 1.08, cy - R * 0.9, R * 2.16, R * (who.hair === "long" ? 2.05 : 1.4), R * 0.6);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = LINE;
    g.stroke();
  }
};

/** Hair or hat parts drawn ON TOP of the head. */
const drawTop = (g: G, cx: number, cy: number, R: number, ry: number, who: Who) => {
  const hc = who.hairColor ?? "#2b1d16";
  const hat = who.hat ?? "none";
  const hair = who.hair ?? "none";
  const clipHead = (pad: number) => {
    g.beginPath();
    g.ellipse(cx, cy, R + pad, ry + pad, 0, 0, Math.PI * 2);
    g.clip();
  };
  if (hat === "none" || hat === "crown") {
    if (hair !== "none") {
      g.save();
      clipHead(0);
      g.fillStyle = hc;
      g.beginPath();
      const line = cy - R * (hair === "side" ? 0.48 : 0.42);
      g.moveTo(cx - R * 1.2, line + R * 0.25);
      if (hair === "side") g.quadraticCurveTo(cx - R * 0.3, line - R * 0.15, cx + R * 0.2, line - R * 0.05);
      else g.quadraticCurveTo(cx - R * 0.5, line - R * 0.05, cx, line + R * 0.05);
      g.quadraticCurveTo(cx + R * 0.6, line - R * 0.1, cx + R * 1.2, line + R * 0.25);
      g.lineTo(cx + R * 1.2, cy - R * 1.3);
      g.lineTo(cx - R * 1.2, cy - R * 1.3);
      g.closePath();
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 8;
      g.stroke();
      g.restore();
      if (hair === "spiky") {
        g.fillStyle = hc;
        g.strokeStyle = INK;
        g.lineWidth = 8;
        for (let i = -2; i <= 2; i++) {
          const a = rad(-90 + i * 26);
          const bx = cx + Math.cos(a) * R * 0.92;
          const by = cy + Math.sin(a) * ry * 0.92;
          g.beginPath();
          g.moveTo(bx - 24, by + 8);
          g.lineTo(cx + Math.cos(a) * R * 1.28, cy + Math.sin(a) * ry * 1.28);
          g.lineTo(bx + 24, by + 8);
          g.closePath();
          g.fill();
          g.stroke();
        }
      }
      if (hair === "curly") {
        g.fillStyle = hc;
        g.strokeStyle = INK;
        g.lineWidth = 7;
        for (let i = -4; i <= 4; i++) {
          const a = rad(-90 + i * 21);
          g.beginPath();
          g.arc(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * ry * 0.98, R * 0.24, 0, Math.PI * 2);
          g.fill();
          g.stroke();
        }
      }
      if (hair === "bun") {
        g.fillStyle = hc;
        g.strokeStyle = INK;
        g.lineWidth = 9;
        g.beginPath();
        g.arc(cx, cy - ry * 1.12, R * 0.34, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    }
  }
  const col = who.hatColor ?? "#1d1b1e";
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.fillStyle = col;
  const top = cy - ry;
  switch (hat) {
    case "peci":
      g.beginPath();
      g.moveTo(cx - R * 0.72, top + R * 0.42);
      g.lineTo(cx - R * 0.66, top - R * 0.12);
      g.quadraticCurveTo(cx, top - R * 0.22, cx + R * 0.66, top - R * 0.12);
      g.lineTo(cx + R * 0.72, top + R * 0.42);
      g.quadraticCurveTo(cx, top + R * 0.3, cx - R * 0.72, top + R * 0.42);
      g.fill();
      g.stroke();
      break;
    case "cap":
      g.beginPath();
      g.moveTo(cx - R * 0.92, top + R * 0.55);
      g.bezierCurveTo(cx - R * 0.95, top - R * 0.2, cx + R * 0.95, top - R * 0.2, cx + R * 0.92, top + R * 0.55);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(cx + R * 0.45, top + R * 0.55, R * 0.75, R * 0.12, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      break;
    case "helmet":
      g.beginPath();
      g.moveTo(cx - R * 1.0, top + R * 0.62);
      g.bezierCurveTo(cx - R * 1.0, top - R * 0.32, cx + R * 1.0, top - R * 0.32, cx + R * 1.0, top + R * 0.62);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.roundRect(cx - R * 1.18, top + R * 0.55, R * 2.36, R * 0.16, 8);
      g.fill();
      g.stroke();
      stroke(g, [[cx, top - R * 0.05], [cx, top + R * 0.55]], 8, shadeHex(col, 0.75));
      break;
    case "tophat":
      g.beginPath();
      g.roundRect(cx - R * 0.6, top - R * 0.95, R * 1.2, R * 1.2, 8);
      g.fill();
      g.stroke();
      g.fillStyle = "#b8322e";
      g.fillRect(cx - R * 0.6 + 5, top + R * 0.02, R * 1.2 - 10, R * 0.16);
      g.fillStyle = col;
      g.beginPath();
      g.roundRect(cx - R * 0.98, top + R * 0.22, R * 1.96, R * 0.16, 8);
      g.fill();
      g.stroke();
      break;
    case "straw":
      g.beginPath();
      g.ellipse(cx, top + R * 0.42, R * 1.45, R * 0.24, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(cx - R * 0.68, top + R * 0.4);
      g.bezierCurveTo(cx - R * 0.7, top - R * 0.35, cx + R * 0.7, top - R * 0.35, cx + R * 0.68, top + R * 0.4);
      g.closePath();
      g.fill();
      g.stroke();
      stroke(g, [[cx - R * 0.66, top + R * 0.25], [cx + R * 0.66, top + R * 0.25]], 12, "#b8322e");
      break;
    case "crown":
      g.beginPath();
      g.moveTo(cx - R * 0.6, top + R * 0.25);
      g.lineTo(cx - R * 0.66, top - R * 0.45);
      g.lineTo(cx - R * 0.3, top - R * 0.1);
      g.lineTo(cx, top - R * 0.55);
      g.lineTo(cx + R * 0.3, top - R * 0.1);
      g.lineTo(cx + R * 0.66, top - R * 0.45);
      g.lineTo(cx + R * 0.6, top + R * 0.25);
      g.closePath();
      g.fill();
      g.stroke();
      dot(g, [cx, top - R * 0.05], 12, "#c8322e");
      break;
    case "bearskin":
      g.beginPath();
      g.moveTo(cx - R * 0.8, top + R * 0.5);
      g.bezierCurveTo(cx - R * 0.95, top - R * 1.2, cx + R * 0.95, top - R * 1.2, cx + R * 0.8, top + R * 0.5);
      g.closePath();
      g.fill();
      g.stroke();
      stroke(g, [[cx - R * 0.78, top + R * 0.5], [cx - R * 0.4, cy + R * 0.6]], 6, "#e2b33a");
      break;
    case "hijab": {
      // band over the forehead that frames the face
      g.beginPath();
      g.moveTo(cx - R * 0.98, cy + R * 0.1);
      g.bezierCurveTo(cx - R * 1.02, cy - R * 1.12, cx + R * 1.02, cy - R * 1.12, cx + R * 0.98, cy + R * 0.1);
      g.bezierCurveTo(cx + R * 0.9, cy - R * 0.78, cx - R * 0.9, cy - R * 0.78, cx - R * 0.98, cy + R * 0.1);
      g.fill();
      g.stroke();
      break;
    }
    case "none":
      break;
  }
};

/**
 * Draws the character into ctx, which is already scaled to the 600 x 1000 design space.
 * facing -1 mirrors it (the held item stays in the drawn hand).
 */
export const drawToon = (g: G, who: Who, pose: Pose, expr: Expr, facing: 1 | -1 = 1, item: Item = "none") => {
  const b = BUILDS[who.build ?? "adult"];
  const R = b.R;
  g.save();
  if (facing === -1) {
    g.translate(600, 0);
    g.scale(-1, 1);
  }
  // squash toward the soles
  g.translate(0, SOLE);
  g.scale(1 / Math.sqrt(pose.squash), pose.squash);
  g.translate(0, -SOLE);

  const hipY = SOLE - b.leg + pose.bob * 0.6;
  const shoes = who.shoes ?? INK;

  // legs (behind the torso)
  const legPts = (s: number, limb: Limb, lift: number): Pt[] => {
    const hip: Pt = [CX + s * b.tw * 0.22, hipY];
    const a = limb[0] + lift * 22;
    const half = (SOLE - 14 - hipY) / Math.cos(rad(Math.min(70, limb[0]))) / 2;
    const thigh = half * (1 - 0.42 * lift);
    const d1 = dirOf(a, s);
    const knee: Pt = [hip[0] + d1[0] * thigh, hip[1] + d1[1] * thigh];
    const d2 = dirOf(limb[0] + limb[1] - lift * 34, s);
    const shin = half * (1 - 0.12 * lift);
    const foot: Pt = [knee[0] + d2[0] * shin, knee[1] + d2[1] * shin];
    return [hip, knee, foot];
  };
  for (const [s, limb, lift] of [[-1, pose.legL, pose.liftL], [1, pose.legR, pose.liftR]] as [number, Limb, number][]) {
    const pts = legPts(s, limb, lift);
    stroke(g, pts, 17);
    const f = pts[2];
    g.fillStyle = shoes;
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(f[0] + s * 16, f[1] + 2, 32, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  // upper body rotates about the hips
  g.save();
  g.translate(CX, hipY);
  g.rotate(rad(pose.lean));
  g.translate(-CX, -hipY);
  const neckY = hipY - b.th + pose.bob * 0.4;
  const tw = b.tw;
  const torso = () => {
    g.beginPath();
    g.moveTo(CX - tw * 0.5, hipY + 8);
    g.lineTo(CX - tw * 0.5, neckY + 46);
    g.quadraticCurveTo(CX - tw * 0.5, neckY, CX - tw * 0.2, neckY);
    g.lineTo(CX + tw * 0.2, neckY);
    g.quadraticCurveTo(CX + tw * 0.5, neckY, CX + tw * 0.5, neckY + 46);
    g.lineTo(CX + tw * 0.5, hipY + 8);
    g.quadraticCurveTo(CX + tw * 0.5, hipY + 22, CX + tw * 0.36, hipY + 22);
    g.lineTo(CX - tw * 0.36, hipY + 22);
    g.quadraticCurveTo(CX - tw * 0.5, hipY + 22, CX - tw * 0.5, hipY + 8);
    g.closePath();
  };
  if (who.skirt) {
    g.fillStyle = who.skirt;
    g.beginPath();
    g.moveTo(CX - tw * 0.48, hipY - 10);
    g.lineTo(CX + tw * 0.48, hipY - 10);
    g.lineTo(CX + tw * 0.78, hipY + b.leg * 0.55);
    g.quadraticCurveTo(CX, hipY + b.leg * 0.62, CX - tw * 0.78, hipY + b.leg * 0.55);
    g.closePath();
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = LINE;
    g.stroke();
  }
  g.save();
  torso();
  g.fillStyle = who.shirt;
  g.fill();
  g.clip();
  g.fillStyle = who.skirt ?? who.pants;
  g.fillRect(CX - tw, hipY - b.th * 0.18, tw * 2, b.th);
  stroke(g, [[CX - tw, hipY - b.th * 0.18], [CX + tw, hipY - b.th * 0.18]], 8);
  if (who.apron) {
    g.fillStyle = who.apron;
    g.fillRect(CX - tw * 0.32, neckY + b.th * 0.3, tw * 0.64, b.th);
    stroke(g, [[CX - tw * 0.32, neckY + b.th * 0.3], [CX - tw * 0.32, hipY + 30]], 6);
    stroke(g, [[CX + tw * 0.32, neckY + b.th * 0.3], [CX + tw * 0.32, hipY + 30]], 6);
  }
  if (who.sash) stroke(g, [[CX - tw * 0.55, neckY - 5], [CX + tw * 0.55, hipY - b.th * 0.2]], 22, who.sash);
  // form shade on the far side
  g.fillStyle = "rgba(40,20,40,0.13)";
  g.fillRect(CX + tw * 0.18, neckY - 10, tw, b.th + 40);
  g.restore();
  torso();
  g.strokeStyle = INK;
  g.lineWidth = LINE;
  g.stroke();
  // collar + tie
  stroke(g, [[CX - 24, neckY + 2], [CX, neckY + 30], [CX + 24, neckY + 2]], 7);
  if (who.tie) {
    g.fillStyle = who.tie;
    g.beginPath();
    g.moveTo(CX - 10, neckY + 28);
    g.lineTo(CX + 10, neckY + 28);
    g.lineTo(CX + 14, neckY + b.th * 0.62);
    g.lineTo(CX, neckY + b.th * 0.7);
    g.lineTo(CX - 14, neckY + b.th * 0.62);
    g.closePath();
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.stroke();
  }

  // head (with tilt), behind-the-head parts first
  const cy = neckY - R * 0.82;
  const ry = R * 0.94;
  g.save();
  g.translate(CX, neckY);
  g.rotate(rad(pose.tilt));
  g.translate(-CX, -neckY);
  drawBack(g, CX, cy, R, who);
  const skin = who.skin;
  g.save();
  g.beginPath();
  g.ellipse(CX, cy, R, ry, 0, 0, Math.PI * 2);
  g.fillStyle = shadeHex(skin, 0.9);
  g.fill();
  g.clip();
  g.fillStyle = skin;
  g.beginPath();
  g.ellipse(CX - R * 0.12, cy - R * 0.08, R * 0.98, ry * 0.98, 0, 0, Math.PI * 2);
  g.fill();
  if (expr === "angry") {
    g.fillStyle = "rgba(226,85,63,0.3)";
    g.fillRect(CX - R, cy - ry, R * 2, ry * 2);
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = LINE;
  g.beginPath();
  g.ellipse(CX, cy, R, ry, 0, 0, Math.PI * 2);
  g.stroke();
  drawFace(g, CX, cy, R, who, expr, pose);
  drawTop(g, CX, cy, R, ry, who);
  g.restore();

  // arms in front
  const handOf = (s: number, limb: Limb): [Pt, Pt, Pt] => {
    const sh: Pt = [CX + s * (tw * 0.5 - 8), neckY + 26];
    const d1 = dirOf(limb[0], s);
    const el: Pt = [sh[0] + d1[0] * b.up, sh[1] + d1[1] * b.up];
    const d2 = dirOf(limb[0] + limb[1], s);
    const hd: Pt = [el[0] + d2[0] * b.fore, el[1] + d2[1] * b.fore];
    return [sh, el, hd];
  };
  const L = handOf(-1, pose.armL);
  const Rr = handOf(1, pose.armR);
  for (const pts of [L, Rr]) {
    stroke(g, pts, 15);
    dot(g, pts[2], 15);
  }
  if (item !== "none") drawItem(g, item, Rr[2], 1);
  g.restore();
  g.restore();
};

/** Screen-space boxes of the head, in design units (for the safe-area check). */
export const headBox = (who: Who) => {
  const b = BUILDS[who.build ?? "adult"];
  const neckY = SOLE - b.leg - b.th;
  const cy = neckY - b.R * 0.82;
  return {x0: CX - b.R, x1: CX + b.R, y0: cy - b.R, y1: cy + b.R};
};

/** Draws the figure with a white sticker rim (and grey cut edge for paper) onto `out`. */
export const renderCard = (
  out: HTMLCanvasElement,
  scratch: [HTMLCanvasElement, HTMLCanvasElement],
  who: Who,
  pose: Pose,
  expr: Expr,
  facing: 1 | -1,
  item: Item,
  rim: number,
  edge: number,
  warn: boolean,
) => {
  const W = out.width;
  const H = out.height;
  const k = W / 600;
  const [A, B] = scratch;
  const a = A.getContext("2d")!;
  a.setTransform(1, 0, 0, 1, 0, 0);
  a.clearRect(0, 0, W, H);
  a.setTransform(k, 0, 0, k, 0, 0);
  drawToon(a, who, pose, expr, facing, item);
  const o = out.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(0, 0, W, H);
  const dilate = (r: number, col: string) => {
    const bb = B.getContext("2d")!;
    bb.setTransform(1, 0, 0, 1, 0, 0);
    bb.globalCompositeOperation = "source-over";
    bb.clearRect(0, 0, W, H);
    const n = DRAFT ? 8 : 16;
    for (let i = 0; i < n; i++) bb.drawImage(A, Math.cos((i / n) * Math.PI * 2) * r * k, Math.sin((i / n) * Math.PI * 2) * r * k);
    bb.drawImage(A, 0, 0);
    bb.globalCompositeOperation = "source-in";
    bb.fillStyle = col;
    bb.fillRect(0, 0, W, H);
    bb.globalCompositeOperation = "source-over";
    o.drawImage(B, 0, 0);
  };
  if (edge > 0) dilate(rim + edge, "#b9b2a6");
  if (rim > 0) dilate(rim, mixHex("#ffffff", "#f6f1e6", edge > 0 ? 1 : 0));
  o.drawImage(A, 0, 0);
  if (warn) {
    o.globalCompositeOperation = "source-atop";
    o.fillStyle = "rgba(255,40,40,0.5)";
    o.fillRect(0, 0, W, H);
    o.globalCompositeOperation = "source-over";
  }
};
