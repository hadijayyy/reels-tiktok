import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Cam, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Monitor, OfficeChair, Wall} from "../environment/Furniture";
import {DiningTable, F, House, SideChair, SkyBand} from "../environment/FamilyProps";
import {StoppedClock, Vignette} from "../environment/HorrorProps";
import {BigPhone} from "../environment/MoneyProps";
import {AKU, CallScreen, earPhone, ChatSent, CitySkyline, FoldedScarf, IBU_DESA, Ketupat, Medicine, MissedCalls, QuietScreen, Sandals, Tears, VoiceMessage} from "../environment/MotherProps";
import {clamp, eInOut, eOut, keysObj, lerp, prog} from "../motion/ease";
import {idle, sit, STRIDE, typing, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Pose, Stickman} from "../rig/Stickman";
import {C, FONT, FPS} from "../styles/palette";
import {CUES, SCENES as IB_SCENES} from "./ibuTiming";

/*
 * PESAN TERAKHIR DARI IBU — a 13-scene first-person story (about 70 s), stickman in a cinematic style.
 * A daughter who works in Jakarta tells it: her mother's 7 p.m. calls, the calls she let ring, the
 * night the phone stayed quiet, the neighbour's call, the empty chair, and an unsent voice message.
 * The death is never shown, only the empty house. Narration: scripts/narasi/ibu.txt.
 */

export {FRAMES as IBU_FRAMES} from "./ibuTiming";

const S = 1.5;
const NIGHT = "#0B0E16";

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => CUES[cue].from - IB_SCENES[scene].from;

const cam = (frame: number, len: number, a: [number, number, number], b: [number, number, number]) =>
  keysObj(frame, [
    [0, {x: a[0], y: a[1], zoom: a[2], rot: 0}],
    [len, {x: b[0], y: b[1], zoom: b[2], rot: 0}],
  ], eInOut);

const Room: React.FC<{wall?: string}> = ({wall = F.roomWallNight}) => (
  <>
    <Wall x0={-1600} x1={1600} y0={-1400} y1={FLOOR} color={wall} />
    <Floor x0={-1600} x1={1600} />
  </>
);

const HangingLamp: React.FC<{x: number; y: number; on?: number}> = ({x, y, on = 1}) => (
  <g>
    <line x1={x} y1={y - 600} x2={x} y2={y} stroke="#222" strokeWidth={3} />
    <path d={`M ${x - 46} ${y + 30} L ${x - 20} ${y} L ${x + 20} ${y} L ${x + 46} ${y + 30} Z`} fill="#6A4A30" stroke={C.ink} strokeWidth={3} />
    <circle cx={x} cy={y + 34} r={10} fill={on ? F.warm : "#444"} />
    {on ? <Glow x={x} y={y + 140} r={620} color={F.warm} opacity={0.22 * on} /> : null}
  </g>
);

/** The office at night: a window over the city, a desk with a monitor and a phone. */
const Office: React.FC<{t: number; screenOn?: boolean}> = ({t, screenOn = true}) => (
  <g>
    <Wall x0={-1600} x1={1600} y0={-1400} y1={FLOOR} color="#1C2230" />
    <g>
      <rect x={-520} y={-520} width={1040} height={560} fill="#0A0F1C" stroke="#2A3242" strokeWidth={12} />
      <CitySkyline x0={-520} x1={520} y={40} />
      <line x1={0} y1={-520} x2={0} y2={40} stroke="#2A3242" strokeWidth={10} />
    </g>
    <Floor x0={-1600} x1={1600} />
    <Desk x={150} w={460} top={150} />
    <Monitor
      x={210}
      y={FLOOR - 150 - 38}
      on={screenOn ? 1 : 0}
      screen={
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={14} y={16 + i * 24} width={50 + ((i * 47 + Math.floor(t * 5) * 29) % 140)} height={10} rx={3} fill={i % 2 ? "#8FB0D8" : "#CFE0F0"} opacity={0.8} />
          ))}
        </g>
      }
    />
  </g>
);

