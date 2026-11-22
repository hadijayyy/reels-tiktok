import React from "react";
import {C} from "../styles/palette";
import {rand} from "../motion/ease";
import {ShortHair} from "../rig/looks";
import {Look} from "../rig/Stickman";

/*
 * Props for the rocket-POV film: a small two-stage rocket with a face (the narrator), its exhaust,
 * a rusty nut, a mission-control screen and a planet with an orbit. Flat shapes, one stroke weight.
 * No logos: the rocket carries no markings; names appear only as plain text plates.
 */

/** The founder: dark t-shirt, short dark hair. */
export const FOUNDER: Look = {top: "#2E3440", sleeve: "#2E3440", trousers: "#1E2229", headExtra: <ShortHair color="#3A2A1E" />};
/** Engineers in light work shirts. */
export const ENGINEER = (top: string, hair = "#2A2420"): Look => ({top, sleeve: top, trousers: "#2E3135", headExtra: <ShortHair color={hair} />});

export type RocketFace = "happy" | "sad" | "worried" | "scared" | "calm" | "none";

/** Exhaust flame below (0, 0), pointing down; k 0..1 is its size. Deterministic flicker from t. */
export const Exhaust: React.FC<{t: number; k?: number; s?: number}> = ({t, k = 1, s = 1}) => {
  if (k <= 0) return null;
  const f = 1 + Math.sin(t * 40) * 0.08 + Math.sin(t * 23 + 1) * 0.06;
  const L = 170 * k * f;
  return (
    <g transform={`scale(${s})`}>
      <path d={`M -30 0 Q -34 ${L * 0.5} 0 ${L} Q 34 ${L * 0.5} 30 0 Z`} fill={C.orange} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M -16 0 Q -18 ${L * 0.35} 0 ${L * 0.62} Q 18 ${L * 0.35} 16 0 Z`} fill={C.yellow} />
    </g>
  );
};

/**
 * The narrator rocket. (x, y) is the bottom of the first stage. Total height about 540 x s.
 * sep: how far the first stage has dropped away (world units); sepRot: its tumble; bump moves it back up.
 * face draws eyes and a mouth on the upper stage. flame 0..1 lights the main engine.
 */
export const Rocket: React.FC<{
  x: number; y: number; s?: number; rot?: number; t?: number; face?: RocketFace; flame?: number;
  sep?: number; sepRot?: number; upperFlame?: number; burnt?: number;
}> = ({x, y, s = 1, rot = 0, t = 0, face = "calm", flame = 0, sep = 0, sepRot = 0, upperFlame = 0, burnt = 0}) => {
  const body = burnt > 0 ? "#B9B4A6" : "#EDEBE4";
  const blink = Math.sin(t * 1.7) > 0.985 ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* first stage (drops away when sep > 0) */}
      <g transform={`translate(0 ${sep}) rotate(${sepRot} 0 -150)`}>
        <g transform="translate(0 0)">
          <Exhaust t={t} k={flame} />
        </g>
        <path d="M -42 0 L -54 26 L -26 26 L -20 0 Z M 42 0 L 54 26 L 26 26 L 20 0 Z" fill="#3A3F47" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-38} y={-300} width={76} height={300} fill={body} stroke={C.ink} strokeWidth={5} />
        <rect x={-38} y={-24} width={76} height={24} fill="#3A3F47" stroke={C.ink} strokeWidth={4} />
        <path d="M -38 -300 L -58 -240 L -58 -200 L -38 -210 Z M 38 -300 L 58 -240 L 58 -200 L 38 -210 Z" transform="translate(0 210)" fill="#3A3F47" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        {burnt > 0 ? <path d="M -38 -120 Q -10 -150 12 -110 Q 30 -80 38 -100 L 38 -40 L -38 -40 Z" fill="#2A2A2E" opacity={burnt} /> : null}
      </g>
      {/* interstage + upper stage */}
      <g>
        {upperFlame > 0 ? (
          <g transform="translate(0 -300)">
            <Exhaust t={t + 0.3} k={upperFlame} s={0.6} />
          </g>
        ) : null}
        <rect x={-38} y={-336} width={76} height={36} fill="#2B2D31" stroke={C.ink} strokeWidth={4} />
        <rect x={-36} y={-450} width={72} height={114} fill={body} stroke={C.ink} strokeWidth={5} />
        <path d="M -36 -450 Q -38 -510 0 -548 Q 38 -510 36 -450 Z" fill={body} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        {face !== "none" ? <Face face={face} blink={blink} /> : null}
      </g>
    </g>
  );
};

const Face: React.FC<{face: RocketFace; blink: number}> = ({face, blink}) => {
  const ey = -404;
  const eyeH = blink ? 1.5 : face === "scared" ? 11 : 9;
  const brow = face === "sad" || face === "worried" ? "M -24 -424 L -8 -418 M 24 -424 L 8 -418" : face === "scared" ? "M -24 -420 L -8 -426 M 24 -420 L 8 -426" : null;
  const mouth =
    face === "happy" ? "M -14 -380 Q 0 -366 14 -380" :
    face === "sad" ? "M -12 -372 Q 0 -382 12 -372" :
    face === "worried" ? "M -12 -374 Q -4 -380 4 -374 Q 10 -370 12 -374" :
    face === "scared" ? "M -9 -378 Q 0 -364 9 -378 Q 0 -384 -9 -378 Z" :
    "M -10 -376 L 10 -376";
  return (
    <g>
      <ellipse cx={-14} cy={ey} rx={7} ry={eyeH} fill={C.ink} />
      <ellipse cx={14} cy={ey} rx={7} ry={eyeH} fill={C.ink} />
      {brow ? <path d={brow} stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
      <path d={mouth} stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill={face === "scared" ? C.ink : "none"} />
      {face === "happy" ? (
        <g fill="#E8A0A0" opacity={0.7}>
          <circle cx={-26} cy={-386} r={6} />
          <circle cx={26} cy={-386} r={6} />
        </g>
      ) : null}
    </g>
  );
};

/** A simple launch pad under the rocket: base slab and a thin tower. (x, y) = pad top centre. */
export const LaunchPad: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-130} y={0} width={260} height={30} fill="#4A4F57" stroke={C.ink} strokeWidth={5} />
    <rect x={-120} y={-560} width={20} height={560} fill="#7A6A4E" stroke={C.ink} strokeWidth={4} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <line key={i} x1={-120} y1={-80 * i} x2={-100} y2={-80 * (i + 1)} stroke={C.ink} strokeWidth={3} />
    ))}
    <rect x={-100} y={-420} width={50} height={12} fill="#7A6A4E" stroke={C.ink} strokeWidth={3} />
  </g>
);

/** A big rusty hex nut, centre (x, y), radius r. */
export const RustyNut: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 120, rot = 0}) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <polygon points={pts} fill="#8C8F95" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <circle r={r * 0.45} fill="#26303A" stroke={C.ink} strokeWidth={6} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle key={i} cx={Math.cos(i * 1.7) * r * (0.6 + rand(i) * 0.25)} cy={Math.sin(i * 1.7) * r * (0.6 + rand(i + 9) * 0.25)} r={r * (0.08 + rand(i + 3) * 0.1)} fill={i % 2 ? "#A0522D" : "#B8683A"} opacity={0.9} />
      ))}
    </g>
  );
};

/** Falling drops from (x, y) (leaking fuel). Deterministic from t. */
export const Drips: React.FC<{x: number; y: number; t: number; k?: number; len?: number; color?: string}> = ({x, y, t, k = 1, len = 220, color = "#7FB8D8"}) =>
  k <= 0 ? null : (
    <g opacity={k}>
      {[0, 1, 2, 3].map((i) => {
        const ph = (t * 0.9 + i / 4) % 1;
        return <path key={i} transform={`translate(${x + (i % 2 ? 8 : -8)} ${y + ph * len})`} d="M 0 -14 Q 10 2 0 10 Q -10 2 0 -14 Z" fill={color} stroke={C.ink} strokeWidth={2.5} opacity={1 - ph * 0.6} />;
      })}
    </g>
  );

let screenId = 0;
/** A mission-control screen centred on (x, y): dark space with stars; children drawn in screen-centre coords, clipped. */
export const Screen: React.FC<{x: number; y: number; w: number; h: number; t: number; children?: React.ReactNode}> = ({x, y, w, h, t, children}) => {
  const id = React.useMemo(() => `rscreen-${screenId++}`, []);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 - 16} y={-h / 2 - 16} width={w + 32} height={h + 32} rx={14} fill="#2B2D31" stroke={C.ink} strokeWidth={6} />
      <rect x={-12} y={h / 2 + 16} width={24} height={60} fill="#2B2D31" stroke={C.ink} strokeWidth={4} />
      <defs>
        <clipPath id={id}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#0B1020" />
        {Array.from({length: 40}).map((_, i) => (
          <circle key={i} cx={(rand(i * 2 + 1) - 0.5) * w} cy={(rand(i * 2 + 2) - 0.5) * h} r={1.5 + rand(i + 40) * 2} fill="#CFE0FF" opacity={0.5 + 0.5 * Math.sin(t * 2 + i)} />
        ))}
        {children}
      </g>
    </g>
  );
};

/** A planet (blue with land patches) centred on (x, y). */
export const Planet: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 1.06} fill="#5FA8FF" opacity={0.18} />
    <circle r={r} fill="#2F6FA8" stroke={C.ink} strokeWidth={6} />
    <path d={`M ${-r * 0.6} ${-r * 0.3} q ${r * 0.2} ${-r * 0.3} ${r * 0.45} ${-r * 0.1} q ${r * 0.1} ${r * 0.3} ${-r * 0.15} ${r * 0.45} q ${-r * 0.3} ${r * 0.05} ${-r * 0.3} ${-r * 0.35} Z`} fill="#5E9347" stroke={C.ink} strokeWidth={4} />
    <path d={`M ${r * 0.15} ${r * 0.2} q ${r * 0.35} ${-r * 0.15} ${r * 0.5} ${r * 0.15} q ${-r * 0.05} ${r * 0.35} ${-r * 0.35} ${r * 0.35} q ${-r * 0.25} ${-r * 0.2} ${-r * 0.15} ${-r * 0.5} Z`} fill="#5E9347" stroke={C.ink} strokeWidth={4} />
  </g>
);

/** Night/day sky gradient over the wall area (behind everything). */
export const SkyFill: React.FC<{top: string; bottom: string; y0?: number; y1?: number}> = ({top, bottom, y0 = -1400, y1 = 420}) => {
  const id = `sky-${top.slice(1)}-${bottom.slice(1)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-1600} y={y0} width={3200} height={y1 - y0} fill={`url(#${id})`} />
    </g>
  );
};
