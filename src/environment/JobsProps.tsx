import React from "react";
import {C} from "../styles/palette";
import {RoundGlasses, ShortHair, CurlyHair} from "../rig/looks";
import {Look} from "../rig/Stickman";
import {Label} from "./Furniture";
import {clamp} from "../motion/ease";

/*
 * Props and looks for the Apple / Steve Jobs film. Flat shapes, one stroke weight, colours from the palette.
 * No logos: devices are generic shapes and brand names appear only as plain text labels.
 */

/* ---------- Looks ---------- */

/** Jobs in his early shirt (1976). */
export const JOBS_YOUNG: Look = {
  top: "#7A5A3A",
  sleeve: "#7A5A3A",
  trousers: "#3F5F8E",
  headExtra: (
    <g>
      <ShortHair color="#2A2018" />
      <RoundGlasses />
    </g>
  ),
};

/** Jobs in the black turtleneck, jeans and round glasses. */
export const JOBS: Look = {...JOBS_YOUNG, top: "#16171A", sleeve: "#16171A", shoe: "#B9B5A8"};

/** Wozniak: blue shirt, curly hair. */
export const WOZ: Look = {top: "#4E7A9B", sleeve: "#4E7A9B", trousers: "#2E3135", headBack: <CurlyHair color="#4A3424" />};

/** A manager in a suit with a tie. */
export const SUIT: Look = {top: "#E9E7DF", sleeve: "#2B3140", coat: "#2B3140", tie: C.orange, trousers: "#1E222B", headExtra: <ShortHair color="#8A8A8A" />};
export const SUIT2: Look = {...SUIT, coat: "#3A3A3F", sleeve: "#3A3A3F", tie: "#5E9347", headExtra: <ShortHair color="#3A3028" />};
export const SUIT3: Look = {...SUIT, coat: "#2E4A3A", sleeve: "#2E4A3A", tie: C.yellow, headExtra: <ShortHair color="#1E1E22" />};

/** The other company's boss: light sweater, glasses. */
export const RIVAL: Look = {top: "#8AA0B8", sleeve: "#8AA0B8", trousers: "#2E3135", headExtra: (
  <g>
    <ShortHair color="#6A5A44" />
    <RoundGlasses />
  </g>
)};

/** An employee in a coloured shirt. */
export const staff = (top: string, hair = "#2A2420"): Look => ({top, sleeve: top, trousers: "#2E3135", headExtra: <ShortHair color={hair} />});

/* ---------- Props ---------- */

/** A closed garage door with roll-up slats, centred on (x, base y). */
export const GarageDoor: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 760, h = 520}) => {
  const slats = 9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 - 24} y={-h - 24} width={w + 48} height={h + 24} fill="#2B2D31" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: slats}).map((_, i) => (
        <rect key={i} x={-w / 2} y={-h + (h / slats) * i} width={w} height={h / slats} fill={i % 2 ? "#6B6F77" : "#757A82"} stroke={C.ink} strokeWidth={4} />
      ))}
    </g>
  );
};

/** A circuit board (the first computer): green board with chips and a connector. Centre at (x, y). */
export const CircuitBoard: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-110} y={-72} width={220} height={144} rx={8} fill="#2F7A4F" stroke={C.ink} strokeWidth={5} />
    {[[-80, -44], [-20, -44], [40, -44], [-80, 14], [-10, 14]].map(([cx, cy], i) => (
      <rect key={i} x={cx} y={cy} width={i % 2 ? 44 : 56} height={30} rx={3} fill="#1B1C1F" stroke={C.ink} strokeWidth={3} />
    ))}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <line key={i} x1={-96 + i * 30} y1={58} x2={-96 + i * 30} y2={66} stroke={C.yellow} strokeWidth={6} />
    ))}
    <path d="M 70 -10 L 96 -10 L 96 40 L 60 40" fill="none" stroke="#9BD3A8" strokeWidth={3} />
    <circle cx={80} cy={-40} r={7 + glow * 3} fill={glow > 0 ? C.yellow : "#C9C294"} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A row of mini boards, one popping in per index (k = 0..1 grows how many show). */
