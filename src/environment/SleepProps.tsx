import React, {useId} from "react";
import {C} from "../styles/palette";
import {NEUTRAL, Look, Stickman} from "../rig/Stickman";

/*
 * Props for the sleep film: a brain, a bed, a sleeping character, a window and small icons.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units.
 */

const sid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

export const BRAIN_PINK = "#E7A0AE";
const BRAIN_FOLD = "#B96C80";

// Bumps around the brain outline, as [x, y, r] in units of the brain radius.
const BUMPS: [number, number, number][] = [
  [-0.62, -0.18, 0.42], [-0.3, -0.5, 0.42], [0.12, -0.56, 0.44], [0.52, -0.36, 0.42],
  [0.74, 0.02, 0.38], [0.5, 0.36, 0.38], [0.08, 0.44, 0.4], [-0.36, 0.38, 0.4], [-0.72, 0.16, 0.34],
];

/** A side-view cartoon brain centred on (x, y). `r` is roughly half its width. `children` are drawn clipped inside it. */
export const Brain: React.FC<{x: number; y: number; r: number; children?: React.ReactNode}> = ({x, y, r, children}) => {
  const id = "b" + sid(useId());
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={id}>
          {BUMPS.map(([bx, by, br], i) => (
            <circle key={i} cx={bx * r} cy={by * r} r={br * r} />
          ))}
          <ellipse cx={0} cy={0} rx={r * 0.8} ry={r * 0.55} />
        </clipPath>
      </defs>
      {/* stem */}
      <path d={`M ${r * 0.1} ${r * 0.6} q ${r * 0.1} ${r * 0.34} ${r * 0.3} ${r * 0.4} l ${r * 0.12} ${-r * 0.5} Z`} fill={BRAIN_FOLD} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {BUMPS.map(([bx, by, br], i) => (
        <circle key={i} cx={bx * r} cy={by * r} r={br * r} fill={BRAIN_PINK} stroke={C.ink} strokeWidth={8} />
      ))}
      {BUMPS.map(([bx, by, br], i) => (
        <circle key={i} cx={bx * r} cy={by * r} r={br * r} fill={BRAIN_PINK} />
      ))}
      <ellipse cx={0} cy={0} rx={r * 0.8} ry={r * 0.55} fill={BRAIN_PINK} />
      {/* folds */}
      <g fill="none" stroke={BRAIN_FOLD} strokeWidth={Math.max(3, r * 0.045)} strokeLinecap="round">
        <path d={`M ${-r * 0.7} ${-r * 0.05} q ${r * 0.2} ${-r * 0.3} ${r * 0.42} ${-r * 0.06} t ${r * 0.4} ${r * 0.02}`} />
        <path d={`M ${-r * 0.2} ${-r * 0.62} q ${r * 0.14} ${r * 0.24} ${-r * 0.04} ${r * 0.4}`} />
        <path d={`M ${r * 0.3} ${-r * 0.6} q ${-r * 0.1} ${r * 0.3} ${r * 0.16} ${r * 0.44} t ${r * 0.34} ${r * 0.08}`} />
        <path d={`M ${-r * 0.5} ${r * 0.34} q ${r * 0.16} ${-r * 0.22} ${r * 0.4} ${-r * 0.04} t ${r * 0.44} ${-r * 0.1}`} />
        <path d={`M ${r * 0.3} ${r * 0.5} q ${r * 0.02} ${-r * 0.2} ${r * 0.2} ${-r * 0.24}`} />
      </g>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

/** Bed frame, mattress and pillow. The mattress top is at `top`; the headboard is on the left. */
export const Bed: React.FC<{x0: number; x1: number; top: number; floor: number}> = ({x0, x1, top, floor}) => (
  <g>
    <rect x={x0 - 22} y={top - 110} width={28} height={floor - top + 110} rx={8} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={x1 - 6} y={top - 30} width={24} height={floor - top + 30} rx={8} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={x0} y={top + 44} width={x1 - x0} height={26} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
    <rect x={x0} y={top} width={x1 - x0} height={46} rx={10} fill={C.bone} stroke={C.ink} strokeWidth={3} />
    <rect x={x0 + 10} y={top - 26} width={150} height={34} rx={16} fill="#F6F4EC" stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Blanket over the sleeper, from x0 to x1, resting on the mattress top. */
export const Blanket: React.FC<{x0: number; x1: number; top: number; h: number; color?: string}> = ({x0, x1, top, h, color = "#4A5A8C"}) => (
  <g>
    <path d={`M ${x0} ${top + 14} L ${x0} ${top - h + 18} Q ${x0} ${top - h} ${x0 + 18} ${top - h} L ${x1 - 30} ${top - h + 8} Q ${x1} ${top - h + 12} ${x1} ${top - 30} L ${x1} ${top + 14} Z`} fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d={`M ${x0} ${top - h + 30} L ${x0 + 34} ${top - h + 30}`} stroke={C.bone} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
  </g>
);

/** A character lying on their back, head to the left. (feetX, y) is the feet end; y is the body's centre line. */
export const Sleeper: React.FC<{feetX: number; y: number; scale: number; look: Look; t: number}> = ({feetX, y, scale, look, t}) => (
  <g transform={`translate(${feetX} ${y}) rotate(-90)`}>
    <Stickman
      x={0}
      y={0}
      scale={scale}
      look={{...look, noShadow: true}}
      expr="calm"
      pose={{...NEUTRAL, shL: 0, shR: 0, elL: 0, elR: 0, bob: Math.sin(t * 1.6) * 1.2}}
    />
  </g>
);

/** Window with a night or day sky. (x, y) is its centre. `day` goes 0 (night, moon) to 1 (day, sun). */
export const SkyWindow: React.FC<{x: number; y: number; w?: number; h?: number; day?: number}> = ({x, y, w = 200, h = 240, day = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={6} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#101A33" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#8CCBEA" opacity={day} />
    <g opacity={1 - day}>
      <circle cx={24} cy={-40} r={34} fill="#F3E9B8" />
      <circle cx={38} cy={-50} r={30} fill="#101A33" />
      {[[-60, -80], [-30, 20], [60, 50], [-66, 70], [50, -92]].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={3} fill="#F3E9B8" />
      ))}
    </g>
    <g opacity={day}>
      <circle cx={24} cy={-40} r={34} fill={C.yellow} />
    </g>
    <line x1={0} y1={-h / 2} x2={0} y2={h / 2} stroke={C.woodDark} strokeWidth={8} />
    <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke={C.woodDark} strokeWidth={8} />
  </g>
);

/** A gear centred on (x, y), turned by `angle` degrees. */
export const Gear: React.FC<{x: number; y: number; r: number; angle: number; color?: string}> = ({x, y, r, angle, color = C.steel}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    {[0, 45, 90, 135].map((a) => (
      <rect key={a} x={-r * 0.2} y={-r * 1.25} width={r * 0.4} height={r * 2.5} rx={r * 0.08} fill={color} stroke={C.ink} strokeWidth={3} transform={`rotate(${a})`} />
    ))}
    <circle r={r} fill={color} stroke={C.ink} strokeWidth={3} />
    <circle r={r * 0.92} fill={color} />
    <circle r={r * 0.36} fill={C.wall} stroke={C.ink} strokeWidth={3} />
  </g>
);
