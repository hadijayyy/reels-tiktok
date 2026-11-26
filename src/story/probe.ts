import React from "react";
import {getInputProps} from "remotion";

/*
 * Layout probe: `--props='{"probe":true,"check":true}'` turns a Film into a checker. Remotion frame N then
 * evaluates scene N at every `step`-th scene frame (and right after every caption cue) WITHOUT drawing it:
 * the 3D kit skips WebGL and the character canvases, and only runs its safe-area and visibility checks,
 * which print "<KIND> [f=<global frame>]: ..." to the browser console. scripts/check_layout.mjs collects them.
 */

export type ProbeInfo = {scene: number; frame: number};
export const ProbeCtx = React.createContext<ProbeInfo | null>(null);

const props = () => {
  try {
    return getInputProps() as {probe?: boolean; step?: number};
  } catch {
    return {} as {probe?: boolean; step?: number};
  }
};
export const probing = () => Boolean(props().probe);
export const probeStep = () => Math.max(1, Number(props().step ?? 3));
