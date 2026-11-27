import React from "react";
import {AbsoluteFill} from "remotion";
import {Film, useScene} from "../story/StoryKit";
import {useSceneFrame} from "../camera/Transitions";
import {FONT} from "../styles/palette";
import {Ball, Box, CamKey, Cyl, Fx, Label3D, Lamp, P, Pole, Pose, Room, SKIN, Shelf, Stage, Surf, Toon, V3, Who, Window, blend} from "../cartoon";
import {CUES, FLIGHT, LINES, P_POUR, P_REVEAL, SCENES, SLIDE, STACK, landAt, pourAt} from "./pancakeTiming";

/*
 * "Pancake Pertama" (14 s, no narration: music, kitchen sounds and one line of text per scene).
 * One counter, two cooks. Left, the perfectionist, prepares for the perfect first pancake: recipe, scale,
 * ruler, thermometer, while the wall clock races. Right, the one who just starts, burns his first and
 * keeps going until he has a stack. When the left one finally pours, his first one burns too.
 * Every scene draws the same set from the global frame, so the stack and the clock carry across cuts.
 */

/* ---------- cast and layout ---------- */

const PERFEK: Who = {name: "perfeksionis", skin: SKIN.light, shirt: "#e8eef6", pants: "#3a4356", hair: "side", hairColor: "#2a2220", glasses: true, tie: "#2f4f8a", seed: 51};
const MULAI: Who = {name: "langsung mulai", skin: SKIN.tan, shirt: "#e2763a", pants: "#2f3a4a", hair: "spiky", hairColor: "#1c1612", apron: "#f2ead8", seed: 52};

const PX = -0.85; // perfectionist (and his pan)
const AX = 0.38; // the one who just starts (and his pan)
const CZ = 0; // both stand here, behind the counter
const PAN_Z = 0.45;
const TOP = 0.8; // counter top height
const PLATE: V3 = [-0.22, TOP, 0.5];
const CENTER = -0.1;
const H = 2.1;

/* ---------- helpers ---------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (g: number, a: number, len: number) => clamp01((g - a) / len);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(lerp(v, y[i], clamp01(k))).toString(16).padStart(2, "0")).join("");
};

const RAW = "#f4e4b4";
const GOLD = "#d9953f";
const BURNT = "#3e2414";

/** Global frame of the scene being drawn. */
const useG = () => {
  const {index} = useScene();
  return SCENES[index].from + useSceneFrame();
};

/* ---------- props ---------- */

/** A pancake lying flat with its bottom at `at`. ugly 0..1 makes it lumpy and lopsided. */
const Cake: React.FC<{at: V3; c: string; ugly?: number; r?: number; tilt?: number}> = ({at, c, ugly = 0, r = 0.15, tilt = 0}) => {
  const surf: Surf = {c};
  if (ugly < 0.2)
    return <Cyl at={at} r={r} h={0.028} surf={surf} rot={[tilt, 0, 0]} />;
  const s = r * (1 - ugly * 0.2);
  return (
    <group>
      <Cyl at={[at[0] - s * 0.15, at[1], at[2]]} r={s} h={0.026} surf={surf} seg={9} rot={[tilt, 0, 0]} />
      <Ball at={[at[0] + s * 0.55, at[1] + 0.02, at[2] + s * 0.25]} r={s * 0.5} sy={0.35} surf={surf} seg={10} />
      <Ball at={[at[0] - s * 0.6, at[1] + 0.025, at[2] - s * 0.3]} r={s * 0.38} sy={0.45} surf={{c: mix(c, "#000000", 0.25)}} seg={10} />
    </group>
  );
};

const Pan: React.FC<{x: number; handle: 1 | -1}> = ({x, handle}) => (
  <group>
    <Cyl at={[x, TOP, PAN_Z]} r={0.23} h={0.012} surf={{c: "#1c1c22"}} ink={false} />
    <Cyl at={[x, TOP + 0.012, PAN_Z]} r={0.2} r2={0.22} h={0.045} surf={{c: "#2c2d33"}} />
    <Pole from={[x + handle * 0.21, TOP + 0.045, PAN_Z]} to={[x + handle * 0.46, TOP + 0.07, PAN_Z + 0.06]} r={0.022} surf={{c: "#1d1d22"}} />
  </group>
);

