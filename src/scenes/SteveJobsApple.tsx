import React from "react";
import {AbsoluteFill} from "remotion";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {FLOOR, Glow, Label, Desk} from "../environment/Furniture";
import {SideChair} from "../environment/FamilyProps";
import {Tick} from "../environment/MoneyProps";
import {Cross} from "../environment/CallProps";
import {Calendar} from "../environment/StoryProps";
import {Banknote, GrowthChart} from "../environment/SpendProps";
import {
  AppPhone, Bolt, BoardGrid, Building, CardBox, CircuitBoard, ColorPC, Crown, GarageDoor, JOBS, JOBS_YOUNG, LossChart,
  MusicPlayer, Note, OilBarrel, RIVAL, Sparks, SUIT, SUIT2, SUIT3, WOZ, staff,
} from "../environment/JobsProps";
import {eInOut, eOut, lerp, prog} from "../motion/ease";
import {cheer, idle, mix, point, STRIDE, walk} from "../rig/poses";
import {Actor, EndCard, Film, Flash, Plate as KitPlate, pop, Shot as KitShot, ShotProps, slumped, useScene} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as J_CUES, SCENES as J_SCENES} from "./jobsTiming";

/*
 * STEVE JOBS DAN APPLE — a 13-scene history film (about 95 s). Facts and sources: scripts/narasi/jobs-copy.md.
 *   1  Hook      Jobs pushed out (box of belongings, boss pointing), then back, cheering
 *   2  1976      garage, Jobs + Wozniak at a bench with a circuit board
 *   3  Apple I   the board, a price, a shop's order of 50
 *   4  1980      the company goes public: chart, employees become millionaires
 *   5  Sculley   Jobs hires a soda-company executive as CEO; they clash
 *   6  1985      the board sides with Sculley; Jobs leaves with a box and starts NeXT
 *   7  1997      Apple in trouble: tilting building, red loss chart
 *   8  Return    NeXT bought, Jobs back; handshake with the old rival, who invests 150 million
 *   9  iMac      focus on simple products; five coloured computers; profit again
 *   10 iPod      2001 music player (1,000 songs), 2007 phone
 *   11 2011      Apple's bar passes the oil company's: most valuable company
 *   12 Farewell  the CEO role handed over; 5 October; an empty chair (nothing is drawn of the death)
 *   13 End       garage to tower, the up-and-down path, the closing question and card
 * Scene lengths and caption cues come from jobsTiming.ts (written by scripts/make_narration.py).
 * No logos: devices are generic shapes, brand names appear only as text.
 */

export {FRAMES as JOBS_FRAMES} from "./jobsTiming";

const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={46} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall="#26303A" {...p} />;
const GOOD = "#5E9347";

/** Walks from a to b between frames f0 and f1 (feet do not skate), idle otherwise. */
const stroll = (frame: number, t: number, a: number, b: number, f0: number, f1: number, s: number, seed = 0) => {
  const k = prog(frame, f0, f1, (v) => v);
  const dist = Math.abs(b - a) * k;
  const moving = k > 0 && k < 1;
  return {x: lerp(a, b, k), pose: moving ? walk(dist / (STRIDE * s), t, seed) : idle(t, seed), moving};
};

/* 1 — Hook: pushed out, then back */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c2 = cueAt(2);
  const back = prog(frame, c2, c2 + 14);
  const home = back > 0.5;
  return (
    <Shot len={len} z1={1.08}>
      <Glow x={330} y={-100} r={520} color={C.yellow} opacity={0.06 + 0.16 * back} />
      <Building x={340} y={FLOOR} w={260} h={440} name="APPLE" lit={0.3 + 0.6 * back} />
      <CardBox x={-400} y={FLOOR - 44} s={1.0} />
      <Actor x={90} y={FLOOR} scale={1.3} facing={-1} pose={point(idle(t, 3), 1)} look={SUIT} expr="neutral" opacity={1 - back} />
      <Actor x={-210} y={FLOOR} scale={1.35} facing={home ? 1 : -1} pose={home ? cheer(t) : slumped(t)} look={JOBS} expr={home ? "happy" : "sad"} />
      <Sparks x={-120} y={-120} k={prog(frame, c2 + 2, c2 + 26)} r={150} />
      <Plate x={0} y={-540} text="DISINGKIRKAN" k={pop(frame, -10) * (1 - prog(frame, c2 - 4, c2))} size={58} border={C.red} color={C.bone} />
      <Plate x={0} y={-540} text="LALU KEMBALI!" k={pop(frame, c2 + 2)} size={58} border={GOOD} />
    </Shot>
  );
};

