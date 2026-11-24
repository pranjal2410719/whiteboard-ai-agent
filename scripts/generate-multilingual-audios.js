const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FFMPEG = "/home/vscode-gcp/.local/lib/python3.13/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2";
const RATE = 24000;

async function fetchWithRetry(url, options, retries = 5, delay = 2500) {
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

async function renderMultilingualAudio(classKey, lang) {
  const scriptPath = path.join(ROOT, `src/classes/${classKey}/script-${lang}.json`);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script file not found: ${scriptPath}`);
  }
  const lesson = JSON.parse(fs.readFileSync(scriptPath, "utf8"));

  const tmpDir = path.join("/tmp", `${classKey}-${lang}-audio`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chapterWavs = [];
  let chIdx = 0;

  console.log(`\n==================================================`);
  console.log(`Synthesizing ${lang.toUpperCase()} narrative for ${lesson.title} (${classKey})...`);
  console.log(`==================================================`);

  for (const chapter of lesson.chapters) {
    chIdx++;
    const targetDuration = chapter.cues.reduce((sum, c) => sum + c.seconds, 0);
    // Combine cues into a continuous flowing narrative
    const continuousText = chapter.cues.map(c => c.text).join(" ");
    const rawWavPath = path.join(tmpDir, `ch_${chIdx}_raw.wav`);
    const adjustedWavPath = path.join(tmpDir, `ch_${chIdx}_adj.wav`);

    console.log(`\n[Chapter ${chIdx}: "${chapter.title}"] (target: ${targetDuration}s)`);
    console.log(`  Narrative: "${continuousText.slice(0, 80)}..."`);

    // 1. Synthesize full continuous paragraph
    if (!fs.existsSync(rawWavPath) || fs.statSync(rawWavPath).size < 1000) {
      const res = await fetchWithRetry("http://127.0.0.1:3002/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: continuousText, language: lang }),
      });

      const rawWavBuffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(rawWavPath, rawWavBuffer);
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log(`  (Using cached raw audio for chapter ${chIdx})`);
    }

    // 2. Measure natural duration
    const durationOut = execSync(`"${FFMPEG}" -i "${rawWavPath}" 2>&1 | grep "Duration"`, { encoding: "utf8" });
    const durMatch = durationOut.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    let rawSec = 10.0;
    if (durMatch) {
      rawSec = parseFloat(durMatch[1]) * 3600 + parseFloat(durMatch[2]) * 60 + parseFloat(durMatch[3]);
    }

    console.log(`  Natural raw duration: ${rawSec.toFixed(2)}s (target: ${targetDuration}s)`);

    // 3. Natural pacing & pause transition
    if (rawSec <= targetDuration) {
      const pauseSec = (targetDuration - rawSec).toFixed(2);
      console.log(`  -> Flow at pure 1.0x natural speed with ${pauseSec}s natural pause transition.`);
      const filter = `aresample=${RATE},apad=whole_dur=${targetDuration}`;
      execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -i "${rawWavPath}" -af "${filter}" -t ${targetDuration} -ar ${RATE} -ac 1 "${adjustedWavPath}"`);
    } else {
      const speed = Math.max(0.92, Math.min(1.15, rawSec / targetDuration));
      console.log(`  -> Flow with gentle ${(speed).toFixed(3)}x tempo adjustment to align chapter boundaries.`);
      const filter = `atempo=${speed.toFixed(5)},aresample=${RATE},apad=whole_dur=${targetDuration}`;
      execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -i "${rawWavPath}" -af "${filter}" -t ${targetDuration} -ar ${RATE} -ac 1 "${adjustedWavPath}"`);
    }

    chapterWavs.push(adjustedWavPath);
  }

  // 4. Concatenate all 4 chapters into seamless 120.0s audio
  const concatList = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatList, chapterWavs.map(f => `file '${f}'`).join("\n"));

  const targetMp3 = path.join(ROOT, `public/class-audio/${classKey}-${lang}.mp3`);
  console.log(`\nEncoding seamless 120s MP3 to ${targetMp3}...`);

  execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -f concat -safe 0 -i "${concatList}" -af "loudnorm=I=-16:TP=-1.5:LRA=9" -ar ${RATE} -ac 1 -c:a libmp3lame -b:a 64k -metadata title="${lesson.title} (${lang})" -metadata artist="Qrie AI | Continuous narrative" "${targetMp3}"`);

  // Also copy to class source folder if exists
  const classAudioFolder = path.join(ROOT, `src/classes/${classKey}/audio`);
  if (fs.existsSync(classAudioFolder)) {
    fs.copyFileSync(targetMp3, path.join(classAudioFolder, `${classKey}-${lang}.mp3`));
  }

  const stat = fs.statSync(targetMp3);
  console.log(`Successfully generated ${classKey}-${lang}.mp3 (${Math.round(stat.size / 1024)} KiB)!`);
}

async function main() {
  const args = process.argv.slice(2);
  const classKey = args[0] || "human-cell";
  const lang = args[1] || "hinglish";

  if (args.length === 0) {
    // Generate all
    await renderMultilingualAudio("human-cell", "hinglish");
    await renderMultilingualAudio("human-cell", "hi");
    await renderMultilingualAudio("trigonometry", "hinglish");
    await renderMultilingualAudio("trigonometry", "hi");
  } else {
    await renderMultilingualAudio(classKey, lang);
  }
}

main().catch(err => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
