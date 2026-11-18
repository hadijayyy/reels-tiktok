import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Glow, Label} from "../environment/Furniture";
import {Vignette} from "../environment/HorrorProps";
import {Arrow, Asteroid, ASTRONAUT, BigStar, BlackHole as Hole, Burst, HorizonRing, Photon, SP, SpacetimeGrid, spiralIn, Starfield, Tag} from "../environment/SpaceProps";
import {clamp, eIn, eInOut, eOut, keysObj, lerp, noise, prog} from "../motion/ease";
import {idle, point, sit} from "../rig/poses";
import {Pose, Stickman} from "../rig/Stickman";
import {C, FONT, FPS} from "../styles/palette";
import {CUES, SCENES as BH_SCENES} from "./blackholeTiming";

/*
 * BLACK HOLE: TEMPAT DI MANA CAHAYA PUN TAK BISA KABUR — a 14-scene space explainer (about 70 s).
 * An astronaut guide watches a giant star collapse into a black hole, then meets the event horizon,
 * the accretion disk, gravitational lensing, spaghettification and the unexplained singularity.
 * Narration script: scripts/narasi/blackhole.txt. Facts and sources: scripts/narasi/blackhole-copy.md.
 */

export {FRAMES as BLACKHOLE_FRAMES} from "./blackholeTiming";

const S = 0.85; // astronaut scale

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => CUES[cue].from - BH_SCENES[scene].from;

/** Pops in with a small overshoot: 0 before `at`, 1 soon after. */
const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

const cam = (frame: number, len: number, a: [number, number, number], b: [number, number, number]) =>
  keysObj(frame, [
    [0, {x: a[0], y: a[1], zoom: a[2], rot: 0}],
    [len, {x: b[0], y: b[1], zoom: b[2], rot: 0}],
  ], eInOut);

/** Weightless idle: slow sway, legs a little loose. */
const float = (t: number, seed = 0): Pose => ({
  ...idle(t, seed),
  hipL: 8 + noise(t * 0.5, seed) * 6,
  kneeL: 14,
  hipR: -4 + noise(t * 0.5, seed + 2) * 6,
  kneeR: 10,
  shL: -24 + noise(t * 0.4, seed + 4) * 8,
  shR: 22 + noise(t * 0.4, seed + 6) * 8,
});

const Space: React.FC<{t: number; nebula?: number}> = ({t, nebula}) => (
  <Layer depth={0.2}>
    <Starfield t={t} nebula={nebula} />
  </Layer>
);

/** The astronaut standing on a small asteroid. (x, y) = the rock's top. */
const OnRock: React.FC<{x: number; y: number; t: number; pose?: Pose; expr?: React.ComponentProps<typeof Stickman>["expr"]; facing?: number; w?: number}> = ({x, y, t, pose, expr = "neutral", facing = 1, w = 260}) => (
  <g>
    <Asteroid x={x} y={y} w={w} />
    <Stickman x={x} y={y + 2} scale={S} facing={facing} pose={pose ?? idle(t)} look={ASTRONAUT} expr={expr} />
  </g>
);

