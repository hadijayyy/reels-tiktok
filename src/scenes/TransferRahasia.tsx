import React from "react";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {Board, FLOOR, Glow, Label} from "../environment/Furniture";
import {ANAK, LightRain, SideChair, SkyBand} from "../environment/FamilyProps";
import {KeepBox} from "../environment/FatherProps";
import {Tears} from "../environment/MotherProps";
import {BigPhone, Coin, handPhone, Stamp} from "../environment/MoneyProps";
import {PersonIcon} from "../environment/QrisProps";
import {Bed, SkyWindow} from "../environment/SleepProps";
import {ItemTag} from "../environment/SpendProps";
import {Calendar, SpeechBubble} from "../environment/StoryProps";
import {Checkout, FeeBill, Glasses, handBook, Hearts, Mat, NameList, Shelf, TransferScreen} from "../environment/TransferProps";
import {clamp, eInOut, eOut, lerp, noise, prog} from "../motion/ease";
import {CASUAL, RoundGlasses, ShortHair, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, mix, point, sit} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {Film, Plate as KitPlate, pop, Shot as KitShot, ShotProps} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as T_CUES, SCENES as T_SCENES} from "./transferTiming";

/*
 * SELAMA 3 TAHUN DIA MENGIRIM UANG KEPADA ORANG ASING — a 17-scene story (about 110 s).
 *   1 Hook: a trembling transfer to a censored name        10 The note: "help others, don't look for me"
 *   2 Minimarket job: food, rent, a little savings          11 The giver: an old teacher of poor children
 *   3 Every 15th, the same amount                           12 The teacher has passed away (empty chair, glasses)
 *   4 A friend sees the history: "Your girlfriend?"         13 He left a list of children who still need help
 *   5 "No. I've never even met them."                       14 He takes over one name
 *   6 "You're struggling yourself. Why?"                    15 Because he knows how close he came to losing his future
 *   7 That night he almost cancels                          16 He gives a child a book
 *   8 Three years earlier, nearly dropping out (rain, box)  17 One person helped him; now he wants to help a thousand
 *   9 Someone quietly paid his school fees ("LUNAS")
 * Past scenes are sepia. Scene lengths and caption cues come from transferTiming.ts.
 */

export {FRAMES as TRANSFER_FRAMES} from "./transferTiming";

const FIRST = [0, 3, 6, 10, 13, 16, 20, 23, 26, 28, 32, 36, 37, 40, 43, 46, 48];
const at = (i: number, j: number) => T_CUES[FIRST[i] + j].from - T_SCENES[i].from;

const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={44} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall={ROOM} {...p} />;


const SEPIA = "sepia(0.75) saturate(0.8) brightness(0.92)";
const AS = 1.35;
const HERO: Look = {...CASUAL, top: "#3E6E8E", sleeve: "#3E6E8E"};
const HERO_WORK: Look = {...HERO, top: "#F0EEE6", sleeve: "#F0EEE6", coat: "#C0392B"};
const HERO_KID: Look = {top: "#F0EEE6", sleeve: "#F0EEE6", trousers: "#6B6F78", headExtra: <ShortHair color="#1E1A18" />};
const FRIEND: Look = SHIRT_ORANGE;
const TEACHER: Look = {top: "#8A7A5E", sleeve: "#8A7A5E", coat: "#5E5040", trousers: "#3A3633", headExtra: (
  <g>
    <ShortHair color="#C8C8C8" />
    <RoundGlasses />
  </g>
)};
const KIDS: Look[] = [ANAK, {...ANAK, top: "#6B8E3E", sleeve: "#6B8E3E"}, {...ANAK, top: "#8E3E6E", sleeve: "#8E3E6E"}];
const ROOM = "#2A2620";
const NIGHT = "#161B2A";



const phoneHold = (t: number, shake = 0): Pose => ({...idle(t), shR: 64 + noise(t * 9, 3) * 6 * shake, elR: 70, lookY: 0.5, headTilt: 10});
const slumped = (t: number): Pose => ({...idle(t), lean: 12, headTilt: 18, shL: 4, shR: 8, lookY: 0.7});

