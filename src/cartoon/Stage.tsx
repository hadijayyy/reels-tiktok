import React from "react";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {AbsoluteFill, getInputProps} from "remotion";
import {useSceneFrame} from "../camera/Transitions";
import {eInOut, eIn, eOut, clamp, Ease} from "../motion/ease";
import {FPS, H, W} from "../styles/palette";
import {ProbeCtx} from "../story/probe";
import {DRAFT, HQ} from "./quality";
import {canvasTex, LightName, LightSpec, LIGHTS, LookName, LOOKS, LookSpec} from "./look";

/*
 * <Stage>: one 3D shot. A ThreeCanvas with the look (kartun / diorama), the light preset, the sky,
 * a keyframed camera, and the 2D grade on top (colour, vignette, tilt-shift, memory tint).
 *
 *   <Stage look="kartun" light="siang" cam={[
 *       {f: 0,   pos: [0, 1.6, 6.5], at: [0, 1.1, 0]},
 *       {f: len, pos: [0, 1.5, 4.8], at: [0, 1.1, 0]},     // slow push-in over the scene
 *     ]}>
 *     <Room ... /> <Toon ... />
 *   </Stage>
 *
 * Inside, every piece reads the frame and the camera with useStage(): {f, t, look, spec, light, cam, project}.
 * frameY: where the camera target lands on screen (0 = top, 1 = bottom). Default 0.42 keeps the subject
 * above the caption band without aiming the camera at the floor.
 */

export type V3 = [number, number, number];
export type CamKey = {f: number; pos: V3; at: V3; fov?: number; ease?: "io" | "in" | "out" | "lin" | "cut"};
export type CamNow = {pos: V3; at: V3; fov: number};

/** Default vertical field of view (degrees). On a 9:16 frame the horizontal view is much narrower: see visibleWidth(). */
export const FOV = 44;

/** Width in metres the camera sees at distance d (9:16 frame). Keep the cast inside ~70 % of it. */
export const visibleWidth = (d: number, fov = FOV) => 2 * d * Math.tan((fov * Math.PI) / 360) * (W / H);

const EASES: Record<string, Ease> = {io: eInOut, in: eIn, out: eOut, lin: (x) => x};

/** The camera at frame f from keys sorted by f. A key with ease "cut" jumps there instead of moving. */
export const camAt = (f: number, keys: CamKey[]): CamNow => {
  const fov0 = FOV;
  const at = (k: CamKey): CamNow => ({pos: k.pos, at: k.at, fov: k.fov ?? fov0});
  if (f <= keys[0].f) return at(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (f < b.f) {
      const a = keys[i - 1];
      if (b.ease === "cut") return at(a);
      const e = (EASES[b.ease ?? "io"] ?? eInOut)(clamp((f - a.f) / (b.f - a.f)));
      const l = (x: number, y: number) => x + (y - x) * e;
      return {pos: [l(a.pos[0], b.pos[0]), l(a.pos[1], b.pos[1]), l(a.pos[2], b.pos[2])], at: [l(a.at[0], b.at[0]), l(a.at[1], b.at[1]), l(a.at[2], b.at[2])], fov: l(a.fov ?? fov0, b.fov ?? fov0)};
    }
  }
  return at(keys[keys.length - 1]);
};

/** A camera position on a circle around `at`: distance d, height y, angle deg (0 = in front, +z). */
export const orbit = (at: V3, d: number, y: number, deg: number): V3 => [at[0] + Math.sin((deg * Math.PI) / 180) * d, y, at[2] + Math.cos((deg * Math.PI) / 180) * d];

export const checking = () => {
  try {
    return Boolean((getInputProps() as {check?: boolean}).check);
  } catch {
    return false;
  }
};

export type StageInfo = {
  f: number;
  t: number;
  look: LookName;
  spec: LookSpec;
  light: LightSpec;
  cam: CamNow;
  check: boolean;
  /** probe mode: the global frame being checked (nothing is drawn); null when rendering normally */
  probe: number | null;
  /** world point -> screen pixels [x, y] on the 1080 x 1920 frame */
  project: (p: V3) => [number, number];
};

const StageCtx = React.createContext<StageInfo | null>(null);
export const useStage = () => {
  const s = React.useContext(StageCtx);
  if (!s) throw new Error("useStage() outside <Stage>");
  return s;
};

