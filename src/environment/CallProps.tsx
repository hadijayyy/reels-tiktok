import React from "react";
import {C, FONT} from "../styles/palette";
import {FLOOR, Label} from "./Furniture";

/*
 * Props for "phone call + banking app" stories: a generic m-banking screen, the 30-second warning
 * pop-up laid over it, a countdown ring, a call badge, an arrow, a shield, a hang-up button.
 * Screens are drawn in phone units (0..300 x 0..420) so they drop into BigPhone. No logos or brand marks.
 */

export const BANK_BLUE = "#1F4E8C";

/** Ear position (world) of a Stickman standing at x on the floor at scale 1.5, for a phone held to the ear. */
export const earAt = (x: number, facing: 1 | -1 = 1) => ({x: x - 52 * facing, y: FLOOR - 296});

/** A generic m-banking home screen. `call` adds a green "incoming call" bar on top. */
export const BankScreen: React.FC<{call?: boolean; t?: number; share?: boolean}> = ({call = false, t = 0, share = false}) => (
  <g>
    <rect width={300} height={420} fill="#EEF2F7" />
    <rect width={300} height={96} fill={BANK_BLUE} />
    <Label x={20} y={58} text="M-BANKING" size={26} color="#FFFFFF" anchor="start" />
    <rect x={20} y={118} width={260} height={92} rx={14} fill="#FFFFFF" stroke="#C9D3E0" strokeWidth={3} />
    <Label x={36} y={150} text="Saldo" size={20} color="#6B7788" anchor="start" />
    <Label x={36} y={192} text="Rp ••••••••" size={36} color="#1B2433" anchor="start" />
    {["TRANSFER", "TOP UP", "BAYAR", "INFO"].map((s, i) => (
      <g key={s} transform={`translate(${20 + (i % 2) * 136} ${232 + Math.floor(i / 2) * 84})`}>
        <rect width={124} height={72} rx={12} fill="#FFFFFF" stroke="#C9D3E0" strokeWidth={3} />
        <Label x={62} y={44} text={s} size={22} color={BANK_BLUE} />
      </g>
    ))}
    {share ? (
      <g>
        <rect x={0} y={0} width={300} height={34} fill={C.red} />
        <circle cx={26} cy={17} r={7} fill="#FFFFFF" opacity={0.6 + 0.4 * Math.sin(t * 8)} />
        <Label x={44} y={25} text="LAYAR DIBAGIKAN" size={19} color="#FFFFFF" anchor="start" />
      </g>
    ) : null}
    {call ? (
      <g>
        <rect x={10} y={share ? 40 : 8} width={280} height={52} rx={14} fill="#2F9E56" stroke="#1C6B3A" strokeWidth={3} />
        <Label x={28} y={(share ? 40 : 8) + 34} text="Panggilan masuk…" size={22} color="#FFFFFF" anchor="start" />
      </g>
    ) : null}
  </g>
);

/** The countdown ring: `k` 0..1 is how much time has passed; `n` is the number shown. */
export const Countdown: React.FC<{x: number; y: number; r: number; k: number; n: number}> = ({x, y, r, k, n}) => {
  const len = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#10151C" stroke="#2C3542" strokeWidth={r * 0.16} />
      <circle r={r} fill="none" stroke={C.yellow} strokeWidth={r * 0.16} strokeLinecap="round" strokeDasharray={`${len * (1 - k)} ${len}`} transform="rotate(-90)" />
      <text y={r * 0.34} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.95} fill="#FFFFFF">
        {n}
      </text>
    </g>
  );
};

/**
 * The warning pop-up over a bank screen: a reminder, a countdown, and two buttons.
 * "Tutup aplikasi" works straight away; "Lanjutkan" only lights up once the countdown ends (`ready`).
 * `k` 0..1 pops it in; `elapsed` 0..1 runs the ring; `n` is the number.
 */
export const PausePopup: React.FC<{k: number; elapsed: number; n: number; ready: boolean; pulseClose?: number}> = ({k, elapsed, n, ready, pulseClose = 0}) =>
  k <= 0 ? null : (
    <g opacity={Math.min(1, k * 1.5)}>
      <rect width={300} height={420} fill="#05080D" opacity={0.78} />
      <g transform={`translate(150 210) scale(${0.85 + 0.15 * k}) translate(-150 -210)`}>
        <rect x={16} y={34} width={268} height={352} rx={22} fill="#1B2431" stroke={C.yellow} strokeWidth={5} />
        <path d="M 150 52 L 178 100 L 122 100 Z" fill={C.yellow} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        <Label x={150} y={92} text="!" size={30} color={C.ink} />
        <Label x={150} y={132} text="WASPADA TELEPON" size={24} color={C.yellow} />
        <Label x={150} y={160} text="Jangan beri OTP, PIN, CVV" size={17} color="#D6DCE6" />
        <Countdown x={150} y={228} r={44} k={elapsed} n={n} />
        <g transform={`translate(150 316) scale(${1 + pulseClose * 0.06})`}>
          <rect x={-114} y={-24} width={228} height={46} rx={23} fill={C.red} stroke={pulseClose > 0 ? "#FFFFFF" : C.ink} strokeWidth={pulseClose > 0 ? 5 : 3} />
          <Label x={0} y={8} text="TUTUP APLIKASI" size={22} color="#FFFFFF" />
        </g>
        <g transform="translate(150 366)">
          <rect x={-114} y={-20} width={228} height={38} rx={19} fill={ready ? C.olive : "#2A313C"} stroke={ready ? C.bone : "#3A4350"} strokeWidth={3} />
          <Label x={0} y={6} text={ready ? "LANJUTKAN" : "LANJUTKAN (TUNGGU)"} size={ready ? 20 : 16} color={ready ? C.bone : "#6B7686"} />
        </g>
      </g>
    </g>
  );

