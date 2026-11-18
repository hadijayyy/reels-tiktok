import React, {useId} from "react";
import {Glow, Label} from "./Furniture";
import {clamp, lerp, noise, rand} from "../motion/ease";
import {Look} from "../rig/Stickman";
import {C} from "../styles/palette";

/*
 * Outer-space props for the Black Hole film: star field, a giant star, a black hole with an
 * accretion disk, the event-horizon ring, a warped space-time grid, asteroids, arrows and an
 * astronaut look. Flat shapes, one outline weight, glows for light. World units as in Furniture.tsx.
 */

export const SP = {
  void: "#03040A",
  deep: "#0A1030",
  star: "#F4EBD0",
  hot: "#FFB347",
  hotter: "#FFE7A8",
  disk: "#FF8A3D",
  diskDeep: "#C4442A",
  blue: "#7FB8FF",
  violet: "#5B3E8C",
  rock: "#3A3A46",
  rockLight: "#4E4E5C",
};

const sid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

/** White space suit, bubble helmet, backpack. */
export const ASTRONAUT: Look = {
  top: "#E9E7DF",
  sleeve: "#E9E7DF",
  trousers: "#C9C7BF",
  shoe: "#7C828C",
  belt: "#7C828C",
  back: <rect x={-54} y={-88} width={24} height={70} rx={6} fill="#B9B7AF" stroke={C.ink} strokeWidth={3} />,
  chest: (
    <g>
      <rect x={-14} y={-12} width={28} height={20} rx={4} fill="#5A6068" stroke={C.ink} strokeWidth={2} />
      <circle cx={-6} cy={-2} r={3} fill={C.red} />
      <circle cx={4} cy={-2} r={3} fill={C.cyan} />
    </g>
  ),
  headExtra: (
    <g>
      <circle r={50} fill="#9CC9F0" fillOpacity={0.12} stroke="#DDEEFF" strokeWidth={4} />
      <path d="M -34 -22 A 40 40 0 0 1 -6 -42" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  ),
};

/** Twinkling star field and two faint nebula glows. Fills x and y from -size to size. */
export const Starfield: React.FC<{t: number; size?: number; count?: number; nebula?: number}> = ({t, size = 1600, count = 260, nebula = 1}) => (
  <g>
    <rect x={-size * 2} y={-size * 2} width={size * 4} height={size * 4} fill={SP.void} />
    {nebula > 0 ? (
      <g opacity={nebula}>
        <Glow x={-380} y={-600} r={700} color={SP.violet} opacity={0.35} />
        <Glow x={450} y={300} r={650} color="#1D3A7A" opacity={0.35} />
      </g>
    ) : null}
    {Array.from({length: count}).map((_, i) => {
      const x = (rand(i * 3 + 1) * 2 - 1) * size;
      const y = (rand(i * 3 + 2) * 2 - 1) * size;
      const r = 0.8 + Math.pow(rand(i * 3 + 3), 3) * 3.2;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + rand(i + 50) * 2) + i);
      return <circle key={i} cx={x} cy={y} r={r} fill={rand(i + 90) > 0.85 ? "#CFE0FF" : SP.star} opacity={tw} />;
    })}
  </g>
);

/** A giant star. heat 1 = yellow-white and steady, 0 = dying red. */
export const BigStar: React.FC<{x: number; y: number; r: number; t: number; heat?: number; opacity?: number}> = ({x, y, r, t, heat = 1, opacity = 1}) => {
  const id = "st" + sid(useId());
  const core = heat > 0.5 ? SP.hotter : "#FFB08A";
  const edge = heat > 0.5 ? SP.hot : SP.diskDeep;
  const wob = 1 + noise(t * 1.5, 4) * 0.015;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={core} />
          <stop offset="70%" stopColor={edge} />
          <stop offset="100%" stopColor={heat > 0.5 ? "#E0702A" : "#7A2418"} />
        </radialGradient>
      </defs>
      <Glow x={0} y={0} r={r * 2.4} color={edge} opacity={0.55 * (0.4 + heat * 0.6)} />
      <circle r={r * wob} fill={`url(#${id})`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={Math.cos(i * 1.9 + t * 0.2) * r * 0.5} cy={Math.sin(i * 2.3 + t * 0.15) * r * 0.45} r={r * (0.08 + rand(i + 5) * 0.07)} fill={edge} opacity={0.35} />
      ))}
    </g>
  );
};

