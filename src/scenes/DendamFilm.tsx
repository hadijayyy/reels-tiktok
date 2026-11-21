import React from "react";
import {AbsoluteFill} from "remotion";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {Board, Desk, Floor, FLOOR, Glow, Label} from "../environment/Furniture";
import {ANAK, Car, House, IBU, LightRain, SackOnBack, SkyBand, StreetLamp} from "../environment/FamilyProps";
import {Tears} from "../environment/MotherProps";
import {Stamp, Tick} from "../environment/MoneyProps";
import {SkyWindow} from "../environment/SleepProps";
import {BookStack, GrowthChart} from "../environment/SpendProps";
import {Bench, Calendar, handFolder, handLetter, Laugh, Mirror, SpeechBubble, Sunrise} from "../environment/StoryProps";
import {clamp, eInOut, eOut, lerp, prog} from "../motion/ease";
import {CASUAL, ShortHair, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, mix, point, sit, STRIDE, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {Film, Plate as KitPlate, pop, Shot as KitShot, ShotProps} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as D_CUES, SCENES as D_SCENES} from "./dendamTiming";

/*
 * DIA MENUNGGU 10 TAHUN UNTUK MEMBALAS DENDAM — a 16-scene story (about 95 s).
 *   1 Hook: he faces the man who hurt him, letter in hand   9 He meets his old bully
 *   2 Age 15: mocked for his clothes and his poor family    10 The bully is job-hunting, life in pieces
 *   3 Right answer in class, still laughed at               11 The bully bows: "Sorry, I was wrong"
 *   4 Nightly promise in the mirror                         12 He could humiliate him (red, tense)
 *   5 Study, work while in college, rejected again          13 He offers a hand instead
 *   6 Wanting to quit, he remembers the laughing faces      14 Walking away, the memory of the crying boy
 *   7 Ten years pass: a successful businessman              15 The strings of the past snap
 *   8 A big house, an expensive car                         16 Walking into the sunrise
 * Past scenes are sepia. Scene lengths and caption cues come from dendamTiming.ts.
 */

export {FRAMES as DENDAM_FRAMES} from "./dendamTiming";

const FIRST = [0, 5, 9, 12, 16, 19, 22, 24, 26, 29, 32, 35, 38, 41, 44, 47];
const at = (i: number, j: number) => D_CUES[FIRST[i] + j].from - D_SCENES[i].from;

const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={46} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall={"#26303A"} {...p} />;


/* Characters */
const Patch: React.FC = () => (
  <g>
    <rect x={-14} y={8} width={16} height={14} fill="#A89878" stroke={C.ink} strokeWidth={2} transform="rotate(-8)" />
    <rect x={6} y={-16} width={12} height={12} fill="#7E8C6A" stroke={C.ink} strokeWidth={2} transform="rotate(6)" />
  </g>
);
const HERO_KID: Look = {...ANAK, top: "#8C8270", sleeve: "#8C8270", trousers: "#4A4640", chest: <Patch />};
const HERO_TEEN: Look = {...HERO_KID, trousers: "#33465C"};
const HERO_STUDENT: Look = {...CASUAL, top: "#4E5E6B", sleeve: "#4E5E6B"};
const HERO_BOSS: Look = {top: "#E9E7DF", sleeve: "#2A2F3A", coat: "#2A2F3A", tie: C.red, trousers: "#2A2F3A", headExtra: <ShortHair color="#1E1A18" />};
const BULLY_KID: Look = {...SHIRT_ORANGE, trousers: "#33465C"};
const BULLY_ADULT: Look = {...SHIRT_ORANGE, top: "#7A5A48", sleeve: "#7A5A48", trousers: "#4A4A4A"};
const KIDS: Look[] = [BULLY_KID, {...ANAK, top: "#3E6E8E", sleeve: "#3E6E8E"}, {...ANAK, top: "#6B8E3E", sleeve: "#6B8E3E"}, {...ANAK, top: "#8E3E6E", sleeve: "#8E3E6E"}];

