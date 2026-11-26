import React from "react";
import * as THREE from "three";
import {fontReady, Fx} from "./Cast";
import {boxGeo, cachedGeo, canvasTex, inkMaterial, rnd, shadeHex, Surf, surfMat} from "./look";
import {useStage, V3} from "./Stage";

/*
 * Set pieces for <Stage>. Units are metres, y is up, the camera usually looks toward -z.
 * Every `at` is the point on the FLOOR under the piece (its bottom centre), so pieces stand on y = 0.
 * Every surface is a Surf {c: colour, tex?: texture name, tile?: metres per texture tile}.
 * In the "kartun" look every solid gets an ink outline; in "diorama" none (paper/toy feel).
 *
 * Primitives: Box, Cyl, Ball, Pole (between two points, also ropes).
 * Rooms/outdoors: Ground, Room, Wall, Window, Door, House, Road, Fence, Hill, Water, Clouds, SunDisc.
 * Props: Tree, Bush, Rock, Table, Chair, Crate, Barrel, Shelf, Bed, Lamp (bulb/candle/torch/fire), Board, Sign.
 */

const deg = (d: number) => (d * Math.PI) / 180;

type SolidProps = {geo: THREE.BufferGeometry; surf: Surf; pos: V3; rot?: V3; hull?: V3; cast?: boolean; receive?: boolean; ink?: boolean};

/** A mesh in the current look, with an inverted-hull ink outline in the kartun look. */
const Solid: React.FC<SolidProps> = ({geo, surf, pos, rot = [0, 0, 0], hull = [1.04, 1.04, 1.04], cast = true, receive = true, ink = true}) => {
  const st = useStage();
  const m = surfMat(st.look, surf);
  const showInk = ink && st.spec.ink > 0 && !surf.glow;
  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={geo} material={m} castShadow={cast} receiveShadow={receive} />
      {showInk ? <mesh geometry={geo} material={inkMaterial()} scale={hull} /> : null}
    </group>
  );
};

const useInk = () => useStage().spec.ink;

export type BoxProps = {at: V3; size: V3; surf: Surf; rot?: number; ink?: boolean; cast?: boolean; tilt?: V3};

