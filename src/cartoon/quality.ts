import {getInputProps} from "remotion";

/**
 * Draft quality (`--props='{"draft":true}'`, set by render_parts.mjs --draft): smaller shadow map, no MSAA,
 * lower-resolution character cards and a cheaper sticker rim. Same framing and timing as the final render.
 */
export const DRAFT = (() => {
  try {
    return Boolean((getInputProps() as {draft?: boolean}).draft);
  } catch {
    return false;
  }
})();