const SEPIA = "sepia(0.75) saturate(0.8) brightness(0.92)";
const KID = 1.0;
const ADULT = 1.4;

const slumped = (t: number, seed = 0): Pose => ({...idle(t, seed), lean: 14, headTilt: 18, shL: 4, shR: 8, elL: 4, elR: 4, lookY: 0.7});
const bowing = (t: number): Pose => ({...idle(t), lean: 34, headTilt: 26, shL: 10, shR: 10, lookY: 0.8});
const laughing = (t: number, seed = 0): Pose => ({...idle(t, seed), lean: -6 + Math.sin(t * 14 + seed) * 4, shL: -30, elL: 80, shR: 40, elR: 70, bob: -Math.abs(Math.sin(t * 12 + seed)) * 4});
const pointAt = (t: number, seed = 0): Pose => point(laughing(t, seed), 1, 90);



/** A seated figure on a bench (bench anchor at bx, facing f). */
const SeatedOnBench: React.FC<{bx: number; f: 1 | -1; t: number; look: Look; expr?: "sad" | "worried" | "neutral" | "surprised"; slump?: number; standK?: number}> = ({bx, f, t, look, expr = "sad", slump = 1, standK = 0}) => {
  const chair = {x: bx, floorY: FLOOR, facing: f, seat: 87};
  const seat = seatedAnchor(chair, ADULT);
  if (standK > 0.5) {
    return <Stickman x={seat.hip.x + f * 40} y={FLOOR} scale={ADULT} facing={f} pose={mix(bowing(t), idle(t), standK)} look={look} expr={expr} />;
  }
  const s = sit(t);
  return (
    <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={ADULT} facing={f} pose={{...s, lean: 10 + slump * 18, headTilt: slump * 22, lookY: slump * 0.7, shL: 20, elL: 40, shR: 24, elR: 50}} look={look} expr={expr} footL={seat.footL} footR={seat.footR} />
  );
};

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const chance = at(0, 2);
  const twist = at(0, 3);
  return (
    <Shot len={len} wall="#1E1A22" z1={1.2} handheld={0.6}>
      <Glow x={0} y={-100} r={700} color={C.red} opacity={0.14 + 0.06 * Math.sin(t * 2)} />
      <StreetLamp x={-470} y={FLOOR} on={1} />
      <Stickman x={-170} y={FLOOR} scale={ADULT} pose={{...idle(t), shR: 30, elR: 40}} look={{...HERO_BOSS, handR: handLetter}} expr="determined" />
      <Stickman x={200} y={FLOOR} scale={ADULT} facing={-1} pose={slumped(t, 3)} look={BULLY_ADULT} expr="worried" />
      <Plate x={0} y={-520} text="10 TAHUN" k={pop(frame, 4)} size={64} border={C.red} />
      <g transform={`translate(15 -260) scale(${pop(frame, twist) * (1 + Math.sin(t * 5) * 0.04)})`}>
        <Label x={0} y={0} text="?" size={170} color={C.yellow} />
      </g>
      <g opacity={prog(frame, chance, chance + 12)}>
        <path d={`M -100 ${FLOOR - 300} L 120 ${FLOOR - 300}`} stroke={C.yellow} strokeWidth={3} strokeDasharray="8 10" opacity={0.6} />
      </g>
    </Shot>
  );
};