const makeCamera = (c: CamNow, frameY: number) => {
  const cam = new THREE.PerspectiveCamera(c.fov, W / H, 0.05, 400);
  cam.position.set(...c.pos);
  cam.lookAt(new THREE.Vector3(...c.at));
  cam.setViewOffset(W, H, 0, (0.5 - frameY) * H, W, H);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
};

/** Applies the camera every frame (inside the canvas). */
/** Check mode: warns when the camera sits inside a solid (a wall, a house, a prop), seen from the scene graph. */
const insideSolid = (scene: THREE.Scene, p: THREE.Vector3) => {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  let hit: string | null = null;
  scene.traverse((o) => {
    if (hit || !(o as THREE.Mesh).isMesh) return;
    const m = o as THREE.Mesh;
    const mat = m.material as THREE.Material;
    if (mat.side === THREE.BackSide || mat.transparent) return; // ink hulls, cards, glows
    box.setFromObject(m);
    box.getSize(size);
    if (Math.min(size.x, size.y, size.z) < 0.05 || Math.max(size.x, size.y, size.z) > 30) return; // planes, ground, sea
    box.expandByScalar(-0.03);
    if (box.containsPoint(p)) hit = `${m.geometry.type} ${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)} m`;
  });
  return hit;
};

const CamRig: React.FC<{c: CamNow; frameY: number; check: boolean}> = ({c, frameY, check}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  React.useLayoutEffect(() => {
    camera.fov = c.fov;
    camera.near = 0.05;
    camera.far = 400;
    camera.position.set(...c.pos);
    camera.lookAt(new THREE.Vector3(...c.at));
    camera.setViewOffset(W, H, 0, (0.5 - frameY) * H, W, H);
    camera.updateProjectionMatrix();
    if (check) {
      const hit = insideSolid(scene, camera.position);
      if (hit) console.warn(`KAMERA DI DALAM BENDA: kamera [${c.pos.map((v) => v.toFixed(1)).join(", ")}] ada di dalam ${hit}`);
    }
  });
  return null;
};

const skyTex = (top: string, bottom: string) =>
  canvasTex(`sky|${top}|${bottom}`, 8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top);
    gr.addColorStop(0.62, bottom);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }, false);

const Sky: React.FC<{top: string; bottom: string}> = ({top, bottom}) => {
  const scene = useThree((s) => s.scene);
  React.useLayoutEffect(() => {
    scene.background = skyTex(top, bottom);
  }, [scene, top, bottom]);
  return null;
};

export type StageProps = {
  look?: LookName;
  light?: LightName;
  cam: CamKey[] | CamKey;
  frameY?: number;
  /** handheld drift in metres (0.02 = calm documentary, 0.06 = tense) */
  hand?: number;
  /** impacts: [frame, strength 0..1]; shakes the camera for ~10 frames */
  shake?: [number, number][];
  sky?: [string, string];
  /** sun direction override (where light comes FROM) */
  sun?: V3;
  /** half-size in metres of the area that receives sharp shadows (default 9) */
  shadowSize?: number;
  fog?: boolean;
  /** extra CSS filter on the 3D picture (e.g. "grayscale(1)") */
  filter?: string;
  /** brightness multiplier, e.g. 0.6 for a dim room */
  exposure?: number;
  children: React.ReactNode;
  /** 2D overlay drawn above the 3D picture but under the vignette (titles, arrows) */
  overlay?: React.ReactNode;
};

const noise = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.9 + s * 2.1) * 0.3 + Math.sin(t * 5.1 + s * 0.7) * 0.1;

