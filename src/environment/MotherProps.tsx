import React from "react";
import {C, FONT} from "../styles/palette";
import {Look} from "../rig/Stickman";
import {RoundGlasses} from "../rig/looks";
import {rand} from "../motion/ease";

/*
 * Props for the mother film: the narrator and her mother, phone screens (incoming call, missed calls,
 * chat, voice message), a night city, Lebaran ketupat, medicine and the mother's sandals.
 * Phone screens are drawn in BigPhone screen units (0..300 x 0..420).
 */

const LongHairBack: React.FC<{color: string}> = ({color}) => (
  <path d="M -42 -6 A 42 44 0 0 1 42 -6 L 46 74 Q 0 86 -46 74 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
);
const SideFringe: React.FC<{color: string}> = ({color}) => (
  <path d="M -38 -2 A 38 38 0 0 1 38 -8 Q 10 -30 -20 -14 Q -30 -8 -38 -2 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
);

/** The narrator: a young woman working in the city. */
export const AKU: Look = {
  top: "#3E5A7A",
  sleeve: "#3E5A7A",
  trousers: "#26272C",
  headBack: <LongHairBack color="#1E1714" />,
  headExtra: <SideFringe color="#1E1714" />,
};

const Kerudung: React.FC<{color: string; front?: boolean}> = ({color, front}) =>
  front ? (
    <path d="M -44 0 A 44 46 0 0 1 44 0 L 44 30 Q 30 -36 0 -34 Q -30 -36 -44 30 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  ) : (
    <path d="M -44 -6 A 44 46 0 0 1 44 -6 L 50 54 Q 0 70 -50 54 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  );

/** The mother: sage headscarf, reading glasses, long batik-brown dress. */
export const IBU_DESA: Look = {
  top: "#6B5A46",
  sleeve: "#6B5A46",
  trousers: "#4A3E30",
  headBack: <Kerudung color="#7D8C6A" />,
  headExtra: (
    <g>
      <Kerudung color="#7D8C6A" front />
      <RoundGlasses />
    </g>
  ),
};

const T: React.FC<{x: number; y: number; size: number; color?: string; anchor?: "start" | "middle" | "end"; weight?: number; children: React.ReactNode}> = ({x, y, size, color = "#EDEDED", anchor = "middle", weight = 700, children}) => (
  <text x={x} y={y} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor}>
    {children}
  </text>
);

/** A phone seen edge-on, held to the ear (use as a Look's handR with the hand behind the head). */
export const earPhone = () => () => (
  <g>
    <rect x={-6} y={-62} width={12} height={64} rx={4} fill="#1A1A1E" stroke="#000" strokeWidth={2} />
  </g>
);

/** Round avatar with an initial. */
const Avatar: React.FC<{x: number; y: number; r: number; letter: string; color?: string}> = ({x, y, r, letter, color = "#7D8C6A"}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} />
    <T x={x} y={y + r * 0.36} size={r} color="#FFFFFF">
      {letter}
    </T>
  </g>
);

/** Incoming call screen. `pulse` animates the rings. */
export const CallScreen: React.FC<{name: string; t: number; sub?: string; color?: string}> = ({name, t, sub = "memanggil…", color}) => (
  <g>
    <rect width={300} height={420} fill="#101820" />
    {[0, 1, 2].map((i) => {
      const k = (t * 0.8 + i / 3) % 1;
      return <circle key={i} cx={150} cy={140} r={50 + k * 80} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4 * (1 - k)} />;
    })}
    <Avatar x={150} y={140} r={50} letter={name[0]} color={color} />
    <T x={150} y={240} size={36}>
      {name}
    </T>
    <T x={150} y={274} size={20} color="#A8B2BC" weight={600}>
      {sub}
    </T>
    <circle cx={80} cy={360} r={30} fill="#D9443A" />
    <circle cx={220} cy={360} r={30} fill="#3BAA5C" />
    <path d="M 66 360 q 14 -10 28 0" stroke="#FFF" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M 206 356 q 14 10 28 0" stroke="#FFF" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

/** A dark screen with only the clock (a phone that does not ring). */
export const QuietScreen: React.FC<{time: string}> = ({time}) => (
  <g>
    <rect width={300} height={420} fill="#05070A" />
    <T x={150} y={130} size={64} color="#3A4048" weight={600}>
      {time}
    </T>
  </g>
);

/** Missed-calls list; `n` rows are visible (0..4). */
export const MissedCalls: React.FC<{n: number}> = ({n}) => (
  <g>
    <rect width={300} height={420} fill="#F2F2F2" />
    <T x={20} y={46} size={24} color="#222" anchor="start">
      Panggilan
    </T>
    {["19.00", "19.02", "19.05", "19.11"].slice(0, n).map((time, i) => (
      <g key={time} transform={`translate(0 ${70 + i * 76})`}>
        <rect x={10} y={0} width={280} height={66} rx={10} fill="#FFFFFF" />
        <Avatar x={46} y={33} r={22} letter="I" />
        <T x={80} y={30} size={22} color="#D9443A" anchor="start">
          Ibu
        </T>
        <T x={80} y={54} size={15} color="#888" anchor="start" weight={600}>
          tak terjawab
        </T>
        <T x={278} y={38} size={16} color="#888" anchor="end" weight={600}>
          {time}
        </T>
      </g>
    ))}
  </g>
);

