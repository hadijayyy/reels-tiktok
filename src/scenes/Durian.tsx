import React from "react";
import * as THREE from "three";
import {AbsoluteFill} from "remotion";
import {Film, pop, useScene} from "../story/StoryKit";
import {useSceneFrame} from "../camera/Transitions";
import {
  Ball, Bush, CamKey, Clouds, Cyl, Fx, Ground, Hill, House, Label3D, Lamp, P, Pole, Box, Rock, SKIN, Stage, SunDisc, Toon, Tree, Water, Who, blend, orbit, useStage, V3, Pose,
} from "../cartoon";
import {CUES, SCENES} from "./durianTiming";

/*
 * "Tiga Pilot dan Buah Durian" (lelucon): three pilots, a fictional island tribe, ten fruits swallowed whole.
 * Twelve scenes, one per narration line. Beheadings are never shown: the picture cuts to black.
 */

/* ---------- cast (our own designs; the tribe is fictional) ---------- */

const PILOT1: Who = {name: "pilot1", skin: SKIN.light, shirt: "#8a5a32", pants: "#5a5f3a", hat: "cap", hatColor: "#5a3e26", glasses: true, sash: "#e8e2d2", seed: 11};
const PILOT2: Who = {name: "pilot2", skin: SKIN.tan, shirt: "#3f6a8a", pants: "#2f3a4a", hat: "cap", hatColor: "#2a3442", moustache: "#5a3a22", sash: "#e8e2d2", seed: 12};
const PILOT3: Who = {name: "pilot3", skin: SKIN.light, shirt: "#6f7a4a", pants: "#3e4430", hat: "cap", hatColor: "#3a3a32", glasses: true, build: "tall", seed: 13};
const KEPALA: Who = {name: "kepala suku", skin: SKIN.brown, shirt: "#b5462e", pants: "#6a3f22", skirt: "#d9b45a", hat: "crown", hatColor: "#f2efe6", beard: "#ecebe6", sash: "#f2c236", build: "stout", seed: 21};
const warrior = (seed: number, shirt: string): Who => ({name: `prajurit${seed}`, skin: seed % 2 ? SKIN.brown : SKIN.dark, shirt, pants: "#5a3a22", skirt: "#cfa656", hair: "spiky", hairColor: "#1d1410", sash: "#c8322e", seed});
const W1 = warrior(31, "#8a6a3a");
const W2 = warrior(32, "#6a5a32");
const W3 = warrior(33, "#7a4a2a");
const W4 = warrior(34, "#8a5a32");

/* ---------- helpers ---------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (f: number, a: number, len: number) => clamp01((f - a) / len);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Scene-local frame where word w of the scene's caption phrase j is spoken (from the alignment). */
const useWordAt = () => {
  const {index} = useScene();
  const s = SCENES[index];
  const cues = (CUES as {from: number; words?: {f: number}[]}[]).filter((c) => c.from >= s.from - 2 && c.from < s.from + s.len);
  return (j: number, w: number) => {
    const c = cues[Math.min(j, cues.length - 1)];
    const word = c?.words?.[Math.min(w, (c.words?.length ?? 1) - 1)];
    return (word?.f ?? c?.from ?? s.from) - s.from;
  };
};

/** Laughing hard: leaning back, mouth wide, shoulders bouncing. */
const laugh = (t: number, seed = 0): Pose => ({
  ...P.idle(t, seed),
  armL: [40, 120 + Math.sin(t * 18) * 10],
  armR: [40, 120 + Math.sin(t * 18 + 1) * 10],
  lean: -10 + Math.sin(t * 16) * 4,
  bob: -Math.abs(Math.sin(t * 14)) * 14,
  talk: 0.7 + Math.sin(t * 22) * 0.3,
  tilt: -8,
  blink: 1,
});
/** "Ssst": a finger to the lips. */
const shush = (t: number, seed = 0): Pose => ({...P.idle(t, seed), armR: [28, 165], lookX: -0.4});
/** Shaking with fear while trying to hold something in. */
const strain = (t: number, seed = 0, k = 1): Pose => ({...P.idle(t, seed), armL: [20, 210], armR: [20, 210], bob: 6 + Math.sin(t * 50) * 3 * k, squash: 0.96, lookY: -0.3});

/** Black-out that hides the beheading: fades in over 4 frames from `at`. */
const Blackout: React.FC<{f: number; at: number}> = ({f, at}) => {
  const k = ramp(f, at, 4);
  return k <= 0 ? null : <AbsoluteFill style={{backgroundColor: "#000", opacity: k}} />;
};

/** White flash on an impact. */
const Flash: React.FC<{f: number; at: number}> = ({f, at}) => {
  const d = f - at;
  return d < 0 || d > 6 ? null : <AbsoluteFill style={{backgroundColor: "#fff", opacity: 0.7 * (1 - d / 6)}} />;
};

/* ---------- props ---------- */

const APPLE = {c: "#d8342c"};
const LONGAN = {c: "#c9a56a", tex: "stone" as const, tile: 0.2};

const Apple: React.FC<{at: V3; s?: number}> = ({at, s = 1}) => (
  <group>
    <Ball at={at} r={0.085 * s} sy={0.9} surf={APPLE} seg={14} />
    <Pole from={[at[0], at[1] + 0.06 * s, at[2]]} to={[at[0] + 0.01, at[1] + 0.12 * s, at[2]]} r={0.008 * s} surf={{c: "#5a3a22"}} ink={false} />
  </group>
);
const Longan: React.FC<{at: V3}> = ({at}) => <Ball at={at} r={0.032} surf={LONGAN} seg={10} />;

