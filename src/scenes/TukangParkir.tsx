import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Label, Monitor, OfficeChair, Wall} from "../environment/Furniture";
import {Car, House, SkyBand, StreetLamp} from "../environment/FamilyProps";
import {CitySkyline, Tears} from "../environment/MotherProps";
import {Stamp} from "../environment/MoneyProps";
import {Banknote} from "../environment/SpendProps";
import {handFolder, Laugh, SpeechBubble} from "../environment/StoryProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL, RoundGlasses, ShortHair} from "../rig/looks";
import {idle, mix, point, sit, STRIDE, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES as P_CUES, SCENES as P_SCENES} from "./parkirTiming";

/*
 * DIA MENGHINA TUKANG PARKIR — a 17-scene story (about 105 s).
 *   1 Hook: tossing money at a parking attendant; today asking him for a job
 *   2-3 A rich kid with an easy life who thinks low pay means failure
 *   4-5 The attendant returns a too-large tip; the kid laughs: "Your life won't get better"
 *   6-8 "Money isn't the measure of dignity." The kid treats it as a joke and drives off
 *   9-11 Five years later: bankrupt, car and house gone, friends gone; job hunting
 *   12-13 The interview door opens: the director is the attendant he insulted
 *   14-15 Red-faced, he waits for the insult; "Sit. We start from your experience, not your past."
 *   16 A handshake: people who were wrong can change
 *   17 Working in the office, helping a colleague
 * The attendant and the director wear the same round glasses so the twist reads visually.
 * Scene lengths and caption cues come from parkirTiming.ts.
 */

export {FRAMES as PARKIR_FRAMES} from "./parkirTiming";

const FIRST = [0, 4, 6, 9, 12, 15, 17, 19, 21, 23, 26, 28, 32, 33, 36, 39, 44];
const at = (i: number, j: number) => P_CUES[FIRST[i] + j].from - P_SCENES[i].from;

const pop = (frame: number, a: number) => {
  const k = clamp((frame - a) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

const AS = 1.35;
const SEPIA = "sepia(0.75) saturate(0.8) brightness(0.92)";

const GoldChain: React.FC = () => <path d="M -16 -26 Q 0 0 16 -26" fill="none" stroke={C.yellow} strokeWidth={4} />;
const Shades: React.FC = () => (
  <g>
    <rect x={-20} y={-10} width={16} height={10} rx={3} fill="#0E0F11" />
    <rect x={4} y={-10} width={16} height={10} rx={3} fill="#0E0F11" />
    <line x1={-4} y1={-6} x2={4} y2={-6} stroke="#0E0F11" strokeWidth={2} />
  </g>
);
const VestStripes: React.FC = () => (
  <g>
    <rect x={-22} y={0} width={44} height={6} fill="#E8E8E8" />
    <rect x={-22} y={16} width={44} height={6} fill="#E8E8E8" />
  </g>
);
const RICH: Look = {top: "#6A2C91", sleeve: "#6A2C91", trousers: "#1E1E24", chest: <GoldChain />, headExtra: (
  <g>
    <ShortHair color="#1E1A18" />
    <Shades />
  </g>
)};
const BROKE: Look = {top: "#5E6670", sleeve: "#5E6670", trousers: "#3A3D44", headExtra: <ShortHair color="#1E1A18" />};
const STAFF: Look = {top: "#E9E7DF", sleeve: "#E9E7DF", trousers: "#2E3135", tie: C.cyan, headExtra: <ShortHair color="#1E1A18" />};
const PARKIR: Look = {top: "#3A3F47", sleeve: "#3A3F47", coat: "#F39C12", trousers: "#2E3135", chest: <VestStripes />, hat: "cap", hatColor: "#2E3B4E", headExtra: <RoundGlasses />};
const DIREKTUR: Look = {top: "#E9E7DF", sleeve: "#2A2F3A", coat: "#2A2F3A", tie: C.red, trousers: "#2A2F3A", headExtra: (
  <g>
    <ShortHair color="#3A3430" />
    <RoundGlasses />
  </g>
)};

const Plate: React.FC<{x: number; y: number; text: string; k: number; size?: number; color?: string; border?: string; w?: number}> = ({x, y, text, k, size = 44, color = C.bone, border = C.yellow, w}) => {
  if (k <= 0) return null;
  const ww = w ?? text.length * size * 0.66 + size * 1.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-ww / 2} y={-size * 0.95} width={ww} height={size * 1.7} rx={size * 0.3} fill={C.charcoal} stroke={border} strokeWidth={6} />
      <Label x={0} y={size * 0.3} text={text} size={size} color={color} />
    </g>
  );
};

