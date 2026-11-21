import React from "react";
import {AbsoluteFill} from "remotion";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {Card, BigPhone, Magnifier, Padlock, Stamp, Tick} from "../environment/MoneyProps";
import {Arrow, BankScreen, CallBadge, Cross, Eye, HangUp, PausePopup, Shield, earAt} from "../environment/CallProps";
import {earPhone} from "../environment/MotherProps";
import {FLOOR, Glow, Label} from "../environment/Furniture";
import {eOut, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {idle, point} from "../rig/poses";
import {Look} from "../rig/Stickman";
import {Actor, Bubble, EndCard, Film, Plate as KitPlate, pop, Shot as KitShot, ShotProps, useScene} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as J_CUES, SCENES as J_SCENES} from "./jedaTiming";

/*
 * JEDA 30 DETIK — a six-scene explainer on the 30-second warning pause a bank app now shows when
 * you open it during a phone call (about 42 s). Facts: scripts/narasi/jeda-copy.md.
 *   1 Hook     phone call + m-banking: the app now holds you for 30 seconds
 *   2 Scam     the caller claims to be the bank, tells you to open m-banking, asks to share your screen
 *   3 Why      social engineering attacks your state of mind, not the bank's system
 *   4 Feature  call + app open -> warning pop-up with a 30 s countdown; close the app or wait
 *   5 Limit    it is only a reminder: it cannot detect a scam call; you are the guard
 *   6 Rule     no OTP / PIN to anyone; hang up; doubt -> call the bank's official line
 * Scene lengths and caption cues come from jedaTiming.ts.
 */

export {FRAMES as JEDA_FRAMES} from "./jedaTiming";

const S = 1.5;
const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={44} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall="#26303A" {...p} />;

const SCAMMER: Look = {top: "#2A2A32", sleeve: "#2A2A32", trousers: "#17171B", hat: "beanie", hatColor: "#17171B"};
const YOU: Look = {...CASUAL, handL: earPhone()};

