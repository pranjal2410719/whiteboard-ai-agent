const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FFMPEG = "/home/vscode-gcp/.local/lib/python3.13/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2";
const RATE = 24000;

async function fetchWithRetry(url, options, retries = 4, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      console.warn(`Attempt ${i + 1} returned status ${res.status}. Retrying in ${delay}ms...`);
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
    }
    await new Promise(r => setTimeout(r, delay));
    delay *= 1.5;
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts.`);
}

async function renderClassAudio(classKey) {
  const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/class-scripts.json"), "utf8"));
  const lesson = scripts[classKey];
  if (!lesson) throw new Error(`${classKey} not found in class-scripts.json`);

  const tmpDir = path.join("/tmp", `${classKey}-audio-cache`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const cueWavs = [];
  let cueIdx = 0;

  console.log(`Synthesizing cues for ${lesson.title} (${classKey})...`);

  for (const chapter of lesson.chapters) {
    for (const cue of chapter.cues) {
      cueIdx++;
      const duration = cue.seconds;
      const text = cue.text;
      const rawWavPath = path.join(tmpDir, `cue_${cueIdx}_raw.wav`);
      const adjustedWavPath = path.join(tmpDir, `cue_${cueIdx}_adj.wav`);

      console.log(`[Cue ${cueIdx}] (${duration}s): "${text.slice(0, 50)}..."`);

      // 1. Synthesize if not already cached
      if (!fs.existsSync(rawWavPath) || fs.statSync(rawWavPath).size < 1000) {
        const res = await fetchWithRetry("http://127.0.0.1:3002/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: "en" }),
        });

        const rawWavBuffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(rawWavPath, rawWavBuffer);
      } else {
        console.log(`  (Using cached raw audio for cue ${cueIdx})`);
      }

      // 2. Measure duration with ffmpeg
      const durationOut = execSync(`"${FFMPEG}" -i "${rawWavPath}" 2>&1 | grep "Duration"`, { encoding: "utf8" });
      const durMatch = durationOut.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      let rawSec = 3.0;
      if (durMatch) {
        rawSec = parseFloat(durMatch[1]) * 3600 + parseFloat(durMatch[2]) * 60 + parseFloat(durMatch[3]);
      }

      // 3. Time-stretch and pad to exact duration
      const breathingRoom = cue.hold ? 1.0 : 0.35;
      const available = Math.max(1.0, duration - breathingRoom);
      const speed = Math.max(0.7, Math.min(1.4, rawSec / available));

      // Filter: atempo and pad with silence to exact planned seconds
      const filter = `atempo=${speed.toFixed(5)},aresample=${RATE},apad=whole_dur=${duration}`;
      execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -i "${rawWavPath}" -af "${filter}" -t ${duration} -ar ${RATE} -ac 1 "${adjustedWavPath}"`);

      cueWavs.push(adjustedWavPath);
    }
  }

  // 4. Concatenate all cues into 120s final audio
  const concatList = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatList, cueWavs.map(f => `file '${f}'`).join("\n"));

  const targetMp3 = path.join(ROOT, `public/class-audio/${classKey}-v2.mp3`);
  console.log(`Encoding final 120s MP3 to ${targetMp3}...`);

  execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -f concat -safe 0 -i "${concatList}" -af "loudnorm=I=-17:TP=-1.5:LRA=9" -ar ${RATE} -ac 1 -c:a libmp3lame -b:a 64k -metadata title="${lesson.title}" -metadata artist="Qrie AI | Synthetic narration" "${targetMp3}"`);

  // Also copy to class source folder if it exists
  const classAudioFolder = path.join(ROOT, `src/classes/${classKey}/audio`);
  if (fs.existsSync(classAudioFolder)) {
    fs.copyFileSync(targetMp3, path.join(classAudioFolder, `${classKey}-v2.mp3`));
  }

  const stat = fs.statSync(targetMp3);
  console.log(`Successfully generated ${classKey}-v2.mp3 (${Math.round(stat.size / 1024)} KiB)!`);
}

async function main() {
  await renderClassAudio("human-cell");
  await renderClassAudio("trigonometry");
}

main().catch(err => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
