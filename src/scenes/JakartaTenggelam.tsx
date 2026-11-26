import React from "react";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {eOut, lerp, prog} from "../motion/ease";
import {Film, pop, useScene} from "../story/StoryKit";
import {
  Box, CAST, Cyl, Ball, Fx, Ground, House, Label3D, Lamp, P, Pole, Road, Room, Stage, Toon, Tree, Water, Who, Surf, orbit, blend, Clouds, SunDisc, Window,
} from "../cartoon";
import {CUES, FRAMES, SCENES} from "./jakartaTiming";

/*
 * "Bagaimana Kalau Jakarta Tenggelam di Tahun 2050?" (formula A, gaya kartun 3D, 13 adegan).
 * Naskah dan sumber: scripts/narasi/jakarta.txt, scripts/narasi/jakarta-copy.md.
 */

export const JAKARTA_FRAMES = FRAMES;

const useFT = () => {
  const f = useSceneFrame();
  return {f, t: f / 30};
};

/* ---------- cast ---------- */

const RAKA: Who = {...CAST.pemuda, name: "Raka", shirt: "#3f7fc4"};
const SITI: Who = {...CAST.hijabi, name: "Siti"};
const PAK_DAR: Who = {...CAST.bapak, name: "Pak Dar"};
const BIMO: Who = {...CAST.anak, name: "Bimo"};
const KENJI: Who = {name: "Kenji", skin: "#f3d2b4", shirt: "#4a5a7a", pants: "#2a2d36", hair: "short", hairColor: "#1a1418", glasses: true};
const YUMI: Who = {name: "Yumi", skin: "#f3d2b4", shirt: "#c44d5a", pants: "#2a2d36", skirt: "#3a3d52", hair: "bun", hairColor: "#1a1418"};

/* ---------- local props ---------- */

const SEA = "#3f8fc4";
const WALL: Surf = {c: "#9a968c", tex: "stone", tile: 1.2};
const SAND: Surf = {c: "#9a8a6a", tex: "dirt", tile: 2};

const HOUSE_COLS: [string, string][] = [
  ["#efe2c6", "#b8442e"],
  ["#cfe0e8", "#3f5f8f"],
  ["#f2d6a8", "#8a4a2e"],
  ["#d8e8c6", "#b8442e"],
];

/** Kampung houses on both sides of a lane running along -z. */
const Kampung: React.FC<{lit?: boolean; from?: number}> = ({lit = false, from = -3}) => (
  <group>
    {[0, 1, 2].map((i) => (
      <React.Fragment key={i}>
        <House at={[-3.4, 0, from - i * 5]} rot={90} w={3.6} d={3.2} h={2.4} wall={{c: HOUSE_COLS[i % 4][0], tex: "plaster", tile: 2}} roof={{c: HOUSE_COLS[i % 4][1], tex: "roof", tile: 1.2}} lit={lit} />
        <House at={[3.4, 0, from - 2 - i * 5]} rot={-90} w={3.6} d={3.2} h={2.4} wall={{c: HOUSE_COLS[(i + 2) % 4][0], tex: "plaster", tile: 2}} roof={{c: HOUSE_COLS[(i + 2) % 4][1], tex: "roof", tile: 1.2}} lit={lit} />
      </React.Fragment>
    ))}
    <Pole from={[-1.7, 0, from - 4]} to={[-1.7, 4.2, from - 4]} r={0.08} surf={{c: "#7a7a80"}} />
    <Pole from={[-1.7, 3.9, from - 4]} to={[1.9, 3.7, from - 9]} r={0.015} surf={{c: "#22222a"}} ink={false} />
  </group>
);

/** A long concrete sea wall facing +z, `at` = bottom centre. */
const SeaWall: React.FC<{at: [number, number, number]; h?: number; l?: number}> = ({at, h = 4, l = 40}) => (
  <group>
    <Box at={at} size={[l, h, 1]} surf={WALL} />
    <Box at={[at[0], at[1] + h, at[2]]} size={[l, 0.2, 1.3]} surf={{c: "#b8b4aa", tex: "stone", tile: 1}} />
  </group>
);

