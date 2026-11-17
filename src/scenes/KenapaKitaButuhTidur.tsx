import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Board, Desk, Floor, FLOOR, Glow, Label, Monitor, OfficeChair, Wall} from "../environment/Furniture";
import {Bed, Blanket, Brain, Gear, SkyWindow, Sleeper} from "../environment/SleepProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog, rand} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {cheer, idle, mix, point, typing} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Pt, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES as TIDUR_CUES, SCENES as TIDUR_SCENES} from "./tidurTiming";

/*
 * KENAPA KITA BUTUH TIDUR? — a six-scene stickman explainer (about 35 s).
 *   1. Hook      a third of your life is spent asleep
 *   2. Day       the working brain piles up waste
 *   3. Night     fluid washes the waste out while you sleep
 *   4. Memory    today's memories move to long-term storage
 *   5. No sleep  focus, mood and health suffer
 *   6. Outro     sleep is maintenance: get at least seven hours
 * Scene lengths and caption cues come from tidurTiming.ts, which scripts/make_narration.py
 * writes from the narration audio. Every scene below reads its length from there.
 */

export {FRAMES as TIDUR_FRAMES} from "./tidurTiming";

const SCALE = 1.5;
const NIGHT_WALL = "#1B2036";
const WASTE = C.orange;

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => TIDUR_CUES[cue].from - TIDUR_SCENES[scene].from;

/** Pops in with a small overshoot: 0 before `at`, 1 soon after. */
const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/** Waste specks at fixed spots inside a brain of radius r. */
const SPECKS = Array.from({length: 16}, (_, i) => {
  const a = rand(i * 3 + 1) * Math.PI * 2;
  const d = Math.sqrt(rand(i * 3 + 2)) * 0.62;
  return {x: Math.cos(a) * d * 1.1, y: Math.sin(a) * d * 0.72, s: 0.07 + rand(i * 3 + 3) * 0.05};
});

const Zzz: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.5 + i / 3) % 1;
      return (
        <Label key={i} x={x + ph * 70 + Math.sin(ph * 6) * 10} y={y - ph * 170} text="Z" size={30 + ph * 34} color={C.cyan} />
      );
    })}
  </g>
);

const BedWithSleeper: React.FC<{t: number}> = ({t}) => (
  <g>
    <Bed x0={-290} x1={300} top={FLOOR - 110} floor={FLOOR} />
    <Sleeper feetX={190} y={FLOOR - 110 - 40} scale={1.3} look={CASUAL} t={t} />
    <Blanket x0={-66} x1={240} top={FLOOR - 110} h={92} />
  </g>
);

/** Scene 1: asleep at night. "1/3" and a life bar that fills to a third. */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.08, rot: 0}],
    [len, {x: 0, y: 120, zoom: 1.2, rot: 0}],
  ]);
  const fill = prog(frame, 14, 50, eOut) / 3;
  const ask = cueAt(2, 0);
  const answer = ask + (TIDUR_CUES[2].to - TIDUR_CUES[2].from) * 0.45;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={NIGHT_WALL} />
          <SkyWindow x={250} y={-20} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={-150} y={200} r={380} color={C.cyan} opacity={0.1} />
          <BedWithSleeper t={t} />
          <Zzz x={-150} y={210} t={t} />
          <g opacity={prog(frame, 6, 18)}>
            <Label x={0} y={-360} text="1/3" size={170} color={C.yellow} />
            <rect x={-300} y={-320} width={600} height={34} rx={17} fill={C.charcoal} stroke={C.bone} strokeWidth={4} />
            <rect x={-296} y={-316} width={592 * fill} height={26} rx={13} fill={C.cyan} />
            <Label x={-300} y={-250} text="lahir" size={26} anchor="start" />
            <Label x={300} y={-250} text="tua" size={26} anchor="end" />
          </g>
          <g transform={`translate(330 -400) scale(${frame < answer ? pop(frame, ask) : 0})`}>
            <Label x={0} y={0} text="?" size={150} color={C.red} />
          </g>
          <g transform={`translate(330 -400) scale(${pop(frame, answer)})`}>
            <circle cx={0} cy={-50} r={64} fill={C.olive} stroke={C.ink} strokeWidth={5} />
            <path d="M -30 -50 L -8 -26 L 32 -76" fill="none" stroke={C.bone} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: a day at the desk. Waste specks pile up in the brain while the clock spins. */