/** A floating phone screen at (x, y). */
const Screen: React.FC<{x: number; y: number; k: number; status: "form" | "sent" | "history" | "cancel"; tick?: number; shake?: number; t: number}> = ({x, y, k, status, tick = 1, shake = 0, t}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x + noise(t * 14, 1) * 6 * shake} ${y + noise(t * 14, 2) * 6 * shake}) scale(${k})`}>
      <BigPhone x={0} y={0} w={300} h={440}>
        <TransferScreen w={300} h={440} status={status} k={tick} />
      </BigPhone>
    </g>
  );

/** A seated figure on a side chair at cx (facing f). */
const Seated: React.FC<{cx: number; f: 1 | -1; t: number; look: Look; pose?: Partial<Pose>; expr?: "sad" | "worried" | "neutral" | "calm" | "focused"}> = ({cx, f, t, look, pose = {}, expr = "neutral"}) => {
  const chair = {x: cx, floorY: FLOOR, facing: f, seat: 87};
  const seat = seatedAnchor(chair, AS);
  return (
    <g>
      <SideChair x={cx} y={FLOOR} facing={f} />
      <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={AS} facing={f} pose={{...sit(t), ...pose}} look={look} expr={expr} footL={seat.footL} footR={seat.footR} />
    </g>
  );
};

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const secret = at(0, 2);
  return (
    <Shot len={len} wall={NIGHT} z1={1.18} handheld={0.6}>
      <Glow x={180} y={-200} r={460} color="#8FC7FF" opacity={0.14} />
      <Stickman x={-230} y={FLOOR} scale={AS} pose={phoneHold(t, 1)} look={{...HERO, handR: handPhone(<rect width={44} height={70} fill="#F2F4F6" />)}} expr="worried" />
      <Screen x={170} y={-260} k={pop(frame, 4)} status="form" shake={1} t={t} />
      <Plate x={-230} y={-520} text="3 TAHUN" k={pop(frame, 8)} size={54} border={C.yellow} />
      <Stamp x={170} y={60} text="RAHASIA" k={prog(frame, secret, secret + 10, eOut)} rot={-8} size={48} />
    </Shot>
  );
};

/* 2 — The minimarket job */
const Work: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const pay = at(1, 1);
  const save = at(1, 2);
  return (
    <Shot len={len} wall="#E6E2D8" z1={1.1}>
      <Shelf x={-280} y={FLOOR} w={380} />
      <Stickman x={200} y={FLOOR - 10} scale={AS} facing={-1} pose={idle(t)} look={HERO_WORK} expr="neutral" />
      <Checkout x={180} y={FLOOR} />
      <ItemTag x={-280} y={-600} text="MAKAN" k={pop(frame, pay + 10)} />
      <ItemTag x={0} y={-600} text="KOS" k={pop(frame, save)} />
      <ItemTag x={270} y={-600} text="TABUNGAN" k={pop(frame, save + 14)} />
    </Shot>
  );
};

/* 3 — Every 15th */
const Fifteenth: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const send = at(2, 1);
  const done = at(2, 3);
  const circle = prog(frame, 6, 26, eOut);
  return (
    <Shot len={len} wall={ROOM} z1={1.12}>
      <g transform="translate(-280 -400)">
        <Calendar x={0} y={0} text="15" sub="SETIAP BULAN" s={0.8} />
        <ellipse cx={0} cy={30} rx={110} ry={80} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray={`${700 * circle} 800`} />
      </g>
      <Bed x0={-440} x1={-60} top={FLOOR - 90} floor={FLOOR} />
      <Stickman x={-170} y={FLOOR} scale={AS} pose={phoneHold(t)} look={{...HERO, handR: handPhone(<rect width={44} height={70} fill="#F2F4F6" />)}} expr="calm" />
      <Screen x={230} y={-280} k={pop(frame, send)} status={frame > done ? "sent" : "form"} tick={pop(frame, done)} t={t} />
    </Shot>
  );
};

/* 4 — The friend sees it */
const Friend: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const sees = at(3, 1);
  const ask = at(3, 2);
  return (
    <Shot len={len} wall={ROOM} z1={1.14}>
      <Screen x={-200} y={-300} k={pop(frame, sees - 6)} status="history" t={t} />
      <Stickman x={-60} y={FLOOR} scale={AS} pose={phoneHold(t)} look={{...HERO, handR: handPhone(<rect width={44} height={70} fill="#F2F4F6" />)}} expr="neutral" />
      <Stickman x={210} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t), lean: 14 * prog(frame, sees, sees + 12), headTilt: 10, lookY: 0.5}} look={FRIEND} expr={frame > ask ? "surprised" : "focused"} />
      <SpeechBubble x={250} y={-470} lines={["Siapa orang ini?", "Pacarmu?"]} k={pop(frame, ask)} tx={200} ty={-170} size={36} />
    </Shot>
  );
};

/* 5 — "Never met them" */
const NeverMet: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const say = at(4, 1);
  return (
    <Shot len={len} wall={ROOM} z1={1.14} x1={-40}>
      <Stickman x={-170} y={FLOOR} scale={AS} pose={idle(t)} look={HERO} expr="calm" />
      <Stickman x={190} y={FLOOR} scale={AS} facing={-1} pose={idle(t, 3)} look={FRIEND} expr={frame > say ? "surprised" : "neutral"} />
      <SpeechBubble x={-170} y={-480} lines={["Bukan.", "Aku belum pernah", "bertemu dengannya."]} k={pop(frame, say)} tx={-170} ty={-170} size={36} />
    </Shot>
  );
};

/* 6 — "Why help strangers?" */
const Fool: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const q1 = at(5, 1);
  const q2 = at(5, 2);
  const shake = Math.sin(t * 9) * 8 * prog(frame, 4, 14) * (1 - prog(frame, q1, q1 + 10));
  return (
    <Shot len={len} wall={ROOM} z1={1.14} x1={40}>
      <Stickman x={-170} y={FLOOR} scale={AS} pose={slumped(t)} look={HERO} expr="sad" />
      <Stickman x={190} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t, 3), headTilt: shake, look: shake / 10, shL: -40, elL: 60}} look={FRIEND} expr="worried" />
      <SpeechBubble x={180} y={-470} lines={["Kamu sendiri", "hidup susah."]} k={pop(frame, q1) * (1 - prog(frame, q2 - 4, q2))} tx={190} ty={-170} size={38} />
      <SpeechBubble x={150} y={-470} lines={["Kenapa membantu", "orang yang tidak", "kamu kenal?"]} k={pop(frame, q2)} tx={190} ty={-170} size={36} />
    </Shot>
  );
};

/* 7 — Almost cancelling */
const Almost: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const night = at(6, 1);
  const cancel = at(6, 2);
  const coins = Math.min(4, Math.floor(clamp(frame / Math.max(1, night)) * 5));
  return (
    <Shot len={len} wall={NIGHT} z1={1.18} handheld={0.5}>
      <SkyWindow x={-330} y={-380} />
      <rect x={-200} y={FLOOR - 150} width={300} height={16} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
      <rect x={-180} y={FLOOR - 134} width={14} height={134} fill={C.woodDark} />
      <rect x={66} y={FLOOR - 134} width={14} height={134} fill={C.woodDark} />
      {Array.from({length: coins}, (_, i) => (
        <Coin key={i} x={-100 + i * 36} y={FLOOR - 172} r={18} />
      ))}
      <Seated cx={-330} f={1} t={t} look={HERO} pose={{lean: 16, headTilt: 20, lookY: 0.8, shR: 60, elR: 40, shL: 56, elL: 40}} expr="worried" />
      <Screen x={250} y={-300} k={pop(frame, cancel)} status="cancel" t={t} />
    </Shot>
  );
};

/* 8 — Three years earlier: the old box in the rain */
const ThreeYears: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const school = at(7, 1);
  const mem = prog(frame, school, school + 20);
  return (
    <Shot len={len} wall={NIGHT} z1={1.14}>
      <LightRain t={t} opacity={0.35} />
      <KeepBox x={120} y={FLOOR} s={0.9} open={prog(frame, 4, 24)} />
      <Stickman x={-120} y={FLOOR} scale={AS} pose={point(slumped(t), 1, 60)} look={HERO} expr="sad" />
      <Plate x={0} y={-560} text="3 TAHUN SEBELUMNYA" k={pop(frame, 4)} size={40} border={C.bone} />
      <g opacity={mem} style={{filter: SEPIA}}>
        <circle cx={150} cy={-300} r={170} fill="#4A4038" stroke={C.bone} strokeWidth={6} />
        <g transform="translate(150 -300) translate(-30 130)">
          <Stickman x={0} y={0} scale={0.95} pose={slumped(t)} look={HERO_KID} expr="sad" />
          <g transform="translate(90 -150) scale(0.28)">
            <FeeBill x={0} y={0} />
          </g>
        </g>
      </g>
    </Shot>
  );
};

/* 9 — Someone paid the fees */
const Paid: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const paid = at(8, 1);
  const leave = prog(frame, paid, len);
  return (
    <Shot len={len} wall="#3A3430" filter={SEPIA} z1={1.12}>
      <rect x={300} y={-420} width={200} height={840} fill="#1E1A16" />
      <g opacity={0.55 * (1 - leave)}>
        <Stickman x={lerp(380, 520, leave)} y={FLOOR} scale={AS} facing={1} pose={idle(t)} look={{top: "#000", sleeve: "#000", trousers: "#000"}} expr="neutral" />
      </g>
      <FeeBill x={-60} y={-360} s={1.1} />
      <Stamp x={-40} y={-330} text="LUNAS" k={prog(frame, paid + 6, paid + 16, eOut)} rot={-12} size={70} />
      <Stickman x={-300} y={FLOOR} scale={1.0} pose={mix(slumped(t), {...idle(t), lookY: -0.4}, prog(frame, paid + 10, paid + 26))} look={HERO_KID} expr={frame > paid + 16 ? "surprised" : "sad"} />
    </Shot>
  );
};

/* 10 — The note */
const Note: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const l1 = at(9, 1);
  const l2 = at(9, 2);
  const l3 = at(9, 3);
  const lines = [frame >= l1 - 4 ? "Suatu hari, kalau kamu sudah mampu," : " ", frame >= l2 - 4 ? "bantu orang lain." : " ", frame >= l3 - 4 ? "Tidak perlu mencari tahu siapa aku." : " "];
  return (
    <Shot len={len} wall={NIGHT} z1={1.12}>
      <LightRain t={t} opacity={0.3} />
      <g transform={`translate(0 -440) scale(${pop(frame, 4)})`}>
        <rect x={-300} y={-120} width={600} height={240} rx={6} fill="#F3EBD6" stroke={C.ink} strokeWidth={4} transform="rotate(-2)" />
        {lines.map((l, i) => (
          <text key={i} x={0} y={-50 + i * 56} textAnchor="middle" fontFamily="Inter" fontStyle="italic" fontWeight={600} fontSize={28} fill="#2A3A6A" transform="rotate(-2)">
            {l}
          </text>
        ))}
      </g>
      <Stickman x={-60} y={FLOOR} scale={AS} pose={{...idle(t), shR: 60, elR: 60, shL: 56, elL: 60, lookY: -0.2}} look={HERO} expr="sad" />
      <Tears x={-50} y={FLOOR - 260} t={t} />
    </Shot>
  );
};

/* 11 — The giver: an old teacher */
const Teacher: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const who = at(10, 2);
  const free = at(10, 3);
  return (
    <Shot len={len} wall={ROOM} z1={1.1}>
      <Seated cx={-360} f={1} t={t} look={HERO} pose={{lean: 10, headTilt: 6, lookY: -0.3}} expr="sad" />
      <g opacity={prog(frame, 4, 24)} style={{filter: SEPIA}}>
        <defs>
          <clipPath id="teacher-memory">
            <circle cx={110} cy={-260} r={326} />
          </clipPath>
        </defs>
        <circle cx={110} cy={-260} r={330} fill="#4A4038" stroke={C.bone} strokeWidth={6} />
        <g clipPath="url(#teacher-memory)">
        <g transform="translate(110 -260) translate(10 190) scale(0.82)">
          <Board x={-120} y={-160} w={360} h={220}>
            <Label x={180} y={90} text="A B C" size={56} color={C.ink} />
            <g opacity={prog(frame, free, free + 10)}>
              <Label x={180} y={170} text="GRATIS" size={46} color="#2E7D32" />
            </g>
          </Board>
          <Stickman x={180} y={0} scale={1.3} facing={-1} pose={point(idle(t), prog(frame, who, who + 14), 110)} look={TEACHER} expr="happy" />
          <Mat x={-60} y={0} w={420} />
          {[-220, -110, 0].map((x, i) => (
            <Stickman key={i} x={x} y={-4} scale={0.8} pose={{...sit(t, i), hipL: 80, kneeL: 150, hipR: 82, kneeR: 150}} look={KIDS[i]} expr="happy" />
          ))}
        </g>
        </g>
      </g>
    </Shot>
  );
};

/* 12 — He has passed away */
const Passed: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <Shot len={len} wall="#2A2622" filter={SEPIA} z1={1.08}>
      <Board x={60} y={FLOOR - 200} w={420} h={260}>
        <Label x={210} y={140} text="A B C" size={60} color={C.ink} />
      </Board>
      <SideChair x={-200} y={FLOOR} facing={1} />
      <Glasses x={-170} y={FLOOR - 98} s={1.1} />
      <Stickman x={330} y={FLOOR} scale={AS} facing={-1} pose={{...slumped(t), headTilt: 26}} look={HERO} expr="sad" opacity={prog(frame, 10, 30)} />
    </Shot>
  );
};

/* 13 — The list */
const List: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const list = at(12, 1);
  const need = at(12, 2);
  return (
    <Shot len={len} wall={ROOM} z1={1.12}>
      <g transform={`translate(110 -500) scale(${pop(frame, list)})`}>
        <NameList x={0} y={0} rows={5} />
      </g>
      <Stickman x={-300} y={FLOOR} scale={AS} pose={{...idle(t), shR: 60, elR: 70, lookY: -0.3}} look={HERO} expr="sad" />
      <Plate x={110} y={0} text="MASIH BUTUH BANTUAN" k={pop(frame, need)} size={34} border={C.cyan} />
    </Shot>
  );
};

/* 14 — One name */
const OneName: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const one = at(13, 1);
  const rich = at(13, 2);
  return (
    <Shot len={len} wall={ROOM} z1={1.14}>
      <NameList x={110} y={-500} rows={5} circled={2} circleK={prog(frame, one, one + 20, eOut)} />
      <Stickman x={-300} y={FLOOR} scale={AS} pose={point(idle(t), prog(frame, one - 6, one + 8), 120)} look={HERO} expr="determined" />
      <Plate x={110} y={0} text="BUKAN KARENA KAYA" k={pop(frame, rich)} size={34} border={C.yellow} />
    </Shot>
  );
};

/* 15 — Sending again */
const SendAgain: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const future = at(14, 1);
  const sent = prog(frame, len - 70, len - 55);
  return (
    <Shot len={len} wall={NIGHT} z1={1.14}>
      <g opacity={0.35 * prog(frame, future, future + 20)} style={{filter: SEPIA}}>
        <Stickman x={-380} y={FLOOR} scale={1.0} pose={slumped(t)} look={HERO_KID} expr="sad" />
      </g>
      <Stickman x={-150} y={FLOOR} scale={AS} pose={phoneHold(t)} look={{...HERO, handR: handPhone(<rect width={44} height={70} fill="#F2F4F6" />)}} expr="determined" />
      <Screen x={230} y={-290} k={pop(frame, 4)} status={sent > 0 ? "sent" : "form"} tick={sent} t={t} />
    </Shot>
  );
};

/* 16 — A book for a child */
const Book: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const world = at(15, 1);
  const got = prog(frame, 20, 40);
  return (
    <Shot len={len} wall="#5B87B0" back={<SkyBand top="#3C6E9E" bottom="#BFD9EA" />} z1={1.12}>
      <Glow x={0} y={-100} r={600} color={C.yellow} opacity={0.12} />
      <Stickman x={-150} y={FLOOR} scale={AS} pose={point(idle(t), 1 - got, 80)} look={got < 0.5 ? {...HERO, handR: handBook} : HERO} expr="happy" />
      <Stickman x={150} y={FLOOR} scale={1.0} facing={-1} pose={got > 0.5 ? cheer(t) : idle(t)} look={got > 0.5 ? {...ANAK, handR: handBook} : ANAK} expr="happy" />
      <Hearts x={150} y={-180} t={t} k={prog(frame, world - 10, world + 10)} />
    </Shot>
  );
};

/* 17 — One becomes a thousand */
const Thousand: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const help = at(16, 2);
  const many = at(16, 3);
  const cols = 9;
  const rows = 4;
  const spread = prog(frame, help, many + 60, eInOut);
  return (
    <Shot len={len} wall="#1E2430" z1={1.08}>
      <Glow x={0} y={-300} r={600} color={C.yellow} opacity={0.08 + 0.14 * spread} />
      {Array.from({length: cols * rows}, (_, i) => {
        const c = i % cols;
        const d = Math.hypot(c - 4, Math.floor(i / cols) - 1.5) / 5;
        const lit = spread > d ? 1 : 0;
        return <PersonIcon key={i} x={-400 + c * 100} y={-520 + Math.floor(i / cols) * 90} s={1.3} color={lit ? C.yellow : "#3A4250"} />;
      })}
      <Stickman x={-110} y={FLOOR} scale={AS} pose={idle(t)} look={HERO} expr="happy" />
      <Stickman x={90} y={FLOOR} scale={1.0} facing={-1} pose={idle(t, 2)} look={{...ANAK, handR: handBook}} expr="happy" />
    </Shot>
  );
};

const SCENES = [Hook, Work, Fifteenth, Friend, NeverMet, Fool, Almost, ThreeYears, Paid, Note, Teacher, Passed, List, OneName, SendAgain, Book, Thousand];
const TRANSITIONS: TransitionKind[] = ["fade", "cut", "fade", "cut", "cut", "fade", "fade", "fade", "fade", "fade", "fade", "fade", "cut", "fade", "fade", "fade"];

export const TransferRahasia: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={T_SCENES}
    cues={T_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={T_SCENES[i].len} />;
    }}
  />
);