const Masjid: React.FC<{at: [number, number, number]}> = ({at}) => (
  <group position={at}>
    <Box at={[0, 0, 0]} size={[3.2, 2.8, 3.2]} surf={{c: "#ece4d0", tex: "plaster", tile: 2}} />
    <Box at={[0, 0.9, 1.61]} size={[0.9, 1.3, 0.04]} surf={{c: "#3a2a22"}} />
    <Box at={[-1.0, 1.4, 1.61]} size={[0.5, 0.8, 0.04]} surf={{c: "#2f6a5a"}} />
    <Box at={[1.0, 1.4, 1.61]} size={[0.5, 0.8, 0.04]} surf={{c: "#2f6a5a"}} />
    <Box at={[0, 2.8, 0]} size={[3.5, 0.22, 3.5]} surf={{c: "#2f7a5a"}} />
    <Ball at={[0, 3.05, 0]} r={1.15} sy={0.92} surf={{c: "#2f8a64"}} />
    <Cyl at={[0, 4.05, 0]} r={0.05} h={0.5} surf={{c: "#e2b33a"}} />
    <Cyl at={[2.2, 0, 1.3]} r={0.32} h={5.2} surf={{c: "#ece4d0", tex: "plaster", tile: 1}} />
    <Cyl at={[2.2, 5.2, 1.3]} r={0.42} r2={0.04} h={1.0} surf={{c: "#2f8a64"}} />
  </group>
);

const Boat: React.FC<{at: [number, number, number]; rock: number}> = ({at, rock}) => (
  <group position={at} rotation={[0, 0.5, rock]}>
    <Box at={[0, 0, 0]} size={[1.0, 0.38, 2.4]} surf={{c: "#c4532e", tex: "boards", tile: 0.5}} />
    <Box at={[0, 0.36, 0]} size={[0.8, 0.03, 2.2]} surf={{c: "#5a3020"}} ink={false} />
    <Box at={[0, 0.38, 1.12]} size={[1.0, 0.05, 0.16]} surf={{c: "#f2efe6"}} />
  </group>
);

/** Ground in cross-section, facing the camera (+z). k = how far the water layer has been squeezed (0..1). */
const Cutaway: React.FC<{k: number; children?: React.ReactNode}> = ({k, children}) => {
  const rockTop = -2.6;
  const wl = 1.0 * (1 - 0.75 * k);
  const clayTop = rockTop + wl + 0.9;
  const top = clayTop + 0.6;
  return (
    <group>
      <Box at={[0, -4.2, -3]} size={[14, 1.6, 6]} surf={{c: "#7d7a74", tex: "stone", tile: 0.8}} />
      <Box at={[0, rockTop, -3]} size={[14, wl, 6]} surf={{c: "#3f8fd4", tex: "water", tile: 0.8}} />
      <Box at={[0, rockTop + wl, -3]} size={[14, 0.9, 6]} surf={{c: "#b07a4a", tex: "plain"}} />
      <Box at={[0, clayTop, -3]} size={[14, 0.6, 6]} surf={{c: "#8a6a46", tex: "dirt", tile: 1}} />
      <Box at={[0, top, -3]} size={[14, 0.04, 6]} surf={{c: "#6fa14e", tex: "grass", tile: 1.5}} ink={false} />
      <group position={[0, top + 0.04, 0]}>{children}</group>
      {/* the well pipe, drawn on the cut face */}
      <Pole from={[1.1, top + 0.7, 0.08]} to={[1.1, rockTop + wl * 0.4, 0.08]} r={0.05} surf={{c: "#8a9aa8"}} />
      <Cyl at={[1.1, top, 0.08]} r={0.14} h={0.7} surf={{c: "#4a7ab0"}} />
    </group>
  );
};

/** Top of the Cutaway ground for a given k (to stand people and the house on). */
const cutTop = (k: number) => -2.6 + 1.0 * (1 - 0.75 * k) + 1.5 + 0.04;

