import {getInputProps} from "remotion";

const props = (() => {
  try {
    return getInputProps() as {draft?: boolean; hq?: boolean};
  } catch {
    return {};
  }
})();

/**
 * Draft quality (`--props='{"draft":true}'`, set by render_parts.mjs --draft): smaller shadow map, no MSAA,
 * lower-resolution character cards and a cheaper sticker rim. Same framing and timing as the final render.
 */
export const DRAFT = Boolean(props.draft);

/**
 * High quality (`--props='{"hq":true}'`, set by render_parts.mjs --hq): the 3D picture is drawn at twice the
 * resolution and scaled down (supersampling: smoother ink lines and edges), with sharper character cards and
 * shadows. About 2-3x slower; meant for short films.
 */
export const HQ = Boolean(props.hq) && !props.draft;
