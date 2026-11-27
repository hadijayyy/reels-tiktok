"""Word-level alignment of narration lines, used by make_narration.py.

Each narration line is transcribed with faster-whisper (word timestamps) and matched against the
script. The result gives, for every caption word, the moment it is spoken, so captions can highlight
word by word and scenes can react to the exact phrase. Words the voice skipped or said differently
are reported, so a bad take can be redone without listening to it.

Script syntax handled here (the same as in scripts/narasi/<slug>.txt):
  |              splits a line into caption phrases
  {shown=spoken} shows "shown" in the captions but speaks "spoken" (one caption unit)
  *word*         emphasis: the word is drawn in the accent colour (asterisks are not spoken)
"""

import difflib
import re

SPOKEN = re.compile(r"\{([^=}]+)=([^}]+)\}")
UNIT = re.compile(r"[^\s{]*\{[^=}]+=[^}]+\}\S*|\S+")

_ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"]


def terbilang(n: int) -> str:
    """Indonesian number words, e.g. 2026 -> 'dua ribu dua puluh enam'."""
    if n < 12:
        return _ONES[n]
    if n < 20:
        return f"{_ONES[n - 10]} belas"
    if n < 100:
        return f"{_ONES[n // 10]} puluh" + (f" {_ONES[n % 10]}" if n % 10 else "")
    if n < 200:
        return "seratus" + (f" {terbilang(n - 100)}" if n > 100 else "")
    if n < 1000:
        return f"{_ONES[n // 100]} ratus" + (f" {terbilang(n % 100)}" if n % 100 else "")
    if n < 2000:
        return "seribu" + (f" {terbilang(n - 1000)}" if n > 1000 else "")
    if n < 1_000_000:
        return f"{terbilang(n // 1000)} ribu" + (f" {terbilang(n % 1000)}" if n % 1000 else "")
    if n < 1_000_000_000:
        return f"{terbilang(n // 1_000_000)} juta" + (f" {terbilang(n % 1_000_000)}" if n % 1_000_000 else "")
    return str(n)


# Spoken variants that count as the same word (colloquial spellings Whisper tends to pick).
SAME = {"nggak": "gak", "ngga": "gak", "enggak": "gak", "ga": "gak", "tahu": "tau", "badui": "baduy", "km": "kilometer"}


def norm_tokens(text: str) -> list[str]:
    """Lower-case word tokens for matching: hyphens split, digits spelled out, punctuation dropped, variants merged."""
    text = text.lower().replace("-", " ").replace("*", " ")
    text = re.sub(r"(?<=\d)\.(?=\d{3})", "", text)  # 250.000 -> 250000
    out: list[str] = []
    for tok in re.findall(r"[a-zÀ-ɏ]+|\d+", text):
        out.extend(terbilang(int(tok)).split() if tok.isdigit() else [SAME.get(tok, tok)])
    return out


def phrase_units(phrase: str) -> list[dict]:
    """Caption units of one phrase: {'text': shown text, 'spoken': [tokens], 'emph': bool}."""
    units = []
    for m in UNIT.finditer(phrase):
        raw = m.group(0)
        sm = SPOKEN.search(raw)  # may carry punctuation around it, e.g. "{Pak,=Pak...}
        shown, spoken = (raw[:sm.start()] + sm.group(1) + raw[sm.end():], raw[:sm.start()] + sm.group(2) + raw[sm.end():]) if sm else (raw, raw)
        emph = shown.startswith("*") or shown.rstrip(".,!?:;\"'").endswith("*") or bool(re.search(r"\d", shown))
        units.append({"text": shown.replace("*", ""), "spoken": norm_tokens(spoken), "shown": norm_tokens(shown), "emph": emph})
    return units


