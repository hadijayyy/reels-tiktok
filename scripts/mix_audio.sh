#!/usr/bin/env bash
# Mix narration and backing music into public/audio/<slug>.mp3, normalised to -14 LUFS (TikTok/Reels/Shorts).
#   scripts/mix_audio.sh <slug> <seconds> [music volume, default 0.22; 0 = narration only]
# Two-pass loudnorm: pass 1 measures the mix, pass 2 applies a linear gain with those numbers. A single pass
# on a short clip undershoots (the first version landed at -17 LUFS for a -15 target).
set -euo pipefail
slug="$1"; seconds="$2"; vol="${3:-0.22}"
target="${LUFS:--14}"
cd "$(dirname "$0")/../public/audio"
mix="[0:a]aresample=44100,apad=whole_dur=$seconds[v];[1:a]volume=$vol[m];[v][m]amix=inputs=2:duration=longest:normalize=0"
stats=$(ffmpeg -hide_banner -nostats -y -i "$slug-narasi.wav" -i "$slug-musik.wav" -filter_complex \
  "$mix,loudnorm=I=$target:TP=-1.0:LRA=11:print_format=json[a]" -map "[a]" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { python3 -c "import json,sys; print(json.loads(sys.argv[1])['$1'])" "$stats"; }
ffmpeg -v error -y -i "$slug-narasi.wav" -i "$slug-musik.wav" -filter_complex \
  "$mix,loudnorm=I=$target:TP=-1.0:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=44100[a]" \
  -map "[a]" -b:a 192k "$slug.mp3"
lufs=$(ffmpeg -hide_banner -nostats -i "$slug.mp3" -af ebur128 -f null - 2>&1 | grep -A2 "Integrated loudness" | sed -n "s/^ *I: *//p")
echo "public/audio/$slug.mp3 ($lufs)"
