import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Label, Monitor, OfficeChair, Wall} from "../environment/Furniture";
import {Coin, Tick} from "../environment/MoneyProps";
import {Banknote, BookStack, CashStack, CourseScreen, EmptyWallet, FancyMeal, Gadget, GrowthChart, ItemTag, Laptop, Sneaker, WorkScreen} from "../environment/SpendProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, mix, typing} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pt, Stickman} from "../rig/Stickman";
import {C, FONT, FPS} from "../styles/palette";
import {CUES as U_CUES, SCENES as U_SCENES} from "./uangTiming";

/*
 * MEREKA MENGGUNAKAN UANG DENGAN CARA BERBEDA — six scenes plus a closing card (about 65 s).
 *   1. Both get Rp1 juta; a month later one has nothing, the other has a new asset
 *   2. Person 1 spends it all on shoes, a gadget, fancy food (balance runs down to zero)
 *   3. Person 2 spends part of it on books, a course and work tools (balance keeps a remainder)
 *   4. Person 1: instant fun, then the fun and the money are gone
 *   5. Person 2: not cool today, but the investment slowly brings clients and income
 *   6. Side by side: same money, different choices; then the ending text
 * Scene lengths and caption cues come from uangTiming.ts (written by scripts/make_narration.py).
 */

export {FRAMES as UANG_FRAMES} from "./uangTiming";

const FIRST = [0, 4, 8, 12, 16, 20];
const at = (i: number, j: number) => U_CUES[FIRST[i] + j].from - U_SCENES[i].from;

const A: Look = SHIRT_ORANGE;
const B: Look = JACKET_BLUE;
const WALL = "#26303A";
const GOOD = "#5E9347";

const pop = (frame: number, a: number) => {
  const k = clamp((frame - a) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

const rupiah = (n: number) => "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const Plate: React.FC<{x: number; y: number; text: string; k: number; size?: number; color?: string; border?: string; w?: number}> = ({x, y, text, k, size = 48, color = C.bone, border = C.yellow, w}) => {
  if (k <= 0) return null;
  const ww = w ?? text.length * size * 0.66 + size * 1.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-ww / 2} y={-size * 0.95} width={ww} height={size * 1.7} rx={size * 0.3} fill={C.charcoal} stroke={border} strokeWidth={6} />
      <Label x={0} y={size * 0.3} text={text} size={size} color={color} />
    </g>
  );
};

/** Balance read-out that steps down at the given frames. */
const Balance: React.FC<{x: number; y: number; frame: number; steps: [number, number][]; start?: number; k?: number}> = ({x, y, frame, steps, start = 1000000, k = 1}) => {
  let v = start;
  let prev = start;
  let flash = 0;
  for (const [f, val] of steps) {
    const kk = prog(frame, f, f + 14, eOut);
    if (kk > 0) {
      v = lerp(prev, val, kk);
      flash = 1 - prog(frame, f + 6, f + 26);
    }
    prev = val;
  }
  const low = v < 100000;
  return (
    <Plate x={x} y={y} text={`SALDO ${rupiah(Math.round(v / 1000) * 1000)}`} k={k} size={44} border={low ? C.red : flash > 0 ? C.orange : C.yellow} color={low ? C.red : C.bone} w={560} />
  );
};

const Shot: React.FC<{len: number; wall?: string; z0?: number; z1?: number; handheld?: number; grey?: number; children: React.ReactNode}> = ({len, wall = WALL, z0 = 1.0, z1 = 1.13, handheld = 0, grey = 0, children}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: z0, rot: 0}],
    [len, {x: 0, y: 100, zoom: z1, rot: 0}],
  ]);
  return (
    <AbsoluteFill style={{filter: grey > 0 ? `saturate(${1 - grey * 0.8}) brightness(${1 - grey * 0.25})` : undefined}}>
      <Camera2D cam={cam} t={t} handheld={handheld}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={wall} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {children}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** A small red toolbox with a wrench on top. Base centre at (x, y). */
const Toolbox: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -40 -80 L -40 -100 L 40 -100 L 40 -80" fill="none" stroke={C.ink} strokeWidth={8} />
    <rect x={-80} y={-80} width={160} height={80} rx={8} fill={C.red} stroke={C.ink} strokeWidth={4} />
    <line x1={-80} y1={-52} x2={80} y2={-52} stroke={C.ink} strokeWidth={4} />
    <rect x={-12} y={-60} width={24} height={14} rx={3} fill={C.steel} stroke={C.ink} strokeWidth={3} />
  </g>
);

