import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Flame, Hut, Rhino, Sapling, Smoke, Tree} from "../environment/BaduyProps";
import {Tick} from "../environment/MoneyProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {idle, mix, point} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES as B_CUES, SCENES as B_SCENES} from "./baduyTiming";

/*
 * BADUY, API DAN BADAK — a nine-scene stickman news explainer (about 50 s).
 *   1. Hook      19 houses burn in Baduy; another issue makes people speak up
 *   2. Fire      Thursday night, 19 Nov 2026, Kampung Cipaler, Desa Kanekes
 *   3. Toll      19 houses, 34 families, no deaths
 *   4. Rhino     12 Nov: idea to move Javan rhinos from Ujung Kulon to Alas Purwo
 *   5. Refusal   16 Nov: Baduy ask the rhinos to stay in their habitat
 *   6. Ancestors protecting nature is an ancestral mandate
 *   7. Not linked the two events are not connected...
 *   8. Duty      ...but nature under threat needs people to protect it
 *   9. Question  have we really done it?
 * Scene lengths and caption cues come from baduyTiming.ts (written by scripts/make_narration.py).
 */

export {FRAMES as BADUY_FRAMES} from "./baduyTiming";

const SCALE = 1.5;
const NIGHT = "#10141F";
const DAY_WALL = "#2A3340";

const BADUY: Look = {
  top: "#1E2230",
  sleeve: "#1E2230",
  trousers: "#1E2230",
  headExtra: (
    <g>
      <path d="M -36 -4 A 36 36 0 0 1 36 -4 Q 0 -22 -36 -4 Z" fill="#14100E" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M -37 -10 Q 0 -26 37 -10 L 37 0 Q 0 -16 -37 0 Z" fill="#2B3A67" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </g>
  ),
};
const BADUY_PUTIH: Look = {...BADUY, top: "#E9E7DF", sleeve: "#E9E7DF", trousers: "#D8D3C4"};
const OFFICIAL: Look = {...JACKET_BLUE, coat: "#33475B"};

const cueAt = (cue: number, scene: number) => B_CUES[cue].from - B_SCENES[scene].from;

const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/** A dark plate with a line of text, centred on (x, y). */
const Plate: React.FC<{x: number; y: number; text: string; k: number; w?: number; size?: number; color?: string; border?: string; rot?: number}> = ({x, y, text, k, w = 520, size = 52, color = C.bone, border = C.yellow, rot = 0}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.7} rx={size * 0.3} fill={C.charcoal} stroke={border} strokeWidth={6} />
      <Label x={0} y={size * 0.3} text={text} size={size} color={color} />
    </g>
  );

const Night: React.FC<{glow?: number; t?: number}> = ({glow = 0}) => (
  <Layer depth={0.5}>
    <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={NIGHT} />
    {glow > 0 ? <Glow x={0} y={150} r={900} color={C.orange} opacity={0.22 * glow} /> : null}
  </Layer>
);

/** Scene 1: a row of huts catches fire, one after another. */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 140, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 120, zoom: 1.14, rot: 0}],
  ]);
  const other = cueAt(2, 0);
  const xs = [-400, -140, 140, 400];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={0.8}>
        <Night glow={prog(frame, 6, 40)} />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {xs.map((x, i) => (
            <Hut key={i} x={x} y={FLOOR} s={1.15} fire={prog(frame, 6 + i * 9, 30 + i * 9, eOut)} t={t} seed={i * 5} />
          ))}
          <Stickman x={0} y={FLOOR} scale={1.3} pose={idle(t)} look={BADUY} expr="worried" />
          <Plate x={0} y={-470} text="19 RUMAH TERBAKAR" k={pop(frame, 4)} w={640} size={50} border={C.orange} />
          <g opacity={prog(frame, other, other + 12)}>
            <Plate x={0} y={-330} text="ADA ISU LAIN" k={pop(frame, other)} w={520} size={52} border={C.cyan} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: the date, then a close-up of the burning kampung. */
const Fire: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 130, zoom: 1.0, rot: 0}],
    [len, {x: 60, y: 110, zoom: 1.16, rot: 0}],
  ]);
  const day = cueAt(4, 1);
  const place = cueAt(5, 1);
  const burn = prog(frame, place - 4, len - 10, (v) => v);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={0.8}>
        <Night glow={0.4 + burn * 0.6} />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Hut x={-240} y={FLOOR} s={1.4} fire={clamp(burn * 1.3)} t={t} seed={1} />
          <Hut x={230} y={FLOOR} s={1.4} fire={clamp(burn * 1.1 - 0.1)} t={t} seed={7} />
          <Smoke x={-240} y={FLOOR - 340} t={t} opacity={0.5 * burn} />
          <Stickman x={0} y={FLOOR} scale={1.4} facing={-1} pose={point(idle(t), prog(frame, place, place + 14, eOut), 100)} look={BADUY_PUTIH} expr="surprised" />
          <Plate x={0} y={-500} text="KAMIS MALAM" k={pop(frame, 4)} w={560} size={48} border={C.cyan} />
          <Plate x={0} y={-380} text="19 NOV 2026" k={pop(frame, day)} w={560} size={56} border={C.yellow} />
          <Plate x={0} y={-260} text="KAMPUNG CIPALER" k={pop(frame, place)} w={640} size={46} border={C.orange} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: burnt huts, a family standing together, and the toll. */