/** The seated narrator typing at the office desk. `pose` overrides the typing pose. */
const AtDesk: React.FC<{t: number; pose?: Pose; expr?: "focused" | "neutral" | "worried" | "sad" | "surprised"; look?: Look; earPhone?: boolean}> = ({t, pose, expr = "focused", look = AKU, earPhone}) => {
  const chair = {x: -60, floorY: FLOOR, facing: 1 as const, seat: 87};
  const seat = seatedAnchor(chair, S);
  const keyY = FLOOR - 150 - 6;
  return (
    <g>
      <OfficeChair x={chair.x} y={FLOOR} facing={1} seat={87} />
      <rect x={40} y={keyY - 8} width={110} height={8} rx={2} fill={C.steel} stroke={C.ink} strokeWidth={2} />
      <Stickman
        x={seat.hip.x}
        y={seat.hip.y}
        anchor="hip"
        scale={S}
        pose={pose ?? typing(t)}
        look={look}
        expr={expr}
        footL={seat.footL}
        footR={seat.footR}
        reachL={earPhone ? earSeated(seat.hip.x, seat.hip.y) : pose ? undefined : {x: 70, y: keyY}}
        reachR={pose ? undefined : {x: 100, y: keyY}}
      />
    </g>
  );
};

/** Hand target that puts a handPhone at the ear of a standing figure at x (scale S, facing right). */
const ear = (x: number) => ({x: x - 52, y: FLOOR - 296});
/** The same for a figure seated with its hip at (x, y). */
const earSeated = (x: number, y: number) => ({x: x - 46, y: y - 176});

/** A small "on a call" badge: a handset in a circle with sound waves, beside a head at (x, y). */
const CallBadge: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 1].map((i) => (
      <path key={i} d={`M ${34 + i * 16} -22 q 14 22 0 44`} stroke="#EDE6D6" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.4 + 0.4 * Math.max(0, Math.sin(t * 5 - i))} />
    ))}
    <circle r={28} fill="#3BAA5C" stroke={C.ink} strokeWidth={3} />
    <path d="M -12 -12 q -4 14 8 26 q 12 12 26 8 l 2 -9 l -10 -5 l -5 5 q -9 -4 -13 -13 l 5 -5 l -5 -10 Z" fill="#FFFFFF" transform="translate(-2 -2) scale(0.9)" />
  </g>
);

/** A big floating phone with a screen, centred on (x, y); `buzz` shakes it. */
const Phone: React.FC<{x: number; y: number; s?: number; buzz?: number; t: number; children: React.ReactNode}> = ({x, y, s = 1, buzz = 0, t, children}) => (
  <g transform={`translate(${x + Math.sin(t * 70) * 6 * buzz} ${y}) rotate(${Math.sin(t * 55) * 2 * buzz}) scale(${s}) translate(${-x} ${-y})`}>
    <BigPhone x={x} y={y} w={300} h={420}>
      {children}
    </BigPhone>
  </g>
);

// ---------------------------------------------------------------- 1. The voice message, in the dark
const S1Pesan: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const glow = prog(frame, 4, 24);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -40, 1.2], [0, -60, 1.4])} t={t} background="#050608">
        <Layer depth={1}>
          <Glow x={0} y={-60} r={520} color="#CFE6FF" opacity={0.16 * glow} />
          <g opacity={glow}>
            <Phone x={0} y={-60} s={1.3} t={t}>
              <VoiceMessage play={0} t={t} status="1 pesan suara · dari Ibu" />
            </Phone>
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. Jakarta, working late
const S2Rantau: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -60, 0.95], [40, 80, 1.15])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Office t={t} />
          <AtDesk t={t} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. Seven o'clock: the phone buzzes. Ibu.
const S3JamTujuh: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const buzz = cueAt(6, 2);
  const ringing = frame >= buzz;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -140, 1.1], [0, -160, 1.2])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Wall x0={-1600} x1={1600} y0={-1400} y1={FLOOR} color="#1C2230" />
          <StoppedClock x={0} y={-560} r={70} h={7} m={0} />
          <Glow x={0} y={-130} r={460} color="#BFE6C8" opacity={ringing ? 0.15 : 0} />
          <Phone x={0} y={-130} t={t} buzz={ringing ? 1 : 0}>
            {ringing ? <CallScreen name="Ibu" t={t} /> : <QuietScreen time="19.00" />}
          </Phone>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** A camera for one half of a split screen: centres world point (x, y) at screen height sy. */
const halfCam = (x: number, y: number, sy: number, zoom: number): Cam => ({x, y: y - (sy - 960) / zoom, zoom, rot: 0});

