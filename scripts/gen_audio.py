"""Generate the English audio clips (assets/audio/en/) from the say-lines blocks in english/*/index.html.

Each English page lists what it says:  <script type="application/json" class="say-lines">{"red": "red", "ph_b": "[b](/b/)"}</script>
The id is what the page passes to S.say(id); the text is what Kokoro speaks. [word](/ipa/) forces a pronunciation
(used for isolated letter sounds). Ids are shared across pages, so the same id must always mean the same text.

Voice: Kokoro-82M (Apache-2.0 weights and voices), voice af_heart, mono MP3 ~40 kbps, silence trimmed, loudness normalised.
A clip's file name carries a hash of (voice, speed, text), so changing the text makes a new file and the page never
gets a stale cached clip. Clips no longer listed anywhere are deleted. manifest.json maps id -> file for assets/sound.js.
After generating, every word clip (not ph_*) is transcribed with faster-whisper and mismatches are reported.

Setup once (any Python 3.11 venv works):
  uv venv -p 3.11 .venv && uv pip install -p .venv/bin/python kokoro soundfile faster-whisper
  # if espeak complains about .../espeakng_loader/phontab, symlink espeak-ng-data/* into the espeakng_loader folder
Run:  .venv/bin/python scripts/gen_audio.py [--no-check | --check (re-check every clip)]
"""
import glob, hashlib, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio', 'en')
VOICE, SPEED = 'af_heart', 0.9


def wanted():
    lines, where = {}, {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'english', '*', 'index.html'))):
        for block in re.findall(r'<script type="application/json" class="say-lines">(.*?)</script>', open(f).read(), re.S):
            for k, v in json.loads(block).items():
                if k in lines and lines[k] != v:
                    sys.exit(f'id "{k}" means "{lines[k]}" in {where[k]} but "{v}" in {f}')
                lines[k], where[k] = v, f
    return lines


def name(id_, text):
    h = hashlib.sha1(f'{VOICE}|{SPEED}|{text}'.encode()).hexdigest()[:8]
    return re.sub(r'[^a-z0-9_]+', '-', id_.lower()).strip('-') + '.' + h + '.mp3'


def main():
    lines = wanted()
    os.makedirs(OUT, exist_ok=True)
    manifest = {k: name(k, v) for k, v in sorted(lines.items())}
    todo = {k: v for k, v in lines.items() if not os.path.exists(os.path.join(OUT, manifest[k]))}
    if todo:
        import numpy as np, soundfile as sf
        from kokoro import KPipeline
        pipe = KPipeline(lang_code='a')
        for k, text in todo.items():
            audio = np.concatenate([a for _, _, a in pipe(text, voice=VOICE, speed=SPEED)])
            with tempfile.NamedTemporaryFile(suffix='.wav') as w:
                sf.write(w.name, audio, 24000)
                af = ('silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,'
                      'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,loudnorm=I=-16:TP=-1.5')
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w.name, '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '40k',
                                os.path.join(OUT, manifest[k])], check=True)
            print('made', manifest[k])
    keep = set(manifest.values()) | {'manifest.json'}
    for f in os.listdir(OUT):
        if f not in keep:
            os.remove(os.path.join(OUT, f)); print('removed', f)
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=0, sort_keys=True)
    print(f'{len(manifest)} clips, {len(todo)} new')
    if '--no-check' in sys.argv or not (todo or '--check' in sys.argv):
        return
    from faster_whisper import WhisperModel
    m = WhisperModel('base.en', device='cpu', compute_type='int8')
    norm = lambda s: re.sub(r'[^a-z0-9 ]', '', re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', s).lower()).split()
    bad = 0
    for k in (lines if '--check' in sys.argv else todo):
        if k.startswith('ph_'):
            continue
        # whisper guesses wildly on half-second clips, so it listens to a copy with a second of silence around it
        with tempfile.NamedTemporaryFile(suffix='.wav') as w:
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(OUT, manifest[k]), '-af', 'adelay=1000,apad=pad_dur=1', w.name], check=True)
            heard = ''.join(s.text for s in m.transcribe(w.name, beam_size=5, language='en')[0])
        h = norm(heard)
        if h[:1] == ['a'] and norm(lines[k])[:1] != ['a']: h = h[1:]  # whisper likes to add 'a' before a lone word
        if h != norm(lines[k]):
            bad += 1; print(f'CHECK {k}: said "{lines[k]}", heard "{heard.strip()}"')
    print('speech check:', 'all match' if not bad else f'{bad} to listen to')


if __name__ == '__main__':
    main()
