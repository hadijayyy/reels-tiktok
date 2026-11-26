#!/usr/bin/env bash
# Everything after the layout check, in one command: music -> mix -> render -> verify -> pacing.
#   scripts/finish.sh <slug> <CompositionId> [mood=calm|horror|piano|space] [peak/hit] [music volume=0.22]
# 3D films (src/cartoon kit) need WebGL: GL=swangle (cloud, no GPU) or GL=angle (PC with a GPU).
# Needs src/scenes/<slug>Timing.ts and public/audio/<slug>-narasi.wav (from make_narration.py).
# Uses the TTS virtualenv (../tts-venv) for make_music.py, which needs soundfile; override with TTS_VENV.
# Writes public/audio/<slug>.mp3 (-14 LUFS) and out/<slug>.mp4, then runs ffprobe and check_pacing.py on the result.
# After a fix to some scenes, skip this script: node scripts/render_parts.mjs <Id> <slug> --scene 3,5 (minutes).
set -euo pipefail
slug="$1"; id="$2"; mood="${3:-calm}"; peak="${4:-}"; vol="${5:-0.22}"
cd "$(dirname "$0")/.."
venv="${TTS_VENV:-../tts-venv}"
frames=$(sed -n 's/^export const FRAMES = \([0-9]*\);.*/\1/p' "src/scenes/${slug}Timing.ts")
[ -n "$frames" ] || { echo "no FRAMES in src/scenes/${slug}Timing.ts"; exit 1; }
seconds=$(python3 -c "print(round($frames/30, 1))")
echo "== $slug: $frames frames = $seconds s"

echo "== music ($mood)"
# shellcheck disable=SC1091
. "$venv/bin/activate"
python scripts/make_music.py "$slug" "$seconds" "$mood" $peak
deactivate

echo "== mix"
scripts/mix_audio.sh "$slug" "$seconds" "$vol"

echo "== render"
# in parts (scripts/render_parts.mjs): later fixes re-render only the changed scenes with --scene
node scripts/render_parts.mjs "$id" "$slug" ${GL:+--gl $GL} 2>&1 | grep -v "^Memory\|docker\|Detected differing\|lower amount\|THREE\|swiftshader\|Tab [0-9]" | tail -4

echo "== verify"
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate:format=duration -of default=nw=1 "out/$slug.mp4"
python3 scripts/check_pacing.py "out/$slug.mp4"
echo "== done: out/$slug.mp4 (look at a few frames, and still listen to the voice)"
