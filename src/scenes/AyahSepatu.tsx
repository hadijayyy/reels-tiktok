import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {ANAK, AYAH, Motorbike, PhotoFrame, SideChair, SkyBand} from "../environment/FamilyProps";
import {Tears} from "../environment/MotherProps";
import {SkyWindow} from "../environment/SleepProps";
import {Banknote, Sneaker} from "../environment/SpendProps";
import {SpeechBubble} from "../environment/StoryProps";
import {BudgetSheet, DeskLamp, GiftBox, GradPhoto, handNeedle, handWallet, KeepBox, NoteCard, OldShoe, Receipts, SchoolBag, Shirt, ToyCar, Wardrobe} from "../environment/FatherProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL} from "../rig/looks";
import {cheer, idle, mix, point, sit, STRIDE, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {C, FONT, FPS} from "../styles/palette";
import {CUES as A_CUES, SCENES as A_SCENES} from "./ayahsepatuTiming";

/*
 * AYAHNYA TIDAK PERNAH MEMBELI APA PUN UNTUK DIRINYA — an 18-scene family story (about 110 s).
 *   1 Hook: "stingy" father; years later the son cries at the wardrobe   10 Years later: a box in the wardrobe
 *   2 The child asks; father checks his wallet, then nods                11 The old shoe and the note
 *   3 "Ayah masih punya yang lama."                                       12 School receipts and the graduation photo
 *   4 The child never thought about it                                    13 He finally understands
 *   5 The worn sole, the shirt he mends himself                           14 He buys his father new shoes
 *   6 Counting money every night                                          15 "Kenapa mahal-mahal?"
 *   7 The monthly list: electricity, school, food                         16 That night: trying them on, again and again
 *   8 The one item he always crosses out: himself                         17 Walking side by side
 *   9 Postponing shoes, the motorbike, everything                         18 When did you last thank your father?
 * Scene lengths and caption cues come from ayahsepatuTiming.ts.
 */

export {FRAMES as AYAHSEPATU_FRAMES} from "./ayahsepatuTiming";

const FIRST = [0, 4, 7, 11, 14, 17, 20, 23, 26, 29, 33, 37, 40, 46, 49, 52, 55, 58];
const at = (i: number, j: number) => A_CUES[FIRST[i] + j].from - A_SCENES[i].from;

const pop = (frame: number, a: number) => {
  const k = clamp((frame - a) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

const Patch: React.FC = () => <rect x={-4} y={4} width={18} height={16} fill="#8A7A60" stroke={C.ink} strokeWidth={2} transform="rotate(-8)" />;
const FATHER: Look = {...AYAH, chest: <Patch />, shoe: "#4A3424"};
const FATHER_NEW: Look = {...AYAH, shoe: "#111113"};
const KID: Look = ANAK;
const SON: Look = {...CASUAL, top: "#3E6E8E", sleeve: "#3E6E8E"};
const KS = 0.95; // child scale
const AS = 1.4; // adult scale
const WARM = "#3A2C22";
const NIGHT = "#161B2A";

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
const Shot: React.FC<ShotProps> = ({len, wall = WARM, z0 = 1.0, z1 = 1.13, y0 = 120, x0 = 0, x1 = 0, handheld = 0, filter, back, children}) => {
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

const Flash: React.FC<{frame: number; at: number[]}> = ({frame, at: points}) => {
  const k = Math.max(0, ...points.map((p) => 1 - Math.abs(frame - p) / 5));
  return <AbsoluteFill style={{background: "#FFFFFF", opacity: k * 0.6, pointerEvents: "none"}} />;
};

const kneel = (t: number): Pose => ({...idle(t), lean: 30, headTilt: 26, shL: 40, elL: 50, shR: 46, elR: 50, lookY: 0.8});

/** A kneeling figure: pelvis low, both feet planted behind on the floor. (x, FLOOR) is under the knees. */
const Kneeling: React.FC<{x: number; t: number; look: Look; scale?: number}> = ({x, t, look, scale = AS}) => (
  <Stickman x={x} y={FLOOR - 62 * scale} anchor="hip" scale={scale} pose={kneel(t)} look={look} expr="sad" footL={{x: x - 70 * scale, y: FLOOR}} footR={{x: x - 50 * scale, y: FLOOR}} />
);
const tired = (t: number): Pose => ({...idle(t), lean: 8, headTilt: 10, lookY: 0.4});

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const door = at(0, 1);
  const cry = at(0, 3);
  const phase = frame < door - 4 ? 0 : frame < cry - 4 ? 1 : 2;
  return (
    <AbsoluteFill>
      {phase === 0 ? (
        <Shot len={len}>
          <Glow x={0} y={-100} r={600} color={C.yellow} opacity={0.12} />
          <Stickman x={-220} y={FLOOR} scale={KS} pose={cheer(t)} look={KID} expr="happy" />
          <GiftBox x={-30} y={FLOOR} s={1.0} open={prog(frame, 6, 26, eOut)} />
          <Stickman x={260} y={FLOOR} scale={AS} facing={-1} pose={idle(t)} look={FATHER} expr="happy" />
          <OldShoe x={380} y={FLOOR - 4} s={0.7} flap={0.6 + Math.sin(t * 3) * 0.2} flip />
          <Plate x={250} y={-470} text="PELIT?" k={pop(frame, 8)} size={56} border={C.red} />
        </Shot>
      ) : null}
      {phase >= 1 ? (
        <Shot len={len} wall="#14161E" z0={1.05} z1={1.2}>
          <Wardrobe x={120} y={FLOOR} s={1.0} open={prog(frame, door, door + 30, eInOut)}>
            <KeepBox x={0} y={-30} s={0.6} />
          </Wardrobe>
          <Glow x={120} y={-200} r={420} color="#F6C76B" opacity={0.15 * prog(frame, door, door + 30)} />
          {phase === 1 ? (
            <Stickman x={-200} y={FLOOR} scale={AS} pose={point(idle(t), prog(frame, door, door + 16), 80)} look={SON} expr="neutral" />
          ) : (
            <g>
              <Kneeling x={-160} t={t} look={SON} />
              <Tears x={-150} y={FLOOR - 270} t={t} />
            </g>
          )}
        </Shot>
      ) : null}
      <Flash frame={frame} at={[door - 4, cry - 4]} />
    </AbsoluteFill>
  );
};

/* 2 — The child asks */
const Asks: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const yes = at(1, 1);
  const items = at(1, 2);
  const nod = frame > yes && frame < yes + 30 ? Math.sin((frame - yes) * 0.6) * 10 : 0;
  return (
    <Shot len={len}>
      <Stickman x={-260} y={FLOOR} scale={KS} pose={point(idle(t), 1, 140)} look={KID} expr="happy" />
      <Stickman x={180} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t), shR: 60, elR: 60, headTilt: 12 + nod, lookY: frame < yes ? 0.8 : 0}} look={{...FATHER, handR: handWallet}} expr={frame < yes ? "worried" : "happy"} />
      <g transform={`translate(-320 -280) scale(${pop(frame, items)})`}>
        <Sneaker x={0} y={0} s={0.9} />
      </g>
      <g transform={`translate(-60 -250) scale(${pop(frame, items + 10)})`}>
        <SchoolBag x={0} y={0} s={0.9} />
      </g>
      <g transform={`translate(200 -260) scale(${pop(frame, items + 20)})`}>
        <ToyCar x={0} y={0} s={1.0} />
      </g>
    </Shot>
  );
};