/** A flat stone with a big leaf on it: where the fruits wait. `n` fruits remain on it. */
const FruitStone: React.FC<{at: V3; kind: "apple" | "longan"; n: number}> = ({at, kind, n}) => {
  const top = at[1] + 0.5;
  const spots: V3[] = [];
  const step = kind === "apple" ? 0.17 : 0.07;
  const per = kind === "apple" ? 4 : 5;
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / per);
    const col = i % per;
    const lift = kind === "apple" ? 0.085 + row * 0.1 : 0.032 + row * 0.03;
    spots.push([at[0] + (col - (per - 1) / 2) * step + (row % 2) * step * 0.5, top + lift, at[2] + (row % 2 ? -0.06 : 0.04) - row * 0.02]);
  }
  return (
    <group>
      <Cyl at={at} r={0.42} r2={0.36} h={0.5} surf={{c: "#8f8a80", tex: "stone", tile: 0.6}} seg={9} />
      <Box at={[at[0], top, at[2]]} size={[0.75, 0.012, 0.42]} surf={{c: "#4f9a46"}} ink={false} />
      {spots.slice(0, n).map((p, i) => (kind === "apple" ? <Apple key={i} at={p} /> : <Longan key={i} at={p} />))}
    </group>
  );
};

/** A durian: a green-brown ball covered in spikes. `at` = centre. */
const SPIKES: V3[] = (() => {
  const out: V3[] = [];
  const n = 46;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
})();
const Durian: React.FC<{at: V3; r?: number}> = ({at, r = 0.3}) => (
  <group position={at}>
    <Ball at={[0, 0, 0]} r={r} sy={1.15} surf={{c: "#8fa03a", tex: "grass", tile: 0.3}} seg={18} />
    {SPIKES.map((d, i) => {
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d));
      const e = new THREE.Euler().setFromQuaternion(q);
      const k = (v: number) => (v * 180) / Math.PI;
      return <Cyl key={i} at={[d[0] * r * 0.96, d[1] * r * 1.1, d[2] * r * 0.96]} r={r * 0.13} r2={0} h={r * 0.3} rot={[k(e.x), k(e.y), k(e.z)]} surf={{c: "#6f7f2a"}} seg={5} ink={false} />;
    })}
  </group>
);

/** A spear held upright next to a warrior. */
const Spear: React.FC<{x: number; z: number; up?: number}> = ({x, z, up = 0}) => (
  <group>
    <Pole from={[x, 0.15 + up, z + 0.05]} to={[x, 2.25 + up, z + 0.05]} r={0.022} surf={{c: "#7a5232"}} />
    <Cyl at={[x, 2.22 + up, z + 0.05]} r={0.05} r2={0} h={0.22} surf={{c: "#cfcfc8"}} seg={6} />
  </group>
);