/* 2 — 1976: the garage */
const Garage: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const work = {...idle(t), shR: 62, elR: 18, shL: 30, elL: 30, lean: 8, look: 0.5, lookY: 0.4};
  return (
    <Shot len={len} wall="#2A2D33" z1={1.08}>
      <GarageDoor x={0} y={FLOOR} w={820} h={470} />
      <Actor x={-250} y={FLOOR} scale={1.3} pose={{...work, shR: 62 + Math.sin(t * 9) * 4}} look={JOBS_YOUNG} expr="focused" />
      <Actor x={250} y={FLOOR} scale={1.3} facing={-1} pose={{...work, shR: 58 + Math.sin(t * 9 + 2) * 4}} look={WOZ} expr="focused" />
      <Desk x={0} w={360} top={150} />
      <CircuitBoard x={0} y={FLOOR - 150 - 74} s={0.9} glow={prog(frame, c1, c1 + 10)} />
      <Sparks x={0} y={FLOOR - 250} k={prog(frame, c1 + 4, c1 + 24)} r={100} />
      <Plate x={0} y={-540} text="1976" k={pop(frame, -10)} size={72} />
      <Plate x={0} y={-410} text="JOBS + WOZNIAK" k={pop(frame, c1)} size={46} border={C.cyan} />
      <Plate x={0} y={-130} text="GARASI" k={pop(frame, c2)} size={54} border={C.orange} />
    </Shot>
  );
};

/* 3 — Apple I: the board, the price, the order of fifty */
const FirstSale: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const grid = prog(frame, c2, c2 + 70, (v) => v);
  const single = 1 - prog(frame, c2 - 2, c2 + 10);
  return (
    <Shot len={len} wall="#22303A" z1={1.08}>
      <Glow x={0} y={-120} r={520} color={C.yellow} opacity={0.08} />
      <CircuitBoard x={0} y={-140} s={1.7 * pop(frame, c0 - 6) * single} glow={prog(frame, c1, c1 + 8)} />
      <BoardGrid x={0} y={-180} k={grid} cols={10} rows={5} cw={58} ch={44} />
      <Actor x={-360} y={FLOOR} scale={1.2} pose={point(idle(t, 1), prog(frame, c0, c0 + 12))} look={JOBS_YOUNG} expr="happy" />
      <Actor x={360} y={FLOOR} scale={1.2} facing={-1} pose={frame > c2 ? cheer(t, 2) : idle(t, 2)} look={WOZ} expr="happy" />
      <Plate x={0} y={-560} text="KOMPUTER PERTAMA" k={pop(frame, c0 - 8)} size={44} border={C.cyan} />
      <Plate x={0} y={60} text="US$ 666" k={pop(frame, c1)} size={72} border={C.yellow} color={C.yellow} />
      <Plate x={0} y={190} text="PESANAN 50 UNIT" k={pop(frame, c2 + 6)} size={50} border={GOOD} />
    </Shot>
  );
};

/* 4 — 1980: the company goes public */
const Ipo: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const cheerK = prog(frame, c2, c2 + 8);
  const shirts = ["#5E7AA8", "#B5524A", "#5E9347"];
  return (
    <Shot len={len} wall="#242A31" z1={1.06}>
      <Plate x={0} y={-570} text="AKHIR 1980" k={pop(frame, -10)} size={60} />
      <Plate x={-190} y={-440} text="IPO: JUAL SAHAM" k={pop(frame, c1 + 2)} size={44} border={C.cyan} />
      <GrowthChart x={-420} y={140} k={prog(frame, c1, c1 + 50, eInOut)} s={1.15} />
      {shirts.map((s, i) => (
        <Actor key={i} x={150 + i * 130} y={FLOOR} scale={1.05} facing={-1} pose={mix(idle(t, i + 1), cheer(t, i), cheerK)} look={staff(s)} expr={cheerK > 0.5 ? "happy" : "neutral"} />
      ))}
      {frame > c2
        ? Array.from({length: 12}).map((_, i) => {
            const ph = ((frame - c2) / 46 + i / 12) % 1;
            return <Banknote key={i} x={110 + ((i * 53) % 340)} y={lerp(-420, 200, ph)} s={0.7} rot={Math.sin(ph * 6 + i) * 25} opacity={Math.min(1, (frame - c2) / 6)} />;
          })
        : null}
      <Plate x={280} y={-300} text="JUTAWAN BARU" k={pop(frame, c2 + 4)} size={42} border={GOOD} />
    </Shot>
  );
};

