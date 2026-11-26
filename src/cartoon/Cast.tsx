import React from "react";
import * as THREE from "three";
import {canvasTex, mixHex} from "./look";
import {useStage, V3} from "./Stage";
import {Expr, headBox, Item, P, Pose, renderCard, Who} from "./Toon";

/*
 * The cast and 2D effects as cards in the 3D world. Cards turn to face the camera around the vertical
 * axis (they never tip over), stand on the ground at (x, z), and get a soft contact shadow.
 *
 *   <Toon who={CAST.ilmuwan} x={0} z={0} pose={P.talk(t)} expr="happy" />
 *   <Fx kind="burst" at={[0, 1, 0]} size={1.2} k={pop} />
 *   <Label3D text="1752" at={[0, 2.4, 0]} size={0.5} />
 */

const RES = 1.25; // canvas pixels per design unit (600 x 1000 design -> 750 x 1250 px)

const blobTex = () =>
  canvasTex("blob", 128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(20,12,20,0.55)");
    gr.addColorStop(0.6, "rgba(20,12,20,0.25)");
    gr.addColorStop(1, "rgba(20,12,20,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }, false);

/** A soft dark ellipse on the ground under a character or prop. */
export const ContactShadow: React.FC<{x: number; z: number; w: number; d?: number; y?: number; opacity?: number}> = ({x, z, w, d, y = 0.012, opacity = 1}) => (
  <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
    <planeGeometry args={[w, d ?? w * 0.45]} />
    <meshBasicMaterial map={blobTex()} transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

/** " [f=123]" in probe mode, so check_layout can tell which frame a warning belongs to. */
export const probeTag = (probe: number | null) => (probe === null ? "" : ` [f=${probe}]`);

/** Shorts/Reels safe area for faces and on-screen text (px on the 1080 x 1920 frame). */
export const SAFE3D = {x0: 43, x1: 907, y0: 154, y1: 1300};

/** Yaw (around y) that turns a card at (x, z) to face the camera. */
const faceCam = (x: number, z: number, cam: V3) => Math.atan2(cam[0] - x, cam[2] - z);

export type ToonProps = {
  who: Who;
  x: number;
  z: number;
  y?: number; // lift off the ground (standing on a box, jumping)
  /** card height in metres (1000 design units). 2.0 -> a grown-up about 1.65 m tall. */
  h?: number;
  pose?: Pose;
  expr?: Expr;
  facing?: 1 | -1;
  item?: Item;
  /** roll in degrees (falling over, lying down = 90) */
  roll?: number;
  opacity?: number;
  /** turn to face the camera (default) or a fixed yaw in degrees */
  yaw?: number;
  shadow?: boolean;
};

export const Toon: React.FC<ToonProps> = ({who, x, z, y = 0, h = 2.0, pose, expr = "neutral", facing = 1, item = "none", roll = 0, opacity = 1, yaw, shadow = true}) => {
  const st = useStage();
  const p = pose ?? P.idle(st.t, who.seed ?? x * 7.3 + z);
  const {card, scratch, tex, mat, depth} = React.useMemo(() => {
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(600 * RES);
      c.height = Math.round(1000 * RES);
      return c;
    };
    const card = mk();
    const tex = new THREE.CanvasTexture(card);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide});
    const depth = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5});
    return {card, scratch: [mk(), mk()] as [HTMLCanvasElement, HTMLCanvasElement], tex, mat, depth};
  }, []);

  const w = h * 0.6;
  const rotY = yaw === undefined ? faceCam(x, z, st.cam.pos) : (yaw * Math.PI) / 180;
  // safe-area check on the head (check mode only)
  let warn = false;
  if (st.check && opacity > 0.5) {
    const hb = headBox(who);
    const u = (dx: number): V3 => [x + Math.cos(rotY) * dx, 0, z - Math.sin(rotY) * dx];
    const toW = (ux: number, uy: number): V3 => {
      const [wx, , wz] = u(((ux - 300) / 600) * w);
      return [wx, y + h * (1 - uy / 1000) - h * 0.025, wz];
    };
    const pts = [toW(hb.x0, hb.y0), toW(hb.x1, hb.y0), toW(hb.x0, hb.y1), toW(hb.x1, hb.y1)].map(st.project);
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    const inFront = new THREE.Vector3(...st.cam.at).sub(new THREE.Vector3(...st.cam.pos)).dot(new THREE.Vector3(x, y + h * 0.7, z).sub(new THREE.Vector3(...st.cam.pos))) > 0;
    // Shorts/Reels UI: left 4 %, right 16 %, top 8 %; and the face stays above the caption band
    if (inFront && Math.max(...xs) > 0 && Math.min(...xs) < 1080 && Math.max(...ys) > 0 && Math.min(...ys) < 1920 && (Math.min(...xs) < 43 || Math.max(...xs) > 907 || Math.min(...ys) < 154 || Math.max(...ys) > 1300)) {
      warn = true;
      console.warn(`LUAR AREA${probeTag(st.probe)}: karakter ${who.name ?? ""} (wajah di x ${Math.round(Math.min(...xs))}..${Math.round(Math.max(...xs))}, y ${Math.round(Math.min(...ys))}..${Math.round(Math.max(...ys))})`);
    }
  }
  if (st.probe !== null) return null;
  renderCard(card, scratch, who, p, expr, facing, item, st.spec.rim, st.spec.edge, warn);
  tex.needsUpdate = true;
  mat.opacity = opacity;
  mat.color.set(st.light.tint);

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <group rotation={[0, 0, (-roll * Math.PI) / 180]} position={[0, roll ? h * 0.12 : 0, 0]}>
        <mesh position={[0, h / 2 - h * 0.025, 0]} material={mat} customDepthMaterial={depth} castShadow={st.spec.cardShadow} renderOrder={3}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
      {shadow && y < 0.3 ? <ContactShadow x={0} z={0.02} w={h * 0.42} opacity={opacity * (1 - y * 2)} /> : null}
    </group>
  );
};

