import React from "react";
import {AbsoluteFill} from "remotion";
import {Film, pop, useScene} from "../story/StoryKit";
import {useSceneFrame} from "../camera/Transitions";
import {FONT} from "../styles/palette";
import {
  Ball, Box, CamKey, Cyl, Fx, Ground, Label3D, Lamp, P, Pole, Pose, SKIN, Sign, Stage, Toon, Who, Window, useStage, V3, Surf,
} from "../cartoon";
import {CUES, SCENES} from "./penumpangTiming";

/*
 * "Penumpang Terakhir" (thriller fiksi): a night taxi, a passenger whose face is never seen, a red car
 * sold three years ago. 27 scenes, one per narration line. The woman's face is always hidden behind her hair;
 * the crash and Andi's body are never shown (the picture goes black, then the morning after).
 */

/* ---------- cast ---------- */

const ANDI: Who = {name: "Andi", skin: SKIN.tan, shirt: "#3f5f8a", pants: "#2a3040", hair: "short", hairColor: "#1d1410", moustache: "#2a1d16", seed: 41};
const RATNA: Who = {name: "wanita", skin: "#e8dccf", shirt: "#ece8e0", pants: "#d8d2c8", skirt: "#e4ded4", hair: "long", hairColor: "#141018", seed: 42};
const POLISI: Who = {name: "polisi", skin: SKIN.brown, shirt: "#7a6a4a", pants: "#4a4030", hat: "cap", hatColor: "#3a3226", sash: "#e8e2d2", seed: 43};
const POLISI2: Who = {name: "polisi2", skin: SKIN.tan, shirt: "#7a6a4a", pants: "#4a4030", hat: "cap", hatColor: "#3a3226", seed: 44};

/* ---------- helpers ---------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (f: number, a: number, len: number) => clamp01((f - a) / len);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

/** Which shot of a scene is on: shots start at the given scene frames. */
const shotOf = (f: number, starts: number[]) => starts.filter((s) => f >= s).length - 1;

/** Scene-local frame of word w in phrase j (from the word alignment). */
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

/* ---------- the woman: her face is always hidden behind long hair ---------- */

/** Head centre and radius of an adult card of height h standing at height y. */
const head = (y: number, h: number) => ({cy: y + h * 0.643, r: h * 0.15});

const Veil: React.FC<{x: number; z: number; y: number; h: number}> = ({x, z, y, h}) => {
  const st = useStage();
  const {cy, r} = head(y, h);
  const yaw = (Math.atan2(st.cam.pos[0] - x, st.cam.pos[2] - z) * 180) / Math.PI;
  const dx = Math.sin((yaw * Math.PI) / 180) * 0.04;
  const dz = Math.cos((yaw * Math.PI) / 180) * 0.04;
  const hair = {c: "#141018"};
  const strands = [-0.8, -0.4, 0, 0.4, 0.8];
  const lens = [2.2, 2.6, 2.4, 2.7, 2.1];
  const ux = Math.cos((yaw * Math.PI) / 180);
  const uz = -Math.sin((yaw * Math.PI) / 180);
  return (
    <group>
      <Ball at={[x + dx * 0.5, cy + r * 0.25, z + dz * 0.5]} r={r * 1.08} sy={0.8} surf={hair} />
      {strands.map((o, i) => (
        <Box key={i} at={[x + dx + ux * o * r, cy + r * 0.55 - lens[i] * r, z + dz + uz * o * r]} size={[r * 0.46, lens[i] * r, 0.02]} surf={hair} rot={yaw} />
      ))}
    </group>
  );
};

/** The passenger: a pale figure, head bowed, face hidden. */
const Woman: React.FC<{x: number; z: number; y?: number; h?: number; t: number; opacity?: number}> = ({x, z, y = 0, h = 2.0, t, opacity = 1}) => {
  if (opacity <= 0.01) return null;
  const pose: Pose = {...P.idle(t * 0.6, 42), armL: [10, 30], armR: [10, 30], tilt: 4, lookY: 0.9, blink: 1};
  return (
    <group>
      <Toon who={RATNA} x={x} z={z} y={y} h={h} pose={pose} expr="neutral" opacity={opacity} />
      {opacity > 0.5 ? <Veil x={x} z={z} y={y} h={h} /> : null}
    </group>
  );
};

/* ---------- the car (centred at the origin, nose toward -z, driver on the right) ---------- */

const SEAT = {c: "#3a3438", tex: "cloth" as const, tile: 0.4};
const DARK = {c: "#1e1c22"};

/** A torus (steering wheel), skipped in probe mode. */
const Ring: React.FC<{at: V3; r: number; tube: number; rot: V3; c: string}> = ({at, r, tube, rot, c}) => {
  const st = useStage();
  if (st.probe !== null) return null;
  return (
    <mesh position={at} rotation={rot}>
      <torusGeometry args={[r, tube, 8, 28]} />
      <meshToonMaterial color={c} />
    </mesh>
  );
};

/** The rear-view mirror; `ghost` = the bowed head of the woman seen in it. */
const Mirror: React.FC<{ghost: boolean}> = ({ghost}) => (
  <group>
    <Pole from={[0, 1.55, -0.92]} to={[0, 1.45, -0.88]} r={0.015} surf={DARK} />
    <Box at={[0, 1.36, -0.88]} size={[0.56, 0.17, 0.05]} surf={DARK} />
    <Box at={[0, 1.375, -0.855]} size={[0.5, 0.13, 0.005]} surf={{c: "#2c3446", glow: 0.15}} ink={false} cast={false} />
    <Box at={[0, 1.375, -0.851]} size={[0.5, 0.05, 0.004]} surf={{c: "#3a3438"}} ink={false} cast={false} />
    {ghost ? (
      <group>
        <Box at={[0.0, 1.385, -0.849]} size={[0.07, 0.035, 0.004]} surf={{c: "#e8e2d8"}} ink={false} cast={false} />
        <Ball at={[0.0, 1.44, -0.849]} r={0.026} sy={1.3} surf={{c: "#0c0a10"}} ink={false} />
      </group>
    ) : null}
  </group>
);

type CarProps = {color?: string; sign?: boolean; ghost?: boolean; phone?: boolean; wreck?: boolean};