/* 3 — "Ayah masih punya yang lama." */
const OldClothes: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ask = at(2, 1);
  const say = at(2, 3);
  return (
    <Shot len={len} z1={1.18} x1={80}>
      <Stickman x={-230} y={FLOOR} scale={KS} pose={point(idle(t), prog(frame, ask, ask + 12), 100)} look={KID} expr="neutral" />
      <Stickman x={170} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t), lookY: 0.6, headTilt: 14}} look={FATHER} expr="calm" />
      <g opacity={prog(frame, ask + 6, ask + 16) * (1 - prog(frame, say - 6, say))}>
        <circle cx={170} cy={FLOOR - 300} r={70} fill="none" stroke={C.yellow} strokeWidth={5} strokeDasharray="10 8" />
      </g>
      <SpeechBubble x={150} y={-470} lines={["Ayah masih punya", "yang lama."]} k={pop(frame, say)} tx={150} ty={-160} size={40} />
    </Shot>
  );
};

/* 4 — The child never thought about it */
const Carefree: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const why = at(3, 1);
  return (
    <Shot len={len}>
      <g opacity={0.6}>
        <SideChair x={330} y={FLOOR} facing={-1} />
        <Stickman x={300} y={FLOOR} scale={1.2} facing={-1} pose={tired(t)} look={FATHER} expr="calm" />
      </g>
      <ToyCar x={lerp(-380, 60, (Math.sin(t * 1.2) + 1) / 2)} y={FLOOR} s={0.9} />
      <Stickman x={-160} y={FLOOR} scale={KS} pose={cheer(t)} look={{...KID, shoe: C.cyan}} expr="happy" />
      <Plate x={-60} y={-470} text="TIDAK SUKA BELANJA?" k={pop(frame, why)} size={40} border={C.steel} />
    </Shot>
  );
};

