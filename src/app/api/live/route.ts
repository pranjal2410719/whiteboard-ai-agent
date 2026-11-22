export const dynamic = "force-dynamic";

export interface LiveClientEvent {
  type:
    | "speech_start"
    | "speech_end"
    | "barge_in"
    | "audio_chunk"
    | "doubt_point"
    | "webrtc_offer"
    | "ice_candidate"
    | "whiteboard_stroke"
    | "boost_mode_toggle";
  sessionId: string;
  timestamp: number;
  payload?: any;
}

export interface LiveServerEvent {
  type:
    | "barge_in_ack"
    | "tutor_paused"
    | "audio_chunk"
    | "tutor_action"
    | "webrtc_answer"
    | "ice_candidate_ack"
    | "stroke_ack"
    | "boost_mode_ack";
  sessionId: string;
  timestamp: number;
  data?: any;
}

interface LiveSessionSignaling {
  offer?: any;
  answer?: any;
  iceCandidates: any[];
  boostMode: boolean;
  updatedAt: number;
}

const sessionSignalingMap = new Map<string, LiveSessionSignaling>();

export async function GET(request: Request) {
  let sessionId: string | null = null;
  if (request?.url) {
    try {
      const url = new URL(request.url);
      sessionId = url.searchParams.get("sessionId");
    } catch {}
  }

  const session = sessionId ? sessionSignalingMap.get(sessionId) : undefined;

  return Response.json({
    status: "ready",
    protocolVersion: "2.0-duplex",
    session: session || null,
    capabilities: {
      vadSupported: true,
      bargeInEnabled: true,
      sentenceBoundaryPause: true,
      ephemeralDoubtSketch: true,
      streamingAudio: true,
      webrtcSupported: true,
      dataChannelSupported: true,
      boostModeSupported: true,
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    },
  });
}

