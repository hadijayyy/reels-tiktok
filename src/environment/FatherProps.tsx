import React from "react";
import {C} from "../styles/palette";
import {clamp, lerp} from "../motion/ease";
import {Label} from "./Furniture";
import {HandProp} from "../rig/Stickman";

/*
 * Props for the "father never buys anything for himself" film: worn and new shoes, a gift box, a school bag,
 * a toy, a wallet, sewing, a wardrobe, a keepsake box, a note, receipts, a graduation photo, a budget sheet.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units, palette colours.
 */

const LEATHER = "#4A3424";

/** A man's leather shoe, sole centre at (x, y), pointing right. `flap` 0..1 opens the worn sole at the toe. */
export const OldShoe: React.FC<{x: number; y: number; s?: number; flap?: number; fresh?: boolean; flip?: boolean}> = ({x, y, s = 1, flap = 0, fresh = false, flip = false}) => {
  const up = fresh ? "#1E1E22" : LEATHER;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* sole: the front half hinges open */}
      <rect x={-80} y={-12} width={90} height={12} rx={4} fill="#2A2420" stroke={C.ink} strokeWidth={3} />
      <g transform={`translate(10 -6) rotate(${flap * 18})`}>
        <rect x={0} y={-6} width={78} height={12} rx={5} fill="#2A2420" stroke={C.ink} strokeWidth={3} />
      </g>
      <path d="M -78 -12 L -78 -58 Q -74 -70 -50 -68 L -14 -62 Q 30 -48 72 -34 Q 90 -26 86 -12 Z" fill={up} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -30 -60 L -6 -44 M -20 -64 L 4 -48" stroke={fresh ? C.steel : "#2A1C12"} strokeWidth={3} strokeLinecap="round" />
      {!fresh ? <path d="M 20 -44 Q 34 -40 46 -32 M -60 -40 L -46 -36" stroke="#7A5A40" strokeWidth={3} strokeLinecap="round" /> : <path d="M 30 -44 Q 50 -38 70 -28" stroke="#FFFFFF" strokeWidth={3} opacity={0.5} strokeLinecap="round" />}
    </g>
  );
};

/** A wrapped gift box; `open` 0..1 lifts the lid. Base centre at (x, y). */
export const GiftBox: React.FC<{x: number; y: number; s?: number; open?: number; color?: string}> = ({x, y, s = 1, open = 0, color = C.red}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-100} width={140} height={100} fill={color} stroke={C.ink} strokeWidth={4} />
    <rect x={-12} y={-100} width={24} height={100} fill={C.yellow} stroke={C.ink} strokeWidth={3} />
    <g transform={`translate(0 ${-open * 70}) rotate(${-open * 20})`}>
      <rect x={-80} y={-124} width={160} height={26} fill={color} stroke={C.ink} strokeWidth={4} />
      <rect x={-12} y={-124} width={24} height={26} fill={C.yellow} stroke={C.ink} strokeWidth={3} />
      <path d="M 0 -124 C -40 -170 -50 -120 0 -124 C 50 -120 40 -170 0 -124 Z" fill={C.yellow} stroke={C.ink} strokeWidth={3} />
    </g>
    {open > 0.3 ? <circle cx={0} cy={-110} r={60 * open} fill={C.yellow} opacity={0.25 * open} /> : null}
  </g>
);

/** A school backpack, base centre at (x, y). */
export const SchoolBag: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 -120 Q 0 -150 30 -120" fill="none" stroke={C.ink} strokeWidth={8} />
    <rect x={-55} y={-125} width={110} height={125} rx={22} fill="#2E6B8A" stroke={C.ink} strokeWidth={4} />
    <rect x={-38} y={-60} width={76} height={46} rx={10} fill="#3E86AA" stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A toy car, base centre at (x, y). */
export const ToyCar: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -20 L -66 -46 L -30 -50 L -12 -76 L 30 -76 L 50 -50 L 72 -46 L 74 -20 Z" fill={C.yellow} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={-40} cy={-16} r={16} fill={C.ink} />
    <circle cx={44} cy={-16} r={16} fill={C.ink} />
  </g>
);

