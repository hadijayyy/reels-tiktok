import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Wall} from "../environment/Furniture";
import {
  ANAK, AYAH, AYAH_HELMET, bikeRider, Car, DiningTable, F, HelmetOnRoad, House, IBU, LightRain, Motorbike, PhotoFrame,
  PlantPot, PowerPole, Road, SackOnBack, SideChair, SkyBand, Stove, StreetLamp,
} from "../environment/FamilyProps";
import {StoppedClock, Vignette} from "../environment/HorrorProps";
import {Coin} from "../environment/MoneyProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {idle, sit, STRIDE, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {C, FONT, FPS} from "../styles/palette";
import {CUES, SCENES as AY_SCENES} from "./ayahTiming";

/*
 * ADA YANG MENUNGGU AYAH PULANG — a 14-scene emotional story (about 70 s), stickman in a cinematic
 * style: warm morning, harsh noon, dusk road, a cut to black, then a night of waiting.
 * The accident is never shown: the car's lights, a white flash, black; then only the bike and
 * helmet on the road. Narration: scripts/narasi/ayah.txt. Scene lengths and captions: ayahTiming.ts.
 */

export {FRAMES as AYAH_FRAMES} from "./ayahTiming";

const S = 1.5; // adult scale
const KID = 1.0; // child scale
const NIGHT = "#0B0E16";

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => CUES[cue].from - AY_SCENES[scene].from;

const cam = (frame: number, len: number, a: [number, number, number], b: [number, number, number]) =>
  keysObj(frame, [
    [0, {x: a[0], y: a[1], zoom: a[2], rot: 0}],
    [len, {x: b[0], y: b[1], zoom: b[2], rot: 0}],
  ], eInOut);

/** A tinted, softly lit interior wall and floor. */
const Room: React.FC<{wall?: string}> = ({wall = F.roomWallNight}) => (
  <>
    <Wall x0={-1600} x1={1600} y0={-1400} y1={FLOOR} color={wall} />
    <Floor x0={-1600} x1={1600} />
  </>
);

/** A night window in an interior wall, centred on (x, y). */
const NightWindow: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-100} y={-120} width={200} height={240} fill="#0E1420" stroke="#4A3220" strokeWidth={14} />
    <line x1={0} y1={-120} x2={0} y2={120} stroke="#4A3220" strokeWidth={10} />
    <line x1={-100} y1={0} x2={100} y2={0} stroke="#4A3220" strokeWidth={10} />
    <circle cx={50} cy={-60} r={3} fill="#E8E2C8" />
    <circle cx={-40} cy={40} r={2.5} fill="#E8E2C8" />
  </g>
);

/** A hanging ceiling lamp that lights the room warmly. */
const HangingLamp: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <line x1={x} y1={y - 600} x2={x} y2={y} stroke="#222" strokeWidth={3} />
    <path d={`M ${x - 46} ${y + 30} L ${x - 20} ${y} L ${x + 20} ${y} L ${x + 46} ${y + 30} Z`} fill="#6A4A30" stroke={C.ink} strokeWidth={3} />
    <circle cx={x} cy={y + 34} r={10} fill={F.warm} />
    <Glow x={x} y={y + 140} r={620} color={F.warm} opacity={0.22} />
  </g>
);

