import React from "react";
import {C} from "../styles/palette";
import {clamp} from "../motion/ease";
import {Label} from "./Furniture";

/*
 * Props for the "secret transfers" film: a transfer-app screen with a censored name, minimarket shelves and
 * till, a school fee bill, a list of children (names censored), a book, a floor mat, glasses on a chair.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units. No real app branding.
 */

const APP = "#1F6E8C";
/** A censored name: a black bar with a faint shimmer. */
const Censor: React.FC<{x: number; y: number; w: number; h?: number}> = ({x, y, w, h = 24}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={4} fill="#0B0C0E" />
    <rect x={x + 6} y={y + 4} width={w * 0.3} height={4} rx={2} fill="#2A2D33" />
  </g>
);

/** Screen content for BigPhone (w x h): a transfer form or receipt. `status`: form | sent | history | cancel. */
export const TransferScreen: React.FC<{w: number; h: number; status: "form" | "sent" | "history" | "cancel"; k?: number; amount?: string}> = ({w, h, status, k = 1, amount = "Rp250.000"}) => (
  <g>
    <rect width={w} height={h} fill="#F2F4F6" />
    <rect width={w} height={56} fill={APP} />
    <Label x={w / 2} y={37} text={status === "history" ? "RIWAYAT" : "TRANSFER"} size={24} color="#FFFFFF" />
    {status === "history" ? (
      [0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(18 ${80 + i * 78})`}>
          <rect width={w - 36} height={64} rx={8} fill="#FFFFFF" stroke="#D5DAE0" strokeWidth={2} />
          <text x={12} y={24} fontFamily="Inter" fontWeight={700} fontSize={16} fill="#5A6472">{`15 ${["AGU", "SEP", "OKT", "NOV"][i]}`}</text>
          <Censor x={12} y={34} w={w * 0.4} h={18} />
          <text x={w - 50} y={46} textAnchor="end" fontFamily="Inter" fontWeight={800} fontSize={18} fill={C.red}>{`-${amount}`}</text>
        </g>
      ))
    ) : (
      <g>
        <text x={24} y={100} fontFamily="Inter" fontWeight={700} fontSize={18} fill="#5A6472">PENERIMA</text>
        <Censor x={24} y={112} w={w - 48} h={30} />
        <text x={24} y={180} fontFamily="Inter" fontWeight={700} fontSize={18} fill="#5A6472">JUMLAH</text>
        <text x={24} y={220} fontFamily="Inter" fontWeight={800} fontSize={34} fill={C.ink}>{amount}</text>
        {status === "form" ? (
          <g>
            <rect x={24} y={h - 90} width={w - 48} height={56} rx={12} fill={APP} />
            <Label x={w / 2} y={h - 52} text="KIRIM" size={24} color="#FFFFFF" />
          </g>
        ) : null}
        {status === "cancel" ? (
          <g>
            <rect x={24} y={h - 160} width={w - 48} height={56} rx={12} fill={C.red} />
            <Label x={w / 2} y={h - 122} text="BATALKAN?" size={24} color="#FFFFFF" />
            <rect x={24} y={h - 90} width={w - 48} height={56} rx={12} fill="#FFFFFF" stroke={APP} strokeWidth={3} />
            <Label x={w / 2} y={h - 52} text="LANJUTKAN" size={24} color={APP} />
          </g>
        ) : null}
        {status === "sent" ? (
          <g transform={`translate(${w / 2} ${h - 110}) scale(${k})`}>
            <circle r={40} fill={C.olive} />
            <path d="M -18 0 L -4 14 L 20 -14" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
      </g>
    )}
  </g>
);

/** A minimarket shelf unit with product boxes. Base centre at (x, y). */
export const Shelf: React.FC<{x: number; y: number; w?: number; seed?: number}> = ({x, y, w = 420, seed = 0}) => {
  const cols = [C.red, C.yellow, C.cyan, "#8FBF7F", C.orange, "#B07AC0"];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-520} width={w} height={520} fill="#C9CED6" stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x={-w / 2} y={-130 - r * 125} width={w} height={10} fill="#8A929C" />
          {Array.from({length: 6}, (_, i) => {
            const bw = (w - 40) / 6 - 6;
            const bh = 60 + ((i * 7 + r * 11 + seed) % 4) * 12;
            return <rect key={i} x={-w / 2 + 20 + i * (bw + 6)} y={-130 - r * 125 - bh} width={bw} height={bh} fill={cols[(i + r + seed) % cols.length]} stroke={C.ink} strokeWidth={2} />;
          })}
        </g>
      ))}
    </g>
  );
};

/** A checkout counter with a till. Base centre at (x, y). */
export const Checkout: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-170} y={-170} width={340} height={170} fill="#E2E6EA" stroke={C.ink} strokeWidth={4} />
    <rect x={-170} y={-186} width={340} height={20} fill="#6B7480" stroke={C.ink} strokeWidth={3} />
    <rect x={40} y={-260} width={100} height={74} rx={6} fill="#2B2D31" stroke={C.ink} strokeWidth={3} />
    <rect x={52} y={-250} width={76} height={30} fill="#4FC3A1" />
  </g>
);

/** A school fee bill with a stamp area, centred on (x, y). */
export const FeeBill: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-190} y={-130} width={380} height={260} rx={6} fill="#FAF6EA" stroke={C.ink} strokeWidth={4} />
    <Label x={0} y={-82} text="BIAYA SEKOLAH" size={34} color={C.ink} />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={-150} y1={-30 + i * 40} x2={i === 2 ? 60 : 150} y2={-30 + i * 40} stroke="#A8A08C" strokeWidth={4} />
    ))}
  </g>
);

/** A handwritten list of children; names are censored bars. One row can be circled (k 0..1). */
export const NameList: React.FC<{x: number; y: number; rows?: number; circled?: number; circleK?: number; s?: number}> = ({x, y, rows = 5, circled = -1, circleK = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-210} y={-50} width={420} height={rows * 64 + 80} rx={6} fill="#F3EBD6" stroke={C.ink} strokeWidth={4} />
    <Label x={0} y={0} text="DAFTAR" size={36} color={C.ink} />
    {Array.from({length: rows}, (_, i) => (
      <g key={i} transform={`translate(-170 ${50 + i * 64})`}>
        <text x={0} y={0} fontFamily="Inter" fontWeight={700} fontSize={30} fill="#2A3A6A">{`${i + 1}.`}</text>
        <rect x={44} y={-24} width={200 + ((i * 37) % 80)} height={26} rx={4} fill="#1A1C22" />
        {i === circled && circleK > 0 ? (
          <ellipse cx={180} cy={-12} rx={200} ry={34} fill="none" stroke={C.red} strokeWidth={6} strokeDasharray={`${1300 * circleK} 1400`} />
        ) : null}
      </g>
    ))}
  </g>
);

/** A book held in the hand. */
export const handBook = () => (
  <g transform="translate(-10 -30)">
    <rect x={-6} y={-30} width={60} height={70} rx={4} fill={C.orange} stroke={C.ink} strokeWidth={3} />
    <rect x={-6} y={-30} width={10} height={70} fill="#9A4220" />
  </g>
);

/** Round glasses lying on a surface at (x, y). */
export const Glasses: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={C.ink} strokeWidth={4}>
    <circle cx={-22} cy={0} r={16} fill="#BFE3F0" fillOpacity={0.4} />
    <circle cx={22} cy={0} r={16} fill="#BFE3F0" fillOpacity={0.4} />
    <line x1={-6} y1={0} x2={6} y2={0} />
  </g>
);

/** A woven floor mat, centre at (x, y). */
export const Mat: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 520}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-10} width={w} height={20} rx={4} fill="#B89A5A" stroke={C.ink} strokeWidth={3} />
    {Array.from({length: Math.floor(w / 40)}, (_, i) => (
      <line key={i} x1={-w / 2 + 20 + i * 40} y1={-10} x2={-w / 2 + 20 + i * 40} y2={10} stroke="#8A7040" strokeWidth={3} />
    ))}
  </g>
);

/** Small hearts rising from (x, y), k 0..1. */
export const Hearts: React.FC<{x: number; y: number; t: number; k: number}> = ({x, y, t, k}) => (
  <g opacity={clamp(k)}>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.5 + i / 3) % 1;
      return <path key={i} d="M 0 6 C -14 -8 -6 -20 0 -10 C 6 -20 14 -8 0 6 Z" fill={C.red} transform={`translate(${x + (i - 1) * 40 + Math.sin(ph * 6) * 10} ${y - ph * 160}) scale(${1.4 * (1 - ph * 0.4)})`} opacity={1 - ph} />;
    })}
  </g>
);