/** Half of an ellipse: the top ("back") or the bottom ("front") half. */
const halfEllipse = (rx: number, ry: number, top: boolean) =>
  top ? `M ${-rx} 0 A ${rx} ${ry} 0 0 1 ${rx} 0` : `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${-rx} 0`;

const DiskRings: React.FC<{r: number; t: number; tilt: number; top: boolean; k: number}> = ({r, t, tilt, top, k}) => (
  <g opacity={k}>
    {[1.35, 1.6, 1.9, 2.25, 2.65].map((m, i) => {
      const rx = r * m;
      const ry = rx * tilt;
      const w = r * (0.32 - i * 0.04);
      const col = i < 2 ? SP.hotter : i < 4 ? SP.hot : SP.disk;
      return (
        <g key={i}>
          <path d={halfEllipse(rx, ry, top)} stroke={col} strokeWidth={w} fill="none" opacity={0.75 - i * 0.1} />
          <path
            d={halfEllipse(rx, ry, top)}
            stroke="#FFF4D8"
            strokeWidth={w * 0.25}
            fill="none"
            strokeDasharray={`${r * 0.25} ${r * 0.45}`}
            strokeDashoffset={(top ? 1 : -1) * t * r * (1.6 - i * 0.2)}
            opacity={0.5}
          />
        </g>
      );
    })}
  </g>
);

/**
 * A black hole: shadow disc, photon ring, and (disk > 0) a tilted accretion disk whose far half is
 * lensed up over the top of the hole. Centre at (x, y), shadow radius r.
 */
export const BlackHole: React.FC<{x: number; y: number; r: number; t: number; disk?: number; tilt?: number; glow?: number}> = ({x, y, r, t, disk = 1, tilt = 0.26, glow = 1}) => (
  <g transform={`translate(${x} ${y})`}>
    <Glow x={0} y={0} r={r * 3.4} color={SP.hot} opacity={0.3 * disk * glow} />
    <DiskRings r={r} t={t} tilt={tilt} top k={disk} />
    {/* far side of the disk, bent over the top of the hole by its own gravity */}
    <g opacity={disk * 0.85}>
      <path d={`M ${-r * 1.25} 0 A ${r * 1.25} ${r * 1.25} 0 0 1 ${r * 1.25} 0`} stroke={SP.hot} strokeWidth={r * 0.32} fill="none" opacity={0.7} />
      <path d={`M ${-r * 1.1} 0 A ${r * 1.1} ${r * 1.1} 0 0 1 ${r * 1.1} 0`} stroke={SP.hotter} strokeWidth={r * 0.12} fill="none" />
    </g>
    <circle r={r * 1.05} fill="none" stroke="#FFE9C0" strokeWidth={r * 0.05} opacity={0.35 + 0.65 * glow} />
    <circle r={r} fill="#000" />
    <DiskRings r={r} t={t} tilt={tilt} top={false} k={disk} />
  </g>
);

/** Dashed ring that marks the event horizon. */
export const HorizonRing: React.FC<{x: number; y: number; r: number; t: number; k?: number; color?: string}> = ({x, y, r, t, k = 1, color = "#9FD4FF"}) => (
  <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray="22 16" strokeDashoffset={-t * 30} opacity={k} />
);

/** A lumpy rock. Its flat top is at y (stand a character on it); w is the width. */
export const Asteroid: React.FC<{x: number; y: number; w?: number; rot?: number}> = ({x, y, w = 300, rot = 0}) => {
  const h = w * 0.42;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d={`M ${-w / 2} 6 Q ${-w / 2 - 10} ${h * 0.5} ${-w * 0.2} ${h} Q ${w * 0.1} ${h * 1.15} ${w * 0.35} ${h * 0.8} Q ${w / 2 + 8} ${h * 0.4} ${w / 2} 4 Q 0 -10 ${-w / 2} 6 Z`}
        fill={SP.rock}
        stroke={C.ink}
        strokeWidth={4}
      />
      <path d={`M ${-w / 2 + 10} 4 Q 0 -8 ${w / 2 - 10} 3`} stroke={SP.rockLight} strokeWidth={8} fill="none" strokeLinecap="round" />
      <circle cx={-w * 0.15} cy={h * 0.45} r={w * 0.07} fill="#2C2C36" />
      <circle cx={w * 0.2} cy={h * 0.35} r={w * 0.045} fill="#2C2C36" />
    </g>
  );
};