type ShotProps = {len: number; wall?: string; z0?: number; z1?: number; y0?: number; x0?: number; x1?: number; handheld?: number; filter?: string; back?: React.ReactNode; children: React.ReactNode};
const Shot: React.FC<ShotProps> = ({len, wall = "#26303A", z0 = 1.0, z1 = 1.13, y0 = 120, x0 = 0, x1 = 0, handheld = 0, filter, back, children}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: x0, y: y0, zoom: z0, rot: 0}],
    [len, {x: x1, y: y0 - 20, zoom: z1, rot: 0}],
  ]);
  return (
    <AbsoluteFill style={{filter}}>
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

const laughing = (t: number, seed = 0): Pose => ({...idle(t, seed), lean: -8 + Math.sin(t * 14 + seed) * 4, shL: -30, elL: 80, shR: 40, elR: 70, bob: -Math.abs(Math.sin(t * 12 + seed)) * 4});
const bowing = (t: number): Pose => ({...idle(t), lean: 30, headTilt: 26, shL: 10, shR: 10, lookY: 0.8});
const slumped = (t: number): Pose => ({...idle(t), lean: 12, headTilt: 18, shL: 4, shR: 8, lookY: 0.7});
const handNotes = () => (
  <g transform="translate(-6 -20)">
    <Banknote x={20} y={0} s={0.5} rot={-10} />
    <Banknote x={26} y={-8} s={0.5} rot={6} />
  </g>
);

/** Street at night with a lamp, used by the flashback scenes. */
const StreetBack: React.FC = () => (
  <g>
    <CitySkyline x0={-1200} x1={1200} y={FLOOR - 40} />
  </g>
);

/** A director's desk with a chair behind it; the director sits at cx. */
const DirectorDesk: React.FC<{cx: number; t: number; look?: Look; pose?: Partial<Pose>; expr?: "neutral" | "calm" | "happy" | "smug"}> = ({cx, t, look = DIREKTUR, pose = {}, expr = "calm"}) => {
  const chair = {x: cx + 70, floorY: FLOOR, facing: -1 as const, seat: 87};
  const seat = seatedAnchor(chair, AS);
  return (
    <g>
      <OfficeChair x={chair.x} y={FLOOR} facing={-1} seat={87} />
      <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={AS} facing={-1} pose={{...sit(t), ...pose}} look={look} expr={expr} footL={seat.footL} footR={seat.footR} />
      <Desk x={cx - 80} w={360} top={150} />
      <rect x={cx - 200} y={FLOOR - 190} width={100} height={36} rx={4} fill={C.charcoal} stroke={C.yellow} strokeWidth={3} />
      <Label x={cx - 150} y={FLOOR - 165} text="DIREKTUR" size={18} color={C.yellow} />
    </g>
  );
};

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const today = at(0, 2);
  const flash = Math.max(0, 1 - Math.abs(frame - (today - 4)) / 5);
  return (
    <AbsoluteFill>
      {frame < today - 4 ? (
        <Shot len={len} wall="#141822" handheld={0.5} back={<StreetBack />}>
          <StreetLamp x={-470} y={FLOOR} />
          <Car x={-330} y={FLOOR} s={0.75} lights={0} />
          <Stickman x={-90} y={FLOOR} scale={AS} pose={point(idle(t), prog(frame, 8, 18), 80)} look={RICH} expr="smug" />
          {[0, 1, 2, 3].map((i) => {
            const k = prog(frame, 12 + i * 4, 40 + i * 4, eOut);
            if (k <= 0) return null;
            return <Banknote key={i} x={lerp(-20, 220 + i * 30, k)} y={lerp(FLOOR - 300, FLOOR - 12 - i * 4, k) - Math.sin(k * Math.PI) * 120} s={0.6} rot={k * 400 + i * 50} />;
          })}
          <Stickman x={240} y={FLOOR} scale={AS} facing={-1} pose={slumped(t)} look={PARKIR} expr="sad" />
          <Plate x={0} y={-520} text="5 TAHUN LALU" k={pop(frame, 4)} size={46} border={C.bone} />
        </Shot>
      ) : (
        <Shot len={len} wall="#2A3340" z0={1.06} z1={1.16}>
          <DirectorDesk cx={200} t={t} />
          <Stickman x={-220} y={FLOOR} scale={AS} pose={bowing(t)} look={{...BROKE, handR: handFolder}} expr="worried" />
          <Plate x={0} y={-520} text="HARI INI" k={pop(frame, today)} size={50} border={C.cyan} />
        </Shot>
      )}
      <AbsoluteFill style={{background: "#FFFFFF", opacity: flash * 0.6}} />
    </AbsoluteFill>
  );
};