/* 1 — Both get Rp1 juta; a month later, different results. */
const Start: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const month = at(0, 1);
  const zero = at(0, 2);
  const asset = at(0, 3);
  const goneK = prog(frame, zero, zero + 14);
  return (
    <Shot len={len}>
      <line x1={0} y1={-700} x2={0} y2={FLOOR} stroke={C.steel} strokeWidth={4} strokeDasharray="16 14" opacity={0.6} />
      <Label x={-270} y={FLOOR - 450} text="ORANG 1" size={30} color={C.orange} />
      <Label x={270} y={FLOOR - 450} text="ORANG 2" size={30} color={C.cyan} />
      <Stickman x={-270} y={FLOOR} scale={1.3} pose={mix(cheer(t), idle(t), goneK)} look={A} expr={goneK > 0.5 ? "sad" : "happy"} />
      <Stickman x={270} y={FLOOR} scale={1.3} pose={mix(idle(t, 2), cheer(t, 2), frame < month ? 1 : prog(frame, asset, asset + 12))} look={B} expr="happy" />
      {/* the money */}
      <g opacity={1 - goneK}>
        <CashStack x={-270} y={-300} n={6} s={1.1} />
      </g>
      <CashStack x={270} y={-300} n={6} s={1.1} />
      <Plate x={-270} y={-430} text={goneK > 0.5 ? "Rp0" : "Rp1 JUTA"} k={pop(frame, 4)} size={42} w={290} border={goneK > 0.5 ? C.red : C.yellow} color={goneK > 0.5 ? C.red : C.bone} />
      <Plate x={270} y={-430} text="Rp1 JUTA" k={pop(frame, 8)} size={42} w={290} />
      <Plate x={0} y={-570} text="SEBULAN KEMUDIAN" k={pop(frame, month)} size={44} border={C.cyan} />
      <g transform={`translate(420 ${FLOOR}) scale(${pop(frame, asset)})`}>
        <Laptop x={0} y={0} s={0.8} screen={<WorkScreen t={t} />} />
      </g>
      <Plate x={270} y={-200} text="ASET BARU" k={pop(frame, asset + 6)} size={38} border={GOOD} w={280} />
    </Shot>
  );
};

/* 2 — Person 1 spends it all. */
const Spend: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const c1 = at(1, 1);
  const c2 = at(1, 2);
  const c3 = at(1, 3);
  const items: [number, number][] = [
    [-300, c1],
    [0, c2],
    [300, c3],
  ];
  return (
    <Shot len={len} wall="#3A2A2E">
      <Glow x={0} y={-200} r={600} color={C.orange} opacity={0.12} />
      <Balance x={0} y={-560} frame={frame} steps={[[c1, 600000], [c2, 250000], [c3, 0]]} />
      <g transform={`translate(-300 -260) scale(${pop(frame, c1)})`}>
        <Sneaker x={0} y={0} s={1.2} />
      </g>
      <g transform={`translate(0 -230) scale(${pop(frame, c2)})`}>
        <Gadget x={0} y={0} s={1.1} />
      </g>
      <g transform={`translate(300 -250) scale(${pop(frame, c3)})`}>
        <FancyMeal x={0} y={0} s={1.1} t={t} />
      </g>
      <ItemTag x={-300} y={-180} text="SEPATU" k={pop(frame, c1 + 6)} />
      <ItemTag x={0} y={-180} text="GADGET" k={pop(frame, c2 + 6)} />
      <ItemTag x={300} y={-180} text="MAKAN MEWAH" k={pop(frame, c3 + 6)} />
      {/* notes flying out to each item */}
      {items.map(([x, a], i) =>
        [0, 1, 2].map((j) => {
          const k = prog(frame, a - 6 + j * 4, a + 14 + j * 4, eInOut);
          if (k <= 0 || k >= 1) return null;
          return <Banknote key={`${i}-${j}`} x={lerp(0, x, k)} y={lerp(-40, -260, k) - Math.sin(k * Math.PI) * 120} s={0.6} rot={k * 360 + j * 30} />;
        }),
      )}
      <Stickman x={0} y={FLOOR} scale={1.35} pose={cheer(t)} look={A} expr="happy" />
    </Shot>
  );
};

