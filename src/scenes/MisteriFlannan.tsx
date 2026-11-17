import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Bed} from "../environment/SleepProps";
import {Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Boulder, CoatPeg, Flare, Fog, Island, KEEPER, Lighthouse, N, Railing, Rain, Sea, Sky, Slate, Steamer, StoppedClock, Vignette} from "../environment/HorrorProps";
import {Card, Stamp} from "../environment/MoneyProps";
import {clamp, eInOut, eOut, keys, keysObj, lerp, prog, rand} from "../motion/ease";
import {idle, STRIDE, walk} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES, SCENES as FL_SCENES} from "./flannanTiming";

/*
 * MISTERI MERCUSUAR FLANNAN (1900) — a 14-scene stickman mystery documentary (about 70 s).
 * Facts come from the 1901 report of superintendent Robert Muirhead and the National Records of
 * Scotland; the legend (overturned chair, untouched meal, praying logbook) is shown as legend and
 * then stamped as made up. Sources: scripts/narasi/flannan-copy.md.
 * Narration script: scripts/narasi/flannan.txt. Scene lengths and captions: flannanTiming.ts.
 */

export {FRAMES as FLANNAN_FRAMES} from "./flannanTiming";

const SCALE = 1.5;
const SEA_Y = 300;
const MOORE: Look = {...KEEPER, coat: "#3A3328", top: "#4A4032", sleeve: "#4A4032", hatColor: "#2A2620"};
const ROOM_WALL = "#1D2028";
const ROCK_FLOOR = "#15181D";

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => CUES[cue].from - FL_SCENES[scene].from;

/** Pops in with a small overshoot: 0 before `at`, 1 soon after. */
const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/** Slow drift for the camera: every scene creeps in a little. */
const creep = (frame: number, len: number, from: {x: number; y: number; zoom: number}, to: {x: number; y: number; zoom: number}) =>
  keysObj(frame, [
    [0, {...from, rot: 0}],
    [len, {...to, rot: 0}],
  ]);

/** Flat rocky ground at FLOOR, for scenes on the island. */
const RockGround: React.FC = () => (
  <g>
    <rect x={-2000} y={FLOOR} width={4000} height={1200} fill={ROCK_FLOOR} />
    <rect x={-2000} y={FLOOR} width={4000} height={6} fill={C.ink} opacity={0.6} />
  </g>
);

/** Scene 1: three figures on the island fade away under the turning beam. */
const S1Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const gone = cueAt(1, 0);
  const cam = creep(frame, len, {x: 0, y: 20, zoom: 0.95}, {x: -60, y: 40, zoom: 1.15});
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y} t={t} />
          <Island x={0} w={720} top={150} seaY={SEA_Y} />
          <Lighthouse x={170} y={150} s={1.2} beamAngle={t * 50} />
          {[-250, -160, -70].map((x, i) => (
            <Stickman key={x} x={x} y={156} scale={0.75} pose={idle(t, i)} look={KEEPER} opacity={1 - prog(frame, gone + i * 10, gone + i * 10 + 18)} />
          ))}
          <Fog y={260} t={t} opacity={0.22} />
          <g opacity={prog(frame, 4, 20) * (1 - prog(frame, len - 20, len - 4))}>
            <Label x={0} y={-430} text="1900" size={150} color={N.beam} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: where the island is: a dotted line to the mainland, 32 km. */
const S2Where: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const dist = cueAt(4, 1);
  const cam = creep(frame, len, {x: 0, y: 0, zoom: 0.8}, {x: 0, y: 20, zoom: 0.86});
  const k = prog(frame, dist, dist + 24, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y} t={t} rough={0.8} />
          {/* mainland on the left edge */}
          <path d={`M -900 ${SEA_Y + 20} L -900 60 L -560 80 L -500 140 L -420 170 L -380 ${SEA_Y + 20} Z`} fill={N.rock} stroke={C.ink} strokeWidth={4} />
          <Island x={400} w={240} top={200} seaY={SEA_Y} />
          <Lighthouse x={430} y={196} s={0.5} beamAngle={t * 50} />
          <line x1={-380} y1={SEA_Y - 60} x2={lerp(-380, 270, k)} y2={SEA_Y - 60} stroke={N.beam} strokeWidth={6} strokeDasharray="18 16" opacity={0.85} />
          <g opacity={prog(frame, dist + 10, dist + 20)}>
            <Label x={-55} y={SEA_Y - 90} text="32 KM" size={56} color={N.beam} />
          </g>
          <g transform={`translate(400 -40) scale(${pop(frame, cueAt(3, 1) + 6)})`}>
            <Label x={0} y={0} text="EILEAN MOR" size={58} color={C.bone} />
          </g>
          <g opacity={prog(frame, cueAt(5, 1), cueAt(5, 1) + 10)}>
            <Label x={-470} y={-20} text="SKOTLANDIA" size={44} color={C.bone} />
          </g>
          <Fog y={200} t={t} opacity={0.16} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: the three keepers in front of the lighthouse, named one by one. */