function generateWebRTCAnswer(offerSdp?: string): string {
  if (!offerSdp) {
    return [
      "v=0",
      "o=QrieAITutor " + Date.now() + " 2 IN IP4 127.0.0.1",
      "s=Qrie WebRTC AI Tutor Session",
      "t=0 0",
      "a=group:BUNDLE audio data",
      "a=msid-semantic: WMS",
      "m=audio 9 UDP/TLS/RTP/SAVPF 111",
      "c=IN IP4 127.0.0.1",
      "a=rtcp:9 IN IP4 127.0.0.1",
      "a=rtcp-mux",
      "a=mid:audio",
      "a=ice-ufrag:tutorUfrag123",
      "a=ice-pwd:tutorPassword9876543210",
      "a=fingerprint:sha-256 1A:31:D8:99:F5:65:02:EC:DA:59:8D:25:93:3C:4C:D2:F6:9F:DC:CA:7D:BB:61:C3:F5:3E:AB:2A:75:5E:AD:C5",
      "a=setup:active",
      "a=sendrecv",
      "a=rtpmap:111 opus/48000/2",
      "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
      "c=IN IP4 127.0.0.1",
      "a=mid:data",
      "a=ice-ufrag:tutorUfrag123",
      "a=ice-pwd:tutorPassword9876543210",
      "a=fingerprint:sha-256 1A:31:D8:99:F5:65:02:EC:DA:59:8D:25:93:3C:4C:D2:F6:9F:DC:CA:7D:BB:61:C3:F5:3E:AB:2A:75:5E:AD:C5",
      "a=setup:active",
      "a=sctp-port:5000",
    ].join("\r\n") + "\r\n";
  }

  // Parse offer SDP
  const lines = offerSdp.split(/\r\n|\n/);
  const bundleLine = lines.find(l => l.startsWith("a=group:BUNDLE"));
  const fingerprintLine =
    lines.find(l => l.startsWith("a=fingerprint:")) ||
    "a=fingerprint:sha-256 1A:31:D8:99:F5:65:02:EC:DA:59:8D:25:93:3C:4C:D2:F6:9F:DC:CA:7D:BB:61:C3:F5:3E:AB:2A:75:5E:AD:C5";

  const answerLines: string[] = [
    "v=0",
    "o=QrieAITutor " + Date.now() + " 2 IN IP4 127.0.0.1",
    "s=Qrie WebRTC AI Tutor Session",
    "t=0 0",
  ];

  if (bundleLine) {
    answerLines.push(bundleLine);
  }
  answerLines.push("a=msid-semantic: WMS");

  // Segment offer into media sections
  const sections: { m: string; lines: string[] }[] = [];
  let currentSection: { m: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("m=")) {
      if (currentSection) sections.push(currentSection);
      currentSection = { m: line, lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  if (sections.length === 0) {
    // Generate default audio & application sections
    answerLines.push("a=group:BUNDLE audio data");
    answerLines.push("m=audio 9 UDP/TLS/RTP/SAVPF 111");
    answerLines.push("c=IN IP4 127.0.0.1");
    answerLines.push("a=rtcp:9 IN IP4 127.0.0.1");
    answerLines.push("a=rtcp-mux");
    answerLines.push("a=mid:audio");
    answerLines.push("a=ice-ufrag:tutorUfrag123");
    answerLines.push("a=ice-pwd:tutorPassword9876543210");
    answerLines.push(fingerprintLine);
    answerLines.push("a=setup:active");
    answerLines.push("a=sendrecv");
    answerLines.push("a=rtpmap:111 opus/48000/2");

    answerLines.push("m=application 9 UDP/DTLS/SCTP webrtc-datachannel");
    answerLines.push("c=IN IP4 127.0.0.1");
    answerLines.push("a=mid:data");
    answerLines.push("a=ice-ufrag:tutorUfrag123");
    answerLines.push("a=ice-pwd:tutorPassword9876543210");
    answerLines.push(fingerprintLine);
    answerLines.push("a=setup:active");
    answerLines.push("a=sctp-port:5000");
  } else {
    for (const sec of sections) {
      const midLine = sec.lines.find(l => l.startsWith("a=mid:")) || "a=mid:0";
      const ufragLine = sec.lines.find(l => l.startsWith("a=ice-ufrag:")) || "a=ice-ufrag:tutorUfrag123";
      const pwdLine = sec.lines.find(l => l.startsWith("a=ice-pwd:")) || "a=ice-pwd:tutorPassword9876543210";

      if (sec.m.startsWith("m=audio")) {
        answerLines.push("m=audio 9 UDP/TLS/RTP/SAVPF 111");
        answerLines.push("c=IN IP4 127.0.0.1");
        answerLines.push("a=rtcp:9 IN IP4 127.0.0.1");
        if (bundleLine) answerLines.push("a=rtcp-mux");
        answerLines.push(midLine);
        answerLines.push(ufragLine);
        answerLines.push(pwdLine);
        answerLines.push(fingerprintLine);
        answerLines.push("a=setup:active");
        answerLines.push("a=sendrecv");
        answerLines.push("a=rtpmap:111 opus/48000/2");
      } else if (sec.m.startsWith("m=video")) {
        answerLines.push("m=video 9 UDP/TLS/RTP/SAVPF 96");
        answerLines.push("c=IN IP4 127.0.0.1");
        answerLines.push("a=rtcp:9 IN IP4 127.0.0.1");
        if (bundleLine) answerLines.push("a=rtcp-mux");
        answerLines.push(midLine);
        answerLines.push(ufragLine);
        answerLines.push(pwdLine);
        answerLines.push(fingerprintLine);
        answerLines.push("a=setup:active");
        answerLines.push("a=sendrecv");
        answerLines.push("a=rtpmap:96 VP8/90000");
      } else if (sec.m.startsWith("m=application")) {
        const proto = sec.m.includes("webrtc-datachannel")
          ? "UDP/DTLS/SCTP webrtc-datachannel"
          : "DTLS/SCTP 5000";
        answerLines.push(`m=application 9 ${proto}`);
        answerLines.push("c=IN IP4 127.0.0.1");
        answerLines.push(midLine);
        answerLines.push(ufragLine);
        answerLines.push(pwdLine);
        answerLines.push(fingerprintLine);
        answerLines.push("a=setup:active");
        answerLines.push("a=sctp-port:5000");
      }
    }
  }

  return answerLines.join("\r\n") + "\r\n";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LiveClientEvent;

  if (!body.sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  const timestamp = Date.now();

  if (body.type === "speech_start" || body.type === "barge_in") {
    // Interruption event: Immediately confirm tutor pause and grant student floor
    return Response.json({
      type: "tutor_paused",
      sessionId: body.sessionId,
      timestamp,
      data: {
        floorGranted: true,
        action: "halt_narration",
        bargeInAcknowledged: true,
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "doubt_point") {
    // Student pointed or sketched on doubt layer
    return Response.json({
      type: "tutor_action",
      sessionId: body.sessionId,
      timestamp,
      data: {
        doubtCoordinatesReceived: true,
        point: body.payload?.point,
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "speech_end") {
    return Response.json({
      type: "tutor_action",
      sessionId: body.sessionId,
      timestamp,
      data: {
        processingSpeech: true,
        readyForOrchestrator: true,
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "webrtc_offer") {
    const offerSdp = body.payload?.sdp;
    const answerSdp = generateWebRTCAnswer(offerSdp);
    const existing = sessionSignalingMap.get(body.sessionId) || { iceCandidates: [], boostMode: false, updatedAt: 0 };
    existing.offer = offerSdp;
    existing.answer = answerSdp;
    existing.boostMode = Boolean(body.payload?.boostMode);
    existing.updatedAt = timestamp;
    sessionSignalingMap.set(body.sessionId, existing);

    return Response.json({
      type: "webrtc_answer",
      sessionId: body.sessionId,
      timestamp,
      data: {
        sdp: answerSdp,
        type: "answer",
        boostMode: Boolean(body.payload?.boostMode),
        dataChannels: [
          "whiteboard-strokes",
          "tutor-intelligence",
          "duplex-voice",
        ],
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "ice_candidate") {
    const existing = sessionSignalingMap.get(body.sessionId) || { iceCandidates: [], boostMode: false, updatedAt: 0 };
    if (body.payload?.candidate) {
      existing.iceCandidates.push(body.payload.candidate);
    }
    existing.updatedAt = timestamp;
    sessionSignalingMap.set(body.sessionId, existing);

    return Response.json({
      type: "ice_candidate_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        received: true,
        candidate: body.payload?.candidate,
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "whiteboard_stroke") {
    return Response.json({
      type: "stroke_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        delivered: true,
        strokeId: body.payload?.strokeId || body.payload?.mark?.id,
        boostActive: Boolean(body.payload?.boostMode),
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "boost_mode_toggle") {
    const boostActive = Boolean(body.payload?.boostMode);
    const existing = sessionSignalingMap.get(body.sessionId);
    if (existing) {
      existing.boostMode = boostActive;
      existing.updatedAt = timestamp;
    }
    return Response.json({
      type: "boost_mode_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        boostMode: boostActive,
        accelerated120fps: boostActive,
        lowLatencyDataChannel: boostActive,
        bufferThreshold: boostActive ? 0 : 16384,
      },
    } satisfies LiveServerEvent);
  }

  return Response.json({
    type: "barge_in_ack",
    sessionId: body.sessionId,
    timestamp,
  } satisfies LiveServerEvent);
}