/** A box standing on `at` (bottom centre). rot = yaw in degrees; tilt = extra [x, y, z] rotation in degrees. */
export const Box: React.FC<BoxProps> = ({at, size, surf, rot = 0, ink = true, cast = true, tilt}) => {
  const t = useInk();
  const [w, h, d] = size;
  const geo = boxGeo(w, h, d, surf.tile ?? 1);
  return (
    <group position={at} rotation={[0, deg(rot), 0]}>
      <Solid geo={geo} surf={surf} pos={[0, h / 2, 0]} rot={tilt ? [deg(tilt[0]), deg(tilt[1]), deg(tilt[2])] : [0, 0, 0]} hull={[(w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d]} ink={ink} cast={cast} />
    </group>
  );
};

/** A cylinder standing on `at`. r2 = top radius (cone/taper). rot = [x, y, z] degrees about its base. */
export const Cyl: React.FC<{at: V3; r: number; h: number; surf: Surf; r2?: number; seg?: number; rot?: V3; ink?: boolean}> = ({at, r, h, surf, r2, seg = 24, rot = [0, 0, 0], ink = true}) => {
  const t = useInk();
  const geo = cachedGeo(`cyl|${r}|${r2 ?? r}|${h}|${seg}`, () => {
    const g = new THREE.CylinderGeometry(r2 ?? r, r, h, seg);
    g.translate(0, h / 2, 0);
    return g;
  });
  const k = (Math.max(r, r2 ?? r) + t) / Math.max(r, r2 ?? r);
  return <Solid geo={geo} surf={surf} pos={at} rot={[deg(rot[0]), deg(rot[1]), deg(rot[2])]} hull={[k, (h + 2 * t) / h, k]} ink={ink} />;
};

/** A ball centred at `at` (not standing). sy squashes it vertically. */
export const Ball: React.FC<{at: V3; r: number; surf: Surf; sy?: number; ink?: boolean; seg?: number}> = ({at, r, surf, sy = 1, ink = true, seg = 20}) => {
  const t = useInk();
  const geo = cachedGeo(`ball|${r}|${sy}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)).scale(1, sy, 1));
  const k = (r + t) / r;
  return <Solid geo={geo} surf={surf} pos={at} hull={[k, k, k]} ink={ink} />;
};

/** A round bar between two points (rope, pole, pipe, beam). */
export const Pole: React.FC<{from: V3; to: V3; r?: number; surf: Surf; ink?: boolean}> = ({from, to, r = 0.03, surf, ink = true}) => {
  const t = useInk();
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const geo = cachedGeo(`pole|${r}|${len.toFixed(3)}`, () => new THREE.CylinderGeometry(r, r, len, 10));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const k = (r + t * 0.6) / r;
  return <Solid geo={geo} surf={surf} pos={[mid.x, mid.y, mid.z]} rot={[e.x, e.y, e.z]} hull={[k, 1.01, k]} ink={ink} />;
};

/* ---------- ground, rooms, buildings ---------- */

export const Ground: React.FC<{surf?: Surf; size?: number; y?: number}> = ({surf = {c: "#76ad55", tex: "grass", tile: 2}, size = 120, y = 0}) => {
  const st = useStage();
  const geo = cachedGeo(`ground|${size}|${surf.tile ?? 2}`, () => {
    const g = new THREE.PlaneGeometry(size, size);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * size) / (surf.tile ?? 2), (uv.getY(i) * size) / (surf.tile ?? 2));
    return g;
  });
  return <mesh geometry={geo} material={surfMat(st.look, surf)} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow />;
};

/** A flat wall, `at` = bottom centre, facing +z before `rot` (yaw degrees). */
export const Wall: React.FC<{at: V3; w: number; h: number; surf: Surf; t?: number; rot?: number}> = ({at, w, h, surf, t = 0.16, rot = 0}) => <Box at={at} size={[w, h, t]} surf={surf} rot={rot} />;

/**
 * A room corner like a stage set: floor, back wall, and side walls ("L", "R", "LR" or "").
 * The camera looks in from the open front (+z). `at` = floor centre.
 */
export const Room: React.FC<{at?: V3; w?: number; d?: number; h?: number; wall?: Surf; floor?: Surf; sides?: "L" | "R" | "LR" | ""; skirting?: string}> = ({
  at = [0, 0, 0],
  w = 7,
  d = 5,
  h = 3.4,
  wall = {c: "#c9643a", tex: "brick", tile: 1.4},
  floor = {c: "#c99a5e", tex: "planks", tile: 1.6},
  sides = "L",
  skirting = "#5a3a26",
}) => (
  <group position={at}>
    <Box at={[0, -0.1, 0]} size={[w, 0.1, d]} surf={floor} cast={false} />
    <Box at={[0, 0, -d / 2]} size={[w, h, 0.18]} surf={wall} />
    <Box at={[0, 0, -d / 2 + 0.1]} size={[w, 0.16, 0.04]} surf={{c: skirting}} ink={false} />
    {sides.includes("L") ? <Box at={[-w / 2, 0, 0]} size={[0.18, h, d]} surf={wall} /> : null}
    {sides.includes("R") ? <Box at={[w / 2, 0, 0]} size={[0.18, h, d]} surf={wall} /> : null}
  </group>
);

/** A window with frame and a glowing glass pane (sky by day, lamp-lit at night). Faces +z before rot. */
export const Window: React.FC<{at: V3; w?: number; h?: number; rot?: number; glass?: string; frame?: string; glow?: number}> = ({at, w = 1.1, h = 1.3, rot = 0, glass = "#a9dcf3", frame = "#f2ead8", glow = 1}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, 0, 0]} size={[w, h, 0.06]} surf={{c: glass, glow}} ink={false} cast={false} />
    <Box at={[0, -0.06, 0.03]} size={[w + 0.16, 0.08, 0.1]} surf={{c: frame}} />
    <Box at={[0, h - 0.02, 0.03]} size={[w + 0.16, 0.08, 0.1]} surf={{c: frame}} />
    <Box at={[-w / 2 - 0.04, -0.02, 0.03]} size={[0.08, h + 0.04, 0.1]} surf={{c: frame}} />
    <Box at={[w / 2 + 0.04, -0.02, 0.03]} size={[0.08, h + 0.04, 0.1]} surf={{c: frame}} />
    <Box at={[0, -0.02, 0.03]} size={[0.06, h, 0.08]} surf={{c: frame}} />
    <Box at={[0, h / 2 - 0.03, 0.03]} size={[w, 0.06, 0.08]} surf={{c: frame}} />
  </group>
);

export const Door: React.FC<{at: V3; w?: number; h?: number; rot?: number; c?: string}> = ({at, w = 0.95, h = 2.05, rot = 0, c = "#7a4a2a"}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, 0, 0]} size={[w, h, 0.06]} surf={{c, tex: "boards", tile: 0.8}} />
    <Ball at={[w * 0.36, h * 0.48, 0.07]} r={0.045} surf={{c: "#e2b33a"}} />
  </group>
);

/** A small house: walls, gabled roof, door and two windows. `at` = floor centre, front faces +z before rot. */
export const House: React.FC<{at: V3; w?: number; d?: number; h?: number; rot?: number; wall?: Surf; roof?: Surf; lit?: boolean}> = ({
  at,
  w = 4,
  d = 3.6,
  h = 2.6,
  rot = 0,
  wall = {c: "#efe2c6", tex: "plaster", tile: 2},
  roof = {c: "#b8442e", tex: "roof", tile: 1.2},
  lit = false,
}) => {
  const t = useInk();
  const st = useStage();
  const rh = w * 0.38;
  const geo = cachedGeo(`gable|${w}|${d}|${rh}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - 0.25, 0);
    s.lineTo(0, rh);
    s.lineTo(w / 2 + 0.25, 0);
    s.lineTo(w / 2 + 0.05, 0);
    s.lineTo(0, rh - 0.18);
    s.lineTo(-w / 2 - 0.05, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: d + 0.5, bevelEnabled: false});
    g.translate(0, 0, -(d + 0.5) / 2);
    g.computeVertexNormals();
    return g;
  });
  const gable = cachedGeo(`gableWall|${w}|${rh}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(0, rh - 0.1);
    s.lineTo(w / 2, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false}).translate(0, 0, -d / 2);
  });
  const glass = lit ? "#ffd27a" : "#a9dcf3";
  return (
    <group position={at} rotation={[0, deg(rot), 0]}>
      <Box at={[0, 0, 0]} size={[w, h, d]} surf={wall} />
      <mesh geometry={gable} material={surfMat(st.look, wall)} position={[0, h, 0]} castShadow receiveShadow />
      <Solid geo={geo} surf={roof} pos={[0, h, 0]} hull={[1 + t / w, 1 + t / rh, 1 + t / d]} />
      <Door at={[0, 0, d / 2 + 0.02]} />
      <Window at={[-w * 0.3, h * 0.36, d / 2 + 0.02]} w={0.8} h={0.8} glass={glass} />
      <Window at={[w * 0.3, h * 0.36, d / 2 + 0.02]} w={0.8} h={0.8} glass={glass} />
    </group>
  );
};

export const Road: React.FC<{at?: V3; w?: number; l?: number; rot?: number}> = ({at = [0, 0, 0], w = 4, l = 60, rot = 0}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, -0.02, 0]} size={[w, 0.03, l]} surf={{c: "#4a4a52", tex: "dirt", tile: 2}} ink={false} cast={false} />
    {Array.from({length: Math.floor(l / 3)}, (_, i) => (
      <Box key={i} at={[0, 0.012, -l / 2 + 1.5 + i * 3]} size={[0.14, 0.005, 1.4]} surf={{c: "#f2efe6"}} ink={false} cast={false} />
    ))}
  </group>
);

export const Fence: React.FC<{from: V3; to: V3; h?: number; c?: string}> = ({from, to, h = 1, c = "#c9a06a"}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const n = Math.max(2, Math.round(a.distanceTo(b) / 0.8) + 1);
  const posts = Array.from({length: n}, (_, i) => a.clone().lerp(b, i / (n - 1)));
  return (
    <group>
      {posts.map((p, i) => (
        <Box key={i} at={[p.x, 0, p.z]} size={[0.1, h, 0.1]} surf={{c, tex: "planks", tile: 0.6}} />
      ))}
      <Pole from={[from[0], h * 0.75, from[2]]} to={[to[0], h * 0.75, to[2]]} r={0.04} surf={{c}} />
      <Pole from={[from[0], h * 0.35, from[2]]} to={[to[0], h * 0.35, to[2]]} r={0.04} surf={{c}} />
    </group>
  );
};

export const Hill: React.FC<{at: V3; r?: number; h?: number; surf?: Surf}> = ({at, r = 8, h = 3, surf = {c: "#6fa14e", tex: "grass", tile: 3}}) => (
  <Ball at={at} r={r} sy={h / r} surf={surf} ink={false} seg={32} />
);

/** A flat water surface at height y; its ripples drift over time. */
export const Water: React.FC<{y?: number; size?: number; c?: string; at?: V3}> = ({y = 0.02, size = 80, c = "#3f8fc4", at = [0, 0, 0]}) => {
  const st = useStage();
  const m = surfMat(st.look, {c, tex: "water"}) as THREE.MeshToonMaterial;
  const geo = cachedGeo(`water|${size}`, () => {
    const g = new THREE.PlaneGeometry(size, size);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * size) / 3, (uv.getY(i) * size) / 3);
    return g;
  });
  if (m.map) m.map.offset.set(st.t * 0.03, st.t * 0.05);
  return <mesh geometry={geo} material={m} rotation={[-Math.PI / 2, 0, 0]} position={[at[0], y, at[2]]} receiveShadow />;
};

/** Puffy clouds high in the sky (seeded). */
export const Clouds: React.FC<{seed?: number; n?: number; y?: number; z?: number; spread?: number; drift?: number; c?: string}> = ({seed = 1, n = 5, y = 9, z = -30, spread = 30, drift = 0.15, c = "#ffffff"}) => {
  const st = useStage();
  return (
    <group position={[st.t * drift, 0, 0]}>
      {Array.from({length: n}, (_, i) => {
        const x = (rnd(seed, i) - 0.5) * spread;
        const yy = y + rnd(seed, i + 10) * 4;
        const zz = z - rnd(seed, i + 20) * 10;
        const s = 1.2 + rnd(seed, i + 30) * 1.4;
        return (
          <group key={i} position={[x, yy, zz]}>
            <Ball at={[0, 0, 0]} r={s} surf={{c}} sy={0.7} />
            <Ball at={[s * 1.1, -s * 0.2, 0]} r={s * 0.75} surf={{c}} sy={0.7} />
            <Ball at={[-s * 1.05, -s * 0.25, 0]} r={s * 0.7} surf={{c}} sy={0.7} />
          </group>
        );
      })}
    </group>
  );
};

/** Sun or moon disc with a glow, far away in the sky. */
export const SunDisc: React.FC<{at: V3; size?: number; c?: string}> = ({at, size = 3, c = "#fff1b8"}) => (
  <group>
    <Fx kind="glow" at={at} size={size * 3.5} k={0.8} color={c} />
    <Ball at={at} r={size / 2} surf={{c, glow: 1}} ink={false} />
  </group>
);

/* ---------- props ---------- */

export const Tree: React.FC<{at: V3; s?: number; leaf?: string; trunk?: string; seed?: number}> = ({at, s = 1, leaf = "#4f9a46", trunk = "#7a5232", seed = 1}) => (
  <group position={at} scale={s}>
    <Cyl at={[0, 0, 0]} r={0.16} r2={0.11} h={1.6} surf={{c: trunk, tex: "planks", tile: 0.8}} />
    <Ball at={[0, 2.1, 0]} r={1.0} surf={{c: leaf, tex: "grass", tile: 1}} seg={12} />
    <Ball at={[0.55 * (rnd(seed, 1) - 0.3), 2.7, 0.2]} r={0.75} surf={{c: shadeHex(leaf, 1.1), tex: "grass", tile: 1}} seg={12} />
    <Ball at={[-0.6, 1.85, 0.25]} r={0.65} surf={{c: shadeHex(leaf, 0.92), tex: "grass", tile: 1}} seg={12} />
  </group>
);

export const Bush: React.FC<{at: V3; s?: number; c?: string}> = ({at, s = 1, c = "#4f9a46"}) => (
  <group position={at} scale={s}>
    <Ball at={[0, 0.35, 0]} r={0.5} surf={{c, tex: "grass", tile: 1}} sy={0.8} seg={12} />
    <Ball at={[0.45, 0.28, 0.1]} r={0.36} surf={{c: shadeHex(c, 1.1), tex: "grass", tile: 1}} sy={0.8} seg={12} />
  </group>
);

export const Rock: React.FC<{at: V3; s?: number; c?: string}> = ({at, s = 1, c = "#9a958c"}) => {
  const t = useInk();
  const geo = cachedGeo(`rock|${s}`, () => new THREE.DodecahedronGeometry(0.5 * s, 0).scale(1, 0.7, 1));
  return <Solid geo={geo} surf={{c, tex: "stone", tile: 1}} pos={[at[0], at[1] + 0.25 * s, at[2]]} hull={[1 + t / (0.5 * s), 1 + t / (0.35 * s), 1 + t / (0.5 * s)]} />;
};

export const Table: React.FC<{at: V3; w?: number; d?: number; h?: number; rot?: number; surf?: Surf}> = ({at, w = 1.6, d = 0.9, h = 0.78, rot = 0, surf = {c: "#9a6a3e", tex: "planks", tile: 0.8}}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, h - 0.07, 0]} size={[w, 0.07, d]} surf={surf} />
    {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} at={[sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08)]} size={[0.08, h - 0.07, 0.08]} surf={surf} />))}
  </group>
);

export const Chair: React.FC<{at: V3; rot?: number; surf?: Surf}> = ({at, rot = 0, surf = {c: "#8a5a32", tex: "planks", tile: 0.6}}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, 0.44, 0]} size={[0.48, 0.06, 0.46]} surf={surf} />
    <Box at={[0, 0.5, -0.2]} size={[0.48, 0.52, 0.05]} surf={surf} />
    {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} at={[sx * 0.2, 0, sz * 0.19]} size={[0.05, 0.44, 0.05]} surf={surf} />))}
  </group>
);

export const Crate: React.FC<{at: V3; s?: number; rot?: number; c?: string}> = ({at, s = 0.7, rot = 0, c = "#c4925a"}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, 0, 0]} size={[s, s, s]} surf={{c, tex: "planks", tile: s / 1.2}} />
  </group>
);

export const Barrel: React.FC<{at: V3; s?: number; c?: string}> = ({at, s = 1, c = "#8a5a32"}) => (
  <group position={at} scale={s}>
    <Cyl at={[0, 0, 0]} r={0.34} r2={0.34} h={0.95} surf={{c, tex: "boards", tile: 0.4}} />
    <Cyl at={[0, 0.18, 0]} r={0.355} h={0.06} surf={{c: "#4a4a52"}} ink={false} />
    <Cyl at={[0, 0.72, 0]} r={0.355} h={0.06} surf={{c: "#4a4a52"}} ink={false} />
  </group>
);

export const Shelf: React.FC<{at: V3; w?: number; h?: number; rot?: number; seed?: number}> = ({at, w = 1.4, h = 1.9, rot = 0, seed = 3}) => {
  const cols = ["#c44d3c", "#3f7fc4", "#e9b04f", "#5aa38a", "#7a4a8a", "#e8e2d2"];
  const rows = 4;
  return (
    <group position={at} rotation={[0, deg(rot), 0]}>
      <Box at={[0, 0, -0.15]} size={[w, h, 0.04]} surf={{c: "#7a4a2a", tex: "boards"}} />
      <Box at={[-w / 2, 0, 0]} size={[0.05, h, 0.34]} surf={{c: "#8a5a32", tex: "planks"}} />
      <Box at={[w / 2, 0, 0]} size={[0.05, h, 0.34]} surf={{c: "#8a5a32", tex: "planks"}} />
      {Array.from({length: rows + 1}, (_, r) => (
        <Box key={r} at={[0, (r * h) / rows - (r === rows ? 0.04 : 0), 0]} size={[w, 0.04, 0.34]} surf={{c: "#8a5a32", tex: "planks"}} />
      ))}
      {Array.from({length: rows}, (_, r) =>
        Array.from({length: 7}, (_, i) => {
          const bw = 0.1 + rnd(seed + r, i) * 0.06;
          const bh = 0.26 + rnd(seed + r, i + 9) * 0.12;
          return <Box key={`${r}-${i}`} at={[-w / 2 + 0.14 + i * ((w - 0.28) / 6), (r * h) / rows + 0.04, 0]} size={[bw, bh, 0.24]} surf={{c: cols[Math.floor(rnd(seed, r * 7 + i) * cols.length)]}} />;
        }),
      )}
    </group>
  );
};

export const Bed: React.FC<{at: V3; rot?: number; blanket?: string}> = ({at, rot = 0, blanket = "#3f7fc4"}) => (
  <group position={at} rotation={[0, deg(rot), 0]}>
    <Box at={[0, 0, 0]} size={[1.1, 0.42, 2.1]} surf={{c: "#8a5a32", tex: "planks"}} />
    <Box at={[0, 0.42, 0]} size={[1.0, 0.16, 2.0]} surf={{c: "#f2efe6"}} />
    <Box at={[0, 0.5, 0.25]} size={[1.04, 0.12, 1.4]} surf={{c: blanket, tex: "cloth", tile: 0.5}} />
    <Box at={[0, 0.58, -0.75]} size={[0.7, 0.14, 0.38]} surf={{c: "#ffffff"}} />
    <Box at={[0, 0, -1.03]} size={[1.1, 0.95, 0.08]} surf={{c: "#7a4a2a", tex: "boards"}} />
  </group>
);

export type LampKind = "bulb" | "candle" | "torch" | "fire" | "none";

/**
 * A light source: a point light plus its glow and body. power ~ how far it lights (metres);
 * flicker 0..1 (candle and fire flicker by default). Use for night scenes, discoveries, "the idea".
 */
export const Lamp: React.FC<{at: V3; kind?: LampKind; color?: string; power?: number; flicker?: number; on?: number; glow?: number}> = ({at, kind = "bulb", color, power = 5, flicker, on = 1, glow = 1}) => {
  const st = useStage();
  const col = color ?? (kind === "bulb" ? "#ffe6a8" : "#ffb35a");
  const fl = flicker ?? (kind === "candle" || kind === "torch" || kind === "fire" ? 0.18 : 0);
  const n = 1 - fl * (0.5 + 0.5 * Math.sin(st.t * 23 + at[0] * 3) * Math.sin(st.t * 7.1));
  const I = on * n;
  const top: V3 = kind === "candle" ? [at[0], at[1] + 0.32, at[2]] : kind === "torch" ? [at[0], at[1] + 1.25, at[2]] : kind === "fire" ? [at[0], at[1] + 0.45, at[2]] : at;
  return (
    <group>
      {kind === "candle" ? (
        <>
          <Cyl at={at} r={0.05} h={0.24} surf={{c: "#f4ecd8"}} />
          <Fx kind="glow" at={top} size={0.22} k={I} color="#fff2b0" />
        </>
      ) : null}
      {kind === "torch" ? <Pole from={at} to={[at[0], at[1] + 1.15, at[2]]} r={0.04} surf={{c: "#6a4528"}} /> : null}
      {kind === "fire" ? (
        <>
          <Pole from={[at[0] - 0.4, at[1] + 0.06, at[2] - 0.1]} to={[at[0] + 0.4, at[1] + 0.06, at[2] + 0.1]} r={0.06} surf={{c: "#6a4528"}} />
          <Pole from={[at[0] - 0.3, at[1] + 0.06, at[2] + 0.3]} to={[at[0] + 0.3, at[1] + 0.06, at[2] - 0.3]} r={0.06} surf={{c: "#5a3a22"}} />
          <Fx kind="smoke" at={[at[0], at[1] + 1.2 + ((st.t * 0.6) % 1), at[2]]} size={0.8} k={(st.t * 0.6) % 1} color="#8a8070" />
        </>
      ) : null}
      {kind === "bulb" ? <Ball at={at} r={0.09} surf={{c: col, glow: 0.6 + 0.6 * on}} ink={false} /> : null}
      {kind === "torch" || kind === "fire" ? <Fx kind="flame" at={[top[0], kind === "fire" ? at[1] + 0.05 : top[1] - 0.12, top[2]]} size={kind === "fire" ? 1.1 : 0.45} k={st.t + at[0]} /> : null}
      {I > 0 ? (
        <>
          <pointLight position={top} color={col} intensity={I * power * 2.2} distance={power * 2} decay={1.6} />
          <Fx kind="glow" at={top} size={glow * (kind === "candle" ? 0.9 : kind === "fire" ? 3 : 1.8)} k={I * 0.9} color={col} />
        </>
      ) : null}
    </group>
  );
};

/** A framed chalkboard / notice board with up to 4 lines of hand text. `at` = bottom centre on a wall. */
export const Board: React.FC<{at: V3; w?: number; h?: number; rot?: number; lines?: string[]; bg?: string; ink?: string}> = ({at, w = 2.2, h = 1.3, rot = 0, lines = [], bg = "#2f5b45", ink = "#f2efe6"}) => {
  const tex = canvasTex(`board|${w}|${h}|${bg}|${lines.join("/")}|${fontReady()}`, 512, Math.round((512 * h) / w), (g, cw, ch) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);
    g.globalAlpha = 0.12;
    for (let i = 0; i < 18; i++) {
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.ellipse(rnd(11, i) * cw, rnd(12, i) * ch, 40, 14, rnd(13, i) * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.fillStyle = ink;
    g.font = `700 ${Math.round(ch / 6)}px Inter, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, cw / 2, ((i + 1) * ch) / (lines.length + 1)));
  }, false);
  const st = useStage();
  return (
    <group position={at} rotation={[0, deg(rot), 0]}>
      <Box at={[0, -0.06, 0]} size={[w + 0.14, h + 0.12, 0.06]} surf={{c: "#7a4a2a", tex: "planks", tile: 0.8}} />
      <mesh position={[0, h / 2, 0.035]}>
        <planeGeometry args={[w, h]} />
        {st.spec.toon ? <meshToonMaterial map={tex} /> : <meshStandardMaterial map={tex} roughness={0.9} />}
      </mesh>
    </group>
  );
};

