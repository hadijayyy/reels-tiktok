import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Cone, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Coin, Tick} from "../environment/MoneyProps";
import {Gear} from "../environment/SleepProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, mix, point} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES as P_CUES, SCENES as P_SCENES} from "./pintarTiming";

/*
 * PINTAR SAJA TIDAK CUKUP — a six-scene stickman explainer (about 35 s).
 *   1. Hook      the smartest person in the room is not necessarily the most successful
 *   2. Modal     smart is only capital: IQ, grades, degrees
 *   3. Missing   but no risk, no communication, no selling ideas
 *   4. Rank      the ordinary guy wins; the real world has no ranking
 *   5. Value     the world rewards value, solving problems, trust
 *   6. Outro     don't just be smart: be useful
 * Scene lengths and caption cues come from pintarTiming.ts (written by scripts/make_narration.py).
 */

export {FRAMES as PINTAR_FRAMES} from "./pintarTiming";

const SCALE = 1.5;
const WALL = "#22262E";
const GENIUS = JACKET_BLUE;
const BIASA = SHIRT_ORANGE;

const cueAt = (cue: number, scene: number) => P_CUES[cue].from - P_SCENES[scene].from;

const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/** Stack of books, `n` of them (fractional n pops the last one in). */
const Books: React.FC<{x: number; n: number}> = ({x, n}) => {
  const cols = [C.orange, C.cyan, C.yellow, "#8FBF7F", C.red, C.plum];
  return (
    <g>
      {Array.from({length: 6}, (_, i) => {
        const k = clamp(n - i);
        if (k <= 0) return null;
        const w = 150 - (i % 3) * 14;
        return (
          <g key={i} transform={`translate(${x + ((i * 17) % 22) - 10} ${FLOOR - 34 - i * 34 - (1 - k) * 80})`} opacity={k}>
            <rect x={-w / 2} y={-17} width={w} height={34} rx={5} fill={cols[i]} stroke={C.ink} strokeWidth={4} />
            <line x1={-w / 2 + 14} y1={-17} x2={-w / 2 + 14} y2={17} stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

const Crowd: React.FC<{xs: number[]; t: number; scale?: number; opacity?: number}> = ({xs, t, scale = 1.1, opacity = 1}) => (
  <g opacity={opacity}>
    {xs.map((x, i) => (
      <Stickman key={i} x={x} y={FLOOR} scale={scale} pose={idle(t, i + 2)} look={{...CASUAL, top: ["#5A5F78", "#6B5A4E", "#4A5E6E", "#6E5A68"][i % 4]}} expr="neutral" />
    ))}
  </g>
);

const LightBulb: React.FC<{x: number; y: number; s: number; glow: number}> = ({x, y, s, glow}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={90} fill={C.yellow} opacity={0.18 * glow} />
    <path d="M -26 40 C -62 8 -50 -52 0 -56 C 50 -52 62 8 26 40 Z" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-22} y={40} width={44} height={14} rx={3} fill={C.steel} stroke={C.ink} strokeWidth={4} />
    <rect x={-16} y={54} width={32} height={10} rx={3} fill={C.steel} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** Scene 1: a crowd in a room, a spotlight on the smartest one, then the question mark. */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.16, rot: 0}],
  ]);
  const spot = prog(frame, 6, 24);
  const q = cueAt(1, 0);
  const ans = cueAt(2, 0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Crowd xs={[-440, -300, 300, 440]} t={t} opacity={0.75} />
          <Cone x={0} y={-520} len={940} spread={46} color={C.bone} opacity={0.22 * spot} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={mix(idle(t), point(idle(t), 1, 150), 0)} look={GENIUS} expr="smug" />
          <g opacity={prog(frame, 10, 24)} transform="translate(0 -440)">
            <rect x={-250} y={-48} width={500} height={86} rx={18} fill={C.charcoal} stroke={C.yellow} strokeWidth={6} />
            <Label x={0} y={14} text="PALING PINTAR" size={52} color={C.yellow} />
          </g>
          <g transform={`translate(0 -250) scale(${pop(frame, q) * (1 - prog(frame, ans, ans + 6))})`}>
            <Label x={0} y={0} text="SUKSES?" size={96} color={C.red} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: smart is just capital: IQ, grades and degrees pile up next to the genius. */
const Modal: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 110, zoom: 1.0, rot: 0}],
    [len, {x: 30, y: 80, zoom: 1.14, rot: 0}],
  ]);
  const iq = cueAt(4, 1);
  const grades = cueAt(5, 1);
  const books = prog(frame, grades, len - 14, (v) => v) * 6;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={-100} y={100} r={520} color={C.yellow} opacity={0.1} />
          <Stickman x={-170} y={FLOOR} scale={SCALE} pose={idle(t)} look={GENIUS} expr="smug" />
          <Books x={250} n={books} />
          {/* the key word, first */}
          <g transform={`translate(0 -520) scale(${pop(frame, 4)})`}>
            <rect x={-300} y={-90} width={600} height={190} rx={24} fill={C.charcoal} stroke={C.yellow} strokeWidth={8} />
            <Label x={0} y={-20} text="PINTAR =" size={54} color={C.bone} />
            <Label x={0} y={56} text="MODAL" size={68} color={C.yellow} />
          </g>
          <g transform={`translate(-170 -360) scale(${pop(frame, iq)})`}>
            <rect x={-130} y={-44} width={260} height={84} rx={16} fill={C.cyan} stroke={C.ink} strokeWidth={5} />
            <Label x={0} y={18} text="IQ TINGGI" size={42} color={C.ink} />
          </g>
          <g transform={`translate(230 ${FLOOR - 34 - 6 * 34 - 90}) scale(${pop(frame, grades + 20)})`}>
            <rect x={-120} y={-40} width={240} height={76} rx={14} fill={C.bone} stroke={C.ink} strokeWidth={5} />
            <Label x={0} y={14} text="NILAI A+" size={40} color={C.red} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: the three things a smart head can still be missing. */