// ---------------------------------------------------------------- 1. Pamit: the morning goodbye
const S1Pamit: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const leave = cueAt(2, 0);
  const wave = Math.sin(t * 7) * 18;
  const waving = frame < leave;
  const walkDist = 260 * prog(frame, leave, len, (v) => v);
  const ayahPose: Pose = waving ? {...idle(t), shR: 140, elR: 30 + wave, look: 0.6} : walk(walkDist / (STRIDE * S), t);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 40, 0.95], [-60, 60, 1.08])} t={t}>
        <Layer depth={0.3}>
          <SkyBand top="#7FA6C9" bottom={F.dawn} />
          <Glow x={500} y={-500} r={700} color={F.dawn} opacity={0.5} />
        </Layer>
        <Layer depth={1}>
          <rect x={-2000} y={FLOOR} width={4000} height={1200} fill="#4A4036" />
          <g transform={`translate(80 ${FLOOR}) scale(1.6) translate(-80 ${-FLOOR})`}>
            <House x={80} y={FLOOR} doorOpen={1} />
          </g>
          <PlantPot x={-380} y={FLOOR} />
          <Stickman x={70} y={FLOOR - 30} scale={S * 0.97} facing={-1} pose={{...idle(t, 2), shR: 40, elR: 50}} look={IBU} expr="calm" />
          <Stickman x={250} y={FLOOR - 30} scale={KID} facing={-1} pose={{...idle(t, 4), shR: 150, elR: 20 + Math.sin(t * 8 + 1) * 20}} look={ANAK} expr="happy" />
          <Stickman x={waving ? -260 : -260 - walkDist} y={FLOOR} scale={S} facing={waving ? 1 : -1} pose={ayahPose} look={AYAH} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. The same house as night falls
const S2Malam: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const dusk = prog(frame, 0, 50, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [-60, 60, 1.08], [40, 40, 1.0])} t={t} background={NIGHT}>
        <Layer depth={0.3}>
          <g opacity={1 - dusk}>
            <SkyBand top="#7FA6C9" bottom={F.dawn} />
          </g>
          <g opacity={dusk}>
            <SkyBand top="#05070E" bottom="#1C2236" />
          </g>
        </Layer>
        <Layer depth={1}>
          <rect x={-2000} y={FLOOR} width={4000} height={1200} fill={dusk > 0.5 ? "#1E1B18" : "#4A4036"} />
          <g transform={`translate(80 ${FLOOR}) scale(1.6) translate(-80 ${-FLOOR})`}>
            <House x={80} y={FLOOR} night={dusk} windowLight={dusk} />
          </g>
          <PlantPot x={-380} y={FLOOR} />
          <rect x={-2000} y={-1600} width={4000} height={3400} fill="#0A1030" opacity={0.35 * dusk} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** A market backdrop: a warehouse wall with stacked sacks and a shade. */
const Market: React.FC = () => (
  <g>
    <rect x={-1600} y={-1400} width={3200} height={1400 + FLOOR} fill="#6E6152" />
    <rect x={-1600} y={-260} width={3200} height={40} fill="#4A3F34" />
    {Array.from({length: 14}, (_, i) => (
      <g key={i} transform={`translate(${-900 + (i % 7) * 260} ${FLOOR - 70 - Math.floor(i / 7) * 110})`}>
        <path d="M -100 60 Q -110 0 -90 -46 L 90 -46 Q 110 0 100 60 Z" fill="#B59A6A" stroke={C.ink} strokeWidth={3} />
      </g>
    ))}
    <rect x={-2000} y={FLOOR} width={4000} height={1200} fill="#5A5048" />
  </g>
);

// ---------------------------------------------------------------- 3. Carrying sacks at the market
const S3Kerja: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const dist = 330 * prog(frame, 0, len, (v) => v);
  const pose: Pose = {...walk(dist / (STRIDE * S), t), lean: 16, headTilt: 10, shR: -10, elR: 120, shL: 10};
  const look: Look = {...AYAH, back: SackOnBack};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [-180, 100, 1.1], [80, 80, 1.2])} t={t}>
        <Layer depth={0.6}>
          <Market />
        </Layer>
        <Layer depth={1}>
          <Glow x={300} y={-300} r={800} color="#FFE2A8" opacity={0.25} />
          <Stickman x={-300 + dist} y={FLOOR} scale={S} pose={pose} look={look} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. Close-up: wiping sweat, carrying on
