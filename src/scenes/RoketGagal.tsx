import React from "react";
import {AbsoluteFill} from "remotion";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {Board, Desk, FLOOR, Glow, Label} from "../environment/Furniture";
import {Cross} from "../environment/CallProps";
import {Card, Magnifier, Tick} from "../environment/MoneyProps";
import {Calendar} from "../environment/StoryProps";
import {CashStack, EmptyWallet} from "../environment/SpendProps";
import {Institution} from "../environment/QrisProps";
import {Smoke} from "../environment/BaduyProps";
import {Burst, Starfield} from "../environment/SpaceProps";
import {Vignette} from "../environment/HorrorProps";
import {Building, Sparks} from "../environment/JobsProps";
import {Drips, ENGINEER, FOUNDER, LaunchPad, Planet, Rocket, RustyNut, Screen, SkyFill} from "../environment/RocketProps";
import {eInOut, eOut, lerp, prog} from "../motion/ease";
import {cheer, idle, mix, point} from "../rig/poses";
import {Actor, EndCard, Film, Flash, Gate, Plate as KitPlate, pop, Seated, Shot as KitShot, ShotProps, useScene} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as R_CUES, SCENES as R_SCENES} from "./roketTiming";

/*
 * AKU ROKET YANG TIGA KALI GAGAL — the Falcon 1 story told by the rocket itself (12 scenes, about 75 s).
 * Facts and sources: scripts/narasi/roket-copy.md.
 *   1  Hook      the rocket, three red crosses; the founder who would not give up
 *   2  Name      FALCON 1, the small company, the founder
 *   3  2006      lift-off from the island pad, half a minute, fire, the fall
 *   4  Cause     a rusty nut, leaking fuel, an engineer with a magnifier
 *   5  2007      mission control: it reaches space, then spins out of control
 *   6  2008      night sky: stage separation, the lower stage bumps back into the upper one
 *   7  Broke     three failures; the company nearly out of money (grey)
 *   8  Fix       the team finds the error, fixes it, readies the rocket
 *   9  Flight 4  28 September 2008, countdown, everyone holds their breath
 *   10 Orbit     around the planet; first private liquid-fuel rocket to reach orbit
 *   11 Contract  three months later, a space-agency contract of about US$1.6 billion
 *   12 End       "failing three times is no reason to stop" + the question, closing card
 * Scene lengths and caption cues come from roketTiming.ts. The rocket carries no logo or markings.
 */

export {FRAMES as ROKET_FRAMES} from "./roketTiming";

const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={46} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall="#26303A" {...p} />;
const GOOD = "#5E9347";
const ENG1 = ENGINEER("#5E7AA8");
const ENG2 = ENGINEER("#B5524A", "#4A3424");

/* 1 — Hook: the rocket that failed three times */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const up = prog(frame, c2, c2 + 14);
  return (
    <Shot len={len} z1={1.08} back={<SkyFill top="#1B2433" bottom="#33465E" />}>
      <Glow x={60} y={-150} r={460} color={C.yellow} opacity={0.08 + 0.12 * up} />
      <Rocket x={60} y={FLOOR} s={1.15} t={t} face={up > 0.5 ? "calm" : "sad"} />
      {[0, 1, 2].map((i) => (
        <Cross key={i} x={-270 + i * 165} y={-430} r={42} k={pop(frame, -10 + i * 8)} />
      ))}
      <Actor x={-330} y={FLOOR} scale={1.25} pose={up > 0.5 ? point(idle(t, 2), up, 150) : idle(t, 2)} look={FOUNDER} expr={up > 0.5 ? "determined" : "neutral"} opacity={prog(frame, c1 - 4, c1 + 6)} />
      <Plate x={0} y={-590} text="AKU GAGAL 3 KALI" k={pop(frame, -10)} size={52} border={C.red} />
      <Plate x={-260} y={-120} text="NGGAK MENYERAH" k={pop(frame, c2 + 4)} size={38} border={GOOD} />
    </Shot>
  );
};