const Car: React.FC<CarProps> = ({color = "#e8b83a", sign = true, ghost = false, phone = true, wreck = false}) => {
  const body: Surf = {c: color, tex: "plaster", tile: 1.5};
  return (
    <group>
      {/* body shell */}
      <Box at={[0, 0.18, 0.2]} size={[2.0, 0.14, 4.6]} surf={{c: "#2a2a30"}} />
      <Box at={[0, 0.3, -1.65]} size={[1.96, 0.52, 1.3]} surf={body} tilt={wreck ? [8, 0, 3] : undefined} />
      <Box at={[0, 0.3, 2.05]} size={[1.96, 0.55, 0.9]} surf={body} />
      <Box at={[0.97, 0.3, 0.3]} size={[0.06, 0.58, 2.9]} surf={body} />
      <Box at={[-0.97, 0.3, 0.3]} size={[0.06, 0.58, 2.9]} surf={body} />
      <Box at={[0, 0.3, 0.3]} size={[1.9, 0.02, 2.9]} surf={{c: "#24222a"}} ink={false} />
      {/* pillars and roof */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Pole from={[s * 0.95, 0.85, -0.98]} to={[s * 0.92, 1.58, -0.55]} r={0.04} surf={body} />
          <Pole from={[s * 0.95, 0.85, 0.62]} to={[s * 0.93, 1.58, 0.62]} r={0.05} surf={body} />
          <Pole from={[s * 0.95, 0.85, 1.65]} to={[s * 0.92, 1.58, 1.35]} r={0.05} surf={body} />
        </group>
      ))}
      <Box at={[0, 1.58, 0.4]} size={[1.92, 0.07, 2.0]} surf={body} tilt={wreck ? [0, 0, -6] : undefined} />
      {sign ? <Sign at={[0, 1.65, 0.45]} text="TAKSI" w={0.6} h={0.2} bg="#f2efe6" color="#1e1c22" /> : null}
      {/* dashboard, wheel, mirror */}
      <Box at={[0, 0.3, -0.78]} size={[1.9, 0.55, 0.42]} surf={{c: "#26242c", tex: "cloth", tile: 0.5}} />
      <Box at={[-0.3, 0.86, -0.7]} size={[0.3, 0.02, 0.12]} surf={{c: "#4fa0ff", glow: 1}} ink={false} />
      <Ring at={[0.45, 0.86, -0.42]} r={0.17} tube={0.025} rot={[0.9, 0, 0]} c="#1a181e" />
      <Pole from={[0.45, 0.8, -0.6]} to={[0.45, 0.85, -0.45]} r={0.03} surf={DARK} />
      <Mirror ghost={ghost} />
      {phone ? (
        <group>
          <Box at={[0.78, 0.86, -0.68]} size={[0.14, 0.22, 0.02]} surf={DARK} tilt={[-15, 0, 0]} />
          <Box at={[0.78, 0.885, -0.665]} size={[0.12, 0.18, 0.005]} surf={{c: "#9fd0ff", glow: 0.9}} ink={false} tilt={[-15, 0, 0]} />
        </group>
      ) : null}
      {/* seats */}
      {[0.45, -0.45].map((x) => (
        <group key={x}>
          <Box at={[x, 0.3, 0.15]} size={[0.62, 0.18, 0.55]} surf={SEAT} />
          <Box at={[x, 0.45, 0.42]} size={[0.62, 0.48, 0.12]} surf={SEAT} />
        </group>
      ))}
      <Box at={[0, 0.3, 1.3]} size={[1.8, 0.2, 0.6]} surf={SEAT} />
      <Box at={[0, 0.48, 1.62]} size={[1.8, 0.55, 0.14]} surf={SEAT} />
      {/* wheels and lights */}
      {[[1, -1.4], [-1, -1.4], [1, 1.6], [-1, 1.6]].map(([s, z], i) => (
        <Cyl key={i} at={[s * 0.92, 0.32, z]} r={0.32} h={0.22} rot={[0, 0, s * 90]} surf={{c: "#18161a"}} seg={16} />
      ))}
      {wreck ? null : (
        <>
          <Ball at={[0.7, 0.62, -2.31]} r={0.1} surf={{c: "#fff6d8", glow: 1}} ink={false} />
          <Ball at={[-0.7, 0.62, -2.31]} r={0.1} surf={{c: "#fff6d8", glow: 1}} ink={false} />
          <Fx kind="glow" at={[0, 0.62, -2.6]} size={2.4} k={0.55} color="#fff2c0" />
        </>
      )}
      <Box at={[0.7, 0.55, 2.5]} size={[0.3, 0.1, 0.02]} surf={{c: "#ff3030", glow: 1}} ink={false} />
      <Box at={[-0.7, 0.55, 2.5]} size={[0.3, 0.1, 0.02]} surf={{c: "#ff3030", glow: 1}} ink={false} />
      {/* dim dashboard light on the faces */}
      <Lamp at={[0.1, 1.0, -0.6]} kind="none" power={1.6} color="#8fb0ff" glow={0} flicker={0} />
      <Lamp at={[0, 1.45, 0.95]} kind="none" power={1.5} color="#a8b8d8" glow={0} flicker={0} />
    </group>
  );
};

/* ---------- the street at night, scrolling past a car parked at the origin ---------- */

const loopZ = (base: number, speed: number, t: number, len = 56) => -44 + ((((base + speed * t) % len) + len) % len);

const LampPost: React.FC<{x: number; z: number; on?: boolean}> = ({x, z, on = true}) => {
  const s = Math.sign(x);
  return (
    <group>
      <Pole from={[x, 0, z]} to={[x, 3.6, z]} r={0.06} surf={{c: "#3a3a40"}} />
      <Pole from={[x, 3.6, z]} to={[x - s * 0.8, 3.7, z]} r={0.04} surf={{c: "#3a3a40"}} />
      <Box at={[x - s * 0.8, 3.58, z]} size={[0.4, 0.1, 0.2]} surf={{c: "#ffd98a", glow: on ? 1 : 0}} ink={false} />
    </group>
  );
};

