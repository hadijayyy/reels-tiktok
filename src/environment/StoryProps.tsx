import React from "react";
import {C} from "../styles/palette";
import {clamp} from "../motion/ease";
import {Label} from "./Furniture";
import {HandProp} from "../rig/Stickman";

/*
 * Props for the revenge story: a letter in hand, a mirror, a park bench, a flip calendar, a speech bubble,
 * laughter marks, a rising sun. Same drawing rules as Furniture.tsx: flat shapes, one outline weight.
 */

/** An envelope held in the hand (use as a Look's handR). */
export const handLetter: HandProp = () => (
  <g transform="translate(-8 -30)">
    <rect x={-6} y={-14} width={58} height={40} rx={3} fill={C.bone} stroke={C.ink} strokeWidth={3} />
    <path d="M -6 -14 L 23 8 L 52 -14" fill="none" stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A folder of papers held in the hand (use as a Look's handR). */
export const handFolder: HandProp = () => (
  <g transform="translate(-10 -40)">
    <rect x={-6} y={-20} width={64} height={78} rx={4} fill="#C9A45A" stroke={C.ink} strokeWidth={3} />
    <rect x={2} y={-14} width={50} height={64} fill={C.bone} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={8} y1={-4 + i * 12} x2={44} y2={-4 + i * 12} stroke={C.steel} strokeWidth={3} />
    ))}
  </g>
);

/** A wall mirror centred on (x, y). `children` draw the reflection, clipped to the glass. */
export const Mirror: React.FC<{x: number; y: number; w?: number; h?: number; children?: React.ReactNode}> = ({x, y, w = 220, h = 380, children}) => {
  const id = `mirror-${x}-${y}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={id}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2.2} />
        </clipPath>
      </defs>
      <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={w / 2} fill={C.wood} stroke={C.ink} strokeWidth={4} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2.2} fill="#3A4A5E" />
      <g clipPath={`url(#${id})`}>{children}</g>
      <path d={`M ${-w / 4} ${-h / 3} L ${-w / 8} ${-h / 2.6}`} stroke={C.bone} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
    </g>
  );
};

/** A park bench whose seat matches chairSeatTop(seat = 87). (x, y) = the chair anchor x, floor y. */
export const Bench: React.FC<{x: number; y: number; facing?: 1 | -1; len?: number}> = ({x, y, facing = 1, len = 300}) => (
  <g transform={`translate(${x} ${y}) scale(${facing} 1)`}>
    <rect x={-60} y={-91} width={len} height={16} rx={4} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={-74} y={-230} width={16} height={150} rx={4} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    {[-40, len - 90].map((lx) => (
      <rect key={lx} x={lx} y={-76} width={12} height={76} fill={C.steel} stroke={C.ink} strokeWidth={2} />
    ))}
  </g>
);

/** A desk calendar page with big text, centred on (x, y). `flip` 0..1 animates the page turning. */
export const Calendar: React.FC<{x: number; y: number; text: string; sub?: string; flip?: number; s?: number}> = ({x, y, text, sub, flip = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-160} width={300} height={320} rx={16} fill={C.bone} stroke={C.ink} strokeWidth={5} />
    <rect x={-150} y={-160} width={300} height={70} rx={16} fill={C.red} stroke={C.ink} strokeWidth={5} />
    {[-80, 80].map((rx) => (
      <rect key={rx} x={rx - 8} y={-180} width={16} height={40} rx={6} fill={C.steel} stroke={C.ink} strokeWidth={3} />
    ))}
    {sub ? <Label x={0} y={-112} text={sub} size={30} color={C.bone} /> : null}
    <Label x={0} y={60} text={text} size={96} color={C.ink} />
    {flip > 0 && flip < 1 ? (
      <path d={`M -150 -90 L 150 -90 L 150 ${-90 + 250 * (1 - flip)} L -150 ${-90 + 250 * (1 - flip)} Z`} fill="#D8D3C4" stroke={C.ink} strokeWidth={3} opacity={0.9} />
    ) : null}
  </g>
);

/** Speech bubble with up to two lines, tail pointing at (tx, ty). Centre at (x, y). */
export const SpeechBubble: React.FC<{x: number; y: number; lines: string[]; k: number; tx: number; ty: number; size?: number; w?: number}> = ({x, y, lines, k, tx, ty, size = 40, w}) => {
  if (k <= 0) return null;
  const ww = w ?? Math.max(...lines.map((l) => l.length)) * size * 0.58 + size * 1.4;
  const hh = lines.length * size * 1.25 + size * 0.9;
  return (
    <g opacity={clamp(k * 1.5)}>
      <path d={`M ${x - 30} ${y + hh / 2 - 4} L ${tx} ${ty} L ${x + 20} ${y + hh / 2 - 4} Z`} fill={C.bone} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g transform={`translate(${x} ${y}) scale(${k})`}>
        <rect x={-ww / 2} y={-hh / 2} width={ww} height={hh} rx={hh / 2.6} fill={C.bone} stroke={C.ink} strokeWidth={4} />
        {lines.map((l, i) => (
          <Label key={i} x={0} y={-hh / 2 + size * 0.45 + (i + 1) * size * 1.2 - size * 0.25} text={l} size={size} color={C.ink} />
        ))}
      </g>
      <path d={`M ${x - 26} ${y + hh / 2 - 6} L ${x + 16} ${y + hh / 2 - 6}`} stroke={C.bone} strokeWidth={8} />
    </g>
  );
};

/** Floating laughter: "HAHA" marks bobbing near (x, y). */
export const Laugh: React.FC<{x: number; y: number; t: number; k: number; seed?: number; size?: number; color?: string}> = ({x, y, t, k, seed = 0, size = 40, color = C.red}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y + Math.sin(t * 9 + seed) * 6}) rotate(${Math.sin(t * 7 + seed) * 8}) scale(${k})`}>
      <Label x={0} y={0} text="HAHA" size={size} color={color} />
    </g>
  );

/** A rising sun on the horizon at y; `k` 0..1 lifts it. */
export const Sunrise: React.FC<{x: number; y: number; k: number; r?: number}> = ({x, y, k, r = 150}) => (
  <g>
    <circle cx={x} cy={y - k * r * 1.1} r={r * 2.4} fill="#F6C76B" opacity={0.12 * k} />
    <circle cx={x} cy={y - k * r * 1.1} r={r * 1.6} fill="#F6C76B" opacity={0.18 * k} />
    <circle cx={x} cy={y - k * r * 1.1} r={r} fill="#F8D27A" />
  </g>
);
