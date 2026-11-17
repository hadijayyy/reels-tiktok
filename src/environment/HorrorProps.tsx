import React, {useId} from "react";
import {AbsoluteFill} from "remotion";
import {rand} from "../motion/ease";
import {C, H, W} from "../styles/palette";
import {Look} from "../rig/Stickman";

/*
 * Props for night and storm scenes: sea, island, lighthouse, ships, rain, fog, and a vignette.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units.
 */

export const N = {
  sky: "#0A0F1C",
  skyDay: "#2B3442",
  sea: "#0F1D2B",
  seaLight: "#1C3044",
  foam: "#B9C7D3",
  rock: "#1A1E24",
  rockLight: "#262B33",
  fog: "#8C9AAA",
  beam: "#F3E3A0",
  oilskin: "#D9A93B",
};

const sid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

/** Lighthouse keepers' look: dark coat and cap. */
export const KEEPER: Look = {top: "#2B3446", sleeve: "#2B3446", coat: "#1F2633", trousers: "#1B1E24", hat: "cap", hatColor: "#14171C"};

/** A night (or stormy day) sky band from y0 down to y1. */
export const Sky: React.FC<{y0?: number; y1?: number; day?: number}> = ({y0 = -1400, y1 = 600, day = 0}) => {
  const id = "s" + sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={day ? N.skyDay : "#05070E"} />
          <stop offset="100%" stopColor={day ? "#4A5563" : "#1A2236"} />
        </linearGradient>
      </defs>
      <rect x={-2000} y={y0} width={4000} height={y1 - y0} fill={`url(#${id})`} />
    </g>
  );
};

/** The sea from y down, with moving swell lines. `rough` scales the waves. */
export const Sea: React.FC<{y: number; t: number; rough?: number}> = ({y, t, rough = 1}) => (
  <g>
    <rect x={-2000} y={y} width={4000} height={1600} fill={N.sea} />
    {[0, 1, 2, 3, 4].map((row) => {
      const yy = y + 20 + row * 60;
      const amp = (8 + row * 4) * rough;
      const pts = Array.from({length: 41}, (_, i) => {
        const x = -2000 + i * 100;
        return `${x} ${yy + Math.sin(x * 0.012 + t * (1.2 + row * 0.3) + row) * amp}`;
      }).join(" L ");
      return <path key={row} d={`M ${pts}`} fill="none" stroke={N.seaLight} strokeWidth={6 + row * 2} opacity={0.6 - row * 0.08} />;
    })}
  </g>
);

