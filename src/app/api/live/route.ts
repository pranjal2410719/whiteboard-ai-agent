export const dynamic = "force-dynamic";

export interface LiveClientEvent {
  type: "speech_start" | "speech_end" | "barge_in" | "audio_chunk" | "doubt_point";
  sessionId: string;
  timestamp: number;
  payload?: any;
}

export interface LiveServerEvent {
  type: "barge_in_ack" | "tutor_paused" | "audio_chunk" | "tutor_action";
  sessionId: string;
  timestamp: number;
  data?: any;
}

export async function GET() {
  return Response.json({
    status: "ready",
    protocolVersion: "2.0-duplex",
    capabilities: {
      vadSupported: true,
      bargeInEnabled: true,
      sentenceBoundaryPause: true,
      ephemeralDoubtSketch: true,
      streamingAudio: true
    }
  });
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
        bargeInAcknowledged: true
      }
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
        point: body.payload?.point
      }
    } satisfies LiveServerEvent);
  }

  if (body.type === "speech_end") {
    return Response.json({
      type: "tutor_action",
      sessionId: body.sessionId,
      timestamp,
      data: {
        processingSpeech: true,
        readyForOrchestrator: true
      }
    } satisfies LiveServerEvent);
  }

  return Response.json({
    type: "barge_in_ack",
    sessionId: body.sessionId,
    timestamp
  } satisfies LiveServerEvent);
}