const MilkBox: React.FC<{at: [number, number, number]; squash: number}> = ({at, squash}) => {
  const sx = 1 - 0.5 * squash;
  const sy = 1 - 0.2 * squash;
  return (
    <group position={at} scale={[sx, sy, 1 - 0.45 * squash]} rotation={[squash * 0.06, -0.35, squash * 0.14]}>
      <Box at={[0, 0, 0]} size={[0.9, 1.4, 0.6]} surf={{c: "#f4f2ec", tex: "paper"}} />
      <Box at={[0, 0.55, 0.301]} size={[0.92, 0.32, 0.02]} surf={{c: "#3f7fc4"}} ink={false} />
      <Box at={[0, 1.4, 0]} size={[0.9, 0.18, 0.06]} surf={{c: "#f4f2ec"}} />
    </group>
  );
};

/* ---------- scenes ---------- */

// 1 Tahun 2050, Jakarta Utara bisa tenggelam. | Tapi bukan karena lautnya naik.
const S1: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [0.4, 1.45, 3.4], at: [0, 1.15, 0]}, {f: c1, pos: [0.3, 1.6, 4.4], at: [0, 1.1, 0]}, {f: len, pos: [-0.6, 3.4, 9.5], at: [0, 1.0, -8], ease: "io"}]}>
      <Ground surf={SAND} />
      <Kampung />
      <SeaWall at={[0, 0, -20]} h={2.2} />
      <Water y={0.42} />
      <Clouds seed={2} />
      <Toon who={RAKA} x={-0.15} z={0} pose={f < c1 ? P.idle(t, 1) : blend(P.idle(t, 1), P.shrug(t, 1), prog(f, c1, c1 + 8))} expr={f < c1 ? "shock" : "think"} />
      <Label3D text="2050" at={[-0.1, 2.02, -0.6]} size={0.36} k={f < c1 + 10 ? pop(f, -10) : 1 - prog(f, c1 + 10, c1 + 18)} bg="#e9b04f" />
    </Stage>
  );
};

// 2 Daratannya yang turun. | Di beberapa tempat, | lebih dari sepuluh senti setahun.
const S2: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const sink = 1.15 * prog(f, 4, len, (x) => x);
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [1.6, 2.4, 7.6], at: [0, 0.4, -1]}, {f: len, pos: [0.6, 1.8, 6.4], at: [0, 0.1, -1]}]}>
      <Water y={0} />
      <group position={[0, -sink, 0]}>
        <Box at={[0, -2, -2]} size={[6, 2.3, 5]} surf={{c: "#8a6a46", tex: "dirt", tile: 1}} />
        <Box at={[0, 0.3, -2]} size={[6, 0.04, 5]} surf={{c: "#6fa14e", tex: "grass", tile: 1.5}} ink={false} />
        <House at={[-1.4, 0.34, -3]} w={2.4} d={2.2} h={1.8} />
        <House at={[1.5, 0.34, -3.2]} w={2.2} d={2.0} h={1.7} wall={{c: "#cfe0e8", tex: "plaster", tile: 2}} roof={{c: "#3f5f8f", tex: "roof", tile: 1.2}} />
        <Tree at={[2.4, 0.34, -1.2]} s={0.6} />
      </group>
      <Toon who={RAKA} x={0.2} z={-0.6} y={0.34 - sink} pose={P.scared(t, 1)} expr="scared" shadow={false} />
      <Fx kind="lines" at={[-1.2, 1.4 - sink, -0.4]} size={0.9} k={(t * 1.2) % 1} spin={Math.PI / 2} />
      <Label3D text="> 10 cm/tahun" at={[0, 1.75, -0.4]} size={0.3} k={pop(f, cueAt(2))} bg="#f2efe6" color="#c44d3c" />
    </Stage>
  );
};