/* 5 — Sculley: hired, then the clash */
const Sculley: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const walkIn = stroll(frame, t, 520, 190, 0, 26, 1.3, 4);
  const fight = prog(frame, c2, c2 + 10);
  const shake = Math.sin(t * 38) * 3 * fight;
  return (
    <Shot len={len} wall={fight > 0.2 ? "#33262A" : "#26303A"} z1={1.08} handheld={fight}>
      <Glow x={0} y={-150} r={520} color={C.red} opacity={0.16 * fight} />
      <Actor x={-250 + shake} y={FLOOR} scale={1.3} facing={1} pose={mix(idle(t, 2), {...idle(t, 2), shR: 80, elR: 20, lean: 6}, fight)} look={JOBS} expr={fight > 0.4 ? "shout" : "calm"} />
      <Actor x={walkIn.x - shake} y={FLOOR} scale={1.3} facing={-1} pose={mix(walkIn.pose, {...idle(t, 4), shR: 80, elR: 20, lean: 6}, fight)} look={SUIT} expr={fight > 0.4 ? "shout" : "smug"} />
      {/* a plain soda can */}
      <g transform={`translate(${walkIn.x + 10} -360) scale(${pop(frame, c0 - 4) * (1 - prog(frame, c1 - 4, c1))})`}>
        <rect x={-30} y={-48} width={60} height={96} rx={10} fill="#3B6FB0" stroke={C.ink} strokeWidth={5} />
        <rect x={-30} y={-14} width={60} height={28} fill={C.bone} />
        <Label x={0} y={8} text="SODA" size={20} color={C.ink} />
      </g>
      <Plate x={0} y={-570} text="JOHN SCULLEY" k={pop(frame, c0 - 8)} size={50} border={C.orange} />
      <g transform={`translate(190 -270)`}>
        <Crown x={0} y={0} s={pop(frame, c1) * 0.9} />
      </g>
      <Plate x={190} y={-110} text="BOS BARU" k={pop(frame, c1 + 4)} size={36} border={C.yellow} />
      <Bolt x={-30} y={-120} s={1.5} k={pop(frame, c2)} />
      <Sparks x={-30} y={-120} k={prog(frame, c2 + 2, c2 + 24)} r={140} color={C.red} />
    </Shot>
  );
};

/* 6 — 1985: the board sides with Sculley; Jobs leaves and starts NeXT */
const Leave: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const going = stroll(frame, t, -80, -220, c1 + 6, c2 - 2, 1.3, 1);
  const boxK = pop(frame, c1 + 2);
  const nextK = pop(frame, c2);
  const turned = frame >= c1 + 4;
  const board: [number, typeof SUIT][] = [[150, SUIT], [280, SUIT2], [410, SUIT3]];
  return (
    <Shot len={len} wall="#2A2427" z1={1.06}>
      {board.map(([x, look], i) => (
        <g key={i}>
          <Actor x={x} y={FLOOR} scale={1.15} facing={-1} pose={{...idle(t, i + 2), shL: 10, elL: 100, shR: -10, elR: 100}} look={look} expr="neutral" />
          <Tick x={x} y={FLOOR - 410} r={26} k={pop(frame, c0 + i * 6)} />
        </g>
      ))}
      <Plate x={280} y={-250} text="DEWAN DIREKSI" k={pop(frame, c0 - 6)} size={40} border={C.cyan} />
      <Actor x={going.x} y={FLOOR} scale={1.3} facing={turned ? -1 : 1} pose={turned ? mix(going.pose, {...going.pose, lean: 14, headTilt: 16, shL: 4, shR: 8}, going.moving ? 0.5 : 1) : slumped(t)} look={JOBS} expr="sad" />
      {turned ? <CardBox x={going.x + 70} y={FLOOR - 44} s={boxK} /> : null}
      <Building x={-460} y={FLOOR} w={150} h={290} name="NeXT" color="#44505E" lit={0.5} />
      <g opacity={nextK}>
        <Sparks x={-460} y={-60} k={prog(frame, c2 + 2, c2 + 24)} r={110} />
      </g>
      <Plate x={-170} y={-590} text="1985" k={pop(frame, c1)} size={72} border={C.red} />
      <Plate x={-220} y={-410} text="MENDIRIKAN NeXT" k={nextK} size={40} border={GOOD} />
    </Shot>
  );
};