/** A chat with one sent message; `k` 0..1 slides it in. */
export const ChatSent: React.FC<{text: string; k: number}> = ({text, k}) => (
  <g>
    <rect width={300} height={420} fill="#E9E2D8" />
    <rect width={300} height={56} fill="#2E6B5A" />
    <Avatar x={34} y={28} r={18} letter="I" />
    <T x={64} y={36} size={22} anchor="start">
      Ibu
    </T>
    <g opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
      <rect x={90} y={300} width={196} height={56} rx={14} fill="#D3F5C3" />
      <T x={276} y={334} size={20} color="#222" anchor="end" weight={600}>
        {text}
      </T>
      <T x={276} y={372} size={13} color="#6A8A6A" anchor="end" weight={600}>
        19.12 ✓✓
      </T>
    </g>
  </g>
);

/** A voice message player; `play` 0..1 is the playhead, `t` animates the wave while playing. */
export const VoiceMessage: React.FC<{play: number; t: number; status: string}> = ({play, t, status}) => (
  <g>
    <rect width={300} height={420} fill="#E9E2D8" />
    <rect width={300} height={56} fill="#2E6B5A" />
    <T x={150} y={36} size={22}>
      Anakku
    </T>
    <rect x={20} y={170} width={260} height={84} rx={16} fill="#FFFFFF" />
    <circle cx={56} cy={212} r={22} fill="#2E6B5A" />
    {play > 0 && play < 1 ? (
      <g fill="#FFF">
        <rect x={48} y={202} width={6} height={20} />
        <rect x={58} y={202} width={6} height={20} />
      </g>
    ) : (
      <path d="M 50 200 L 66 212 L 50 224 Z" fill="#FFF" />
    )}
    {Array.from({length: 22}, (_, i) => {
      const x = 92 + i * 8.4;
      const played = i / 22 < play;
      const h = 8 + rand(i + 300) * 26 + (played && play < 1 ? Math.sin(t * 14 + i) * 6 : 0);
      return <rect key={i} x={x} y={212 - h / 2} width={5} height={h} rx={2} fill={played ? "#2E6B5A" : "#B9C4BE"} />;
    })}
    <T x={28} y={290} size={16} color="#8A6A6A" anchor="start" weight={600}>
      {status}
    </T>
  </g>
);

/** A night city skyline (in a window or behind glass), from x0 to x1 above y. */
export const CitySkyline: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {Array.from({length: Math.ceil((x1 - x0) / 90)}, (_, i) => {
      const w = 60 + rand(i + 500) * 40;
      const h = 160 + rand(i + 600) * 420;
      const x = x0 + i * 90;
      return (
        <g key={i}>
          <rect x={x} y={y - h} width={w} height={h} fill="#141A28" />
          {Array.from({length: Math.floor(h / 40)}, (_, r) =>
            [0, 1, 2].map((c) =>
              rand(i * 97 + r * 7 + c) > 0.55 ? <rect key={`${r}-${c}`} x={x + 10 + c * (w - 20) / 3} y={y - h + 14 + r * 40} width={8} height={12} fill="#F2C878" opacity={0.7} /> : null,
            ),
          )}
        </g>
      );
    })}
  </g>
);

/** A woven ketupat hanging from a string at (x, y). */
export const Ketupat: React.FC<{x: number; y: number; s?: number; sway?: number}> = ({x, y, s = 1, sway = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${sway}) scale(${s})`}>
    <line x1={0} y1={-90} x2={0} y2={-34} stroke="#6A5A3A" strokeWidth={3} />
    <path d="M 0 -34 L 34 0 L 0 34 L -34 0 Z" fill="#7FA34A" stroke={C.ink} strokeWidth={3} />
    <path d="M -17 -17 L 17 17 M 17 -17 L -17 17" stroke="#5A7A30" strokeWidth={4} />
    <path d="M 0 34 L -6 60 M 0 34 L 6 58" stroke="#7FA34A" strokeWidth={4} />
  </g>
);

/** A medicine bottle and a glass of water on a surface at y. */
export const Medicine: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-20} y={-56} width={40} height={56} rx={6} fill="#C9862A" stroke={C.ink} strokeWidth={3} />
    <rect x={-22} y={-68} width={44} height={14} rx={3} fill="#EDEDED" stroke={C.ink} strokeWidth={2} />
    <rect x={-14} y={-40} width={28} height={18} fill="#F2EEE6" />
    <path d="M 36 -64 L 40 0 L 74 0 L 78 -64 Z" fill="#CFE3EA" opacity={0.8} stroke={C.ink} strokeWidth={2} />
    <rect x={40} y={-40} width={34} height={38} fill="#9FC6D6" opacity={0.6} />
  </g>
);

/** The mother's sandals by the door, on y. */
export const Sandals: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${i * 60} ${i * 4}) rotate(${i ? 8 : -4})`}>
        <ellipse cx={0} cy={0} rx={30} ry={10} fill="#7A4A3A" stroke={C.ink} strokeWidth={2.5} />
        <path d="M -12 -4 Q 0 -18 12 -4" stroke="#C9A06A" strokeWidth={5} fill="none" />
      </g>
    ))}
  </g>
);

/** A folded headscarf (resting on the empty chair). */
export const FoldedScarf: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -50 0 L 50 0 L 40 -22 L -40 -22 Z" fill="#7D8C6A" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <line x1={-36} y1={-11} x2={36} y2={-11} stroke="#5E6B50" strokeWidth={3} />
  </g>
);

/** Falling tear drops from a face at (x, y). */
export const Tears: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    {[0, 1].map((i) => {
      const k = (t * 0.7 + i * 0.5) % 1;
      return <path key={i} d="M 0 -8 Q 6 2 0 7 Q -6 2 0 -8 Z" fill="#BFE0F0" opacity={0.9 * (1 - k)} transform={`translate(${x + i * 16} ${y + k * 60})`} />;
    })}
  </g>
);