/** A sign with a word on it (shop, place name, year). `at` = bottom centre; set post to stand it on a pole. */
export const Sign: React.FC<{at: V3; text: string; w?: number; h?: number; rot?: number; bg?: string; color?: string; post?: number}> = ({at, text, w = 1.6, h = 0.5, rot = 0, bg = "#f2e2b8", color = "#3a2418", post = 0}) => {
  const st = useStage();
  const tex = canvasTex(`sign|${text}|${bg}|${color}|${w}|${h}|${fontReady()}`, 512, Math.round((512 * h) / w), (g, cw, ch) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = color;
    g.font = `800 ${Math.round(ch * 0.55)}px Inter, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, cw / 2, ch / 2 + 4, cw * 0.9);
  }, false);
  return (
    <group position={at} rotation={[0, deg(rot), 0]}>
      {post > 0 ? <Box at={[0, 0, -0.06]} size={[0.1, post, 0.1]} surf={{c: "#7a5232", tex: "planks"}} /> : null}
      <Box at={[0, post, 0]} size={[w + 0.08, h + 0.08, 0.06]} surf={{c: "#5a3a22"}} />
      <mesh position={[0, post + h / 2 + 0.04, 0.035]}>
        <planeGeometry args={[w, h]} />
        {st.spec.toon ? <meshToonMaterial map={tex} /> : <meshStandardMaterial map={tex} roughness={0.9} />}
      </mesh>
    </group>
  );
};