/* 2 — A rich kid */
const RichKid: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const easy = at(1, 1);
  const out = prog(frame, 4, 30, eOut);
  return (
    <Shot len={len} wall="#5B87B0" back={<SkyBand top="#3C6E9E" bottom="#BFD9EA" />}>
      <Car x={-260} y={FLOOR} s={0.85} lights={0} />
      <Stickman x={lerp(-160, -20, out)} y={FLOOR} scale={AS} pose={walk(out * 1.2, t)} look={RICH} expr="smug" />
      <Stickman x={260} y={FLOOR} scale={AS} facing={-1} pose={point(idle(t), 1, 60 + Math.sin(t * 5) * 20)} look={PARKIR} expr="happy" />
      <Plate x={-60} y={-520} text="ANAK ORANG KAYA" k={pop(frame, 6)} size={44} />
      <Plate x={-60} y={-400} text="HIDUP MUDAH" k={pop(frame, easy)} size={40} border={C.cyan} />
    </Shot>
  );
};

/* 3 — Low pay means failure */
const Belief: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const fail = at(2, 2);
  return (
    <Shot len={len} wall="#5B87B0" back={<SkyBand top="#3C6E9E" bottom="#BFD9EA" />} z1={1.16}>
      <Stickman x={-200} y={FLOOR} scale={AS} pose={point(idle(t), prog(frame, 8, 20), 95)} look={RICH} expr="smug" />
      <Stickman x={230} y={FLOOR} scale={AS} facing={-1} pose={idle(t, 2)} look={PARKIR} expr="neutral" />
      <Plate x={230} y={-400} text="GAJI KECIL" k={pop(frame, 10)} size={38} border={C.steel} />
      <Stamp x={230} y={-260} text="GAGAL?" k={prog(frame, fail, fail + 10, eOut)} rot={-8} size={50} />
    </Shot>
  );
};

/* 4 — The tip returned */
const ReturnTip: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const laugh = at(3, 2);
  return (
    <Shot len={len} wall="#141822" back={<StreetBack />}>
      <StreetLamp x={470} y={FLOOR} />
      <Stickman x={-200} y={FLOOR} scale={AS} pose={frame > laugh ? laughing(t) : idle(t)} look={RICH} expr={frame > laugh ? "happy" : "neutral"} />
      <Stickman x={180} y={FLOOR} scale={AS} facing={-1} pose={point(idle(t), 1, 85)} look={{...PARKIR, handR: handNotes}} expr="calm" />
      <Laugh x={-200} y={FLOOR - 420} t={t} k={pop(frame, laugh + 4)} />
      <Plate x={0} y={-520} text="TIP TERLALU BESAR" k={pop(frame, 6)} size={40} border={C.yellow} />
    </Shot>
  );
};

/* 5 — "Your life won't get better" */
const Insult: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const l2 = at(4, 1);
  const drop = prog(frame, 8, 34, eInOut);
  return (
    <Shot len={len} wall="#141822" back={<StreetBack />} z1={1.18} handheld={0.4}>
      <Stickman x={-200} y={FLOOR} scale={AS} pose={laughing(t)} look={RICH} expr="smug" />
      <Stickman x={200} y={FLOOR} scale={AS} facing={-1} pose={idle(t)} look={PARKIR} expr="neutral" />
      {[0, 1, 2].map((i) => (
        <Banknote key={i} x={lerp(170, 120 + i * 50, drop)} y={lerp(FLOOR - 220, FLOOR - 10, drop)} s={0.55} rot={drop * 200 + i * 60} />
      ))}
      <SpeechBubble x={-160} y={-490} lines={frame < l2 - 4 ? ["Ambil saja."] : ["Hidupmu tidak akan", "lebih baik dari ini."]} k={pop(frame, 4)} tx={-190} ty={-160} size={38} />
    </Shot>
  );
};