/* ---------- effects ---------- */

export type FxKind = "burst" | "spark" | "smoke" | "glow" | "bang" | "question" | "exclaim" | "zzz" | "heart" | "lines" | "drop" | "star" | "flame";

const drawFx = (g: CanvasRenderingContext2D, kind: FxKind, k: number, color: string, s: number) => {
  const c = s / 2;
  g.clearRect(0, 0, s, s);
  g.lineJoin = "round";
  g.lineCap = "round";
  const ink = "#21181f";
  const star = (n: number, r0: number, r1: number, rot: number) => {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * Math.PI * 2;
      const r = i % 2 ? r1 : r0;
      g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    g.closePath();
  };
  switch (kind) {
    case "burst": {
      const r = s * 0.48 * Math.min(1, k * 1.6);
      g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      g.fillStyle = color;
      star(11, r, r * 0.45, k * 0.6);
      g.fill();
      g.fillStyle = "#ffffff";
      star(11, r * 0.62, r * 0.3, k * 0.6 + 0.2);
      g.fill();
      break;
    }
    case "bang":
      g.fillStyle = color;
      g.strokeStyle = ink;
      g.lineWidth = s * 0.03;
      star(9, s * 0.46 * Math.min(1, k * 2), s * 0.26 * Math.min(1, k * 2), 0.2);
      g.fill();
      g.stroke();
      break;
    case "spark":
      g.strokeStyle = color;
      g.lineWidth = s * 0.035;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + i;
        const r0 = s * 0.08 + k * s * 0.3;
        const r1 = r0 + s * 0.12 * (1 - k);
        g.globalAlpha = 1 - k;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
        g.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
        g.stroke();
      }
      break;
    case "smoke":
      g.fillStyle = color;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.globalAlpha = 0.75 * (1 - k);
        g.beginPath();
        g.arc(c + Math.cos(a) * s * 0.18 * (0.5 + k), c + Math.sin(a) * s * 0.12 * (0.5 + k) - k * s * 0.15, s * (0.1 + 0.12 * k), 0, Math.PI * 2);
        g.fill();
      }
      break;
    case "glow": {
      const gr = g.createRadialGradient(c, c, 0, c, c, c);
      gr.addColorStop(0, mixHex(color, "#ffffff", 0.6));
      gr.addColorStop(0.25, color);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = k;
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      break;
    }
    case "question":
    case "exclaim":
    case "zzz": {
      g.globalAlpha = Math.min(1, k * 3);
      g.font = `800 ${s * 0.6}px Inter, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      const txt = kind === "question" ? "?" : kind === "exclaim" ? "!" : "Z z";
      g.lineWidth = s * 0.06;
      g.strokeStyle = ink;
      g.strokeText(txt, c, c);
      g.fillStyle = color;
      g.fillText(txt, c, c);
      break;
    }
    case "heart":
      g.fillStyle = color;
      g.strokeStyle = ink;
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.moveTo(c, s * 0.78);
      g.bezierCurveTo(s * 0.1, s * 0.5, s * 0.2, s * 0.15, c, s * 0.32);
      g.bezierCurveTo(s * 0.8, s * 0.15, s * 0.9, s * 0.5, c, s * 0.78);
      g.fill();
      g.stroke();
      break;
    case "lines":
      g.strokeStyle = color;
      g.lineWidth = s * 0.025;
      for (let i = 0; i < 5; i++) {
        const y = s * (0.25 + i * 0.12);
        g.globalAlpha = 0.9 * (1 - k);
        g.beginPath();
        g.moveTo(s * (0.1 + k * 0.3), y);
        g.lineTo(s * (0.55 + k * 0.3), y);
        g.stroke();
      }
      break;
    case "drop":
      g.fillStyle = color;
      g.strokeStyle = ink;
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.moveTo(c, s * 0.15);
      g.quadraticCurveTo(s * 0.78, s * 0.6, c, s * 0.82);
      g.quadraticCurveTo(s * 0.22, s * 0.6, c, s * 0.15);
      g.fill();
      g.stroke();
      break;
    case "flame": {
      // k = time in seconds (drives the flicker)
      const tongue = (w: number, hh: number, col: string, ph: number) => {
        const sway = Math.sin(k * 9 + ph) * s * 0.04;
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(c - w, s * 0.92);
        g.quadraticCurveTo(c - w * 1.1, s * 0.92 - hh * 0.55, c + sway, s * 0.92 - hh);
        g.quadraticCurveTo(c + w * 1.1, s * 0.92 - hh * 0.55, c + w, s * 0.92);
        g.closePath();
        g.fill();
      };
      const fl = 1 + Math.sin(k * 17) * 0.06 + Math.sin(k * 7.3) * 0.05;
      tongue(s * 0.3, s * 0.8 * fl, color, 0);
      tongue(s * 0.2, s * 0.58 * fl, "#ffb03a", 1.7);
      tongue(s * 0.1, s * 0.34 * fl, "#fff2b0", 3.1);
      break;
    }
    case "star":
      g.fillStyle = color;
      g.strokeStyle = ink;
      g.lineWidth = s * 0.03;
      star(5, s * 0.42, s * 0.18, -Math.PI / 2);
      g.fill();
      g.stroke();
      break;
  }
  g.globalAlpha = 1;
};

const FX_DEFAULT: Record<FxKind, string> = {burst: "#ffd24a", bang: "#ffd24a", spark: "#ffe27a", smoke: "#e8e2d8", glow: "#ffcf6a", question: "#ffffff", exclaim: "#ffd24a", zzz: "#ffffff", heart: "#e8505b", lines: "#ffffff", drop: "#8fd3ff", star: "#ffd24a", flame: "#ff6a2a"};

/**
 * A 2D effect card in the world, always facing the camera. k = its animation progress 0..1
 * (burst/spark/smoke play out from 0 to 1; glow uses k as brightness; text marks fade in;
 * flame takes k = time in seconds so it keeps flickering). Its card stands on `at` only for flame (bottom centre).
 */
export const Fx: React.FC<{kind: FxKind; at: V3; size?: number; k?: number; color?: string; spin?: number}> = ({kind, at, size = 1, k = 1, color, spin = 0}) => {
  const st = useStage();
  const {cv, tex, mat} = React.useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
    return {cv, tex, mat};
  }, []);
  if (k <= 0 || st.probe !== null) return null;
  drawFx(cv.getContext("2d")!, kind, kind === "flame" ? k : Math.min(1, k), color ?? FX_DEFAULT[kind], 256);
  tex.needsUpdate = true;
  mat.blending = kind === "glow" ? THREE.AdditiveBlending : THREE.NormalBlending;
  const yaw = faceCam(at[0], at[2], st.cam.pos);
  const dx = st.cam.pos[0] - at[0];
  const dz = st.cam.pos[2] - at[2];
  const pitch = Math.atan2(st.cam.pos[1] - at[1], Math.hypot(dx, dz));
  return (
    <mesh position={kind === "flame" ? [at[0], at[1] + size * 0.42, at[2]] : at} rotation={new THREE.Euler(-pitch, yaw, spin, "YXZ")} material={mat} renderOrder={5}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

let measureCtx: CanvasRenderingContext2D | null = null;

/** Check mode: warns when a label that is fully shown is off screen, cut, or under the Reels UI. */
const checkLabel = (st: ReturnType<typeof useStage>, text: string, at: V3, size: number, yaw: number, bg: boolean) => {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  let frac = 0.9;
  if (measureCtx) {
    measureCtx.font = "800 150px Inter, sans-serif";
    const tw = measureCtx.measureText(text).width;
    const fit = Math.min(150, (150 * (1024 - (bg ? 170 : 60))) / Math.max(1, tw));
    frac = Math.min(1004, (tw * fit) / 150 + (bg ? 90 : 30)) / 1024;
  }
  const hw = size * 2 * frac;
  const hh = size * 0.4;
  const r: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => st.project([at[0] + r[0] * hw * a, at[1] + hh * b, at[2] + r[2] * hw * a]));
  const camDir = new THREE.Vector3(...st.cam.at).sub(new THREE.Vector3(...st.cam.pos));
  const inFront = camDir.dot(new THREE.Vector3(...at).sub(new THREE.Vector3(...st.cam.pos))) > 0;
  const xs = corners.map((q) => q[0]);
  const ys = corners.map((q) => q[1]);
  const box = `x ${Math.round(Math.min(...xs))}..${Math.round(Math.max(...xs))}, y ${Math.round(Math.min(...ys))}..${Math.round(Math.max(...ys))}`;
  const offScreen = !inFront || Math.max(...xs) < 0 || Math.min(...xs) > 1080 || Math.max(...ys) < 0 || Math.min(...ys) > 1920;
  if (offScreen) console.warn(`LABEL TIDAK TERLIHAT${probeTag(st.probe)}: "${text}" sudah muncul tapi di luar layar (${box})`);
  else if (Math.min(...xs) < SAFE3D.x0 || Math.max(...xs) > SAFE3D.x1 || Math.min(...ys) < SAFE3D.y0 || Math.max(...ys) > SAFE3D.y1)
    console.warn(`LUAR AREA${probeTag(st.probe)}: label "${text}" terpotong atau di bawah UI Reels (${box})`);
};

export const fontReady = () => {
  if (typeof document === "undefined") return false;
  let ok = false;
  (document.fonts as unknown as {forEach: (cb: (f: FontFace) => void) => void}).forEach((f) => {
    if (f.family.replace(/"/g, "") === "Inter" && f.status === "loaded") ok = true;
  });
  return ok;
};

/** Text floating in the world (a year, a number, a name), facing the camera, with an ink outline. */
export const Label3D: React.FC<{text: string; at: V3; size?: number; color?: string; k?: number; bg?: string}> = ({text, at, size = 0.4, color = "#ffffff", k = 1, bg}) => {
  const st = useStage();
  const ready = fontReady();
  const key = `label|${text}|${color}|${bg ?? ""}|${ready}`;
  const tex = canvasTex(key, 1024, 256, (g, w, h) => {
    // shrink long text so it always fits the card (with its outline and plate)
    g.font = `800 150px Inter, sans-serif`;
    const fit = Math.min(150, (150 * (w - (bg ? 170 : 60))) / Math.max(1, g.measureText(text).width));
    g.font = `800 ${Math.floor(fit)}px Inter, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (bg) {
      const tw = Math.min(w - 20, g.measureText(text).width + 90);
      g.fillStyle = bg;
      g.strokeStyle = "#21181f";
      g.lineWidth = 12;
      g.beginPath();
      g.roundRect((w - tw) / 2, 28, tw, h - 56, 40);
      g.fill();
      g.stroke();
    }
    g.lineJoin = "round";
    g.lineWidth = 26 * (fit / 150);
    g.strokeStyle = "#21181f";
    g.strokeText(text, w / 2, h / 2 + 8);
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 8);
  }, false);
  if (k <= 0) return null;
  const yaw = faceCam(at[0], at[2], st.cam.pos);
  if (st.check && k >= 0.9) checkLabel(st, text, at, size, yaw, Boolean(bg));
  if (st.probe !== null) return null;
  const s = size * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.15 * (1 - k) - Math.pow(1 - k, 3) : 1);
  return (
    <mesh position={at} rotation={[0, yaw, 0]} renderOrder={6}>
      <planeGeometry args={[s * 4, s]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};