/* 2 — Mocked at 15 */
const Mocked: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const mock = at(1, 1);
  const clothes = at(1, 2);
  const poor = at(1, 3);
  const bullies: [number, number][] = [
    [-330, -1],
    [260, -1],
    [400, -1],
  ];
  return (
    <Shot len={len} wall="#3A3430" filter={SEPIA}>
      <Plate x={0} y={-560} text="UMUR 15 TAHUN" k={1} size={44} border={C.bone} />
      {/* school wall */}
      <rect x={-1400} y={-120} width={2800} height={20} fill="#5E5248" />
      <Stickman x={-40} y={FLOOR} scale={KID} pose={slumped(t)} look={HERO_KID} expr="sad" />
      {bullies.map(([x], i) => (
        <g key={i} opacity={prog(frame, mock + i * 5, mock + i * 5 + 8)}>
          <Stickman x={x} y={FLOOR} scale={KID} facing={x > 0 ? -1 : 1} pose={i === 1 ? pointAt(t, i) : laughing(t, i)} look={KIDS[i]} expr="smug" />
          <Laugh x={x} y={FLOOR - 360} t={t} k={pop(frame, mock + i * 5 + 4)} seed={i} />
        </g>
      ))}
      <Plate x={-260} y={-250} text="BAJU JELEK" k={pop(frame, clothes)} size={38} border={C.red} />
      <Plate x={200} y={-150} text="KELUARGA MISKIN" k={pop(frame, poor)} size={38} border={C.red} />
    </Shot>
  );
};

/* 3 — Right answer, still laughed at */
const Classroom: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const right = at(2, 1);
  const laugh = at(2, 2);
  const down = prog(frame, laugh, laugh + 14);
  const handUp = {...idle(t), shR: 168, elR: 4};
  return (
    <Shot len={len} wall="#3A3430" filter={SEPIA}>
      <Board x={-150} y={FLOOR - 230} w={480} h={300}>
        <Label x={240} y={110} text="12 × 3 = ?" size={64} color={C.ink} />
        <g opacity={prog(frame, right, right + 10)}>
          <Label x={240} y={220} text="36" size={70} color="#2E7D32" />
        </g>
        <Tick x={380} y={200} r={30} k={pop(frame, right + 8)} />
      </Board>
      <Stickman x={-430} y={FLOOR} scale={1.25} facing={1} pose={point(idle(t), 1, 100)} look={IBU} expr="neutral" />
      <Stickman x={150} y={FLOOR} scale={KID} facing={-1} pose={mix(handUp, slumped(t), down)} look={HERO_KID} expr={down > 0.5 ? "sad" : "happy"} />
      {[290, 400].map((x, i) => (
        <g key={i} opacity={prog(frame, laugh + i * 4, laugh + i * 4 + 8)}>
          <Stickman x={x} y={FLOOR} scale={KID} facing={-1} pose={laughing(t, i + 2)} look={KIDS[i]} expr="smug" />
          <Laugh x={x} y={FLOOR - 360} t={t} k={pop(frame, laugh + i * 4 + 4)} seed={i + 4} />
        </g>
      ))}
    </Shot>
  );
};

/* 4 — Nightly promise in the mirror */
const Promise: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const vow = at(3, 2);
  const det = prog(frame, vow, vow + 14);
  const p = mix(slumped(t), {...idle(t), shR: 30, elR: 110, lookY: -0.1}, det);
  return (
    <Shot len={len} wall="#161B2A" z1={1.18} x1={60}>
      <SkyWindow x={-330} y={-250} />
      <Glow x={180} y={-150} r={420} color={C.cyan} opacity={0.08} />
      <Mirror x={250} y={-170} w={240} h={420}>
        <g>
          <Stickman x={0} y={200} scale={0.85} facing={-1} pose={p} look={HERO_TEEN} expr={det > 0.5 ? "determined" : "sad"} />
        </g>
      </Mirror>
      <Stickman x={0} y={FLOOR} scale={1.2} facing={1} pose={p} look={HERO_TEEN} expr={det > 0.5 ? "determined" : "sad"} />
      <Plate x={-60} y={-560} text="SUATU HARI..." k={pop(frame, vow)} size={46} border={C.cyan} />
    </Shot>
  );
};

