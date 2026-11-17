import React, {useId} from "react";
import {C} from "../styles/palette";
import {Look} from "../rig/Stickman";
import {ShortHair} from "../rig/looks";
import {rand} from "../motion/ease";

/*
 * Props for a small Indonesian family film: a simple house, kitchen, dining table, motorbike, car,
 * road at night, helmet and photo frame, plus the three characters' looks.
 * Same drawing rules as Furniture.tsx: flat shapes, one outline weight, world units.
 */

const sid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

export const F = {
  roof: "#9A4A2E",
  roofDark: "#6E3220",
  houseWall: "#D9CBB0",
  houseWallNight: "#3A3A44",
  roomWall: "#4A3F36",
  roomWallNight: "#262327",
  tile: "#5A4A3E",
  asphalt: "#22252B",
  lane: "#C9C3A8",
  warm: "#FFB86B",
  dawn: "#F2C38B",
  helmet: "#B8352B",
  bike: "#2F5D8A",
};

/** Moustache, drawn over the face (head frame). */
const Moustache: React.FC = () => <path d="M -11 7 Q -5 4 0 7 Q 5 4 11 7 Q 6 12 0 9 Q -6 12 -11 7 Z" fill="#8C8C8C" stroke={C.ink} strokeWidth={1.5} />;

/** The father: grey hair and moustache, faded work shirt. */
export const AYAH: Look = {
  top: "#6B5B45",
  sleeve: "#6B5B45",
  trousers: "#3A3633",
  headExtra: (
    <g>
      <ShortHair color="#A8A8A8" />
      <Moustache />
    </g>
  ),
};

/** The father riding: same clothes, red helmet. */
export const AYAH_HELMET: Look = {...AYAH, headExtra: <Moustache />, hat: "helmet", hatColor: F.helmet};

/** Headscarf: a ring around the face (headExtra) and a drape behind (headBack). */
const KerudungBack: React.FC<{color: string}> = ({color}) => (
  <path d="M -44 -6 A 44 46 0 0 1 44 -6 L 50 54 Q 0 70 -50 54 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
);
const KerudungFront: React.FC<{color: string}> = ({color}) => (
  <path d="M -44 0 A 44 46 0 0 1 44 0 L 44 30 Q 30 -36 0 -34 Q -30 -36 -44 30 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
);

/** The mother: dusty-rose headscarf and long dress. */
export const IBU: Look = {
  top: "#8A5A5E",
  sleeve: "#8A5A5E",
  trousers: "#5E3E42",
  headBack: <KerudungBack color="#B07A80" />,
  headExtra: <KerudungFront color="#B07A80" />,
};

/** The child: yellow T-shirt, short hair. */
export const ANAK: Look = {
  top: "#D8A73A",
  sleeve: "#D8A73A",
  trousers: "#33465C",
  headExtra: <ShortHair color="#1E1A18" />,
};

/** Sky band with a colour from top to bottom. */
export const SkyBand: React.FC<{top: string; bottom: string; y0?: number; y1?: number}> = ({top, bottom, y0 = -1600, y1 = 500}) => {
  const id = "sk" + sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-2400} y={y0} width={4800} height={y1 - y0} fill={`url(#${id})`} />
    </g>
  );
};

/** A simple village house front: tiled roof, plastered wall, wooden door, window, porch. Centre x, ground y. */
export const House: React.FC<{x: number; y: number; night?: number; doorOpen?: number; windowLight?: number}> = ({x, y, night = 0, doorOpen = 0, windowLight = 0}) => {
  const wall = night > 0.5 ? F.houseWallNight : F.houseWall;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* porch floor */}
      <rect x={-420} y={-24} width={840} height={24} fill="#6A5E52" stroke={C.ink} strokeWidth={3} />
      <rect x={-380} y={-430} width={760} height={406} fill={wall} stroke={C.ink} strokeWidth={4} />
      {/* roof */}
      <path d="M -470 -420 L 0 -640 L 470 -420 Z" fill={F.roof} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-470 + i * 40} y1={-420 - i * 18.7} x2={470 - i * 40} y2={-420 - i * 18.7} stroke={F.roofDark} strokeWidth={3} />
      ))}
      {/* door */}
      <rect x={-70} y={-280} width={140} height={256} fill="#1A1410" />
      <rect x={-70} y={-280} width={140 * (1 - doorOpen * 0.8)} height={256} fill="#6A4A30" stroke={C.ink} strokeWidth={4} />
      <circle cx={-70 + 140 * (1 - doorOpen * 0.8) - 18} cy={-150} r={6} fill={C.yellow} />
      {/* window */}
      {[-250, 250].map((wx) => (
        <g key={wx}>
          <rect x={wx - 70} y={-300} width={140} height={130} fill={windowLight > 0 ? F.warm : "#2C3440"} opacity={windowLight > 0 ? 0.35 + windowLight * 0.65 : 1} stroke={C.ink} strokeWidth={4} />
          <line x1={wx} y1={-300} x2={wx} y2={-170} stroke="#5A3E28" strokeWidth={8} />
          <line x1={wx - 70} y1={-235} x2={wx + 70} y2={-235} stroke="#5A3E28" strokeWidth={8} />
        </g>
      ))}
      {/* porch posts */}
      {[-400, 400].map((px) => (
        <rect key={px} x={px - 10} y={-420} width={20} height={396} fill="#5A3E28" stroke={C.ink} strokeWidth={3} />
      ))}
    </g>
  );
};