// 3 Di Pluit, tanahnya sudah turun | empat meter. | Setinggi dua orang dewasa.
const S3: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c2 = cueAt(2);
  const up = pop(f, c2 - 6);
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [0.4, 0.9, 5.2], at: [-0.4, 1.0, 0]}, {f: len, pos: [0.4, 2.6, 9.0], at: [-0.4, 2.0, 0]}]}>
      <Ground surf={SAND} />
      <House at={[-3, 0, -5]} />
      <House at={[3.2, 0, -6]} rot={-15} wall={{c: "#f2d6a8", tex: "plaster", tile: 2}} />
      <Clouds seed={5} />
      {Array.from({length: 8}, (_, i) => (
        <Box key={i} at={[-1.1, i * 0.5, -0.3]} size={[0.18, 0.5, 0.18]} surf={{c: i % 2 ? "#f2efe6" : "#c44d3c"}} />
      ))}
      <Label3D text="4 m" at={[-1.1, 2.3, -0.2]} size={0.36} k={pop(f, cueAt(1))} bg="#e9b04f" />
      <Toon who={PAK_DAR} x={0.05} z={0} pose={up > 0 ? {...P.lift(t, 2), bob: 10} : P.idle(t, 2)} expr={up > 0 ? "determined" : "neutral"} />
      {up > 0 ? <Toon who={RAKA} x={0.05} z={0.06} y={lerp(1.0, 1.58, up)} pose={P.cheer(t, 1)} expr="nervous" shadow={false} /> : null}
    </Stage>
  );
};

// 4 Di Muara Baru, sebuah masjid | kini berdiri di tengah air laut.
const S4: React.FC = () => {
  const {f, t} = useFT();
  const {len} = useScene();
  const a = lerp(-10, 4, prog(f, 0, len, (x) => x));
  return (
    <Stage look="kartun" light="siang" shadowSize={12} cam={{f: 0, pos: orbit([0, 2.2, -3], 10, 3.2, a), at: [0, 2.0, -3]}}>
      <Ground surf={{c: "#6a6050", tex: "dirt", tile: 2}} y={-0.2} />
      <SeaWall at={[0, 0, -8]} h={4} />
      <Box at={[0, 0, -15]} size={[60, 4.15, 13]} surf={SAND} />
      <House at={[-5, 4.2, -12]} />
      <House at={[4, 4.2, -13]} wall={{c: "#cfe0e8", tex: "plaster", tile: 2}} roof={{c: "#3f5f8f", tex: "roof", tile: 1.2}} />
      <Masjid at={[0, -0.1, -3]} />
      <Water y={1.0} c={SEA} />
      <Boat at={[-0.35, 0.82, 0.9]} rock={Math.sin(t * 2) * 0.04} />
      <Toon who={PAK_DAR} x={-0.35} z={0.9} y={1.2} pose={P.pull(t, 2)} expr="sad" shadow={false} />
      <Clouds seed={7} />
    </Stage>
  );
};

// 5 Penyebabnya ada di bawah rumah kita: | air tanah.
const S5: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  const top = cutTop(0);
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [0.3, top + 1.6, 6], at: [0, top + 1.1, -1]}, {f: c1, pos: [0.3, top + 1.4, 6.2], at: [0, top + 1.0, -1]}, {f: c1 + 1, pos: [0.6, -1.5, 4.4], at: [0.6, -2.0, -1], ease: "cut"}, {f: len, pos: [0.7, -1.6, 3.6], at: [0.7, -2.05, -1]}]}>
      <Clouds seed={3} />
      <Cutaway k={0}>
        <House at={[-1.6, 0, -3.4]} w={3} d={2.6} h={2.2} />
        <Toon who={RAKA} x={0.2} z={-0.6} pose={f < c1 ? P.point(t, 1) : P.think(t, 1)} expr={f < c1 ? "determined" : "think"} />
      </Cutaway>
      <Fx kind="glow" at={[1.1, -2.25, 0.2]} size={1.6} k={prog(f, c1, c1 + 10)} color="#7fc8ff" />
      <Fx kind="drop" at={[1.1, -2.05, 0.3]} size={0.35} k={pop(f, c1 + 6)} />
    </Stage>
  );
};

