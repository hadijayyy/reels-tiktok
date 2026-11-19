import React, {useId} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {Coin} from "../environment/MoneyProps";
import {clamp, eOut, lerp, prog, rand} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {idle} from "../rig/poses";
import {Expr, Look, Stickman} from "../rig/Stickman";
import {C, FONT, FPS, H, W} from "../styles/palette";
import {BOROS, FINISH, INVESTOR, JUDOL, MONTH_FRAMES, PENABUNG, START, WIN_MONTH} from "./gajiSamaData";

/*
 * GAJI SAMA — a four-way race with no narration, only music, coins and on-screen text (about 32 s).
 * Same Rp8 juta salary; who reaches Rp100 juta first? Boros (spender), Investor, Penabung (saver) and
 * Judol (online gambler) each fill a jar under their own spotlight while the month counter runs.
 * Balances come from scripts/make_race.py (src/scenes/gajiSamaData.ts). Illustration, not advice.
 */

export {FRAMES as GAJI_FRAMES} from "./gajiSamaData";

const SC = 0.72;
const TARGET = 100;

type Who = {
  name: string;
  color: string;
  look: Look;
  data: number[];
  /** [month, text] call-outs shown above the head for a couple of months */
  events: [number, string][];
  /** stops putting coins in the jar from this month on */
  stopsAt?: number;
  extra?: (frame: number, m: number) => React.ReactNode;
};

const BOROS_LOOK: Look = {top: "#E07B39", sleeve: "#E07B39", trousers: "#2E3135", hat: "cap", hatColor: "#2A2D33"};
const JUDOL_LOOK: Look = {top: "#2B2D33", sleeve: "#2B2D33", coat: "#1F2126", trousers: "#1C1D20", hat: "beanie", hatColor: "#3A1E22"};
const INVESTOR_LOOK: Look = {...JACKET_BLUE, tie: "#3D7BFF"};

/** Shopping bags at the spender's feet. */
const Bags: React.FC = () => (
  <g>
    {[
      [-175, "#D9417B", 70],
      [-140, "#F2C14E", 56],
    ].map(([x, col, h], i) => (
      <g key={i} transform={`translate(${x} 0)`}>
        <path d={`M -10 ${-(h as number)} q 14 -26 28 0`} stroke={C.ink} strokeWidth={4} fill="none" />
        <rect x={-22} y={-(h as number)} width={52} height={h as number} rx={4} fill={col as string} stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
  </g>
);

/** Phone with slot reels, held in the gambler's right hand. */
const slotPhone = (frame: number) => () => (
  <g transform="translate(-30 -70)">
    <rect x={0} y={0} width={56} height={92} rx={9} fill={C.ink} />
    <rect x={5} y={10} width={46} height={72} rx={3} fill="#3B0F18" />
    {[0, 1, 2].map((i) => (
      <text key={i} x={13 + i * 15} y={54} fontFamily={FONT} fontWeight={800} fontSize={18} fill="#FFD84D" textAnchor="middle">
        {String(Math.floor(rand(Math.floor(frame / 3) * 3 + i) * 9) + 1)}
      </text>
    ))}
  </g>
);

const WHO: Who[] = [
  {
    name: "BOROS",
    color: "#F2A33A",
    look: BOROS_LOOK,
    data: BOROS,
    events: [[4, "DISKON 11.11"], [8, "GADGET BARU"], [12, "PAYLATER"], [16, "NONGKRONG"], [20, "CHECKOUT"], [24, "PAYLATER"], [28, "DISKON LAGI"], [32, "LIBURAN"], [36, "CHECKOUT"], [40, "PAYLATER"]],
    extra: () => <Bags />,
  },
  {
    name: "INVESTOR",
    color: "#4F8BFF",
    look: INVESTOR_LOOK,
    data: INVESTOR,
    events: [[2, "PASAR TURUN"], [7, "TETAP INVES"], [14, "MENYALIP!"], [24, "BUNGA MAJEMUK"]],
  },
  {
    name: "PENABUNG",
    color: "#A57BFF",
    look: CASUAL,
    data: PENABUNG,
    events: [[6, "KONSISTEN"], [20, "AMAN, TAPI..."], [32, "TANPA BUNGA"]],
  },
  {
    name: "JUDOL",
    color: "#E5484D",
    look: JUDOL_LOOK,
    data: JUDOL,
    stopsAt: 0,
    events: [[2, "MENANG!"], [4, "MAXWIN!"], [5, "KALAH..."], [7, "SALDO HABIS"], [10, "PINJOL"], [18, "GALI LUBANG"], [28, "UTANG NUMPUK"]],
  },
];

const rupiah = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 99.95 ? "100" : a.toFixed(1).replace(".", ",");
  return `${v < -0.05 ? "-" : ""}Rp${s} jt`;
};

/** Month as a float: 0 before the race starts, WIN_MONTH at the finish. */
const monthAt = (frame: number) => clamp((frame - START) / MONTH_FRAMES, 0, WIN_MONTH);

const valueAt = (data: number[], m: number) => {
  const i = Math.min(Math.floor(m), data.length - 1);
  const j = Math.min(i + 1, data.length - 1);
  return lerp(data[i], data[j], m - i);
};

/** Background: dark plank wall, a tiled floor strip at the bottom. */
const Room: React.FC = () => {
  const id = "w" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24272D" />
          <stop offset="100%" stopColor="#3A3E46" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={i * 92 + 20} y1={0} x2={i * 92 + 20} y2={H} stroke="#1E2126" strokeWidth={4} opacity={0.7} />
      ))}
      <rect x={0} y={1620} width={W} height={300} fill="#2A2D33" />
    </g>
  );
};