/** A plant pot for the porch. */
export const PlantPot: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -30 0 L -38 -50 L 38 -50 L 30 0 Z" fill="#9A5A3A" stroke={C.ink} strokeWidth={3} />
    {[-24, -8, 8, 24].map((lx, i) => (
      <path key={lx} d={`M 0 -50 Q ${lx} ${-110 - i * 8} ${lx * 1.8} ${-140 + (i % 2) * 20}`} stroke="#3F6A3A" strokeWidth={8} fill="none" strokeLinecap="round" />
    ))}
  </g>
);

/** A power pole with drooping cables. */
export const PowerPole: React.FC<{x: number; y: number; h?: number}> = ({x, y, h = 760}) => (
  <g>
    <rect x={x - 10} y={y - h} width={20} height={h} fill="#4A4E55" stroke={C.ink} strokeWidth={3} />
    <rect x={x - 70} y={y - h + 40} width={140} height={12} fill="#4A4E55" stroke={C.ink} strokeWidth={2} />
    <path d={`M ${x - 1400} ${y - h + 90} Q ${x - 700} ${y - h + 200} ${x - 60} ${y - h + 46} Q ${x + 700} ${y - h + 200} ${x + 1400} ${y - h + 90}`} stroke="#111" strokeWidth={3} fill="none" />
  </g>
);

/** A street lamp; `on` lights a cone below it. */
export const StreetLamp: React.FC<{x: number; y: number; on?: number}> = ({x, y, on = 1}) => {
  const id = "sl" + sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={F.warm} stopOpacity={0.45 * on} />
          <stop offset="100%" stopColor={F.warm} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M ${x + 60} ${y - 640} L ${x - 160} ${y} L ${x + 300} ${y} Z`} fill={`url(#${id})`} />
      <rect x={x - 8} y={y - 680} width={16} height={680} fill="#3A3E45" stroke={C.ink} strokeWidth={3} />
      <path d={`M ${x} ${y - 680} Q ${x + 30} ${y - 700} ${x + 70} ${y - 660}`} stroke="#3A3E45" strokeWidth={10} fill="none" />
      <ellipse cx={x + 70} cy={y - 650} rx={26} ry={10} fill={on > 0 ? F.warm : "#555"} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/** Asphalt road from y down, with dashed lane marks that slide by `scroll` units. */
export const Road: React.FC<{y: number; scroll?: number; wet?: boolean}> = ({y, scroll = 0, wet}) => (
  <g>
    <rect x={-2400} y={y} width={4800} height={1400} fill={F.asphalt} />
    <rect x={-2400} y={y} width={4800} height={10} fill="#3A3E45" />
    {Array.from({length: 24}, (_, i) => {
      const x = -2400 + ((i * 220 - scroll) % 5280 + 5280) % 5280;
      return <rect key={i} x={x} y={y + 140} width={120} height={12} fill={F.lane} opacity={0.75} />;
    })}
    {wet ? <rect x={-2400} y={y + 10} width={4800} height={300} fill="#8FA6C0" opacity={0.06} /> : null}
  </g>
);

/** A small step-through motorbike, wheels on the ground at (x, y). Faces right. */
export const Motorbike: React.FC<{x: number; y: number; s?: number; spin?: number; lying?: boolean; light?: number}> = ({x, y, s = 1, spin = 0, lying, light = 0}) => {
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} -34) rotate(${spin})`}>
      <circle r={34} fill="#1A1A1D" stroke={C.ink} strokeWidth={3} />
      <circle r={18} fill="#7A7F88" />
      <line x1={-18} y1={0} x2={18} y2={0} stroke="#4A4E55" strokeWidth={4} />
      <line x1={0} y1={-18} x2={0} y2={18} stroke="#4A4E55" strokeWidth={4} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) ${lying ? "rotate(-24) scale(1 0.78)" : ""} scale(${s})`}>
      {light > 0 ? <path d="M 96 -96 L 520 -170 L 520 -10 Z" fill={F.warm} opacity={0.18 * light} /> : null}
      {wheel(-70)}
      {wheel(75)}
      {/* body: low step-through frame */}
      <path d="M -96 -60 Q -100 -92 -40 -92 L 10 -92 Q 20 -60 40 -56 L 70 -60 L 92 -110 L 104 -108 L 84 -50 L 40 -40 Q -20 -36 -60 -46 Z" fill={F.bike} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-70} y={-104} width={86} height={16} rx={7} fill="#1C1C1F" stroke={C.ink} strokeWidth={3} />
      <line x1={92} y1={-110} x2={70} y2={-124} stroke="#2A2A2E" strokeWidth={7} strokeLinecap="round" />
      <circle cx={102} cy={-98} r={8} fill={light > 0 ? F.warm : "#DADADA"} stroke={C.ink} strokeWidth={2} />
      <path d="M -96 -60 L -112 -66" stroke="#555" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** Where the rider's hip, feet and hands go on a Motorbike at (x, y) with scale s. */