/* 5 — The worn sole and the mended shirt */
const Worn: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const sole = at(4, 1);
  const sew = at(4, 2);
  return (
    <Shot len={len} wall="#2E2620" z1={1.12}>
      <g transform={`translate(-150 -330) scale(${pop(frame, sole - 6)})`}>
        <rect x={-200} y={-150} width={400} height={200} rx={20} fill="#211A15" stroke={C.ink} strokeWidth={4} />
        <OldShoe x={-10} y={20} s={1.9} flap={0.5 + 0.5 * Math.abs(Math.sin(t * 2.4))} />
      </g>
      <Stickman x={180} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t), shR: 70, elR: 60, shL: 60, elL: 60, headTilt: 18, lookY: 0.8}} look={{...FATHER, handR: handNeedle}} expr="focused" />
      <g transform={`translate(80 ${FLOOR - 230}) scale(${pop(frame, sew)})`}>
        <Shirt x={0} y={0} s={0.7} stitch={prog(frame, sew + 10, len - 10)} />
      </g>
    </Shot>
  );
};

/* 6 — Counting money every night */
const Counting: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const count = at(5, 1);
  const chair = {x: -250, floorY: FLOOR, facing: 1 as const, seat: 87};
  const seat = seatedAnchor(chair, 1.3);
  const notes = Math.min(5, Math.floor(clamp((frame - count) / 50) * 6));
  return (
    <Shot len={len} wall={NIGHT} z1={1.16}>
      <SkyWindow x={300} y={-300} />
      <SideChair x={chair.x} y={FLOOR} facing={1} />
      <Desk x={20} w={420} top={150} />
      <DeskLamp x={170} y={FLOOR - 150} />
      {Array.from({length: notes}, (_, i) => (
        <Banknote key={i} x={-20 + (i % 3) * 30} y={FLOOR - 160 - i * 6} s={0.7} rot={(i - 2) * 8} />
      ))}
      <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={1.3} pose={{...sit(t), lean: 14, headTilt: 18, lookY: 0.8, shR: 60 + Math.sin(t * 6) * 6, elR: 40, shL: 56, elL: 46}} look={FATHER} expr="worried" footL={seat.footL} footR={seat.footR} />
      {/* wall clock: late */}
      <g transform="translate(-60 -470)">
        <circle r={56} fill={C.bone} stroke={C.ink} strokeWidth={5} />
        <line x1={0} y1={0} x2={0} y2={-38} stroke={C.ink} strokeWidth={5} strokeLinecap="round" transform={`rotate(${t * 40})`} />
        <line x1={0} y1={0} x2={-20} y2={-10} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      </g>
    </Shot>
  );
};

const ROWS = ["LISTRIK", "SEKOLAH ANAK", "MAKAN", "SEPATU AYAH"];

/* 7 — The monthly list */
const List: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const items = at(6, 2);
  const shown = [prog(frame, items, items + 8), prog(frame, items + 12, items + 20), prog(frame, items + 24, items + 32), 0];
  return (
    <Shot len={len} wall={NIGHT}>
      <BudgetSheet x={80} y={-470} rows={ROWS} shown={shown} s={1.0} />
      <Stickman x={-340} y={FLOOR} scale={AS} pose={point(idle(t), 1, 120)} look={FATHER} expr="focused" />
    </Shot>
  );
};