/** One contestant: spotlight, jar, stickman, balance and call-outs. (cx, floor) = centre of the floor line. */
const Booth: React.FC<{who: Who; cx: number; floor: number; frame: number; on: number; dim: number; winner: boolean}> = ({who, cx, floor, frame, on, dim, winner}) => {
  const t = frame / FPS;
  const m = monthAt(frame);
  const v = valueAt(who.data, m);
  const fill = clamp(v / TARGET);
  const id = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const depositing = frame >= START && frame < FINISH && (who.stopsAt === undefined || m < who.stopsAt);
  const p = ((frame - START) % MONTH_FRAMES) / MONTH_FRAMES;
  const jarX = 10;
  const jarW = 130;
  const jarH = 170;
  const fillH = 150 * fill;
  const coinY = lerp(-185, -fillH - 10, eOut(clamp(p / 0.7)));
  const event = [...who.events].reverse().find(([em]) => m >= em && m < em + 2.6);
  const debt = v < -0.05;
  const lost = who.name === "JUDOL" && m >= 5;
  const expr: Expr = winner ? "happy" : lost ? (m >= 10 ? "sad" : "worried") : who.name === "BOROS" && event ? "happy" : who.name === "INVESTOR" && m < 7 && m > 1.5 ? "worried" : "focused";
  const lampY = -335;
  return (
    <g transform={`translate(${cx} ${floor})`} opacity={1 - dim * 0.55}>
      <g transform="scale(1.2)">
      {/* spotlight */}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={who.color} stopOpacity={0.55 * on} />
          <stop offset="100%" stopColor={who.color} stopOpacity={0.12 * on} />
        </linearGradient>
      </defs>
      <path d={`M ${-30} ${lampY + 20} L 30 ${lampY + 20} L 200 0 L -200 0 Z`} fill={`url(#${id})`} />
      <ellipse cx={0} cy={2} rx={210} ry={14} fill={who.color} opacity={0.5 * on} />
      <path d={`M -40 ${lampY + 20} L -22 ${lampY} L 22 ${lampY} L 40 ${lampY + 20} Z`} fill="#15171B" stroke={C.ink} strokeWidth={3} />
      <rect x={-36} y={lampY + 18} width={72} height={6} rx={3} fill={who.color} opacity={on} />
      <text x={0} y={lampY - 22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} letterSpacing={6} fill={who.color}>
        {who.name}
      </text>
      {who.extra ? who.extra(frame, m) : null}
      {/* jar: back, coins, glass */}
      <rect x={jarX} y={-jarH} width={jarW} height={jarH} rx={22} fill="#FFFFFF" opacity={0.06} />
      {fillH > 1 ? (
        <g>
          <rect x={jarX + 6} y={-fillH - 4} width={jarW - 12} height={fillH} rx={14} fill="#E9B23A" />
          {Array.from({length: Math.floor(fillH / 14)}).map((_, i) => (
            <line key={i} x1={jarX + 12} y1={-8 - i * 14} x2={jarX + jarW - 12} y2={-8 - i * 14} stroke="#B9861E" strokeWidth={3} />
          ))}
          <ellipse cx={jarX + jarW / 2} cy={-fillH - 4} rx={(jarW - 12) / 2} ry={7} fill="#FFD66B" />
        </g>
      ) : null}
      {debt ? <rect x={jarX + 6} y={-24} width={jarW - 12} height={20} rx={8} fill={C.red} opacity={0.5 + 0.3 * Math.sin(t * 8)} /> : null}
      <rect x={jarX} y={-jarH} width={jarW} height={jarH} rx={22} fill="none" stroke="#E6ECF2" strokeWidth={6} opacity={0.9} />
      <rect x={jarX + 14} y={-jarH - 14} width={jarW - 28} height={16} rx={6} fill="#C9D2DC" stroke={C.ink} strokeWidth={3} />
      <line x1={jarX + 22} y1={-jarH + 26} x2={jarX + 22} y2={-40} stroke="#FFFFFF" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
      {depositing && p < 0.75 ? <Coin x={jarX + jarW / 2} y={coinY} r={14} spin={p * 9} /> : null}
      {/* the contestant */}
      <Stickman
        x={-80}
        y={0}
        scale={SC}
        pose={idle(t, cx + floor)}
        look={who.name === "JUDOL" ? {...who.look, handR: slotPhone(frame)} : who.look}
        reachR={who.name === "JUDOL" ? {x: -20, y: -120} : {x: jarX + 4, y: -jarH + (depositing ? Math.sin(p * Math.PI) * 8 : 0)}}
        expr={expr}
      />
      {/* call-out */}
      {event && !winner ? (
        <g transform={`translate(${-80} ${-292}) scale(${clamp((m - event[0]) * 6)})`}>
          <rect x={-(event[1].length * 15 + 26)} y={-30} width={event[1].length * 30 + 52} height={48} rx={24} fill={who.color} stroke={C.ink} strokeWidth={4} />
          <text x={0} y={4} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill="#111">
            {event[1]}
          </text>
        </g>
      ) : null}
      {winner ? <Trophy x={75} y={-245} frame={frame} /> : null}
      </g>
      {/* balance */}
      <text x={0} y={100} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={winner ? 92 : 80} fill={debt ? "#FF6B6B" : winner ? "#FFD84D" : "#FFFFFF"} stroke={C.ink} strokeWidth={10} paintOrder="stroke">
        {rupiah(v)}
      </text>
    </g>
  );
};