/* 6 — He isn't angry */
const Calm: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <Shot len={len} wall="#141822" back={<StreetBack />} z1={1.2} x1={80}>
      <Glow x={180} y={-150} r={420} color={C.yellow} opacity={0.08} />
      <Stickman x={-220} y={FLOOR} scale={AS} pose={idle(t)} look={RICH} expr="smug" />
      <Stickman x={190} y={FLOOR} scale={AS} facing={-1} pose={idle(t, 3)} look={PARKIR} expr="calm" />
      <Plate x={190} y={-480} text="TIDAK MARAH" k={pop(frame, 6)} size={40} border={C.olive} />
    </Shot>
  );
};

/* 7 — "Money isn't the measure of dignity" */
const Dignity: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const l2 = at(6, 1);
  return (
    <Shot len={len} wall="#141822" back={<StreetBack />} z1={1.16} x1={60}>
      <Glow x={180} y={-150} r={460} color={C.yellow} opacity={0.12} />
      <Stickman x={-220} y={FLOOR} scale={AS} pose={idle(t)} look={RICH} expr="neutral" />
      <Stickman x={190} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t, 3), shR: 30, elR: 90}} look={PARKIR} expr="calm" />
      <SpeechBubble x={130} y={-480} lines={frame < l2 - 4 ? ["Semoga suatu hari", "kamu mengerti..."] : ["Uang bukan ukuran", "harga diri."]} k={pop(frame, 4)} tx={180} ty={-160} size={38} />
    </Shot>
  );
};

/* 8 — A joke; he drives off */
const Joke: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const go = prog(frame, 20, len - 10, eInOut);
  return (
    <Shot len={len} wall="#141822" back={<StreetBack />}>
      <StreetLamp x={-470} y={FLOOR} />
      <Car x={lerp(-160, 900, go)} y={FLOOR} s={0.85} lights={1} />
      <Laugh x={lerp(-160, 900, go)} y={FLOOR - 260} t={t} k={pop(frame, 6) * (1 - go)} />
      <Stickman x={300} y={FLOOR} scale={AS} facing={1} pose={point(idle(t), 1, 60 + Math.sin(t * 4) * 25)} look={PARKIR} expr="calm" />
    </Shot>
  );
};

/* 9 — Bankrupt */
const Bankrupt: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const crash = at(8, 1);
  const k = prog(frame, crash - 6, crash + 30, eInOut);
  const pts = Array.from({length: 7}, (_, i) => {
    const x = -300 + i * 100;
    const up = -280 - i * 40;
    const down = -280 - 3 * 40 + (i - 3) * 70;
    const y = i <= 3 ? up : lerp(up, down, k);
    return `${x} ${y}`;
  });
  return (
    <Shot len={len} wall="#2A2226" handheld={0.6}>
      <Plate x={0} y={-560} text="5 TAHUN KEMUDIAN" k={pop(frame, 4)} size={42} border={C.bone} />
      <line x1={-330} y1={-160} x2={330} y2={-160} stroke={C.bone} strokeWidth={4} opacity={0.6} />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke={k > 0.3 ? C.red : "#5E9347"} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <g opacity={prog(frame, crash + 10, crash + 16)}>
        <rect x={-30} y={-385} width={360} height={110} rx={14} fill="#2A2226" transform="rotate(-10 150 -330)" />
      </g>
      <Stamp x={150} y={-330} text="BANGKRUT" k={prog(frame, crash + 10, crash + 20, eOut)} rot={-10} size={56} />
      <Stickman x={-60} y={FLOOR} scale={AS} pose={mix(idle(t), {...idle(t), shL: -150, elL: 30, shR: 150, elR: 30, lean: -6}, prog(frame, crash, crash + 12))} look={BROKE} expr="surprised" />
    </Shot>
  );
};