/* 8 — The one item he crosses out */
const Strike: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const out = at(7, 1);
  const self = at(7, 2);
  return (
    <Shot len={len} wall={NIGHT} z1={1.18} x1={60}>
      <BudgetSheet x={80} y={-470} rows={ROWS} shown={[1, 1, 1, prog(frame, 4, 14)]} strike={prog(frame, out, out + 18, eOut)} strikeRow={3} s={1.0} />
      <Stickman x={-340} y={FLOOR} scale={AS} pose={mix(point(idle(t), 1, 120), tired(t), prog(frame, self, self + 20))} look={FATHER} expr="calm" />
      <Plate x={80} y={-40} text="DIRINYA SENDIRI" k={pop(frame, self)} size={44} border={C.red} />
    </Shot>
  );
};

/* 9 — Postponing everything */
const Postpone: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bike = at(8, 1);
  const all = at(8, 2);
  const x = lerp(-120, 80, frame / len);
  return (
    <Shot len={len} wall="#2B3440" x0={-40} x1={60}>
      <Motorbike x={x + 210} y={FLOOR} s={1.0} />
      <Stickman x={x} y={FLOOR} scale={AS} pose={{...walk((x + 120) / STRIDE, t), shR: 70, elR: 10, shL: 66, elL: 14, lean: 14}} look={FATHER} expr="sad" />
      <Plate x={-250} y={-520} text="SEPATU: NANTI" k={pop(frame, 4)} size={38} border={C.steel} />
      <Plate x={230} y={-420} text="MOTOR: NANTI" k={pop(frame, bike)} size={38} border={C.steel} />
      <Plate x={-60} y={-320} text="SEMUA: NANTI" k={pop(frame, all)} size={38} border={C.steel} />
    </Shot>
  );
};

/* 10 — Years later: the box */
const YearsLater: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const grown = at(9, 1);
  const find = at(9, 2);
  const open = prog(frame, find - 10, find + 20, eInOut);
  return (
    <Shot len={len} wall="#1C1E26" z1={1.15} x1={80}>
      <Plate x={0} y={-560} text="BERTAHUN-TAHUN KEMUDIAN" k={pop(frame, 4) * (1 - prog(frame, grown + 20, grown + 30))} size={38} border={C.bone} />
      <Wardrobe x={180} y={FLOOR} open={open}>
        <KeepBox x={0} y={-30} s={0.6} />
      </Wardrobe>
      <Glow x={180} y={-220} r={380} color="#F6C76B" opacity={0.15 * open} />
      <Stickman x={-220} y={FLOOR} scale={AS} pose={point(idle(t), prog(frame, find, find + 14), 70)} look={SON} expr={open > 0.6 ? "surprised" : "neutral"} opacity={prog(frame, grown - 10, grown + 6)} />
    </Shot>
  );
};

/* 11 — The old shoe and the note */
const Note: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const note = at(10, 1);
  const read = at(10, 2);
  return (
    <Shot len={len} wall="#241E1A" z1={1.1}>
      <Glow x={60} y={-150} r={500} color="#F6C76B" opacity={0.14} />
      <KeepBox x={110} y={FLOOR} s={1.1} open={1}>
        <OldShoe x={-40} y={-120} s={1.3} flap={0.4} />
      </KeepBox>
      <Stickman x={-330} y={FLOOR} scale={AS} pose={{...idle(t), shR: 70, elR: 40, lookY: 0.4}} look={SON} expr="sad" />
      <NoteCard x={60} y={-470} lines={frame >= read - 4 ? ["Sepatu ini masih bisa dipakai.", "Uang lebih baik", "untuk sekolah anak."] : [" ", " ", " "]} k={pop(frame, note)} size={32} />
    </Shot>
  );
};

