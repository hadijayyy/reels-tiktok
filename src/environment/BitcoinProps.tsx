import React from "react";
import {C} from "../styles/palette";
import {clamp} from "../motion/ease";
import {Label} from "./Furniture";

/*
 * Props for the "what if Bitcoin goes to zero" explainer: a plain orange coin (a "B", no logo artwork),
 * a mining rig, a falling price chart, gold bars and money jars. Flat shapes, one stroke weight.
 */

/** An orange crypto coin centred on (x, y). grey 0..1 drains its colour (worthless); crack 0..1 splits it. */
export const BtcCoin: React.FC<{x: number; y: number; r?: number; spin?: number; grey?: number; crack?: number; opacity?: number}> = ({x, y, r = 60, spin = 0, grey = 0, crack = 0, opacity = 1}) => {
  const sx = Math.max(0.18, Math.abs(Math.cos(spin)));
  const fill = grey > 0.5 ? "#7D7F84" : "#F2A33A";
  const rim = grey > 0.5 ? "#5A5C60" : "#C77A1C";
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`} opacity={opacity}>
      <circle r={r} fill={fill} stroke={C.ink} strokeWidth={Math.max(3, r * 0.07)} />
      <circle r={r * 0.78} fill="none" stroke={rim} strokeWidth={Math.max(2, r * 0.06)} />
      <text y={r * 0.36} textAnchor="middle" fontWeight={800} fontSize={r * 1.05} fill={grey > 0.5 ? "#4A4C50" : "#FFF4E0"} fontFamily="Inter">
        B
      </text>
      {crack > 0 ? (
        <path d={`M ${-r * 0.1} ${-r} L ${r * 0.15} ${-r * 0.35} L ${-r * 0.12} ${r * 0.1} L ${r * 0.2} ${r * 0.55} L 0 ${r}`} fill="none" stroke={C.ink} strokeWidth={Math.max(3, r * 0.07)} strokeLinejoin="round" opacity={clamp(crack * 2)} />
      ) : null}
    </g>
  );
};

/** A mining rig: a metal box with two fans and status lights. Base centre at (x, y). on 0..1. */
export const MiningRig: React.FC<{x: number; y: number; s?: number; t: number; on?: number}> = ({x, y, s = 1, t, on = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-110} y={-130} width={220} height={130} rx={10} fill="#3A3F47" stroke={C.ink} strokeWidth={5} />
    {[-50, 50].map((fx, i) => (
      <g key={i} transform={`translate(${fx} -70)`}>
        <circle r={38} fill="#24282E" stroke={C.ink} strokeWidth={4} />
        <g transform={`rotate(${on > 0.5 ? t * 900 + i * 40 : 20})`}>
          {[0, 1, 2, 3].map((b) => (
            <path key={b} transform={`rotate(${b * 90})`} d="M 0 0 Q 12 -20 0 -32 Q -8 -18 0 0 Z" fill="#8C8F95" />
          ))}
        </g>
        <circle r={7} fill="#8C8F95" />
      </g>
    ))}
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={-80 + i * 22} cy={-116} r={6} fill={on > 0.5 ? (Math.sin(t * 9 + i * 2) > 0 ? "#5EE07A" : "#2F7A4F") : "#3A2A2A"} />
    ))}
  </g>
);

/** A price line that climbs then falls to the floor. k 0..1 draws it; base-left at (x, y), w x h. */
export const CrashChart: React.FC<{x: number; y: number; w?: number; h?: number; k: number}> = ({x, y, w = 420, h = 300, k}) => {
  const pts = [[0, 0.35], [0.15, 0.55], [0.3, 0.5], [0.45, 0.8], [0.55, 0.72], [0.62, 0.9], [0.72, 0.45], [0.82, 0.25], [0.9, 0.1], [1, 0.0]];
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"} ${px * w} ${-py * h}`).join(" ");
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={w} y2={0} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-h - 20} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
    </g>
  );
};

/** A pyramid of gold bars, base centre at (x, y). rows sets its size. */
export const GoldBars: React.FC<{x: number; y: number; rows?: number; s?: number}> = ({x, y, rows = 4, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: rows}).flatMap((_, r) =>
      Array.from({length: rows - r}).map((__, c) => {
        const bx = (c - (rows - r - 1) / 2) * 92;
        const by = -r * 40;
        return (
          <g key={`${r}-${c}`} transform={`translate(${bx} ${by})`}>
            <path d="M -42 0 L -32 -36 L 32 -36 L 42 0 Z" fill={C.yellow} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
            <path d="M -26 -30 L 20 -30" stroke="#FFF3C4" strokeWidth={4} strokeLinecap="round" />
          </g>
        );
      }),
    )}
  </g>
);

/** A glass jar with a label and a fill level (0..1). Base centre at (x, y). */
export const Jar: React.FC<{x: number; y: number; label: string; fill?: number; color?: string; s?: number}> = ({x, y, label, fill = 0.5, color = C.yellow, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-170 * clamp(fill)} width={120} height={170 * clamp(fill)} fill={color} opacity={0.85} />
    <path d="M -64 -190 L -64 0 L 64 0 L 64 -190" fill="none" stroke={C.ink} strokeWidth={5} />
    <rect x={-72} y={-206} width={144} height={20} rx={6} fill="#8C8F95" stroke={C.ink} strokeWidth={4} />
    <rect x={-56} y={-120} width={112} height={40} rx={6} fill={C.bone} stroke={C.ink} strokeWidth={3} />
    <Label x={0} y={-91} text={label} size={label.length > 8 ? 17 : 22} color={C.ink} />
  </g>
);
