import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Board, Desk, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {BigPhone, handPhone, Stamp, Tick} from "../environment/MoneyProps";
import {APP_COLORS, Awning, Counter, Flag, Institution, PersonIcon, QRCode, Sticker, Suitcase, WalletScreen} from "../environment/QrisProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog, rand} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, mix, point} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES as Q_CUES, SCENES as Q_SCENES} from "./qrisTiming";

/*
 * SIAPA YANG BIKIN QRIS? — an 18-scene stickman explainer (about 100 s).
 *   1 Hook: you scan QRIS every day; who made it?      10 Trials: 2018 and April 2019
 *   2 2018: e-wallets everywhere                        11 Launch: 17 August 2019
 *   3 Each app has its own QR; they can't read others  12 Mandatory from 1 January 2020
 *   4 The warung counter covered in stickers           13 One code, any app
 *   5 Confused buyer, seller juggling accounts         14 ~67 million users, a quarter of the population
 *   6 Bank Indonesia steps in (Governor Perry Warjiyo) 15 ~45 million merchants, mostly MSMEs
 *   7 BI + ASPI make one national standard             16 Usable in Malaysia, Singapore, Thailand, Korea
 *   8 Based on the EMVCo standard, so apps interoperate 17 A shared standard, one scan
 *   9 The name: Quick Response Code Indonesian Standard 18 Next time: remember the sticker counter
 * Scene lengths and caption cues come from qrisTiming.ts (written by scripts/make_narration.py).
 */

export {FRAMES as QRIS_FRAMES} from "./qrisTiming";

/** First caption cue of each scene, as printed by make_narration.py. */
const FIRST = [0, 3, 5, 8, 11, 13, 15, 17, 20, 23, 25, 28, 31, 34, 36, 39, 42, 45];
/** Frame, local to scene i, at which phrase j of that scene starts. */
const at = (i: number, j: number) => Q_CUES[FIRST[i] + j].from - Q_SCENES[i].from;

const SCALE = 1.4;
const WALL = "#26303A";
const WARM = "#33291F";

const pop = (frame: number, a: number) => {
  const k = clamp((frame - a) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

const withPhone = (look: Look, color: string, ok = 0): Look => ({...look, handR: handPhone(<WalletScreen color={color} ok={ok} />)});
const OFFICIAL: Look = {...JACKET_BLUE, tie: C.red};
const SELLER: Look = {...SHIRT_ORANGE};
const BUYER: Look = CASUAL;
const TECH: Look = {top: "#E9E7DF", sleeve: "#E9E7DF", trousers: "#2E3135", headExtra: JACKET_BLUE.headExtra};

const Plate: React.FC<{x: number; y: number; text: string; k: number; w?: number; size?: number; color?: string; border?: string; rot?: number}> = ({x, y, text, k, w, size = 50, color = C.bone, border = C.yellow, rot = 0}) => {
  if (k <= 0) return null;
  const ww = w ?? text.length * size * 0.68 + size * 1.2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <rect x={-ww / 2} y={-size * 0.95} width={ww} height={size * 1.7} rx={size * 0.3} fill={C.charcoal} stroke={border} strokeWidth={6} />
      <Label x={0} y={size * 0.3} text={text} size={size} color={color} />
    </g>
  );
};

const RedX: React.FC<{x: number; y: number; k: number; r?: number}> = ({x, y, k, r = 34}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={r} fill={C.red} stroke={C.ink} strokeWidth={4} />
      <path d={`M ${-r * 0.4} ${-r * 0.4} L ${r * 0.4} ${r * 0.4} M ${r * 0.4} ${-r * 0.4} L ${-r * 0.4} ${r * 0.4}`} stroke={C.bone} strokeWidth={r * 0.26} strokeLinecap="round" />
    </g>
  );

/** Shared scene frame: wall, floor, slow push-in. */
const Shot: React.FC<{len: number; wall?: string; z0?: number; z1?: number; y0?: number; x1?: number; handheld?: number; children: React.ReactNode; back?: React.ReactNode}> = ({len, wall = WALL, z0 = 1.0, z1 = 1.13, y0 = 120, x1 = 0, handheld = 0, children, back}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: y0, zoom: z0, rot: 0}],
    [len, {x: x1, y: y0 - 20, zoom: z1, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={handheld}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={wall} />
          {back}
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {children}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Stickers stuck all over a counter front (local to the counter top, w x h). */
const StickerWall: React.FC<{frame: number; from: number; to: number; w?: number; n?: number}> = ({frame, from, to, w = 560, n = 12}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = -w / 2 + 75 + col * ((w - 150) / 3) + (rand(i + 40) - 0.5) * 24;
      const y = 50 + row * 62 + (rand(i + 70) - 0.5) * 12;
      return <Sticker key={i} x={x} y={y} s={0.72} color={APP_COLORS[i % APP_COLORS.length]} seed={i + 3} rot={(rand(i + 9) - 0.5) * 18} k={pop(frame, lerp(from, to, i / n))} />;
    })}
  </g>
);