/** A "on a call" badge: a handset in a green circle with sound waves, centred on (x, y). */
export const CallBadge: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1].map((i) => (
      <path key={i} d={`M ${34 + i * 16} -22 q 14 22 0 44`} stroke="#EDE6D6" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.4 + 0.4 * Math.max(0, Math.sin(t * 5 - i))} />
    ))}
    <circle r={28} fill="#3BAA5C" stroke={C.ink} strokeWidth={3} />
    <path d="M -12 -12 q -4 14 8 26 q 12 12 26 8 l 2 -9 l -10 -5 l -5 5 q -9 -4 -13 -13 l 5 -5 l -5 -10 Z" fill="#FFFFFF" transform="translate(-2 -2) scale(0.9)" />
  </g>
);

/** A straight arrow from a to b drawn to progress k (0..1). */
export const Arrow: React.FC<{ax: number; ay: number; bx: number; by: number; k: number}> = ({ax, ay, bx, by, k}) => {
  if (k <= 0) return null;
  const x = ax + (bx - ax) * k;
  const y = ay + (by - ay) * k;
  const ang = Math.atan2(by - ay, bx - ax);
  const hl = 34;
  return (
    <g>
      <line x1={ax} y1={ay} x2={x} y2={y} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${x} ${y} L ${x - Math.cos(ang - 0.45) * hl} ${y - Math.sin(ang - 0.45) * hl} M ${x} ${y} L ${x - Math.cos(ang + 0.45) * hl} ${y - Math.sin(ang + 0.45) * hl}`} stroke={C.red} strokeWidth={12} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** A big red cross centred on (x, y). */
export const Cross: React.FC<{x: number; y: number; r?: number; k: number; w?: number}> = ({x, y, r = 50, k, w = 14}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={C.red} strokeWidth={w} strokeLinecap="round" />
    </g>
  );

/** A shield with a tick, centred on (x, y), w wide. */
export const Shield: React.FC<{x: number; y: number; w?: number; k?: number}> = ({x, y, w = 300, k = 1}) => {
  const h = w * 1.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={Math.min(1, k * 1.5)}>
      <path d={`M 0 ${-h / 2} L ${w / 2} ${-h / 2 + h * 0.14} L ${w / 2} ${h * 0.08} Q ${w / 2} ${h * 0.36} 0 ${h / 2} Q ${-w / 2} ${h * 0.36} ${-w / 2} ${h * 0.08} L ${-w / 2} ${-h / 2 + h * 0.14} Z`} fill="#2F5F8F" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M 0 ${-h / 2 + 22} L ${w / 2 - 22} ${-h / 2 + h * 0.14 + 4} L ${w / 2 - 22} ${h * 0.08} Q ${w / 2 - 22} ${h * 0.32} 0 ${h / 2 - 28} Q ${-w / 2 + 22} ${h * 0.32} ${-w / 2 + 22} ${h * 0.08} L ${-w / 2 + 22} ${-h / 2 + h * 0.14 + 4} Z`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} />
    </g>
  );
};

/** A red hang-up button (handset turned down) in a circle, centred on (x, y). */
export const HangUp: React.FC<{x: number; y: number; k?: number}> = ({x, y, k = 1}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={70} fill={C.red} stroke={C.ink} strokeWidth={6} />
      <path d="M -40 8 q 0 -22 40 -22 q 40 0 40 22 l -4 12 l -22 -6 l -2 -12 q -12 -4 -24 0 l -2 12 l -22 6 Z" fill="#FFFFFF" />
    </g>
  );

/** An eye (someone is watching your screen), centred on (x, y). */
export const Eye: React.FC<{x: number; y: number; s?: number; k?: number; t?: number}> = ({x, y, s = 1, k = 1, t = 0}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <path d="M -90 0 Q 0 -80 90 0 Q 0 80 -90 0 Z" fill={C.bone} stroke={C.ink} strokeWidth={6} />
      <circle cx={Math.sin(t * 2) * 14} cy={0} r={32} fill={C.red} stroke={C.ink} strokeWidth={5} />
      <circle cx={Math.sin(t * 2) * 14} cy={0} r={13} fill={C.ink} />
    </g>
  );