// 6 Air pipa baru menjangkau | dua pertiga kota. | Sisanya menyedot sumur.
const S6: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c2 = cueAt(2);
  const pumpA = Math.sin(t * 7) * 30;
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [-1.5, 2.2, 7.6], at: [-1.5, 1.0, -1]}, {f: c2, pos: [-1.3, 2.1, 7.0], at: [-1.3, 1.0, -1]}, {f: c2 + 1, pos: [2.7, 2.0, 6.4], at: [2.7, 1.0, -1], ease: "cut"}, {f: len, pos: [2.7, 1.8, 5.6], at: [2.7, 1.0, -1]}]}>
      <Ground surf={SAND} />
      <Clouds seed={9} />
      {[-3.0, 0, 3.0].map((x, i) => (
        <House key={i} at={[x, 0, -2.4]} w={2.4} d={2.0} h={1.9} wall={{c: HOUSE_COLS[i][0], tex: "plaster", tile: 2}} roof={{c: HOUSE_COLS[i][1], tex: "roof", tile: 1.2}} />
      ))}
      <Pole from={[-5, 0.12, 0.2]} to={[0.6, 0.12, 0.2]} r={0.07} surf={{c: "#3f7fc4"}} />
      <Pole from={[-3.0, 0.12, 0.2]} to={[-3.0, 0.12, -1.35]} r={0.05} surf={{c: "#3f7fc4"}} />
      <Pole from={[0, 0.12, 0.2]} to={[0, 0.12, -1.35]} r={0.05} surf={{c: "#3f7fc4"}} />
      <Label3D text="2/3" at={[-1.5, 2.55, -1.2]} size={0.45} k={f < c2 ? pop(f, cueAt(1)) : 0} bg="#3f7fc4" />
      {/* the well pump */}
      <Cyl at={[3.3, 0, -0.2]} r={0.1} h={0.9} surf={{c: "#6a7480"}} />
      <Pole from={[3.3, 0.9, -0.2]} to={[3.3 - 0.45 * Math.cos((pumpA * Math.PI) / 180), 0.9 + 0.45 * Math.sin((pumpA * Math.PI) / 180), -0.2]} r={0.03} surf={{c: "#4a4a52"}} />
      <Toon who={SITI} x={2.5} z={0} pose={{...P.idle(t, 3), armR: [60 - pumpA * 0.5, 30], armL: [50 - pumpA * 0.5, 40], bob: 4 + Math.sin(t * 7) * 4}} expr="tired" />
      <Toon who={RAKA} x={-1.0} z={0.5} pose={f < cueAt(1) ? P.idle(t, 1) : P.point(t, 1)} expr="happy" />
      <Fx kind="drop" at={[3.3, 1.3, -0.2]} size={0.25} k={f > c2 ? 1 : 0} />
    </Stage>
  );
};

// 7 Bayangkan kotak susu yang disedot terus. | Lama-lama, kempot.
const S7: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  const sq = prog(f, c1 - 4, c1 + 10, eOut);
  return (
    <Stage look="kartun" light="dalam" cam={[{f: 0, pos: [0.1, 1.45, 4.4], at: [0, 1.1, -0.2]}, {f: c1, pos: [0.05, 1.4, 3.9], at: [0, 1.1, -0.2]}, {f: c1 + 6, pos: [0.0, 1.38, 3.6], at: [0, 1.1, -0.2], ease: "out"}, {f: len, pos: [0.0, 1.38, 3.5], at: [0, 1.1, -0.2]}]}>
      <Room w={7} d={5} sides="L" wall={{c: "#e8d6b0", tex: "plaster", tile: 2}} floor={{c: "#d8c8a8", tex: "tiles", tile: 1.2}} />
      <Window at={[1.6, 1.1, -2.4]} />
      <Box at={[-0.38, 0, -0.15]} size={[0.6, 0.55, 0.5]} surf={{c: "#c4925a", tex: "planks", tile: 0.6}} />
      <MilkBox at={[0.36, 0, -0.3]} squash={sq} />
      <Pole from={[0.36, 1.38 - 0.28 * sq, -0.3]} to={[0.28, 1.72 - 0.2 * sq, -0.25]} r={0.022} surf={{c: "#e8505b"}} />
      <Pole from={[0.28, 1.72 - 0.2 * sq, -0.25]} to={[-0.33, 1.32, -0.02]} r={0.022} surf={{c: "#e8505b"}} />
      <Toon who={BIMO} x={-0.38} z={-0.1} y={0.55} pose={{...P.hold(t, 4), lookX: 0.8}} expr={f < c1 ? "happy" : "shock"} shadow={false} />
      <Fx kind="lines" at={[0.78, 0.7, -0.2]} size={0.6} k={prog(f, c1, c1 + 14)} spin={Math.PI} />
      <Fx kind="bang" at={[0.5, 1.75, -0.2]} size={0.5} k={f >= c1 ? prog(f, c1, c1 + 8) * (1 - prog(f, c1 + 22, c1 + 30)) : 0} />
    </Stage>
  );
};