/* 1 */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const who = at(0, 2);
  const beam = frame > 8 && frame < at(0, 1) + 10 ? 0.5 + 0.5 * Math.sin(t * 20) : 0;
  return (
    <Shot len={len}>
      <Counter x={210} y={FLOOR} w={380} h={190}>
        <rect x={-6} y={-60} width={12} height={60} fill={C.steel} />
        <QRCode x={0} y={-150} size={150} seed={7} frame={C.red} label="QRIS" />
      </Counter>
      <path d={`M -110 ${FLOOR - 330} L 120 ${FLOOR - 340}`} stroke={C.cyan} strokeWidth={6} strokeDasharray="10 10" opacity={beam} />
      <Stickman x={-260} y={FLOOR} scale={SCALE} pose={point(idle(t), 1, 92)} look={withPhone(BUYER, APP_COLORS[0], prog(frame, 20, 30))} expr={frame > who ? "surprised" : "happy"} />
      <g transform={`translate(0 -470) scale(${pop(frame, who) * (1 + Math.sin(t * 5) * 0.03)})`}>
        <Label x={0} y={0} text="?" size={220} color={C.yellow} />
      </g>
    </Shot>
  );
};

/* 2 */
const Wallets: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const boom = at(1, 1);
  return (
    <Shot len={len}>
      <Plate x={0} y={-500} text="2018" k={pop(frame, 4)} size={80} />
      {APP_COLORS.map((col, i) => {
        const x = -360 + i * 180;
        const y = -230 + (i % 2) * 70 + Math.sin(t * 2 + i) * 10;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${pop(frame, boom + i * 5)})`}>
            <BigPhone x={0} y={0} w={110} h={180}>
              <rect width={110} height={180} fill={col} />
              <rect x={20} y={30} width={70} height={30} rx={6} fill="#FFFFFF" opacity={0.85} />
              <circle cx={55} cy={115} r={24} fill="#FFFFFF" opacity={0.6} />
            </BigPhone>
          </g>
        );
      })}
      <Stickman x={0} y={FLOOR} scale={SCALE} pose={mix(idle(t), cheer(t), prog(frame, boom, boom + 12))} look={BUYER} expr="happy" />
    </Shot>
  );
};

/* 3 */
const NoTalk: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const own = at(2, 1);
  const no = at(2, 2);
  const xs = [-320, 0, 320];
  return (
    <Shot len={len}>
      {xs.map((x, i) => (
        <QRCode key={i} x={x} y={-330} size={170} seed={i + 11} frame={APP_COLORS[i]} k={pop(frame, own + i * 6)} />
      ))}
      <RedX x={-160} y={-330} k={pop(frame, no)} />
      <RedX x={160} y={-330} k={pop(frame, no + 6)} />
      <Stickman x={-60} y={FLOOR} scale={SCALE} pose={point(idle(t), prog(frame, no, no + 12, eOut), 120)} look={withPhone(BUYER, APP_COLORS[1])} expr={frame > no ? "worried" : "neutral"} />
      <g transform={`translate(110 ${FLOOR - 470}) scale(${pop(frame, no + 10)})`}>
        <RedX x={0} y={0} k={1} r={26} />
      </g>
    </Shot>
  );
};

/* 4 */
const Stickers: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <Shot len={len} wall={WARM} z1={1.16}>
      <Awning x={0} y={-330} w={900} />
      <Stickman x={0} y={FLOOR - 10} scale={SCALE} pose={idle(t)} look={SELLER} expr="neutral" />
      <Counter x={0} y={FLOOR} w={620} h={240}>
        <StickerWall frame={frame} from={at(3, 1) - 4} to={len - 30} w={620} n={12} />
        {[0, 1].map((i) => (
          <Sticker key={i} x={-230 + i * 460} y={-60} s={0.9} color={APP_COLORS[(i + 2) % 5]} seed={i + 30} rot={(i - 1) * 8} k={pop(frame, at(3, 2) + i * 6)} />
        ))}
      </Counter>
    </Shot>
  );
};

/* 5 */
const Confused: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const sell = at(4, 1);
  return (
    <Shot len={len} wall={WARM}>
      <Stickman x={190} y={FLOOR - 10} scale={1.3} pose={mix(idle(t), cheer(t), 0.35)} look={SELLER} expr={frame > sell ? "worried" : "neutral"} />
      <Counter x={190} y={FLOOR} w={460} h={220}>
        <StickerWall frame={1000} from={0} to={1} w={460} n={8} />
      </Counter>
      <Stickman x={-330} y={FLOOR} scale={SCALE} facing={1} pose={{...idle(t), headTilt: Math.sin(t * 3) * 8, look: 0.8}} look={withPhone(BUYER, APP_COLORS[1])} expr="worried" />
      <g transform={`translate(-330 -330) scale(${pop(frame, 6)})`}>
        <Label x={0} y={0} text="?" size={130} color={C.yellow} />
      </g>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + t * 0.8;
        return (
          <g key={i} transform={`translate(${190 + Math.cos(a) * 190} ${-380 + Math.sin(a) * 60}) scale(${pop(frame, sell + i * 5) * 0.7})`}>
            <BigPhone x={0} y={0} w={90} h={150}>
              <rect width={90} height={150} fill={APP_COLORS[i]} />
            </BigPhone>
          </g>
        );
      })}
      <Plate x={190} y={-530} text="BANYAK AKUN" k={pop(frame, sell + 20)} size={42} border={C.red} />
    </Shot>
  );
};

/* 6 */
const BankIndonesia: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const gov = at(5, 1);
  return (
    <Shot len={len} wall="#2B3442">
      <Institution x={60} y={FLOOR} s={1.05} name="BANK INDONESIA" />
      <Stickman x={-300} y={FLOOR} scale={SCALE} pose={point(idle(t), prog(frame, 10, 26, eOut), 110)} look={OFFICIAL} expr="determined" />
      <g opacity={prog(frame, gov, gov + 10)}>
        <Plate x={0} y={-540} text="PERRY WARJIYO" k={pop(frame, gov)} size={46} border={C.yellow} color={C.yellow} />
        <Label x={0} y={-450} text="GUBERNUR BI" size={36} color={C.bone} />
      </g>
    </Shot>
  );
};

/* 7 */
const Meeting: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const std = at(6, 1);
  const people: [number, Look, -1 | 1][] = [
    [-360, OFFICIAL, 1],
    [-170, {...CASUAL, top: "#5A5F78"}, 1],
    [170, {...CASUAL, top: "#6B4E5E", sleeve: "#6B4E5E"}, -1],
    [360, {...SHIRT_ORANGE}, -1],
  ];
  return (
    <Shot len={len}>
      {people.map(([x, look, f], i) => (
        <Stickman key={i} x={x} y={FLOOR} scale={1.25} facing={f} pose={idle(t, i)} look={look} expr="focused" />
      ))}
      <Desk x={0} w={420} top={150} />
      <Plate x={0} y={-520} text="BI + ASPI" k={pop(frame, 4)} size={60} />
      <QRCode x={0} y={-290} size={150} seed={7} frame={C.red} label="1 STANDAR" k={pop(frame, std)} />
    </Shot>
  );
};

/* 8 */
const Emvco: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const intl = at(7, 1);
  const link = at(7, 2);
  const g = {x: -230, y: -330, r: 130};
  return (
    <Shot len={len}>
      <g transform={`translate(${g.x} ${g.y}) scale(${pop(frame, 4)})`}>
        <circle r={g.r} fill="#1E5A7A" stroke={C.ink} strokeWidth={5} />
        <ellipse rx={g.r * 0.45} ry={g.r} fill="none" stroke={C.cyan} strokeWidth={4} transform={`scale(${Math.cos(t) * 0.3 + 0.7} 1)`} />
        <line x1={-g.r} y1={0} x2={g.r} y2={0} stroke={C.cyan} strokeWidth={4} />
        <line x1={-g.r * 0.9} y1={-60} x2={g.r * 0.9} y2={-60} stroke={C.cyan} strokeWidth={3} />
        <line x1={-g.r * 0.9} y1={60} x2={g.r * 0.9} y2={60} stroke={C.cyan} strokeWidth={3} />
      </g>
      <Plate x={-230} y={-530} text="EMVCo" k={pop(frame, intl)} size={50} border={C.cyan} />
      <QRCode x={230} y={-330} size={130} seed={7} frame={C.red} k={pop(frame, link - 10)} />
      {[0, 1, 2].map((i) => {
        const px = 120 + i * 110;
        const k = prog(frame, link + i * 6, link + i * 6 + 12);
        return (
          <g key={i} opacity={k}>
            <line x1={230} y1={-250} x2={px} y2={-120} stroke={C.olive} strokeWidth={5} />
            <BigPhone x={px} y={-80} w={60} h={96}>
              <rect width={60} height={96} fill={APP_COLORS[i]} />
            </BigPhone>
            <Tick x={px + 30} y={-130} r={18} k={k} />
          </g>
        );
      })}
      <Stickman x={-230} y={FLOOR} scale={1.3} pose={point(idle(t), 1, 150)} look={OFFICIAL} expr="happy" />
    </Shot>
  );
};

/* 9 */
const Name: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const q = at(8, 1);
  const s = at(8, 2);
  return (
    <Shot len={len} z1={1.1}>
      <Glow x={0} y={-300} r={500} color={C.red} opacity={0.12} />
      <QRCode x={60} y={-400} size={200} seed={7} frame={C.red} label="QRIS" k={pop(frame, 2)} />
      <Plate x={60} y={-170} text="QUICK RESPONSE CODE" k={pop(frame, q)} size={40} border={C.cyan} />
      <Plate x={60} y={-70} text="INDONESIAN STANDARD" k={pop(frame, s)} size={40} border={C.yellow} />
      <Stickman x={-380} y={FLOOR} scale={1.3} pose={point(idle(t), 1, 150)} look={BUYER} expr="happy" />
    </Shot>
  );
};

/* 10 */
const Trials: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const second = at(9, 1);
  const cards: [string, number][] = [
    ["2018", 4],
    ["APR 2019", second],
  ];
  return (
    <Shot len={len}>
      <Board x={-170} y={FLOOR - 200} w={520} h={340}>
        <Label x={260} y={60} text="UJI COBA" size={44} color={C.ink} />
        {cards.map(([txt, a], i) => (
          <g key={txt} transform={`translate(${140 + i * 240} 190) scale(${pop(frame, a)})`}>
            <rect x={-105} y={-60} width={210} height={120} rx={14} fill={i ? C.cyan : C.yellow} stroke={C.ink} strokeWidth={4} />
            <Label x={0} y={14} text={txt} size={38} color={C.ink} />
            <Tick x={90} y={-55} r={22} k={prog(frame, a + 14, a + 24)} />
          </g>
        ))}
      </Board>
      <Counter x={330} y={FLOOR} w={260} h={170}>
        <QRCode x={0} y={-90} size={110} seed={7} frame={C.red} />
      </Counter>
      <Stickman x={120} y={FLOOR} scale={1.25} pose={point(idle(t), 1, 85)} look={withPhone(TECH, APP_COLORS[2], prog(frame, second + 10, second + 20))} expr="focused" />
    </Shot>
  );
};

/* 11 */
const Launch: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const go = at(10, 2);
  const conf = Array.from({length: 26}, (_, i) => i);
  return (
    <Shot len={len} wall="#2B3442">
      <Flag x={-330} y={FLOOR} t={t} s={1.1} />
      <Plate x={80} y={-520} text="17 AGUSTUS 2019" k={pop(frame, 4)} size={50} border={C.red} />
      <QRCode x={80} y={-250} size={170} seed={7} frame={C.red} label="QRIS" k={pop(frame, go)} />
      {frame > go
        ? conf.map((i) => {
            const ph = (frame - go) / 60;
            const x = -450 + rand(i) * 900;
            const y = -700 + ph * (500 + rand(i + 50) * 500);
            return <rect key={i} x={x + Math.sin(ph * 6 + i) * 30} y={y} width={18} height={10} fill={[C.red, C.bone, C.yellow][i % 3]} transform={`rotate(${ph * 400 + i * 40} ${x} ${y})`} opacity={clamp(2 - ph)} />;
          })
        : null}
      <Stickman x={120} y={FLOOR} scale={SCALE} pose={mix(idle(t), cheer(t), prog(frame, go, go + 10))} look={OFFICIAL} expr="happy" />
    </Shot>
  );
};

/* 12 */
const Mandatory: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const all = at(11, 1);
  const must = at(11, 2);
  return (
    <Shot len={len}>
      <Plate x={0} y={-520} text="1 JANUARI 2020" k={pop(frame, 4)} size={52} />
      <g transform={`translate(110 -280) scale(${pop(frame, all)})`}>
        <rect x={-210} y={-150} width={420} height={300} rx={14} fill={C.bone} stroke={C.ink} strokeWidth={5} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-170} y={-110 + i * 50} width={i % 2 ? 260 : 340} height={16} rx={6} fill={C.steel} opacity={0.6} />
        ))}
        <Label x={0} y={110} text="SEMUA PEMBAYARAN QR" size={28} color={C.ink} />
      </g>
      <Stamp x={110} y={-270} text="WAJIB QRIS" k={prog(frame, must + 4, must + 14, eOut)} size={56} rot={-10} />
      <Stickman x={-330} y={FLOOR} scale={SCALE} pose={point(idle(t), prog(frame, all, all + 12, eOut), 120)} look={OFFICIAL} expr="determined" />
    </Shot>
  );
};

/* 13 */
const OneCode: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const a = at(12, 1);
  const b = at(12, 2);
  const buyers: [number, number, number][] = [
    [-380, 0, a],
    [-200, 2, a + 12],
    [380, 3, b],
  ];
  return (
    <Shot len={len} wall={WARM}>
      <Counter x={100} y={FLOOR} w={300} h={190}>
        <rect x={-6} y={-60} width={12} height={60} fill={C.steel} />
        <QRCode x={0} y={-150} size={140} seed={7} frame={C.red} label="QRIS" />
      </Counter>
      <Plate x={0} y={-520} text="SATU KODE" k={pop(frame, 6)} size={56} />
      {buyers.map(([x, ci, when], i) => {
        const ok = prog(frame, when + 10, when + 20);
        return (
          <g key={i}>
            <Stickman x={x} y={FLOOR} scale={1.2} facing={x > 100 ? -1 : 1} pose={point(idle(t, i), prog(frame, when, when + 10), 95)} look={withPhone({...CASUAL, top: ["#4E6B5A", "#5A5F78", "#6B4E5E"][i]}, APP_COLORS[ci], ok)} expr={ok > 0.5 ? "happy" : "neutral"} />
            <Tick x={x} y={FLOOR - 420} r={26} k={pop(frame, when + 14)} />
          </g>
        );
      })}
    </Shot>
  );
};

/* 14 */
const Users: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const quarter = at(13, 1);
  const cols = 10;
  const rows = 4;
  return (
    <Shot len={len}>
      <Plate x={0} y={-520} text="67 JUTA PENGGUNA" k={pop(frame, 4)} size={50} />
      {Array.from({length: cols * rows}, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const lit = r === 0 ? prog(frame, quarter + c * 2, quarter + c * 2 + 6) : 0;
        return <PersonIcon key={i} x={-405 + c * 90} y={-320 + r * 75} s={1.3} color={lit > 0.5 ? C.yellow : "#5B6470"} />;
      })}
      <Plate x={0} y={-30} text="1/4 PENDUDUK" k={pop(frame, quarter + 20)} size={44} border={C.cyan} />
      <Stickman x={0} y={FLOOR} scale={1.2} pose={mix(idle(t), cheer(t), prog(frame, quarter + 20, quarter + 30))} look={BUYER} expr="happy" />
    </Shot>
  );
};

/** A street-food cart with a parasol; base centre at (x, y). */
const Cart: React.FC<{x: number; y: number; frame: number; qrAt: number}> = ({x, y, frame, qrAt}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-4} y={-420} width={8} height={300} fill={C.steel} />
    <path d="M -170 -400 Q 0 -500 170 -400 Z" fill={C.yellow} stroke={C.ink} strokeWidth={4} />
    <rect x={-150} y={-190} width={300} height={140} rx={8} fill="#2E6B8A" stroke={C.ink} strokeWidth={5} />
    <rect x={-130} y={-260} width={260} height={70} fill="#BFE3F0" opacity={0.6} stroke={C.ink} strokeWidth={4} />
    <circle cx={-100} cy={-30} r={30} fill={C.ink} />
    <circle cx={100} cy={-30} r={30} fill={C.ink} />
    <Sticker x={0} y={-120} s={0.9} color={C.red} seed={7} k={pop(frame, qrAt)} />
  </g>
);

/* 15 */
const Merchants: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const umkm = at(14, 1);
  const small = at(14, 2);
  return (
    <Shot len={len} wall={WARM}>
      <Awning x={-250} y={-200} w={440} />
      <Stickman x={-250} y={FLOOR - 10} scale={1.2} pose={idle(t)} look={SELLER} expr="happy" />
      <Counter x={-250} y={FLOOR} w={380} h={190}>
        <Sticker x={0} y={80} s={1.1} color={C.red} seed={7} k={pop(frame, small)} />
      </Counter>
      <Cart x={230} y={FLOOR} frame={frame} qrAt={small + 8} />
      <Stickman x={400} y={FLOOR} scale={1.15} facing={-1} pose={idle(t, 3)} look={{...CASUAL, top: "#8A5A3A"}} expr="happy" />
      <Plate x={0} y={-520} text="45 JUTA MERCHANT" k={pop(frame, 4)} size={48} />
      <Plate x={0} y={-410} text="HAMPIR SEMUA UMKM" k={pop(frame, umkm)} size={40} border={C.cyan} />
    </Shot>
  );
};

/* 16 */
const Abroad: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const a = at(15, 1);
  const b = at(15, 2);
  const names: [string, number, number, number][] = [
    ["MALAYSIA", -200, -520, a],
    ["SINGAPURA", 200, -520, a + 12],
    ["THAILAND", -200, -400, b],
    ["KOREA SELATAN", 200, -400, b + 14],
  ];
  return (
    <Shot len={len} wall="#24344A">
      {names.map(([n, x, y, w]) => (
        <Plate key={n} x={x} y={y} text={n} k={pop(frame, w)} w={370} size={36} border={C.cyan} />
      ))}
      {/* a plane crossing */}
      <g transform={`translate(${lerp(-700, 700, (t * 0.12) % 1)} -230)`} opacity={0.8}>
        <path d="M -60 0 L 60 0 L 80 -10 L 60 -16 L -40 -16 Z M -10 -14 L 20 -50 L 34 -50 L 20 -14 Z M -10 0 L 20 30 L 34 30 L 20 0 Z" fill={C.bone} stroke={C.ink} strokeWidth={3} />
      </g>
      <Suitcase x={-360} y={FLOOR} s={1.2} />
      <Stickman x={-180} y={FLOOR} scale={SCALE} pose={point(idle(t), 1, 92)} look={withPhone({...CASUAL, top: "#3E6E8E"}, APP_COLORS[2], prog(frame, b + 20, b + 30))} expr="happy" />
      <Counter x={250} y={FLOOR} w={300} h={180}>
        <rect x={-6} y={-60} width={12} height={60} fill={C.steel} />
        <QRCode x={0} y={-140} size={130} seed={19} frame={C.olive} />
      </Counter>
    </Shot>
  );
};

/* 17 */
const Shared: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const std = at(16, 1);
  const once = at(16, 2);
  return (
    <Shot len={len}>
      <Glow x={0} y={-320} r={520} color={C.yellow} opacity={0.12} />
      {APP_COLORS.map((col, i) => {
        const a = (i / APP_COLORS.length) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * 300;
        const py = -320 + Math.sin(a) * 190;
        const k = prog(frame, std + i * 3, std + i * 3 + 10);
        return (
          <g key={i} opacity={k}>
            <line x1={0} y1={-320} x2={px} y2={py} stroke={col} strokeWidth={6} />
            <BigPhone x={px} y={py} w={64} h={104}>
              <rect width={64} height={104} fill={col} />
            </BigPhone>
          </g>
        );
      })}
      <QRCode x={0} y={-320} size={150} seed={7} frame={C.red} label="QRIS" k={pop(frame, 4)} />
      <Plate x={0} y={-40} text="SEKALI SCAN" k={pop(frame, once)} size={50} border={C.olive} />
      {[-320, 0, 320].map((x, i) => (
        <Stickman key={i} x={x} y={FLOOR} scale={1.2} pose={mix(idle(t, i), cheer(t, i), prog(frame, once, once + 12))} look={[BUYER, SELLER, OFFICIAL][i]} expr="happy" />
      ))}
    </Shot>
  );
};

/* 18 */
const Outro: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const past = at(17, 1);
  const k = prog(frame, past - 4, past + 12, eInOut);
  return (
    <Shot len={len} wall={WARM} z0={1.04} z1={1.14}>
      <g opacity={lerp(1, 0.55, k)}>
        <Label x={-250} y={-170} text="DULU" size={60} color={C.bone} />
        <Counter x={-250} y={FLOOR} w={330} h={220}>
          <StickerWall frame={1000} from={0} to={1} w={330} n={8} />
        </Counter>
      </g>
      <g opacity={lerp(0.55, 1, k)}>
        <Label x={250} y={-170} text="SEKARANG" size={60} color={C.yellow} />
        <Counter x={250} y={FLOOR} w={330} h={220}>
          <QRCode x={0} y={110} size={130} seed={7} frame={C.red} />
        </Counter>
      </g>
      <Stickman x={0} y={FLOOR} scale={1.3} pose={mix(idle(t), cheer(t), prog(frame, len - 70, len - 55))} look={BUYER} expr="happy" />
    </Shot>
  );
};

const SCENES = [Hook, Wallets, NoTalk, Stickers, Confused, BankIndonesia, Meeting, Emvco, Name, Trials, Launch, Mandatory, OneCode, Users, Merchants, Abroad, Shared, Outro];

const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "whip", "zoom", "whip", "zoom", "whip", "zoom", "whip", "zoom", "whip", "zoom", "whip", "zoom", "fade"];

export const AsalQris: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={Q_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={Q_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={Q_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