const Toll: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 130, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 110, zoom: 1.14, rot: 0}],
  ]);
  const a = cueAt(6, 2);
  const b = cueAt(7, 2);
  const c = cueAt(8, 2);
  const char = prog(frame, 0, 40);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={NIGHT} />
          <Glow x={0} y={200} r={800} color={C.orange} opacity={0.14 * (1 - char * 0.5)} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {[-400, -140, 140, 400].map((x, i) => (
            <Hut key={i} x={x} y={FLOOR} s={1.0} fire={clamp(1 - char * 1.6) * 0.8} char={char} t={t} seed={i} />
          ))}
          <Smoke x={-140} y={FLOOR - 200} t={t} opacity={0.35} />
          <Smoke x={260} y={FLOOR - 200} t={t + 0.4} opacity={0.3} />
          <Stickman x={-70} y={FLOOR} scale={1.4} pose={idle(t)} look={BADUY} expr="sad" />
          <Stickman x={60} y={FLOOR} scale={1.4} pose={idle(t, 3)} look={{...BADUY_PUTIH, top: "#6B4E5E", sleeve: "#6B4E5E"}} expr="sad" />
          <Stickman x={170} y={FLOOR} scale={0.95} pose={idle(t, 5)} look={BADUY} expr="sad" />
          <Plate x={0} y={-540} text="19 RUMAH HANGUS" k={pop(frame, a)} w={620} size={46} border={C.orange} />
          <Plate x={0} y={-420} text="34 KELUARGA TERDAMPAK" k={pop(frame, b)} w={740} size={44} border={C.yellow} />
          <g transform={`translate(0 -300) scale(${pop(frame, c)})`}>
            <rect x={-300} y={-48} width={600} height={90} rx={18} fill={C.charcoal} stroke={C.olive} strokeWidth={6} />
            <Label x={20} y={14} text="0 KORBAN JIWA" size={46} color={C.bone} />
            <Tick x={-230} y={-2} r={30} k={prog(frame, c + 6, c + 18)} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: a map with two islands; a rhino is "moved" from Ujung Kulon to Alas Purwo. */