const Day: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const chair = {x: -120, floorY: FLOOR, facing: 1 as const, seat: 87};
  const seat = seatedAnchor(chair, SCALE);
  const desk = {x: 90, w: 440, top: 150};
  const keyY = FLOOR - desk.top - 6;
  const keyL: Pt = {x: -30, y: keyY};
  const keyR: Pt = {x: 0, y: keyY};
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1, rot: 0}],
    [len, {x: -20, y: 20, zoom: 1.12, rot: 0}],
  ]);
  const pile = prog(frame, cueAt(4, 1) - 6, len - 16, (v) => v);
  const brain = {x: -90, y: -400, r: 170};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} />
          {/* wall clock: the hands race through the day */}
          <g transform="translate(330 -330)">
            <circle r={74} fill={C.bone} stroke={C.ink} strokeWidth={6} />
            <line x1={0} y1={0} x2={0} y2={-52} stroke={C.ink} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 300})`} />
            <line x1={0} y1={0} x2={0} y2={-34} stroke={C.ink} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 25})`} />
            <circle r={6} fill={C.red} />
          </g>
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <OfficeChair x={chair.x} y={chair.floorY} facing={chair.facing} seat={chair.seat} />
          <Desk x={desk.x} w={desk.w} top={desk.top} />
          <rect x={-60} y={keyY - 8} width={110} height={8} rx={2} fill={C.steel} stroke={C.ink} strokeWidth={2} />
          <Monitor
            x={150}
            y={FLOOR - desk.top - 38}
            screen={
              <g>
                {[0, 1, 2, 3, 4].map((i) => (
                  <rect key={i} x={14} y={16 + i * 24} width={60 + ((i * 53 + Math.floor(t * 6) * 31) % 130)} height={10} rx={3} fill={i % 2 ? C.yellow : C.cyan} opacity={0.85} />
                ))}
              </g>
            }
          />
          <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={SCALE} pose={typing(t)} look={CASUAL} expr="focused" footL={seat.footL} footR={seat.footR} reachL={keyL} reachR={keyR} />
          {/* thought-bubble trail up to the brain */}
          <circle cx={-110} cy={-170} r={12} fill={C.bone} opacity={0.8} />
          <circle cx={-100} cy={-210} r={18} fill={C.bone} opacity={0.8} />
          <g transform={`translate(${brain.x} ${brain.y}) scale(${1 + Math.sin(t * 5) * 0.012})`}>
            <Brain x={0} y={0} r={brain.r} />
            {SPECKS.map((s, i) => {
              const k = pop(frame, lerp(cueAt(4, 1) - 6, len - 16, i / SPECKS.length));
              return <circle key={i} cx={s.x * brain.r} cy={s.y * brain.r} r={s.s * brain.r * k} fill={WASTE} stroke={C.ink} strokeWidth={3} />;
            })}
          </g>
          <g opacity={prog(frame, cueAt(5, 1), cueAt(5, 1) + 8)}>
            <Label x={brain.x} y={brain.y - 200} text={`zat sisa: ${Math.round(pile * 100)}%`} size={40} color={WASTE} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: asleep. A wave of fluid crosses the brain and carries the waste away. */
