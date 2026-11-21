import React from "react";
import {C} from "../styles/palette";
import {clamp} from "../motion/ease";
import {Label} from "./Furniture";

/*
 * Props for the "two ways to use money" film: cash, shopping items, learning items, a laptop, a growth chart.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units, palette colours.
 */

const NOTE = "#C9544A";

/** A banknote centred on (x, y), rotated by rot. */
export const Banknote: React.FC<{x: number; y: number; s?: number; rot?: number; opacity?: number}> = ({x, y, s = 1, rot = 0, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
    <rect x={-60} y={-30} width={120} height={60} rx={6} fill={NOTE} stroke={C.ink} strokeWidth={4} />
    <rect x={-50} y={-21} width={100} height={42} rx={4} fill="none" stroke="#F1D2C9" strokeWidth={3} />
    <circle cx={0} cy={0} r={13} fill="#F1D2C9" />
  </g>
);

/** A stack of banknotes, `n` notes high, base at (x, y). */
export const CashStack: React.FC<{x: number; y: number; n?: number; s?: number}> = ({x, y, n = 6, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: n}, (_, i) => (
      <Banknote key={i} x={(i % 2) * 6 - 3} y={-30 - i * 12} />
    ))}
    <rect x={-14} y={-30 - n * 12} width={28} height={n * 12 + 4} fill={C.yellow} stroke={C.ink} strokeWidth={3} opacity={0.9} />
  </g>
);

/** A sneaker, sole centre at (x, y). */
export const Sneaker: React.FC<{x: number; y: number; s?: number; worn?: number}> = ({x, y, s = 1, worn = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - worn * 0.45}>
    <path d="M -70 0 L -70 -46 Q -66 -60 -40 -60 L -10 -60 L 10 -36 L 60 -26 Q 80 -20 80 0 Z" fill={worn > 0.5 ? "#8A8478" : C.cyan} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-74} y={-8} width={158} height={14} rx={6} fill={C.bone} stroke={C.ink} strokeWidth={4} />
    <path d="M -20 -48 L 0 -40 M -14 -38 L 8 -30" stroke={C.bone} strokeWidth={4} strokeLinecap="round" />
  </g>
);

/** A fancy dish under a cloche-free plate: a burger with steam. Centre bottom at (x, y). */
export const FancyMeal: React.FC<{x: number; y: number; s?: number; t?: number; gone?: number}> = ({x, y, s = 1, t = 0, gone = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={90} ry={16} fill={C.bone} stroke={C.ink} strokeWidth={4} />
    <g opacity={1 - gone}>
      <path d="M -56 -14 Q -56 -66 0 -70 Q 56 -66 56 -14 Z" fill="#D9A24A" stroke={C.ink} strokeWidth={4} />
      <rect x={-62} y={-24} width={124} height={12} rx={6} fill="#5E8A3A" stroke={C.ink} strokeWidth={3} />
      <rect x={-58} y={-14} width={116} height={14} rx={6} fill="#6B3A22" stroke={C.ink} strokeWidth={3} />
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.6 + i / 3) % 1;
        return <path key={i} d={`M ${-30 + i * 30} ${-80 - ph * 60} q 10 -12 0 -24`} fill="none" stroke={C.bone} strokeWidth={4} strokeLinecap="round" opacity={0.6 * (1 - ph)} />;
      })}
    </g>
  </g>
);

/** A small phone (gadget) standing, centre bottom at (x, y). */
export const Gadget: React.FC<{x: number; y: number; s?: number; cracked?: number}> = ({x, y, s = 1, cracked = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-38} y={-140} width={76} height={140} rx={12} fill={C.ink} stroke="#2E3136" strokeWidth={4} />
    <rect x={-30} y={-128} width={60} height={112} rx={4} fill={cracked > 0.5 ? "#2A2F38" : "#6B4BC4"} />
    {cracked > 0.5 ? <path d="M -24 -120 L 0 -86 L -12 -62 L 14 -40 L 4 -20" fill="none" stroke={C.bone} strokeWidth={3} /> : <circle cx={0} cy={-72} r={16} fill={C.yellow} opacity={0.8} />}
  </g>
);