// ---------------------------------------------------------------- 4. Split: Ibu asks; I answer from the office
const S4Split: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const z = 1.05 + 0.08 * prog(frame, 0, len);
  const divider = prog(frame, 0, 12, eOut);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{clipPath: "inset(0 0 50% 0)"}}>
        <Camera2D cam={halfCam(0, 200, 470, z)} t={t} background={NIGHT}>
          <Layer depth={1}>
            <Room wall="#4A3B30" />
            <HangingLamp x={-200} y={-200} />
            <Stickman x={60} y={FLOOR} scale={S} facing={1} pose={{...idle(t, 2), look: 0.6}} look={{...IBU_DESA, handL: earPhone()}} expr="happy" reachL={ear(60)} />
            <CallBadge x={190} y={FLOOR - 380} t={t} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill style={{clipPath: "inset(50% 0 0 0)"}}>
        <Camera2D cam={halfCam(60, 220, 1150, z)} t={t} background={NIGHT}>
          <Layer depth={1}>
            <Office t={t} />
            <AtDesk t={t} pose={{...sit(t), look: 0.8}} look={{...AKU, handL: earPhone()}} expr="neutral" earPhone />
            <CallBadge x={40} y={FLOOR - 290} t={t} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill>
        <div style={{position: "absolute", top: 957, left: 540 - 540 * divider, width: 1080 * divider, height: 6, background: "#EDE6D6", opacity: 0.8}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. Missed calls pile up; "Lagi sibuk, Bu."
const S5Abai: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const rows = cueAt(12, 4);
  const chat = cueAt(13, 4);
  const n = Math.min(4, Math.floor(clamp((frame - rows + 4) / 9, 0, 4)));
  const toChat = prog(frame, chat - 6, chat + 4, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -120, 1.15], [0, -140, 1.25])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Office t={t} />
          <rect x={-1600} y={-1400} width={3200} height={2400} fill="#000" opacity={0.55} />
          <g opacity={1 - toChat}>
            <Phone x={0} y={-130} t={t}>
              <MissedCalls n={frame < rows ? 1 : Math.max(1, n)} />
            </Phone>
          </g>
          <g opacity={toChat}>
            <Phone x={0} y={-130} t={t}>
              <ChatSent text="Lagi sibuk, Bu." k={prog(frame, chat, chat + 12, eOut)} />
            </Phone>
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. Lebaran: Ibu alone at the table
const S6Lebaran: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const ibuSeat = seatedAnchor({x: -360, floorY: FLOOR, seat: 92, facing: 1}, S);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [60, 40, 1.0], [-120, 60, 1.25])} t={t}>
        <Layer depth={1}>
          <Room wall="#5A4A3A" />
          <Glow x={-100} y={-200} r={700} color="#FFE2A8" opacity={0.18} />
          {[-300, -60, 180, 420].map((x, i) => (
            <Ketupat key={x} x={x} y={-420 + (i % 2) * 40} s={1.1} sway={Math.sin(t * 1.4 + i) * 4} />
          ))}
          <SideChair x={-360} y={FLOOR} facing={1} />
          <Stickman x={ibuSeat.hip.x} y={ibuSeat.hip.y} anchor="hip" scale={S} pose={{...sit(t, 2), headTilt: 8, lookY: 0.3, look: 0.9}} look={IBU_DESA} expr="calm" footL={ibuSeat.footL} footR={ibuSeat.footR} />
          <DiningTable x={60} y={FLOOR} w={600} plates={[-130, 250]} />
          {/* ketupat and opor on the table */}
          {[-40, 10, 60].map((x, i) => (
            <path key={x} d={`M ${x} ${FLOOR - 200} l 20 20 l -20 20 l -20 -20 z`} fill="#7FA34A" stroke={C.ink} strokeWidth={2} transform={`translate(${i * 4} 0)`} />
          ))}
          <ellipse cx={130} cy={FLOOR - 182} rx={46} ry={14} fill="#D8B060" stroke={C.ink} strokeWidth={2} />
          <SideChair x={470} y={FLOOR} facing={-1} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. Ibu coughs, takes medicine, then smiles into the phone
const S7Sakit: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const call = cueAt(19, 6);
  const onCall = frame >= call - 6;
  const cough = !onCall ? Math.max(0, Math.sin(t * 9)) * (frame % 60 < 30 ? 1 : 0) : 0;
  const pose: Pose = onCall
    ? {...idle(t, 2), look: 0.5}
    : {...idle(t, 2), lean: 10 + cough * 10, headTilt: 10 + cough * 8, shR: 140, elR: 120};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -10, 1.45], [20, -30, 1.6])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Room wall="#4A3B30" />
          <HangingLamp x={-160} y={-420} />
          <rect x={160} y={FLOOR - 150} width={240} height={14} fill="#7A5A3A" stroke={C.ink} strokeWidth={3} />
          <rect x={176} y={FLOOR - 136} width={12} height={136} fill="#5A3E28" />
          <rect x={372} y={FLOOR - 136} width={12} height={136} fill="#5A3E28" />
          <Medicine x={250} y={FLOOR - 150} />
          <Stickman x={20} y={FLOOR} scale={S} facing={1} pose={pose} look={onCall ? {...IBU_DESA, handL: earPhone()} : IBU_DESA} expr={onCall ? "happy" : "worried"} reachL={onCall ? ear(20) : undefined} />
          {onCall ? <CallBadge x={150} y={FLOOR - 380} t={t} /> : null}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8. Seven o'clock passes; the phone stays dark