const Wash: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1, rot: 0}],
    [len, {x: 0, y: 60, zoom: 1.1, rot: 0}],
  ]);
  const R = 250;
  const start = cueAt(7, 2);
  const sweep = prog(frame, start, len - 20, eInOut);
  const waveX = lerp(-R * 1.5, R * 1.5, sweep);
  const wave = Array.from({length: 13}, (_, i) => {
    const y = -R + (i * R) / 6;
    return `${waveX + Math.sin(y * 0.03 + t * 6) * 16} ${y}`;
  });
  const clean = prog(frame, len - 34, len - 14);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={NIGHT_WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <BedWithSleeper t={t} />
          <Zzz x={-250} y={230} t={t} />
          <circle cx={-150} cy={150} r={14} fill={C.bone} opacity={0.8} />
          <circle cx={-130} cy={90} r={22} fill={C.bone} opacity={0.8} />
          <Glow x={0} y={-300} r={520} color={C.cyan} opacity={0.1 + sweep * 0.14} />
          <Brain x={0} y={-300} r={R}>
            {/* the fluid behind the wave front */}
            <path d={`M ${-R * 1.6} ${-R} L ${wave.join(" L ")} L ${-R * 1.6} ${R} Z`} fill={C.cyan} opacity={0.42 * (1 - clean * 0.6)} />
            <path d={`M ${wave.join(" L ")}`} fill="none" stroke="#DFF6FF" strokeWidth={10} strokeLinecap="round" opacity={sweep > 0 && sweep < 1 ? 0.9 : 0} />
          </Brain>
          <g transform="translate(0 -300)">
            {SPECKS.map((s, i) => {
              const sx = s.x * R;
              const pushed = clamp((waveX - sx + 20) / 160);
              return (
                <circle key={i} cx={sx + pushed * 190} cy={s.y * R + Math.sin(t * 5 + i) * 6 * pushed} r={s.s * R * (1 - pushed)} fill={WASTE} stroke={C.ink} strokeWidth={3} opacity={1 - pushed} />
              );
            })}
            {/* sparkles once the brain is clean */}
            {[[-150, -120], [130, -150], [190, 60], [-200, 80]].map(([px, py], i) => (
              <path key={i} d="M 0 -22 L 6 -6 L 22 0 L 6 6 L 0 22 L -6 6 L -22 0 L -6 -6 Z" fill={C.bone} transform={`translate(${px} ${py}) scale(${clean * (1 + Math.sin(t * 7 + i) * 0.2)})`} />
            ))}
          </g>
          <g opacity={prog(frame, start, start + 10)}>
            <Label x={0} y={-640} text="cairan otak" size={44} color={C.cyan} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: memory cards move from "today" into long-term storage on a board. */
const Memory: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1, rot: 0}],
    [len, {x: -40, y: 40, zoom: 1.14, rot: 0}],
  ]);
  const first = cueAt(10, 3) - 4;
  const cards = [0, 1, 2, 3];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Board x={-110} y={FLOOR - 190} w={620} h={400}>
            <Label x={130} y={56} text="HARI INI" size={32} color={C.ink} />
            <Label x={490} y={56} text="JANGKA PANJANG" size={26} color={C.ink} />
            <rect x={30} y={80} width={200} height={290} rx={12} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" />
            {/* storage shelves */}
            <rect x={390} y={80} width={200} height={290} rx={8} fill="#D3CFC2" stroke={C.ink} strokeWidth={5} />
            {[0, 1, 2].map((i) => (
              <line key={i} x1={390} y1={150 + i * 72} x2={590} y2={150 + i * 72} stroke={C.ink} strokeWidth={5} />
            ))}
            <path d="M 256 225 L 356 225 M 332 201 L 358 225 L 332 249" fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            {cards.map((i) => {
              const k = prog(frame, first + i * 14, first + i * 14 + 24, eInOut);
              const from = {x: 60 + (i % 2) * 80, y: 110 + Math.floor(i / 2) * 120};
              const to = {x: 420, y: 92 + i * 72};
              const x = lerp(from.x, to.x, k);
              const y = lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 60;
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <rect width={lerp(64, 140, k)} height={lerp(84, 46, k)} rx={8} fill={[C.yellow, C.cyan, C.orange, "#8FBF7F"][i]} stroke={C.ink} strokeWidth={4} />
                  <line x1={12} y1={16} x2={lerp(50, 110, k)} y2={16} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
                  <line x1={12} y1={30} x2={lerp(40, 80, k)} y2={30} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
                </g>
              );
            })}
          </Board>
          <Stickman x={370} y={FLOOR} scale={SCALE} facing={-1} pose={point(idle(t), prog(frame, 6, 26, eOut), 105)} look={JACKET_BLUE} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: no sleep. A drained character and three warnings, one per phrase. */