/* 7 — 1997: the company in trouble */
const Trouble: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const lean = prog(frame, c0, c0 + 30) * -6;
  const loss = prog(frame, c2, c2 + 40, eInOut);
  return (
    <Shot len={len} wall="#2A2427" grey={prog(frame, 0, len, (v) => v) * 0.5} z1={1.08}>
      <Building x={-300} y={FLOOR} w={250} h={420} name="APPLE" lit={0.15} tilt={lean} />
      <Cross x={-300} y={FLOOR - 220} r={50} k={pop(frame, c0 + 14)} />
      <Actor x={-30} y={FLOOR} scale={1.1} pose={slumped(t, 3)} look={staff("#5E7AA8")} expr="sad" />
      <LossChart x={80} y={-150} k={loss} s={0.95} />
      <Plate x={0} y={-570} text="TANPA JOBS: GOYAH" k={pop(frame, c0 - 8)} size={46} border={C.red} />
      <Plate x={0} y={-410} text="1997" k={pop(frame, c1)} size={72} />
      <Plate x={290} y={250} text="RUGI US$ 1 MILIAR" k={pop(frame, c2 + 4)} size={40} border={C.red} color={C.red} />
      <Plate x={290} y={340} text="NYARIS BANGKRUT" k={pop(frame, c2 + 22)} size={38} border={C.red} />
    </Shot>
  );
};

/* 8 — Return: NeXT is bought, Jobs is back, the rival invests */
const Return: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const slide = prog(frame, c0 + 4, c0 + 36, eInOut);
  const handsOn = prog(frame, c1 + 8, c1 + 22);
  const jobs = stroll(frame, t, -380, -130, c0 + 4, c0 + 40, 1.3, 2);
  const buildingsOut = 1 - prog(frame, c1 - 2, c1 + 8);
  const rival = stroll(frame, t, 560, 130, c1 - 4, c1 + 22, 1.3, 5);
  const reach = {...idle(t), shR: 82, elR: 10, lean: 3};
  return (
    <Shot len={len} wall="#26303A" z1={1.08}>
      <Flash frame={frame} at={[c0 + 2]} strength={0.4} />
      <g opacity={buildingsOut}>
        <Building x={lerp(-430, 230, slide)} y={FLOOR} w={150} h={290} name="NeXT" color="#44505E" lit={0.5} />
        <Building x={380} y={FLOOR} w={250} h={420} name="APPLE" lit={0.3 + 0.5 * slide} />
      </g>
      <Actor x={jobs.x} y={FLOOR} scale={1.3} pose={frame >= c1 + 8 ? mix(jobs.pose, reach, handsOn) : jobs.pose} look={JOBS} expr={frame >= c0 + 40 ? "determined" : "neutral"} />
      <Actor x={rival.x} y={FLOOR} scale={1.3} facing={-1} pose={frame >= c1 + 8 ? mix(rival.pose, reach, handsOn) : rival.pose} look={RIVAL} expr="calm" opacity={prog(frame, c1 - 4, c1 + 4)} />
      <Plate x={-230} y={-430} text="APPLE MEMBELI NeXT" k={pop(frame, c0 - 6) * buildingsOut} size={40} border={C.cyan} />
      <Plate x={130} y={-590} text="MICROSOFT" k={pop(frame, c1 + 6)} size={52} border={C.cyan} />
      <Plate x={-60} y={-440} text="MUSUH LAMA" k={pop(frame, c1 + 14)} size={38} border={C.red} />
      {frame > c2
        ? [0, 1, 2, 3, 4].map((i) => {
            const k = prog(frame, c2 + i * 6, c2 + i * 6 + 26, eInOut);
            if (k <= 0 || k >= 1) return null;
            return <Banknote key={i} x={lerp(130, -130, k)} y={lerp(-120, -150, k) - Math.sin(k * Math.PI) * 130} s={0.65} rot={k * 300 + i * 20} />;
          })
        : null}
      <Plate x={0} y={-260} text="US$ 150 JUTA" k={pop(frame, c2 + 2)} size={50} border={GOOD} color={C.yellow} />
    </Shot>
  );
};