/** A halo over a dead pilot's head. */
const Halo: React.FC<{x: number; z: number; y?: number}> = ({x, z, y = 1.8}) => {
  const st = useStage();
  if (st.probe !== null) return null;
  const bob = Math.sin(st.t * 2.4 + x) * 0.03;
  return (
    <group>
      <mesh position={[x, y + bob, z]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
        <torusGeometry args={[0.17, 0.028, 8, 28]} />
        <meshBasicMaterial color="#ffe27a" toneMapped={false} />
      </mesh>
      <Fx kind="glow" at={[x, y + bob, z]} size={0.8} k={0.7} color="#fff2b0" />
    </group>
  );
};

/** A propeller plane, nose toward +x, centred at the origin of its group. */
const Plane: React.FC<{at: V3; pitch: number; spin: number}> = ({at, pitch, spin}) => {
  const body = {c: "#6f7a4a", tex: "planks" as const, tile: 0.8};
  return (
    <group position={at} rotation={[0, 0, (pitch * Math.PI) / 180]}>
      <Cyl at={[-1.0, 0, 0]} r={0.16} r2={0.3} h={1.6} rot={[0, 0, -90]} surf={body} />
      <Cyl at={[0.6, 0, 0]} r={0.3} r2={0.22} h={0.55} rot={[0, 0, -90]} surf={body} />
      <Box at={[0.15, -0.08, 0]} size={[0.7, 0.07, 3.0]} surf={body} />
      <Box at={[-0.9, 0, 0]} size={[0.35, 0.55, 0.06]} surf={body} />
      <Box at={[-0.9, 0.02, 0]} size={[0.32, 0.05, 1.0]} surf={body} />
      <Ball at={[0.15, 0.28, 0]} r={0.16} sy={0.8} surf={{c: "#a9dcf3"}} />
      <group position={[1.18, 0, 0]} rotation={[spin, 0, 0]}>
        <Box at={[0, -0.45, 0]} size={[0.05, 0.9, 0.09]} surf={{c: "#2a2420"}} />
      </group>
    </group>
  );
};

/* ---------- the village set (shared by most scenes) ---------- */

const HUT_WALL = {c: "#b8925a", tex: "planks" as const, tile: 0.8};
const HUT_ROOF = {c: "#c9a65a", tex: "roof" as const, tile: 1};

const Totem: React.FC<{at: V3}> = ({at}) => (
  <group>
    <Cyl at={at} r={0.22} h={0.7} surf={{c: "#a0522d", tex: "planks", tile: 0.5}} />
    <Cyl at={[at[0], at[1] + 0.7, at[2]]} r={0.24} h={0.6} surf={{c: "#d9a04f", tex: "planks", tile: 0.5}} />
    <Cyl at={[at[0], at[1] + 1.3, at[2]]} r={0.22} h={0.6} surf={{c: "#4f7a8a", tex: "planks", tile: 0.5}} />
    <Box at={[at[0], at[1] + 1.55, at[2]]} size={[0.9, 0.12, 0.12]} surf={{c: "#c8322e"}} />
  </group>
);

const Pot: React.FC<{at: V3}> = ({at}) => {
  const st = useStage();
  return (
    <group>
      <Cyl at={at} r={0.5} r2={0.62} h={0.75} surf={{c: "#3a3836", tex: "stone", tile: 0.6}} />
      <Cyl at={[at[0], at[1] + 0.7, at[2]]} r={0.55} h={0.03} surf={{c: "#7fa0a8", tex: "water", tile: 0.6}} ink={false} />
      <Fx kind="smoke" at={[at[0], at[1] + 1.2 + ((st.t * 0.5) % 1) * 0.6, at[2]]} size={0.7} k={(st.t * 0.5) % 1} color="#e8e4dc" />
    </group>
  );
};

const Village: React.FC<{fire?: boolean}> = ({fire = true}) => (
  <group>
    <Ground surf={{c: "#7a9a4a", tex: "grass", tile: 2}} />
    <Box at={[0, 0.001, -1.2]} size={[7, 0.01, 4.5]} surf={{c: "#b08a5a", tex: "dirt", tile: 1.5}} ink={false} cast={false} />
    <Hill at={[-12, 0, -26]} r={10} h={7} surf={{c: "#3f7a3a", tex: "grass", tile: 3}} />
    <Hill at={[10, 0, -30]} r={13} h={9} surf={{c: "#356a34", tex: "grass", tile: 3}} />
    <House at={[-4.2, 0, -5.5]} w={3} d={2.6} h={1.9} rot={14} wall={HUT_WALL} roof={HUT_ROOF} />
    <House at={[4.4, 0, -6.5]} w={3.2} d={2.6} h={2} rot={-18} wall={HUT_WALL} roof={HUT_ROOF} />
    <Totem at={[2.3, 0, -2.6]} />
    <Pot at={[-1.9, 0, -2.0]} />
    {fire ? <Lamp at={[0.6, 0, -2.4]} kind="fire" power={5} /> : null}
    {[[-6.5, -3], [-7, -9], [-2.2, -9.5], [1.2, -10.5], [6.8, -3.2], [7.5, -10], [-9.5, -6], [10, -6.5]].map(([x, z], i) => (
      <Tree key={i} at={[x, 0, z]} s={1.2 + (i % 3) * 0.25} leaf={i % 2 ? "#3f8a3e" : "#4f9a46"} seed={i + 2} />
    ))}
    <Bush at={[-3.2, 0, -1.6]} s={0.9} />
    <Bush at={[3.4, 0, -1.2]} s={1.1} c="#3f8a3e" />
    <Rock at={[-2.8, 0, 0.6]} s={0.7} />
    <Rock at={[2.8, 0, 0.9]} s={0.6} />
  </group>
);

/* ---------- scenes ---------- */

const FLY_A: V3 = [-3.0, 7.0, -6];
const FLY_B: V3 = [3.2, 2.0, -9];

// 1. The plane falls on the island, then the pilots are surrounded.
const S1Jatuh: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const caught = cueAt(2);
  if (f < caught) {
    const k = ramp(f, 0, caught - 6);
    const pos = lerp3(FLY_A, FLY_B, k);
    const crash = caught - 8;
    const cam: CamKey[] = [
      {f: 0, pos: [0.6, 4.6, 7.5], at: [-1.2, 5.2, -6], fov: 46},
      {f: caught, pos: [0.4, 3.6, 6.4], at: [1.2, 3.4, -7], fov: 44},
    ];
    return (
      <Stage look="kartun" light="siang" cam={cam} shake={[[crash, 0.8]]} hand={0.03}>
        <Water y={0} size={160} c="#3f9fc4" />
        <Hill at={[1, 0, -11]} r={9} h={1.6} surf={{c: "#d9c48a", tex: "dirt", tile: 2}} />
        <Hill at={[1.5, 0, -12]} r={7.5} h={2.4} surf={{c: "#4f9a46", tex: "grass", tile: 2}} />
        {[[-2.5, -8], [0, -7.6], [2.6, -8.4], [4.8, -9.6], [-4.4, -10], [1.2, -10.5]].map(([x, z], i) => (
          <Tree key={i} at={[x, 1.2, z]} s={1 + (i % 2) * 0.3} seed={i} />
        ))}
        <Clouds seed={5} y={9} z={-24} />
        <SunDisc at={[-8, 14, -40]} size={3} />
        {f < crash + 2 ? <Plane at={pos} pitch={-24} spin={f * 1.3} /> : null}
        {[0.08, 0.16, 0.24, 0.32].map((d, i) => {
          const kk = ramp(f, 0, caught - 6) - d;
          if (kk <= 0 || f > crash) return null;
          return <Fx key={i} kind="smoke" at={lerp3(FLY_A, FLY_B, kk)} size={0.9 + i * 0.25} k={0.3 + i * 0.15} color="#5a5450" />;
        })}
        <Fx kind="burst" at={[3.2, 2.2, -9]} size={3} k={(f - crash) / 14} />
        <Fx kind="smoke" at={[3.2, 3.2 + ramp(f, crash, 30), -9]} size={2.4} k={ramp(f, crash + 4, 30)} color="#4a4440" />
      </Stage>
    );
  }
  const g = f - caught;
  return (
    <Stage look="kartun" light="siang" hand={0.025} cam={[{f: caught, pos: [0.25, 1.75, 6.6], at: [0.25, 1.05, 0], ease: "cut"}, {f: len, pos: [0.25, 1.6, 5.4], at: [0.25, 1.05, 0]}]}>
      <Village />
      <Toon who={PILOT1} x={-0.4} z={0.2} pose={P.scared(t, 1)} expr="scared" />
      <Toon who={PILOT2} x={0.12} z={0.35} pose={P.scared(t, 2)} expr="shock" />
      <Toon who={PILOT3} x={0.62} z={0.15} pose={P.scared(t, 3)} expr="scared" />
      <Toon who={W1} x={-0.72} z={-0.7} pose={P.idle(t, 4)} expr="angry" />
      <Spear x={-0.94} z={-0.7} />
      <Toon who={W2} x={0.92} z={-0.9} pose={P.idle(t, 5)} expr="angry" facing={-1} />
      <Spear x={1.14} z={-0.9} />
      <Toon who={W3} x={-0.15} z={-1.3} pose={P.idle(t, 6)} expr="smug" />
      <Spear x={-0.37} z={-1.3} />
      <Fx kind="exclaim" at={[0.12, 2.15, 0.35]} size={0.5} k={pop(g, 6)} />
    </Stage>
  );
};