const Kitchen: React.FC<{g: number}> = ({g}) => {
  const wall: Surf = {c: "#e6d2b0", tex: "plaster", tile: 2};
  // the clock runs fast while the perfectionist prepares
  const spin = g < 120 ? g * 0.02 : g < 240 ? 2.4 + (g - 120) * 0.35 : 44.4 + (g - 240) * 0.02;
  const cx = -0.25;
  const cy = 2.0;
  const cz = -1.11; // front face of the back wall
  const at = (len: number, a: number, z: number): V3 => [cx + Math.sin(a) * len, cy + Math.cos(a) * len, z];
  return (
    <>
      <Room w={6} d={2.4} h={4.8} wall={wall} floor={{c: "#8a6a4a", tex: "planks", tile: 1.2}} sides="" />
      {/* floor runs on toward the camera so wide shots never see past its edge */}
      <Box at={[0, -0.1, 4.5]} size={[9, 0.1, 7]} surf={{c: "#8a6a4a", tex: "planks", tile: 1.2}} cast={false} ink={false} />
      {/* tiled splashback behind the counter */}
      <Box at={[CENTER, TOP, -1.12]} size={[6, 0.72, 0.03]} surf={{c: "#dfe9ec", tex: "tiles", tile: 0.22}} ink={false} />
      <Window at={[1.35, 1.6, -1.1]} w={0.9} h={1.0} glass="#22345e" glow={0.12} />
      <Shelf at={[-1.75, 0, -0.95]} w={1.0} h={1.7} />
      {/* wall clock */}
      {/* rim and face are separate discs without an ink hull (a hull on a thin disc z-fights into a torn edge) */}
      <Cyl at={[cx, cy, cz]} r={0.25} h={0.04} surf={{c: "#2a2a30"}} rot={[90, 0, 0]} ink={false} seg={48} />
      <Cyl at={[cx, cy, cz]} r={0.215} h={0.05} surf={{c: "#f7f2e6"}} rot={[90, 0, 0]} ink={false} seg={48} />
      {[...Array(12)].map((_, i) => (
        <Pole key={i} from={at(i % 3 === 0 ? 0.15 : 0.17, (i * Math.PI) / 6, cz + 0.055)} to={at(0.195, (i * Math.PI) / 6, cz + 0.055)} r={i % 3 === 0 ? 0.011 : 0.006} surf={{c: "#2a2a30"}} ink={false} />
      ))}
      <Pole from={at(-0.03, spin / 12, cz + 0.062)} to={at(0.12, spin / 12, cz + 0.062)} r={0.013} surf={{c: "#2a2a30"}} ink={false} />
      <Pole from={at(-0.04, spin, cz + 0.07)} to={at(0.18, spin, cz + 0.07)} r={0.008} surf={{c: "#d03a2a"}} ink={false} />
      <Ball at={[cx, cy, cz + 0.072]} r={0.02} surf={{c: "#2a2a30"}} ink={false} />
      {/* wall lamps on brackets */}
      {[-1.2, 0.85].map((x) => (
        <group key={x}>
          <Box at={[x, 2.3, -1.1]} size={[0.05, 0.05, 0.16]} surf={{c: "#2a2a2a"}} />
          <Cyl at={[x, 2.16, -0.98]} r={0.13} r2={0.06} h={0.15} surf={{c: "#2f5a4a"}} />
          <Lamp at={[x, 2.15, -0.98]} power={1.6} glow={0.35} />
        </group>
      ))}
      {/* counter */}
      <Box at={[CENTER, 0, PAN_Z]} size={[2.7, TOP - 0.05, 0.75]} surf={{c: "#33394a", tex: "boards", tile: 0.6}} />
      <Box at={[CENTER, TOP - 0.05, PAN_Z]} size={[2.8, 0.05, 0.82]} surf={{c: "#c9a273", tex: "planks", tile: 0.5}} />
      {/* cabinet doors with handles */}
      {[-1.12, -0.44, 0.24, 0.92].map((x, i) => (
        <group key={x}>
          <Box at={[x, 0.08, PAN_Z + 0.375]} size={[0.6, 0.6, 0.02]} surf={{c: "#424b60"}} />
          <Box at={[x + (i % 2 ? -0.22 : 0.22), 0.3, PAN_Z + 0.395]} size={[0.025, 0.16, 0.025]} surf={{c: "#c8c2b4"}} ink={false} />
        </group>
      ))}
      <Pan x={PX} handle={-1} />
      <Pan x={AX} handle={1} />
      {/* plate for the stack */}
      <Cyl at={PLATE} r={0.19} r2={0.21} h={0.02} surf={{c: "#f7f5ef"}} />
      {/* the right cook's batter bowl */}
      <Cyl at={[0.92, TOP, 0.32]} r={0.12} r2={0.15} h={0.12} surf={{c: "#7fb0d8"}} />
      <Cyl at={[0.92, TOP + 0.1, 0.32]} r={0.13} h={0.012} surf={{c: RAW}} ink={false} />
    </>
  );
};