export const BoardGrid: React.FC<{x: number; y: number; cols?: number; rows?: number; k: number; cw?: number; ch?: number}> = ({x, y, cols = 10, rows = 5, k, cw = 56, ch = 40}) => {
  const total = cols * rows;
  const shown = Math.floor(clamp(k) * total);
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: shown}).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <g key={i} transform={`translate(${(c - (cols - 1) / 2) * cw} ${(r - (rows - 1) / 2) * ch})`}>
            <rect x={-cw / 2 + 3} y={-ch / 2 + 3} width={cw - 6} height={ch - 6} rx={4} fill="#2F7A4F" stroke={C.ink} strokeWidth={3} />
            <rect x={-12} y={-8} width={24} height={14} rx={2} fill="#1B1C1F" />
          </g>
        );
      })}
    </g>
  );
};

/** A simple office building with a name sign on top. Base centre at (x, y). */
export const Building: React.FC<{x: number; y: number; w?: number; h?: number; name?: string; color?: string; lit?: number; tilt?: number}> = ({x, y, w = 300, h = 520, name, color = "#3B4452", lit = 0.5, tilt = 0}) => {
  const cols = Math.max(2, Math.round(w / 70));
  const rows = Math.max(3, Math.round(h / 90));
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={color} stroke={C.ink} strokeWidth={6} />
      {Array.from({length: rows * cols}).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const on = (i * 7 + 3) % 10 < lit * 10;
        return <rect key={i} x={-w / 2 + 22 + c * ((w - 44) / cols)} y={-h + 30 + r * ((h - 80) / rows)} width={(w - 44) / cols - 16} height={((h - 80) / rows) - 20} fill={on ? C.yellow : "#1B2028"} opacity={on ? 0.9 : 1} />;
      })}
      <rect x={-34} y={-62} width={68} height={62} fill="#1B2028" stroke={C.ink} strokeWidth={4} />
      {name ? (
        <g transform={`translate(0 ${-h - 36})`}>
          <rect x={-name.length * 21 - 24} y={-34} width={name.length * 42 + 48} height={64} rx={14} fill={C.charcoal} stroke={C.yellow} strokeWidth={5} />
          <Label x={0} y={14} text={name} size={44} color={C.bone} />
        </g>
      ) : null}
    </g>
  );
};

/** A cardboard box with tape. Centre at (x, y). */
export const CardBox: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-44} width={120} height={88} fill="#B58A5A" stroke={C.ink} strokeWidth={5} />
    <rect x={-14} y={-44} width={28} height={36} fill="#D4B287" stroke={C.ink} strokeWidth={3} />
    <path d="M -60 -44 L -44 -62 L 44 -62 L 60 -44" fill="#A07848" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** A falling red bar chart (losses): bars drop below a baseline. k 0..1. Base-left at (x, y). */
export const LossChart: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => {
  const hs = [110, 150, 200, 240, 300];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={0} x2={340} y2={0} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={-60} x2={0} y2={330} stroke={C.bone} strokeWidth={5} strokeLinecap="round" />
      {hs.map((h, i) => {
        const kk = clamp(k * hs.length - i);
        return <rect key={i} x={24 + i * 62} y={0} width={46} height={h * kk} fill={C.red} stroke={C.ink} strokeWidth={4} />;
      })}
    </g>
  );
};

/** A colourful all-in-one computer (generic: rounded body, stand). Centre bottom at (x, y). */
export const ColorPC: React.FC<{x: number; y: number; s?: number; color: string; screen?: string}> = ({x, y, s = 1, color, screen = "#BFE3F2"}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 0 L 60 0 L 40 -22 L -40 -22 Z" fill={color} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -80 -28 Q -92 -60 -84 -130 Q -78 -170 -40 -172 L 40 -172 Q 78 -170 84 -130 Q 92 -60 80 -28 Q 0 -10 -80 -28 Z" fill={color} fillOpacity={0.9} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-58} y={-152} width={116} height={92} rx={14} fill={screen} stroke={C.ink} strokeWidth={4} />
    <path d="M -40 -134 L -20 -146" stroke={C.bone} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
  </g>
);

