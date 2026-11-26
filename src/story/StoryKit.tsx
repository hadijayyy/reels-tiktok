import React from "react";
import {AbsoluteFill, getInputProps, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer, useCam} from "../camera/Camera2D";
import {FrameOverride, ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {ProbeCtx, probeStep, probing} from "./probe";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Label, Wall} from "../environment/Furniture";
import {SideChair} from "../environment/FamilyProps";
import {SpeechBubble} from "../environment/StoryProps";
import {clamp, eOut, keysObj, lerp, prog} from "../motion/ease";
import {idle, STRIDE, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Expr, Look, Pose, Stickman} from "../rig/Stickman";
import {C, FONT, FPS, H, W} from "../styles/palette";

/*
 * Story kit: the pieces every narrated film here kept re-writing, in one place.
 *
 *   <Film scenes cues kinds narration render>   scenes + captions + narration; every scene knows its own cues
 *   useScene()                                  { index, len, cueAt(j) }: cueAt(j) = local frame of phrase j of this scene
 *   <Shot>                                      a scene's camera, wall and floor; punches in a little on every phrase
 *   <Plate> <Bubble> <Actor>                    label plate, speech bubble, stickman; flagged in red when off the safe area
 *   pop(frame, at)                              0 -> 1 pop-in with a small overshoot
 *   stroll(frame, t, a, b, f0, f1, scale)       walks from x=a to x=b between frames f0..f1 without foot skate -> {x, pose, moving}
 *   <Gate k>                                    fades its children in (k 0..1): hides chart axes / frames that are empty before their data arrives
 *   slumped / bowing / laughing / tired / kneel poses, <Kneeling>, <Seated>, <MemoryBubble>, <Flash>, <EndCard>, SEPIA
 *
 * Check mode: render stills with --props='{"narration":null,"check":true}'. Any Plate, Bubble or Actor that
 * leaves the safe area (x 24..1056, y 240..1310 px, i.e. clear of the caption band) is outlined in red with
 * "LUAR AREA", so a quick look at the stills finds every clipped label and character.
 */

export const SEPIA = "sepia(0.75) saturate(0.8) brightness(0.92)";
export const SAFE = {x0: 24, x1: W - 24, y0: 240, y1: 1310};

/** Pops in with a small overshoot: 0 before `at`, 1 soon after. */
export const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/**
 * Walks from x=a to x=b between scene frames f0 and f1 (linear, so the feet do not skate) and idles otherwise.
 * Use the result as <Actor x={w.x} pose={w.pose} facing={b > a ? 1 : -1} />.
 */
export const stroll = (frame: number, t: number, a: number, b: number, f0: number, f1: number, scale: number, seed = 0) => {
  const k = prog(frame, f0, f1, (v) => v);
  const moving = k > 0 && k < 1;
  return {x: lerp(a, b, k), pose: moving ? walk((Math.abs(b - a) * k) / (STRIDE * scale), t, seed) : idle(t, seed), moving};
};

/** Fades its children in with k (0..1); renders nothing at 0. Use it for charts whose axes would show empty. */
export const Gate: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) => (k <= 0 ? null : <g opacity={Math.min(1, k)}>{children}</g>);

/* ---------- Film and per-scene timing ---------- */

type SceneSpan = {from: number; len: number};
type SceneInfo = {index: number; len: number; cueFrames: number[]};
const SceneCtx = React.createContext<SceneInfo>({index: 0, len: 0, cueFrames: []});

/** The current scene: its index, its length and cueAt(j), the scene-local frame where its phrase j starts. */
export const useScene = () => {
  const s = React.useContext(SceneCtx);
  return {...s, cueAt: (j: number) => s.cueFrames[Math.min(j, s.cueFrames.length - 1)] ?? 0};
};

const cueFramesOf = (s: SceneSpan, cues: CaptionCue[]) => cues.filter((c) => c.from >= s.from - 2 && c.from < s.from + s.len).map((c) => c.from - s.from);

/** Probe mode (see story/probe.ts): Remotion frame N evaluates scene N at many frames, drawing nothing. */
const ProbeFilm: React.FC<{scenes: SceneSpan[]; cues: CaptionCue[]; render: (i: number) => React.ReactNode}> = ({scenes, cues, render}) => {
  const i = useCurrentFrame();
  const s = scenes[i];
  if (!s) return null;
  const cueFrames = cueFramesOf(s, cues);
  const step = probeStep();
  const frames = new Set<number>();
  for (let f = 0; f < s.len; f += step) frames.add(f);
  frames.add(s.len - 1);
  for (const c of cueFrames) for (const d of [0, 12, 24]) if (c + d >= 0 && c + d < s.len) frames.add(c + d);
  return (
    <div style={{display: "none"}}>
      {[...frames].sort((a, b) => a - b).map((f) => (
        <FrameOverride.Provider key={f} value={f}>
          <ProbeCtx.Provider value={{scene: i, frame: s.from + f}}>
            <SceneCtx.Provider value={{index: i, len: s.len, cueFrames}}>{render(i)}</SceneCtx.Provider>
          </ProbeCtx.Provider>
        </FrameOverride.Provider>
      ))}
    </div>
  );
};