/* 9 — iMac: focus, five colours, profit */
const IMac: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const colors = ["#3FA6B8", "#E85D8A", "#E8914A", "#8A6FD0", "#5E9347"];
  return (
    <Shot len={len} wall="#24282F" z1={1.06}>
      <Plate x={0} y={-570} text="FOKUS & SEDERHANA" k={pop(frame, c0 - 8)} size={50} border={C.cyan} />
      <rect x={-540} y={FLOOR - 120} width={1080} height={26} fill={C.wood} stroke={C.ink} strokeWidth={5} />
      <rect x={-500} y={FLOOR - 94} width={20} height={94} fill={C.woodDark} />
      <rect x={480} y={FLOOR - 94} width={20} height={94} fill={C.woodDark} />
      {colors.map((c, i) => {
        const k = pop(frame, c1 + i * 7);
        return (
          <g key={i} transform={`translate(${-250 + i * 150} ${FLOOR - 120}) scale(${k})`}>
            <ColorPC x={0} y={0} s={0.8} color={c} />
          </g>
        );
      })}
      <Actor x={-410} y={FLOOR} scale={1.0} pose={point(idle(t, 1), prog(frame, c0, c0 + 12), 60)} look={JOBS} expr="calm" />
      <Plate x={0} y={70} text="iMac" k={pop(frame, c1)} size={54} border={C.yellow} />
      <GrowthChart x={-150} y={-60} k={prog(frame, c2, c2 + 44, eInOut)} s={0.75} />
      <Tick x={150} y={-270} r={34} k={pop(frame, c2 + 40)} />
      <Plate x={0} y={-400} text="UNTUNG LAGI" k={pop(frame, c2)} size={48} border={GOOD} />
      <Plate x={270} y={-20} text="US$ 309 JUTA" k={pop(frame, c2 + 24)} size={36} border={GOOD} />
    </Shot>
  );
};

/* 10 — iPod and phone */
const Gadgets: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const toPocket = prog(frame, c1 + 6, c1 + 28, eInOut);
  const playerX = lerp(-20, -325, toPocket);
  const playerY = lerp(-170, 170, toPocket);
  const playerS = lerp(1.5, 0.45, toPocket);
  return (
    <Shot len={len} wall="#22262E" z1={1.06}>
      <Actor x={-380} y={FLOOR} scale={1.25} pose={point(idle(t, 2), 1 - toPocket, 70)} look={JOBS} expr="happy" />
      <MusicPlayer x={playerX} y={playerY} s={playerS * pop(frame, c0 - 6)} rot={-8 * (1 - toPocket)} />
      {frame > c1 + 4
        ? [0, 1, 2, 3, 4, 5].map((i) => {
            const ph = ((frame - c1) / 36 + i / 6) % 1;
            const sx = lerp(60 + (i % 3) * 70, -325, ph);
            const sy = lerp(-420 + (i % 2) * 60, 170, ph);
            return <Note key={i} x={sx} y={sy} s={0.75} rot={Math.sin(ph * 6 + i) * 20} opacity={Math.sin(ph * Math.PI) * 0.95} />;
          })
        : null}
      <Plate x={-200} y={-570} text="2001: iPod" k={pop(frame, c0 - 8)} size={56} />
      <Plate x={-40} y={-440} text="1.000 LAGU DI SAKU" k={pop(frame, c1)} size={42} border={C.yellow} color={C.yellow} />
      <g transform={`translate(260 -90) scale(${pop(frame, c2)})`}>
        <AppPhone x={0} y={0} s={1.15} />
      </g>
      <Plate x={250} y={-570} text="2007: iPhone" k={pop(frame, c2 + 4)} size={44} border={C.cyan} />
    </Shot>
  );
};

