import React from "react";
import {C} from "../styles/palette";
import {clamp, lerp} from "../motion/ease";

/*
 * Props for the Baduy film: a stilt hut, flames, a Javan rhino, trees.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units, palette colours.
 */

const BAMBOO = "#8A6B3E";
const THATCH = "#6B5530";
const CHAR = "#221C18";

/** One flame, base at (x, y), height about 90 * s. */
export const Flame: React.FC<{x: number; y: number; s?: number; t: number; seed?: number; opacity?: number}> = ({x, y, s = 1, t, seed = 0, opacity = 1}) => {
  const sx = s * (1 + 0.08 * Math.sin(t * 12 + seed * 2.1));
  const sy = s * (1 + 0.16 * Math.sin(t * 9 + seed * 1.3));
  const d = "M 0 0 C -30 -10 -34 -50 -6 -90 C -4 -64 8 -58 14 -72 C 36 -44 30 -8 0 0 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={opacity}>
      <path d={d} fill={C.orange} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d={d} fill={C.yellow} transform="translate(0 -4) scale(0.55)" />
    </g>
  );
};

/** A Baduy stilt hut: bamboo wall, thatch roof. (x, y) = ground, centre. `fire` 0..1 flames, `char` 0..1 burnt down. */
export const Hut: React.FC<{x: number; y: number; s?: number; fire?: number; char?: number; t?: number; seed?: number}> = ({x, y, s = 1, fire = 0, char = 0, t = 0, seed = 0}) => {
  const wall = char > 0.5 ? CHAR : BAMBOO;
  const roofK = 1 - clamp(char * 1.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-90, -30, 30, 90].map((px) => (
        <rect key={px} x={px - 6} y={-40} width={12} height={40} fill="#4A3A2C" stroke={C.ink} strokeWidth={3} />
      ))}
      <rect x={-112} y={-48} width={224} height={12} fill="#5A4632" stroke={C.ink} strokeWidth={3} />
      <rect x={-100} y={-156} width={200} height={108} fill={wall} stroke={C.ink} strokeWidth={4} />
      {[-60, -20, 20, 60].map((lx) => (
        <line key={lx} x1={lx} y1={-156} x2={lx} y2={-48} stroke={C.ink} strokeWidth={2} opacity={0.35} />
      ))}
      <rect x={-22} y={-124} width={44} height={76} fill="#1A1410" />
      <path d="M -142 -150 L -72 -256 L 72 -256 L 142 -150 Z" fill={char > 0.5 ? CHAR : THATCH} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" opacity={roofK} />
      {fire > 0 ? (
        <g>
          {[-70, -25, 25, 70].map((fx, i) => (
            <Flame key={i} x={fx} y={-96 - (i % 2) * 70} s={fire * (1.5 + (i % 2) * 0.6)} t={t} seed={seed + i} />
          ))}
          <Flame x={0} y={-190} s={fire * 1.9} t={t} seed={seed + 9} />
        </g>
      ) : null}
    </g>
  );
};

/** A Javan rhino (one horn), facing right; feet at y. `s` scales it. */
export const Rhino: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; color?: string; opacity?: number}> = ({x, y, s = 1, facing = 1, color = "#7A7F85", opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`} opacity={opacity}>
    {[-62, -32, 36, 66].map((lx, i) => (
      <rect key={i} x={lx - 14} y={-56} width={28} height={56} rx={6} fill={color} stroke={C.ink} strokeWidth={4} />
    ))}
    <ellipse cx={0} cy={-92} rx={96} ry={54} fill={color} stroke={C.ink} strokeWidth={4} />
    <path d="M 40 -138 Q 60 -100 40 -50" fill="none" stroke={C.ink} strokeWidth={3} opacity={0.5} />
    <ellipse cx={100} cy={-80} rx={46} ry={34} fill={color} stroke={C.ink} strokeWidth={4} />
    <path d="M 132 -104 L 150 -146 L 118 -112 Z" fill="#D8D3C4" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M 78 -108 L 84 -132 L 98 -110 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={112} cy={-88} r={4} fill={C.ink} />
  </g>
);

/** A round-crowned tree, trunk base at (x, y). */
export const Tree: React.FC<{x: number; y: number; s?: number; shade?: number}> = ({x, y, s = 1, shade = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-150} width={28} height={150} fill="#4A3A2C" stroke={C.ink} strokeWidth={4} />
    <circle cx={0} cy={-220} r={86} fill={shade ? "#2F5236" : "#3F6B45"} stroke={C.ink} strokeWidth={4} />
    <circle cx={-60} cy={-170} r={58} fill={shade ? "#2F5236" : "#4E7A4A"} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={-176} r={54} fill={shade ? "#2F5236" : "#4E7A4A"} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** A young sapling that grows with k (0..1). Base at (x, y). */
export const Sapling: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => {
  const h = lerp(20, 150, clamp(k));
  const leaf = clamp(k * 1.6 - 0.3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 0 L 0 ${-h}`} stroke="#4A7A3A" strokeWidth={10} strokeLinecap="round" />
      <g transform={`translate(0 ${-h}) scale(${leaf})`}>
        <path d="M 0 0 C -50 -10 -70 -50 -64 -70 C -30 -70 -6 -40 0 0 Z" fill="#6FA654" stroke={C.ink} strokeWidth={3} />
        <path d="M 0 0 C 50 -10 70 -50 64 -70 C 30 -70 6 -40 0 0 Z" fill="#5E9347" stroke={C.ink} strokeWidth={3} />
      </g>
    </g>
  );
};

/** Smoke puffs rising from (x, y). */
export const Smoke: React.FC<{x: number; y: number; t: number; opacity?: number}> = ({x, y, t, opacity = 0.5}) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const ph = (t * 0.35 + i / 4) % 1;
      return <circle key={i} cx={x + Math.sin(ph * 5 + i) * 24} cy={y - ph * 300} r={22 + ph * 52} fill="#55585E" opacity={opacity * (1 - ph)} />;
    })}
  </g>
);