const S8Diam: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const minutes = Math.round(lerp(0, 62, prog(frame, 10, len - 20, eInOut)));
  const h = 19 + Math.floor(minutes / 60);
  const m = minutes % 60;
  const glance = Math.sin(t * 1.6) > 0.3;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [60, -60, 1.0], [140, -40, 1.2])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Office t={t} />
          <StoppedClock x={380} y={-640} r={64} h={h} m={m} />
          <AtDesk t={t} pose={{...sit(t), shL: 40, elL: 60, shR: 50, elR: 70, look: glance ? 0.9 : 0.3, lookY: glance ? 0.8 : 0.1, headTilt: glance ? 12 : 2}} expr="worried" />
          {/* the phone lying on the desk, dark */}
          <rect x={220} y={FLOOR - 160} width={70} height={10} rx={3} fill="#0A0A0C" stroke="#333" strokeWidth={2} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9. Morning: the neighbour calls
const S9Tetangga: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const answer = cueAt(23, 8);
  const answered = frame >= answer;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -60, 1.15], [0, 20, 1.45])} t={t}>
        <Layer depth={1}>
          <Room wall="#3C4250" />
          {/* morning light from a window */}
          <rect x={-480} y={-460} width={240} height={300} fill="#CFE0EE" stroke="#3A3A3A" strokeWidth={10} />
          <path d="M -240 -460 L 300 400 L -40 400 L -480 -160 Z" fill="#FFF6DA" opacity={0.08} />
          {!answered ? (
            <Phone x={150} y={-260} s={0.8} t={t} buzz={1}>
              <CallScreen name="Bu Yati (tetangga)" t={t} color="#6A7A9A" />
            </Phone>
          ) : null}
          <Stickman
            x={-60}
            y={FLOOR}
            scale={S}
            facing={1}
            pose={answered ? {...idle(t), lean: 4, headTilt: 6} : {...idle(t), look: 0.8, lookY: -0.4}}
            reachL={answered ? ear(-60) : undefined}
            look={answered ? {...AKU, handL: earPhone()} : AKU}
            expr={answered ? (frame > answer + 30 ? "sad" : "surprised") : "worried"}
          />
          {answered ? <CallBadge x={70} y={FLOOR - 380} t={t} /> : null}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 10. Home: the same house, Ibu's sandals, the empty chair
const S10Pulang: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const inside = prog(frame, cueAt(26, 9) - 10, cueAt(26, 9) + 6, eInOut);
  const dist = 300 * prog(frame, 0, cueAt(25, 9), (v) => v);
  const walking = frame < cueAt(25, 9);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{opacity: 1 - inside}}>
        <Camera2D cam={cam(frame, len, [-40, 40, 0.95], [40, 80, 1.1])} t={t}>
          <Layer depth={0.3}>
            <SkyBand top="#8A96A6" bottom="#C9C2B4" />
          </Layer>
          <Layer depth={1}>
            <rect x={-2000} y={FLOOR} width={4000} height={1200} fill="#4A4036" />
            <g transform={`translate(80 ${FLOOR}) scale(1.6) translate(-80 ${-FLOOR})`}>
              <House x={80} y={FLOOR} doorOpen={1} />
            </g>
            <Sandals x={-120} y={FLOOR - 36} />
            <Stickman x={-420 + dist * 0.8} y={FLOOR} scale={S} facing={1} pose={walking ? walk(dist / (STRIDE * S), t) : {...idle(t), headTilt: 10, lookY: 0.6}} look={AKU} expr="sad" />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: inside}}>
        <Camera2D cam={cam(frame, len, [200, 60, 1.3], [260, 80, 1.6])} t={t} background={NIGHT}>
          <Layer depth={1}>
            <Room wall="#4A3B30" />
            <Glow x={260} y={100} r={380} color="#FFE2A8" opacity={0.14} />
            <SideChair x={260} y={FLOOR} facing={-1} />
            <FoldedScarf x={260} y={FLOOR - 96} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 11. Ibu's old phone: the unsent voice message plays