/* 2 — Name, company, founder */
const Name: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  return (
    <Shot len={len} z1={1.07} back={<SkyFill top="#3B6A94" bottom="#9CC3DE" />}>
      <Building x={-300} y={FLOOR} w={260} h={360} name="SPACEX" color="#4A5566" lit={0.6} />
      <Rocket x={200} y={FLOOR} s={1.1} t={t} face="happy" />
      <Plate x={200} y={-560} text="FALCON 1" k={pop(frame, c0 - 6)} size={56} />
      <g opacity={prog(frame, c1 - 4, c1 + 6)}>
        <Sparks x={-300} y={-60} k={prog(frame, c1, c1 + 22)} r={140} />
      </g>
      <Actor x={-120} y={FLOOR} scale={1.25} pose={point(idle(t, 1), prog(frame, c2, c2 + 12), 70)} look={FOUNDER} expr="happy" opacity={prog(frame, c2 - 4, c2 + 6)} />
      <Plate x={-180} y={-120} text="ELON MUSK" k={pop(frame, c2 + 4)} size={40} border={C.cyan} />
    </Shot>
  );
};

/* 3 — 2006: lift-off, half a minute, fire and fall */
const Flight1: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const lift = prog(frame, 6, c2, (v) => v * v);
  const fall = prog(frame, c2 + 6, len - 4, (v) => v * v);
  const ry = FLOOR - lift * 520 + fall * 700;
  return (
    <Shot len={len} z1={1.06} back={<SkyFill top="#3B6A94" bottom="#B7D3E6" />}>
      <rect x={-1400} y={FLOOR - 40} width={2800} height={40} fill="#2F6FA8" opacity={0.6} />
      <LaunchPad x={-20} y={FLOOR} />
      <Smoke x={-20} y={FLOOR - 10} t={t} opacity={0.4 * prog(frame, 4, 20) * (1 - prog(frame, c1, c1 + 30))} />
      <Rocket x={60} y={ry} s={lerp(1.0, 0.75, lift)} rot={fall * 70} t={t} face={frame >= c2 ? "scared" : "happy"} flame={frame < c2 + 4 ? 1 : 0} />
      {frame >= c2 ? (
        <g transform={`translate(${60 + fall * 120} ${ry - 160})`}>
          <path d="M -40 0 Q -30 -60 0 -90 Q 30 -60 40 0 Q 0 30 -40 0 Z" fill={C.orange} stroke={C.ink} strokeWidth={4} opacity={1 - fall * 0.3} />
          <path d="M -20 0 Q -14 -36 0 -52 Q 14 -36 20 0 Z" fill={C.yellow} />
        </g>
      ) : null}
      <Flash frame={frame} at={[c2 + 2]} strength={0.5} />
      <Actor x={-380} y={FLOOR} scale={1.1} pose={{...idle(t, 3), lookY: -0.8}} look={ENG1} expr={frame >= c2 ? "surprised" : "focused"} />
      <Actor x={380} y={FLOOR} scale={1.1} facing={-1} pose={{...idle(t, 5), lookY: -0.8}} look={FOUNDER} expr={frame >= c2 ? "worried" : "focused"} />
      <Plate x={0} y={-590} text="MARET 2006" k={pop(frame, -10)} size={56} />
      <Plate x={-200} y={-430} text="30 DETIK" k={pop(frame, c1) * (1 - prog(frame, c2 + 4, c2 + 8))} size={40} border={C.yellow} />
      <Plate x={0} y={-420} text="GAGAL #1" k={pop(frame, c2 + 10)} size={48} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 4 — the cause: a rusty nut, leaking fuel */
const Cause: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  return (
    <Shot len={len} wall="#2A2D33" z1={1.08}>
      <Glow x={60} y={-250} r={420} color={C.orange} opacity={0.12} />
      <g transform={`translate(60 -250) scale(${pop(frame, c0 - 6)})`}>
        <RustyNut x={0} y={0} r={140} rot={t * 6} />
      </g>
      <Drips x={60} y={-90} t={t} k={prog(frame, c1, c1 + 10)} len={260} />
      <Actor x={-300} y={FLOOR} scale={1.25} pose={{...idle(t, 2), shR: 70, elR: 30, lean: 6}} look={ENG1} expr="focused" />
      <Magnifier x={-170} y={-60} r={60} />
      <Plate x={60} y={-560} text="MUR BERKARAT" k={pop(frame, c0 + 4)} size={50} border={C.orange} />
      <Plate x={260} y={110} text="BOCOR!" k={pop(frame, c1 + 6)} size={50} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 5 — 2007: mission control; space, then a spin */
const Flight2: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const climb = prog(frame, 0, c1 + 10, eInOut);
  const spin = prog(frame, c2, len, (v) => v);
  const rot = 10 * Math.sin(t * 3) + spin * spin * 900;
  return (
    <Shot len={len} wall="#22262E" z1={1.07}>
      <Screen x={0} y={-330} w={620} h={380} t={t}>
        <Planet x={0} y={lerp(420, 620, climb)} r={300} />
        <g transform={`rotate(${rot} 0 ${lerp(170, 130, climb) - 185})`}>
          <Rocket x={0} y={lerp(170, 130, climb)} s={0.42} t={t} face={frame >= c2 ? "scared" : "happy"} flame={0} upperFlame={frame < c2 ? 1 : 0.4} upperOnly />
        </g>
      </Screen>
      <Desk x={0} w={520} top={140} />
      <Actor x={-330} y={FLOOR} scale={1.15} pose={{...idle(t, 1), lookY: -0.6}} look={ENG2} expr={frame >= c2 ? "worried" : "happy"} />
      <Actor x={330} y={FLOOR} scale={1.15} facing={-1} pose={frame >= c1 && frame < c2 ? cheer(t, 2) : {...idle(t, 4), lookY: -0.6}} look={FOUNDER} expr={frame >= c2 ? "worried" : "happy"} />
      <Plate x={0} y={-590} text="MARET 2007" k={pop(frame, -10)} size={52} />
      <Plate x={-180} y={-90} text="LUAR ANGKASA" k={pop(frame, c1 + 4)} size={36} border={C.cyan} />
      <Plate x={180} y={-90} text="GAGAL #2" k={pop(frame, c2 + 12)} size={40} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 6 — 2008: separation; the lower stage bumps the upper one */
const Flight3: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const apart = prog(frame, c1, c1 + 16, eOut) * 90;
  const back = prog(frame, c2, c2 + 16, eInOut) * 90;
  const hit = c2 + 16;
  const after = prog(frame, hit, len, (v) => v);
  const sep = Math.max(0, apart - back) + after * 160;
  return (
    <Shot len={len} wall="#0E1420" z1={1.06} back={<Starfield t={t} size={1400} count={120} nebula={0.4} />} floor={false}>
      <Planet x={0} y={760} r={560} />
      <Rocket x={40} y={60} s={0.85} rot={after * 40} t={t} face={frame >= hit ? "scared" : frame >= c2 ? "worried" : "calm"} flame={frame < c1 ? 1 : 0} upperFlame={frame >= c1 + 4 && frame < hit ? 1 : 0} sep={sep} sepRot={after * 50} />
      {frame >= hit ? <Burst x={40} y={-235} k={prog(frame, hit, hit + 18)} r={260} /> : null}
      <Flash frame={frame} at={[hit]} strength={0.55} />
      {/* the founder watches from a small inset */}
      <g transform="translate(-330 -120)">
        <rect x={-120} y={-150} width={240} height={300} rx={18} fill="#26303A" stroke={C.bone} strokeWidth={5} />
        <Actor x={0} y={130} scale={0.75} pose={{...idle(t, 2), lookY: -0.6}} look={FOUNDER} expr={frame >= hit ? "sad" : "worried"} />
      </g>
      <Plate x={0} y={-590} text="AGUSTUS 2008" k={pop(frame, -10)} size={52} />
      <Plate x={250} y={180} text="STAGE TERPISAH" k={pop(frame, c1 + 4) * (1 - prog(frame, hit - 4, hit))} size={34} border={C.cyan} />
      <Plate x={250} y={180} text="GAGAL #3" k={pop(frame, hit + 4)} size={44} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 7 — three failures; nearly out of money */
const Broke: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const drain = prog(frame, c1, c2 + 10, eInOut);
  return (
    <Shot len={len} wall="#2A2427" grey={prog(frame, 0, len, (v) => v) * 0.55} z1={1.07}>
      {[0, 1, 2].map((i) => (
        <Cross key={i} x={-200 + i * 200} y={-560} r={44} k={pop(frame, -6 + i * 7)} />
      ))}
      <Seated cx={-260} t={t} look={FOUNDER} expr="sad" pose={{lean: 18, headTilt: 20, shL: 20, elL: 60, shR: 20, elR: 60}} />
      <g opacity={1 - drain}>
        <CashStack x={140} y={-120} n={7} s={1.1} />
      </g>
      <g transform={`translate(140 -200) scale(${pop(frame, c2)})`}>
        <EmptyWallet x={0} y={0} s={1.3} />
      </g>
      <Rocket x={380} y={FLOOR} s={0.6} t={t} face="sad" burnt={1} />
      <Plate x={140} y={-400} text="KAS HAMPIR HABIS" k={pop(frame, c2 + 6)} size={42} border={C.red} />
    </Shot>
  );
};

/* 8 — the team finds the error, fixes it, readies the rocket */
const Fix: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const items = ["CARI SALAH", "PERBAIKI", "SIAPKAN"];
  return (
    <Shot len={len} wall="#24303A" z1={1.07}>
      <Board x={-200} y={-60} w={300} h={300}>
        {items.map((s, i) => (
          <g key={i} opacity={prog(frame, [c0, c1, c2][i], [c0, c1, c2][i] + 8)}>
            <Label x={40} y={70 + i * 90} text={s} size={30} color={C.ink} anchor="start" />
            <Tick x={250} y={60 + i * 90} r={18} k={pop(frame, [c0, c1, c2][i] + 10)} />
          </g>
        ))}
      </Board>
      <Actor x={-385} y={FLOOR} scale={1.0} pose={point(idle(t, 1), 1, 120)} look={FOUNDER} expr="determined" />
      <Rocket x={250} y={FLOOR} s={0.95} t={t} face={frame >= c2 ? "happy" : "calm"} />
      <Actor x={80} y={FLOOR} scale={1.1} pose={{...idle(t, 3), shR: 100 + Math.sin(t * 12) * 12, elR: 30}} look={ENG2} expr="focused" />
      <Sparks x={210} y={-30} k={((frame - c1) % 24) / 24} r={60} />
      <Plate x={250} y={-560} text="DICOBA LAGI" k={pop(frame, c2 + 4)} size={44} border={GOOD} />
    </Shot>
  );
};

/* 9 — 28 September 2008: countdown, holding breath */
const Flight4: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const left = Math.max(1, 3 - Math.floor((frame - c2) / ((len - c2) / 3)));
  return (
    <AbsoluteFill>
      <Shot len={len} z1={1.06} back={<SkyFill top="#0B1020" bottom="#243247" />}>
        <LaunchPad x={-20} y={FLOOR} />
        <Rocket x={60} y={FLOOR} s={1.05} t={t} face="worried" />
        <Actor x={-330} y={FLOOR} scale={1.1} pose={{...idle(t, 3), shL: 150, elL: 120, shR: 150, elR: 120, lookY: -0.6}} look={FOUNDER} expr="worried" />
        <Actor x={330} y={FLOOR} scale={1.05} facing={-1} pose={{...idle(t, 6), lookY: -0.6}} look={ENG1} expr="worried" />
        <Plate x={0} y={-590} text="28 SEPTEMBER 2008" k={pop(frame, -10)} size={46} />
        <Plate x={0} y={-430} text="PELUNCURAN KE-4" k={pop(frame, c1)} size={42} border={C.yellow} />
        {frame >= c2 ? <Plate x={-250} y={-250} text={String(left)} k={pop(frame, c2)} size={90} border={C.yellow} color={C.yellow} w={150} /> : null}
      </Shot>
      <Vignette frame={frame} strength={0.6} />
    </AbsoluteFill>
  );
};

/* 10 — orbit */
const Orbit: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const a = -Math.PI / 2 + prog(frame, 0, len, (v) => v) * Math.PI * 1.2;
  const rx = 380;
  const ry = 150;
  const px = Math.cos(a) * rx;
  const py = -330 + Math.sin(a) * ry;
  return (
    <Shot len={len} wall="#0E1420" z1={1.06} back={<Starfield t={t} size={1400} count={120} nebula={0.6} />}>
      <ellipse cx={0} cy={-330} rx={rx} ry={ry} fill="none" stroke={C.yellow} strokeWidth={4} strokeDasharray="14 12" opacity={0.6} />
      <Planet x={0} y={-330} r={170} />
      <Rocket x={px} y={py + 60} s={0.42} rot={Math.cos(a) * 30 + 90} t={t} face="happy" upperOnly upperFlame={0.5} />
      <Flash frame={frame} at={[c0 + 2]} strength={0.35} />
      {[-300, -110, 110, 300].map((x, i) => (
        <Actor key={i} x={x} y={FLOOR} scale={1.0} facing={x > 0 ? -1 : 1} pose={cheer(t, i)} look={i === 1 ? FOUNDER : [ENG1, ENG2, ENG1, ENG2][i]} expr="happy" />
      ))}
      <Plate x={0} y={-590} text="ORBIT!" k={pop(frame, c0 + 6)} size={62} border={GOOD} />
      <Plate x={0} y={10} text="ROKET SWASTA PERTAMA" k={pop(frame, c1 + 2)} size={34} border={C.cyan} />
    </Shot>
  );
};