const S3Keepers: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const c7 = cueAt(7, 2);
  const c8 = cueAt(8, 2);
  const cam = creep(frame, len, {x: 0, y: 60, zoom: 1.0}, {x: 0, y: 40, zoom: 1.08});
  const keepers = [
    {x: -330, name: "JAMES DUCAT", at: c7, y: -70},
    {x: 0, name: "THOMAS MARSHALL", at: c7 + 18, y: -150},
    {x: 330, name: "DONALD McARTHUR", at: c8, y: -70},
  ];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={0.6}>
          <Lighthouse x={0} y={FLOOR - 230} s={1.5} on={1} beamAngle={t * 40} />
        </Layer>
        <Layer depth={1}>
          <RockGround />
          {keepers.map((k, i) => (
            <g key={k.name}>
              <Stickman x={k.x} y={FLOOR} scale={SCALE} pose={idle(t, i + 3)} look={KEEPER} expr="neutral" opacity={prog(frame, 2 + i * 6, 14 + i * 6)} />
              <g transform={`translate(${k.x} ${k.y}) scale(${pop(frame, k.at)})`}>
                <Card x={0} y={0} w={300} h={64} color={C.charcoal} border={N.beam}>
                  <Label x={0} y={10} text={k.name} size={25} color={C.bone} />
                </Card>
              </g>
            </g>
          ))}
          <Fog y={FLOOR - 40} t={t} opacity={0.14} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: the last slate note, then the light goes out. */
const S4LastNote: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const out = cueAt(11, 3);
  const cam = creep(frame, len, {x: 0, y: 0, zoom: 1.0}, {x: 60, y: 30, zoom: 1.1});
  // the lamp flickers twice, then dies
  const flick = frame < out ? 1 : frame < out + 4 ? 0.2 : frame < out + 7 ? 0.9 : frame < out + 10 ? 0.1 : 0;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y + 60} t={t} />
          <Island x={180} w={560} top={210} seaY={SEA_Y + 60} />
          <Lighthouse x={240} y={210} s={1.1} on={flick} beamAngle={t * 50} />
          <g transform={`translate(-150 -420) rotate(-3) scale(${pop(frame, 4)})`}>
            <Slate x={0} y={0} lines={["15 DESEMBER", "JAM 09.00"]} k={prog(frame, 8, cueAt(10, 3) + 10, (v) => v)} />
          </g>
          <g opacity={prog(frame, cueAt(10, 3), cueAt(10, 3) + 10)}>
            <Label x={-150} y={-250} text="catatan terakhir" size={34} color={C.bone} />
          </g>
          <Fog y={240} t={t} opacity={0.2} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: a passing ship sees the dark tower; the storm and the calendar run on. */