const S11Suara: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const quote = cueAt(29, 10);
  const play = prog(frame, quote - 4, Math.min(len - 4, quote + 50), (v) => v);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [0, -120, 1.15], [0, -140, 1.35])} t={t} background="#050608">
        <Layer depth={1}>
          <Glow x={0} y={-130} r={520} color="#CFE6FF" opacity={0.14} />
          <Phone x={0} y={-130} t={t}>
            <VoiceMessage play={play} t={t} status="belum terkirim · dari Ibu" />
          </Phone>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** The narrator sitting on the floor by Ibu's chair, holding Ibu's phone to her chest. */
const Grieve: React.FC<{t: number}> = ({t}) => {
  const hip = {x: -20, y: FLOOR - 14};
  const chest = {x: hip.x + 46, y: hip.y - 86};
  return (
    <g>
      <Room wall="#3A3029" />
      <HangingLamp x={120} y={-460} />
      <SideChair x={220} y={FLOOR} facing={-1} />
      <FoldedScarf x={220} y={FLOOR - 96} />
      <Stickman
        x={hip.x}
        y={hip.y}
        anchor="hip"
        scale={S}
        facing={1}
        pose={{...sit(t), hipL: 70, kneeL: 120, hipR: 74, kneeR: 124, headTilt: 18 + Math.sin(t * 1.3) * 2, lookY: 0.7, lean: 14}}
        look={AKU}
        expr="sad"
        footL={{x: hip.x + 100, y: FLOOR}}
        footR={{x: hip.x + 120, y: FLOOR}}
        reachL={{x: chest.x + 8, y: chest.y}}
        reachR={{x: chest.x + 14, y: chest.y + 14}}
      />
      <rect x={chest.x - 4} y={chest.y - 26} width={34} height={56} rx={6} fill="#22262C" stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

// ---------------------------------------------------------------- 12. Holding Ibu's phone, crying
const S12Peluk: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam(frame, len, [60, 210, 2.1], [70, 200, 1.8])} t={t} background={NIGHT}>
        <Layer depth={1}>
          <Grieve t={t} />
          <Tears x={60} y={FLOOR - 330} t={t} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 13. Pull away; fade to black; the closing line
const S13Akhir: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const speechEnd = CUES[CUES.length - 1].to - IB_SCENES[12].from;
  const dark = prog(frame, speechEnd + 6, speechEnd + 36, eInOut);
  const text = prog(frame, speechEnd + 34, speechEnd + 60, eInOut);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill style={{opacity: 1 - dark}}>
        <Camera2D cam={cam(frame, Math.max(1, speechEnd + 36), [60, 180, 1.6], [20, 120, 0.9])} t={t} background={NIGHT}>
          <Layer depth={1}>
            <Grieve t={t} />
          </Layer>
        </Camera2D>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", opacity: text, padding: "0 120px"}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 60, lineHeight: 1.3, color: "#EDE6D6", textAlign: "center"}}>
          Telepon ibumu hari ini.
          <br />
          Bukan nanti.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENE_LIST = [S1Pesan, S2Rantau, S3JamTujuh, S4Split, S5Abai, S6Lebaran, S7Sakit, S8Diam, S9Tetangga, S10Pulang, S11Suara, S12Peluk, S13Akhir];

// Slow dissolves; a hard cut into the neighbour's call.
const TRANSITIONS: TransitionKind[] = ["fade", "fade", "fade", "fade", "fade", "fade", "fade", "cut", "fade", "fade", "fade", "fade"];

/** A cool, slightly desaturated grade and a soft vignette over the whole film. */
const Grade: React.FC<{frame: number}> = ({frame}) => (
  <>
    <AbsoluteFill style={{pointerEvents: "none", backgroundColor: "#1A2440", opacity: 0.08, mixBlendMode: "soft-light"}} />
    <Vignette frame={frame} strength={0.7} />
  </>
);

export const PesanIbu: React.FC<{narration?: string}> = ({narration}) => {
  const frame = useSceneFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <ScenesWithTransitions
        scenes={IB_SCENES}
        kinds={TRANSITIONS}
        background="#000"
        render={(i) => {
          const Scene = SCENE_LIST[i];
          return <Scene len={IB_SCENES[i].len} />;
        }}
      />
      <Grade frame={frame} />
      <CaptionTrack cues={CUES} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