/* 11 — the contract */
const Contract: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const shake = prog(frame, c1 + 8, c1 + 20);
  const reach = {...idle(t), shR: 82, elR: 10, lean: 3};
  return (
    <Shot len={len} wall="#24303A" z1={1.07}>
      <Institution x={260} y={-40} s={0.55} name="NASA" />
      <Calendar x={-360} y={-360} text="DES" sub="2008" s={0.6 * pop(frame, c0 - 6)} />
      <Actor x={-130} y={FLOOR} scale={1.25} pose={mix(idle(t, 1), reach, shake)} look={FOUNDER} expr="happy" />
      <Actor x={120} y={FLOOR} scale={1.25} facing={-1} pose={mix(idle(t, 4), reach, shake)} look={{...ENGINEER("#E9E7DF"), coat: "#2B3140", sleeve: "#2B3140", tie: C.cyan}} expr="happy" />
      <Gate k={pop(frame, c2 - 4)}>
        <Card x={0} y={-330} w={340} h={180} color={C.bone}>
          <Label x={0} y={-30} text="KONTRAK" size={34} color={C.ink} />
          <Label x={0} y={30} text="± US$ 1,6 MILIAR" size={36} color={C.ink} />
        </Card>
      </Gate>
      <Rocket x={-430} y={FLOOR} s={0.55} t={t} face="happy" />
      <Plate x={-60} y={-590} text="3 BULAN KEMUDIAN" k={pop(frame, c0 - 6)} size={46} />
    </Shot>
  );
};