const S5Storm: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const storm = cueAt(13, 4);
  const days = cueAt(14, 4);
  const rough = 1 + prog(frame, storm, storm + 20) * 1.6;
  const cam = creep(frame, len, {x: 0, y: 40, zoom: 0.95}, {x: 0, y: 40, zoom: 1.05});
  const day = Math.round(lerp(15, 26, prog(frame, days, days + 40, eInOut)));
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={frame > storm ? 1.6 : 0}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y} t={t} rough={rough} />
          <Island x={330} w={420} top={170} seaY={SEA_Y} />
          <Lighthouse x={360} y={170} s={0.9} on={0} />
          <g opacity={1 - prog(frame, storm, storm + 16)}>
            <Steamer x={lerp(-760, -60, prog(frame, 0, storm, (v) => v))} y={SEA_Y + 10} t={t} s={0.9} />
          </g>
          <Rain t={t} opacity={0.4 * prog(frame, storm, storm + 12)} />
          <g transform={`translate(-150 -430) scale(${pop(frame, days)})`}>
            <Card x={0} y={0} w={300} h={210} color={C.bone}>
              <rect x={-150} y={-105} width={300} height={56} rx={14} fill={C.red} />
              <Label x={0} y={-66} text="DESEMBER" size={32} color={C.bone} />
              <Label x={0} y={70} text={String(day)} size={110} color={C.ink} />
            </Card>
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: the relief ship whistles and fires a flare. Nothing answers. */
const S6Arrival: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const c15 = cueAt(15, 5);
  const flareAt = c15 + (CUES[15].to - CUES[15].from) * 0.5;
  const quiet = cueAt(17, 5);
  const cam = keysObj(frame, [
    [0, {x: -100, y: 40, zoom: 0.95, rot: 0}],
    [quiet, {x: 0, y: 30, zoom: 1.0, rot: 0}],
    [len, {x: 260, y: 20, zoom: 1.3, rot: 0}],
  ]);
  const ship = {x: -300, y: SEA_Y + 10};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky day={1} />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y} t={t} rough={1.3} />
          <Island x={330} w={460} top={160} seaY={SEA_Y} />
          <Lighthouse x={380} y={160} s={1.0} on={0} />
          <Steamer x={ship.x} y={ship.y} t={t} s={1.0} />
          {/* whistle: rings from the funnel */}
          {[0, 1, 2].map((i) => {
            const k = clamp((frame - c15 - i * 6) / 24);
            return k > 0 && k < 1 ? <circle key={i} cx={ship.x + 27} cy={ship.y - 150} r={30 + k * 160} fill="none" stroke={C.bone} strokeWidth={6} opacity={0.6 * (1 - k)} /> : null;
          })}
          <Flare x={ship.x + 100} y={ship.y - 60} k={prog(frame, flareAt, flareAt + 30, eOut)} />
          <Fog y={180} t={t} opacity={0.25} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 7: Joseph Moore walks up alone to a closed gate. */