// ---------------------------------------------------------------- 1. Light falls in and never comes out
const S1Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 80, y: -260};
  const trapped = cueAt(1, 0);
  const src = {x: -470, y: -660};
  const photons = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const start = trapped - 30 + i * 12;
    const k = prog(frame, start, start + 50, eIn);
    return {k, p: spiralIn(src, bh, k * 0.97, 2.4), on: frame >= start};
  });
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 0, 1.0], [40, -40, 1.12])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Glow x={src.x} y={src.y} r={120} color={SP.hotter} opacity={0.7} />
          <circle cx={src.x} cy={src.y} r={16} fill="#FFFBEA" />
          <Hole x={bh.x} y={bh.y} r={90} t={t} disk={0.55} />
          {photons.map((ph, i) => (ph.on && ph.k < 1 ? <Photon key={i} x={ph.p.x} y={ph.p.y} opacity={1 - Math.pow(ph.k, 6)} /> : null))}
          <OnRock x={-250} y={190} t={t} pose={point(idle(t), prog(frame, 20, 40), 60)} expr={frame > trapped + 20 ? "surprised" : "neutral"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. Past the edge nothing comes back; the name
const S2Batas: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 0, y: -180};
  const nm = cueAt(5, 1);
  const rock = spiralIn({x: 520, y: -520}, bh, prog(frame, 0, cueAt(4, 1) + 20, eIn), 2.2);
  const sat = spiralIn({x: -520, y: 80}, bh, prog(frame, cueAt(4, 1) - 10, nm + 10, eIn), 2.6);
  const kr = prog(frame, 0, cueAt(4, 1) + 20, eIn);
  const ks = prog(frame, cueAt(4, 1) - 10, nm + 10, eIn);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 0, 0.95], [0, -40, 1.05])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={110} t={t} disk={0.7} />
          <HorizonRing x={bh.x} y={bh.y} r={112} t={t} k={prog(frame, 6, 24)} />
          {kr < 1 ? (
            <g transform={`translate(${rock.x} ${rock.y}) rotate(${t * 90}) scale(${1 - kr * 0.8})`}>
              <Asteroid x={0} y={0} w={90} />
            </g>
          ) : null}
          {ks < 1 ? (
            <g transform={`translate(${sat.x} ${sat.y}) rotate(${t * -70}) scale(${1 - ks * 0.8})`}>
              <rect x={-14} y={-14} width={28} height={28} fill="#C9C7BF" stroke={C.ink} strokeWidth={3} />
              <rect x={-64} y={-8} width={44} height={16} fill="#2D5FA8" stroke={C.ink} strokeWidth={3} />
              <rect x={20} y={-8} width={44} height={16} fill="#2D5FA8" stroke={C.ink} strokeWidth={3} />
            </g>
          ) : null}
          <Tag x={0} y={-500} text="BLACK HOLE" size={92} k={pop(frame, nm)} />
          <OnRock x={-280} y={190} t={t} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Eight arrows around a star: outward (push) or inward (pull). */
const RingArrows: React.FC<{x: number; y: number; r0: number; r1: number; color: string; k: number; out: boolean; phase?: number}> = ({x, y, r0, r1, color, k, out, phase = 0}) => (
  <g opacity={k}>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i / 8) * Math.PI * 2 + phase;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const [ra, rb] = out ? [r0, r1] : [r1, r0];
      return <Arrow key={i} x1={x + c * ra} y1={y + s * ra} x2={x + c * rb} y2={y + s * rb} color={color} w={11} />;
    })}
  </g>
);

// ---------------------------------------------------------------- 3. A giant star in balance
const S3Bintang: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const star = {x: 0, y: -330};
  const yrs = cueAt(7, 2);
  const nuk = cueAt(8, 2);
  const grav = cueAt(9, 2);
  const pulse = Math.sin(t * 3) * 10;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 40, 0.9], [0, 0, 1.0])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <BigStar x={star.x} y={star.y} r={170} t={t} />
          <RingArrows x={star.x} y={star.y} r0={185 + pulse} r1={260 + pulse} color={SP.hot} k={prog(frame, nuk, nuk + 12)} out />
          <RingArrows x={star.x} y={star.y} r0={200 - pulse} r1={285 - pulse} color={SP.blue} k={prog(frame, grav, grav + 12)} out={false} phase={Math.PI / 8} />
          <Tag x={0} y={-640} text="MILIARAN TAHUN" size={60} k={pop(frame, yrs)} />
          <Tag x={120} y={70} text="NUKLIR: DORONG" size={42} color={SP.hot} k={pop(frame, nuk + 4)} />
          <Tag x={120} y={150} text="GRAVITASI: TARIK" size={42} color={SP.blue} k={pop(frame, grav + 4)} />
          <OnRock x={-330} y={190} t={t} pose={point(idle(t), prog(frame, nuk, nuk + 15), 130)} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. Fuel runs out; the core collapses
