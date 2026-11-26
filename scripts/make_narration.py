"""Generate a film's narration with VoiceStudio's OmniVoice engine.

Needs a checkout of https://github.com/debpalash/VoiceStudio on PYTHONPATH and a Python
environment with torch, torchaudio, transformers, accelerate, pydub and soundfile:

    PYTHONPATH=/path/to/VoiceStudio python scripts/make_narration.py <slug> [language]
        [--voice "male, middle-aged"] [--speed 1.0]

It reads scripts/narasi/<slug>.txt (one line per scene, "|" splits a line into caption
phrases, "#" starts a comment, and {caption=speech} shows "caption" in the captions but
speaks "speech", e.g. {OJK=O J K} for an acronym the voice would read as a word, and a
trailing [jeda=1.5] adds 1.5 s of silence after that line, for a dramatic pause, *word* draws a
word in the accent colour, and [take=2] asks for a different take of that line), writes one WAV
per line to public/audio/<slug>-lines/, joins them into public/audio/<slug>-narasi.wav and writes
src/scenes/<slug>Timing.ts (scene lengths and caption cues, in frames) so the animation follows
the voice. Lines that already have a WAV are not generated again: delete the WAV to redo a line.
The voice model is only loaded when a line has to be generated.

Every line is then transcribed with faster-whisper (scripts/align_words.py): each caption cue gets
the frames of its words, so captions highlight word by word and cueAt() lands on the spoken phrase,
not on an estimate. Words the voice skipped or said differently are listed under "CEK SUARA";
redo such a line with [take=N] (the generator is deterministic, so the same text gives the same take).
Use --no-align to fall back to the old estimate (cue length proportional to the phrase length).
"""

import json
import re
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align_words import SPOKEN as SPOKEN_RE, align_line, transcribe  # noqa: E402

FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "audio")

VOICE = "male, young adult"   # voice design prompt for the first line
SPEED = 0.78                  # below 1 is slower; the model's default pace is too quick for captions
LEAD = 0.35                   # silence before the first line, seconds
GAP = 0.45                    # silence between lines
TAIL = 1.2                    # hold after the last line


def trim(wav: np.ndarray, sr: int, thresh: float = 0.01) -> np.ndarray:
    """Cut leading and trailing silence, keeping 40 ms of padding."""
    loud = np.where(np.abs(wav) > thresh)[0]
    if len(loud) == 0:
        return wav
    pad = int(0.04 * sr)
    return wav[max(0, loud[0] - pad) : loud[-1] + pad]