// 8 Tanah Jakarta juga begitu. | Airnya disedot, tanahnya memadat, | kotanya ikut turun.
const S8: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const k = prog(f, cueAt(1), len - 6);
  const top = cutTop(k);
  return (
    <Stage look="kartun" light="siang" shake={[[cueAt(2), 0.5]]} cam={[{f: 0, pos: [0.6, 0.2, 8.2], at: [0.2, -0.6, -1]}, {f: len, pos: [0.4, -0.1, 8.4], at: [0.2, -0.75, -1]}]}>
      <Clouds seed={4} />
      <Cutaway k={k}>
        <House at={[-1.6, 0, -3.4]} w={3} d={2.6} h={2.2} />
        <Toon who={RAKA} x={0.2} z={-0.6} pose={k > 0.5 ? P.scared(t, 1) : P.idle(t, 1)} expr={k > 0.5 ? "scared" : "nervous"} />
      </Cutaway>
      <Fx kind="drop" at={[1.1, top + 1.0, 0.3]} size={0.3} k={1} />
      <Fx kind="lines" at={[-2.2, top + 1.2, 0.3]} size={1.0} k={(t * 1.3) % 1} spin={Math.PI / 2} />
    </Stage>
  );
};

// 9 Tembok laut cuma menahan air, | bukan menahan tanah yang turun.
const S9: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  const sink = 1.2 * prog(f, c1 - 6, len, (x) => x);
  const splash = (f % 24) / 24;
  return (
    <Stage look="kartun" light="senja" sun={[3, 6, 7]} cam={[{f: 0, pos: [1.6, 3.2, 6.6], at: [0, 1.2, -1.5]}, {f: len, pos: [1.0, 2.2, 5.6], at: [0, 0.5, -1.5]}]}>
      <Water y={2.15} c={SEA} at={[0, 0, -43]} size={80} />
      <SeaWall at={[0, -1, -2.6]} h={3.4} />
      <group position={[0, -sink, 0]}>
        <Box at={[0, -2, 3]} size={[30, 2.3, 10]} surf={{c: "#8a6a46", tex: "dirt", tile: 1}} />
        <Box at={[0, 0.3, 3]} size={[30, 0.04, 10]} surf={SAND} ink={false} />
        <House at={[-4.2, 0.34, 2.6]} rot={20} />
      </group>
      <Toon who={SITI} x={-0.3} z={0.6} y={0.34 - sink} pose={f < c1 ? P.point(t, 3) : P.scared(t, 3)} expr={f < c1 ? "determined" : "scared"} shadow={false} />
      <Fx kind="lines" at={[0.9, 1.0 - sink, 0.3]} size={0.8} k={(t * 1.3) % 1} spin={Math.PI / 2} />
      <Fx kind="smoke" at={[-1.5, 2.6, -2.8]} size={1.4} k={splash} color="#e6f4ff" />
      <Fx kind="smoke" at={[2.5, 2.6, -2.8]} size={1.2} k={(splash + 0.5) % 1} color="#e6f4ff" />
    </Stage>
  );
};