const Missing: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.04, rot: 0}],
    [len, {x: 0, y: 120, zoom: 1.18, rot: 0}],
  ]);
  const items = ["BERANI RISIKO", "BISA KOMUNIKASI", "BISA JUAL IDE"];
  const droop = prog(frame, 0, 30, eOut);
  const base = idle(t);
  const pose = mix(base, {...base, lean: 12, headTilt: 14, shL: 4, shR: 8, lookY: 0.6}, droop);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={1.2}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={60} r={560} color={C.red} opacity={0.12} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={pose} look={GENIUS} expr="worried" />
          {items.map((text, i) => {
            const k = pop(frame, cueAt(6 + i, 2));
            const x = [-100, 100, -40][i];
            const y = -450 + i * 125;
            return (
              <g key={text} transform={`translate(${x} ${y}) rotate(${[-3, 3, -2][i]}) scale(${k})`}>
                <rect x={-250} y={-52} width={500} height={104} rx={18} fill={C.charcoal} stroke={C.bone} strokeWidth={5} />
                <Label x={0} y={16} text={text} size={44} color={C.bone} />
                <g transform="translate(250 -52)">
                  <circle r={30} fill={C.red} stroke={C.ink} strokeWidth={4} />
                  <path d="M -12 -12 L 12 12 M 12 -12 L -12 12" stroke={C.bone} strokeWidth={8} strokeLinecap="round" />
                </g>
              </g>
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: the ordinary guy tops the podium, then the ranking itself is crossed out. */
const Rank: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 110, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 90, zoom: 1.14, rot: 0}],
  ]);
  const win = cueAt(10, 3);
  const none = cueAt(11, 3);
  const blocks = [
    {x: -250, h: 110, n: "2"},
    {x: 0, h: 170, n: "1"},
    {x: 250, h: 70, n: "3"},
  ];
  const lift = prog(frame, 6, 30, eOut);
  const fade = 1 - prog(frame, none, none + 18) * 0.65;
  const slash = prog(frame, none + 6, none + 22, eOut);
  const cheerK = prog(frame, win - 6, win + 10);
  const sag = idle(t);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={500} color={C.yellow} opacity={0.12 * cheerK} />
          <g opacity={fade}>
            {blocks.map((b) => (
              <g key={b.n}>
                <rect x={b.x - 110} y={FLOOR - b.h} width={220} height={b.h} fill={C.steel} stroke={C.ink} strokeWidth={5} />
                <Label x={b.x} y={FLOOR - b.h / 2 + 22} text={b.n} size={64} color={C.bone} />
              </g>
            ))}
            <Stickman x={-250} y={FLOOR - 110} scale={1.2} pose={idle(t, 4)} look={{...CASUAL, top: "#5A5F78"}} expr="neutral" />
            <Stickman x={0} y={FLOOR - 170} scale={1.3} pose={mix(idle(t, 2), cheer(t), cheerK)} look={BIASA} expr="happy" opacity={lift} />
            <Stickman x={250} y={FLOOR - 70} scale={1.3} pose={mix(sag, {...sag, lean: 14, headTilt: 16, shL: 4, shR: 8}, 1)} look={GENIUS} expr="sad" />
            <g transform={`translate(250 ${FLOOR - 70 - 420}) scale(${pop(frame, 14)})`}>
              <Label x={0} y={0} text="PINTAR" size={44} color={C.cyan} />
            </g>
            <g transform={`translate(0 ${FLOOR - 170 - 560}) scale(${pop(frame, 14)})`}>
              <Label x={0} y={0} text="BIASA AJA" size={44} color={C.orange} />
            </g>
          </g>
          {/* the ranking is crossed out */}
          <g transform={`translate(0 ${-470}) scale(${pop(frame, none)})`}>
            <rect x={-300} y={-62} width={600} height={124} rx={22} fill={C.charcoal} stroke={C.bone} strokeWidth={6} />
            <Label x={0} y={26} text="RANKING" size={84} color={C.bone} />
            <line x1={-290} y1={-4} x2={lerp(-290, 290, slash)} y2={lerp(-4, 4, slash)} stroke={C.red} strokeWidth={14} strokeLinecap="round" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: what the world pays for: value (coins), solved problems (ticks), trust (a crowd). */