const S4Paksa: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const wipe = prog(frame, 6, 26, eInOut) * (1 - prog(frame, len * 0.55, len * 0.55 + 16, eInOut));
  const ayahX = 0;
  const head = {x: ayahX + 28, y: FLOOR - 330};
  const look: Look = {...AYAH, back: SackOnBack};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -40, 1.7], [10, -60, 1.95])} t={t}>
        <Layer depth={0.6}>
          <Market />
        </Layer>
        <Layer depth={1}>
          <Glow x={360} y={-500} r={700} color="#FFE2A8" opacity={0.3} />
          <Stickman
            x={ayahX}
            y={FLOOR}
            scale={S}
            pose={{...idle(t), lean: 12, headTilt: 8 - wipe * 8, lookY: -0.2}}
            look={look}
            expr={frame > len * 0.6 ? "determined" : "worried"}
            reachR={wipe > 0.05 ? {x: lerp(ayahX + 60, head.x + 30, wipe), y: lerp(FLOOR - 160, head.y - 20, wipe)} : undefined}
          />
          {/* sweat drops */}
          {[0, 1].map((i) => {
            const ph = (t * 0.6 + i * 0.5) % 1;
            return <path key={i} d="M 0 -10 Q 7 2 0 8 Q -7 2 0 -10 Z" fill="#BFE0F0" opacity={0.85 * (1 - ph)} transform={`translate(${ayahX - 30 + i * 70} ${FLOOR - 360 + ph * 70})`} />;
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. Counting a few coins, thinking of home
const S5Nafkah: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const think = cueAt(11, 4);
  const bench = {x: -120, floorY: FLOOR, seat: 92, facing: 1 as const};
  const seat = seatedAnchor(bench, S);
  const palm = {x: seat.hip.x + 110, y: seat.hip.y - 70};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 60, 1.15], [40, 0, 1.25])} t={t}>
        <Layer depth={0.6}>
          <Market />
        </Layer>
        <Layer depth={1}>
          <rect x={bench.x - 70} y={FLOOR - 96} width={200} height={16} fill="#7A5A3A" stroke={C.ink} strokeWidth={3} />
          <rect x={bench.x - 60} y={FLOOR - 80} width={12} height={80} fill="#5A3E28" />
          <rect x={bench.x + 110} y={FLOOR - 80} width={12} height={80} fill="#5A3E28" />
          <Stickman x={seat.hip.x} y={seat.hip.y} anchor="hip" scale={S} pose={{...sit(t), headTilt: 16, lookY: 0.8, look: 0.6}} look={AYAH} expr="calm" footL={seat.footL} footR={seat.footR} reachL={palm} reachR={{x: palm.x + 10, y: palm.y - 6}} />
          {[0, 1, 2].map((i) => (
            <Coin key={i} x={palm.x - 6 + i * 10} y={palm.y - 14 - i * 6} r={14} />
          ))}
          {/* thought: home, a meal on the table */}
          <g opacity={prog(frame, think - 6, think + 10)} transform={`translate(150 -360) scale(${0.78 + 0.08 * prog(frame, think - 6, think + 20, eOut)})`}>
            <circle cx={-170} cy={260} r={14} fill={C.bone} opacity={0.8} />
            <circle cx={-130} cy={200} r={22} fill={C.bone} opacity={0.8} />
            <ellipse cx={0} cy={0} rx={250} ry={180} fill="#F3E6CF" stroke={C.ink} strokeWidth={4} />
            <g transform="scale(0.5) translate(0 220)">
              <DiningTable x={0} y={0} w={440} plates={[-120, 120]} />
              <Stickman x={-260} y={0} scale={1.4} facing={1} pose={idle(t, 3)} look={IBU} expr="happy" />
              <Stickman x={250} y={0} scale={1.0} facing={-1} pose={idle(t, 5)} look={ANAK} expr="happy" />
            </g>
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. The ride at dusk; the car; white; black
const S6Jalan: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const carCue = cueAt(14, 5);
  const impact = Math.round(carCue + (CUES[14].to - CUES[14].from) * 0.8);
  const bike = {x: 40, y: FLOOR + 40, s: 1.25};
  const rider = bikeRider(bike.x, bike.y, bike.s);
  const scroll = frame * 14;
  const carX = lerp(-1500, bike.x - 330, prog(frame, carCue, impact, (v) => v * v));
  const flash = frame >= impact ? clamp(1 - (frame - impact) / 6) : 0;
  const black = frame >= impact + 2;
  const bob = Math.sin(t * 14) * 1.5;
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      {!black ? (
        <Camera2D cam={keysObj(frame, [[0, {x: 0, y: 140, zoom: 1.0, rot: 0}], [impact, {x: -80, y: 140, zoom: 1.08, rot: 0}]])} t={t} handheld={frame > carCue ? 1.5 : 0.4}>
          <Layer depth={0.3}>
            <SkyBand top="#3A3050" bottom="#E08A5A" />
            <Glow x={-400} y={-50} r={500} color="#FFB070" opacity={0.5} />
          </Layer>
          <Layer depth={0.6}>
            {Array.from({length: 8}, (_, i) => {
              const x = -1600 + (((i * 420 - scroll * 0.6) % 3360) + 3360) % 3360;
              return <PowerPole key={i} x={x} y={FLOOR + 10} h={700} />;
            })}
          </Layer>
          <Layer depth={1}>
            <Road y={FLOOR + 10} scroll={scroll} />
            <g transform={`translate(0 ${bob})`}>
              <Motorbike x={bike.x} y={bike.y} s={bike.s} spin={frame * 24} light={1} />
              <Stickman x={rider.hip.x} y={rider.hip.y} anchor="hip" scale={S * 0.95} pose={{...sit(t), lean: 14, headTilt: -2}} look={AYAH_HELMET} expr="calm" footL={rider.footL} footR={rider.footR} reachL={rider.hand} reachR={rider.hand} />
            </g>
            {frame > carCue ? <Car x={carX} y={FLOOR + 110} s={1.3} lights={1} /> : null}
          </Layer>
        </Camera2D>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{backgroundColor: "#FFFFFF", opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. Aftermath: the bike and the helmet on a wet road
const S7Helm: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const fadeIn = prog(frame, 0, 30);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{opacity: fadeIn}}>
        <Camera2D cam={cam(frame, len, [-60, 220, 1.0], [120, 330, 1.4])} t={t} background={NIGHT}>
          <Layer depth={0.3}>
            <SkyBand top="#03050A" bottom="#121826" />
          </Layer>
          <Layer depth={1}>
            <Road y={FLOOR + 10} wet />
            <StreetLamp x={-260} y={FLOOR + 10} />
            <Motorbike x={-40} y={FLOOR + 80} s={1.15} lying />
            {/* scrape marks */}
            {[0, 1, 2].map((i) => (
              <line key={i} x1={-420 + i * 20} y1={FLOOR + 80 + i * 10} x2={-160 + i * 16} y2={FLOOR + 70 + i * 10} stroke="#4A4E55" strokeWidth={4} opacity={0.6} />
            ))}
            <HelmetOnRoad x={230} y={FLOOR + 110} s={1.2} />
            <LightRain t={t} opacity={0.3} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Kitchen interior: a wall clock, window, the stove on the right. */
const Kitchen: React.FC<{t: number; clockX?: number}> = ({t, clockX = -60}) => (
  <g>
    <Room />
    <NightWindow x={-380} y={-80} />
    <StoppedClock x={clockX} y={-300} r={56} h={7} m={10} />
    <Stove x={360} y={FLOOR} t={t} />
  </g>
);

// ---------------------------------------------------------------- 8. The mother cooks dinner
const S8Dapur: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const stir = {x: 360 + Math.cos(t * 3) * 26, y: FLOOR - 270 + Math.sin(t * 3) * 6};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [120, 40, 1.15], [200, 20, 1.3])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Kitchen t={t} />
          <HangingLamp x={140} y={-460} />
          <Stickman x={170} y={FLOOR} scale={S * 0.97} facing={1} pose={{...idle(t, 2), lookY: 0.6, look: 0.5, headTilt: 6}} look={IBU} expr="calm" reachR={stir} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9. The child waits by the door and asks
const S9Tanya: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ask = cueAt(22, 8);
  const turned = frame >= ask - 4;
  const hip = {x: -150, y: FLOOR - 14};
  return (
    <AbsoluteFill>
      <Camera2D cam={keysObj(frame, [[0, {x: -260, y: 60, zoom: 1.35, rot: 0}], [ask, {x: -200, y: 80, zoom: 1.5, rot: 0}], [len, {x: -190, y: 90, zoom: 1.6, rot: 0}]])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Room />
          <HangingLamp x={260} y={-460} />
          {/* front door, closed, with a night window next to it */}
          <rect x={-560} y={FLOOR - 410} width={220} height={410} fill="#5A3E28" stroke={C.ink} strokeWidth={5} />
          <circle cx={-370} cy={FLOOR - 200} r={8} fill={C.yellow} />
          <NightWindow x={-160} y={-120} />
          <Stickman
            x={hip.x}
            y={hip.y}
            anchor="hip"
            scale={KID}
            facing={turned ? 1 : -1}
            pose={{...sit(t), hipL: 70, kneeL: 120, hipR: 74, kneeR: 124, lookY: turned ? 0 : -0.7, look: 0.7, headTilt: turned ? 0 : -8}}
            look={ANAK}
            expr={turned ? "sad" : "neutral"}
            footL={{x: hip.x + (turned ? 60 : -60), y: FLOOR}}
            footR={{x: hip.x + (turned ? 76 : -76), y: FLOOR}}
          />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 10. Outside at night: no motorbike stops
const S10Sepi: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [80, 60, 1.15], [0, 80, 0.95])} t={t} background={NIGHT}>
        <Layer depth={0.3}>
          <SkyBand top="#03050A" bottom="#151B2C" />
        </Layer>
        <Layer depth={1}>
          <rect x={-2000} y={FLOOR} width={4000} height={1200} fill="#16140F" />
          <g transform={`translate(80 ${FLOOR - 40}) scale(1.4) translate(-80 ${-FLOOR})`}>
            <House x={80} y={FLOOR} night={1} windowLight={1} />
            {/* the child's silhouette in the left window */}
            <circle cx={-170} cy={FLOOR - 240} r={22} fill="#2A1E14" />
            <path d={`M -200 ${FLOOR - 170} Q -170 ${FLOOR - 215} -140 ${FLOOR - 170} Z`} fill="#2A1E14" />
          </g>
          <Road y={FLOOR + 120} />
          <StreetLamp x={-420} y={FLOOR + 120} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 11. Dinner with one empty chair
const S11Kursi: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ibuSeat = seatedAnchor({x: -420, floorY: FLOOR, seat: 92, facing: 1}, S * 0.97);
  const anakSeat = seatedAnchor({x: -60, floorY: FLOOR, seat: 92, facing: 1}, KID);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [-40, 20, 1.0], [300, -10, 1.45])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Room />
          <HangingLamp x={60} y={-480} />
          <SideChair x={-60} y={FLOOR} facing={1} />
          <Stickman x={anakSeat.hip.x} y={anakSeat.hip.y} anchor="hip" scale={KID} pose={{...sit(t, 4), headTilt: 14, lookY: 0.5, look: 0.8}} look={ANAK} expr="sad" footL={anakSeat.footL} footR={anakSeat.footR} />
          <DiningTable x={40} y={FLOOR} w={620} plates={[-170, 70, 270]} />
          <SideChair x={-420} y={FLOOR} facing={1} />
          <Stickman x={ibuSeat.hip.x} y={ibuSeat.hip.y} anchor="hip" scale={S * 0.97} pose={{...sit(t, 2), headTilt: 12, lookY: 0.4, look: 0.8}} look={IBU} expr="worried" footL={ibuSeat.footL} footR={ibuSeat.footR} />
          {/* the father's chair, empty */}
          <Glow x={440} y={FLOOR - 140} r={260} color={F.warm} opacity={0.14} />
          <SideChair x={460} y={FLOOR} facing={-1} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** The child hugging the father's photo, standing in the lamplight. */