/** A generic music player: rounded body, small screen, round wheel. Centre at (x, y). */
export const MusicPlayer: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-48} y={-80} width={96} height={160} rx={14} fill={C.bone} stroke={C.ink} strokeWidth={5} />
    <rect x={-34} y={-66} width={68} height={44} rx={4} fill="#6FA8C8" stroke={C.ink} strokeWidth={3} />
    <circle cx={0} cy={34} r={30} fill="#D8D3C4" stroke={C.ink} strokeWidth={4} />
    <circle cx={0} cy={34} r={10} fill={C.bone} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A music note. */
export const Note: React.FC<{x: number; y: number; s?: number; rot?: number; opacity?: number; color?: string}> = ({x, y, s = 1, rot = 0, opacity = 1, color = C.yellow}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
    <ellipse cx={0} cy={0} rx={14} ry={10} fill={color} stroke={C.ink} strokeWidth={3} />
    <line x1={13} y1={0} x2={13} y2={-48} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
    <path d="M 13 -48 Q 34 -42 30 -22" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
  </g>
);

/** A generic smartphone with an app grid. Centre at (x, y). */
export const AppPhone: React.FC<{x: number; y: number; s?: number; k?: number; t?: number}> = ({x, y, s = 1, k = 1}) => {
  const cols = ["#E85D4A", "#E8C763", "#5E9347", "#35CBFA", "#C45D31", "#8A6FD0", "#E9E7DF", "#4E7A9B", "#E8914A", "#5E9347", "#35CBFA", "#E85D4A"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <rect x={-96} y={-196} width={192} height={392} rx={28} fill="#16171A" stroke={C.ink} strokeWidth={6} />
      <rect x={-84} y={-176} width={168} height={352} rx={16} fill="#2B4A6B" />
      {cols.map((c, i) => (
        <rect key={i} x={-70 + (i % 3) * 50} y={-150 + Math.floor(i / 3) * 62} width={38} height={38} rx={9} fill={c} stroke={C.ink} strokeWidth={3} />
      ))}
      <rect x={-24} y={-190} width={48} height={8} rx={4} fill="#2B2D31" />
    </g>
  );
};

/** An oil barrel (for the oil giant). Base centre at (x, y). */
export const OilBarrel: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -50 0 L -50 -110 Q 0 -128 50 -110 L 50 0 Q 0 16 -50 0 Z" fill="#8A4A32" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -50 -78 Q 0 -62 50 -78 M -50 -34 Q 0 -18 50 -34" fill="none" stroke={C.ink} strokeWidth={4} />
    <path d="M 0 -150 Q 22 -118 0 -104 Q -22 -118 0 -150 Z" fill={C.ink} />
  </g>
);

/** A small crown. Base centre at (x, y). */
export const Crown: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -50 0 L -58 -62 L -28 -34 L 0 -76 L 28 -34 L 58 -62 L 50 0 Z" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={0} cy={-76} r={7} fill={C.red} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A little tick of sparks around a point (k 0..1 expands then fades). */
export const Sparks: React.FC<{x: number; y: number; k: number; r?: number; color?: string; n?: number}> = ({x, y, k, r = 120, color = C.yellow, n = 10}) =>
  k <= 0 || k >= 1 ? null : (
    <g transform={`translate(${x} ${y})`} opacity={1 - k}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        const d0 = r * 0.4 + r * k * 0.8;
        return <line key={i} x1={Math.cos(a) * d0} y1={Math.sin(a) * d0} x2={Math.cos(a) * (d0 + 26)} y2={Math.sin(a) * (d0 + 26)} stroke={color} strokeWidth={7} strokeLinecap="round" />;
      })}
    </g>
  );

/** A zig-zag lightning bolt between two people. Centre at (x, y). */
export const Bolt: React.FC<{x: number; y: number; s?: number; k?: number}> = ({x, y, s = 1, k = 1}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <path d="M 10 -90 L -34 6 L -2 6 L -16 90 L 36 -18 L 4 -18 Z" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