def align_line(phrases: list[str], heard: list[tuple[str, float, float]], dur: float) -> tuple[list[list[dict]], list[str]]:
    """Give every caption unit a start/end time (seconds from the start of the line's clip).

    phrases: the line's caption phrases (raw script text, with markup).
    heard:   (word, start, end) from whisper.
    Returns (units per phrase, with 'start'/'end' added) and a list of human-readable problems.
    """
    units = [phrase_units(p) for p in phrases]
    flat = [u for ph in units for u in ph]
    script = [(ui, tok) for ui, u in enumerate(flat) for tok in u["spoken"]]
    heard_tok: list[tuple[str, float, float, str]] = []
    for w, s, e in heard:
        toks = norm_tokens(w) or [w.lower()]
        for k, tok in enumerate(toks):  # spread a spelled-out number over its word span
            a = s + (e - s) * k / len(toks)
            heard_tok.append((tok, a, a + (e - s) / len(toks), w.strip()))

    times: list[tuple[float, float] | None] = [None] * len(script)
    problems: list[str] = []
    sm = difflib.SequenceMatcher(None, [t for _, t in script], [h[0] for h in heard_tok], autojunk=False)
    regions: list[list[int]] = []  # runs of adjacent differences, judged together
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = heard_tok[j1 + k][1:3]
            continue
        if op == "replace":
            n, m = i2 - i1, j2 - j1
            for k in range(n):
                times[i1 + k] = heard_tok[j1 + min(m - 1, int(k * m / n))][1:3]
        if regions and regions[-1][1] == i1 and regions[-1][3] == j1:
            regions[-1][1], regions[-1][3] = i2, j2
        else:
            regions.append([i1, i2, j1, j2])

    # A difference is only reported when the letters differ too: Whisper joins or splits words
    # ("di kasir" -> "dikasir") and often writes what the caption shows ({Black Hole=blek hol} heard
    # as "Black Hole", {QRIS=kris} as "Chris"), so compare with both the spoken and the shown text.
    # Judge at letter level with spaces removed, so joins and splits vanish; map differences back to words.
    s_chars, s_owner = [], []
    for k, (_, t) in enumerate(script):
        s_chars.extend(t)
        s_owner.extend([k] * len(t))
    h_chars, h_owner = [], []
    for k, h in enumerate(heard_tok):
        h_chars.extend(h[0])
        h_owner.extend([k] * len(h[0]))
    regions = []
    for op, a1, a2, b1, b2 in difflib.SequenceMatcher(None, s_chars, h_chars, autojunk=False).get_opcodes():
        if op == "equal" or (a2 - a1) + (b2 - b1) < 3:
            continue
        i1 = s_owner[a1] if a1 < len(s_owner) else len(script)
        i2 = s_owner[a2 - 1] + 1 if a2 > a1 else i1
        j1 = h_owner[b1] if b1 < len(h_owner) else len(heard_tok)
        j2 = h_owner[b2 - 1] + 1 if b2 > b1 else j1
        if regions and i1 <= regions[-1][1] and j1 <= regions[-1][3]:
            regions[-1][1], regions[-1][3] = max(i2, regions[-1][1]), max(j2, regions[-1][3])
        else:
            regions.append([i1, i2, j1, j2])

    for i1, i2, j1, j2 in regions:
        want = " ".join(t for _, t in script[i1:i2])
        said = " ".join(dict.fromkeys(h[3] for h in heard_tok[j1:j2]))
        heard_s = "".join(h[0] for h in heard_tok[j1:j2])
        if i1 == i2:
            if len(heard_s) > 3:
                problems.append(f'kata tambahan terdengar: "{said}"')
            continue
        if j1 == j2:
            problems.append(f'"{want}" tidak terdengar')
            continue
        ratio = difflib.SequenceMatcher(None, want.replace(" ", ""), heard_s).ratio()
        # Units written {shown=spoken}: Whisper usually writes the shown form ("Black Hole" for "blek hol",
        # "Chris" for {QRIS=kris}); compare the whole unit with everything heard over its time span.
        uis = list(dict.fromkeys(script[k][0] for k in range(i1, i2)))
        marked = [ui for ui in uis if flat[ui]["shown"] != flat[ui]["spoken"]]
        if marked:
            ks = [k for k, (ui, _) in enumerate(script) if ui in marked]
            t0 = min(times[k][0] for k in ks if times[k]) if any(times[k] for k in ks) else None
            t1 = max(times[k][1] for k in ks if times[k]) if any(times[k] for k in ks) else None
            if t0 is not None:
                span = "".join(h[0] for h in heard_tok if h[2] > t0 + 0.02 and h[1] < t1 - 0.02)
                shown = "".join(t for ui in marked for t in flat[ui]["shown"])
                spoken = "".join(t for ui in marked for t in flat[ui]["spoken"])
                if max(difflib.SequenceMatcher(None, shown, span).ratio(), difflib.SequenceMatcher(None, spoken, span).ratio()) >= 0.6:
                    continue
        if ratio < 0.8:  # "di mana" vs "dimana" is fine; "temannya" vs "teman temannya" is not
            problems.append(f'"{want}" terdengar "{said}"')

    # Fill gaps by interpolating between known neighbours, weighted by token length.
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        a = times[i - 1][1] if i > 0 else 0.0
        b = times[j][0] if j < len(times) else dur
        weights = [max(1, len(script[k][1])) for k in range(i, j)]
        total, acc = sum(weights), 0.0
        for k, wgt in zip(range(i, j), weights):
            s = a + (b - a) * acc / total
            acc += wgt
            times[k] = (s, a + (b - a) * acc / total)
        i = j

    for ui, u in enumerate(flat):
        ts = [times[k] for k, (uj, _) in enumerate(script) if uj == ui]
        if ts:
            u["start"], u["end"] = min(t[0] for t in ts), max(t[1] for t in ts)
    # Units with nothing to say (a lone "..." or "-") take their neighbour's time.
    for ui, u in enumerate(flat):
        if "start" not in u:
            prev = next((flat[k] for k in range(ui - 1, -1, -1) if "start" in flat[k]), None)
            u["start"] = u["end"] = prev["end"] if prev else 0.0
    # Keep times monotonic and inside the clip.
    last = 0.0
    for u in flat:
        u["start"] = min(max(u["start"], last), dur)
        u["end"] = min(max(u["end"], u["start"] + 0.05), dur)
        last = u["start"]
    return units, problems


_model = None


def transcribe(path: str, language: str = "id") -> list[tuple[str, float, float]]:
    """(word, start, end) for one audio file, using faster-whisper 'small' on the CPU."""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = _model.transcribe(path, language=language, word_timestamps=True)
    return [(w.word, w.start, w.end) for seg in segments for w in (seg.words or [])]
