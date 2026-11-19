"""Build bundled, cue-aligned narration. Not required to run the app.

Install piper-tts and imageio-ffmpeg, then run:
    python -m piper.download_voices en_US-ljspeech-medium
    python scripts/build-class-audio.py /path/to/en_US-ljspeech-medium.onnx
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
import wave

from imageio_ffmpeg import get_ffmpeg_exe
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
RATE = 24000
EDITION = 2


def render(voice, lesson, target, temp):
    ffmpeg = get_ffmpeg_exe()
    silence = b"\0\0" * RATE
    source = temp / "line.wav"
    aggregate = temp / "class.wav"
    elapsed = 0
    with wave.open(str(aggregate), "wb") as whole:
        whole.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        for chapter in lesson["chapters"]:
            for cue in chapter["cues"]:
                duration = cue["seconds"]
                planned = duration * RATE
                elapsed += duration
                with wave.open(str(source), "wb") as f:
                    voice.synthesize_wav(cue["text"], f, syn_config=SynthesisConfig(length_scale=1.0), set_wav_format=True)
                with wave.open(str(source), "rb") as f:
                    raw_length = f.getnframes() / f.getframerate()
                # A brief gap separates phrases; the independent practice cue leaves time to think.
                breathing_room = 1.3 if cue.get("hold") else .32
                available = duration - breathing_room - .12
                speed = max(.7, raw_length / available)
                filters = f"atempo={speed:.5f},aresample={RATE}"
                pcm = subprocess.check_output([ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(source), "-af", filters, "-ac", "1", "-f", "s16le", "-"])
                lead = silence[:int(.12 * RATE) * 2]
                audio = (lead + pcm)[:planned * 2]
                whole.writeframesraw(audio + bytes(planned * 2 - len(audio)))
                if speed > 1.45:
                    print(f"  Check speaking pace ({speed:.2f}×) near {elapsed - duration}s: {cue['text'][:50]}")
    assert elapsed == 120, f"{target.name} does not have a 120 second timeline"
    subprocess.run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(aggregate), "-af", "loudnorm=I=-17:TP=-1.5:LRA=9", "-ar", str(RATE), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "40k", "-metadata", f"title={lesson['title']}", "-metadata", "artist=Chalkly | Synthetic narration", str(target)], check=True)
    print(f"{target.name}: {elapsed}s, {target.stat().st_size // 1024} KiB")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("voice", type=Path)
    args = parser.parse_args()
    voice = PiperVoice.load(str(args.voice))
    scripts = json.loads((ROOT / "src/lib/class-scripts.json").read_text())
    out = ROOT / "public/class-audio"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="chalkly-narration-") as tmp:
        for key, lesson in scripts.items():
            render(voice, lesson, out / f"{key}-v{EDITION}.mp3", Path(tmp))


if __name__ == "__main__":
    main()