const MapMove: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 110, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const date = cueAt(10, 3);
  const idea = cueAt(11, 3);
  const move = cueAt(12, 3);
  const k = prog(frame, move + 6, move + 50, eInOut);
  const from = {x: -290, y: -250};
  const to = {x: 290, y: -250};
  const rx = lerp(from.x, to.x, k);
  const ry = lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 190;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={DAY_WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <g transform="translate(0 -230)">
            <rect x={-460} y={-250} width={920} height={500} rx={30} fill="#1B3A52" stroke={C.ink} strokeWidth={6} />
            <path d="M -420 10 Q -330 -90 -200 -60 Q -120 -10 -170 80 Q -300 120 -420 80 Z" fill="#4E7A4A" stroke={C.ink} strokeWidth={4} />
            <path d="M 180 -70 Q 300 -150 420 -60 Q 440 40 340 90 Q 230 110 170 40 Z" fill="#4E7A4A" stroke={C.ink} strokeWidth={4} />
            <Label x={-300} y={150} text="UJUNG KULON" size={34} color={C.bone} />
            <Label x={300} y={150} text="ALAS PURWO" size={34} color={C.bone} />
            <path d={`M ${from.x} ${from.y + 230 - 70} Q 0 ${from.y + 230 - 330} ${to.x} ${to.y + 230 - 70}`} fill="none" stroke={C.yellow} strokeWidth={6} strokeDasharray="16 14" opacity={prog(frame, move, move + 10)} />
          </g>
          <Rhino x={rx} y={ry + 8} s={0.55} opacity={prog(frame, idea, idea + 10)} />
          <Stickman x={-380} y={FLOOR} scale={1.3} pose={point(idle(t), prog(frame, idea, idea + 14, eOut), 70)} look={OFFICIAL} expr="neutral" />
          <Plate x={0} y={-560} text="12 NOV 2026" k={pop(frame, date)} w={560} size={54} border={C.yellow} />
          <Plate x={0} y={FLOOR - 80} text="WACANA PINDAH BADAK" k={pop(frame, idea) * 0} w={600} size={40} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: the Baduy say no; the rhino stays in its own habitat. */
const Refuse: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.14, rot: 0}],
  ]);
  const date = cueAt(14, 4);
  const group = cueAt(15, 4);
  const stay = cueAt(16, 4);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={DAY_WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Tree x={440} y={FLOOR} s={1.2} />
          <Tree x={170} y={FLOOR} s={0.9} shade={1} />
          <g opacity={prog(frame, stay, stay + 12)}>
            <circle cx={300} cy={FLOOR - 120} r={190} fill="#2F5236" opacity={0.35} stroke={C.olive} strokeWidth={6} strokeDasharray="18 12" />
          </g>
          <Rhino x={300} y={FLOOR} s={0.9} facing={-1} />
          <g transform={`translate(-300 ${FLOOR}) scale(${pop(frame, 2)})`}>
            <rect x={-8} y={-560} width={16} height={560} fill="#5A3E28" stroke={C.ink} strokeWidth={3} />
            <rect x={-170} y={-620} width={340} height={110} rx={10} fill={C.bone} stroke={C.ink} strokeWidth={5} />
            <Label x={0} y={-540} text="TOLAK" size={76} color={C.red} />
          </g>
          <Stickman x={-160} y={FLOOR} scale={1.4} pose={point(idle(t), 1, 150)} look={BADUY} expr="determined" />
          <g opacity={prog(frame, group, group + 10)}>
            <Stickman x={-420} y={FLOOR} scale={1.2} pose={idle(t, 4)} look={BADUY_PUTIH} expr="determined" />
            <Stickman x={-30} y={FLOOR} scale={1.2} pose={idle(t, 6)} look={BADUY} expr="determined" />
          </g>
          <Plate x={0} y={-480} text="16 NOV" k={pop(frame, date)} w={380} size={56} border={C.yellow} />
          <Plate x={300} y={-300} text="HABITAT ASLI" k={pop(frame, stay)} w={440} size={42} border={C.olive} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: forest, a Baduy elder, faint ancestors behind him. */
const Ancestors: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 130, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.16, rot: 0}],
  ]);
  const policy = cueAt(18, 5);
  const mandate = cueAt(19, 5);
  const anc = prog(frame, mandate, mandate + 24);
  const base = idle(t);
  const pose = {...base, shR: 40, elR: 120, lookY: -0.2};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color="#1D2A26" />
          <Glow x={0} y={0} r={700} color={C.yellow} opacity={0.1 + 0.1 * anc} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Tree x={-430} y={FLOOR} s={1.3} shade={1} />
          <Tree x={440} y={FLOOR} s={1.3} shade={1} />
          <Rhino x={300} y={FLOOR} s={0.6} facing={-1} opacity={0.9} />
          {[-190, 190].map((x, i) => (
            <g key={x} opacity={0.32 * anc}>
              <Stickman x={x} y={FLOOR - 20 - i * 10} scale={1.5} pose={idle(t, i + 8)} look={{...BADUY_PUTIH, top: C.cyan, sleeve: C.cyan, trousers: C.cyan}} expr="calm" />
            </g>
          ))}
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={pose} look={BADUY} expr="calm" />
          <g opacity={1 - prog(frame, mandate - 6, mandate)}>
            <Plate x={0} y={-500} text="KEBIJAKAN" k={pop(frame, policy)} w={480} size={50} border={C.steel} color={C.steel} />
            <line x1={-200} y1={-496} x2={lerp(-200, 200, prog(frame, policy + 6, policy + 22, eOut))} y2={-496} stroke={C.red} strokeWidth={10} strokeLinecap="round" />
          </g>
          <Plate x={0} y={-500} text="AMANAT LELUHUR" k={pop(frame, mandate)} w={680} size={54} border={C.yellow} color={C.yellow} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 7: two separate events: not connected, yet both about nature under threat. */