export const Stage: React.FC<StageProps> = ({look = "kartun", light = "siang", cam, frameY, hand = 0.015, shake = [], sky, sun, shadowSize = 9, fog = true, filter, exposure = 1, children, overlay}) => {
  const f = useSceneFrame();
  const t = f / FPS;
  const spec = LOOKS[look];
  const L = LIGHTS[light];
  const keys = Array.isArray(cam) ? cam : [cam];
  const base = camAt(f, keys);
  // handheld drift + impact shake, applied to both eye and target so the framing holds
  let jx = noise(t, 1) * hand;
  let jy = noise(t, 2) * hand * 0.7;
  for (const [sf, k] of shake) {
    const d = f - sf;
    if (d >= 0 && d < 12) {
      const a = k * 0.09 * (1 - d / 12);
      jx += Math.sin(d * 2.7) * a;
      jy += Math.cos(d * 3.3) * a;
    }
  }
  const c: CamNow = {pos: [base.pos[0] + jx, base.pos[1] + jy, base.pos[2]], at: [base.at[0] + jx * 0.6, base.at[1] + jy * 0.6, base.at[2]], fov: base.fov};
  const fy = frameY ?? spec.frameY;
  const projCam = makeCamera(c, fy);
  const probe = React.useContext(ProbeCtx);
  const check = checking() || probe !== null;
  const info: StageInfo = {
    f,
    t,
    look,
    spec,
    light: L,
    cam: c,
    check,
    probe: probe ? probe.frame : null,
    project: (p) => {
      const v = new THREE.Vector3(...p).project(projCam);
      return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
    },
  };
  // probe mode: run the checks of the cast and labels, draw nothing
  if (probe) return <StageCtx.Provider value={info}>{children}</StageCtx.Provider>;
  const s = sun ?? spec.sun ?? L.sun;
  const sv = new THREE.Vector3(...s).normalize().multiplyScalar(20);
  const at = new THREE.Vector3(...c.at);
  const skyCols = sky ?? L.sky;
  const css = `saturate(${spec.saturate}) contrast(${spec.contrast}) brightness(${spec.brightness * exposure})${filter ? " " + filter : ""}`;
  return (
    <AbsoluteFill style={{backgroundColor: skyCols[1]}}>
      <AbsoluteFill style={{filter: css}}>
        <ThreeCanvas width={W} height={H} dpr={HQ ? 2 : 1} shadows flat gl={{antialias: !DRAFT}} camera={{fov: c.fov, position: c.pos, near: 0.05, far: 400}}>
          <StageCtx.Provider value={info}>
            <CamRig c={c} frameY={fy} check={check} />
            <Sky top={skyCols[0]} bottom={skyCols[1]} />
            {fog ? <fog attach="fog" args={[L.fog, L.fogNear, L.fogFar]} /> : null}
            <hemisphereLight args={[L.hemiSky, L.hemiGround, L.hemiI]} />
            <Sun pos={[at.x + sv.x, at.y + sv.y, at.z + sv.z]} at={[at.x, at.y, at.z]} color={L.sunColor} intensity={L.sunI} size={shadowSize} />
            {children}
          </StageCtx.Provider>
        </ThreeCanvas>
      </AbsoluteFill>
      {overlay}
      <Grade spec={spec} light={L} />
    </AbsoluteFill>
  );
};

/** The sun: a shadow-casting directional light whose target lives in the scene (so its matrix updates). */
const Sun: React.FC<{pos: V3; at: V3; color: string; intensity: number; size: number}> = ({pos, at, color, intensity, size}) => {
  const light = React.useMemo(() => {
    const l = new THREE.DirectionalLight();
    l.castShadow = true;
    l.shadow.mapSize.set(DRAFT ? 512 : HQ ? 4096 : 2048, DRAFT ? 512 : HQ ? 4096 : 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    return l;
  }, []);
  light.position.set(...pos);
  light.target.position.set(...at);
  light.color.set(color);
  light.intensity = intensity;
  const sc = light.shadow.camera;
  sc.left = -size;
  sc.right = size;
  sc.top = size;
  sc.bottom = -size;
  sc.near = 1;
  sc.far = 60;
  sc.updateProjectionMatrix();
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

/** Tilt-shift (diorama), memory tint, vignette. Pure CSS over the canvas. */
const Grade: React.FC<{spec: LookSpec; light: LightSpec}> = ({spec, light}) => (
  <>
    {spec.tilt > 0 ? (
      <>
        <AbsoluteFill style={{backdropFilter: `blur(${spec.tilt}px)`, WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 26%, transparent 66%, black 100%)", maskImage: "linear-gradient(to bottom, black 0%, transparent 26%, transparent 66%, black 100%)"}} />
      </>
    ) : null}
    {light.overlay ? <AbsoluteFill style={{backgroundColor: light.overlay, mixBlendMode: "soft-light"}} /> : null}
    <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 62% at 50% 44%, transparent 55%, rgba(20,10,20,${spec.vignette}) 100%)`}} />
  </>
);