/** A straight arrow from (x1, y1) to (x2, y2). */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; w?: number; opacity?: number}> = ({x1, y1, x2, y2, color, w = 12, opacity = 1}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hl = w * 2.6;
  const bx = x2 - Math.cos(a) * hl;
  const by = y2 - Math.sin(a) * hl;
  const px = -Math.sin(a) * w * 1.6;
  const py = Math.cos(a) * w * 1.6;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z`} fill={color} />
    </g>
  );
};

/** A packet of light: bright dot with a soft halo. */
export const Photon: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 9, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.6} fill={SP.hotter} opacity={0.25} />
    <circle cx={x} cy={y} r={r} fill="#FFFBEA" />
  </g>
);

/**
 * Point on a path that spirals from `from` into `centre`: k = 0 at the start, 1 at the centre.
 * turn: extra angle (radians) swept by the end, so the fall curves instead of going straight.
 */
export const spiralIn = (from: {x: number; y: number}, centre: {x: number; y: number}, k: number, turn = 3) => {
  const dx = from.x - centre.x;
  const dy = from.y - centre.y;
  const r0 = Math.hypot(dx, dy);
  const a0 = Math.atan2(dy, dx);
  const r = r0 * (1 - clamp(k));
  const a = a0 + turn * clamp(k) * clamp(k);
  return {x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r};
};

/**
 * A flat grid of space-time seen at an angle, pulled down into a well at its centre.
 * depth 0 = flat, 1 = the full well. Centre of the sheet at (x, y), half-width w.
 */
export const SpacetimeGrid: React.FC<{x: number; y: number; w?: number; depth?: number; color?: string}> = ({x, y, w = 460, depth = 1, color = "#5FA8FF"}) => {
  const N = 14;
  const sag = (u: number, v: number) => {
    const r = Math.hypot(u, v * 1.0);
    return (depth * 340) / (1 + Math.pow(r / 0.16, 2));
  };
  const pt = (u: number, v: number) => `${(x + u * w).toFixed(1)},${(y + v * w * 0.34 + sag(u, v)).toFixed(1)}`;
  const lines: string[] = [];
  for (let i = 0; i <= N; i++) {
    const v = -1 + (2 * i) / N;
    lines.push(Array.from({length: 61}).map((_, j) => pt(-1 + (2 * j) / 60, v)).join(" "));
    const u = -1 + (2 * i) / N;
    lines.push(Array.from({length: 61}).map((_, j) => pt(u, -1 + (2 * j) / 60)).join(" "));
  }
  return (
    <g>
      {lines.map((p, i) => (
        <polyline key={i} points={p} fill="none" stroke={color} strokeWidth={2.4} opacity={0.7} />
      ))}
    </g>
  );
};

/** A pop-in label with a dark backing plate so it reads over the bright disk. */
export const Tag: React.FC<{x: number; y: number; text: string; size?: number; color?: string; k?: number}> = ({x, y, text, size = 56, color = C.bone, k = 1}) => {
  const w = text.length * size * 0.66 + size;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp(k * 1.5)}>
      <rect x={-w / 2} y={-size * 1.05} width={w} height={size * 1.45} rx={size * 0.3} fill="#05060C" opacity={0.72} />
      <Label x={0} y={0} text={text} size={size} color={color} />
    </g>
  );
};

/** Expanding bright ring and flash for the star's collapse. k 0..1. */
export const Burst: React.FC<{x: number; y: number; k: number; r?: number}> = ({x, y, k, r = 600}) => (
  <g transform={`translate(${x} ${y})`} opacity={1 - k}>
    <circle r={lerp(20, r, k)} fill="none" stroke={SP.hotter} strokeWidth={lerp(60, 4, k)} />
    <circle r={lerp(10, r * 0.6, k)} fill="#FFFFFF" opacity={0.5 * (1 - k)} />
  </g>
);