const NoSleep: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.05, rot: 0}],
    [len, {x: 0, y: 120, zoom: 1.18, rot: 0}],
  ]);
  const droop = prog(frame, 0, 24, eOut);
  const sway = Math.sin(t * 1.4) * 3;
  const pose = mix(idle(t), {...idle(t), lean: 16 + sway, headTilt: 18, shL: 4, shR: 10, elL: 2, elR: 2, hipL: -4, hipR: 4, kneeL: 10, kneeR: 10, lookY: 0.7}, droop);
  const warnings = ["FOKUS BUYAR", "EMOSI MELEDAK", "GAMPANG SAKIT"];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={1.6}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={60} r={560} color={C.red} opacity={0.16 + Math.sin(t * 4) * 0.04} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={pose} look={CASUAL} expr="sad" />
          {warnings.map((text, i) => {
            const k = pop(frame, cueAt(13 + i, 4));
            return (
              <g key={text} transform={`translate(${[-150, 150, 0][i]} ${-470 + i * 120}) rotate(${[-4, 3, -2][i]}) scale(${k})`}>
                <rect x={-215} y={-48} width={430} height={96} rx={16} fill={C.charcoal} stroke={C.red} strokeWidth={6} />
                <Label x={0} y={16} text={text} size={44} color={C.bone} />
              </g>
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: morning. Sleep is maintenance, then the call to action. */
const Outro: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const service = cueAt(17, 5);
  const cta = cueAt(18, 5);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.05, rot: 0}],
    [cta, {x: 0, y: 100, zoom: 1.12, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.16, rot: 0}],
  ]);
  const day = prog(frame, 0, 40);
  const up = prog(frame, cta, cta + 12, eOut);
  const icon = pop(frame, service) * (1 - prog(frame, cta - 8, cta));
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={day > 0.5 ? "#2B3040" : NIGHT_WALL} />
          <SkyWindow x={290} y={-60} day={day} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={200} y={-100} r={620} color={C.yellow} opacity={0.14 * day} />
          <Stickman x={-60} y={FLOOR} scale={SCALE} pose={mix(idle(t), cheer(t), up)} look={CASUAL} expr="happy" />
          <g transform={`translate(-60 -330) scale(${icon})`}>
            <Brain x={-70} y={0} r={130} />
            <Gear x={110} y={40} r={54} angle={t * 120} color={C.yellow} />
            <Gear x={176} y={-44} r={34} angle={-t * 190 + 20} />
          </g>
          <g transform={`translate(0 -400) scale(${pop(frame, cta)})`}>
            <rect x={-330} y={-150} width={660} height={270} rx={28} fill={C.charcoal} stroke={C.yellow} strokeWidth={8} />
            <Label x={0} y={-40} text="TIDUR MINIMAL" size={56} color={C.bone} />
            <Label x={0} y={70} text="7 JAM" size={120} color={C.yellow} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Day, Wash, Memory, NoSleep, Outro];

// Camera transition at each cut: Hook>Day, Day>Wash, Wash>Memory, Memory>NoSleep, NoSleep>Outro.
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "whip"];

export const KenapaKitaButuhTidur: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={TIDUR_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={TIDUR_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={TIDUR_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