const Street: React.FC<{speed?: number; t: number; lit?: number[]}> = ({speed = 0, t, lit = [1, 2]}) => (
  <group>
    <Ground surf={{c: "#2a2a32", tex: "dirt", tile: 2}} />
    {[-1, 1].map((s) => <Box key={s} at={[s * 3.4, 0, -10]} size={[1.6, 0.15, 80]} surf={{c: "#4a4a52", tex: "tiles", tile: 1}} ink={false} cast={false} />)}
    {Array.from({length: 14}, (_, i) => (
      <Box key={i} at={[-1.25, 0.01, loopZ(i * 4, speed, t)]} size={[0.12, 0.005, 1.8]} surf={{c: "#e8e2c8"}} ink={false} cast={false} />
    ))}
    {Array.from({length: 7}, (_, i) => {
      const z = loopZ(i * 8 + 2, speed, t);
      return (
        <group key={i}>
          <LampPost x={i % 2 ? 3.0 : -3.0} z={z} />
          {lit.includes(i) ? <Lamp at={[(i % 2 ? 3.0 : -3.0) * 0.75, 3.4, z]} kind="none" power={6} color="#ffcf7a" glow={0} flicker={0} /> : null}
        </group>
      );
    })}
    {Array.from({length: 7}, (_, i) => {
      const z = loopZ(i * 8, speed, t);
      const s = i % 2 ? 1 : -1;
      const h = 4 + ((i * 37) % 5);
      return (
        <group key={`b${i}`}>
          <Box at={[s * 6.5, 0, z]} size={[4.5, h, 6.5]} surf={{c: i % 3 ? "#3a3f52" : "#4a3f48", tex: "plaster", tile: 2}} />
          {[1.4, 3.0].filter((wy) => wy < h - 0.6).map((wy) => (
            <Window key={wy} at={[s * 4.22, wy, z + 1.2]} w={0.9} h={0.8} rot={-s * 90} glass={(i + wy) % 3 ? "#202838" : "#ffd27a"} glow={(i + wy) % 3 ? 0.1 : 1} />
          ))}
        </group>
      );
    })}
  </group>
);

/** A light that sweeps past the car windows every two seconds (street lamps going by). */
const PassingLight: React.FC<{t: number; speed?: number}> = ({t, speed = 1}) => {
  const z = -4 + ((t * speed * 4) % 8);
  return <Lamp at={[1.8, 2.4, z]} kind="none" power={3.5} color="#ffc070" glow={0} flicker={0} />;
};

/* ---------- 2D phone overlays (drawn over the 3D picture, above the caption band) ---------- */

