#!/usr/bin/env bash
# Mix narration and backing music into public/audio/<slug>.mp3.
#   scripts/mix_audio.sh <slug> <seconds> [music volume, default 0.22; 0 = narration only]
set -euo pipefail
slug="$1"; seconds="$2"; vol="${3:-0.22}"
cd "$(dirname "$0")/../public/audio"
ffmpeg -v error -y -i "$slug-narasi.wav" -i "$slug-musik.wav" -filter_complex \
  "[0:a]aresample=44100,apad=whole_dur=$seconds[v];[1:a]volume=$vol[m];[v][m]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100[a]" \
  -map "[a]" -b:a 192k "$slug.mp3"
echo "public/audio/$slug.mp3"