/* 12 — Receipts and the graduation photo */
const Receipts12: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const fees = at(11, 1);
  const photo = at(11, 2);
  return (
    <Shot len={len} wall="#241E1A" z1={1.15} x1={60}>
      <Glow x={100} y={-200} r={520} color="#F6C76B" opacity={0.12 + 0.1 * prog(frame, photo, photo + 20)} />
      <g transform={`translate(-60 -300) scale(${pop(frame, 4)})`}>
        <Receipts x={0} y={0} n={7} s={1.3} />
      </g>
      <g opacity={prog(frame, fees, fees + 10)}>
        <Label x={-60} y={-470} text="UANG SEKOLAH" size={34} color={C.bone} />
      </g>
      <g transform={`translate(240 -300) scale(${pop(frame, photo)})`}>
        <GradPhoto x={0} y={0} s={1.3} rot={4} />
      </g>
      <Stickman x={-330} y={FLOOR} scale={AS} pose={{...idle(t), shR: 50, elR: 60, lookY: 0.2}} look={SON} expr="sad" />
    </Shot>
  );
};

/* 13 — He understands */
const Understand: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const know = at(12, 1);
  const deeper = at(12, 4);
  const shoeInHand = () => (
    <g transform="translate(-10 -10)">
      <OldShoe x={0} y={0} s={0.55} flap={0.3} />
    </g>
  );
  return (
    <Shot len={len} wall="#1E1A18" z0={1.05} z1={1.25}>
      <Glow x={0} y={-100} r={600} color="#F6C76B" opacity={0.1 + 0.18 * prog(frame, deeper, deeper + 40)} />
      <g opacity={0.25 * prog(frame, know, know + 30)}>
        <PhotoFrame x={-250} y={-420} s={1.3} rot={-4} />
      </g>
      <Kneeling x={60} t={t} look={{...SON, handR: shoeInHand}} />
      <Tears x={70} y={FLOOR - 270} t={t} />
    </Shot>
  );
};

/* 14 — He buys new shoes */
const Buy: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const home = at(13, 1);
  const give = at(13, 2);
  const x = lerp(-420, -120, prog(frame, home, give + 10));
  const boxInHand = () => (
    <g transform="translate(-20 10)">
      <GiftBox x={0} y={0} s={0.45} color="#2E2E36" />
    </g>
  );
  return (
    <Shot len={len} wall="#2E3440">
      <Stickman x={x} y={FLOOR} scale={AS} pose={frame < give ? {...walk((x + 420) / STRIDE, t), shR: 60, elR: 60} : point(idle(t), 1, 75)} look={{...SON, handR: boxInHand}} expr="happy" />
      <Stickman x={230} y={FLOOR} scale={AS} facing={-1} pose={tired(t)} look={FATHER} expr={frame > give ? "surprised" : "neutral"} opacity={prog(frame, give - 20, give)} />
      <Plate x={0} y={-500} text="SEPATU BARU" k={pop(frame, give)} size={44} />
    </Shot>
  );
};

/* 15 — "Kenapa mahal-mahal?" */
const Laugh15: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ask = at(14, 1);
  const shoeInHand = () => (
    <g transform="translate(-20 -10)">
      <OldShoe x={0} y={0} s={0.6} fresh />
    </g>
  );
  return (
    <Shot len={len} wall="#2E3440" z1={1.16} x1={40}>
      <Glow x={160} y={-150} r={420} color={C.yellow} opacity={0.12} />
      <Stickman x={-220} y={FLOOR} scale={AS} pose={idle(t)} look={SON} expr="happy" />
      <Stickman x={180} y={FLOOR} scale={AS} facing={-1} pose={{...idle(t), shR: 60, elR: 50, bob: -Math.abs(Math.sin(t * 9)) * 3, headTilt: -6}} look={{...FATHER, handR: shoeInHand}} expr="happy" />
      <SpeechBubble x={170} y={-480} lines={["Kenapa", "mahal-mahal?"]} k={pop(frame, ask)} tx={170} ty={-160} size={40} />
    </Shot>
  );
};