const Card: React.FC<{k: number; top: number; children: React.ReactNode; accent?: string}> = ({k, top, children, accent = "#4fa0ff"}) =>
  k <= 0 ? null : (
    <div
      style={{
        position: "absolute", left: 70, width: 800, top, padding: "30px 36px", borderRadius: 34,
        background: "rgba(18,20,28,0.93)", border: `3px solid ${accent}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        fontFamily: FONT, color: "#f2efe6", opacity: Math.min(1, k), transform: `translateY(${(1 - Math.min(1, k)) * -40}px) scale(${0.94 + 0.06 * Math.min(1, k)})`,
      }}
    >
      {children}
    </div>
  );

const AppRow: React.FC<{icon: string; title: string; when?: string; color?: string}> = ({icon, title, when = "sekarang", color = "#4fa0ff"}) => (
  <div style={{display: "flex", alignItems: "center", gap: 18, marginBottom: 16}}>
    <div style={{width: 54, height: 54, borderRadius: 14, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#101218"}}>{icon}</div>
    <div style={{fontSize: 30, fontWeight: 700, color: "#b8bcc8", flex: 1}}>{title}</div>
    <div style={{fontSize: 26, color: "#8a8e9a"}}>{when}</div>
  </div>
);

const Line: React.FC<{k?: number; size?: number; color?: string; bold?: boolean; children: React.ReactNode}> = ({k = 1, size = 40, color = "#f2efe6", bold = false, children}) =>
  k <= 0 ? null : <div style={{fontSize: size, fontWeight: bold ? 800 : 600, lineHeight: 1.25, color, opacity: Math.min(1, k), marginTop: 8}}>{children}</div>;

const Mark: React.FC<{on: number; children: React.ReactNode}> = ({on, children}) => (
  <span style={{background: `rgba(232,50,46,${0.85 * on})`, borderRadius: 8, padding: "0 8px", color: on > 0.5 ? "#fff" : "inherit"}}>{children}</span>
);

/** The photo frame: everything outside the photo is the dark chat screen. */
const PhotoFrame: React.FC<{k: number; children?: React.ReactNode}> = ({k, children}) => {
  if (k <= 0) return null;
  const bg = "rgba(14,15,20,0.97)";
  const x0 = 90, x1 = 990, y0 = 300, y1 = 1020;
  return (
    <AbsoluteFill style={{opacity: Math.min(1, k)}}>
      <div style={{position: "absolute", left: 0, top: 0, width: 1080, height: y0, background: bg}} />
      <div style={{position: "absolute", left: 0, top: y1, width: 1080, height: 1920 - y1, background: bg}} />
      <div style={{position: "absolute", left: 0, top: y0, width: x0, height: y1 - y0, background: bg}} />
      <div style={{position: "absolute", left: x1, top: y0, width: 1080 - x1, height: y1 - y0, background: bg}} />
      <div style={{position: "absolute", left: x0 - 6, top: y0 - 6, width: x1 - x0 + 12, height: y1 - y0 + 12, border: "6px solid #f2efe6", borderRadius: 8}} />
      <div style={{position: "absolute", left: 90, top: 170, fontFamily: FONT, fontSize: 38, fontWeight: 700, color: "#b8bcc8"}}>Nomor tidak dikenal</div>
      <div style={{position: "absolute", left: 90, top: 1050, width: 900, fontFamily: FONT}}>{children}</div>
    </AbsoluteFill>
  );
};

const Dim: React.FC<{k: number}> = ({k}) => (k <= 0 ? null : <AbsoluteFill style={{backgroundColor: "#000", opacity: 0.45 * Math.min(1, k)}} />);
const Blackout: React.FC<{f: number; at: number}> = ({f, at}) => {
  const k = ramp(f, at, 4);
  return k <= 0 ? null : <AbsoluteFill style={{backgroundColor: "#000", opacity: k}} />;
};
const Flash: React.FC<{f: number; at: number}> = ({f, at}) => {
  const d = f - at;
  return d < 0 || d > 6 ? null : <AbsoluteFill style={{backgroundColor: "#fff", opacity: 0.75 * (1 - d / 6)}} />;
};

/* ---------- camera presets inside the car (car at the origin) ---------- */

const H_IN = 1.4; // card height inside the car
const Y_IN = 0.22; // cards stand below the floor so the heads sit at seat height
const ANDI_X = 0.45;
const ANDI_Z = 0.05;
const RATNA_X = 0.0;
const RATNA_Z = 1.3;
const ANDI_HEAD: V3 = [ANDI_X, head(Y_IN, H_IN).cy, ANDI_Z];
const RATNA_HEAD: V3 = [RATNA_X, head(Y_IN, H_IN).cy, RATNA_Z];

/** Close-up of Andi through the windshield; k pushes in (0..1). */
const andiCU = (f: number, k = 0, ease: CamKey["ease"] = "io"): CamKey => ({f, pos: [ANDI_X - 0.05, 1.2, lerp(-1.5, -1.32, k)], at: [ANDI_X, ANDI_HEAD[1] - 0.02, ANDI_Z], fov: 46, ease});
/** Close-up of the woman from between the front seats. */
const ratnaCU = (f: number, k = 0, ease: CamKey["ease"] = "io"): CamKey => ({f, pos: [RATNA_X + 0.03, 1.22, lerp(-0.35, -0.12, k)], at: [RATNA_X, RATNA_HEAD[1] - 0.04, RATNA_Z], fov: 46, ease});
/** The rear-view mirror, very close. */
const mirrorCU = (f: number, k = 0, ease: CamKey["ease"] = "io"): CamKey => ({f, pos: [0.02, 1.4, lerp(-0.1, -0.3, k)], at: [0.0, 1.44, -0.86], fov: 40, ease});
/** Both of them through the windshield. */
const twoShot = (f: number, k = 0, ease: CamKey["ease"] = "io"): CamKey => ({f, pos: [0.25, 1.45, lerp(-2.6, -2.35, k)], at: [0.2, 1.05, 0.7], fov: 48, ease});

const Inside: React.FC<{t: number; ratna?: number; ghost?: boolean; andi?: Pose; expr?: React.ComponentProps<typeof Toon>["expr"]; speed?: number; andiFacing?: 1 | -1; noAndi?: boolean}> = ({t, ratna = 1, ghost, andi, expr = "neutral", speed = 9, andiFacing = 1, noAndi = false}) => (
  <group>
    <Street speed={speed} t={t} />
    <Car ghost={ghost ?? ratna > 0.5} />
    <PassingLight t={t} speed={speed / 9} />
    {noAndi ? null : <Toon who={ANDI} x={ANDI_X} z={ANDI_Z} y={Y_IN} h={H_IN} pose={andi ?? P.idle(t, 41)} expr={expr} facing={andiFacing} shadow={false} />}
    <Woman x={RATNA_X} z={RATNA_Z} y={Y_IN} h={H_IN} t={t} opacity={ratna} />
  </group>
);

const drive = (t: number, seed = 41): Pose => ({...P.idle(t, seed), armL: [60, 40], armR: [60, 40]});
const tremble = (t: number, k = 1): Pose => ({...drive(t), bob: Math.sin(t * 45) * 2.5 * k, squash: 0.98});

/* ---------- scenes ---------- */

// 1. The taxi on an empty street at night.
const S01: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.02} cam={[{f: 0, pos: [2.8, 0.8, -6.5], at: [0, 0.9, -0.3]}, {f: len, pos: [2.0, 1.2, -4.6], at: [0, 1.0, 0]}]}>
      <Street speed={9} t={t} lit={[1, 2, 3]} />
      <Car />
      <Toon who={ANDI} x={ANDI_X} z={ANDI_Z} y={Y_IN} h={H_IN} pose={drive(t)} expr="tired" shadow={false} />
    </Stage>
  );
};

// 2. A woman waits under a street lamp; then the mirror.
const S02: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  if (shot < 2) {
    const cam: CamKey[] = shot === 0
      ? [{f: 0, pos: [0.6, 1.5, -1.5], at: [-2.3, 1.3, -7]}, {f: cueAt(1), pos: [0.2, 1.5, -2.6], at: [-2.3, 1.3, -7]}]
      : [{f: cueAt(1), pos: [-1.2, 1.55, -4.2], at: [-2.4, 1.35, -7], ease: "cut"}, {f: cueAt(2), pos: [-1.5, 1.5, -4.8], at: [-2.4, 1.35, -7]}];
    return (
      <Stage look="kartun" light="malam" hand={0.015} cam={cam}>
        <Street t={t} lit={[0, 1]} />
        <LampPost x={-3.0} z={-7.4} />
        <Lamp at={[-2.3, 3.2, -7.2]} kind="none" power={5} color="#ffd98a" glow={0} flicker={0.05} />
        <Woman x={-2.4} z={-7} t={t} />
        <Fx kind="glow" at={[1.5, 0.8, 0 - ramp(f, 0, len) * 3]} size={3} k={0.5} color="#fff2c0" />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.008} cam={[mirrorCU(cueAt(2), 0, "cut"), mirrorCU(len, 1)]}>
      <Inside noAndi t={t} ratna={0} ghost />
    </Stage>
  );
};

// 3. 01:30. Twelve hours behind the wheel.
const S03: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  if (shot === 0) {
    return (
      <Stage look="kartun" light="malam" hand={0.01} cam={[{f: 0, pos: [-0.2, 1.15, -0.1], at: [-0.25, 0.9, -0.62], fov: 44}, {f: cueAt(1), pos: [-0.22, 1.12, -0.2], at: [-0.25, 0.9, -0.62], fov: 42}]}>
        <Inside t={t} ratna={0} andi={drive(t)} expr="tired" />
        <Label3D text="01:30" at={[-0.25, 0.93, -0.62]} size={0.035} color="#7fc0ff" bg="#101820" />
      </Stage>
    );
  }
  if (shot === 1) {
    const yawn = Math.max(0, Math.sin(ramp(f, cueAt(1) + 10, 40) * Math.PI));
    return (
      <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(cueAt(1), 0, "cut"), andiCU(cueAt(2), 1)]}>
        <Inside t={t} ratna={0} andi={{...drive(t), talk: yawn, blink: yawn > 0.3 ? 1 : drive(t).blink, tilt: -6 * yawn}} expr="tired" />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.02} cam={[{f: cueAt(2), pos: [-3.2, 3.2, 3.5], at: [0, 0.8, -1.5], ease: "cut"}, {f: len, pos: [-2.6, 2.6, 2.4], at: [0, 0.8, -1.5]}]}>
      <Street speed={9} t={t} lit={[2, 3]} />
      <Car />
    </Stage>
  );
};

// 4. She gets in and sits in the back. The app shows her name.
const S04: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const k = ramp(f, 0, cueAt(1) + 10);
  return (
    <Stage look="kartun" light="malam" hand={0.012} cam={[twoShot(0), twoShot(len, 1)]}
      overlay={
        <Card k={ramp(f, cueAt(1), 8)} top={190}>
          <AppRow icon="T" title="TaksiKu" />
          <Line bold size={44}>Penumpang: Ratna</Line>
          <Line size={34} color="#b8bcc8">Tujuan: Jl. Melati No. 27</Line>
        </Card>
      }>
      <Street speed={0} t={t} />
      <Car />
      <Toon who={ANDI} x={ANDI_X} z={ANDI_Z} y={Y_IN} h={H_IN} pose={drive(t)} expr="tired" shadow={false} />
      <Woman x={lerp(-1.2, RATNA_X, easeOut(k))} z={RATNA_Z} y={Y_IN} h={H_IN} t={t} opacity={ramp(f, 0, 10)} />
    </Stage>
  );
};

// 5. "Jalan Melati nomor 27, Pak. Dan tolong jangan lihat saya lewat spion."
const S05: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  const cam = shot === 0 ? [ratnaCU(0), ratnaCU(cueAt(1), 0.4)] : shot === 1 ? [ratnaCU(cueAt(1), 0.6, "cut"), ratnaCU(cueAt(2), 1)] : [mirrorCU(cueAt(2), 0, "cut"), mirrorCU(len, 1)];
  return (
    <Stage look="kartun" light="malam" hand={0.01} cam={cam}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 6. He nods; the empty streets; then she asks.
const S06: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  if (shot === 0) {
    const nod = Math.sin(ramp(f, 6, 24) * Math.PI * 2) * 6;
    return (
      <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(0), andiCU(cueAt(1), 0.6)]}>
        <Inside ratna={0} ghost t={t} andi={{...drive(t), tilt: nod, lookX: -0.2}} expr="think" />
      </Stage>
    );
  }
  if (shot === 1) {
    return (
      <Stage look="kartun" light="malam" hand={0.015} cam={[{f: cueAt(1), pos: [5, 9, 6], at: [0, 0.5, -3], ease: "cut"}, {f: cueAt(2), pos: [3.5, 8, 4], at: [0, 0.5, -3]}]}>
        <Street speed={9} t={t} lit={[1, 3, 5]} />
        <Car />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.01} cam={[twoShot(cueAt(2), 0, "cut"), twoShot(len, 1)]}>
      <Inside t={t} andi={drive(t)} />
    </Stage>
  );
};

// 7. "Pak, sudah berapa lama jadi sopir?"
const S07: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.01} cam={[ratnaCU(0, 0.2), ratnaCU(len, 0.5)]}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 8. "Lima tahunan, Bu. Kenapa?"
const S08: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(0, 0.2), andiCU(len, 0.5)]}>
      <Inside ratna={0} ghost t={t} andi={{...P.talk(t, 41), armL: [60, 40]}} expr="happy" />
    </Stage>
  );
};

// 9. "Berarti Bapak pernah mengantar saya sebelumnya."
const S09: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.01} cam={[ratnaCU(0, 0.5), ratnaCU(len, 1)]}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 10. She says it softly. He laughs a little.
const S10: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  if (f < cueAt(1)) {
    return (
      <Stage look="kartun" light="malam" hand={0.01} cam={[twoShot(0, 0.3), twoShot(cueAt(1), 0.6)]}>
        <Inside t={t} andi={drive(t)} expr="neutral" />
      </Stage>
    );
  }
  const chuckle = Math.abs(Math.sin(t * 12)) * 0.6;
  return (
    <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(cueAt(1), 0.3, "cut"), andiCU(len, 0.6)]}>
      <Inside ratna={0} ghost t={t} andi={{...drive(t), talk: chuckle, bob: -chuckle * 6}} expr="happy" />
    </Stage>
  );
};

// 11. "Mobil Bapak dulu warnanya merah, kan?"
const S11: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  const word = useWordAt();
  const red = word(1, 1);
  const zoom = easeOut(ramp(f, red, 6));
  return (
    <Stage look="kartun" light="malam" hand={0.012} cam={[{...ratnaCU(0, 0.3), fov: 46}, {...ratnaCU(red, 0.5), fov: 46}, {...ratnaCU(len, 0.4), fov: lerp(46, 40, zoom)}]}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 12. The laugh stops. The red car he sold three years ago.
const S12: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  if (f < cueAt(1)) {
    return (
      <Stage look="kartun" light="malam" hand={0.03} cam={[andiCU(0, 0.4), andiCU(cueAt(1), 0.9)]}>
        <Inside ratna={0} ghost t={t} andi={tremble(t, 0.4)} expr="shock" />
        <Fx kind="drop" at={[ANDI_X + 0.18, ANDI_HEAD[1] + 0.12, ANDI_Z + 0.1]} size={0.12} k={pop(f, 14)} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="kenangan" hand={0.015} filter="sepia(0.35)" cam={[{f: cueAt(1), pos: [3.6, 1.6, -4.2], at: [0, 0.9, 0], ease: "cut"}, {f: len, pos: [3.0, 1.5, -3.4], at: [0, 0.9, 0]}]}>
      <Street t={t} lit={[1, 2]} />
      <Car color="#c8322e" sign={false} phone={false} />
      <Sign at={[0.97, 0.95, -0.2]} text="DIJUAL" w={0.7} h={0.24} rot={90} bg="#f2efe6" color="#c8322e" />
      <Label3D text="3 TAHUN LALU" at={[0.3, 1.95, -0.4]} size={0.24} k={pop(f, cueAt(2))} bg="#c8322e" />
    </Stage>
  );
};

// 13. Cold hands on the wheel, a glance at the mirror, her head still bowed.
const S13: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  if (shot === 0) {
    return (
      <Stage look="kartun" light="malam" hand={0.02} cam={[{f: 0, pos: [-0.25, 1.15, -0.15], at: [0.42, 0.98, -0.45], fov: 44}, {f: cueAt(1), pos: [-0.2, 1.12, -0.25], at: [0.42, 0.98, -0.45], fov: 40}]}>
        <Inside ratna={0} ghost t={t} andi={tremble(t)} expr="nervous" />
        <Fx kind="drop" at={[0.6, 1.0, -0.35]} size={0.1} k={pop(f, 20)} />
      </Stage>
    );
  }
  if (shot === 1) {
    return (
      <Stage look="kartun" light="malam" hand={0.015} cam={[andiCU(cueAt(1), 0.5, "cut"), andiCU(cueAt(2), 0.8)]}>
        <Inside ratna={0} ghost t={t} andi={{...tremble(t, 0.5), lookX: -0.9, lookY: -0.6}} expr="nervous" />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.008} cam={[mirrorCU(cueAt(2), 0.2, "cut"), mirrorCU(len, 1)]}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 14. The phone buzzes: a news alert about a woman killed on Jalan Melati.
const S14: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(0, 0.2), andiCU(len, 0.7)]}
      overlay={
        <>
          <Dim k={ramp(f, 4, 8)} />
          <Card k={ramp(f, 6, 8)} top={300} accent="#e8322e">
            <AppRow icon="!" title="BERITA" color="#e8322e" />
            <Line k={ramp(f, cueAt(1), 8)} bold size={46}>Tiga tahun lalu, seorang wanita tewas dalam kecelakaan di Jalan Melati</Line>
            <Line k={ramp(f, cueAt(2), 8)} size={36} color="#c8ccd8">Korban: Ratna, 24 tahun</Line>
          </Card>
        </>
      }>
      <Inside ratna={0} ghost t={t} andi={{...drive(t), lookX: 0.7, lookY: 0.5}} expr="nervous" />
      <Lamp at={[ANDI_X + 0.3, 0.9, -0.5]} kind="none" power={1.2} color="#9fd0ff" glow={0} flicker={0} />
    </Stage>
  );
};

// 15. The victim's name is the passenger's name.
const S15: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  if (f < cueAt(2)) {
    return (
      <Stage look="kartun" light="malam" hand={0.012} cam={[andiCU(0, 0.6), andiCU(cueAt(2), 0.9)]}
        overlay={
          <>
            <Dim k={1} />
            <Card k={1} top={300} accent="#e8322e">
              <AppRow icon="!" title="BERITA" color="#e8322e" />
              <Line size={36} color="#c8ccd8">Korban: <Mark on={ramp(f, 8, 8)}>Ratna</Mark>, 24 tahun</Line>
            </Card>
            <Card k={ramp(f, cueAt(1), 8)} top={620}>
              <AppRow icon="T" title="TaksiKu" when="perjalanan aktif" />
              <Line bold size={44}>Penumpang: <Mark on={ramp(f, cueAt(1) + 10, 8)}>Ratna</Mark></Line>
            </Card>
          </>
        }>
        <Inside ratna={0} ghost t={t} andi={{...tremble(t, 0.5), lookX: 0.7, lookY: 0.5}} expr="scared" />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.008} exposure={0.85} cam={[ratnaCU(cueAt(2), 0.3, "cut"), ratnaCU(len, 0.6)]}>
      <Inside noAndi t={t} andi={drive(t)} />
    </Stage>
  );
};

// 16. "Bu... sebenarnya Ibu siapa?"
const S16: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.04} cam={[andiCU(0, 0.3), andiCU(len, 0.9)]}>
      <Inside ratna={0} ghost t={t} andi={{...tremble(t), talk: f >= cueAt(1) ? P.talk(t, 41).talk * 0.7 : 0, lookX: -0.6, lookY: -0.5}} expr="scared" />
      <Fx kind="drop" at={[ANDI_X - 0.2, ANDI_HEAD[1] + 0.1, ANDI_Z + 0.1]} size={0.12} k={pop(f, 10)} />
    </Stage>
  );
};

// 17. "Bapak benar-benar tidak ingat?"
const S17: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.006} exposure={0.8} cam={[ratnaCU(0, 0.6), ratnaCU(len, 1)]}>
      <Inside noAndi t={t} andi={drive(t)} speed={7} />
    </Stage>
  );
};

// 18. He slams the brake and turns around.
const S18: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const brake = 4;
  if (f < cueAt(1)) {
    const k = ramp(f, brake, 14);
    // the world decelerates: integrate a speed that falls from 9 to 0
    const tt = brake / 30 + (k * 14) / 30 / 2;
    return (
      <Stage look="kartun" light="malam" hand={0.03} shake={[[brake + 10, 0.8]]} cam={[{f: 0, pos: [2.6, 0.7, -5.2], at: [0, 0.8, -0.5]}, {f: cueAt(1), pos: [2.4, 0.75, -4.8], at: [0, 0.8, -0.5]}]}>
        <Street speed={9} t={f < brake ? t : tt} lit={[1, 2]} />
        <group rotation={[(-3 * Math.sin(k * Math.PI) * Math.PI) / 180, 0, 0]}>
          <Car />
        </group>
        <Fx kind="smoke" at={[0.9, 0.3, -1.4]} size={0.9} k={ramp(f, brake, 20)} color="#8a8a90" />
        <Fx kind="lines" at={[0, 0.8, -2.8]} size={1.2} k={f < brake + 8 ? 1 : 0} />
      </Stage>
    );
  }
  return (
    <Stage look="kartun" light="malam" hand={0.04} shake={[[cueAt(1) + 2, 0.5]]} cam={[andiCU(cueAt(1), 0.6, "cut"), andiCU(len, 0.9)]}>
      <Inside ratna={0} ghost t={t} speed={0} andi={{...P.idle(t, 41), lookX: 1, lookY: 0.1, armL: [40, 60]}} expr="scared" andiFacing={-1} />
    </Stage>
  );
};

// 19. The back seat is empty.
const S19: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.006} cam={[{...ratnaCU(0, 0.0), pos: [RATNA_X + 0.1, 1.25, -0.45]}, {...ratnaCU(len, 0.0), pos: [RATNA_X + 0.08, 1.22, -0.2]}]}>
      <Inside noAndi t={t} speed={0} ratna={0} ghost={false} andi={P.idle(t, 41)} />
    </Stage>
  );
};

// 20. Another buzz: a photo from an unknown number.
const S20: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  return (
    <Stage look="kartun" light="malam" hand={0.02} cam={[andiCU(0, 0.3), andiCU(len, 0.8)]}
      overlay={
        <>
          <Dim k={ramp(f, 4, 8)} />
          <Card k={ramp(f, 6, 8)} top={300} accent="#8a8e9a">
            <AppRow icon="?" title="Nomor tidak dikenal" color="#8a8e9a" />
            <Line k={ramp(f, cueAt(1), 8)} size={38} color="#c8ccd8">Pesan baru</Line>
            {f >= cueAt(2) ? (
              <div style={{marginTop: 16, height: 300, borderRadius: 20, background: "linear-gradient(135deg,#3a2a2a,#1a1416)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#8a8e9a", opacity: ramp(f, cueAt(2), 8)}}>
                1 foto
              </div>
            ) : null}
          </Card>
        </>
      }>
      <Inside t={t} speed={0} ratna={0} ghost={false} andi={{...tremble(t, 0.6), lookX: 0.7, lookY: 0.5}} expr="scared" />
    </Stage>
  );
};

/* The photo: the red car three years ago, Andi driving, the same woman in the back. */
const PhotoInside: React.FC<{t: number; noAndi?: boolean}> = ({t, noAndi = false}) => (
  <group>
    <Street speed={0} t={0} lit={[1, 2]} />
    <Car color="#c8322e" sign={false} phone={false} ghost />
    {noAndi ? null : <Toon who={ANDI} x={ANDI_X} z={ANDI_Z} y={Y_IN} h={H_IN} pose={drive(0)} expr="happy" shadow={false} />}
    <Woman x={RATNA_X} z={RATNA_Z} y={Y_IN} h={H_IN} t={t * 0.2} />
  </group>
);

// 21. The red car, Andi at the wheel, and in the back seat, the same woman.
const S21: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  const cam: CamKey[] = shot === 0
    ? [{f: 0, pos: [3.6, 1.4, -4.4], at: [0, 0.9, 0]}, {f: cueAt(1), pos: [3.2, 1.4, -3.9], at: [0, 0.9, 0]}]
    : shot === 1 ? [andiCU(cueAt(1), 0.1, "cut"), andiCU(cueAt(2), 0.4)] : [twoShot(cueAt(2), 0, "cut"), twoShot(len, 1)];
  return (
    <Stage look="kartun" light="kenangan" hand={0.006} filter="sepia(0.45) contrast(1.05)" cam={cam} overlay={<PhotoFrame k={1} />}>
      <PhotoInside t={t} />
    </Stage>
  );
};

// 22-23. Under the photo, a message.
const MESSAGE_1 = "Kamu yang membunuhku.";
const MESSAGE_2 = "Kenapa kamu masih hidup?";
const typed = (text: string, f: number, at: number, cps = 22) => text.slice(0, Math.max(0, Math.floor(((f - at) / 30) * cps)));

const S22: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  const dots = ".".repeat(1 + (Math.floor(f / 8) % 3));
  return (
    <Stage look="kartun" light="kenangan" hand={0.006} filter="sepia(0.45) contrast(1.05)" cam={[twoShot(0, 0.2), twoShot(len, 0.4)]} overlay={<PhotoFrame k={1}><div style={{fontSize: 48, color: "#8a8e9a", fontWeight: 800}}>{dots}</div></PhotoFrame>}>
      <PhotoInside t={t} />
    </Stage>
  );
};

const S23: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  return (
    <Stage look="kartun" light="kenangan" hand={0.006} filter="sepia(0.45) contrast(1.05)" cam={[twoShot(0, 0.4), twoShot(len, 1)]}
      overlay={
        <PhotoFrame k={1}>
          <div style={{fontSize: 50, fontWeight: 800, color: "#ff4a44", lineHeight: 1.2}}>{typed(MESSAGE_1, f, cueAt(0))}</div>
          <div style={{fontSize: 50, fontWeight: 800, color: "#ff4a44", lineHeight: 1.2}}>{typed(MESSAGE_2, f, cueAt(1))}</div>
        </PhotoFrame>
      }>
      <PhotoInside t={t} />
    </Stage>
  );
};

// 24. He loses control and the taxi slides into the barrier. Black.
const S24: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const word = useWordAt();
  const hit = word(1, 3); // "pembatas"
  const k = ramp(f, cueAt(1) - 10, hit - cueAt(1) + 10);
  const yaw = Math.sin(t * 7) * 6 * (1 - k) - 28 * easeOut(k);
  return (
    <Stage look="kartun" light="malam" hand={0.04} shake={[[hit, 1]]} cam={[{f: 0, pos: [-1.8, 2.6, -8.5], at: [0.5, 0.8, -1]}, {f: len, pos: [-1.2, 2.4, -7.5], at: [1.5, 0.8, -1]}]}
      overlay={<><Flash f={f} at={hit} /><Blackout f={f} at={hit + 3} /></>}>
      <Street speed={9 * (1 - k * 0.6)} t={t} lit={[1, 2]} />
      {Array.from({length: 12}, (_, i) => <Box key={i} at={[2.45, 0, -16 + i * 2.4]} size={[0.12, 0.75, 2.3]} surf={{c: "#c8c8c0", tex: "stone", tile: 1}} />)}
      <group position={[2.2 * easeOut(k), 0, -1.2 * k]} rotation={[0, (yaw * Math.PI) / 180, 0]}>
        <Car />
      </group>
      <Fx kind="smoke" at={[1.2 * k, 0.4, 1.4]} size={1.2} k={ramp(f, cueAt(1), 20)} color="#8a8a90" />
      <Fx kind="burst" at={[2.4, 0.9, -2.2]} size={2.6} k={(f - hit) / 10} />
    </Stage>
  );
};

/* The morning after: the wrecked taxi at the barrier, police lights. */
const Morning: React.FC<{t: number}> = ({t}) => {
  const blink = Math.floor(t * 4) % 2;
  return (
    <group>
      <Ground surf={{c: "#5a5a62", tex: "dirt", tile: 2}} />
      {Array.from({length: 12}, (_, i) => <Box key={i} at={[2.45, 0, -16 + i * 2.4]} size={[0.12, 0.75, 2.3]} surf={{c: "#c8c8c0", tex: "stone", tile: 1}} tilt={i === 6 ? [0, 0, -18] : undefined} />)}
      {Array.from({length: 5}, (_, i) => <Box key={`m${i}`} at={[-1.25, 0.01, -14 + i * 4]} size={[0.12, 0.005, 1.8]} surf={{c: "#e8e2c8"}} ink={false} cast={false} />)}
      <group position={[1.3, 0, -1.6]} rotation={[0, (-28 * Math.PI) / 180, (2 * Math.PI) / 180]}>
        <Car wreck phone={false} />
      </group>
      <Fx kind="smoke" at={[1.8, 1.4 + ((t * 0.4) % 1) * 0.6, -3.2]} size={1.4} k={(t * 0.4) % 1} color="#9a9aa0" />
      {/* police car */}
      <group position={[-1.6, 0, 3.2]} rotation={[0, (12 * Math.PI) / 180, 0]}>
        <Box at={[0, 0.18, 0]} size={[1.9, 0.55, 4.2]} surf={{c: "#f2efe6", tex: "plaster", tile: 1.5}} />
        <Box at={[0, 0.73, 0.2]} size={[1.7, 0.5, 2.0]} surf={{c: "#2a3a5a", tex: "plaster", tile: 1.5}} />
        <Box at={[0.25, 1.23, 0.2]} size={[0.4, 0.12, 0.2]} surf={{c: "#ff3030", glow: blink}} ink={false} />
        <Box at={[-0.25, 1.23, 0.2]} size={[0.4, 0.12, 0.2]} surf={{c: "#3060ff", glow: 1 - blink}} ink={false} />
      </group>
      <Lamp at={[-1.4, 1.5, 3.0]} kind="none" power={4} color={blink ? "#ff4040" : "#4060ff"} glow={0} flicker={0} />
    </group>
  );
};

// 25. Police find the taxi in the morning; Andi did not survive.
const S25: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1), cueAt(2)]);
  const cam: CamKey[] = shot === 0
    ? [{f: 0, pos: [-2.6, 2.6, 8.5], at: [0.6, 0.9, -1.2]}, {f: cueAt(1), pos: [-2.2, 2.3, 7.4], at: [0.6, 0.9, -1.2]}]
    : shot === 1 ? [{f: cueAt(1), pos: [-0.8, 1.3, 2.6], at: [1.3, 0.9, -1.6], ease: "cut"}, {f: cueAt(2), pos: [-0.6, 1.25, 2.0], at: [1.3, 0.9, -1.6]}]
    : [{f: cueAt(2), pos: [-0.3, 1.55, 3.2], at: [-0.05, 1.25, 0.6], ease: "cut"}, {f: len, pos: [-0.25, 1.5, 2.7], at: [-0.05, 1.25, 0.6]}];
  return (
    <Stage look="kartun" light="siang" hand={0.012} filter="saturate(0.55) brightness(0.95)" sky={["#9aa6b8", "#d8dce2"]} cam={cam}>
      <Morning t={t} />
      <Toon who={POLISI} x={-0.1} z={0.6} pose={shot === 2 ? {...P.slump(t, 43), armR: [150, 150]} : P.idle(t, 43)} expr={shot === 2 ? "sad" : "neutral"} facing={1} />
      <Toon who={POLISI2} x={-1.3} z={1.0} pose={P.talk(t, 44)} expr="sad" />
    </Stage>
  );
};

// 26. The back seat is empty, except for a phone whose screen is still on.
const PhoneOnSeat: React.FC<{t: number}> = ({t}) => (
  <group>
    <Box at={[RATNA_X, 0.505, 1.25]} size={[0.16, 0.012, 0.28]} surf={DARK} tilt={[0, 18, 0]} />
    <Box at={[RATNA_X, 0.518, 1.25]} size={[0.14, 0.003, 0.25]} surf={{c: "#9fd0ff", glow: 0.9 + Math.sin(t * 3) * 0.1}} ink={false} tilt={[0, 18, 0]} />
    <Lamp at={[RATNA_X, 0.65, 1.25]} kind="none" power={0.8} color="#9fd0ff" glow={0} flicker={0} />
  </group>
);

const S26: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  const shot = shotOf(f, [0, cueAt(1)]);
  const cam: CamKey[] = shot === 0
    ? [{f: 0, pos: [RATNA_X + 0.1, 1.3, -0.45], at: [RATNA_X, 0.7, 1.3], fov: 46}, {f: cueAt(1), pos: [RATNA_X + 0.1, 1.25, -0.25], at: [RATNA_X, 0.65, 1.3], fov: 44}]
    : [{f: cueAt(1), pos: [RATNA_X + 0.05, 1.05, 0.55], at: [RATNA_X, 0.52, 1.25], fov: 40, ease: "cut"}, {f: len, pos: [RATNA_X + 0.04, 0.95, 0.75], at: [RATNA_X, 0.52, 1.25], fov: 38}];
  return (
    <Stage look="kartun" light="siang" hand={0.006} filter="saturate(0.5) brightness(0.8)" sky={["#9aa6b8", "#d8dce2"]} cam={cam}>
      <Ground surf={{c: "#5a5a62", tex: "dirt", tile: 2}} />
      <Car wreck phone={false} ghost={false} />
      <PhoneOnSeat t={t} />
    </Stage>
  );
};

// 27. A new trip: passenger Andi, destination Jalan Melati 27.
const S27: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {cueAt, len} = useScene();
  return (
    <Stage look="kartun" light="siang" hand={0.006} filter="saturate(0.5) brightness(0.8)" sky={["#9aa6b8", "#d8dce2"]}
      cam={[{f: 0, pos: [RATNA_X + 0.04, 0.95, 0.75], at: [RATNA_X, 0.52, 1.25], fov: 38}, {f: len, pos: [RATNA_X + 0.03, 0.85, 0.95], at: [RATNA_X, 0.52, 1.25], fov: 36}]}
      overlay={
        <>
          <Dim k={ramp(f, 2, 8)} />
          <Card k={ramp(f, 4, 8)} top={420}>
            <AppRow icon="T" title="TaksiKu" />
            <Line bold size={48}>Perjalanan baru</Line>
            <Line k={ramp(f, cueAt(1), 8)} size={44}>Penumpang: <Mark on={ramp(f, cueAt(1) + 8, 8)}>Andi</Mark></Line>
            <Line k={ramp(f, cueAt(2), 8)} size={44}>Tujuan: Jl. Melati No. 27</Line>
          </Card>
        </>
      }>
      <Ground surf={{c: "#5a5a62", tex: "dirt", tile: 2}} />
      <Car wreck phone={false} ghost={false} />
      <PhoneOnSeat t={t} />
    </Stage>
  );
};

export const PenumpangTerakhir: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={SCENES}
    cues={CUES}
    kinds={["cut", "fade", "cut", "cut", "cut", "cut", "cut", "cut", "cut", "cut", "cut", "fade", "cut", "cut", "cut", "cut", "cut", "cut", "cut", "fade", "cut", "cut", "cut", "fade", "cut", "cut"]}
    narration={narration}
    render={(i) => {
      const all = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27];
      const S = all[i];
      return <S key={i} />;
    }}
  />
);