// 2. The chief sets the condition: ten fruits of one kind, three hours.
const S2Syarat: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const ten = cueAt(1);
  const three = cueAt(2);
  const talk = f < three ? P.talk(t, 21) : P.point(t, 21);
  const chiefPose = f >= ten && f < three ? blend(P.talk(t, 21), {...P.lift(t, 21), talk: P.talk(t, 21).talk, lookY: 0}, ramp(f, ten, 6)) : talk;
  if (f < three) {
    return (
      <Stage look="kartun" light="senja" hand={0.02} cam={[{f: 0, pos: orbit([0, 1.2, 0], 3.6, 1.35, -14), at: [0.15, 1.25, 0]}, {f: ten, pos: orbit([0, 1.2, 0], 3.1, 1.3, -4), at: [0.15, 1.3, 0]}, {f: three, pos: orbit([0, 1.2, 0], 2.9, 1.3, 2), at: [0.15, 1.35, 0]}]}>
        <Village />
        <Toon who={KEPALA} x={-0.1} z={0} pose={chiefPose} expr={f < ten ? "smug" : "happy"} />
        <Toon who={W4} x={0.7} z={-1.3} pose={P.idle(t, 7)} expr="smug" facing={-1} />
        <Spear x={0.92} z={-1.3} />
        <Label3D text="10 BUAH" at={[-0.1, 2.35, 0.1]} size={0.34} k={pop(f, ten + 4)} bg="#e9b04f" />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="senja" hand={0.03} cam={[{f: three, pos: [0.2, 1.55, 5.4], at: [0.2, 1.3, 0], ease: "cut", fov: 42}, {f: len, pos: [0.2, 1.5, 4.9], at: [0.2, 1.32, 0], fov: 40}]}>
      <Village />
      <Toon who={PILOT1} x={-0.33} z={0.1} pose={P.idle(t, 1)} expr="nervous" />
      <Toon who={PILOT2} x={0.15} z={0.25} pose={P.scared(t, 2)} expr="shock" />
      <Toon who={PILOT3} x={0.55} z={0.0} pose={P.idle(t, 3)} expr="nervous" />
      <Fx kind="drop" at={[0.4, 1.75, 0.3]} size={0.25} k={pop(f, three + 8)} />
    </Stage>
  );
};

// 3. The first pilot comes back with ten apples; the chief grins next to his pot.
const S3Apel: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const arrive = cueAt(1);
  const grin = cueAt(2);
  if (f < grin) {
    const k = ramp(f, 0, arrive);
    const x = lerp(1.4, 0.0, k);
    return (
      <Stage look="kartun" light="senja" hand={0.02} cam={[{f: 0, pos: [0.6, 1.5, 4.6], at: [0.6, 1.0, 0]}, {f: grin, pos: [0.2, 1.4, 3.6], at: [0.2, 1.0, 0]}]}>
        <Village />
        <FruitStone at={[-0.2, 0, 0.7]} kind="apple" n={f >= arrive ? 10 : 0} />
        <Toon who={PILOT1} x={x} z={0.1} pose={k < 1 ? P.run(t, 1) : P.cheer(t, 1)} expr={k < 1 ? "determined" : "joy"} facing={-1} />
        {k < 1 ? <Fx kind="lines" at={[x + 0.6, 1.0, 0.1]} size={0.8} k={1} /> : null}
        {k < 1 ? [0, 1, 2].map((i) => <Apple key={i} at={[x - 0.22 + i * 0.12, 0.85 + (i % 2) * 0.08, 0.3]} />) : null}
        <Fx kind="star" at={[-0.2, 1.0, 0.75]} size={0.5} k={pop(f, arrive)} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="senja" hand={0.015} cam={[{f: grin, pos: [-1.0, 1.45, 3.3], at: [-1.0, 1.3, -0.4], ease: "cut", fov: 40}, {f: len, pos: [-1.0, 1.42, 2.8], at: [-1.0, 1.33, -0.4], fov: 40}]}>
      <Village />
      <Toon who={KEPALA} x={-1.1} z={-0.4} pose={P.crossed(t, 21)} expr="smug" />
    </Stage>
  );
};