const Hug: React.FC<{t: number; withMother?: number}> = ({t, withMother = 0}) => {
  const x = 0;
  const chest = {x: x + 40, y: FLOOR - 190};
  const sway = Math.sin(t * 1.2) * 1.5;
  return (
    <g>
      <Room />
      <HangingLamp x={-40} y={-520} />
      {withMother > 0 ? (
        <g opacity={withMother}>
          <Stickman x={-170} y={FLOOR} scale={S * 0.97} facing={1} pose={{...idle(t, 2), headTilt: 12, lookY: 0.5, look: 0.7}} look={IBU} expr="sad" reachR={{x: x - 10, y: FLOOR - 250}} />
        </g>
      ) : null}
      <Stickman
        x={x}
        y={FLOOR}
        scale={KID * 1.05}
        facing={1}
        pose={{...idle(t, 4), headTilt: 16 + sway, lookY: 0.6, look: 0.4}}
        look={ANAK}
        expr="sad"
        reachL={{x: chest.x + 24, y: chest.y - 24}}
        reachR={{x: chest.x + 30, y: chest.y + 20}}
      />
      <PhotoFrame x={chest.x + 30} y={chest.y} s={0.62} rot={-6} />
    </g>
  );
};

// ---------------------------------------------------------------- 12-13. Hugging the photo; the camera starts to pull away
const S12Peluk: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [30, 175, 2.3], [20, 160, 1.9])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Hug t={t} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const S13Telepon: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, 150, 1.6], [-40, 130, 1.25])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Hug t={t} withMother={prog(frame, 6, 30)} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 14. Outside, pulling far back; fade to black; the closing line
const S14Akhir: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const speechEnd = CUES[CUES.length - 1].to - AY_SCENES[13].from;
  const dark = prog(frame, speechEnd + 6, speechEnd + 36, eInOut);
  const text = prog(frame, speechEnd + 34, speechEnd + 60, eInOut);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{opacity: 1 - dark}}>
        <Camera2D cam={cam(frame, Math.max(1, speechEnd + 36), [60, 0, 1.6], [40, 60, 0.85])} t={t} background={NIGHT}>
          <Layer depth={0.3}>
            <SkyBand top="#03050A" bottom="#151B2C" />
          </Layer>
          <Layer depth={1}>
            <rect x={-2000} y={FLOOR} width={4000} height={1200} fill="#16140F" />
            <g transform={`translate(80 ${FLOOR - 40}) scale(1.4) translate(-80 ${-FLOOR})`}>
              <House x={80} y={FLOOR} night={1} windowLight={1} />
              <circle cx={-190} cy={FLOOR - 240} r={22} fill="#2A1E14" />
              <circle cx={-140} cy={FLOOR - 250} r={26} fill="#2A1E14" />
            </g>
            <Road y={FLOOR + 120} />
            <StreetLamp x={-420} y={FLOOR + 120} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", opacity: text, padding: "0 110px"}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 56, lineHeight: 1.3, color: "#EDE6D6", textAlign: "center"}}>
          Jangan tunggu kehilangan untuk menyadari betapa berharganya seseorang.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENE_LIST = [S1Pamit, S2Malam, S3Kerja, S4Paksa, S5Nafkah, S6Jalan, S7Helm, S8Dapur, S9Tanya, S10Sepi, S11Kursi, S12Peluk, S13Telepon, S14Akhir];

// Slow dissolves throughout; a hard cut into the aftermath keeps the black after the flash.
const TRANSITIONS: TransitionKind[] = ["fade", "fade", "fade", "fade", "fade", "cut", "fade", "fade", "fade", "fade", "fade", "fade", "fade"];

/** A warm-to-cool colour grade and a soft vignette over the whole film. */
const Grade: React.FC<{frame: number}> = ({frame}) => {
  const night = frame > AY_SCENES[6].from ? 1 : 0;
  return (
    <>
      <AbsoluteFill style={{pointerEvents: "none", backgroundColor: night ? "#1A2440" : "#FFB070", opacity: 0.08, mixBlendMode: "soft-light"}} />
      <Vignette frame={frame} strength={0.7} />
    </>
  );
};

export const AyahPulang: React.FC<{narration?: string}> = ({narration}) => {
  const frame = useSceneFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <ScenesWithTransitions
        scenes={AY_SCENES}
        kinds={TRANSITIONS}
        background="#000"
        render={(i) => {
          const Scene = SCENE_LIST[i];
          return <Scene len={AY_SCENES[i].len} />;
        }}
      />
      <Grade frame={frame} />
      <CaptionTrack cues={CUES} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};