/* 16 — That night, trying them on */
const Secretly: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const saw = at(15, 1);
  const again = at(15, 2);
  const standK = prog(frame, again - 10, again + 6);
  const px = 140 + (standK > 0.5 ? Math.sin((frame - again) / 18) * 70 : 0);
  const chair = {x: 260, floorY: FLOOR, facing: -1 as const, seat: 87};
  const seat = seatedAnchor(chair, AS);
  return (
    <Shot len={len} wall={NIGHT} z1={1.14}>
      <SkyWindow x={60} y={-330} />
      <Glow x={60} y={-200} r={500} color="#AFC6FF" opacity={0.1} />
      {/* doorway on the left with the son peeking */}
      <rect x={-560} y={-420} width={220} height={840} fill="#0E1018" />
      <g opacity={prog(frame, saw, saw + 12)}>
        <Stickman x={-380} y={FLOOR} scale={AS} pose={{...idle(t), lean: 10}} look={SON} expr="happy" />
        <Tears x={-370} y={FLOOR - 270} t={t} />
      </g>
      <rect x={-340} y={-440} width={30} height={860} fill={C.woodDark} stroke={C.ink} strokeWidth={3} />
      <SideChair x={260} y={FLOOR} facing={-1} />
      {standK < 0.5 ? (
        <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={AS} facing={-1} pose={{...sit(t), lean: 24, headTilt: 26, lookY: 0.9}} look={FATHER_NEW} expr="happy" footL={seat.footL} footR={seat.footR} />
      ) : (
        <Stickman x={px} y={FLOOR} scale={AS} facing={Math.cos((frame - again) / 18) > 0 ? 1 : -1} pose={{...walk((frame - again) / 20, t), headTilt: 22, lookY: 0.9}} look={FATHER_NEW} expr="happy" />
      )}
      {[0, 1, 2].map((i) => (
        <path key={i} d="M 0 -14 L 4 -4 L 14 0 L 4 4 L 0 14 L -4 4 L -14 0 L -4 -4 Z" fill={C.yellow} transform={`translate(${(standK > 0.5 ? px : seat.footR.x) + (i - 1) * 40} ${FLOOR - 30 - i * 10}) scale(${standK * (1 + Math.sin(t * 8 + i) * 0.3)})`} />
      ))}
    </Shot>
  );
};

/* 17 — Walking side by side */
const Together: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const x = lerp(-260, 40, frame / len);
  return (
    <Shot len={len} wall="#3A2A3E" z1={1.1} back={<SkyBand top="#2A2440" bottom="#E89A6A" />}>
      <circle cx={260} cy={FLOOR - 40} r={140} fill="#F8D27A" />
      <circle cx={260} cy={FLOOR - 40} r={260} fill="#F6C76B" opacity={0.15} />
      <Floor x0={-1400} x1={1400} />
      <Stickman x={x - 110} y={FLOOR} scale={AS} pose={walk((x + 260) / STRIDE, t)} look={FATHER_NEW} expr="happy" />
      <Stickman x={x + 110} y={FLOOR} scale={AS} pose={walk((x + 260) / STRIDE + 0.5, t)} look={SON} expr="happy" />
    </Shot>
  );
};

/* 18 — The question, then a closing line */
const Thanks: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const endAt = A_CUES[A_CUES.length - 1].to - A_SCENES[17].from + 6;
  const card = prog(frame, endAt, endAt + 20);
  const x = lerp(-40, 120, frame / len);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#12141A" z1={1.06}>
        <Glow x={200} y={-100} r={700} color="#F6C76B" opacity={0.12} />
        <g opacity={0.9}>
          <Stickman x={x - 90} y={FLOOR} scale={1.1} pose={walk((x + 40) / STRIDE, t)} look={FATHER_NEW} expr="happy" />
          <Stickman x={x + 90} y={FLOOR} scale={1.1} pose={walk((x + 40) / STRIDE + 0.5, t)} look={SON} expr="happy" />
        </g>
      </Shot>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", paddingBottom: 520}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 92, color: C.yellow, opacity: card, transform: `translateY(${(1 - card) * 24}px)`, textAlign: "center"}}>Terima kasih, Ayah.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Asks, OldClothes, Carefree, Worn, Counting, List, Strike, Postpone, YearsLater, Note, Receipts12, Understand, Buy, Laugh15, Secretly, Together, Thanks];
const TRANSITIONS: TransitionKind[] = ["fade", "cut", "fade", "fade", "fade", "cut", "zoom", "fade", "fade", "zoom", "cut", "fade", "fade", "cut", "fade", "fade", "fade"];

export const AyahSepatu: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={A_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={A_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={A_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