// 4. The rule: swallow them whole, no chewing, no sound, or lose your head.
const S4Aturan: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const quiet = cueAt(1);
  const fail = cueAt(2);
  const word = useWordAt();
  const behead = word(2, 3); // "dipenggal"
  if (f < fail) {
    return (
      <Stage look="kartun" light="senja" hand={0.02} cam={[{f: 0, pos: [0.15, 1.6, 5.2], at: [0.15, 1.1, 0]}, {f: fail, pos: [0.15, 1.5, 4.4], at: [0.15, 1.15, 0]}]}>
        <Village />
        <FruitStone at={[0.45, 0, 0.75]} kind="apple" n={10} />
        <Toon who={KEPALA} x={-0.55} z={0} pose={f < quiet ? P.point(t, 21) : shush(t, 21)} expr={f < quiet ? "happy" : "smug"} />
        <Toon who={PILOT1} x={0.6} z={0.15} pose={P.idle(t, 1)} expr={f < quiet ? "nervous" : "scared"} facing={-1} />
        <Fx kind="drop" at={[0.85, 1.75, 0.25]} size={0.25} k={pop(f, quiet + 10)} />
      </Stage>
    );
  }
  const zoom = easeOut(ramp(f, behead - 2, 6));
  return (
    <Stage look="kartun" light="senja" hand={0.04} shake={[[behead, 0.9]]} cam={[{f: fail, pos: [-0.1, 1.45, 3.2], at: [-0.1, 1.35, 0], ease: "cut", fov: lerp(44, 34, zoom)}, {f: len, pos: [-0.1, 1.45, 3.0], at: [-0.1, 1.36, 0], fov: lerp(44, 34, zoom)}]}>
      <Village />
      <Toon who={KEPALA} x={-0.2} z={0} pose={P.talk(t, 21)} expr={f < behead ? "smug" : "angry"} />
      <Toon who={W1} x={-1.3} z={-1.2} pose={f < behead ? P.idle(t, 4) : P.lift(t, 4)} expr="angry" />
      <Spear x={-1.52} z={-1.2} up={f < behead ? 0 : 0.35} />
      <Toon who={W2} x={1.0} z={-1.3} pose={f < behead ? P.idle(t, 5) : P.lift(t, 5)} expr="angry" facing={-1} />
      <Spear x={1.22} z={-1.3} up={f < behead ? 0 : 0.35} />
      <Fx kind="bang" at={[0.35, 1.75, 0.2]} size={0.6} k={pop(f, behead)} />
    </Stage>
  );
};

// 5. First apple goes down, the second one does not.
const S5Gagal: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const a1 = cueAt(0);
  const a2 = cueAt(1);
  const cant = cueAt(2);
  const wide = cueAt(3);
  const word = useWordAt();
  const behead = word(3, 2);
  const mouth: V3 = [-0.3, 1.16, 0.22];
  const hand: V3 = [-0.05, 1.0, 0.3];
  const apple1 = ramp(f, a1 + 4, 12);
  const apple2 = ramp(f, a2 + 4, 14);
  if (f < wide) {
    const strainK = ramp(f, a2 + 18, 10);
    return (
      <Stage look="kartun" light="senja" hand={0.02 + 0.03 * strainK} cam={[{f: 0, pos: [-0.25, 1.5, 2.6], at: [-0.25, 1.28, 0], fov: 40}, {f: cant, pos: [-0.28, 1.45, 1.9], at: [-0.28, 1.33, 0], fov: 38}, {f: wide, pos: [-0.28, 1.42, 1.6], at: [-0.28, 1.35, 0], fov: 34}]}>
        <Village />
        <FruitStone at={[0.25, 0, 0.7]} kind="apple" n={f < a1 + 4 ? 10 : f < a2 + 4 ? 9 : 8} />
        <Toon who={PILOT1} x={-0.3} z={0} pose={f < a2 + 18 ? blend(P.idle(t, 1), P.hold(t, 1), apple1 > 0 && apple1 < 1 ? 1 : 0) : strain(t, 1, strainK)} expr={f < a1 + 16 ? "determined" : f < a2 ? "happy" : f < cant ? "shock" : "scared"} />
        {apple1 > 0 && apple1 < 1 ? <Apple at={lerp3(hand, mouth, apple1)} s={1 - apple1 * 0.4} /> : null}
        {apple2 > 0 ? <Apple at={lerp3(hand, mouth, Math.min(apple2, 0.95))} s={1 - apple2 * 0.2} /> : null}
        <Fx kind="drop" at={[-0.05, 1.6, 0.2]} size={0.2} k={pop(f, a2 + 16)} />
        <Fx kind="drop" at={[-0.55, 1.5, 0.2]} size={0.18} k={pop(f, cant + 4)} />
        <Fx kind="exclaim" at={[-0.3, 1.95, 0.1]} size={0.35} k={pop(f, cant)} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="senja" hand={0.03} shake={[[behead, 1]]} cam={[{f: wide, pos: [0.2, 1.6, 4.8], at: [0.2, 1.15, 0], ease: "cut"}, {f: len, pos: [0.2, 1.55, 4.4], at: [0.2, 1.15, 0]}]}
      overlay={<><Flash f={f} at={behead} /><Blackout f={f} at={behead + 3} /></>}>
      <Village />
      <Toon who={PILOT1} x={-0.3} z={0.1} pose={strain(t, 1)} expr="scared" />
      <Apple at={[-0.3, 1.16, 0.28]} s={0.8} />
      <Toon who={KEPALA} x={0.45} z={-0.3} pose={f < behead - 6 ? P.point(t, 21) : P.lift(t, 21)} expr="angry" facing={-1} />
      <Fx kind="burst" at={[-0.3, 1.5, 0.3]} size={1.4} k={(f - behead) / 10} />
    </Stage>
  );
};