/* 11 — 2011: most valuable company */
const Peak: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const base = FLOOR - 40;
  const exxon = 360;
  const hA = lerp(120, 300, prog(frame, c0, c1, eOut)) + 120 * prog(frame, c2 - 6, c2 + 18, eOut);
  const passed = hA > exxon;
  return (
    <Shot len={len} wall="#242A31" z1={1.06}>
      <Plate x={0} y={-570} text="AGUSTUS 2011" k={pop(frame, -10)} size={60} />
      <rect x={-290} y={base - hA} width={150} height={hA} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
      <rect x={90} y={base - exxon} width={150} height={exxon} fill="#8A4A32" stroke={C.ink} strokeWidth={5} />
      <OilBarrel x={165} y={base - exxon} s={1.05} />
      <Label x={-215} y={base + 40} text="APPLE" size={36} />
      <Label x={165} y={base + 40} text="EXXON" size={36} />
      <line x1={-330} y1={base - exxon} x2={280} y2={base - exxon} stroke={C.red} strokeWidth={4} strokeDasharray="14 12" opacity={0.8} />
      <g transform={`translate(-215 ${base - hA - 8}) scale(${pop(frame, c1 + 4)})`}>
        <Crown x={0} y={0} s={1.2} />
      </g>
      <Sparks x={-215} y={base - hA - 40} k={passed ? prog(frame, c2 + 4, c2 + 28) : 0} r={120} />
      <Actor x={-415} y={FLOOR} scale={0.95} pose={passed ? cheer(t) : idle(t)} look={JOBS} expr="happy" />
      <Plate x={-60} y={-440} text="PALING BERNILAI" k={pop(frame, c1 + 8)} size={46} border={GOOD} />
    </Shot>
  );
};

/* 12 — Farewell: the CEO role is handed over, 5 October, an empty chair */
const Farewell: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const pass = prog(frame, c0 + 8, c0 + 40, eInOut);
  const gone = prog(frame, c2 + 4, c2 + 40);
  const dim = prog(frame, c2, c2 + 40);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#262B33" z1={1.07}>
        <SideChair x={-130} y={FLOOR} facing={1} />
        <Actor x={-330} y={FLOOR} scale={1.3} pose={idle(t, 1)} look={JOBS} expr="calm" opacity={1 - gone} />
        <Actor x={380} y={FLOOR} scale={1.2} facing={-1} pose={idle(t, 6)} look={staff("#7A6A4E", "#6A5A44")} expr="calm" />
        <Plate x={lerp(-330, 380, pass)} y={-500} text="CEO" k={pop(frame, -8)} size={52} border={C.yellow} />
        <Calendar x={100} y={-190} text="5" sub="OKTOBER 2011" s={pop(frame, c1) * 0.95} />
      </Shot>
      <AbsoluteFill style={{background: `rgba(10,11,13,${0.5 * dim})`, pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};

/* 13 — End: from a garage to the top, the up-and-down path, the question */
const End: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const path = prog(frame, c0, c1 + 30, eInOut);
  const endAt = J_CUES[J_CUES.length - 1].to - J_SCENES[12].from + 8;
  const card = prog(frame, endAt, endAt + 18);
  const q = pop(frame, c2);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#242A31" z1={1.06}>
        <GarageDoor x={-390} y={FLOOR} w={200} h={170} />
        <Building x={390} y={FLOOR} w={210} h={600} name="APPLE" lit={0.7} />
        <path d="M -390 230 C -320 100 -260 -140 -170 -200 L -70 -110 L 10 80 L 120 -140 C 220 -280 320 -330 390 -330" fill="none" stroke={C.yellow} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${path} 1`} opacity={0.9} />
        <Actor x={-30} y={FLOOR} scale={1.3} pose={mix(idle(t, 2), {...idle(t, 2), shR: 80, elR: 10}, prog(frame, c1, c1 + 12))} look={JOBS} expr="determined" />
        <Plate x={0} y={-560} text="DARI GARASI KE PUNCAK" k={pop(frame, c0 - 8)} size={42} border={C.yellow} />
        <Plate x={0} y={-450} text="APA KUNCI JOBS BANGKIT?" k={q * (1 - card)} size={40} border={C.cyan} />
      </Shot>
      <EndCard lines={["Kalah sekali", "bukan akhir cerita."]} k={card} accent={1} />
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Garage, FirstSale, Ipo, Sculley, Leave, Trouble, Return, IMac, Gadgets, Peak, Farewell, End];
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "whip", "fade", "zoom", "whip", "zoom", "whip", "fade", "fade"];

export const SteveJobsApple: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={J_SCENES}
    cues={J_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
      const Scene = SCENES[i];
      return <Scene len={J_SCENES[i].len} />;
    }}
  />
);