const S4Runtuh: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const star = {x: 0, y: -240};
  const breakAt = cueAt(11, 3);
  const collapse = cueAt(12, 3);
  const fuel = 1 - prog(frame, 0, breakAt, eInOut);
  const heat = 1 - prog(frame, breakAt - 10, breakAt + 10);
  const shrink = prog(frame, collapse, collapse + 40, eIn);
  const r = lerp(200, 34, shrink);
  const shake = frame > breakAt && shrink < 1 ? noise(t * 20, 3) * 6 : 0;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 0, 1.0], [0, -60, 1.12])} t={t} handheld={frame > breakAt ? 1.2 : 0} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <BigStar x={star.x + shake} y={star.y} r={r} t={t} heat={heat} />
          <RingArrows x={star.x} y={star.y} r0={r + 20} r1={r + 120} color={SP.blue} k={prog(frame, collapse, collapse + 8) * (1 - prog(frame, collapse + 40, collapse + 50))} out={false} />
          {/* fuel gauge */}
          <g transform="translate(0 -640)">
            <Label x={0} y={-30} text="BAHAN BAKAR" size={52} color={C.bone} />
            <rect x={-220} y={-4} width={440} height={44} rx={10} fill="#05060C" stroke={C.bone} strokeWidth={4} />
            <rect x={-212} y={4} width={424 * fuel} height={28} rx={6} fill={fuel > 0.3 ? SP.hot : C.red} />
          </g>
          <Tag x={80} y={20} text="KOLAPS!" size={64} color={C.red} k={pop(frame, collapse + 6)} />
          <OnRock x={-280} y={190} t={t} expr={frame > breakAt ? "worried" : "neutral"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. A flash, and a black hole is born
const S5Lahir: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const c = {x: 0, y: -240};
  const mass = cueAt(14, 4);
  const boom = cueAt(15, 4);
  const born = cueAt(16, 4);
  const coreK = 1 - prog(frame, boom, boom + 6);
  const burst = prog(frame, boom, boom + 34, eOut);
  const holeK = prog(frame, boom + 10, born + 10);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -40, 1.1], [0, -20, 0.98])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          {coreK > 0 ? <BigStar x={c.x} y={c.y} r={34} t={t} heat={0} opacity={coreK} /> : null}
          {frame >= boom ? <Burst x={c.x} y={c.y} k={burst} r={720} /> : null}
          <g opacity={holeK}>
            <Hole x={c.x} y={c.y} r={lerp(30, 100, holeK)} t={t} disk={holeK} />
          </g>
          <Tag x={0} y={-560} text="MASSA BESAR" size={56} color={SP.hot} k={pop(frame, mass) * (1 - prog(frame, boom, boom + 8))} />
          <Tag x={0} y={-560} text="BLACK HOLE" size={92} k={pop(frame, born)} />
          <OnRock x={-280} y={190} t={t} pose={frame > boom ? {...idle(t), shL: -120, shR: 40, elL: -30} : idle(t)} expr={frame > boom ? "surprised" : "worried"} />
        </Layer>
      </Camera2D>
      <AbsoluteFill style={{backgroundColor: "#FFF6E0", opacity: 0.9 * (1 - prog(frame, boom, boom + 14)) * (frame >= boom ? 1 : 0)}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. Not a hole: a region of space-time
const S6BukanLubang: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const no = cueAt(17, 5);
  const grid = cueAt(18, 5);
  const ext = cueAt(19, 5);
  const holeOut = prog(frame, grid - 6, grid + 6);
  const depth = prog(frame, grid, ext + 20, eInOut);
  const g = {x: 0, y: -330};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 0, 1.0], [0, -30, 1.06])} t={t} background={SP.void}>
        <Space t={t} nebula={0.6} />
        <Layer depth={1}>
          {/* an ordinary hole, crossed out */}
          <g opacity={1 - holeOut}>
            <ellipse cx={0} cy={-260} rx={200} ry={60} fill="#000" stroke={SP.rockLight} strokeWidth={8} />
            <g opacity={prog(frame, no + 14, no + 22)}>
              <line x1={-170} y1={-380} x2={170} y2={-140} stroke={C.red} strokeWidth={20} strokeLinecap="round" />
              <line x1={170} y1={-380} x2={-170} y2={-140} stroke={C.red} strokeWidth={20} strokeLinecap="round" />
            </g>
            <Tag x={0} y={-470} text="LUBANG?" size={60} k={pop(frame, no)} />
          </g>
          <g opacity={holeOut}>
            <SpacetimeGrid x={g.x} y={g.y} w={480} depth={depth} />
            <Hole x={g.x} y={g.y + 340 * depth - 10} r={lerp(10, 44, depth)} t={t} disk={0} />
            <Tag x={0} y={-560} text="RUANG + WAKTU" size={58} color={SP.blue} k={pop(frame, grid + 4)} />
            <Tag x={110} y={90} text="GRAVITASI EKSTREM" size={46} color={SP.hot} k={pop(frame, ext + 6)} />
          </g>
          <OnRock x={-300} y={190} t={t} w={220} pose={point(idle(t), prog(frame, grid, grid + 14), 70)} expr="focused" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. The event horizon: light goes in, not out