/* 3 — Person 2 invests part of it. */
const Invest: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const c1 = at(2, 1);
  const c2 = at(2, 2);
  const c3 = at(2, 3);
  return (
    <Shot len={len} wall="#22303A">
      <Glow x={0} y={-200} r={600} color={C.cyan} opacity={0.1} />
      <Balance x={0} y={-560} frame={frame} steps={[[c1, 800000], [c2, 600000], [c3, 400000]]} />
      <g transform={`translate(-300 -230) scale(${pop(frame, c1)})`}>
        <BookStack x={0} y={0} n={4} />
      </g>
      <g transform={`translate(0 -230) scale(${pop(frame, c2)})`}>
        <Laptop x={0} y={0} s={1.0} screen={<CourseScreen />} />
      </g>
      <g transform={`translate(300 -230) scale(${pop(frame, c3)})`}>
        <Toolbox x={0} y={0} s={1.0} />
      </g>
      <ItemTag x={-300} y={-170} text="BUKU" k={pop(frame, c1 + 6)} color={C.cyan} />
      <ItemTag x={0} y={-170} text="KURSUS" k={pop(frame, c2 + 6)} color={C.cyan} />
      <ItemTag x={300} y={-170} text="ALAT KERJA" k={pop(frame, c3 + 6)} color={C.cyan} />
      <Stickman x={0} y={FLOOR} scale={1.35} pose={{...idle(t), shR: 70, elR: 30}} look={B} expr="focused" />
    </Shot>
  );
};

/* 4 — Person 1: instant fun, then it fades and the money is gone. */
const Fade: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const lost = at(3, 2);
  const broke = at(3, 3);
  const g = prog(frame, lost, lost + 20);
  const sad = prog(frame, lost, lost + 16);
  const base = idle(t);
  const slump = {...base, lean: 14, headTilt: 16, shL: 4, shR: 8, lookY: 0.6};
  return (
    <Shot len={len} grey={g} handheld={g * 0.8} wall="#3A2A2E">
      {/* sparkles while it's fun */}
      {[[-300, -420], [260, -460], [-140, -560], [330, -300]].map(([x, y], i) => (
        <path key={i} d="M 0 -22 L 6 -6 L 22 0 L 6 6 L 0 22 L -6 6 L -22 0 L -6 -6 Z" fill={C.yellow} transform={`translate(${x} ${y}) scale(${(1 - g) * (1 + Math.sin(t * 7 + i) * 0.25) * 1.4})`} />
      ))}
      <Sneaker x={-300} y={FLOOR} s={1.1} worn={g} />
      <Gadget x={-140} y={FLOOR} s={0.9} cracked={g} />
      <FancyMeal x={300} y={FLOOR - 4} s={1.0} t={t} gone={g} />
      <Plate x={0} y={-520} text="SENANG SESAAT" k={pop(frame, 6) * (1 - prog(frame, lost - 4, lost + 4))} size={46} border={C.orange} />
      <Stickman x={60} y={FLOOR} scale={1.4} pose={mix(cheer(t), slump, sad)} look={A} expr={sad > 0.5 ? "sad" : "happy"} />
      <g transform={`translate(0 -330) scale(${pop(frame, broke)})`}>
        <EmptyWallet x={0} y={0} s={1.3} />
      </g>
      <Plate x={0} y={-520} text="Rp0" k={pop(frame, broke + 6)} size={64} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 5 — Person 2: quiet work, then clients and income. */
const Grow: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const slow = at(4, 2);
  const chance = at(4, 3);
  const chair = {x: -330, floorY: FLOOR, facing: 1 as const, seat: 87};
  const seat = seatedAnchor(chair, 1.3);
  const desk = {x: -110, w: 340, top: 150};
  const keyY = FLOOR - desk.top - 6;
  const keyL: Pt = {x: -190, y: keyY};
  const keyR: Pt = {x: -160, y: keyY};
  const chartK = prog(frame, slow, len - 30, eInOut);
  return (
    <Shot len={len} wall="#22303A">
      <OfficeChair x={chair.x} y={chair.floorY} facing={chair.facing} seat={chair.seat} />
      <Desk x={desk.x} w={desk.w} top={desk.top} />
      <Monitor x={-70} y={FLOOR - desk.top - 38} w={200} h={130} screen={<WorkScreen t={t} />} />
      <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={1.3} pose={typing(t)} look={B} expr="focused" footL={seat.footL} footR={seat.footR} reachL={keyL} reachR={keyR} />
      <g opacity={prog(frame, slow, slow + 12)}>
        <GrowthChart x={40} y={-260} k={chartK} s={1.05} />
        <Label x={210} y={-570} text="PENGHASILAN" size={34} color={C.yellow} />
      </g>
      {[0, 1].map((i) => {
        const a = chance + i * 14;
        const x = 250 + i * 150;
        return (
          <g key={i} opacity={prog(frame, a, a + 10)}>
            <Stickman x={x} y={FLOOR} scale={1.0} facing={-1} pose={idle(t, i + 5)} look={{...CASUAL, top: ["#5A5F78", "#6B4E5E"][i]}} expr="happy" />
            <Tick x={x} y={FLOOR - 340} r={24} k={pop(frame, a + 8)} />
          </g>
        );
      })}
      <Plate x={320} y={-120} text="KLIEN BARU" k={pop(frame, chance + 10)} size={34} border={GOOD} w={280} />
      {frame > chance + 20
        ? [0, 1, 2, 3].map((i) => {
            const ph = ((frame - chance - 20) / 40 + i / 4) % 1;
            return <Coin key={i} x={lerp(300, -200, ph)} y={lerp(80, -60, ph) - Math.sin(ph * Math.PI) * 140} r={22} spin={t * 6 + i} opacity={Math.sin(ph * Math.PI)} />;
          })
        : null}
    </Shot>
  );
};

