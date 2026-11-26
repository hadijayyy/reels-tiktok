import * as THREE from "three";

/*
 * Looks, light presets, procedural textures and cached materials for the 3D cartoon kit.
 *
 *   look "kartun"   painted toon world: 3-step toon shading, black ink outline on every solid,
 *                   strong colours, white sticker rim on the cast. (Like the reference "painted" look.)
 *   look "diorama"  paper cutouts in a warm toy model: soft lit materials, no ink, warm low sun,
 *                   cards cast their own shadow, thick white paper margin, tilt-shift blur.
 *
 * Every texture is drawn with a seeded random, so any frame renders the same in any order.
 * Units are metres; a grown-up is about 1.65 m tall.
 */

export type LookName = "kartun" | "diorama";
export type LightName = "siang" | "senja" | "malam" | "dalam" | "kenangan";

export const INK = "#21181f";

export type LookSpec = {
  ink: number; // outline thickness in metres (0 = none)
  toon: boolean;
  rim: number; // white sticker rim around characters, canvas design units
  edge: number; // grey cut edge outside the rim (diorama), design units
  cardShadow: boolean; // the character card casts a real shadow
  saturate: number;
  contrast: number;
  brightness: number;
  vignette: number;
  tilt: number; // tilt-shift blur in px at the top and bottom of the frame
  frameY: number; // where the camera target lands on screen (0 top .. 1 bottom)
  sun?: [number, number, number]; // look-specific sun direction (diorama: low and side-on so cards cast long shadows)
};

export const LOOKS: Record<LookName, LookSpec> = {
  kartun: {ink: 0.022, toon: true, rim: 9, edge: 0, cardShadow: false, saturate: 1.12, contrast: 1.05, brightness: 1.0, vignette: 0.32, tilt: 0, frameY: 0.42},
  diorama: {ink: 0, toon: false, rim: 20, edge: 4, cardShadow: true, saturate: 1.25, contrast: 0.98, brightness: 1.03, vignette: 0.28, tilt: 7, frameY: 0.42, sun: [-6, 4.5, 3]},
};

export type LightSpec = {
  sky: [string, string]; // top, horizon
  sun: [number, number, number]; // direction the sunlight comes FROM (any length)
  sunColor: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  fog: string;
  fogNear: number;
  fogFar: number;
  tint: string; // multiplies the character cards (night = blue)
  overlay?: string; // CSS colour laid over the frame with soft-light (memory = amber)
};

export const LIGHTS: Record<LightName, LightSpec> = {
  siang: {sky: ["#5fb3ea", "#d6eef8"], sun: [4, 9, 6], sunColor: "#fff3df", sunI: 2.4, hemiSky: "#d4ecff", hemiGround: "#8c7a58", hemiI: 1.15, fog: "#d2ebf6", fogNear: 25, fogFar: 70, tint: "#ffffff"},
  senja: {sky: ["#3f4f8f", "#f3a65c"], sun: [-6, 3, 4], sunColor: "#ffb36b", sunI: 2.6, hemiSky: "#9aa6d8", hemiGround: "#7a4a3a", hemiI: 0.9, fog: "#e7a77a", fogNear: 18, fogFar: 60, tint: "#ffe2c8"},
  malam: {sky: ["#0b1030", "#2a3a6a"], sun: [-3, 8, 4], sunColor: "#9db4ff", sunI: 0.9, hemiSky: "#4a5c9c", hemiGround: "#1a1a2a", hemiI: 0.6, fog: "#1c2448", fogNear: 12, fogFar: 45, tint: "#a9b6e6"},
  dalam: {sky: ["#3a2a22", "#6a4a36"], sun: [3, 7, 5], sunColor: "#ffe2b8", sunI: 1.9, hemiSky: "#ffe8cc", hemiGround: "#6a4a3a", hemiI: 1.1, fog: "#5a4030", fogNear: 20, fogFar: 60, tint: "#fff4e6"},
  kenangan: {sky: ["#6a4a2a", "#e8b46a"], sun: [4, 6, 5], sunColor: "#ffcf8a", sunI: 2.0, hemiSky: "#ffd9a0", hemiGround: "#6a4a2a", hemiI: 1.0, fog: "#d9a066", fogNear: 14, fogFar: 50, tint: "#ffe6c0", overlay: "rgba(255,170,80,0.35)"},
};

/* ---------- seeded random ---------- */

export const rnd = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const shadeHex = (c: string, k: number) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

export const mixHex = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16);
  const B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

/* ---------- procedural textures ---------- */