/* 12 — closing */
const End: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const endAt = R_CUES[R_CUES.length - 1].to - R_SCENES[R_SCENES.length - 1].from + 8;
  const card = prog(frame, endAt, endAt + 18);
  return (
    <AbsoluteFill>
      <Shot len={len} z1={1.06} back={<SkyFill top="#1B2433" bottom="#4A5E7A" />}>
        <Rocket x={150} y={FLOOR} s={1.05} t={t} face="happy" />
        <Actor x={-220} y={FLOOR} scale={1.25} pose={mix(idle(t, 2), cheer(t, 2), prog(frame, c1, c1 + 10))} look={FOUNDER} expr="happy" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <Cross x={-200 + i * 200} y={-560} r={40} k={pop(frame, -10) * (1 - prog(frame, c1 + i * 5, c1 + i * 5 + 6))} />
            <Tick x={-200 + i * 200} y={-560} r={40} k={pop(frame, c1 + i * 5 + 4)} />
          </g>
        ))}
        <Plate x={0} y={-430} text="BUKAN ALASAN BERHENTI" k={pop(frame, c1 + 18)} size={40} border={GOOD} />
        <Plate x={0} y={-300} text="KAMU GAGAL BERAPA KALI?" k={pop(frame, c2) * (1 - card)} size={38} border={C.cyan} />
      </Shot>
      <EndCard lines={["Gagal tiga kali", "bukan alasan berhenti."]} k={card} accent={1} />
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Name, Flight1, Cause, Flight2, Flight3, Broke, Fix, Flight4, Orbit, Contract, End];
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "whip", "fade", "zoom", "fade", "cut", "whip", "fade"];

export const RoketGagal: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={R_SCENES}
    cues={R_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
      const Scene = SCENES[i];
      return <Scene len={R_SCENES[i].len} />;
    }}
  />
);
