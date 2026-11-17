import React from "react";
import {C} from "../styles/palette";
import {Label} from "./Furniture";

/*
 * Props for the scam film: phones, coins, a fishing hook, a deposit box, steps and stamps.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units.
 */

/** A coin centred on (x, y). `spin` (any number) squashes it as if it were turning. */
export const Coin: React.FC<{x: number; y: number; r?: number; spin?: number; opacity?: number}> = ({x, y, r = 22, spin = 0, opacity = 1}) => {
  const sx = Math.max(0.15, Math.abs(Math.cos(spin)));
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`} opacity={opacity}>
      <circle r={r} fill={C.yellow} stroke={C.ink} strokeWidth={3} />
      <circle r={r * 0.68} fill="none" stroke="#B8962F" strokeWidth={3} />
      <text y={r * 0.32} textAnchor="middle" fontWeight={800} fontSize={r * 0.9} fill="#8A6D1C" fontFamily="Inter">
        Rp
      </text>
    </g>
  );
};

/** A phone held in the hand: use as a Look's handR. Its screen shows `screen` (local 0..44, 0..70). */
export const handPhone = (screen?: React.ReactNode) => () => (
  <g transform="translate(-6 -64)">
    <rect x={-4} y={-4} width={52} height={86} rx={9} fill={C.ink} />
    <rect x={0} y={4} width={44} height={70} rx={3} fill="#0B1B24" />
    <g transform="translate(0 4)">{screen}</g>
  </g>
);

/** A tiny drama scene for a phone screen: two faces and a heart. Local units 0..44 x 0..70. */
export const DramaScreen: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect width={44} height={70} fill="#3A2440" />
    <circle cx={14} cy={36} r={8} fill={C.bone} />
    <circle cx={30} cy={36} r={8} fill={C.bone} />
    <path d="M 22 22 c -3 -5 -10 -2 -6 3 l 6 6 l 6 -6 c 4 -5 -3 -8 -6 -3 z" fill={C.red} transform={`translate(22 22) scale(${1 + Math.sin(t * 6) * 0.15}) translate(-22 -22)`} />
  </g>
);

/** A large floating phone (UI mockup) centred on (x, y). `children` are drawn in screen units (0..w, 0..h). */
export const BigPhone: React.FC<{x: number; y: number; w?: number; h?: number; children?: React.ReactNode}> = ({x, y, w = 300, h = 420, children}) => (
  <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
    <rect x={-16} y={-34} width={w + 32} height={h + 68} rx={34} fill={C.ink} stroke="#2E3136" strokeWidth={4} />
    <rect x={w / 2 - 34} y={-20} width={68} height={8} rx={4} fill="#2E3136" />
    <rect width={w} height={h} rx={10} fill="#141E2A" />
    {children}
  </g>
);

/** A notification / task card. (x, y) is its centre. */
export const Card: React.FC<{x: number; y: number; w: number; h: number; color?: string; border?: string; children?: React.ReactNode}> = ({x, y, w, h, color = C.bone, border = C.ink, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={color} stroke={border} strokeWidth={5} />
    {children}
  </g>
);

/** A tick in a circle, centred on (x, y). */
export const Tick: React.FC<{x: number; y: number; r?: number; k?: number}> = ({x, y, r = 22, k = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <circle r={r} fill={C.olive} stroke={C.ink} strokeWidth={3} />
    <path d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.35} L ${r * 0.5} ${-r * 0.35}`} fill="none" stroke={C.bone} strokeWidth={r * 0.22} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A padlock centred on (x, y). `open` 0..1 lifts the shackle. */
export const Padlock: React.FC<{x: number; y: number; s?: number; open?: number}> = ({x, y, s = 1, open = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -16 ${-6 - open * 16} v -14 a 16 16 0 0 1 32 0 v ${14 - open * 8}`} fill="none" stroke={C.steel} strokeWidth={8} strokeLinecap="round" />
    <rect x={-26} y={-8} width={52} height={42} rx={8} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
    <circle cx={0} cy={10} r={5} fill={C.ink} />
  </g>
);

/** A deposit box standing on `floor`, centred on x. `fill` 0..1 shows how full it is (coins above the rim). */
export const DepositBox: React.FC<{x: number; floor: number; w?: number; h?: number; fill?: number; label?: string}> = ({x, floor, w = 170, h = 130, fill = 0, label = "DEPOSIT"}) => {
  const n = Math.round(fill * 9);
  return (
    <g transform={`translate(${x} ${floor})`}>
      {Array.from({length: n}, (_, i) => (
        <Coin key={i} x={-48 + (i % 4) * 32 + (Math.floor(i / 4) % 2) * 16} y={-h - 8 - Math.floor(i / 4) * 22} r={20} />
      ))}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={10} fill="#5B4632" stroke={C.ink} strokeWidth={4} />
      <rect x={-w / 2 - 8} y={-h - 6} width={w + 16} height={18} rx={6} fill="#6E5640" stroke={C.ink} strokeWidth={4} />
      <Label x={0} y={-h / 2 + 12} text={label} size={26} color={C.bone} />
    </g>
  );
};

/** A fishing hook hanging from a line that starts at (x, top) and ends at (x, y). */
export const FishHook: React.FC<{x: number; y: number; top: number; sway?: number; children?: React.ReactNode}> = ({x, y, top, sway = 0, children}) => (
  <g transform={`rotate(${sway} ${x} ${top})`}>
    <line x1={x} y1={top} x2={x} y2={y} stroke={C.bone} strokeWidth={3} opacity={0.8} />
    <g transform={`translate(${x} ${y})`}>
      <path d="M 0 0 v 46 a 22 22 0 0 1 -44 0 l -6 -12 l 14 4" fill="none" stroke={C.steel} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <circle r={7} fill={C.steel} stroke={C.ink} strokeWidth={2} />
      {children}
    </g>
  </g>
);

/** A red rubber stamp with `text`, centred on (x, y). `k` 0..1 slams it in. */
export const Stamp: React.FC<{x: number; y: number; text: string; k: number; rot?: number; size?: number}> = ({x, y, text, k, rot = -8, size = 64}) => {
  if (k <= 0) return null;
  const s = 1 + (1 - k) * 1.4;
  const w = text.length * size * 0.66 + 60;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, k * 1.6)}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.5} rx={14} fill="none" stroke={C.red} strokeWidth={9} />
      <Label x={0} y={size * 0.3} text={text} size={size} color={C.red} />
    </g>
  );
};

/** A magnifying glass, lens centred on (x, y). */
export const Magnifier: React.FC<{x: number; y: number; r?: number; children?: React.ReactNode}> = ({x, y, r = 70, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={r * 0.7} y1={r * 0.7} x2={r * 1.6} y2={r * 1.6} stroke={C.woodDark} strokeWidth={r * 0.32} strokeLinecap="round" />
    <circle r={r} fill="#DCEFF7" stroke={C.ink} strokeWidth={8} />
    {children}
  </g>
);