/* ---------- the right cook: burns one, keeps going ---------- */

const RightSide: React.FC<{g: number; count: boolean}> = ({g, count}) => {
  const cakes: React.ReactNode[] = [];
  let landed = 0;
  for (let k = 1; k <= STACK; k++) {
    const pour = pourAt(k);
    const land = landAt(k);
    if (g < pour) continue;
    const quality = k === 1 ? 0 : Math.min(1, (k - 1) / 3); // 2nd still lopsided, from the 4th on round
    const ugly = k === 1 ? 1 : 1 - quality;
    const done = k === 1 ? BURNT : mix(mix(BURNT, GOLD, 0.55), GOLD, quality);
    const cook = clamp01((g - pour) / (land - FLIGHT - pour));
    const c = mix(RAW, done, k === 1 ? Math.pow(cook, 0.7) : cook);
    const r = 0.15 * (0.55 + 0.45 * Math.min(1, (g - pour) / 6)); // batter spreads
    if (g < land - FLIGHT) {
      cakes.push(<Cake key={k} at={[AX, TOP + 0.057, PAN_Z]} c={c} ugly={ugly * cook} r={r} />);
    } else if (g < land) {
      // flipped over onto the plate
      const u = (g - (land - FLIGHT)) / FLIGHT;
      const y0 = TOP + 0.057;
      const y1 = PLATE[1] + 0.02 + (k - 1) * 0.03;
      const at: V3 = [lerp(AX, PLATE[0], u), lerp(y0, y1, u) + Math.sin(u * Math.PI) * 0.45, lerp(PAN_Z, PLATE[2], u)];
      cakes.push(<Cake key={k} at={at} c={c} ugly={ugly} tilt={u * 180} />);
    } else {
      landed++;
      cakes.push(<Cake key={k} at={[PLATE[0], PLATE[1] + 0.02 + (k - 1) * 0.03, PLATE[2]]} c={c} ugly={ugly} />);
    }
  }
  // smoke while the first one burns
  const smokeK = ramp(g, 26, 30);
  const smoke = g > 26 && g < 62 ? <Fx kind="smoke" at={[AX + 0.12, TOP + 0.1 + smokeK * 0.12, PAN_Z + 0.05]} size={0.28} k={smokeK} color="#8a8078" /> : null;
  // how far along the stack is, for the label
  const label = count && landed > 0 && g >= landAt(1) ? <Label3D text={`#${landed}`} at={[PLATE[0] + 0.08, PLATE[1] + 0.15 + landed * 0.03, PLATE[2]]} size={0.09} k={clamp01((g - landAt(landed)) / 6) + (landed > 1 ? 1 : 0)} /> : null;
  return (
    <>
      {cakes}
      {smoke}
      {label}
    </>
  );
};

const rightPose = (g: number, t: number): {pose: Pose; expr: "happy" | "joy" | "smug" | "neutral"} => {
  const poured = [...Array(STACK)].some((_, i) => g >= pourAt(i + 1) && g < pourAt(i + 1) + 10);
  const flipped = [...Array(STACK)].some((_, i) => g >= landAt(i + 1) - FLIGHT - 4 && g < landAt(i + 1));
  if (g >= SLIDE[0] - 4 && g < SLIDE[1] + 6) return {pose: blend(P.idle(t, 2), P.push(t, 2), ramp(g, SLIDE[0] - 4, 5)), expr: "happy"};
  if (g >= 62 && g < 100) return {pose: P.shrug(t, 2), expr: "smug"};
  if (g >= landAt(STACK) && g < 330) return {pose: P.cheer(t, 2), expr: "joy"};
  if (flipped) return {pose: {...P.idle(t, 2), armR: [70, 30], lookY: 0.6}, expr: "happy"};
  if (poured) return {pose: {...P.idle(t, 2), armR: [40, 40], lookY: 0.7}, expr: "neutral"};
  return {pose: {...P.idle(t, 2), lookY: 0.5}, expr: g > 120 ? "happy" : "neutral"};
};

/* ---------- the perfectionist: prepares, then burns his first one anyway ---------- */