/** A stack of books, base centre at (x, y). */
export const BookStack: React.FC<{x: number; y: number; n?: number; s?: number}> = ({x, y, n = 4, s = 1}) => {
  const cols = [C.orange, C.cyan, C.yellow, "#8FBF7F", C.red];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({length: n}, (_, i) => {
        const w = 130 - (i % 3) * 12;
        return (
          <g key={i} transform={`translate(${((i * 17) % 20) - 10} ${-17 - i * 32})`}>
            <rect x={-w / 2} y={-16} width={w} height={32} rx={5} fill={cols[i % cols.length]} stroke={C.ink} strokeWidth={4} />
            <line x1={-w / 2 + 12} y1={-16} x2={-w / 2 + 12} y2={16} stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

/** An open laptop, centre bottom at (x, y). `screen` is drawn in 0..160 x 0..100. */
export const Laptop: React.FC<{x: number; y: number; s?: number; screen?: React.ReactNode}> = ({x, y, s = 1, screen}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-90} y={-120} width={180} height={116} rx={8} fill="#2B2D31" stroke={C.ink} strokeWidth={4} />
    <g transform="translate(-80 -110)">
      <rect width={160} height={100} fill="#16212C" />
      {screen}
    </g>
    <path d="M -110 0 L 110 0 L 96 -8 L -96 -8 Z" fill={C.steel} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** A play-button course screen (local 160 x 100). */
export const CourseScreen: React.FC = () => (
  <g>
    <rect width={160} height={100} fill="#1E5A7A" />
    <circle cx={80} cy={46} r={26} fill={C.bone} />
    <path d="M 72 33 L 94 46 L 72 59 Z" fill="#1E5A7A" />
    <rect x={16} y={82} width={128} height={8} rx={4} fill="#0E2A3A" />
    <rect x={16} y={82} width={70} height={8} rx={4} fill={C.yellow} />
  </g>
);

/** A work screen with lines of output (local 160 x 100). */
export const WorkScreen: React.FC<{t: number}> = ({t}) => (
  <g>
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={12} y={12 + i * 17} width={40 + ((i * 53 + Math.floor(t * 5) * 31) % 100)} height={8} rx={3} fill={i % 2 ? C.yellow : C.cyan} opacity={0.85} />
    ))}
  </g>
);

/** A rising bar chart, base-left at (x, y). `k` 0..1 grows it. */
export const GrowthChart: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => {
  const hs = [50, 80, 120, 170, 240];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={0} x2={330} y2={0} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-280} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      {hs.map((h, i) => {
        const kk = clamp(k * hs.length - i);
        return <rect key={i} x={20 + i * 62} y={-h * kk} width={46} height={h * kk} fill={i === hs.length - 1 ? C.yellow : "#5E9347"} stroke={C.ink} strokeWidth={4} />;
      })}
      <path d={`M 10 -40 L ${10 + 300 * k} ${-40 - 220 * k}`} stroke={C.yellow} strokeWidth={6} strokeLinecap="round" opacity={k > 0.1 ? 1 : 0} />
    </g>
  );
};

/** An empty wallet turned out, centre at (x, y). */
export const EmptyWallet: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-46} width={140} height={92} rx={14} fill="#6B4A30" stroke={C.ink} strokeWidth={4} />
    <rect x={-60} y={-36} width={120} height={20} rx={6} fill="#4A3220" />
    <path d="M -20 46 Q 0 80 20 46" fill="#3A2818" stroke={C.ink} strokeWidth={3} />
    <circle cx={46} cy={0} r={8} fill={C.yellow} />
  </g>
);

/** A small price / item tag with text. */
export const ItemTag: React.FC<{x: number; y: number; text: string; k: number; color?: string}> = ({x, y, text, k, color = C.yellow}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-(text.length * 14 + 26)} y={-26} width={text.length * 28 + 52} height={50} rx={12} fill={C.charcoal} stroke={color} strokeWidth={4} />
      <Label x={0} y={10} text={text} size={30} color={C.bone} />
    </g>
  );
