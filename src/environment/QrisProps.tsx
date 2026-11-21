import React from "react";
import {C} from "../styles/palette";
import {clamp, rand} from "../motion/ease";
import {Label} from "./Furniture";

/*
 * Props for the QRIS film: QR codes, a warung counter, a central-bank building, a flag, people icons.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units, palette colours.
 * No real logos: wallet apps are plain colours.
 */

/** App colours used for the "many wallets" stickers (no brands). */
export const APP_COLORS = ["#2FA84F", "#6B4BC4", "#1E88E5", "#E53935", "#F39C12"];

/** A QR code of `n` x `n` modules centred on (x, y), `size` wide. Pattern is fixed per seed. */
export const QRCode: React.FC<{x: number; y: number; size: number; seed?: number; frame?: string; label?: string; k?: number}> = ({x, y, size, seed = 1, frame = C.bone, label, k = 1}) => {
  const n = 21;
  const m = size / n;
  const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (finder(r, c)) continue;
      if (rand(seed * 1000 + r * n + c) > 0.52) cells.push(<rect key={r * n + c} x={c * m} y={r * m} width={m + 0.5} height={m + 0.5} fill={C.ink} />);
    }
  const Finder: React.FC<{r: number; c: number}> = ({r, c}) => (
    <g transform={`translate(${c * m} ${r * m})`}>
      <rect width={7 * m} height={7 * m} fill={C.ink} />
      <rect x={m} y={m} width={5 * m} height={5 * m} fill="#FFFFFF" />
      <rect x={2 * m} y={2 * m} width={3 * m} height={3 * m} fill={C.ink} />
    </g>
  );
  const pad = size * 0.09;
  const extra = label ? size * 0.22 : 0;
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-size / 2 - pad} y={-size / 2 - pad - extra} width={size + pad * 2} height={size + pad * 2 + extra} rx={size * 0.06} fill={frame} stroke={C.ink} strokeWidth={4} />
      {label ? <Label x={0} y={-size / 2 - pad - extra * 0.25} text={label} size={extra * 0.62} color={frame === C.bone ? C.ink : "#FFFFFF"} /> : null}
      <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="#FFFFFF" />
      <g transform={`translate(${-size / 2} ${-size / 2})`}>
        {cells}
        <Finder r={0} c={0} />
        <Finder r={0} c={n - 7} />
        <Finder r={n - 7} c={0} />
      </g>
    </g>
  );
};