/* 10 — Losing everything */
const Losses: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const friends = at(9, 1);
  const leave = prog(frame, friends, friends + 50);
  return (
    <Shot len={len} wall="#1C2028">
      <g transform={`translate(-250 ${FLOOR}) scale(0.5)`} opacity={0.7}>
        <House x={0} y={0} night={1} />
      </g>
      <Car x={250} y={FLOOR} s={0.65} lights={0} />
      <Stamp x={-250} y={-260} text="DISITA" k={prog(frame, 8, 18, eOut)} rot={-8} size={40} />
      <Stamp x={250} y={-180} text="DIJUAL" k={prog(frame, 18, 28, eOut)} rot={8} size={40} />
      {[0, 1].map((i) => (
        <Stickman key={i} x={lerp(80 + i * 110, 600 + i * 110, leave)} y={FLOOR} scale={1.15} facing={1} pose={walk(leave * 6 + i * 0.5, t)} look={{...CASUAL, top: ["#8E3E6E", "#3E8E6E"][i], sleeve: ["#8E3E6E", "#3E8E6E"][i]}} expr="neutral" opacity={prog(frame, friends - 10, friends) * (1 - prog(frame, friends + 30, friends + 50))} />
      ))}
      <Stickman x={-40} y={FLOOR} scale={AS} pose={slumped(t)} look={BROKE} expr="sad" />
    </Shot>
  );
};

/* 11 — Job hunting for the first time */
const JobHunt: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const x = lerp(-300, 200, frame / len);
  return (
    <Shot len={len} wall="#3A4A5E" back={<CitySkyline x0={-1200} x1={1200} y={FLOOR - 20} />} x0={-60} x1={80}>
      <Stickman x={x} y={FLOOR} scale={AS} pose={{...walk((x + 300) / STRIDE, t), shR: 50, elR: 60}} look={{...BROKE, handR: handFolder}} expr="worried" />
      <Plate x={0} y={-520} text="MENCARI KERJA" k={pop(frame, 8)} size={44} border={C.cyan} />
    </Shot>
  );
};

/* 12 — The door opens */
const Door: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const open = at(11, 2);
  const see = at(11, 3);
  const ok = prog(frame, open, open + 24, eInOut);
  return (
    <Shot len={len} wall="#2A3340" z1={1.1}>
      <g opacity={ok}>
        <DirectorDesk cx={220} t={t} />
      </g>
      {/* door panel swinging away */}
      <g transform={`translate(-20 0) scale(${1 - ok * 0.9} 1)`}>
        <rect x={0} y={-460} width={460} height={880} fill="#6A4A30" stroke={C.ink} strokeWidth={4} />
        <circle cx={40} cy={0} r={10} fill={C.yellow} />
      </g>
      <Plate x={-180} y={-520} text="WAWANCARA" k={pop(frame, 6)} size={40} border={C.cyan} />
      <Stickman x={-300} y={FLOOR} scale={AS} pose={{...idle(t), shR: 50, elR: 60}} look={{...BROKE, handR: handFolder}} expr={frame > see ? "surprised" : "neutral"} />
    </Shot>
  );
};

/* 13 — The man he insulted */
const Recognize: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const past = 0.5 + 0.5 * Math.sin(clamp((frame - 10) / (len - 30)) * Math.PI * 3 - Math.PI / 2);
  return (
    <Shot len={len} wall="#2A3340" z0={1.1} z1={1.3} x0={120} x1={160}>
      <DirectorDesk cx={220} t={t} expr="neutral" />
      <g opacity={past}>
        <DirectorDesk cx={220} t={t} look={PARKIR} expr="neutral" />
      </g>
      <g transform={`translate(-120 -260) scale(${pop(frame, 6)})`}>
        <Label x={0} y={0} text="!" size={160} color={C.red} />
      </g>
      <Stickman x={-160} y={FLOOR} scale={AS} pose={idle(t)} look={BROKE} expr="surprised" />
    </Shot>
  );
};

/* 14 — Red-faced, waiting for the insult */
const Shame: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const red = at(13, 1);
  const wait = at(13, 2);
  return (
    <Shot len={len} wall="#2A2226" z1={1.18}>
      <Glow x={-200} y={-100} r={500} color={C.red} opacity={0.2 * prog(frame, red, red + 16)} />
      <DirectorDesk cx={220} t={t} expr="neutral" />
      <Stickman x={-220} y={FLOOR} scale={AS} pose={bowing(t)} look={BROKE} expr="worried" />
      <g transform={`translate(-170 ${FLOOR - 300})`} opacity={prog(frame, red, red + 10)}>
        <circle cx={-12} cy={0} r={10} fill={C.red} opacity={0.6} />
        <circle cx={18} cy={2} r={10} fill={C.red} opacity={0.6} />
      </g>
      <g opacity={prog(frame, wait, wait + 20)} style={{filter: SEPIA}}>
        <circle cx={-120} cy={-460} r={140} fill="#4A4038" stroke={C.bone} strokeWidth={6} />
        <g transform="translate(-120 -460) scale(0.5) translate(0 240)">
          <Stickman x={-110} y={0} scale={AS} pose={laughing(t)} look={RICH} expr="smug" />
          <Stickman x={120} y={0} scale={AS} facing={-1} pose={idle(t)} look={PARKIR} expr="calm" />
        </g>
      </g>
    </Shot>
  );
};