const S7Moore: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const stop = cueAt(20, 6);
  const x0 = -640;
  const x1 = 40;
  const dist = (x1 - x0) * prog(frame, 0, stop, (v) => v);
  const walking = frame < stop;
  const cam = keysObj(frame, [
    [0, {x: -300, y: 60, zoom: 1.05, rot: 0}],
    [stop, {x: 120, y: 60, zoom: 1.05, rot: 0}],
    [len, {x: 160, y: 40, zoom: 1.2, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky day={1} />
        </Layer>
        <Layer depth={0.6}>
          <Lighthouse x={420} y={FLOOR - 30} s={1.7} on={0} />
        </Layer>
        <Layer depth={1}>
          <RockGround />
          {/* the closed gate */}
          <g>
            <rect x={196} y={FLOOR - 230} width={22} height={230} fill="#3A3F48" stroke={C.ink} strokeWidth={3} />
            <rect x={366} y={FLOOR - 230} width={22} height={230} fill="#3A3F48" stroke={C.ink} strokeWidth={3} />
            {Array.from({length: 7}, (_, i) => (
              <line key={i} x1={226 + i * 22} y1={FLOOR - 200} x2={226 + i * 22} y2={FLOOR - 10} stroke="#59606B" strokeWidth={7} />
            ))}
            <line x1={218} y1={FLOOR - 190} x2={366} y2={FLOOR - 190} stroke="#59606B" strokeWidth={8} />
            <line x1={218} y1={FLOOR - 40} x2={366} y2={FLOOR - 40} stroke="#59606B" strokeWidth={8} />
          </g>
          <Stickman
            x={x0 + dist}
            y={FLOOR}
            scale={SCALE}
            pose={walking ? walk(dist / (STRIDE * SCALE), t) : {...idle(t), look: 0.8, lookY: -0.2}}
            look={MOORE}
            expr={walking ? "neutral" : "worried"}
          />
          <g opacity={prog(frame, cueAt(18, 6), cueAt(18, 6) + 10) * (1 - prog(frame, stop - 10, stop))}>
            <Label x={x0 + dist} y={-60} text="JOSEPH MOORE" size={30} color={C.bone} />
          </g>
          <Rain t={t} opacity={0.2} />
          <Fog y={FLOOR - 60} t={t} opacity={0.2} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 8: inside: the unmade bed, the stopped clock, the lamp cleaned and ready. */
const S8Inside: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const bed = cueAt(21, 7);
  const clock = cueAt(22, 7);
  const lamp = cueAt(23, 7);
  const cam = keysObj(frame, [
    [0, {x: -280, y: 60, zoom: 1.2, rot: 0}],
    [clock - 4, {x: -280, y: 60, zoom: 1.2, rot: 0}],
    [clock + 14, {x: 0, y: -40, zoom: 1.25, rot: 0}],
    [lamp - 2, {x: 0, y: -40, zoom: 1.25, rot: 0}],
    [lamp + 16, {x: 300, y: 40, zoom: 1.2, rot: 0}],
    [len, {x: 300, y: 40, zoom: 1.3, rot: 0}],
  ]);
  const lookAt = frame < clock ? -1 : frame < lamp ? 0 : 1;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.6}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={ROOM_WALL} />
          <StoppedClock x={0} y={-260} r={70} h={2} m={40} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={60} y={100} r={420} color={N.beam} opacity={0.08} />
          <Bed x0={-560} x1={-160} top={FLOOR - 110} floor={FLOOR} />
          {/* rumpled blanket */}
          <path d={`M -470 ${FLOOR - 104} q 40 -50 90 -10 q 50 -40 100 6 q 40 -30 110 4 l 0 14 l -300 0 z`} fill="#4A4F5C" stroke={C.ink} strokeWidth={3} />
          {/* lamp on a table: glass cleaned and full */}
          <rect x={270} y={FLOOR - 140} width={180} height={14} fill={C.wood} stroke={C.ink} strokeWidth={3} />
          <rect x={286} y={FLOOR - 126} width={12} height={126} fill={C.woodDark} />
          <rect x={422} y={FLOOR - 126} width={12} height={126} fill={C.woodDark} />
          <g transform={`translate(360 ${FLOOR - 140})`}>
            <rect x={-30} y={-24} width={60} height={24} rx={4} fill="#9A7A3A" stroke={C.ink} strokeWidth={3} />
            <path d="M -24 -24 Q -34 -80 0 -100 Q 34 -80 24 -24 Z" fill="#CFE3EA" opacity={0.85} stroke={C.ink} strokeWidth={3} />
            {[0, 1].map((i) => (
              <path key={i} d="M 0 -14 L 4 -4 L 14 0 L 4 4 L 0 14 L -4 4 L -14 0 L -4 -4 Z" fill="#FFFFFF" transform={`translate(${i ? 14 : -10} ${i ? -78 : -52}) scale(${pop(frame, lamp + 4 + i * 6) * (1 + Math.sin(t * 8 + i) * 0.2)})`} />
            ))}
          </g>
          <g opacity={prog(frame, bed, bed + 8) * (1 - prog(frame, clock, clock + 6))}>
            <Label x={-360} y={FLOOR - 230} text="belum dirapikan" size={32} color={C.bone} />
          </g>
          <Stickman x={60} y={FLOOR} scale={SCALE} facing={lookAt === 1 ? 1 : -1} pose={{...idle(t), lookY: lookAt === 0 ? -0.8 : 0, look: 0.7}} look={MOORE} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 9: two empty pegs and one oilskin left behind; the door open to the rain. */
const S9Coat: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const left = cueAt(25, 8);
  const door = cueAt(26, 8);
  const cam = keysObj(frame, [
    [0, {x: 0, y: -40, zoom: 1.0, rot: 0}],
    [left + 10, {x: 180, y: -80, zoom: 1.3, rot: 0}],
    [door - 2, {x: 180, y: -80, zoom: 1.3, rot: 0}],
    [door + 18, {x: -220, y: 0, zoom: 1.1, rot: 0}],
    [len, {x: -240, y: 0, zoom: 1.18, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={1}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={ROOM_WALL} />
          {/* open door to the rain on the left */}
          <rect x={-560} y={FLOOR - 330} width={190} height={330} fill="#3A4452" stroke={C.ink} strokeWidth={5} />
          <g>
            <defs>
              <clipPath id="doorway">
                <rect x={-555} y={FLOOR - 325} width={180} height={320} />
              </clipPath>
            </defs>
            <g clipPath="url(#doorway)">
              <Rain t={t} x0={-600} x1={-340} y0={FLOOR - 400} y1={FLOOR} amount={40} opacity={0.7} />
            </g>
          </g>
          <path d={`M -370 ${FLOOR - 330} L -300 ${FLOOR - 300} L -300 ${FLOOR + 20} L -370 ${FLOOR}`} fill="#4A3A2C" stroke={C.ink} strokeWidth={4} transform={`rotate(${Math.sin(t * 3) * 2} -370 ${FLOOR - 330})`} />
          <Floor x0={-1400} x1={1400} />
          <Glow x={180} y={-150} r={300} color={N.oilskin} opacity={0.18 * prog(frame, left, left + 12)} />
          <CoatPeg x={-120} y={-260} />
          <CoatPeg x={30} y={-260} />
          <CoatPeg x={180} y={-260} coat sway={Math.sin(t * 1.5) * 2} />
          <g opacity={prog(frame, cueAt(24, 8) + 6, cueAt(24, 8) + 14) * (1 - prog(frame, left, left + 6))}>
            <Label x={-45} y={-120} text="?" size={90} color={C.red} />
          </g>
          <Stickman x={420} y={FLOOR} scale={SCALE} facing={-1} pose={{...idle(t), look: 0.6, lookY: frame < door ? -0.6 : 0}} look={MOORE} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 10: the west landing after the storm: a bent railing and a moved boulder. */
const S10Landing: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const rail = cueAt(28, 9);
  const rock = cueAt(29, 9);
  const cam = creep(frame, len, {x: -40, y: 60, zoom: 1.0}, {x: 0, y: 40, zoom: 1.12});
  const edge = 220;
  const rk = prog(frame, rock, rock + 30, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={1.2}>
        <Layer depth={0.3}>
          <Sky day={1} />
        </Layer>
        <Layer depth={1}>
          <Sea y={FLOOR + 80} t={t} rough={2.2} />
          <path d={`M -1400 ${FLOOR} L ${edge} ${FLOOR} L ${edge + 60} ${FLOOR + 400} L -1400 ${FLOOR + 400} Z`} fill={ROCK_FLOOR} stroke={C.ink} strokeWidth={4} />
          {/* spray over the edge */}
          {Array.from({length: 14}, (_, i) => {
            const ph = (t * 0.7 + rand(i + 70)) % 1;
            return <circle key={i} cx={edge + 40 + rand(i + 80) * 200 - ph * 120} cy={FLOOR + 60 - ph * 380} r={10 + rand(i + 90) * 16} fill={N.foam} opacity={0.5 * (1 - ph)} />;
          })}
          <Railing x0={-360} x1={120} y={FLOOR} bend={prog(frame, rail, rail + 18, eOut)} />
          <Boulder x={lerp(-140, -300, rk)} y={FLOOR - 66} r={86} rot={lerp(0, -38, rk)} />
          <g opacity={prog(frame, rail + 6, rail + 14)}>
            <Label x={-120} y={-300} text="DERMAGA BARAT" size={54} color={C.bone} />
          </g>
          <g opacity={prog(frame, rock + 6, rock + 14)}>
            <Label x={-220} y={-220} text="± 1 ton" size={44} color={N.beam} />
          </g>
          <Rain t={t} opacity={0.3} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 11: the official finding: a huge wave. Shown in silhouette, without detail. */
const S11Wave: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const rise = cueAt(32, 10);
  const pull = cueAt(33, 10);
  const cam = creep(frame, len, {x: 0, y: 40, zoom: 1.0}, {x: 0, y: 20, zoom: 0.94});
  const w = keys(frame, [
    [0, 0],
    [rise, 0],
    [pull, 1],
    [pull + 24, 0],
  ]);
  const crest = lerp(FLOOR + 160, -120, w);
  const front = lerp(700, -500, w);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={frame > rise ? 1.8 : 0.4}>
        <Layer depth={0.3}>
          <Sky day={1} />
        </Layer>
        <Layer depth={1}>
          <Sea y={FLOOR + 80} t={t} rough={2} />
          <path d={`M -1400 ${FLOOR} L 220 ${FLOOR} L 280 ${FLOOR + 400} L -1400 ${FLOOR + 400} Z`} fill={ROCK_FLOOR} stroke={C.ink} strokeWidth={4} />
          {[-260, -170, -80].map((x, i) => (
            <Stickman key={x} x={x} y={FLOOR} scale={0.9} pose={idle(t, i + 7)} look={KEEPER} opacity={frame < pull ? 1 : 0} />
          ))}
          {w > 0.01 ? (
            <path
              d={`M 1400 ${FLOOR + 500} L 1400 ${crest} Q ${front + 260} ${crest - 80} ${front} ${crest + 60} Q ${front - 40} ${crest + 200} ${front + 60} ${FLOOR + 500} Z`}
              fill="#1E3346"
              stroke={N.foam}
              strokeWidth={8}
              opacity={0.96}
            />
          ) : null}
          <g transform={`translate(0 -440) scale(${pop(frame, cueAt(31, 10))})`}>
            <Card x={0} y={0} w={560} h={130} color={C.charcoal} border={N.beam}>
              <Label x={0} y={-12} text="LAPORAN RESMI, 1901" size={38} color={N.beam} />
              <Label x={0} y={36} text="Superintendent R. Muirhead" size={26} color={C.bone} />
            </Card>
          </g>
          <Rain t={t} opacity={0.3} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** A plain wooden chair standing on (x, y). */
const Chair: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-40} y={-90} width={80} height={14} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={-40} y={-76} width={10} height={76} fill={C.woodDark} />
    <rect x={30} y={-76} width={10} height={76} fill={C.woodDark} />
    <rect x={-40} y={-200} width={12} height={112} fill={C.woodDark} stroke={C.ink} strokeWidth={2} />
    <rect x={-40} y={-200} width={70} height={14} fill={C.wood} stroke={C.ink} strokeWidth={2} />
  </g>
);

/** The legend props: an overturned chair, an untouched meal, a diary. `k` fades them in. */
const LegendTable: React.FC<{frame: number; chairAt: number; diaryAt: number; t: number}> = ({frame, chairAt, diaryAt, t}) => (
  <g>
    <rect x={-120} y={FLOOR - 150} width={360} height={16} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={-104} y={FLOOR - 134} width={12} height={134} fill={C.woodDark} />
    <rect x={212} y={FLOOR - 134} width={12} height={134} fill={C.woodDark} />
    <g opacity={prog(frame, chairAt, chairAt + 10)}>
      <Chair x={10} y={FLOOR - 40} rot={-92} />
      <ellipse cx={20} cy={FLOOR - 158} rx={70} ry={14} fill={C.bone} stroke={C.ink} strokeWidth={3} />
      <circle cx={0} cy={FLOOR - 170} r={18} fill="#8A5A3A" />
      <circle cx={34} cy={FLOOR - 168} r={14} fill="#C9A15A" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${-10 + i * 20} ${FLOOR - 196} q 10 -20 0 -40`} stroke={C.bone} strokeWidth={3} fill="none" opacity={0.3 + Math.sin(t * 3 + i) * 0.2} />
      ))}
    </g>
    <g opacity={prog(frame, diaryAt, diaryAt + 10)} transform={`translate(160 ${FLOOR - 166})`}>
      <path d="M -60 0 L 0 -12 L 60 0 L 60 -70 L 0 -82 L -60 -70 Z" fill="#E4DCC6" stroke={C.ink} strokeWidth={3} />
      <line x1={0} y1={-12} x2={0} y2={-82} stroke={C.ink} strokeWidth={2} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={-50} y1={-60 + i * 16} x2={-10} y2={-62 + i * 16} stroke="#6A5A4A" strokeWidth={3} />
      ))}
      <text x={30} y={-40} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={14} fill="#6A2A24">
        doa
      </text>
    </g>
  </g>
);

/** Scene 12: the legend, drawn as a red-tinged, flickering memory. */
const S12Legend: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const cam = creep(frame, len, {x: 0, y: 170, zoom: 1.1}, {x: 0, y: 150, zoom: 1.2});
  const flicker = 0.85 + 0.15 * rand(Math.floor(frame / 3) + 300);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#140A0A">
        <Layer depth={1} opacity={flicker}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color="#2A1716" />
          <Floor x0={-1400} x1={1400} />
          <Glow x={40} y={FLOOR - 200} r={460} color={C.red} opacity={0.16} />
          <g transform={`translate(0 ${FLOOR}) scale(1.45) translate(-60 ${-FLOOR})`}>
            <LegendTable frame={frame} chairAt={cueAt(35, 11)} diaryAt={cueAt(36, 11)} t={t} />
          </g>
          <g opacity={prog(frame, cueAt(34, 11), cueAt(34, 11) + 12)}>
            <Label x={40} y={-420} text="KATANYA..." size={86} color="#E7B9A8" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 13: the legend is stamped as made up; what remains is the coat left behind. */
const S13Twist: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const stamp = cueAt(37, 12);
  const real = cueAt(39, 12);
  const ask = cueAt(40, 12);
  const cam = creep(frame, len, {x: 0, y: 150, zoom: 1.15}, {x: 0, y: 120, zoom: 1.2});
  const toReal = prog(frame, real - 6, real + 8, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={1}>
          <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={ROOM_WALL} />
          <Floor x0={-1400} x1={1400} />
          <g opacity={(1 - toReal) * 0.55}>
            <g transform={`translate(0 ${FLOOR}) scale(1.45) translate(-60 ${-FLOOR})`}>
              <LegendTable frame={frame + 999} chairAt={0} diaryAt={0} t={t} />
            </g>
          </g>
          <g opacity={1 - toReal}>
            <Stamp x={40} y={-60} text="KARANGAN" k={prog(frame, stamp + 4, stamp + 12, eOut)} size={74} />
            <g opacity={prog(frame, stamp + 14, stamp + 24)}>
              <Label x={40} y={-300} text="puisi 1912 & cerita belakangan" size={32} color={C.bone} />
            </g>
          </g>
          <g opacity={toReal}>
            <Glow x={0} y={-140} r={340} color={N.oilskin} opacity={0.18} />
            <CoatPeg x={0} y={-330} coat sway={Math.sin(t * 1.5) * 2} />
            <g transform={`translate(230 -220) scale(${pop(frame, ask)})`}>
              <Label x={0} y={0} text="?" size={190} color={C.red} />
            </g>
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 14: the empty landing at dusk, the light turning; the question stays. */
const S14End: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const title = cueAt(43, 13);
  const cam = creep(frame, len, {x: 60, y: 40, zoom: 1.25}, {x: 0, y: 0, zoom: 0.92});
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.3}>
          <Sky />
        </Layer>
        <Layer depth={1}>
          <Sea y={SEA_Y} t={t} rough={1.2} />
          <Island x={60} w={760} top={150} seaY={SEA_Y} />
          <Lighthouse x={200} y={150} s={1.25} on={prog(frame, 10, 40)} beamAngle={t * 45} />
          <Fog y={230} t={t} opacity={0.26} />
          <g opacity={prog(frame, title, title + 20)}>
            <Label x={0} y={-470} text="MISTERI FLANNAN" size={76} color={N.beam} />
            <Label x={0} y={-400} text="1900 — belum terpecahkan" size={36} color={C.bone} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const SCENE_LIST = [S1Hook, S2Where, S3Keepers, S4LastNote, S5Storm, S6Arrival, S7Moore, S8Inside, S9Coat, S10Landing, S11Wave, S12Legend, S13Twist, S14End];

// Mostly slow fades; a zoom where the story jumps forward, and hard cuts into the legend and out of it.
const TRANSITIONS: TransitionKind[] = ["fade", "fade", "zoom", "fade", "fade", "zoom", "fade", "zoom", "fade", "fade", "cut", "cut", "fade"];

export const MisteriFlannan: React.FC<{narration?: string}> = ({narration}) => {
  const frame = useSceneFrame();
  return (
    <AbsoluteFill>
      <ScenesWithTransitions
        scenes={FL_SCENES}
        kinds={TRANSITIONS}
        background="#05070E"
        render={(i) => {
          const Scene = SCENE_LIST[i];
          return <Scene len={FL_SCENES[i].len} />;
        }}
      />
      <Vignette frame={frame} />
      <CaptionTrack cues={CUES} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