const Value: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 110, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 90, zoom: 1.14, rot: 0}],
  ]);
  const vC = cueAt(13, 4);
  const sC = cueAt(14, 4);
  const tC = cueAt(15, 4);
  const cheerK = prog(frame, vC, vC + 14);
  const coins = Array.from({length: 9}, (_, i) => i);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Cone x={0} y={-520} len={940} spread={50} color={C.yellow} opacity={0.2} />
          {/* value: coins rain in */}
          {coins.map((i) => {
            const k = clamp((frame - vC - i * 4) / 26);
            if (k <= 0) return null;
            const x = -170 + ((i * 97) % 340);
            const y = lerp(-500, -230 + (i % 3) * 40, eOut(k));
            return <Coin key={i} x={x} y={y} r={26} spin={t * 6 + i} opacity={Math.min(1, k * 3)} />;
          })}
          <g transform={`translate(0 -560) scale(${pop(frame, vC)})`}>
            <Label x={0} y={0} text="VALUE" size={64} color={C.yellow} />
          </g>
          {/* trust: a small crowd cheering him on */}
          <g opacity={prog(frame, tC, tC + 10)}>
            <Crowd xs={[-440, 440]} t={t} scale={1.1} />
            {[-440, 440].map((x, i) => (
              <Tick key={i} x={x} y={FLOOR - 330} r={30} k={pop(frame, tC + 6 + i * 6)} />
            ))}
          </g>
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={mix(idle(t), cheer(t), cheerK * 0.8)} look={BIASA} expr="happy" />
          {/* solved problems */}
          <g transform={`translate(-200 -130) scale(${pop(frame, sC)})`}>
            <rect x={-150} y={-44} width={300} height={88} rx={16} fill={C.charcoal} stroke={C.bone} strokeWidth={5} />
            <Label x={-30} y={14} text="MASALAH" size={40} color={C.bone} />
            <Tick x={104} y={0} r={28} k={prog(frame, sC + 8, sC + 20)} />
          </g>
          <g transform={`translate(200 -130) scale(${pop(frame, tC)})`}>
            <rect x={-150} y={-44} width={300} height={88} rx={16} fill={C.charcoal} stroke={C.bone} strokeWidth={5} />
            <Label x={0} y={14} text="PERCAYA" size={40} color={C.bone} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: the bulb (smart) turns into a gear (useful). */
const Outro: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const smart = cueAt(16, 5);
  const useful = cueAt(17, 5);
  const swap = prog(frame, useful - 4, useful + 12, eInOut);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.05, rot: 0}],
    [useful, {x: 0, y: 100, zoom: 1.1, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.18, rot: 0}],
  ]);
  const up = prog(frame, useful, useful + 12, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={560} color={C.yellow} opacity={0.08 + 0.12 * swap} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={mix(idle(t), cheer(t), up)} look={{...GENIUS, top: "#4E6B5A"}} expr={up > 0.5 ? "happy" : "determined"} />
          <g opacity={1 - swap} transform={`translate(0 -250) scale(${pop(frame, 4) * (1 - swap * 0.4)})`}>
            <LightBulb x={0} y={0} s={1.5} glow={1 - swap} />
          </g>
          <g opacity={swap} transform={`translate(0 -250) scale(${swap})`}>
            <Gear x={-40} y={10} r={64} angle={t * 100} color={C.yellow} />
            <Gear x={70} y={-60} r={40} angle={-t * 160 + 20} color={C.cyan} />
          </g>
          <g transform={`translate(0 -510) scale(${pop(frame, smart)})`}>
            <Label x={0} y={0} text="PINTAR" size={92} color={swap > 0.2 ? C.steel : C.cyan} />
            <line x1={-180} y1={-30} x2={lerp(-180, 180, prog(frame, useful - 6, useful + 10, eOut))} y2={-30} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
          </g>
          <g transform={`translate(0 -400) scale(${pop(frame, useful)})`}>
            <Label x={0} y={0} text="BERGUNA" size={110} color={C.yellow} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Modal, Missing, Rank, Value, Outro];

// Cuts: Hook>Modal, Modal>Missing, Missing>Rank, Rank>Value, Value>Outro.
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "whip"];

export const PintarSaja: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={P_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={P_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={P_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