// 6. The second pilot brings ten longans and is very pleased with himself.
const S6Lengkeng: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const macro = cueAt(1);
  const brag = cueAt(2);
  if (f < macro) {
    const k = ramp(f, 0, macro - 4);
    return (
      <Stage look="kartun" light="senja" hand={0.02} cam={[{f: 0, pos: [0.5, 1.5, 4.4], at: [0.5, 1.0, 0]}, {f: macro, pos: [0.3, 1.4, 3.8], at: [0.3, 1.0, 0]}]}>
        <Village />
        <FruitStone at={[0.2, 0, 0.75]} kind="longan" n={0} />
        <Toon who={PILOT2} x={lerp(1.6, 0.25, k)} z={0.1} pose={k < 1 ? P.walk(t, 1.3, 2) : P.idle(t, 2)} expr="happy" facing={-1} />
      </Stage>
    );
  }
  if (f < brag) {
    return (
      <Stage look="kartun" light="senja" hand={0.01} cam={[{f: macro, pos: [0.2, 1.25, 2.1], at: [0.2, 0.6, 0.75], fov: 36, ease: "cut"}, {f: brag, pos: [0.2, 1.15, 1.85], at: [0.2, 0.58, 0.75], fov: 34}]}>
        <Village />
        <FruitStone at={[0.2, 0, 0.75]} kind="longan" n={Math.min(10, Math.floor(ramp(f, macro, 18) * 10) + 1)} />
        <Toon who={PILOT2} x={0.25} z={0.1} pose={P.idle(t, 2)} expr="happy" facing={-1} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="senja" hand={0.02} cam={[{f: brag, pos: [0.05, 1.45, 3.1], at: [0.05, 1.3, 0], ease: "cut", fov: 40}, {f: len, pos: orbit([0.05, 1.3, 0], 2.8, 1.42, 8), at: [0.05, 1.32, 0], fov: 40}]}>
      <Village />
      <FruitStone at={[0.35, 0, 0.75]} kind="longan" n={10} />
      <Toon who={PILOT2} x={0.0} z={0.1} pose={P.hips(t, 2)} expr="smug" />
      <Fx kind="star" at={[0.4, 1.85, 0.2]} size={0.3} k={pop(f, brag + 10)} />
    </Stage>
  );
};

// 7. One, two, three... nine. On the tenth he looks up, laughs, and the picture goes black.
const S7Hitung: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const word = useWordAt();
  const counts = [word(0, 0), word(0, 1), word(0, 2)];
  const nine0 = cueAt(1);
  const tenth = cueAt(2);
  for (let i = 3; i < 9; i++) counts.push(Math.round(lerp(nine0, tenth - 18, (i - 3) / 5)));
  const behead = word(3, 2);
  const swallowed = counts.filter((c) => f >= c + 10).length;
  const current = counts.findIndex((c) => f >= c && f < c + 10);
  const mouth: V3 = [-0.15, 1.23, 0.2];
  const hand: V3 = [0.1, 1.0, 0.32];
  const n = counts.filter((c) => f >= c).length;
  const lookUp = f >= tenth + 8;
  const laughing = f >= tenth + 36;
  const gulp = current >= 0 ? Math.sin(ramp(f, counts[current], 10) * Math.PI) : 0;
  if (f < behead) {
    const zoom = easeOut(ramp(f, tenth + 6, 6));
    const pose: Pose = laughing ? laugh(t, 2) : lookUp ? {...P.idle(t, 2), lookX: 1, armL: [20, 200], armR: [20, 200]} : {...P.hold(t, 2), squash: 1 - gulp * 0.05};
    return (
      <Stage look="kartun" light="senja" hand={lookUp ? 0.035 : 0.015}
        cam={[{f: 0, pos: [0.0, 1.5, 2.8], at: [0.0, 1.25, 0], fov: 42}, {f: tenth, pos: [-0.05, 1.45, 2.2], at: [-0.05, 1.3, 0], fov: 40}, {f: tenth + 6, pos: [-0.05, 1.45, 2.2], at: [-0.05, 1.32, 0], fov: lerp(40, 32, zoom), ease: "out"}, {f: behead, pos: [-0.05, 1.45, 2.0], at: [-0.05, 1.33, 0], fov: 32}]}>
        <Village />
        <FruitStone at={[0.45, 0, 0.75]} kind="longan" n={10 - n - (f >= tenth ? 1 : 0)} />
        <Toon who={PILOT2} x={-0.15} z={0} pose={pose} expr={laughing ? "joy" : lookUp ? "shock" : f >= tenth ? "determined" : swallowed >= 3 ? "smug" : "happy"} />
        {current >= 0 ? <Longan at={lerp3(hand, mouth, ramp(f, counts[current], 8))} /> : null}
        {f >= tenth && !laughing ? <Longan at={lerp3(hand, mouth, Math.min(0.85, ramp(f, tenth, 8)))} /> : null}
        {laughing ? <Longan at={[mouth[0] + 0.3 + ramp(f, tenth + 36, 20) * 0.5, mouth[1] + 0.25 - Math.pow(ramp(f, tenth + 36, 20), 2) * 0.9, mouth[2] + 0.1]} /> : null}
        <Label3D text={f < tenth ? String(Math.max(1, n)) : "10"} at={[0.3, 1.72, 0.1]} size={0.22} k={f < counts[0] || f >= tenth + 4 ? 0 : 1} bg={f < tenth ? "#e9b04f" : "#c8322e"} />
        <Fx kind="exclaim" at={[0.3, 1.9, 0.1]} size={0.35} k={lookUp && !laughing ? pop(f, tenth + 8) : 0} />
        <Fx kind="lines" at={[-0.55, 1.4, 0.1]} size={0.6} k={laughing ? 1 : 0} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="senja" hand={0.03} shake={[[behead, 1]]} cam={[{f: behead, pos: [0.15, 1.6, 4.8], at: [0.15, 1.15, 0], ease: "cut"}, {f: len, pos: [0.15, 1.55, 4.4], at: [0.15, 1.15, 0]}]}
      overlay={<><Flash f={f} at={behead + 2} /><Blackout f={f} at={behead + 5} /></>}>
      <Village />
      <Toon who={PILOT2} x={-0.4} z={0.1} pose={laugh(t, 2)} expr="joy" />
      <Toon who={KEPALA} x={0.45} z={-0.3} pose={P.lift(t, 21)} expr="angry" facing={-1} />
      <Fx kind="burst" at={[-0.4, 1.5, 0.3]} size={1.4} k={(f - behead - 2) / 10} />
    </Stage>
  );
};