/** A rocky island whose flat top is at `top`, centred on x, from x - w/2 to x + w/2, standing in the sea at seaY. */
export const Island: React.FC<{x: number; w: number; top: number; seaY: number}> = ({x, w, top, seaY}) => {
  const l = x - w / 2;
  const r = x + w / 2;
  return (
    <g>
      <path
        d={`M ${l - 60} ${seaY + 30} L ${l} ${top + 120} L ${l + w * 0.12} ${top + 30} L ${l + w * 0.3} ${top} L ${r - w * 0.25} ${top - 10} L ${r - w * 0.08} ${top + 50} L ${r} ${top + 160} L ${r + 70} ${seaY + 30} Z`}
        fill={N.rock}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={`M ${l + w * 0.12} ${top + 30} L ${l + w * 0.3} ${top} L ${r - w * 0.25} ${top - 10} L ${r - w * 0.08} ${top + 50}`} fill="none" stroke={N.rockLight} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

/** A lighthouse standing on (x, y). `on` 0..1 lights the lamp; `beamAngle` sweeps the beam (degrees). */
export const Lighthouse: React.FC<{x: number; y: number; s?: number; on?: number; beamAngle?: number}> = ({x, y, s = 1, on = 1, beamAngle = 0}) => {
  const id = "b" + sid(useId());
  const reach = 1400;
  // the beam narrows to a sliver as it swings toward or away from us
  const facing = Math.cos((beamAngle * Math.PI) / 180);
  const half = 70 * Math.abs(facing) + 8;
  const dir = facing >= 0 ? 1 : -1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={id} x1={dir > 0 ? "0" : "1"} y1="0" x2={dir > 0 ? "1" : "0"} y2="0">
          <stop offset="0%" stopColor={N.beam} stopOpacity={0.55 * on} />
          <stop offset="100%" stopColor={N.beam} stopOpacity={0} />
        </linearGradient>
      </defs>
      {on > 0.01 ? <path d={`M 0 -268 L ${dir * reach} ${-268 - half * 4} L ${dir * reach} ${-268 + half * 4} Z`} fill={`url(#${id})`} /> : null}
      {/* tower */}
      <path d="M -52 0 L -34 -230 L 34 -230 L 52 0 Z" fill="#D8D4C8" stroke={C.ink} strokeWidth={4} />
      <path d="M -47 -60 L -43 -110 L 43 -110 L 47 -60 Z" fill="#3B4252" />
      <rect x={-10} y={-44} width={20} height={44} rx={8} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
      {/* gallery and lantern */}
      <rect x={-50} y={-238} width={100} height={12} fill={C.ink} />
      <rect x={-28} y={-290} width={56} height={52} fill={on > 0.01 ? N.beam : "#2A303A"} opacity={on > 0.01 ? 0.4 + on * 0.6 : 1} stroke={C.ink} strokeWidth={4} />
      <line x1={0} y1={-290} x2={0} y2={-238} stroke={C.ink} strokeWidth={3} />
      <path d="M -36 -290 L 0 -322 L 36 -290 Z" fill="#222831" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1={0} y1={-322} x2={0} y2={-340} stroke={C.ink} strokeWidth={4} />
    </g>
  );
};

/** A small steamer, hull bottom at the waterline (x, y). `lights` 0..1. */
export const Steamer: React.FC<{x: number; y: number; s?: number; t: number; lights?: number; flip?: boolean}> = ({x, y, s = 1, t, lights = 1, flip}) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.6) * 4}) scale(${flip ? -s : s} ${s}) rotate(${Math.sin(t * 1.3) * 1.5})`}>
    {[0, 1, 2].map((i) => {
      const k = (t * 0.4 + i / 3) % 1;
      return <circle key={i} cx={30 + k * 60} cy={-150 - k * 120} r={16 + k * 30} fill="#3A4150" opacity={0.5 * (1 - k)} />;
    })}
    <path d="M -150 -40 L 150 -40 L 120 0 L -130 0 Z" fill="#1B1F27" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-80} y={-80} width={140} height={40} fill="#2A2F39" stroke={C.ink} strokeWidth={3} />
    <rect x={10} y={-140} width={34} height={60} fill="#5A2A24" stroke={C.ink} strokeWidth={3} />
    {[-60, -30, 0, 30].map((wx) => (
      <circle key={wx} cx={wx} cy={-60} r={6} fill={N.beam} opacity={lights} />
    ))}
  </g>
);

/** Diagonal rain streaks over the area x0..x1, y0..y1. */
export const Rain: React.FC<{t: number; x0?: number; x1?: number; y0?: number; y1?: number; amount?: number; opacity?: number}> = ({t, x0 = -900, x1 = 900, y0 = -1100, y1 = 900, amount = 120, opacity = 0.35}) => (
  <g stroke="#AFC0D0" strokeWidth={3} strokeLinecap="round" opacity={opacity}>
    {Array.from({length: amount}, (_, i) => {
      const span = y1 - y0;
      const x = x0 + rand(i * 2 + 1) * (x1 - x0);
      const y = y0 + ((rand(i * 2 + 2) * span + t * 1500) % span);
      return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 46} />;
    })}
  </g>
);

/** Drifting fog banks around height y. */
export const Fog: React.FC<{y: number; t: number; opacity?: number}> = ({y, t, opacity = 0.18}) => {
  const id = "f" + sid(useId());
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={N.fog} stopOpacity={opacity} />
          <stop offset="100%" stopColor={N.fog} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: 6}, (_, i) => {
        const x = -1300 + ((i * 520 + t * (30 + i * 6)) % 2600);
        return <ellipse key={i} cx={x} cy={y + Math.sin(i * 2) * 60} rx={420} ry={130} fill={`url(#${id})`} />;
      })}
    </g>
  );
};

/** A wall clock centred on (x, y) with fixed hands (h, m). */
export const StoppedClock: React.FC<{x: number; y: number; r?: number; h?: number; m?: number}> = ({x, y, r = 60, h = 9, m = 10}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#CFC9B8" stroke={C.ink} strokeWidth={5} />
    {Array.from({length: 12}, (_, i) => (
      <line key={i} x1={0} y1={-r * 0.82} x2={0} y2={-r * 0.7} stroke={C.ink} strokeWidth={3} transform={`rotate(${i * 30})`} />
    ))}
    <line x1={0} y1={0} x2={0} y2={-r * 0.48} stroke={C.ink} strokeWidth={6} strokeLinecap="round" transform={`rotate(${(h % 12) * 30 + m * 0.5})`} />
    <line x1={0} y1={0} x2={0} y2={-r * 0.72} stroke={C.ink} strokeWidth={4} strokeLinecap="round" transform={`rotate(${m * 6})`} />
    <circle r={5} fill={C.red} />
  </g>
);