/* 6 — Side by side; then the closing text. */
const Compare: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const what = at(5, 2);
  const endAt = U_CUES[U_CUES.length - 1].to - U_SCENES[5].from + 8;
  const card = prog(frame, endAt, endAt + 18);
  const line2 = prog(frame, endAt + 40, endAt + 58);
  const base = idle(t);
  return (
    <AbsoluteFill>
      <Shot len={len} z1={1.1}>
        <line x1={0} y1={-700} x2={0} y2={FLOOR} stroke={C.steel} strokeWidth={4} strokeDasharray="16 14" opacity={0.6} />
        <g style={{filter: "saturate(0.3)"}}>
          <Stickman x={-270} y={FLOOR} scale={1.3} pose={{...base, lean: 12, headTilt: 14, shL: 4, shR: 8}} look={A} expr="sad" />
          <EmptyWallet x={-400} y={FLOOR - 60} s={0.8} />
          <Sneaker x={-150} y={FLOOR} s={0.7} worn={1} />
        </g>
        <Stickman x={240} y={FLOOR} scale={1.3} pose={cheer(t)} look={B} expr="happy" />
        <Laptop x={420} y={FLOOR} s={0.7} screen={<WorkScreen t={t} />} />
        <GrowthChart x={150} y={-180} k={1} s={0.6} />
        <Plate x={0} y={-560} text="SAMA-SAMA Rp1 JUTA" k={pop(frame, 6)} size={42} />
        <Plate x={-270} y={-420} text="KESENANGAN" k={pop(frame, what)} size={34} border={C.red} w={290} />
        <Plate x={270} y={-420} text="KEMAMPUAN" k={pop(frame, what + 10)} size={34} border={GOOD} w={290} />
      </Shot>
      {/* ending text */}
      <AbsoluteFill style={{background: `rgba(10,11,13,${0.9 * card})`, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 70, padding: "0 90px"}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 78, lineHeight: 1.15, color: C.bone, textAlign: "center", opacity: card, transform: `translateY(${(1 - card) * 30}px)`, marginTop: -260}}>
          Jangan hanya membeli kesenangan.
        </div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 78, lineHeight: 1.15, color: C.yellow, textAlign: "center", opacity: line2, transform: `translateY(${(1 - line2) * 30}px)`}}>
          Beli kemampuan menciptakan uang.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENES = [Start, Spend, Invest, Fade, Grow, Compare];
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "fade"];

export const DuaCaraUang: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={U_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={U_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={U_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