/* Heaven: a floor of clouds and a bright sky. */
const Heaven: React.FC = () => (
  <group>
    <Ground surf={{c: "#f4f6fb"}} />
    {[[-2.6, -2.5, 1.2], [2.4, -3.2, 1.5], [-1.2, -6, 2], [3.5, -7, 2.3], [-4.5, -5, 1.8], [0.8, -9, 2.6]].map(([x, z, s], i) => (
      <group key={i}>
        <Ball at={[x, 0.1, z]} r={s} sy={0.45} surf={{c: "#ffffff"}} seg={16} />
        <Ball at={[x + s * 0.8, 0.05, z + 0.2]} r={s * 0.7} sy={0.45} surf={{c: "#f4f6fb"}} seg={16} />
      </group>
    ))}
    <Clouds seed={8} y={6} z={-18} c="#ffffff" />
    <SunDisc at={[3, 9, -30]} size={4} c="#fff6d8" />
  </group>
);
const HEAVEN_SKY: [string, string] = ["#8fd0ff", "#fff4dc"];

// 8. In heaven, the first pilot asks why the second one died.
const S8Surga: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const ask = cueAt(1);
  return (
    <Stage look="kartun" light="siang" sky={HEAVEN_SKY} hand={0.015} cam={[{f: 0, pos: [0.15, 2.3, 6.4], at: [0.15, 1.2, 0]}, {f: ask, pos: [0.15, 1.65, 5.0], at: [0.15, 1.15, 0], ease: "io"}, {f: len, pos: [0.15, 1.6, 4.7], at: [0.15, 1.15, 0]}]}>
      <Heaven />
      <Toon who={PILOT1} x={-0.3} z={0} pose={f < ask ? P.idle(t, 1) : P.talk(t, 1)} expr={f < ask ? "neutral" : "think"} />
      <Halo x={-0.3} z={0} />
      <Toon who={PILOT2} x={0.55} z={0.1} pose={P.slump(t, 2)} expr="sad" facing={-1} />
      <Halo x={0.55} z={0.1} y={1.72} />
      <Fx kind="question" at={[-0.3, 2.15, 0.1]} size={0.4} k={pop(f, ask + 6)} />
    </Stage>
  );
};

// 9. "I should have made it! But on the tenth one, I saw the third pilot bringing..."
const S9Cerita: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const back = cueAt(1);
  const saw = cueAt(2);
  if (f < back) {
    return (
      <Stage look="kartun" light="siang" sky={HEAVEN_SKY} hand={0.025} cam={[{f: 0, pos: [0.5, 1.45, 3.2], at: [0.5, 1.32, 0], fov: 40}, {f: back, pos: [0.5, 1.45, 2.9], at: [0.5, 1.33, 0], fov: 40}]}>
        <Heaven />
        <Toon who={PILOT2} x={0.5} z={0} pose={{...P.talk(t, 2), armL: [60, 90], armR: [60, 90]}} expr="angry" />
        <Halo x={0.5} z={0} />
      </Stage>
    );
  }
  if (f < saw) {
    return (
      <Stage look="kartun" light="kenangan" hand={0.02} cam={[{f: back, pos: [-0.1, 1.45, 2.2], at: [-0.1, 1.3, 0], ease: "cut", fov: 40}, {f: saw, pos: [-0.1, 1.45, 1.9], at: [-0.1, 1.32, 0], fov: 38}]}>
        <Village />
        <Toon who={PILOT2} x={-0.15} z={0} pose={P.hold(t, 2)} expr="determined" />
        <Longan at={[-0.15, 1.23, 0.2]} />
        <FruitStone at={[0.45, 0, 0.75]} kind="longan" n={0} />
      </Stage>
    );
  }
  const k = ramp(f, saw, len - saw);
  return (
    <Stage look="kartun" light="kenangan" hand={0.02} cam={[{f: saw, pos: [0.3, 1.7, 5.2], at: [0.3, 1.45, -1.5], ease: "cut", fov: 40}, {f: len, pos: [0.3, 1.65, 4.6], at: [0.3, 1.5, -1.0], fov: 38}]}>
      <Village />
      <Toon who={PILOT3} x={lerp(0.1, 0.25, k)} z={lerp(-2.6, -1.4, k)} pose={{...P.walk(t, 0.8, 3), armL: [14, 238], armR: [14, 238]}} expr="happy" />
      <Durian at={[lerp(0.1, 0.25, k), 0.72, lerp(-2.6, -1.4, k) + 0.3]} r={0.26} />
    </Stage>
  );
};