const NotLinked: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const two = cueAt(20, 6);
  const no = cueAt(21, 6);
  const but = cueAt(22, 6);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={DAY_WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <g transform={`translate(-250 -420) scale(${pop(frame, two)})`}>
            <rect x={-200} y={-140} width={400} height={300} rx={26} fill={C.charcoal} stroke={C.orange} strokeWidth={7} />
            <Flame x={0} y={50} s={1.5} t={t} seed={2} />
            <Label x={0} y={120} text="KEBAKARAN" size={40} color={C.bone} />
          </g>
          <g transform={`translate(250 -420) scale(${pop(frame, two + 4)})`}>
            <rect x={-200} y={-140} width={400} height={300} rx={26} fill={C.charcoal} stroke={C.cyan} strokeWidth={7} />
            <Rhino x={-10} y={64} s={0.8} />
            <Label x={0} y={120} text="WACANA BADAK" size={36} color={C.bone} />
          </g>
          <g transform={`translate(0 -420) scale(${pop(frame, no)})`}>
            <circle r={52} fill={C.red} stroke={C.ink} strokeWidth={5} />
            <Label x={0} y={30} text="≠" size={84} color={C.bone} />
          </g>
          <g opacity={prog(frame, but, but + 12)}>
            <path d="M -250 -250 L -250 -170 Q -250 -130 -200 -130 L 200 -130 Q 250 -130 250 -170 L 250 -250" fill="none" stroke={C.yellow} strokeWidth={7} strokeLinecap="round" strokeDasharray="14 12" />
          </g>
          <Plate x={0} y={-90} text="ALAM TERANCAM" k={pop(frame, but + 4)} w={600} size={50} border={C.yellow} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={mix(idle(t), {...idle(t), lookY: -0.5, headTilt: -6, shR: 60, elR: 130}, prog(frame, but, but + 14))} look={CASUAL} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 8: a threat cloud, and a person sheltering a sapling and a rhino. */
const Duty: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.14, rot: 0}],
  ]);
  const threat = cueAt(23, 7);
  const duty = cueAt(24, 7);
  const guard = cueAt(25, 7);
  const dome = prog(frame, duty, duty + 16, eOut);
  const hit = prog(frame, threat, threat + 12);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={DAY_WALL} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* storm cloud and rain */}
          <g opacity={hit}>
            <g fill="#3A4150" stroke={C.ink} strokeWidth={4}>
              <circle cx={-170} cy={-640} r={90} />
              <circle cx={-40} cy={-690} r={110} />
              <circle cx={110} cy={-650} r={95} />
              <circle cx={230} cy={-620} r={70} />
            </g>
            {Array.from({length: 14}, (_, i) => {
              const ph = (t * 1.4 + i * 0.17) % 1;
              return <line key={i} x1={-260 + i * 40} y1={-600 + ph * 760} x2={-270 + i * 40} y2={-570 + ph * 760} stroke={C.cyan} strokeWidth={5} strokeLinecap="round" opacity={0.7 * (1 - dome * (ph > 0.55 ? 1 : 0))} />;
            })}
            <path d="M 20 -590 L -20 -520 L 10 -520 L -30 -440" fill="none" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(t * 14) > 0.4 ? 1 : 0.2} />
          </g>
          <Rhino x={-250} y={FLOOR} s={0.6} />
          <Sapling x={250} y={FLOOR} k={1} s={1.2} />
          <Stickman x={0} y={FLOOR} scale={SCALE} pose={{...idle(t), shR: 150, elR: 10}} look={CASUAL} expr="determined" />
          {/* the umbrella */}
          <g opacity={dome} transform={`translate(10 ${FLOOR - 560 + (1 - dome) * 60})`}>
            <path d="M -380 0 Q 0 -300 380 0 Q 300 -50 190 0 Q 95 -50 0 0 Q -95 -50 -190 0 Q -300 -50 -380 0 Z" fill={C.yellow} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
            <line x1={0} y1={-6} x2={0} y2={300} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          </g>
          <Plate x={0} y={-350} text="ANCAMAN" k={pop(frame, threat) * (1 - prog(frame, duty, duty + 6))} w={420} size={46} border={C.red} />
          <Plate x={0} y={-330} text="TANGGUNG JAWAB" k={pop(frame, guard)} w={640} size={48} border={C.olive} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 9: the closing question. A sapling grows beside a thoughtful figure. */
const Question: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ask = cueAt(27, 8);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.04, rot: 0}],
    [len, {x: 0, y: 100, zoom: 1.18, rot: 0}],
  ]);
  const grow = prog(frame, 4, len - 20, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color="#141A22" />
          <Glow x={0} y={-100} r={700} color={C.yellow} opacity={0.08 + 0.08 * grow} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Sapling x={190} y={FLOOR} k={grow * 0.6 + 0.2} s={1.6} />
          <Stickman x={-80} y={FLOOR} scale={SCALE} pose={mix(idle(t), {...idle(t), lookY: 0.1, headTilt: 4}, 1)} look={CASUAL} expr="calm" />
          <g transform={`translate(0 -450) scale(${(pop(frame, 2) + pop(frame, ask) * 0.2) * (1 + Math.sin(t * 4) * 0.03)})`}>
            <Label x={0} y={0} text="?" size={260} color={C.yellow} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Fire, Toll, MapMove, Refuse, Ancestors, NotLinked, Duty, Question];

// Cuts: serious tone, so mostly fades and slow zooms, one whip for the turn to the rhino.
const TRANSITIONS: TransitionKind[] = ["fade", "zoom", "fade", "whip", "zoom", "fade", "zoom", "fade"];

export const BaduyBadak: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={B_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENES[i];
        return <Scene len={B_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={B_CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