OMNIVOICE_REV = "c5fdb5ccb189668d56333f77ba2629f4cd7535f4"  # VoiceStudio tests/test_omnivoice_revision_pin.py


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("language", nargs="?", default="id")
    ap.add_argument("--voice", default=VOICE, help="voice design prompt (gender, age, pitch, style)")
    ap.add_argument("--speed", type=float, default=SPEED)
    ap.add_argument("--tail", type=float, default=TAIL, help="seconds held after the last line (e.g. for a closing title)")
    ap.add_argument("--seed", type=int, default=7, help="generator seed; a line's [take=N] adds N to it")
    ap.add_argument("--no-align", action="store_true", help="skip word alignment (cues estimated from phrase length)")
    args = ap.parse_args()
    slug, language, voice, speed = args.slug, args.language, args.voice, args.speed
    with open(os.path.join(ROOT, "scripts", "narasi", f"{slug}.txt"), encoding="utf-8") as f:
        LINES = [ln.strip() for ln in f if ln.strip() and not ln.startswith("#")]
    LINE_DIR = os.path.join(OUT_DIR, f"{slug}-lines")
    os.makedirs(LINE_DIR, exist_ok=True)
    PAUSE = re.compile(r"\s*\[jeda=([\d.]+)\]\s*")
    TAKE = re.compile(r"\s*\[take=(\d+)\]\s*")
    pauses = [float(m.group(1)) if (m := PAUSE.search(line)) else 0.0 for line in LINES]
    takes = [int(m.group(1)) if (m := TAKE.search(line)) else 0 for line in LINES]
    LINES = [TAKE.sub("", PAUSE.sub("", line)).strip() for line in LINES]
    RAW = LINES  # with {shown=spoken} and *emphasis* markup, for the word alignment
    texts = [SPOKEN_RE.sub(r"\2", line).replace("|", " ").replace("*", "") for line in LINES]
    LINES = [SPOKEN_RE.sub(r"\1", line).replace("*", "") for line in LINES]

    # Line 1 designs the voice; the other lines clone it, so the narrator stays the same person.
    ref_path = os.path.join(LINE_DIR, "line1.wav")
    model, sr = None, None
    clips = []
    for i, text in enumerate(texts):
        path = os.path.join(LINE_DIR, f"line{i + 1}.wav")
        if not os.path.exists(path):
            if model is None:
                import torch
                from omnivoice.models.omnivoice import OmniVoice

                # Pinned to VoiceStudio's reviewed revision, which bundles audio_tokenizer/. Load it with the
                # whole snapshot (snapshot_download) or OmniVoice falls back to a separate, licence-gated repo.
                from huggingface_hub import snapshot_download

                snapshot_download("k2-fsa/OmniVoice", revision=OMNIVOICE_REV)
                model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", revision=OMNIVOICE_REV, device_map="cpu", dtype=torch.float32)
            seed = args.seed + takes[i]
            if i == 0:
                audio = model.generate(text=text, language=language, instruct=voice, speed=speed, seed=seed)[0]
            else:
                audio = model.generate(text=text, language=language, ref_audio=ref_path, ref_text=texts[0], speed=speed, seed=seed)[0]
            wav = np.asarray(audio.cpu() if hasattr(audio, "cpu") else audio, dtype=np.float32).squeeze()
            sf.write(path, trim(wav, model.sampling_rate), model.sampling_rate)
        wav, sr = sf.read(path, dtype="float32")
        clips.append(wav)
        print(f"line {i + 1}: {len(wav) / sr:.2f}s", file=sys.stderr)

    # Join the lines and work out the timing.
    silence = lambda s: np.zeros(int(s * sr), dtype=np.float32)
    parts, scenes, cues = [silence(LEAD)], [], []
    cursor = LEAD
    for i, wav in enumerate(clips):
        dur = len(wav) / sr
        start, end = cursor, cursor + dur
        scene_from = 0 if i == 0 else round((start - GAP / 2) * FPS)
        scenes.append({"from": scene_from})
        phrases = LINES[i].split("|")
        if args.no_align:
            total = sum(len(p) for p in phrases)
            at = start
            for p in phrases:
                span = dur * len(p) / total
                cues.append({"from": round(at * FPS), "to": round((at + span) * FPS), "text": p})
                at += span
        else:
            units, problems = align_line(RAW[i].split("|"), transcribe(os.path.join(LINE_DIR, f"line{i + 1}.wav"), language), dur)
            for prob in problems:
                print(f"CEK SUARA baris {i + 1}: {prob}", file=sys.stderr)
            line_cues = []
            for p, us in zip(phrases, units):
                f0 = max(round((start + us[0]["start"]) * FPS) - 2, line_cues[-1]["from"] + 1 if line_cues else round(start * FPS))
                words = [{"t": u["text"], "f": round((start + u["start"]) * FPS), "e": round((start + u["end"]) * FPS), **({"k": 1} if u["emph"] else {})} for u in us]
                line_cues.append({"from": f0, "to": 0, "text": p.strip(), "words": words})
            for k, c in enumerate(line_cues):
                c["to"] = line_cues[k + 1]["from"] if k + 1 < len(line_cues) else round(end * FPS)
            cues.extend(line_cues)
        parts.append(wav)
        parts.append(silence(args.tail if i == len(clips) - 1 else GAP + pauses[i]))
        cursor = end + GAP + pauses[i]
    total_frames = round((cursor - GAP - pauses[-1] + args.tail) * FPS)
    for i, s in enumerate(scenes):
        s["len"] = (scenes[i + 1]["from"] if i + 1 < len(scenes) else total_frames) - s["from"]

    full = np.concatenate(parts)
    full = full / max(1e-6, np.abs(full).max()) * 0.9
    sf.write(os.path.join(OUT_DIR, f"{slug}-narasi.wav"), full, sr)

    with open(os.path.join(ROOT, "src", "scenes", f"{slug}Timing.ts"), "w") as f:
        f.write("// Generated by scripts/make_narration.py from the narration audio. Do not edit by hand.\n")
        f.write(f"export const FRAMES = {total_frames};\n")
        f.write(f"export const SCENES = {json.dumps(scenes)};\n")
        f.write(f"export const CUES = {json.dumps(cues, ensure_ascii=False, indent=2)};\n")
    print(f"{len(cues)} caption cues; first cue index of each scene: {[sum(len(l.split('|')) for l in LINES[:i]) for i in range(len(LINES))]}", file=sys.stderr)
    print(f"total {total_frames} frames ({total_frames / FPS:.1f}s)", file=sys.stderr)


if __name__ == "__main__":
    main()