const S7Horizon: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 40, y: -240};
  const name = cueAt(21, 6);
  const cross = cueAt(22, 6);
  const R = 140;
  // a photon flies past from the right, then falls through the ring
  const k1 = prog(frame, cross - 20, cueAt(23, 6) + 25, eIn);
  const ph = spiralIn({x: 560, y: -520}, bh, k1, 2.0);
  const inside = Math.hypot(ph.x - bh.x, ph.y - bh.y) < R;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -20, 1.0], [20, -60, 1.1])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={R - 4} t={t} disk={0.35} />
          <HorizonRing x={bh.x} y={bh.y} r={R} t={t} k={prog(frame, name - 4, name + 10)} />
          <Tag x={40} y={-470} text="EVENT HORIZON" size={66} color="#9FD4FF" k={pop(frame, name + 4)} />
          {k1 > 0 && k1 < 1 ? <Photon x={ph.x} y={ph.y} opacity={inside ? 0.6 : 1} /> : null}
          <Tag x={40} y={0} text="TAK BISA KEMBALI" size={46} color={C.red} k={pop(frame, cueAt(23, 6) + 10)} />
          <OnRock x={-300} y={190} t={t} pose={point(idle(t), prog(frame, name, name + 14), 75)} expr="focused" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8. The accretion disk
const S8Disk: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 0, y: -250};
  const spin = cueAt(25, 7);
  const hot = cueAt(26, 7);
  const name = cueAt(27, 7);
  const disk = 0.25 + 0.75 * prog(frame, spin, hot + 10);
  const gas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
    const start = spin - 10 + i * 9;
    const k = ((frame - start) / 70) % 1;
    const a = i * 0.63 + k * 7;
    const r = lerp(330, 120, k);
    return frame < start ? null : <circle key={i} cx={bh.x + Math.cos(a) * r} cy={bh.y + Math.sin(a) * r * 0.26} r={6 + (i % 3) * 2} fill={i % 2 ? SP.hot : "#B9B3C9"} opacity={0.8 * (1 - k)} />;
  });
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -60, 1.0], [0, -80, 1.08])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={110} t={t * (1 + disk)} disk={disk} />
          {gas}
          <Tag x={0} y={-560} text="ACCRETION DISK" size={66} color={SP.hot} k={pop(frame, name)} />
          <Tag x={0} y={-40} text="JUTAAN DERAJAT" size={44} color={SP.hotter} k={pop(frame, hot + 6)} />
          <OnRock x={-300} y={190} t={t} expr="surprised" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9. Gravitational lensing