/** An open wallet with a few notes, held in the hand (use as a Look's handR or handL). */
export const handWallet: HandProp = () => (
  <g transform="translate(-6 -34)">
    <rect x={-10} y={-24} width={70} height={46} rx={6} fill="#6B4A30" stroke={C.ink} strokeWidth={3} />
    <rect x={-2} y={-34} width={44} height={20} rx={2} fill="#C9544A" stroke={C.ink} strokeWidth={2} />
  </g>
);

/** Needle and thread held in the hand. */
export const handNeedle: HandProp = () => (
  <g transform="translate(-4 -20)">
    <line x1={0} y1={0} x2={0} y2={-40} stroke={C.bone} strokeWidth={3} strokeLinecap="round" />
    <path d="M 0 -40 Q 30 -60 20 -10 Q 14 20 40 30" fill="none" stroke={C.red} strokeWidth={2} />
  </g>
);

/** A wardrobe; `open` 0..1 swings the doors, letting warm light out. Base centre at (x, y). */
export const Wardrobe: React.FC<{x: number; y: number; s?: number; open?: number; children?: React.ReactNode}> = ({x, y, s = 1, open = 0, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-170} y={-520} width={340} height={520} rx={8} fill={C.woodDark} stroke={C.ink} strokeWidth={5} />
    <rect x={-154} y={-504} width={308} height={488} fill="#1A1410" />
    <rect x={-154} y={-504} width={308} height={488} fill="#F6C76B" opacity={0.18 * open} />
    {children}
    {/* doors */}
    <g transform={`translate(-154 0) scale(${1 - open * 0.85} 1)`}>
      <rect x={0} y={-504} width={154} height={488} fill={C.wood} stroke={C.ink} strokeWidth={4} />
      <circle cx={136} cy={-260} r={7} fill={C.yellow} />
    </g>
    <g transform={`translate(154 0) scale(${1 - open * 0.85} 1)`}>
      <rect x={-154} y={-504} width={154} height={488} fill={C.wood} stroke={C.ink} strokeWidth={4} />
      <circle cx={-136} cy={-260} r={7} fill={C.yellow} />
    </g>
  </g>
);

/** A cardboard keepsake box, base centre at (x, y). `open` 0..1 folds the flaps back. */
export const KeepBox: React.FC<{x: number; y: number; s?: number; open?: number; children?: React.ReactNode}> = ({x, y, s = 1, open = 0, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {children}
    <path d="M -160 -150 L 160 -150 L 150 0 L -150 0 Z" fill="#B08A58" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M -160 -150 L ${lerp(-160, -230, open)} ${lerp(-150, -200, open)} L ${lerp(0, -60, open)} ${lerp(-150, -210, open)} L 0 -150 Z`} fill="#C49C68" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M 160 -150 L ${lerp(160, 230, open)} ${lerp(-150, -200, open)} L ${lerp(0, 60, open)} ${lerp(-150, -210, open)} L 0 -150 Z`} fill="#C49C68" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** A handwritten note card centred on (x, y) with up to three short lines. */
export const NoteCard: React.FC<{x: number; y: number; lines: string[]; k?: number; rot?: number; size?: number}> = ({x, y, lines, k = 1, rot = -3, size = 30}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <rect x={-250} y={-(lines.length * size * 1.35) / 2 - 30} width={500} height={lines.length * size * 1.35 + 60} rx={6} fill="#F3EBD6" stroke={C.ink} strokeWidth={4} />
      {lines.map((l, i) => (
        <g key={i}>
          <line x1={-220} y1={-(lines.length * size * 1.35) / 2 + (i + 1) * size * 1.35 + 6} x2={220} y2={-(lines.length * size * 1.35) / 2 + (i + 1) * size * 1.35 + 6} stroke="#C9BFA6" strokeWidth={2} />
          <text x={0} y={-(lines.length * size * 1.35) / 2 + (i + 1) * size * 1.35} textAnchor="middle" fontFamily="Inter" fontStyle="italic" fontWeight={600} fontSize={size} fill="#2A3A6A">
            {l}
          </text>
        </g>
      ))}
    </g>
  );

/** A small pile of receipts, base centre at (x, y). */
export const Receipts: React.FC<{x: number; y: number; n?: number; s?: number}> = ({x, y, n = 5, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: n}, (_, i) => (
      <g key={i} transform={`translate(${((i * 37) % 40) - 20} ${-10 - i * 9}) rotate(${((i * 53) % 24) - 12})`}>
        <rect x={-60} y={-40} width={120} height={80} fill="#FAF6EA" stroke={C.ink} strokeWidth={3} />
        {[0, 1, 2].map((j) => (
          <line key={j} x1={-44} y1={-20 + j * 18} x2={j === 2 ? 10 : 44} y2={-20 + j * 18} stroke="#A8A08C" strokeWidth={3} />
        ))}
      </g>
    ))}
  </g>
);

