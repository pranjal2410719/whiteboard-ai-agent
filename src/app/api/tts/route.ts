import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Build a minimal WAV header for PCM L16 mono audio. */
function buildWav(pcmData: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function normalizePronunciation(input: string, language: string): string {
  // "Qrie" is pronounced as "Curie" (/ˈkjʊə.ri/ - like Marie Curie)
  if (language === "hi" || /[\u0900-\u097F]/.test(input)) {
    return input.replace(/\bQrie\b/gi, "क्यूरी");
  }
  return input.replace(/\bQrie\b/gi, "Curie");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const language = typeof body.language === "string" ? body.language : "en";
    // Limit to avoid very long TTS synthesis and normalize brand phonetic pronunciation
    const truncated = text.slice(0, 2000);
    const spokenText = normalizePronunciation(truncated, language);

    // Use dedicated Voice / TTS API key if configured, otherwise fall back to the primary AI Tutor key
    const apiKey = (process.env.VOICE_API_KEY || process.env.TTS_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const region = process.env.GOOGLE_CLOUD_REGION || "us-central1";

    if (!apiKey || !project) {
      return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
    }

    // Use Gemini TTS model via Vertex AI (works with Agent Platform API key)
    const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/gemini-2.5-flash-preview-tts:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: spokenText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("TTS API error:", errText);
      return NextResponse.json({ error: "TTS synthesis failed" }, { status: 502 });
    }

    const data = await response.json();
    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return NextResponse.json({ error: "No audio data returned" }, { status: 502 });
    }

    // Parse sample rate from mimeType like "audio/L16;codec=pcm;rate=24000"
    const mimeType: string = inlineData.mimeType || "audio/L16;rate=24000";
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    const pcmData = Buffer.from(inlineData.data, "base64");
    const wavData = buildWav(pcmData, sampleRate);
    // Convert to Uint8Array for BodyInit compatibility
    const wavUint8 = new Uint8Array(wavData.buffer, wavData.byteOffset, wavData.byteLength);

    return new Response(wavUint8 as unknown as BodyInit, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "Content-Length": wavData.length.toString(),
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return NextResponse.json({ error: "TTS synthesis failed" }, { status: 502 });
  }
}