export type TexName = "plain" | "brick" | "planks" | "boards" | "plaster" | "grass" | "dirt" | "cobble" | "stone" | "roof" | "water" | "tiles" | "cloth" | "paper";

const texCache = new Map<string, THREE.CanvasTexture>();

/** A canvas texture drawn once and cached by key. */
export const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = true) => {
  const hit = texCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
};

const speckle = (g: CanvasRenderingContext2D, w: number, h: number, base: string, n: number, amt: number, seed: number) => {
  for (let i = 0; i < n; i++) {
    const k = 1 + (rnd(seed, i) - 0.5) * amt;
    g.fillStyle = shadeHex(base, k);
    g.globalAlpha = 0.35;
    const r = 2 + rnd(seed, i + 900) * 10;
    g.beginPath();
    g.ellipse(rnd(seed, i + 300) * w, rnd(seed, i + 600) * h, r * 1.6, r, rnd(seed, i + 1200) * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
};

/** Draws texture `name` in base colour `c` (one tile; the geometry decides how many metres it covers). */
export const surfTex = (name: TexName, c: string, ink: boolean) =>
  canvasTex(`${name}|${c}|${ink}`, 256, 256, (g, w, h) => {
    const line = ink ? INK : shadeHex(c, 0.62);
    g.fillStyle = c;
    g.fillRect(0, 0, w, h);
    switch (name) {
      case "plain":
        speckle(g, w, h, c, 60, 0.12, 1);
        break;
      case "brick": {
        g.fillStyle = mixHex(c, "#efe4d2", 0.72);
        g.fillRect(0, 0, w, h);
        const rows = 8;
        const bh = h / rows;
        for (let r = 0; r < rows; r++) {
          const off = r % 2 ? 0.5 : 0;
          for (let i = -1; i < 4; i++) {
            const x0 = (i + off) * (w / 4) + 3;
            const k = 0.86 + rnd(r, i + 7) * 0.26;
            g.fillStyle = shadeHex(c, k);
            g.fillRect(x0, r * bh + 3, w / 4 - 6, bh - 6);
            g.fillStyle = shadeHex(c, k * 1.12);
            g.fillRect(x0, r * bh + 3, w / 4 - 6, 4);
            g.strokeStyle = line;
            g.globalAlpha = ink ? 0.55 : 0.25;
            g.lineWidth = 2;
            g.strokeRect(x0, r * bh + 3, w / 4 - 6, bh - 6);
            g.globalAlpha = 1;
          }
        }
        break;
      }
      case "planks":
      case "boards": {
        const n = name === "planks" ? 5 : 4;
        const pw = h / n;
        for (let i = 0; i < n; i++) {
          g.fillStyle = shadeHex(c, 0.88 + rnd(3, i) * 0.24);
          g.fillRect(0, i * pw, w, pw);
          g.strokeStyle = shadeHex(c, 0.7);
          g.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            g.globalAlpha = 0.35;
            g.beginPath();
            const y = i * pw + 6 + rnd(i, k) * (pw - 12);
            g.moveTo(0, y);
            g.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + 1);
            g.stroke();
          }
          g.globalAlpha = 1;
          g.strokeStyle = line;
          g.lineWidth = ink ? 4 : 2;
          g.beginPath();
          g.moveTo(0, i * pw);
          g.lineTo(w, i * pw);
          g.stroke();
          const cut = rnd(i, 11) * w;
          g.beginPath();
          g.moveTo(cut, i * pw);
          g.lineTo(cut, (i + 1) * pw);
          g.stroke();
        }
        break;
      }
      case "plaster":
        speckle(g, w, h, c, 90, 0.14, 2);
        break;
      case "grass":
        speckle(g, w, h, c, 140, 0.3, 3);
        g.strokeStyle = shadeHex(c, 0.72);
        g.lineWidth = 2;
        for (let i = 0; i < 120; i++) {
          const x = rnd(4, i) * w;
          const y = rnd(5, i) * h;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + (rnd(6, i) - 0.5) * 6, y - 8);
          g.stroke();
        }
        break;
      case "dirt":
        speckle(g, w, h, c, 160, 0.28, 7);
        break;
      case "cobble":
      case "stone": {
        g.fillStyle = shadeHex(c, 0.62);
        g.fillRect(0, 0, w, h);
        const n = name === "cobble" ? 6 : 4;
        for (let r = 0; r < n; r++)
          for (let i = 0; i < n; i++) {
            const s = w / n;
            const off = r % 2 ? s / 2 : 0;
            g.fillStyle = shadeHex(c, 0.85 + rnd(r + 20, i) * 0.3);
            g.beginPath();
            g.roundRect(i * s + off + 3, r * s + 3, s - 6, s - 6, s * 0.25);
            g.fill();
            if (off && i === n - 1) {
              g.beginPath();
              g.roundRect(-s / 2 + 3, r * s + 3, s - 6, s - 6, s * 0.25);
              g.fill();
            }
            if (ink) {
              g.strokeStyle = INK;
              g.globalAlpha = 0.4;
              g.lineWidth = 2;
              g.stroke();
              g.globalAlpha = 1;
            }
          }
        break;
      }
      case "roof": {
        const rows = 6;
        for (let r = 0; r < rows; r++) {
          for (let i = 0; i < 6; i++) {
            const s = w / 5;
            const x = (i - (r % 2 ? 0.5 : 0)) * s;
            g.fillStyle = shadeHex(c, 0.85 + rnd(r + 40, i) * 0.25);
            g.beginPath();
            g.moveTo(x, r * (h / rows));
            g.lineTo(x + s, r * (h / rows));
            g.lineTo(x + s, (r + 1) * (h / rows) - 6);
            g.quadraticCurveTo(x + s / 2, (r + 1) * (h / rows) + 6, x, (r + 1) * (h / rows) - 6);
            g.closePath();
            g.fill();
            g.strokeStyle = line;
            g.globalAlpha = 0.5;
            g.lineWidth = 2;
            g.stroke();
            g.globalAlpha = 1;
          }
        }
        break;
      }
      case "water":
        g.strokeStyle = mixHex(c, "#ffffff", 0.5);
        g.lineWidth = 3;
        for (let i = 0; i < 26; i++) {
          const x = rnd(8, i) * w;
          const y = rnd(9, i) * h;
          g.globalAlpha = 0.6;
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + 12, y - 5, x + 24, y);
          g.stroke();
        }
        g.globalAlpha = 1;
        break;
      case "tiles": {
        const n = 4;
        const s = w / n;
        for (let r = 0; r < n; r++)
          for (let i = 0; i < n; i++) {
            g.fillStyle = (r + i) % 2 ? c : mixHex(c, "#f4ecdc", 0.65);
            g.fillRect(i * s, r * s, s, s);
          }
        break;
      }
      case "cloth":
        g.strokeStyle = shadeHex(c, 0.85);
        g.lineWidth = 2;
        for (let i = 0; i < w; i += 6) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i, h);
          g.stroke();
        }
        break;
      case "paper":
        speckle(g, w, h, c, 40, 0.06, 9);
        break;
    }
  });