/** Scenes with transitions, word-synced captions and the narration. Cues are assigned to scenes by time. */
export const Film: React.FC<{scenes: SceneSpan[]; cues: CaptionCue[]; kinds: TransitionKind[]; narration?: string; render: (i: number) => React.ReactNode}> = ({scenes, cues, kinds, narration, render}) =>
  probing() ? <ProbeFilm scenes={scenes} cues={cues} render={render} /> : (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={scenes}
      kinds={kinds}
      render={(i) => {
        const s = scenes[i];
        const cueFrames = cueFramesOf(s, cues);
        return <SceneCtx.Provider value={{index: i, len: s.len, cueFrames}}>{render(i)}</SceneCtx.Provider>;
      }}
    />
    <CaptionTrack cues={cues} />
    <Narration file={narration} />
  </AbsoluteFill>
);

/* ---------- Camera ---------- */

export type ShotProps = {
  len: number;
  wall?: string;
  z0?: number;
  z1?: number;
  y0?: number;
  x0?: number;
  x1?: number;
  handheld?: number;
  filter?: string;
  grey?: number; // 0..1 drains colour (for "the fun is gone" moments)
  back?: React.ReactNode;
  floor?: boolean;
  /** Punch in on every phrase (default true): half of the zoom happens in small steps on the cues. */
  beats?: boolean;
  children: React.ReactNode;
};

/**
 * A scene's camera. The zoom goes from z0 to z1 over the scene; with beats on, half of it is spread
 * evenly over time and the other half lands in quick steps as each phrase starts, with a slight
 * sideways nudge, so something on screen moves whenever the narration moves on. The zoom never goes
 * past z1, so a layout checked at the end of the scene stays inside the frame throughout.
 */