/* 5 — Study, work, rejection */
const Grind: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const work = at(4, 1);
  const rej = at(4, 2);
  const phase = frame < work - 4 ? 0 : frame < rej - 4 ? 1 : 2;
  const flash = Math.max(1 - Math.abs(frame - (work - 4)) / 5, 1 - Math.abs(frame - (rej - 4)) / 5, 0);
  return (
    <AbsoluteFill>
      <Shot len={len} wall={phase === 1 ? "#2E2A26" : "#1C2230"}>
        {phase === 0 ? (
          <g>
            <Desk x={60} w={420} top={150} />
            <BookStack x={170} y={FLOOR - 150} n={5} s={0.9} />
            <Glow x={0} y={150} r={300} color={C.yellow} opacity={0.15} />
            <Stickman x={-90} y={FLOOR} scale={1.3} pose={{...idle(t), lean: 16, headTilt: 14, lookY: 0.7, shR: 50, elR: 60, shL: 40, elL: 60}} look={HERO_STUDENT} expr="focused" />
            <Plate x={0} y={-520} text="BELAJAR" k={pop(frame, 4)} size={50} border={C.cyan} />
          </g>
        ) : null}
        {phase === 1 ? (
          <g>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={140 + i * 70} y={FLOOR - 80 - (i % 2) * 70} width={90} height={70} fill="#A0784A" stroke={C.ink} strokeWidth={4} />
            ))}
            <Stickman x={-140} y={FLOOR} scale={1.3} pose={walk((frame - work) / 22, t)} look={{...HERO_STUDENT, back: SackOnBack}} expr="determined" />
            <Plate x={0} y={-520} text="KERJA + KULIAH" k={pop(frame, work)} size={48} border={C.yellow} />
          </g>
        ) : null}
        {phase === 2 ? (
          <g>
            <Stickman x={-60} y={FLOOR} scale={1.3} pose={mix({...idle(t), shR: 70, elR: 30}, slumped(t), prog(frame, rej + 30, rej + 50))} look={{...HERO_STUDENT, handR: handFolder}} expr="worried" />
            <Stamp x={-170} y={-430} text="DITOLAK" k={prog(frame, rej, rej + 10, eOut)} rot={-10} size={54} />
            <Stamp x={170} y={-300} text="DITOLAK" k={prog(frame, rej + 12, rej + 22, eOut)} rot={8} size={54} />
            <Stamp x={-60} y={-170} text="DITOLAK" k={prog(frame, rej + 24, rej + 34, eOut)} rot={-4} size={54} />
          </g>
        ) : null}
      </Shot>
      <AbsoluteFill style={{background: "#FFFFFF", opacity: flash * 0.7}} />
    </AbsoluteFill>
  );
};

/* 6 — Wanting to quit, remembering the faces */
const Remember: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const faces = at(5, 1);
  const up = prog(frame, len - 50, len - 20, eInOut);
  return (
    <Shot len={len} wall="#1A1620" z1={1.18} handheld={0.5}>
      <Glow x={0} y={-200} r={600} color={C.red} opacity={0.1 + 0.1 * prog(frame, faces, faces + 20)} />
      <g style={{filter: SEPIA}} opacity={0.45 * prog(frame, faces, faces + 20)}>
        {[[-330, -380], [300, -440], [-120, -560], [380, -200]].map(([x, y], i) => (
          <g key={i}>
            <Stickman x={x} y={y + 320} scale={0.8} facing={x > 0 ? -1 : 1} pose={laughing(t, i)} look={KIDS[i]} expr="smug" />
            <Laugh x={x} y={y - 20} t={t} k={1} seed={i} size={34} />
          </g>
        ))}
      </g>
      <Stickman x={0} y={FLOOR} scale={1.35} pose={mix({...slumped(t), lean: 26, headTilt: 26}, {...idle(t), shL: -20, elL: 100, shR: 20, elR: 100}, up)} look={HERO_STUDENT} expr={up > 0.5 ? "determined" : "sad"} />
    </Shot>
  );
};