/* ---------- materials ---------- */

let toonGrad: THREE.DataTexture | null = null;
const gradient = () => {
  if (toonGrad) return toonGrad;
  const data = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
  toonGrad = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter;
  toonGrad.needsUpdate = true;
  return toonGrad;
};

/** A surface: base colour, optional texture, and how many metres one texture tile covers. */
export type Surf = {c: string; tex?: TexName; tile?: number; glow?: number};

const matCache = new Map<string, THREE.Material>();

/** Cached material for a surface in a look. glow > 0 makes it self-lit (lamps, windows at night, fire). */
export const surfMat = (look: LookName, s: Surf) => {
  const key = `${look}|${s.c}|${s.tex ?? "plain"}|${s.glow ?? 0}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const spec = LOOKS[look];
  const map = surfTex(s.tex ?? "plain", s.c, spec.ink > 0);
  let m: THREE.Material;
  if (s.glow) m = new THREE.MeshBasicMaterial({color: new THREE.Color(1, 1, 1).multiplyScalar(Math.min(1.4, s.glow)), map});
  else if (spec.toon) m = new THREE.MeshToonMaterial({map, gradientMap: gradient()});
  else m = new THREE.MeshStandardMaterial({map, roughness: 0.88, metalness: 0});
  matCache.set(key, m);
  return m;
};

let inkMat: THREE.MeshBasicMaterial | null = null;
export const inkMaterial = () => (inkMat ??= new THREE.MeshBasicMaterial({color: INK, side: THREE.BackSide}));

/* ---------- geometry with world-scale UVs ---------- */

const geoCache = new Map<string, THREE.BufferGeometry>();

/** A box whose texture keeps the same size in metres whatever the box size (tile = metres per tile). */
export const boxGeo = (w: number, h: number, d: number, tile: number) => {
  const key = `box|${w}|${h}|${d}|${tile}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z (4 vertices each)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++)
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  uv.needsUpdate = true;
  geoCache.set(key, g);
  return g;
};

export const cachedGeo = (key: string, make: () => THREE.BufferGeometry) => {
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = make();
  geoCache.set(key, g);
  return g;
};