export const Shot: React.FC<ShotProps> = ({len, wall = "#26303A", z0 = 1.0, z1 = 1.13, y0 = 120, x0 = 0, x1 = 0, handheld = 0, filter, grey = 0, back, floor = true, beats = true, children}) => {
  const frame = useSceneFrame();
  const {cueFrames} = useScene();
  const t = frame / FPS;
  const base = keysObj(frame, [
    [0, {x: x0, y: y0, zoom: z0, rot: 0}],
    [len, {x: x1, y: y0 - 20, zoom: z1, rot: 0}],
  ]);
  const hits = beats ? cueFrames.filter((f) => f > 6) : [];
  let cam = base;
  if (hits.length) {
    const p = clamp(frame / len);
    const steps = hits.map((f) => eOut(clamp((frame - f) / 7)));
    const done = steps.reduce((a, b) => a + b, 0) / hits.length;
    const nudge = steps.reduce((a, s, i) => a + s * (i % 2 ? -1 : 1), 0);
    cam = {...base, zoom: lerp(z0, z1, 0.5 * p + 0.5 * done), x: base.x + nudge * 10};
  }
  const filters = [filter, grey > 0 ? `saturate(${1 - grey * 0.8}) brightness(${1 - grey * 0.25})` : undefined].filter(Boolean).join(" ");
  return (
    <AbsoluteFill style={{filter: filters || undefined}}>
      <Camera2D cam={cam} t={t} handheld={handheld}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={wall} />
          {back}
        </Layer>
        <Layer depth={1}>
          {floor ? <Floor x0={-1400} x1={1400} /> : null}
          {children}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/* ---------- Safe-area check ---------- */

const checking = () => {
  try {
    return Boolean((getInputProps() as {check?: boolean}).check);
  } catch {
    return false;
  }
};

/**
 * In check mode, outlines a world-space box in red when it would land outside the safe area.
 * Assumes the action layer (depth 1) and ignores camera roll, which is tiny here.
 */
export const SafeCheck: React.FC<{x0: number; y0: number; x1: number; y1: number; name: string}> = ({x0, y0, x1, y1, name}) => {
  const {cam} = useCam();
  if (!checking()) return null;
  const sx = (x: number) => W / 2 + (x - cam.x) * cam.zoom;
  const sy = (y: number) => H / 2 + (y - cam.y) * cam.zoom;
  const out = sx(x0) < SAFE.x0 || sx(x1) > SAFE.x1 || sy(y0) < SAFE.y0 || sy(y1) > SAFE.y1;
  if (!out) return null;
  console.warn(`LUAR AREA: ${name}`);
  return (
    <g>
      <rect x={x0 - 6} y={y0 - 6} width={x1 - x0 + 12} height={y1 - y0 + 12} fill="none" stroke="#FF2D2D" strokeWidth={8} strokeDasharray="18 10" />
      <Label x={(x0 + x1) / 2} y={y0 - 16} text="LUAR AREA" size={34} color="#FF2D2D" />
    </g>
  );
};

/* ---------- Labels, bubbles, characters ---------- */

/**
 * A dark label plate with one line of text, centred on (x, y). k is its pop-in scale.
 * fit (default on): if the camera would put the plate above or beside the safe area, it is moved just
 * enough to stay inside (top titles under the phone's status bar were the most common miss).
 */
export const Plate: React.FC<{x: number; y: number; text: string; k: number; size?: number; color?: string; border?: string; w?: number; fit?: boolean}> = ({x: x0, y: y0, text, k, size = 44, color = C.bone, border = C.yellow, w, fit = true}) => {
  const {cam} = useCam();
  if (k <= 0) return null;
  const ww = w ?? text.length * size * 0.66 + size * 1.2;
  const hh = size * 1.7;
  let x = x0;
  let y = y0;
  if (fit) {
    const top = H / 2 + (y - size * 0.95 - cam.y) * cam.zoom;
    if (top < SAFE.y0 + 2) y += (SAFE.y0 + 2 - top) / cam.zoom;
    const left = W / 2 + (x - ww / 2 - cam.x) * cam.zoom;
    const right = W / 2 + (x + ww / 2 - cam.x) * cam.zoom;
    if (left < SAFE.x0 + 2) x += (SAFE.x0 + 2 - left) / cam.zoom;
    else if (right > SAFE.x1 - 2) x -= (right - SAFE.x1 + 2) / cam.zoom;
  }
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${k})`}>
        <rect x={-ww / 2} y={-size * 0.95} width={ww} height={hh} rx={size * 0.3} fill={C.charcoal} stroke={border} strokeWidth={6} />
        <Label x={0} y={size * 0.3} text={text} size={size} color={color} />
      </g>
      {k > 0.9 ? <SafeCheck x0={x - ww / 2} x1={x + ww / 2} y0={y - size * 0.95} y1={y - size * 0.95 + hh} name={`plate "${text}"`} /> : null}
    </g>
  );
};

/** A speech bubble (StoryProps.SpeechBubble) with the safe-area check. */
export const Bubble: React.FC<React.ComponentProps<typeof SpeechBubble>> = (p) => {
  const size = p.size ?? 40;
  const ww = p.w ?? Math.max(...p.lines.map((l) => l.length)) * size * 0.58 + size * 1.4;
  const hh = p.lines.length * size * 1.25 + size * 0.9;
  return (
    <g>
      <SpeechBubble {...p} />
      {p.k > 0.9 ? <SafeCheck x0={p.x - ww / 2} x1={p.x + ww / 2} y0={p.y - hh / 2} y1={p.y + hh / 2} name={`bubble "${p.lines.join(" ")}"`} /> : null}
    </g>
  );
};

/** A standing stickman (feet at x, y) with the safe-area check on its rough outline. */
export const Actor: React.FC<React.ComponentProps<typeof Stickman>> = (p) => {
  const s = p.scale ?? 1;
  return (
    <g>
      <Stickman {...p} />
      {p.anchor !== "hip" && (p.opacity ?? 1) > 0.5 ? <SafeCheck x0={p.x - 55 * s} x1={p.x + 55 * s} y0={p.y - 330 * s} y1={p.y} name="karakter" /> : null}
    </g>
  );
};

/* ---------- Poses ---------- */

export const slumped = (t: number, seed = 0): Pose => ({...idle(t, seed), lean: 12, headTilt: 18, shL: 4, shR: 8, elL: 4, elR: 4, lookY: 0.7});
export const bowing = (t: number): Pose => ({...idle(t), lean: 30, headTilt: 26, shL: 10, shR: 10, lookY: 0.8});
export const tired = (t: number): Pose => ({...idle(t), lean: 8, headTilt: 10, lookY: 0.4});
export const laughing = (t: number, seed = 0): Pose => ({...idle(t, seed), lean: -6 + Math.sin(t * 14 + seed) * 4, shL: -30, elL: 80, shR: 40, elR: 70, bob: -Math.abs(Math.sin(t * 12 + seed)) * 4});
export const kneel = (t: number): Pose => ({...idle(t), lean: 30, headTilt: 26, shL: 40, elL: 50, shR: 46, elR: 50, lookY: 0.8});

/**
 * A kneeling figure: pelvis low, both feet planted behind on the floor. (x, FLOOR) is under the knees.
 * (Bending the knees with the feet anchor pushes the body through the floor; anchoring the hip does not.)
 */
export const Kneeling: React.FC<{x: number; t: number; look: Look; scale?: number; expr?: Expr; facing?: 1 | -1}> = ({x, t, look, scale = 1.4, expr = "sad", facing = 1}) => (
  <Stickman x={x} y={FLOOR - 62 * scale} anchor="hip" scale={scale} facing={facing} pose={kneel(t)} look={look} expr={expr} footL={{x: x - facing * 70 * scale, y: FLOOR}} footR={{x: x - facing * 50 * scale, y: FLOOR}} />
);

/** A figure sitting on a side chair whose seat anchor is at cx. */
export const Seated: React.FC<{cx: number; f?: 1 | -1; t: number; look: Look; scale?: number; pose?: Partial<Pose>; expr?: Expr; chair?: boolean}> = ({cx, f = 1, t, look, scale = 1.35, pose = {}, expr = "neutral", chair = true}) => {
  const seat = seatedAnchor({x: cx, floorY: FLOOR, facing: f, seat: 87}, scale);
  return (
    <g>
      {chair ? <SideChair x={cx} y={FLOOR} facing={f} /> : null}
      <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={scale} facing={f} pose={{...idle(t), hipL: 88, kneeL: 88, hipR: 90, kneeR: 90, lean: 6, ...pose}} look={look} expr={expr} footL={seat.footL} footR={seat.footR} />
    </g>
  );
};

/* ---------- Memory, flash, end card ---------- */

let memoryId = 0;
/** A round sepia memory bubble centred on (x, y); children are drawn in bubble coordinates and clipped to it. */
export const MemoryBubble: React.FC<{x: number; y: number; r: number; k: number; tail?: boolean; children: React.ReactNode}> = ({x, y, r, k, tail = false, children}) => {
  const id = React.useMemo(() => `memory-${memoryId++}`, []);
  if (k <= 0) return null;
  return (
    <g opacity={k}>
      {tail ? (
        <g>
          <circle cx={x - r * 0.9} cy={y + r * 1.05} r={r * 0.07} fill={C.bone} />
          <circle cx={x - r * 0.7} cy={y + r * 0.85} r={r * 0.11} fill={C.bone} />
        </g>
      ) : null}
      <g style={{filter: SEPIA}}>
        <defs>
          <clipPath id={id}>
            <circle cx={x} cy={y} r={r - 4} />
          </clipPath>
        </defs>
        <circle cx={x} cy={y} r={r} fill="#4A4038" stroke={C.bone} strokeWidth={6} />
        <g clipPath={`url(#${id})`}>
          <g transform={`translate(${x} ${y})`}>{children}</g>
        </g>
      </g>
      <SafeCheck x0={x - r} x1={x + r} y0={y - r} y1={y + r} name="memory bubble" />
    </g>
  );
};

/** A white flash over the whole frame, peaking at each of the given scene-local frames. */
export const Flash: React.FC<{frame: number; at: number[]; strength?: number}> = ({frame, at, strength = 0.6}) => {
  const k = Math.max(0, ...at.map((p) => 1 - Math.abs(frame - p) / 5));
  return <AbsoluteFill style={{background: "#FFFFFF", opacity: k * strength, pointerEvents: "none"}} />;
};

/** Closing text over a darkened frame (for the tail after the last line). k 0..1 fades it in. */
export const EndCard: React.FC<{lines: string[]; k: number; accent?: number; dim?: number}> = ({lines, k, accent = -1, dim = 0.85}) => (
  <AbsoluteFill style={{background: `rgba(10,11,13,${dim * k})`, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40, padding: "0 90px 420px"}}>
    {lines.map((l, i) => (
      <div key={i} style={{fontFamily: FONT, fontWeight: 800, fontSize: 80, lineHeight: 1.15, color: i === accent ? C.yellow : C.bone, textAlign: "center", opacity: clamp(k * 1.5 - i * 0.4), transform: `translateY(${(1 - k) * 24}px)`}}>
        {l}
      </div>
    ))}
  </AbsoluteFill>
);