const LeftSide: React.FC<{g: number}> = ({g}) => {
  const items: React.ReactNode[] = [];
  // kitchen scale with a bowl of flour
  items.push(
    <group key="scale">
      <Box at={[-1.2, TOP, 0.32]} size={[0.26, 0.05, 0.22]} surf={{c: "#e8e4dc"}} />
      <Box at={[-1.2, TOP + 0.02, 0.44]} size={[0.12, 0.02, 0.005]} surf={{c: "#3a7a5a", glow: 0.5}} ink={false} />
      <Cyl at={[-1.2, TOP + 0.05, 0.32]} r={0.09} r2={0.12} h={0.09} surf={{c: "#f0ece4"}} />
    </group>,
  );
  // ruler across the pan (scene 2)
  if (g >= 50 && g < 125) {
    const u = (g - 50) / 75;
    items.push(<Box key="ruler" at={[PX, TOP + 0.075, PAN_Z + Math.sin(u * Math.PI * 2) * 0.08]} size={[0.5, 0.01, 0.05]} rot={lerp(-12, 20, u)} surf={{c: "#f2c230"}} />);
  }
  // thermometer in the pan (scene 3)
  if (g >= 125 && g < 245)
    items.push(<Pole key="thermo" from={[PX + 0.05, TOP + 0.06, PAN_Z]} to={[PX - 0.05, TOP + 0.42, PAN_Z - 0.05]} r={0.012} surf={{c: "#d8dde4"}} />);
  // his first pancake
  if (g >= P_POUR) {
    const cook = clamp01((g - P_POUR) / (P_REVEAL - P_POUR));
    const r = 0.15 * (0.55 + 0.45 * Math.min(1, (g - P_POUR) / 6));
    items.push(<Cake key="first" at={[PX, TOP + 0.057, PAN_Z]} c={mix(RAW, BURNT, Math.pow(cook, 0.8))} ugly={cook} r={r} />);
    const sk = ramp(g, P_REVEAL - 10, 30);
    if (g > P_REVEAL - 10) items.push(<Fx key="smoke" kind="smoke" at={[PX - 0.12, TOP + 0.1 + sk * 0.12, PAN_Z + 0.05]} size={0.26} k={sk} color="#8a8078" />);
  }
  if (g >= P_REVEAL && g < 330) items.push(<Label3D key="n1" text="#1" at={[PX + 0.2, TOP + 0.2, PAN_Z + 0.12]} size={0.09} k={clamp01((g - P_REVEAL) / 6)} />);
  // the plate slid over to him
  if (g >= SLIDE[0]) {
    const u = easeOut(ramp(g, SLIDE[0], SLIDE[1] - SLIDE[0]));
    const x = lerp(0.12, PX + 0.32, u);
    items.push(
      <group key="gift">
        <Cyl at={[x, TOP, 0.74]} r={0.13} r2={0.15} h={0.018} surf={{c: "#f7f5ef"}} />
        <Cake at={[x, TOP + 0.018, 0.74]} c={GOLD} r={0.11} />
      </group>,
    );
  }
  return <>{items}</>;
};

const leftPose = (g: number, t: number): {pose: Pose; expr: "think" | "determined" | "nervous" | "shock" | "sad" | "happy"; item: "book" | "none"} => {
  if (g < 45) return {pose: {...P.hold(t, 1), lookY: 0.7}, expr: "think", item: "book"};
  if (g < 120) return {pose: {...P.hold(t, 1), lookY: 0.8, lookX: 0.2}, expr: "determined", item: "none"};
  if (g < 240) return {pose: g < 180 ? P.think(t, 1) : {...P.idle(t, 1), armR: [30, 60], lookX: -0.5, lookY: -0.7}, expr: g < 180 ? "think" : "nervous", item: "none"};
  if (g < P_REVEAL) return {pose: {...P.idle(t, 1), armL: [45, 40], lookY: 0.8}, expr: "determined", item: "none"};
  if (g < 330) return {pose: blend(P.idle(t, 1), P.scared(t, 1), ramp(g, P_REVEAL, 4)), expr: "shock", item: "none"};
  if (g < SLIDE[1] + 4) return {pose: P.slump(t, 1), expr: "sad", item: "none"};
  return {pose: {...P.idle(t, 1), lookX: 0.6, lookY: 0.5}, expr: "happy", item: "none"};
};

/* ---------- one shot of the kitchen ---------- */