/* 15 — "Sit." */
const Sit: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const say = at(14, 1);
  const past = at(14, 2);
  const sitK = prog(frame, past, past + 30);
  const chair = {x: -260, floorY: FLOOR, facing: 1 as const, seat: 87};
  const seat = seatedAnchor(chair, AS);
  return (
    <Shot len={len} wall="#2A3340" z1={1.14}>
      <Glow x={200} y={-150} r={460} color={C.yellow} opacity={0.1} />
      <DirectorDesk cx={220} t={t} pose={{shL: 50, elL: 30}} expr="calm" />
      <OfficeChair x={chair.x} y={FLOOR} facing={1} seat={87} />
      {sitK < 0.5 ? (
        <Stickman x={-160} y={FLOOR} scale={AS} pose={bowing(t)} look={BROKE} expr="worried" />
      ) : (
        <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={AS} facing={1} pose={sit(t)} look={BROKE} expr="surprised" footL={seat.footL} footR={seat.footR} />
      )}
      <SpeechBubble x={170} y={-480} lines={frame < past - 4 ? ["Duduk.", "Kita mulai dari", "pengalamanmu."] : ["Bukan dari", "masa lalumu."]} k={pop(frame, say)} tx={190} ty={-150} size={38} />
    </Shot>
  );
};

/* 16 — A handshake */
const Chance: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const change = at(15, 3);
  const reach = prog(frame, 6, 26, eOut);
  return (
    <Shot len={len} wall="#2E2A26" z1={1.16}>
      <Glow x={0} y={-150} r={600} color={C.yellow} opacity={0.08 + 0.14 * prog(frame, change, change + 30)} />
      <Stickman x={-160} y={FLOOR} scale={AS} pose={point(idle(t), reach, 72)} look={BROKE} expr="sad" />
      <Tears x={-150} y={FLOOR - 270} t={t} />
      <Stickman x={160} y={FLOOR} scale={AS} facing={-1} pose={point(idle(t), reach, 72)} look={DIREKTUR} expr="happy" />
      <Plate x={0} y={-520} text="KESEMPATAN" k={pop(frame, 6)} size={46} />
      <Plate x={0} y={-400} text="BISA BERUBAH" k={pop(frame, change + 6)} size={40} border={C.olive} />
    </Shot>
  );
};

/* 17 — Working, helping a colleague */
const Office: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const fade = prog(frame, len - 24, len);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#E6E2D8" z1={1.1}>
        <Desk x={40} w={380} top={150} />
        <Monitor x={60} y={FLOOR - 150 - 38} w={200} h={130} screen={<g>{[0, 1, 2, 3].map((i) => <rect key={i} x={14} y={16 + i * 24} width={50 + ((i * 47 + Math.floor(t * 4) * 29) % 110)} height={10} rx={3} fill={i % 2 ? C.yellow : C.cyan} />)}</g>} />
        <Stickman x={-260} y={FLOOR} scale={AS} pose={point(idle(t), 1, 100)} look={STAFF} expr="happy" />
        <Stickman x={230} y={FLOOR} scale={AS} facing={-1} pose={idle(t, 4)} look={{...CASUAL, top: "#6B8E3E", sleeve: "#6B8E3E"}} expr="happy" />
        <g opacity={0.8}>
          <Stickman x={400} y={FLOOR} scale={1.1} facing={-1} pose={{...idle(t, 6), headTilt: Math.sin(t * 2) * 6}} look={DIREKTUR} expr="happy" />
        </g>
      </Shot>
      <AbsoluteFill style={{background: "#000", opacity: fade}} />
    </AbsoluteFill>
  );
};

const SCENES = [Hook, RichKid, Belief, ReturnTip, Insult, Calm, Dignity, Joke, Bankrupt, Losses, JobHunt, Door, Recognize, Shame, Sit, Chance, Office];
const TRANSITIONS: TransitionKind[] = ["fade", "cut", "fade", "cut", "fade", "cut", "fade", "fade", "fade", "fade", "fade", "cut", "fade", "fade", "fade", "fade"];

export const TukangParkir: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={P_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={P_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={P_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