export const bikeRider = (x: number, y: number, s: number) => ({
  hip: {x: x - 26 * s, y: y - 104 * s},
  footL: {x: x + 22 * s, y: y - 44 * s},
  footR: {x: x + 30 * s, y: y - 44 * s},
  hand: {x: x + 70 * s, y: y - 124 * s},
});

/** A car silhouette, wheels on the ground at (x, y). Faces right; headlights glow. */
export const Car: React.FC<{x: number; y: number; s?: number; lights?: number; flip?: boolean}> = ({x, y, s = 1, lights = 1, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    {lights > 0 ? <path d="M 200 -70 L 900 -190 L 900 40 Z" fill="#FFF3D6" opacity={0.28 * lights} /> : null}
    <path d="M -200 -40 L -196 -96 L -120 -104 L -60 -160 L 80 -160 L 140 -104 L 200 -92 L 206 -40 Z" fill="#2C3038" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -50 -150 L 70 -150 L 118 -106 L -96 -106 Z" fill="#46505E" />
    {[-120, 120].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={-34} r={36} fill="#151517" stroke={C.ink} strokeWidth={3} />
        <circle cx={cx} cy={-34} r={16} fill="#5A5F68" />
      </g>
    ))}
    <ellipse cx={196} cy={-78} rx={10} ry={8} fill="#FFF3D6" opacity={0.4 + 0.6 * lights} />
    <rect x={-202} y={-84} width={10} height={14} fill="#B8352B" />
  </g>
);