/** A burst of confetti over the winner. */
const Confetti: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => {
  const f = frame - FINISH;
  return (
    <g>
      {Array.from({length: 40}).map((_, i) => {
        const a = rand(i) * Math.PI * 2;
        const sp = 6 + rand(i + 40) * 10;
        const px = x + Math.cos(a) * sp * f;
        const py = y + Math.sin(a) * sp * f + 0.18 * f * f;
        const col = ["#FFD84D", "#4F8BFF", "#E5484D", "#A57BFF", "#FFFFFF"][i % 5];
        return f > 0 && f < 70 ? <rect key={i} x={px} y={py} width={14} height={8} fill={col} transform={`rotate(${f * 12 + i * 30} ${px} ${py})`} /> : null;
      })}
    </g>
  );
};

/** Trophy that pops in over the winner's head. */
const Trophy: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${prog(frame, FINISH, FINISH + 12, eOut) * 0.9})`}>
    <path d="M -40 -40 L 40 -40 L 32 10 Q 0 34 -32 10 Z" fill="#FFD84D" stroke={C.ink} strokeWidth={5} />
    <path d="M -40 -30 Q -66 -30 -58 -6 Q -50 10 -32 6" fill="none" stroke={C.ink} strokeWidth={6} />
    <path d="M 40 -30 Q 66 -30 58 -6 Q 50 10 32 6" fill="none" stroke={C.ink} strokeWidth={6} />
    <rect x={-8} y={22} width={16} height={22} fill="#E9B23A" stroke={C.ink} strokeWidth={4} />
    <rect x={-30} y={42} width={60} height={14} rx={4} fill="#E9B23A" stroke={C.ink} strokeWidth={4} />
  </g>
);

export const GajiSama: React.FC<{narration?: string}> = ({narration}) => {
  const frame = useCurrentFrame();
  const m = monthAt(frame);
  const done = frame >= FINISH;
  const dim = prog(frame, FINISH + 8, FINISH + 24);
  const outro = prog(frame, FINISH + 70, FINISH + 88);
  const banner = prog(frame, 6, 18, eOut);
  const booths = [
    {who: WHO[0], cx: 270, floor: 700},
    {who: WHO[1], cx: 810, floor: 700},
    {who: WHO[2], cx: 270, floor: 1470},
    {who: WHO[3], cx: 810, floor: 1470},
  ];
  const years = (WIN_MONTH / 12).toFixed(1).replace(".", ",");
  return (
    <AbsoluteFill style={{backgroundColor: "#202328"}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room />
        {booths.map((b, i) => (
          <Booth key={b.who.name} {...b} frame={frame} on={prog(frame, 4 + i * 8, 12 + i * 8)} dim={b.who.name === "INVESTOR" ? 0 : dim} winner={done && b.who.name === "INVESTOR"} />
        ))}
        {/* month counter */}
        <g transform="translate(540 130)">
          <rect x={-320} y={-52} width={640} height={84} rx={42} fill="#111317" stroke={done ? "#FFD84D" : "#4A4F58"} strokeWidth={5} />
          <text x={0} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill={done ? "#FFD84D" : "#FFFFFF"}>
            {frame < START ? "BULAN 0" : done ? `BULAN ${WIN_MONTH} · ${years} TAHUN` : `BULAN ${Math.floor(m)}`}
          </text>
        </g>
        {/* title banner */}
        <g transform={`translate(540 895) scale(${banner})`}>
          <rect x={-470} y={-62} width={940} height={124} rx={26} fill="#0D0F12" stroke="#3A3F48" strokeWidth={5} opacity={0.94} />
          <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill="#FFFFFF">
            GAJI SAMA: RP8 JUTA/BULAN.
          </text>
          <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill="#FFD84D">
            SIAPA DULUAN TEMBUS RP100 JUTA?
          </text>
        </g>
        {done ? <Confetti x={810} y={560} frame={frame} /> : null}
      </svg>
      {/* closing card */}
      <AbsoluteFill style={{opacity: outro, justifyContent: "center", alignItems: "center"}}>
        <AbsoluteFill style={{backgroundColor: "#000", opacity: 0.55}} />
        <div style={{background: "#0D0F12", border: "5px solid #FFD84D", borderRadius: 32, padding: "48px 56px", width: 860, textAlign: "center", fontFamily: FONT, transform: `scale(${0.9 + 0.1 * outro})`}}>
          <div style={{fontWeight: 800, fontSize: 64, color: "#FFFFFF", lineHeight: 1.15}}>Gaji sama.</div>
          <div style={{fontWeight: 800, fontSize: 64, color: "#FFD84D", lineHeight: 1.15}}>Yang beda: kebiasaan.</div>
          <div style={{fontWeight: 600, fontSize: 30, color: "#C9CED6", marginTop: 30, lineHeight: 1.35}}>
            Ilustrasi. Investor: Rp2 juta/bulan di reksa dana indeks, rata-rata ±6,6% per tahun. Penabung: Rp2 juta/bulan tanpa bunga. Bukan saran investasi.
          </div>
        </div>
      </AbsoluteFill>
      <Narration file={narration} volume={1} />
    </AbsoluteFill>
  );
};