const Tokyo: React.FC<{pump: number; pipe: number}> = ({pump, pipe}) => (
  <group>
    <Ground surf={{c: "#8a8478", tex: "cobble", tile: 1.2}} />
    <Road at={[0, 0, -10]} w={3} l={30} />
    {[-1, 1].flatMap((s) =>
      [0, 1, 2, 3].map((i) => (
        <Box key={`${s}${i}`} at={[s * (3.6 + (i % 2) * 0.4), 0, -4 - i * 4.2]} size={[3, 3 + ((i * 7 + (s > 0 ? 3 : 0)) % 5) * 1.3, 3.4]} surf={{c: ["#b8b0a0", "#a8a8b0", "#c8bca4", "#9aa0a8"][(i + (s > 0 ? 1 : 0)) % 4], tex: "plaster", tile: 2}} />
      )),
    )}
    <Window at={[-2.05, 1.2, -2.3]} rot={90} w={0.9} h={1.0} />
    {pump > 0.01 ? (
      <group position={[1.4, 0, -0.6]} scale={pump}>
        <Cyl at={[0, 0, 0]} r={0.25} h={0.9} surf={{c: "#6a7480"}} />
        <Cyl at={[0, 0.9, 0]} r={0.3} r2={0.15} h={0.3} surf={{c: "#4a5058"}} />
        <Pole from={[0.2, 0.6, 0]} to={[0.75, 0.6, 0]} r={0.05} surf={{c: "#4a5058"}} />
      </group>
    ) : null}
    {pipe > 0 ? <Pole from={[-5, 0.12, 0.6]} to={[lerp(-5, 2.2, pipe), 0.12, 0.6]} r={0.08} surf={{c: "#3f7fc4"}} /> : null}
  </group>
);

// 10 Tokyo dulu lebih parah: | turun dua puluh empat senti setahun.
const S10: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  return (
    <Stage look="kartun" light="kenangan" cam={[{f: 0, pos: [0.2, 1.8, 6.4], at: [0.2, 1.3, -1]}, {f: len, pos: [0.3, 1.6, 4.8], at: [0.2, 1.2, -1]}]}>
      <Tokyo pump={1} pipe={0} />
      <Toon who={KENJI} x={-0.25} z={0} pose={P.idle(t, 5)} expr="nervous" />
      <Label3D text="1968" at={[0.2, 2.55, -0.6]} size={0.4} k={f < c1 ? pop(f, -10) : 0} bg="#e9b04f" />
      <Label3D text="24 cm / tahun" at={[0.2, 2.55, -0.6]} size={0.34} k={pop(f, c1)} bg="#f2efe6" color="#c44d3c" />
    </Stage>
  );
};

// 11 Lalu pompa air tanah dibatasi, | warga pindah ke air pipa, | dan turunnya nyaris berhenti.
const S11: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const [c0, c1, c2] = [cueAt(0), cueAt(1), cueAt(2)];
  const pump = 1 - prog(f, c0 + 6, c0 + 18);
  const pipe = prog(f, c1, c1 + 20);
  const happy = f >= c2;
  return (
    <Stage look="kartun" light="siang" cam={[{f: 0, pos: [0.5, 1.7, 5.8], at: [0.35, 1.0, -0.6]}, {f: c2, pos: [0.2, 1.8, 6.0], at: [0.2, 1.2, -1]}, {f: len, pos: [0.0, 2.0, 6.8], at: [0.1, 1.3, -1]}]}>
      <Tokyo pump={pump} pipe={pipe} />
      <Fx kind="smoke" at={[1.4, 0.6, -0.6]} size={1.2} k={prog(f, c0 + 6, c0 + 26)} />
      <Toon who={KENJI} x={-0.42} z={0} pose={happy ? P.cheer(t, 5) : P.point(t, 5)} expr={happy ? "joy" : "determined"} />
      <Toon who={YUMI} x={0.45} z={0.3} pose={happy ? P.cheer(t, 6) : P.idle(t, 6)} expr={happy ? "joy" : "happy"} />
      <Fx kind="star" at={[-0.05, 2.35, 0]} size={0.5} k={pop(f, c2 + 4)} spin={t} />
    </Stage>
  );
};