/** A helmet lying on its side, centred on (x, y). */
export const HelmetOnRoad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(18)`}>
    <ellipse cx={0} cy={18} rx={60} ry={10} fill="#000" opacity={0.35} />
    <path d="M -54 10 A 54 54 0 0 1 54 10 Z" fill={F.helmet} stroke={C.ink} strokeWidth={4} />
    <path d="M 8 -30 A 40 40 0 0 1 50 4 L 20 4 Z" fill="#2A3038" stroke={C.ink} strokeWidth={3} />
    <path d="M -40 -14 A 42 42 0 0 1 -10 -38" stroke="#E07A6E" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

/** A kitchen counter with a stove, a pot and rising steam, standing on y at x. */
export const Stove: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-170} y={-150} width={340} height={150} fill="#6A5848" stroke={C.ink} strokeWidth={4} />
    <rect x={-180} y={-162} width={360} height={16} fill="#8A7A68" stroke={C.ink} strokeWidth={3} />
    <rect x={-90} y={-182} width={180} height={22} rx={6} fill="#3A3D44" stroke={C.ink} strokeWidth={3} />
    {[-40, 40].map((fx) => (
      <path key={fx} d={`M ${fx - 14} -182 Q ${fx} ${-204 - Math.sin(t * 9 + fx) * 4} ${fx + 14} -182 Z`} fill="#5AA0F0" opacity={0.85} />
    ))}
    <path d="M -70 -186 L -64 -260 L 64 -260 L 70 -186 Z" fill="#9AA0A8" stroke={C.ink} strokeWidth={4} />
    <rect x={-80} y={-270} width={160} height={14} rx={6} fill="#B0B5BC" stroke={C.ink} strokeWidth={3} />
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.45 + i / 3) % 1;
      return <path key={i} d={`M ${-30 + i * 30} ${-280 - ph * 160} q 16 -24 0 -48 q -16 -24 0 -48`} stroke="#F2EEE6" strokeWidth={6} fill="none" opacity={0.45 * (1 - ph)} strokeLinecap="round" />;
    })}
  </g>
);

/** A wooden dining table with plates; `chairs` lists the chair x positions. Floor y. */
export const DiningTable: React.FC<{x: number; y: number; w?: number; plates?: number[]}> = ({x, y, w = 520, plates = []}) => (
  <g>
    <rect x={x - w / 2} y={y - 170} width={w} height={18} fill="#7A5A3A" stroke={C.ink} strokeWidth={3} />
    <rect x={x - w / 2 + 20} y={y - 152} width={14} height={152} fill="#5A3E28" />
    <rect x={x + w / 2 - 34} y={y - 152} width={14} height={152} fill="#5A3E28" />
    {plates.map((px) => (
      <g key={px}>
        <ellipse cx={px} cy={y - 174} rx={46} ry={9} fill="#ECE8DE" stroke={C.ink} strokeWidth={2} />
        <ellipse cx={px} cy={y - 180} rx={24} ry={7} fill="#F5F2EA" />
      </g>
    ))}
  </g>
);

/** A plain wooden chair seen from the side. Faces +x when facing = 1. */
export const SideChair: React.FC<{x: number; y: number; facing?: 1 | -1}> = ({x, y, facing = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${facing} 1)`}>
    <rect x={-46} y={-96} width={92} height={14} fill="#8A6A48" stroke={C.ink} strokeWidth={3} />
    <rect x={-46} y={-82} width={10} height={82} fill="#5A3E28" />
    <rect x={36} y={-82} width={10} height={82} fill="#5A3E28" />
    <rect x={-50} y={-230} width={14} height={140} fill="#5A3E28" stroke={C.ink} strokeWidth={2} />
    <rect x={-50} y={-230} width={14} height={140} fill="#7A5A3A" />
  </g>
);

/** A framed photo of the father (a head-and-shoulders portrait). Centre (x, y). */
export const PhotoFrame: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-90} width={140} height={180} rx={6} fill="#4A3220" stroke={C.ink} strokeWidth={4} />
    <rect x={-56} y={-76} width={112} height={152} fill="#CDBFA2" />
    {/* portrait */}
    <path d="M -46 76 Q -40 26 0 22 Q 40 26 46 76 Z" fill={AYAH.top} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={0} cy={-12} r={30} fill="#F2F0EA" stroke={C.ink} strokeWidth={2.5} />
    <path d="M -30 -15 A 30 30 0 0 1 30 -15 Q 0 -32 -30 -15 Z" fill="#A8A8A8" stroke={C.ink} strokeWidth={2} />
    <circle cx={-9} cy={-12} r={2.6} fill={C.ink} />
    <circle cx={9} cy={-12} r={2.6} fill={C.ink} />
    <path d="M -9 -2 Q -4 -5 0 -2 Q 4 -5 9 -2 Q 4 2 0 0 Q -4 2 -9 -2 Z" fill="#8C8C8C" />
    <path d="M -8 5 Q 0 11 8 5" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
    <rect x={-56} y={-76} width={112} height={152} fill="#FFE6B0" opacity={0.12} />
  </g>
);

/** A heavy sack carried on the back (use as a Look's back). */
export const SackOnBack: React.ReactNode = (
  <g transform="translate(-30 -70) rotate(-14)">
    <path d="M -46 -10 Q -54 70 -30 96 L 40 96 Q 60 60 48 -6 Q 0 -30 -46 -10 Z" fill="#B59A6A" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M -20 0 L 26 2" stroke="#8A7048" strokeWidth={4} />
  </g>
);

/** Falling rain over a wide area. */
export const LightRain: React.FC<{t: number; opacity?: number}> = ({t, opacity = 0.25}) => (
  <g stroke="#B8C6D6" strokeWidth={2.5} strokeLinecap="round" opacity={opacity}>
    {Array.from({length: 90}, (_, i) => {
      const x = -900 + rand(i * 3 + 11) * 1800;
      const y = -1100 + ((rand(i * 3 + 12) * 2000 + t * 1300) % 2000);
      return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 34} />;
    })}
  </g>
);