/** A coloured QR sticker (frame colour = app), tilted. */
export const Sticker: React.FC<{x: number; y: number; s?: number; color: string; seed: number; rot?: number; k?: number}> = ({x, y, s = 1, color, seed, rot = 0, k = 1}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k * s})`}>
      <QRCode x={0} y={0} size={70} seed={seed} frame={color} />
    </g>
  );

/** A warung counter: wooden front, top at y - h. (x, y) = centre of the floor line. */
export const Counter: React.FC<{x: number; y: number; w?: number; h?: number; children?: React.ReactNode}> = ({x, y, w = 560, h = 210, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h} width={w} height={h} fill="#7A5634" stroke={C.ink} strokeWidth={5} />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={-w / 2} y1={-h + 50 + i * 55} x2={w / 2} y2={-h + 50 + i * 55} stroke="#5E4128" strokeWidth={4} />
    ))}
    <rect x={-w / 2 - 20} y={-h - 18} width={w + 40} height={22} rx={4} fill="#9A7048" stroke={C.ink} strokeWidth={5} />
    <g transform={`translate(0 ${-h})`}>{children}</g>
  </g>
);

/** A small awning roof for a warung, centred on x, bottom edge at y. */
export const Awning: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 700}) => {
  const n = 7;
  const sw = w / n;
  return (
    <g transform={`translate(${x - w / 2} ${y})`}>
      {Array.from({length: n}, (_, i) => (
        <path key={i} d={`M ${i * sw} -70 L ${(i + 1) * sw} -70 L ${(i + 1) * sw} 0 Q ${(i + 0.5) * sw} 30 ${i * sw} 0 Z`} fill={i % 2 ? C.bone : C.red} stroke={C.ink} strokeWidth={4} />
      ))}
    </g>
  );
};

/** A plain classical building (no logo): steps, columns, pediment. Ground centre at (x, y). */
export const Institution: React.FC<{x: number; y: number; s?: number; name?: string}> = ({x, y, s = 1, name}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-300} y={-40} width={600} height={40} fill="#B9B4A6" stroke={C.ink} strokeWidth={4} />
    <rect x={-270} y={-70} width={540} height={30} fill="#CFCABD" stroke={C.ink} strokeWidth={4} />
    {[-220, -130, -40, 50, 140, 230].map((cx) => (
      <rect key={cx} x={cx - 18} y={-330} width={36} height={260} fill="#E2DED2" stroke={C.ink} strokeWidth={4} />
    ))}
    <rect x={-280} y={-370} width={560} height={40} fill="#CFCABD" stroke={C.ink} strokeWidth={4} />
    <path d="M -300 -370 L 0 -470 L 300 -370 Z" fill="#E2DED2" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    {name ? <Label x={0} y={-342} text={name} size={26} color={C.ink} /> : null}
  </g>
);

/** Red-and-white flag on a pole; pole base at (x, y). */
export const Flag: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => {
  const wave = (i: number) => Math.sin(t * 5 - i * 0.9) * 10;
  const top = Array.from({length: 7}, (_, i) => `${i * 40} ${wave(i)}`);
  const mid = Array.from({length: 7}, (_, i) => `${(6 - i) * 40} ${70 + wave(6 - i)}`);
  const bot = Array.from({length: 7}, (_, i) => `${(6 - i) * 40} ${140 + wave(6 - i)}`);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-6} y={-520} width={12} height={520} fill={C.steel} stroke={C.ink} strokeWidth={3} />
      <g transform="translate(6 -510)">
        <path d={`M ${top.join(" L ")} L ${mid.join(" L ")} Z`} fill={C.red} stroke={C.ink} strokeWidth={3} />
        <path d={`M ${mid.slice().reverse().join(" L ")} L ${bot.join(" L ")} Z`} fill="#F4F1E8" stroke={C.ink} strokeWidth={3} />
      </g>
    </g>
  );
};

/** A tiny person icon (head + body), for counts and grids. */
export const PersonIcon: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = C.bone}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-38} r={12} fill={color} />
    <path d="M -18 0 L -18 -14 Q -18 -24 0 -24 Q 18 -24 18 -14 L 18 0 Z" fill={color} />
  </g>
);

/** A rolling suitcase; base centre at (x, y). */
export const Suitcase: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-8} y={-190} width={6} height={60} fill={C.steel} />
    <rect x={10} y={-190} width={6} height={60} fill={C.steel} />
    <rect x={-14} y={-196} width={36} height={10} rx={4} fill={C.steel} stroke={C.ink} strokeWidth={3} />
    <rect x={-45} y={-140} width={100} height={128} rx={14} fill={C.cyan} stroke={C.ink} strokeWidth={4} />
    <line x1={-15} y1={-130} x2={-15} y2={-22} stroke={C.ink} strokeWidth={3} opacity={0.4} />
    <line x1={25} y1={-130} x2={25} y2={-22} stroke={C.ink} strokeWidth={3} opacity={0.4} />
    <circle cx={-28} cy={-6} r={8} fill={C.ink} />
    <circle cx={38} cy={-6} r={8} fill={C.ink} />
  </g>
);

/** Phone screen content: a wallet app home in `color` (local 44 x 70). */
export const WalletScreen: React.FC<{color: string; ok?: number}> = ({color, ok = 0}) => (
  <g>
    <rect width={44} height={70} fill={color} />
    <rect x={6} y={8} width={32} height={14} rx={3} fill="#FFFFFF" opacity={0.85} />
    <rect x={6} y={28} width={14} height={14} rx={3} fill="#FFFFFF" opacity={0.6} />
    <rect x={24} y={28} width={14} height={14} rx={3} fill="#FFFFFF" opacity={0.6} />
    {ok > 0 ? <circle cx={22} cy={56} r={9 * clamp(ok)} fill={C.olive} stroke="#FFFFFF" strokeWidth={2} /> : null}
  </g>
);
