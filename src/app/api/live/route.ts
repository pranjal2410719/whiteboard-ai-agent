export const dynamic = "force-dynamic";

export interface LiveClientEvent {
  type:
    | "speech_start"
    | "speech_end"
    | "barge_in"
    | "audio_chunk"
    | "doubt_point"
    | "webrtc_offer"
    | "webrtc_answer"
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
    | "webrtc_offer_ack"
    | "webrtc_answer_ack"
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
    signalingMode: "relay",
    session: session || null,
    capabilities: {
      vadSupported: true,
      bargeInEnabled: true,
      sentenceBoundaryPause: true,
      ephemeralDoubtSketch: true,
      streamingAudio: true,
      webrtcSignaling: true,
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LiveClientEvent;

  if (!body.sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  const timestamp = Date.now();

  if (body.type === "speech_start" || body.type === "barge_in") {
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
        action: "evaluate_query",
        readyForOrchestrator: true,
        transcript: body.payload?.transcript || "",
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "webrtc_offer") {
    let signaling = sessionSignalingMap.get(body.sessionId);
    if (!signaling) {
      signaling = {
        iceCandidates: [],
        boostMode: Boolean(body.payload?.boostMode),
        updatedAt: timestamp,
      };
      sessionSignalingMap.set(body.sessionId, signaling);
    }
    signaling.offer = body.payload?.sdp;
    signaling.boostMode = Boolean(body.payload?.boostMode);
    signaling.updatedAt = timestamp;

    return Response.json({
      type: "webrtc_offer_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        stored: true,
        role: "offer",
        hasAnswer: Boolean(signaling.answer),
        answer: signaling.answer || null,
        dataChannels: ["whiteboard-strokes", "tutor-intelligence", "duplex-voice"],
        boostMode: signaling.boostMode,
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "webrtc_answer") {
    let signaling = sessionSignalingMap.get(body.sessionId);
    if (!signaling) {
      signaling = {
        iceCandidates: [],
        boostMode: false,
        updatedAt: timestamp,
      };
      sessionSignalingMap.set(body.sessionId, signaling);
    }
    signaling.answer = body.payload?.sdp;
    signaling.updatedAt = timestamp;

    return Response.json({
      type: "webrtc_answer_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        stored: true,
        role: "answer",
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "ice_candidate") {
    let signaling = sessionSignalingMap.get(body.sessionId);
    if (!signaling) {
      signaling = {
        iceCandidates: [],
        boostMode: false,
        updatedAt: timestamp,
      };
      sessionSignalingMap.set(body.sessionId, signaling);
    }
    if (body.payload?.candidate) {
      signaling.iceCandidates.push(body.payload.candidate);
    }
    signaling.updatedAt = timestamp;

    return Response.json({
      type: "ice_candidate_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        received: true,
        candidateCount: signaling.iceCandidates.length,
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
        strokeId: body.payload?.strokeId || "stroke-ack",
        boostActive: Boolean(body.payload?.boostMode),
      },
    } satisfies LiveServerEvent);
  }

  if (body.type === "boost_mode_toggle") {
    let signaling = sessionSignalingMap.get(body.sessionId);
    if (signaling) {
      signaling.boostMode = Boolean(body.payload?.boostMode);
      signaling.updatedAt = timestamp;
    }
    return Response.json({
      type: "boost_mode_ack",
      sessionId: body.sessionId,
      timestamp,
      data: {
        boostMode: Boolean(body.payload?.boostMode),
        accelerated120fps: true,
        lowLatencyDataChannel: true,
      },
    } satisfies LiveServerEvent);
  }

  return Response.json({
    type: "tutor_action",
    sessionId: body.sessionId,
    timestamp,
    data: { ack: true },
  } satisfies LiveServerEvent);
}