/** A wall peg with an oilskin coat hanging from it (or empty). (x, y) is the peg. */
export const CoatPeg: React.FC<{x: number; y: number; coat?: boolean; sway?: number}> = ({x, y, coat, sway = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-8} y={-6} width={16} height={22} rx={4} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
    {coat ? (
      <g transform={`rotate(${sway})`}>
        <path d="M -10 8 L -62 40 L -76 230 L 76 230 L 62 40 L 10 8 Z" fill={N.oilskin} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M -62 40 L -96 170 L -78 176 L -58 90" fill={N.oilskin} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M 62 40 L 96 170 L 78 176 L 58 90" fill={N.oilskin} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <line x1={0} y1={30} x2={0} y2={230} stroke="#A8822B" strokeWidth={4} />
      </g>
    ) : null}
  </g>
);

/** An iron railing along the ground from x0 to x1 at y. `bend` 0..1 twists it out of shape. */
export const Railing: React.FC<{x0: number; x1: number; y: number; bend?: number}> = ({x0, x1, y, bend = 0}) => {
  const posts = 6;
  const pts = Array.from({length: posts}, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / (posts - 1);
    const k = Math.sin((i / (posts - 1)) * Math.PI) * bend;
    return {x: x + k * 70, top: y - 110 + k * 60, lean: k * 40};
  });
  return (
    <g stroke="#8A929E" strokeWidth={12} strokeLinecap="round" fill="none">
      {pts.map((p, i) => (
        <line key={i} x1={x0 + ((x1 - x0) * i) / (posts - 1)} y1={y} x2={p.x + p.lean} y2={p.top} />
      ))}
      <path d={`M ${pts.map((p) => `${p.x + p.lean} ${p.top}`).join(" L ")}`} />
    </g>
  );
};

/** A big boulder centred on (x, y). */
export const Boulder: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 80, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M ${-r} ${r * 0.4} L ${-r * 0.8} ${-r * 0.4} L ${-r * 0.2} ${-r * 0.75} L ${r * 0.6} ${-r * 0.55} L ${r} ${r * 0.1} L ${r * 0.7} ${r * 0.55} Z`} fill="#3A3F48" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M ${-r * 0.5} ${-r * 0.3} L ${r * 0.1} ${-r * 0.45}`} stroke="#4C525C" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A small slate board with chalk writing, centred on (x, y). `k` 0..1 writes the text in. */
export const Slate: React.FC<{x: number; y: number; lines: string[]; k: number}> = ({x, y, lines, k}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-230} y={-130} width={460} height={260} rx={10} fill="#2D3330" stroke={C.woodDark} strokeWidth={14} />
    {lines.map((line, i) => {
      const shown = line.slice(0, Math.round(line.length * Math.min(1, Math.max(0, k * lines.length - i))));
      return (
        <text key={i} x={-190} y={-50 + i * 70} fontFamily="Inter" fontWeight={600} fontSize={44} fill="#E6E4DA" opacity={0.9}>
          {shown}
        </text>
      );
    })}
  </g>
);

/** A distress flare: a rising red dot leaving a smoke trail, launched from (x, y). `k` 0..1. */
export const Flare: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0) return null;
  const top = y - 700 * Math.sin(Math.min(1, k) * Math.PI * 0.5);
  return (
    <g>
      <line x1={x} y1={y} x2={x + 20 * k} y2={top} stroke="#6A707A" strokeWidth={6} opacity={0.5 * (1 - k * 0.6)} />
      <circle cx={x + 20 * k} cy={top} r={16} fill={C.red} />
      <circle cx={x + 20 * k} cy={top} r={60} fill={C.red} opacity={0.18} />
    </g>
  );
};

/** Screen-space vignette and a faint flicker, drawn over a whole scene. */
export const Vignette: React.FC<{frame: number; strength?: number}> = ({frame, strength = 0.75}) => {
  const flicker = 0.03 * (rand(Math.floor(frame / 2) + 900) - 0.5);
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={strength} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#vignette)" />
        <rect width={W} height={H} fill="#000" opacity={Math.max(0, flicker)} />
      </svg>
    </AbsoluteFill>
  );
};