const TopLine: React.FC<{text: string; f: number}> = ({text, f}) => {
  const words = text.split(" ");
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 205}}>
      <div style={{width: 860, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 68, lineHeight: 1.12, color: "#fff", letterSpacing: -0.5}}>
        {words.map((w, i) => {
          const k = clamp01((f - 2 - i * 2.2) / 5);
          const accent = /gagal|sempurna|ditunda|jelek|Hari|ini/.test(w);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 9px",
                opacity: k,
                transform: `translateY(${(1 - easeOut(k)) * 26}px) scale(${0.9 + 0.1 * easeOut(k)})`,
                color: accent ? "#ffd166" : "#fff",
                WebkitTextStroke: "14px #15121a",
                paintOrder: "stroke fill",
                textShadow: "0 6px 0 rgba(0,0,0,0.35)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Shot: React.FC<{cam: CamKey[]; shake?: [number, number][]; labels?: boolean; count?: boolean}> = ({cam, shake, labels = true, count = true}) => {
  const g = useG();
  const {index} = useScene();
  const f = useSceneFrame();
  const t = g / 30;
  const L = leftPose(g, t);
  const R = rightPose(g, t);
  return (
    <Stage look="kartun" light="dalam" cam={cam} hand={0.012} shake={shake} shadowSize={5} exposure={0.94} overlay={<TopLine text={LINES[index]} f={f} />}>
      <Kitchen g={g} />
      <Toon who={PERFEK} x={PX} z={CZ} h={H} pose={L.pose} expr={L.expr} item={L.item} />
      <Toon who={MULAI} x={AX} z={CZ} h={H} pose={R.pose} expr={R.expr} facing={-1} />
      {labels ? <Label3D text="PERFEKSIONIS" at={[PX, 2.0, CZ]} size={0.13} bg="#2f4f8a" /> : null}
      {labels ? <Label3D text="LANGSUNG MULAI" at={[AX - 0.04, 2.0, CZ]} size={0.13} bg="#c8551f" /> : null}
      <LeftSide g={g} />
      <RightSide g={g} count={count} />
    </Stage>
  );
};

/* ---------- shots ---------- */

const AT: V3 = [CENTER, 1.55, 0.2];
const wide = (len: number, d0: number, d1: number, y0 = 2.5, y1 = 2.45): CamKey[] => [
  {f: 0, pos: [CENTER, y0, d0], at: AT},
  {f: len, pos: [CENTER, y1, d1], at: AT, ease: "io"},
];

const S1 = () => <Shot cam={wide(45, 5.7, 5.35)} />;
// on the right cook and the plate: his first one burns
const S2 = () => (
  <Shot
    cam={[
      {f: 0, pos: [0.4, 2.05, 3.75], at: [0.4, 1.3, 0.3]},
      {f: 75, pos: [0.4, 2.0, 3.45], at: [0.4, 1.28, 0.3], ease: "io"},
    ]}
    labels={false}
  />
);
// wide and high: the clock races, the stack grows
const S3 = () => (
  <Shot
    cam={[
      {f: 0, pos: [CENTER, 2.75, 6.3], at: [CENTER, 1.62, 0.1]},
      {f: 120, pos: [CENTER, 2.65, 5.75], at: [CENTER, 1.6, 0.1], ease: "io"},
    ]}
  />
);
// on the perfectionist; crash zoom when his first one comes out burnt
const REV = P_REVEAL - SCENES[3].from;
const S4 = () => (
  <Shot
    cam={[
      {f: 0, pos: [-0.8, 1.95, 3.5], at: [-0.8, 1.32, 0.3]},
      {f: REV - 2, pos: [-0.8, 1.9, 3.3], at: [-0.8, 1.3, 0.3], ease: "io"},
      {f: REV + 5, pos: [-0.85, 1.7, 3.3], at: [-0.85, 1.28, 0.4], fov: 33, ease: "out"},
      {f: 90, pos: [-0.85, 1.68, 3.2], at: [-0.85, 1.28, 0.4], fov: 32, ease: "io"},
    ]}
    labels={false}
    count={false}
    shake={[[REV + 5, 0.5]]}
  />
);
const S5 = () => <Shot cam={wide(90, 5.6, 5.25)} />;

export const PancakePertama: React.FC<{narration?: string}> = ({narration}) => (
  <Film scenes={SCENES} cues={CUES} kinds={["cut", "cut", "cut", "cut"]} narration={narration} render={(i) => [<S1 key={0} />, <S2 key={1} />, <S3 key={2} />, <S4 key={3} />, <S5 key={4} />][i]} />
);