/* 7 — Ten years pass */
const TenYears: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const boss = at(6, 1);
  const flipping = clamp(frame / (boss - 4));
  const year = Math.min(10, 1 + Math.floor(flipping * 10));
  const pageK = (flipping * 10) % 1;
  const show = 1 - prog(frame, boss - 6, boss + 4);
  return (
    <Shot len={len} wall="#22303A">
      <g opacity={show}>
        <Calendar x={0} y={-330} text={`${year}`} sub="TAHUN KE" flip={flipping < 1 ? pageK : 0} s={1.2} />
      </g>
      <g opacity={1 - show}>
        <GrowthChart x={60} y={-260} k={prog(frame, boss, boss + 40)} s={1.0} />
        <Plate x={0} y={-560} text="PENGUSAHA SUKSES" k={pop(frame, boss)} size={46} />
      </g>
      <Stickman x={-260} y={FLOOR} scale={ADULT} pose={mix(idle(t), {...idle(t), shR: 60, elR: 20}, 1 - show)} look={frame < boss ? HERO_STUDENT : HERO_BOSS} expr={frame < boss ? "focused" : "happy"} />
    </Shot>
  );
};

/* 8 — Big house, expensive car */
const Wealth: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const car = at(7, 1);
  const carK = prog(frame, car - 4, car + 20, eOut);
  return (
    <Shot len={len} wall="#5B87B0" floor back={<SkyBand top="#3C6E9E" bottom="#A8CBE0" />}>
      <g transform={`translate(-140 ${FLOOR}) scale(${0.62 * pop(frame, 4)})`}>
        <House x={0} y={0} windowLight={0.3} />
      </g>
      <Car x={lerp(900, 230, carK)} y={FLOOR} s={0.85} lights={0} flip />
      <Stickman x={60} y={FLOOR} scale={1.3} facing={1} pose={{...idle(t), shR: 50, elR: 10}} look={HERO_BOSS} expr="happy" />
      <Plate x={-160} y={-530} text="RUMAH BESAR" k={pop(frame, 6)} size={40} />
      <Plate x={230} y={-330} text="MOBIL MAHAL" k={pop(frame, car + 14)} size={40} />
    </Shot>
  );
};

/* 9 — The meeting */
const Meet: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const who = at(8, 1);
  const stopAt = who - 6;
  const walkK = clamp(frame / stopAt);
  const hx = lerp(-520, -200, walkK);
  const bubble = prog(frame, who + 6, who + 20);
  return (
    <Shot len={len} wall="#2B3440">
      <StreetLamp x={-470} y={FLOOR} on={0.4} />
      <Bench x={180} y={FLOOR} facing={-1} />
      <SeatedOnBench bx={180} f={-1} t={t} look={BULLY_ADULT} />
      <Stickman x={hx} y={FLOOR} scale={ADULT} pose={walkK < 1 ? walk(((hx + 520) / STRIDE) * 1.0, t) : idle(t)} look={HERO_BOSS} expr={frame > who ? "surprised" : "neutral"} />
      {/* memory bubble */}
      <g opacity={bubble}>
        <circle cx={-110} cy={-310} r={12} fill={C.bone} />
        <circle cx={-80} cy={-360} r={18} fill={C.bone} />
        <g style={{filter: SEPIA}}>
          <circle cx={0} cy={-500} r={150} fill="#4A4038" stroke={C.bone} strokeWidth={6} />
          <g transform="translate(0 -500) scale(0.5) translate(0 220)">
            <Stickman x={-80} y={0} scale={KID} pose={slumped(t)} look={HERO_KID} expr="sad" />
            <Stickman x={110} y={0} scale={KID} facing={-1} pose={pointAt(t)} look={BULLY_KID} expr="smug" />
          </g>
        </g>
      </g>
    </Shot>
  );
};