// 10. "A DURIAN!" -- and the laugh that cost him his head.
const S10Durian: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const laughAt = cueAt(1);
  if (f < laughAt) {
    const zoom = easeOut(ramp(f, 4, 6));
    return (
      <Stage look="kartun" light="kenangan" hand={0.03} shake={[[6, 0.7]]} cam={[{f: 0, pos: [0.25, 1.15, 3.4], at: [0.25, 1.1, 0], fov: lerp(48, 38, zoom)}, {f: laughAt, pos: [0.25, 1.15, 3.2], at: [0.25, 1.1, 0], fov: lerp(48, 38, zoom)}]}>
        <Village />
        <Toon who={PILOT3} x={0.2} z={-0.2} pose={P.hold(t, 3)} expr="nervous" />
        <Durian at={[0.25, 0.72, 0.15]} r={0.28} />
        <Fx kind="lines" at={[0.25, 0.95, 0.2]} size={1.2} k={pop(f, 6)} />
        <Fx kind="drop" at={[0.55, 1.6, 0.0]} size={0.2} k={pop(f, 12)} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="kenangan" hand={0.04} shake={[[laughAt + 2, 0.5]]} cam={[{f: laughAt, pos: [0.05, 1.45, 3.1], at: [0.05, 1.3, 0], ease: "cut", fov: 40}, {f: len, pos: orbit([0.05, 1.3, 0], 2.8, 1.45, -10), at: [0.05, 1.32, 0], fov: 40}]}>
      <Village />
      <Toon who={PILOT2} x={0.0} z={0} pose={laugh(t, 2)} expr="joy" />
      <Longan at={[0.35 + ramp(f, laughAt, 16) * 0.4, 1.55 - Math.pow(ramp(f, laughAt, 16), 2) * 1.0, 0.25]} />
      <Fx kind="lines" at={[-0.45, 1.45, 0.1]} size={0.6} k={1} />
      <Fx kind="lines" at={[0.45, 1.45, 0.1]} size={0.6} k={1} />
    </Stage>
  );
};

// 11. Back in heaven: officially the unluckiest man in history.
const S11Sial: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const title = cueAt(1);
  return (
    <Stage look="kartun" light="siang" sky={HEAVEN_SKY} hand={0.015} cam={[{f: 0, pos: [0.15, 1.7, 5.0], at: [0.15, 1.25, 0]}, {f: len, pos: [0.15, 1.6, 4.3], at: [0.15, 1.3, 0]}]}>
      <Heaven />
      <Toon who={PILOT2} x={-0.2} z={0.1} pose={P.slump(t, 2)} expr="sad" />
      <Halo x={-0.2} z={0.1} y={1.72} />
      <Toon who={PILOT1} x={0.5} z={-0.1} pose={{...P.idle(t, 1), armL: [80, 20]}} expr="sad" facing={-1} />
      <Halo x={0.5} z={-0.1} />
      <Fx kind="drop" at={[0.0, 1.55, 0.3]} size={0.18} k={pop(f, 20)} />
      <Label3D text="PALING SIAL" at={[0.1, 2.15, 0.2]} size={0.26} k={pop(f, title + 4)} bg="#c8322e" />
    </Stage>
  );
};

// 12. Will the third pilot survive?
const S12Tanya: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const ask = cueAt(1);
  return (
    <Stage look="kartun" light="senja" hand={0.03} cam={[{f: 0, pos: [0.2, 1.7, 5.4], at: [0.2, 1.1, 0]}, {f: len, pos: [0.15, 1.5, 4.1], at: [0.15, 1.15, 0]}]}>
      <Village />
      <Toon who={PILOT3} x={-0.2} z={0.3} pose={strain(t, 3)} expr="scared" />
      <Durian at={[-0.18, 0.72, 0.55]} r={0.26} />
      <Toon who={KEPALA} x={0.55} z={-0.6} pose={P.crossed(t, 21)} expr="smug" facing={-1} />
      <Toon who={W3} x={-0.55} z={-1.5} pose={P.idle(t, 6)} expr="smug" />
      <Spear x={-0.77} z={-1.5} />
      <Fx kind="question" at={[-0.2, 2.1, 0.35]} size={0.45} k={pop(f, ask + 4)} />
    </Stage>
  );
};

export const TigaPilotDurian: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={SCENES}
    cues={CUES}
    kinds={["whip", "cut", "cut", "cut", "fade", "cut", "fade", "cut", "cut", "whip", "fade"]}
    narration={narration}
    render={(i) => [<S1Jatuh key={0} />, <S2Syarat key={1} />, <S3Apel key={2} />, <S4Aturan key={3} />, <S5Gagal key={4} />, <S6Lengkeng key={5} />, <S7Hitung key={6} />, <S8Surga key={7} />, <S9Cerita key={8} />, <S10Durian key={9} />, <S11Sial key={10} />, <S12Tanya key={11} />][i]}
  />
);