const S9Lensing: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const star = {x: 0, y: -560};
  const bh = {x: 0, y: -230};
  const eye = {x: 0, y: 0};
  const bend = cueAt(28, 8);
  const ghost = cueAt(29, 8);
  const name = cueAt(30, 8);
  const draw = prog(frame, bend, bend + 40);
  // light leaves the star, swings round the hole, and reaches the astronaut's helmet
  const ray = (side: -1 | 1) => `M ${star.x} ${star.y} Q ${side * 300} ${bh.y} ${eye.x} ${eye.y}`;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -40, 0.98], [0, -60, 1.04])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Glow x={star.x} y={star.y} r={110} color={SP.blue} opacity={0.6 * (1 - prog(frame, ghost, ghost + 10) * 0.6)} />
          <circle cx={star.x} cy={star.y} r={18} fill="#E6F0FF" opacity={1 - prog(frame, ghost, ghost + 10) * 0.6} />
          {[-1, 1].map((s) => (
            <path key={s} d={ray(s as -1 | 1)} stroke={SP.blue} strokeWidth={6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={0.9} />
          ))}
          <Hole x={bh.x} y={bh.y} r={90} t={t} disk={0.3} />
          {/* where the eye thinks the light came from: two images, and a ring */}
          {[-1, 1].map((s) => (
            <g key={s} opacity={prog(frame, ghost, ghost + 12)}>
              <Glow x={s * 220} y={bh.y - 40} r={70} color={SP.blue} opacity={0.7} />
              <circle cx={s * 220} cy={bh.y - 40} r={14} fill="#E6F0FF" />
            </g>
          ))}
          <circle cx={bh.x} cy={bh.y} r={170} fill="none" stroke="#BFD8FF" strokeWidth={5} opacity={0.6 * prog(frame, name, name + 15)} />
          <Tag x={0} y={-700} text="GRAVITATIONAL LENSING" size={54} color={SP.blue} k={pop(frame, name)} />
          <Asteroid x={0} y={200} w={240} />
          <Stickman x={0} y={202} scale={S} facing={1} pose={{...idle(t), lookY: -1, headTilt: -10}} look={ASTRONAUT} expr="surprised" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** The astronaut floating on its side, feet toward +x. stretch 0 = normal, 1 = spaghetti. */
const SideFloat: React.FC<{x: number; y: number; t: number; stretch?: number; expr?: React.ComponentProps<typeof Stickman>["expr"]}> = ({x, y, t, stretch = 0, expr = "worried"}) => (
  <g transform={`translate(${x} ${y}) rotate(-90) scale(${1 - stretch * 0.55} ${1 + stretch * 1.6})`}>
    <Stickman x={0} y={0} scale={S} pose={{...float(t), shL: -150 + stretch * 140, shR: 150 - stretch * 140, elL: 0, elR: 0}} look={ASTRONAUT} expr={expr} />
  </g>
);

// ---------------------------------------------------------------- 10. Feet pulled harder than head
const S10Dekat: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 330, y: -200};
  const feet = cueAt(32, 9);
  const head = cueAt(33, 9);
  const drift = prog(frame, 0, len, eInOut);
  const fx = lerp(-40, 40, drift);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -100, 0.95], [60, -160, 1.08])} t={t} handheld={0.8} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={100} t={t} disk={0.7} />
          <SideFloat x={fx} y={bh.y + 10} t={t} />
          <Arrow x1={fx + 20} y1={bh.y + 10} x2={fx + 160} y2={bh.y + 10} color={C.red} w={22} opacity={prog(frame, feet, feet + 10)} />
          <Arrow x1={fx - 270} y1={bh.y - 70} x2={fx - 220} y2={bh.y - 70} color={SP.blue} w={10} opacity={prog(frame, head, head + 10)} />
          <Tag x={-60} y={-470} text="KAKI: TARIKAN KUAT" size={50} color={C.red} k={pop(frame, feet + 4)} />
          <Tag x={-60} y={60} text="KEPALA: LEBIH LEMAH" size={46} color={SP.blue} k={pop(frame, head + 4)} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 11. Spaghettification
const S11Spageti: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 360, y: -200};
  const name = cueAt(36, 10);
  const st = prog(frame, 6, cueAt(35, 10) + 20, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [60, -160, 1.08], [80, -180, 1.18])} t={t} handheld={1.4} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={100} t={t} disk={0.75} />
          <SideFloat x={lerp(40, 90, st)} y={bh.y + 10 + Math.sin(t * 9) * 3 * st} t={t} stretch={st} expr="surprised" />
          <Tag x={0} y={-450} text="SPAGHETTIFICATION" size={58} color={SP.hot} k={pop(frame, name)} />
          <Tag x={-40} y={40} text="KAYAK MI!" size={44} color={C.bone} k={pop(frame, cueAt(34, 10) + 30)} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 12. The mystery: what is at the centre?
const S12Misteri: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 0, y: -260};
  const q = cueAt(38, 11);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -100, 1.0], [0, -230, 1.5])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <Hole x={bh.x} y={bh.y} r={150} t={t * 0.6} disk={0.8} glow={0.6} />
          <g opacity={prog(frame, q + 4, q + 24)} transform={`translate(${bh.x} ${bh.y + 40}) scale(${0.9 + 0.08 * Math.sin(t * 2)})`}>
            <Label x={0} y={0} text="?" size={190} color={SP.hotter} />
          </g>
          <g transform="translate(-200 -500) rotate(-20)">
            <Stickman x={0} y={0} scale={0.6} pose={{...float(t), lookY: 0.6, look: 0.6}} look={ASTRONAUT} expr="worried" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** One puzzle piece (a card with a tab or a slot) with a label. */
const Piece: React.FC<{x: number; y: number; text: string; color: string; tab: boolean}> = ({x, y, text, color, tab}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d={tab
        ? "M -170 -70 L 170 -70 L 170 -22 A 26 26 0 0 1 170 22 L 170 70 L -170 70 Z"
        : "M -170 -70 L 170 -70 L 170 70 L -170 70 L -170 22 A 26 26 0 0 0 -170 -22 Z"}
      fill={color}
      stroke={C.ink}
      strokeWidth={5}
    />
    <Label x={tab ? -8 : 8} y={14} text={text} size={38} color={C.ink} />
  </g>
);