/** A floating bank phone at (x, y), scaled about its centre, with optional pop-up. */
const BankPhone: React.FC<{x: number; y: number; s?: number; k?: number; t: number; call?: boolean; share?: boolean; popup?: {k: number; elapsed: number; n: number; ready: boolean; pulse?: number}}> = ({x, y, s = 1.35, k = 1, t, call, share, popup}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * k}) translate(${-x} ${-y})`}>
      <BigPhone x={x} y={y} w={300} h={420}>
        <BankScreen call={call} share={share} t={t} />
        {popup ? <PausePopup k={popup.k} elapsed={popup.elapsed} n={popup.n} ready={popup.ready} pulseClose={popup.pulse ?? 0} /> : null}
      </BigPhone>
    </g>
  );

const count = (elapsed: number) => Math.max(0, 30 - Math.floor(30 * elapsed));

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const warn = cueAt(1);
  const elapsed = prog(frame, warn + 8, len - 6, (v) => v);
  const popK = pop(frame, warn + 4);
  return (
    <Shot len={len} z1={1.07} y0={140}>
      <Glow x={170} y={-200} r={460} color={popK > 0 ? C.yellow : "#8FC7FF"} opacity={0.14} />
      <Actor x={-270} y={FLOOR} scale={S} pose={{...idle(t, 2), look: 0.6}} look={YOU} expr={popK > 0 ? "surprised" : "worried"} reachL={earAt(-270, 1)} />
      <CallBadge x={-250} y={-90} t={t} s={1.1} />
      <BankPhone x={170} y={-200} s={1.25} t={t} call popup={{k: popK, elapsed, n: count(elapsed), ready: false}} />
      <Plate x={0} y={-590} text="TELEPON + M-BANKING?" k={pop(frame, -10)} border={C.yellow} />
      <Plate x={170} y={110} text="TAHAN 30 DETIK" k={pop(frame, warn + 26)} color={C.yellow} border={C.yellow} />
    </Shot>
  );
};

/* 2 — The scam call */
const Scam: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const show = (a: number, b: number) => Math.min(pop(frame, a), 1 - prog(frame, b - 4, b));
  const wave = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <Shot len={len} z1={1.07} y0={140}>
      <line x1={-250} y1={-140} x2={250} y2={-140} stroke="#8FC7FF" strokeWidth={5} strokeDasharray="14 16" opacity={0.3 + 0.4 * wave} />
      <Actor x={-330} y={FLOOR} scale={S} pose={{...idle(t, 4), look: 0.6}} look={{...SCAMMER, handL: earPhone()}} expr="smug" reachL={earAt(-330, 1)} />
      <Actor x={300} y={FLOOR} scale={S} facing={-1} pose={{...idle(t, 1), look: 0.6}} look={YOU} expr={frame >= c2 ? "surprised" : "worried"} reachL={earAt(300, -1)} />
      <Bubble x={-150} y={-330} lines={["Saya dari", "pihak bank."]} k={show(6, c1)} tx={-290} ty={-30} size={38} />
      <Bubble x={-150} y={-330} lines={["Coba buka", "m-banking."]} k={show(c1 + 2, c2)} tx={-290} ty={-30} size={38} />
      <Bubble x={-150} y={-330} lines={["Bagikan layar", "kamu, ya."]} k={pop(frame, c2 + 2)} tx={-290} ty={-30} size={38} />
      <BankPhone x={170} y={-380} s={1.0} k={pop(frame, c1 + 4)} t={t} call={false} share={frame >= c2 + 6} />
      <Eye x={430} y={-470} s={0.8} k={pop(frame, c2 + 10)} t={t} />
    </Shot>
  );
};

/* 3 — Why: the target is your state of mind */
const Why: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const shake = prog(frame, c2 + 12, c2 + 40) * Math.sin(t * 40) * 3;
  return (
    <Shot len={len} wall="#2A2427" z1={1.07} y0={140}>
      <Glow x={250} y={-100} r={420} color={C.red} opacity={0.1 + 0.1 * prog(frame, c2, c2 + 20)} />
      <Plate x={0} y={-560} text="SOCIAL ENGINEERING" k={pop(frame, c0 + 2)} color={C.red} border={C.red} />
      <CallBadge x={0} y={-390} t={t} s={1.5} />
      {/* the bank's system: a locked padlock; the arrow bounces off */}
      <g transform="translate(-300 -60)">
        <Padlock x={0} y={0} s={3.4} open={0} />
        <g opacity={pop(frame, c1 + 4)}>
          <Label x={0} y={170} text="SISTEM BANK" size={34} color={C.bone} />
        </g>
        <Tick x={72} y={-110} r={34} k={pop(frame, c1 + 18)} />
      </g>
      <Arrow ax={-30} ay={-340} bx={-250} by={-190} k={prog(frame, c1, c1 + 12, eOut)} />
      <Cross x={-290} y={-270} r={36} k={pop(frame, c1 + 14)} />
      {/* your state of mind: the arrow lands */}
      <Arrow ax={30} ay={-340} bx={250} by={-110} k={prog(frame, c2, c2 + 12, eOut)} />
      <g transform={`translate(${shake} 0)`}>
        <Actor x={300} y={FLOOR} scale={S} facing={-1} pose={{...idle(t, 3), lean: frame >= c2 + 12 ? 8 : 0, headTilt: frame >= c2 + 12 ? 12 : 0}} look={CASUAL} expr={frame >= c2 + 12 ? "worried" : "neutral"} />
      </g>
      <g transform={`translate(300 -240) scale(${pop(frame, c2 + 16)})`}>
        <ellipse rx={150} ry={56} fill={C.bone} stroke={C.ink} strokeWidth={5} />
        <Label x={0} y={16} text="PANIK!" size={52} color={C.red} />
      </g>
    </Shot>
  );
};

/* 4 — The feature: pop-up, countdown, close or wait */
const Feature: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const elapsed = prog(frame, c1 + 8, len - 8, (v) => v);
  const pulse = frame >= c2 ? 0.5 + 0.5 * Math.sin((frame - c2) * 0.45) : 0;
  return (
    <Shot len={len} z1={1.07} y0={140}>
      <Glow x={140} y={-180} r={500} color={C.yellow} opacity={0.08 + 0.1 * prog(frame, c1, c1 + 12)} />
      <Actor x={-390} y={FLOOR} scale={S} pose={frame >= c2 ? point(idle(t), prog(frame, c2, c2 + 10, eOut), 70) : idle(t)} look={CASUAL} expr="focused" />
      <CallBadge x={-300} y={-60} t={t} s={1.1} />
      <BankPhone x={140} y={-140} s={1.45} k={pop(frame, 2)} t={t} call popup={{k: pop(frame, c1 + 2), elapsed, n: count(elapsed), ready: elapsed >= 1, pulse}} />
      <Plate x={0} y={-600} text="BUKA M-BANKING SAAT TELEPON" k={pop(frame, c0 + 2) * (1 - prog(frame, c1 - 4, c1))} size={36} />
      <Plate x={140} y={-600} text="JEDA 30 DETIK" k={pop(frame, c1 + 8)} color={C.yellow} border={C.yellow} />
    </Shot>
  );
};

/* 5 — The limit: only a reminder */
const Limit: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const mag = pop(frame, c1 + 2) * (1 - prog(frame, c2 - 4, c2 + 4));
  return (
    <Shot len={len} z1={1.07} y0={140}>
      <BankPhone x={-260} y={-260} s={0.95} k={pop(frame, 2)} t={t} call popup={{k: 1, elapsed: 0.5, n: 15, ready: false}} />
      <Plate x={-260} y={-560} text="CUMA PENGINGAT" k={pop(frame, c0 + 2)} color={C.yellow} border={C.yellow} />
      <g transform={`translate(180 -330) scale(${mag})`}>
        <Magnifier x={0} y={0} r={120}>
          <CallBadge x={0} y={0} t={t} s={1.5} />
          <Cross x={0} y={0} r={70} k={pop(frame, c1 + 12)} w={18} />
        </Magnifier>
      </g>
      <g opacity={mag}>
        <Label x={180} y={-120} text="TIDAK BISA DETEKSI" size={32} color={C.red} />
        <Label x={180} y={-80} text="TELEPON PENIPU" size={32} color={C.red} />
      </g>
      <Shield x={250} y={-140} w={420} k={pop(frame, c2 + 2)} />
      <Actor x={250} y={FLOOR} scale={S} facing={-1} pose={frame >= c2 ? point(idle(t), prog(frame, c2 + 4, c2 + 14, eOut), 60) : idle(t)} look={JACKET_BLUE} expr={frame >= c2 ? "determined" : "neutral"} />
      <Plate x={250} y={-470} text="KAMU" k={pop(frame, c2 + 10)} color={C.yellow} border={C.yellow} size={52} />
    </Shot>
  );
};

/* 6 — The rule */
const Rule: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const lastEnd = J_CUES[J_CUES.length - 1].to - J_SCENES[5].from;
  const end = prog(frame, lastEnd + 10, lastEnd + 28);
  return (
    <AbsoluteFill>
      <Shot len={len} z1={1.07} y0={140}>
        <Glow x={0} y={-300} r={520} color={C.red} opacity={0.08} />
        <Plate x={0} y={-610} text="INGAT!" k={pop(frame, c0 + 2)} color={C.yellow} border={C.yellow} size={56} />
        {["OTP", "PIN"].map((s, i) => (
          <g key={s} transform={`translate(${i ? 190 : -190} -380) scale(${pop(frame, c1 + 2 + i * 8)})`}>
            <Card x={0} y={0} w={280} h={130} color={C.charcoal} border={C.bone}>
              <Label x={0} y={26} text={s} size={80} color={C.bone} />
            </Card>
            <Cross x={0} y={0} r={56} k={pop(frame, c1 + 16 + i * 8)} w={10} />
          </g>
        ))}
        <HangUp x={-190} y={-170} s={1.0} k={pop(frame, c2)} />
        <g transform={`translate(190 -170) scale(${pop(frame, c2 + 12)})`}>
          <Card x={0} y={0} w={330} h={170} color={C.charcoal} border={C.yellow}>
            <Label x={0} y={-24} text="HALO BCA" size={44} color={C.yellow} />
            <Label x={0} y={44} text="1500888" size={60} color={C.bone} />
          </Card>
        </g>
        <Actor x={-390} y={FLOOR} scale={1.3} pose={frame >= c2 ? point(idle(t), prog(frame, c2, c2 + 10, eOut), 80) : idle(t)} look={CASUAL} expr={frame >= c2 ? "happy" : "determined"} />
        <Stamp x={190} y={110} text="TUTUP DULU" k={prog(frame, c2 + 20, c2 + 28, eOut)} size={46} />
      </Shot>
      <EndCard lines={["Tutup dulu.", "Ragu? Halo BCA 1500888"]} k={end} accent={1} dim={0.96} />
    </AbsoluteFill>
  );
};

const SCENE_LIST = [Hook, Scam, Why, Feature, Limit, Rule];

// Cuts: Hook>Scam, Scam>Why, Why>Feature, Feature>Limit, Limit>Rule.
const TRANSITIONS: TransitionKind[] = ["zoom", "whip", "zoom", "whip", "zoom"];

export const JedaTigaPuluh: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={J_SCENES}
    cues={J_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
      const Scene = SCENE_LIST[i];
      return <Scene len={J_SCENES[i].len} />;
    }}
  />
);