/* 10 — The bully's life now */
const Broken: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const job = at(9, 1);
  const mess = at(9, 2);
  return (
    <Shot len={len} wall="#262A30" z1={1.2} x1={60} filter="saturate(0.6)">
      <LightRain t={t} opacity={0.3 * prog(frame, mess, mess + 20)} />
      <Bench x={180} y={FLOOR} facing={-1} />
      <SeatedOnBench bx={180} f={-1} t={t} look={{...BULLY_ADULT, handR: handFolder}} />
      {[[-60, 0], [-200, 1], [330, 2]].map(([x, i]) => (
        <g key={i} transform={`translate(${x} ${FLOOR - 6}) rotate(${(i - 1) * 14})`} opacity={prog(frame, mess + i * 6, mess + i * 6 + 8)}>
          <rect x={-40} y={-10} width={80} height={10} fill={C.bone} stroke={C.ink} strokeWidth={2} />
        </g>
      ))}
      <Plate x={60} y={-520} text="CARI KERJA" k={pop(frame, job)} size={46} border={C.steel} />
      <Plate x={60} y={-400} text="HIDUP BERANTAKAN" k={pop(frame, mess)} size={40} border={C.red} />
    </Shot>
  );
};

/* 11 — The apology */
const Apology: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bow = at(10, 1);
  const say = at(10, 2);
  const standK = prog(frame, 6, 26);
  const bowK = prog(frame, bow, bow + 16);
  return (
    <Shot len={len} wall="#2B3440" z1={1.16}>
      <Bench x={300} y={FLOOR} facing={-1} />
      <Stickman x={-200} y={FLOOR} scale={ADULT} pose={idle(t)} look={HERO_BOSS} expr="neutral" />
      <Stickman x={150} y={FLOOR} scale={ADULT} facing={-1} pose={mix(mix(sit(t), idle(t), standK), bowing(t), bowK)} look={BULLY_ADULT} expr="sad" />
      <SpeechBubble x={150} y={-480} lines={["Maaf.", "Dulu aku salah."]} k={pop(frame, say)} tx={130} ty={-200} size={40} />
    </Shot>
  );
};

/* 12 — He could humiliate him */
const Power: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const back = at(11, 1);
  return (
    <Shot len={len} wall="#2A1416" z0={1.05} z1={1.22} handheld={1.0}>
      <Glow x={-150} y={-200} r={700} color={C.red} opacity={0.22 + 0.05 * Math.sin(t * 3)} />
      {/* his looming shadow */}
      <g opacity={0.35}>
        <Stickman x={-120} y={FLOOR} scale={2.4} pose={idle(t)} look={{top: "#000000", sleeve: "#000000", trousers: "#000000"}} expr="neutral" opacity={0.6} />
      </g>
      <Stickman x={-170} y={FLOOR} scale={ADULT} pose={idle(t)} look={HERO_BOSS} expr="smug" />
      <Stickman x={200} y={FLOOR} scale={ADULT} facing={-1} pose={bowing(t)} look={BULLY_ADULT} expr="sad" />
      <Plate x={-30} y={-540} text="PERMALUKAN?" k={pop(frame, 4)} size={46} border={C.red} color={C.red} />
      <Plate x={-30} y={-420} text="BALAS DENDAM?" k={pop(frame, back)} size={46} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 13 — A hand instead */
const Hand: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const said = at(12, 1);
  const reach = prog(frame, 6, 24, eOut);
  const rise = prog(frame, said, said + 30, eInOut);
  const heroPose = point(idle(t), reach, 70);
  return (
    <Shot len={len} wall="#2E2A26" z1={1.15}>
      <Glow x={0} y={-150} r={600} color={C.yellow} opacity={0.08 + 0.14 * rise} />
      <Stickman x={-150} y={FLOOR} scale={ADULT} pose={heroPose} look={HERO_BOSS} expr="calm" />
      <Stickman x={170} y={FLOOR} scale={ADULT} facing={-1} pose={mix(bowing(t), {...idle(t), shR: 70, elR: 10}, rise)} look={BULLY_ADULT} expr={rise > 0.6 ? "surprised" : "sad"} />
    </Shot>
  );
};