// ---------------------------------------------------------------- 13. The singularity, and theories that do not fit
const S13Singularitas: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bh = {x: 0, y: -380};
  const sing = cueAt(40, 12);
  const theory = cueAt(41, 12);
  const fail = cueAt(42, 12);
  const meet = prog(frame, theory, theory + 24, eOut);
  const bounce = prog(frame, fail + 6, fail + 20, eOut);
  const gap = lerp(260, 14, meet) + bounce * 50;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -120, 1.0], [0, -120, 1.06])} t={t} background={SP.void}>
        <Space t={t} />
        <Layer depth={1}>
          <HorizonRing x={bh.x} y={bh.y} r={170} t={t} />
          <circle cx={bh.x} cy={bh.y} r={166} fill="#000" opacity={0.85} />
          <g opacity={prog(frame, sing, sing + 10)}>
            <Glow x={bh.x} y={bh.y} r={90 + Math.sin(t * 6) * 8} color={SP.hotter} opacity={0.9} />
            <circle cx={bh.x} cy={bh.y} r={7} fill="#FFFFFF" />
          </g>
          <Tag x={0} y={-610} text="SINGULARITAS" size={66} color={SP.hotter} k={pop(frame, sing + 4)} />
          <g opacity={prog(frame, theory - 4, theory + 8)}>
            <Piece x={-170 - gap / 2} y={-120} text="RELATIVITAS" color={SP.blue} tab />
            <Piece x={170 + gap / 2} y={-120} text="KUANTUM" color={SP.hot} tab={false} />
          </g>
          <Tag x={80} y={40} text="BELUM COCOK" size={48} color={C.red} k={pop(frame, fail + 10)} />
          <OnRock x={-280} y={190} t={t} w={220} pose={frame > fail ? {...idle(t), shL: -70, elL: -80, shR: 70, elR: 80} : idle(t)} expr={frame > fail ? "worried" : "focused"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 14. Wide shot, fade, title
const S14Akhir: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const speechEnd = CUES[CUES.length - 1].to - BH_SCENES[13].from;
  const dark = prog(frame, speechEnd + 6, speechEnd + 36, eInOut);
  const text = prog(frame, speechEnd + 30, speechEnd + 56, eInOut);
  const rock = {x: -230, y: 210};
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{opacity: 1 - dark}}>
        <Camera2D cam={cam(frame, Math.max(1, speechEnd + 36), [-60, 40, 1.15], [0, -40, 0.82])} t={t} background={SP.void}>
          <Space t={t} />
          <Layer depth={1}>
            <Hole x={120} y={-300} r={120} t={t} disk={1} />
            <Asteroid x={rock.x} y={rock.y} w={300} />
            <Stickman anchor="hip" x={rock.x - 20} y={rock.y - 10 * S} scale={S} pose={{...sit(t), lookY: -0.4}} footL={{x: rock.x + 40, y: rock.y + 60}} footR={{x: rock.x + 54, y: rock.y + 62}} look={ASTRONAUT} expr="calm" />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", opacity: text, padding: "0 110px", flexDirection: "column"}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 120, color: SP.hotter, letterSpacing: 4}}>BLACK HOLE</div>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 48, lineHeight: 1.3, color: "#E9E7DF", textAlign: "center", marginTop: 24}}>
          Tempat di mana cahaya pun
          <br />
          tak bisa kabur.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENE_LIST = [S1Hook, S2Batas, S3Bintang, S4Runtuh, S5Lahir, S6BukanLubang, S7Horizon, S8Disk, S9Lensing, S10Dekat, S11Spageti, S12Misteri, S13Singularitas, S14Akhir];

// Zooms carry the camera deeper into space; fades for the calm and mysterious beats.
const TRANSITIONS: TransitionKind[] = ["zoom", "fade", "zoom", "cut", "fade", "zoom", "zoom", "fade", "zoom", "cut", "fade", "fade", "fade"];

export const BlackHole: React.FC<{narration?: string}> = ({narration}) => {
  const frame = useSceneFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <ScenesWithTransitions
        scenes={BH_SCENES}
        kinds={TRANSITIONS}
        background="#000"
        render={(i) => {
          const Scene = SCENE_LIST[i];
          return <Scene len={BH_SCENES[i].len} />;
        }}
      />
      <Vignette frame={frame} strength={0.6} />
      <CaptionTrack cues={CUES} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