/** A framed graduation photo (cap and gown), centred on (x, y). */
export const GradPhoto: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-80} y={-100} width={160} height={200} rx={6} fill="#4A3220" stroke={C.ink} strokeWidth={4} />
    <rect x={-66} y={-86} width={132} height={172} fill="#B9CFE0" />
    <path d="M -50 86 Q -44 30 0 26 Q 44 30 50 86 Z" fill="#1E1E24" stroke={C.ink} strokeWidth={2.5} />
    <circle cx={0} cy={-10} r={30} fill="#F2F0EA" stroke={C.ink} strokeWidth={2.5} />
    <path d="M -44 -40 L 0 -58 L 44 -40 L 0 -24 Z" fill="#1E1E24" stroke={C.ink} strokeWidth={2} />
    <line x1={34} y1={-38} x2={38} y2={-10} stroke={C.yellow} strokeWidth={3} />
    <circle cx={-9} cy={-10} r={2.6} fill={C.ink} />
    <circle cx={9} cy={-10} r={2.6} fill={C.ink} />
    <path d="M -9 2 Q 0 9 9 2" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
  </g>
);

/** A budget sheet with item rows; `struck` lists row indexes crossed out, with progress k 0..1. */
export const BudgetSheet: React.FC<{x: number; y: number; rows: string[]; shown: number[]; strike?: number; strikeRow?: number; s?: number}> = ({x, y, rows, shown, strike = 0, strikeRow = -1, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-220} y={-40} width={440} height={rows.length * 70 + 70} rx={8} fill="#F3EBD6" stroke={C.ink} strokeWidth={4} />
    <Label x={0} y={8} text="KEBUTUHAN" size={34} color={C.ink} />
    {rows.map((r, i) => {
      const k = clamp(shown[i] ?? 0);
      const yy = 70 + i * 70;
      return (
        <g key={r} opacity={k}>
          <text x={-190} y={yy} fontFamily="Inter" fontWeight={700} fontSize={34} fill={i === strikeRow ? C.red : "#2A3A6A"}>
            {`• ${r}`}
          </text>
          {i === strikeRow && strike > 0 ? <line x1={-196} y1={yy - 12} x2={-196 + 390 * strike} y2={yy - 12} stroke={C.red} strokeWidth={7} strokeLinecap="round" /> : null}
        </g>
      );
    })}
  </g>
);

/** A desk lamp, base at (x, y), shining down-left. */
export const DeskLamp: React.FC<{x: number; y: number; on?: number}> = ({x, y, on = 1}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -140 -80 L -30 -150 L 10 -150 L 60 -60 Z" fill="#F6C76B" opacity={0.15 * on} />
    <rect x={-30} y={-6} width={60} height={10} rx={3} fill={C.steel} stroke={C.ink} strokeWidth={3} />
    <line x1={0} y1={-4} x2={-10} y2={-120} stroke={C.steel} strokeWidth={6} />
    <path d="M -10 -120 L -60 -150 L -40 -170 L 10 -140 Z" fill={C.olive} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A shirt with a visible stitched tear, centred at (x, y). `stitch` 0..1 sews it up. */
export const Shirt: React.FC<{x: number; y: number; s?: number; stitch?: number}> = ({x, y, s = 1, stitch = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -80 -90 L -40 -110 Q 0 -96 40 -110 L 80 -90 L 110 -40 L 80 -26 L 70 -50 L 70 90 L -70 90 L -70 -50 L -80 -26 L -110 -40 Z" fill="#6B5B45" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -20 0 L 10 30 L -6 50" fill="none" stroke="#2A2018" strokeWidth={6} />
    {[0, 1, 2, 3, 4].map((i) => (
      <line key={i} x1={-26 + i * 8} y1={-6 + i * 12} x2={-6 + i * 8} y2={2 + i * 12} stroke={C.bone} strokeWidth={3} opacity={clamp(stitch * 5 - i)} />
    ))}
  </g>
);