/* 14 — Walking away; memory of the crying boy */
const Realize: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const mem = at(13, 1);
  const x = lerp(-200, 180, frame / len);
  const memK = prog(frame, mem, mem + 20);
  return (
    <Shot len={len} wall="#1E2430" x0={-120} x1={120}>
      <Stickman x={x} y={FLOOR} scale={ADULT} pose={walk((x + 200) / STRIDE, t)} look={HERO_BOSS} expr="calm" />
      <g opacity={memK * 0.9} style={{filter: SEPIA}}>
        <circle cx={-100} cy={-420} r={190} fill="#3E352E" stroke={C.bone} strokeWidth={6} />
        <g transform="translate(-100 -420) translate(0 160)">
          <Stickman x={0} y={0} scale={KID} pose={{...slumped(t), lean: 20, headTilt: 26}} look={HERO_KID} expr="sad" />
          <Tears x={-8} y={-300} t={t} />
        </g>
      </g>
    </Shot>
  );
};

/* 15 — The strings snap */
const Free: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const power = at(14, 1);
  const snap = at(14, 2);
  const cut = prog(frame, snap, snap + 12);
  const lift = prog(frame, snap + 8, snap + 30, eOut);
  const anchors = [
    [-90, FLOOR - 320],
    [0, FLOOR - 420],
    [90, FLOOR - 320],
  ];
  return (
    <Shot len={len} wall="#1A1C24">
      <Glow x={0} y={-200} r={600} color={C.yellow} opacity={0.06 + 0.16 * lift} />
      <g opacity={prog(frame, 0, 10)}>
        {anchors.map(([ax, ay], i) => {
          const topY = -800;
          const endY = lerp(ay, ay - 260 - i * 30, cut);
          return (
            <g key={i}>
              <line x1={ax * 1.6} y1={topY} x2={ax * 1.6 + (ax - ax * 1.6) * (1 - cut)} y2={lerp(ay, topY + 140, cut)} stroke={C.red} strokeWidth={4} opacity={1 - cut * 0.4} />
              <line x1={ax} y1={ay} x2={ax} y2={endY} stroke={C.red} strokeWidth={4} opacity={(1 - cut) * 0.9} />
            </g>
          );
        })}
        <Plate x={0} y={-560} text="MASA LALU" k={pop(frame, power) * (1 - cut)} size={42} border={C.red} color={C.red} />
      </g>
      <Plate x={0} y={-560} text="BEBAS" k={pop(frame, snap + 14)} size={56} border={C.yellow} color={C.yellow} />
      <Stickman x={0} y={FLOOR} scale={ADULT} pose={mix({...slumped(t), shL: -40, elL: 20, shR: 40, elR: 20}, cheer(t), lift)} look={HERO_BOSS} expr={lift > 0.5 ? "happy" : "worried"} />
    </Shot>
  );
};

/* 16 — Into the sunrise */
const Sunrise16: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const x = lerp(-330, 60, clamp(frame / (len - 40)));
  const sun = prog(frame, 0, len - 30, eInOut);
  const fadeOut = prog(frame, len - 25, len);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#3A2A3E" z1={1.1} back={<SkyBand top={"#2A2440"} bottom={"#E89A6A"} />} floor>
        <Sunrise x={230} y={FLOOR} k={sun} r={140} />
        <Floor x0={-1400} x1={1400} />
        <Stickman x={x} y={FLOOR} scale={ADULT} pose={frame < len - 40 ? walk((x + 330) / STRIDE, t) : idle(t)} look={HERO_BOSS} expr="calm" />
      </Shot>
      <AbsoluteFill style={{background: "#000", opacity: fadeOut}} />
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Mocked, Classroom, Promise, Grind, Remember, TenYears, Wealth, Meet, Broken, Apology, Power, Hand, Realize, Free, Sunrise16];
const TRANSITIONS: TransitionKind[] = ["fade", "cut", "fade", "zoom", "fade", "whip", "zoom", "fade", "fade", "cut", "zoom", "fade", "fade", "fade", "fade"];

export const DendamFilm: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={D_SCENES}
    cues={D_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={D_SCENES[i].len} />;
    }}
  />
);