// 12 Di Muara Baru, | lajunya juga sudah turun setengah.
const S12: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  return (
    <Stage look="kartun" light="senja" cam={[{f: 0, pos: [-0.4, 2.0, 7.2], at: [0, 1.4, -2]}, {f: len, pos: [0.2, 1.7, 5.6], at: [0, 1.2, -1.5]}]}>
      <Ground surf={SAND} />
      <SeaWall at={[0, 0, -4]} h={2.6} />
      <Water y={2.0} c={SEA} at={[0, 0, -44.4]} size={80} />
      <SunDisc at={[-8, 7, -50]} size={5} c="#ffd08a" />
      <House at={[-3.6, 0, 0]} rot={90} w={3.4} d={3} h={2.3} />
      <Toon who={SITI} x={-0.5} z={0} pose={P.idle(t, 3)} expr={f < cueAt(1) ? "neutral" : "happy"} />
      <Toon who={PAK_DAR} x={0.45} z={0.3} pose={f < cueAt(1) ? P.idle(t, 2) : P.talk(t, 2)} expr={f < cueAt(1) ? "think" : "smug"} />
      <Label3D text="1/2" at={[0, 2.6, -0.4]} size={0.42} k={pop(f, cueAt(1) + 6)} bg="#5aa38a" />
    </Stage>
  );
};

// 13 Jadi 2050 bukan takdir. | Itu tergantung air yang kita sedot | hari ini.
const S13: React.FC = () => {
  const {f, t} = useFT();
  const {len, cueAt} = useScene();
  const c1 = cueAt(1);
  const off = f >= c1 + 6;
  return (
    <Stage look="kartun" light="senja" cam={[{f: 0, pos: [0.5, 1.5, 3.0], at: [0.1, 1.15, -0.6]}, {f: c1 + 10, pos: [0.4, 1.6, 3.6], at: [0.1, 1.15, -0.6]}, {f: len, pos: [0.2, 5.2, 13], at: [0, 1.2, -3], ease: "io"}]}>
      <Ground surf={SAND} />
      <Kampung lit from={-5} />
      <Box at={[0, 0, -1.4]} size={[3, 2.4, 0.2]} surf={{c: "#efe2c6", tex: "plaster", tile: 2}} />
      <Pole from={[0.6, 1.0, -1.3]} to={[0.6, 1.0, -1.05]} r={0.04} surf={{c: "#b8bcc4"}} />
      <Pole from={[0.6, 1.0, -1.05]} to={[0.6, 0.9, -1.05]} r={0.035} surf={{c: "#b8bcc4"}} />
      <Box at={[0.6, 1.04, -1.12]} size={[0.14, 0.06, 0.04]} surf={{c: "#c44d3c"}} rot={off ? 90 : 0} />
      <Cyl at={[0.6, 0, -1.0]} r={0.22} r2={0.26} h={0.38} surf={{c: "#3f7fc4"}} />
      {!off ? <Fx kind="drop" at={[0.6, 0.82 - ((f % 15) / 15) * 0.4, -1.0]} size={0.14} k={1} /> : null}
      <Toon who={RAKA} x={0.0} z={-0.4} pose={off ? P.idle(t, 1) : {...P.idle(t, 1), armR: [78, 18], lookX: 0.8, lookY: 0.4}} expr={off ? "happy" : "determined"} />
      <Pole from={[-1.0, 2.1, -1.28]} to={[-1.0, 2.1, -1.0]} r={0.025} surf={{c: "#3a3a40"}} />
      <Cyl at={[-1.0, 2.02, -1.0]} r={0.14} r2={0.04} h={0.12} surf={{c: "#3a3a40"}} />
      <Lamp at={[-1.0, 1.98, -1.0]} kind="bulb" power={3} glow={0.6} />
      <Tree at={[-2.2, 0, -2.4]} s={0.8} />
    </Stage>
  );
};

const RENDER = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];
const KINDS: TransitionKind[] = ["whip", "whip", "fade", "whip", "zoom", "whip", "zoom", "whip", "fade", "cut", "fade", "cut"];

export const JakartaTenggelam: React.FC<{narration?: string}> = ({narration}) => (
  <Film scenes={SCENES} cues={CUES} kinds={KINDS} narration={narration} render={(i) => React.createElement(RENDER[i])} />
);
