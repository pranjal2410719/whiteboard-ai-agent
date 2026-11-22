"use client";

import type { BoardMark } from "./types";

export interface WebRTCClientOptions {
  sessionId: string;
  boostMode?: boolean;
  signalingUrl?: string;
  iceServers?: RTCIceServer[];
  onTutorMark?: (mark: BoardMark) => void;
  onWhiteboardStroke?: (stroke: any) => void;
  onTutorAction?: (action: any) => void;
  onTutorPaused?: (data: any) => void;
  onRemoteAudioTrack?: (stream: MediaStream) => void;
  onRemoteVideoTrack?: (stream: MediaStream) => void;
  onDataChannelMessage?: (channelName: string, data: any) => void;
  onConnectionStateChange?: (state: string) => void;
  onDataChannelStateChange?: (channelName: string, state: string) => void;
  onError?: (err: Error) => void;
}

export interface WhiteboardStrokePayload {
  type: "stroke_start" | "stroke_point" | "stroke_end" | "mark" | "doubt_point" | "clear";
  sessionId: string;
  timestamp: number;
  data: any;
  boostMode?: boolean;
}

export interface DuplexSpeechEvent {
  type: "speech_start" | "speech_end" | "barge_in" | "doubt_point" | "audio_chunk";
  sessionId: string;
  timestamp: number;
  payload?: any;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export class DuplexVoiceClient {
  public sessionId: string;
  public boostMode: boolean;
  public signalingUrl: string;
  public iceServers: RTCIceServer[];

  public peerConnection: RTCPeerConnection | null = null;
  public strokesChannel: RTCDataChannel | null = null;
  public intelligenceChannel: RTCDataChannel | null = null;
  public voiceChannel: RTCDataChannel | null = null;

  public localAudioStream: MediaStream | null = null;
  public remoteAudioStream: MediaStream | null = null;
  public localVideoStream: MediaStream | null = null;
  public remoteVideoStream: MediaStream | null = null;

  public connectionState: string = "idle";
  public dataChannelReady: boolean = false;
  public isClosed: boolean = false;

  private onTutorMark?: (mark: BoardMark) => void;
  private onWhiteboardStroke?: (stroke: any) => void;
  private onTutorAction?: (action: any) => void;
  private onTutorPaused?: (data: any) => void;
  private onRemoteAudioTrack?: (stream: MediaStream) => void;
  private onRemoteVideoTrack?: (stream: MediaStream) => void;
  private onDataChannelMessage?: (channelName: string, data: any) => void;
  private onConnectionStateChange?: (state: string) => void;
  private onDataChannelStateChange?: (channelName: string, state: string) => void;
  private onError?: (err: Error) => void;

  private senders: Map<string, RTCRtpSender> = new Map();

  constructor(options: WebRTCClientOptions) {
    this.sessionId = options.sessionId;
    this.boostMode = Boolean(options.boostMode);
    this.signalingUrl = options.signalingUrl || "/api/live";
    this.iceServers = options.iceServers || DEFAULT_ICE_SERVERS;

    this.onTutorMark = options.onTutorMark;
    this.onWhiteboardStroke = options.onWhiteboardStroke;
    this.onTutorAction = options.onTutorAction;
    this.onTutorPaused = options.onTutorPaused;
    this.onRemoteAudioTrack = options.onRemoteAudioTrack;
    this.onRemoteVideoTrack = options.onRemoteVideoTrack;
    this.onDataChannelMessage = options.onDataChannelMessage;
    this.onConnectionStateChange = options.onConnectionStateChange;
    this.onDataChannelStateChange = options.onDataChannelStateChange;
    this.onError = options.onError;
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && typeof RTCPeerConnection !== "undefined";
  }

  public async initialize(audioStream?: MediaStream): Promise<boolean> {
    this.isClosed = false;
    this.setConnectionState("connecting");

    if (!this.isSupported()) {
      // Graceful fallback for environments without WebRTC API
      this.setConnectionState("fallback");
      return false;
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: this.iceServers,
      });
      this.peerConnection = pc;

      // Setup audio track if provided
      if (audioStream) {
        this.localAudioStream = audioStream;
        audioStream.getAudioTracks().forEach(track => {
          this.addAudioTrack(track, audioStream);
        });
      } else {
        // Add transceivers to receive remote audio/video tracks
        try {
          pc.addTransceiver("audio", { direction: "sendrecv" });
        } catch {}
      }

      // 1. Whiteboard strokes data channel (120fps low-latency unordered in boost mode)
      const strokeOptions: RTCDataChannelInit = this.boostMode
        ? { ordered: false, maxRetransmits: 0 }
        : { ordered: true };
      this.strokesChannel = pc.createDataChannel("whiteboard-strokes", strokeOptions);
      this.setupDataChannel(this.strokesChannel, "whiteboard-strokes");

      // 2. Tutor intelligence data channel (reliable ordered)
      this.intelligenceChannel = pc.createDataChannel("tutor-intelligence", { ordered: true });
      this.setupDataChannel(this.intelligenceChannel, "tutor-intelligence");

      // 3. Duplex voice data channel (speech events, telemetry)
      this.voiceChannel = pc.createDataChannel("duplex-voice", { ordered: true });
      this.setupDataChannel(this.voiceChannel, "duplex-voice");

      // Listen for incoming remote channels
      pc.ondatachannel = (event) => {
        const ch = event.channel;
        this.setupDataChannel(ch, ch.label);
      };

      // Listen for incoming remote tracks (audio and video)
      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
        if (event.track.kind === "audio") {
          this.remoteAudioStream = stream;
          this.onRemoteAudioTrack?.(this.remoteAudioStream);
        } else if (event.track.kind === "video") {
          this.remoteVideoStream = stream;
          this.onRemoteVideoTrack?.(this.remoteVideoStream);
        }
      };

      // Connection state observer
      pc.onconnectionstatechange = () => {
        this.setConnectionState(pc.connectionState);
      };

      // ICE Candidates handling
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await this.sendSignalingEvent("ice_candidate", {
            candidate: event.candidate,
          });
        }
      };

      // Create offer and initiate signaling
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      const res = await this.sendSignalingEvent("webrtc_offer", {
        sdp: offer.sdp,
        boostMode: this.boostMode,
      });

      if (res && res.data?.sdp) {
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: "answer",
              sdp: res.data.sdp,
            })
          );
        } catch {
          // If browser rejects remote description, keep fallback active
        }
      }

      this.dataChannelReady = true;
      this.setConnectionState("connected");
      return true;
    } catch (err: any) {
      this.setConnectionState("fallback");
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }

  public addAudioTrack(track: MediaStreamTrack, stream?: MediaStream): RTCRtpSender | null {
    if (!this.peerConnection || track.kind !== "audio") return null;
    try {
      const sender = stream
        ? this.peerConnection.addTrack(track, stream)
        : this.peerConnection.addTrack(track);
      this.senders.set(`audio-${track.id}`, sender);
      return sender;
    } catch {
      return null;
    }
  }

  public addVideoTrack(track: MediaStreamTrack, stream?: MediaStream): RTCRtpSender | null {
    if (!this.peerConnection || track.kind !== "video") return null;
    try {
      this.localVideoStream = stream || new MediaStream([track]);
      const sender = stream
        ? this.peerConnection.addTrack(track, stream)
        : this.peerConnection.addTrack(track);
      this.senders.set(`video-${track.id}`, sender);
      return sender;
    } catch {
      return null;
    }
  }

  public removeTrack(track: MediaStreamTrack): boolean {
    if (!this.peerConnection) return false;
    const key = `${track.kind}-${track.id}`;
    const sender = this.senders.get(key);
    if (sender) {
      try {
        this.peerConnection.removeTrack(sender);
        this.senders.delete(key);
        return true;
      } catch {}
    }
    return false;
  }

  public sendAudioChunk(chunk: ArrayBuffer | Blob): void {
    if (this.voiceChannel && this.voiceChannel.readyState === "open") {
      try {
        this.voiceChannel.send(chunk as any);
        return;
      } catch {}
    }
  }

  private setupDataChannel(channel: RTCDataChannel, name: string) {
    if (this.boostMode) {
      try {
        channel.bufferedAmountLowThreshold = 0;
      } catch {}
    }

    channel.onopen = () => {
      this.dataChannelReady = true;
      this.onDataChannelStateChange?.(name, "open");
    };

    channel.onclose = () => {
      this.onDataChannelStateChange?.(name, "closed");
    };

    channel.onerror = () => {
      this.onDataChannelStateChange?.(name, "error");
    };

    channel.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.handleIncomingDataMessage(name, parsed);
        this.onDataChannelMessage?.(name, parsed);
      } catch {
        // Binary or plain text
        this.onDataChannelMessage?.(name, event.data);
      }
    };
  }

  public handleIncomingDataMessage(channelName: string, data: any) {
    if (channelName === "whiteboard-strokes") {
      if (data.type === "mark") {
        this.onTutorMark?.(data.mark);
      } else {
        this.onWhiteboardStroke?.(data);
      }
    } else if (channelName === "tutor-intelligence") {
      if (data.type === "mark") {
        this.onTutorMark?.(data.mark);
      } else if (data.type === "tutor_action") {
        this.onTutorAction?.(data);
      } else if (data.type === "tutor_paused") {
        this.onTutorPaused?.(data);
      }
    } else if (channelName === "duplex-voice") {
      if (data.type === "tutor_paused") {
        this.onTutorPaused?.(data);
      }
    }
  }

  public setBoostMode(enabled: boolean): void {
    this.boostMode = enabled;
    const payload = {
      boostMode: enabled,
      timestamp: Date.now(),
    };

    if (this.strokesChannel) {
      try {
        this.strokesChannel.bufferedAmountLowThreshold = enabled ? 0 : 64 * 1024;
      } catch {}
      if (this.strokesChannel.readyState === "open") {
        try {
          this.strokesChannel.send(JSON.stringify({ type: "boost_mode_toggle", ...payload }));
        } catch {}
      }
    }

    void this.sendSignalingEvent("boost_mode_toggle", payload);
  }

  public sendStroke(payload: any): void {
    const strokeData: WhiteboardStrokePayload = {
      type: payload.type || "stroke_point",
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data: payload,
      boostMode: this.boostMode,
    };

    if (this.strokesChannel && this.strokesChannel.readyState === "open") {
      try {
        this.strokesChannel.send(JSON.stringify(strokeData));
        return;
      } catch {}
    }

    // High-throughput signaling fallback
    void this.sendSignalingEvent("whiteboard_stroke", strokeData);
  }

  public sendTutorMark(mark: BoardMark): void {
    const message = {
      type: "mark",
      sessionId: this.sessionId,
      timestamp: Date.now(),
      mark,
      boostMode: this.boostMode,
    };

    if (this.intelligenceChannel && this.intelligenceChannel.readyState === "open") {
      try {
        this.intelligenceChannel.send(JSON.stringify(message));
        return;
      } catch {}
    }

    if (this.strokesChannel && this.strokesChannel.readyState === "open") {
      try {
        this.strokesChannel.send(JSON.stringify(message));
        return;
      } catch {}
    }

    void this.sendSignalingEvent("whiteboard_stroke", message);
  }

  public async sendDoubtPoint(point: { x: number; y: number }): Promise<any> {
    const payload = { point };
    const message = {
      type: "doubt_point",
      sessionId: this.sessionId,
      timestamp: Date.now(),
      payload,
    };

    if (this.intelligenceChannel && this.intelligenceChannel.readyState === "open") {
      try {
        this.intelligenceChannel.send(JSON.stringify(message));
      } catch {}
    }

    return this.sendSignalingEvent("doubt_point", payload);
  }

  public async sendBargeIn(): Promise<any> {
    const message = {
      type: "barge_in",
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    if (this.voiceChannel && this.voiceChannel.readyState === "open") {
      try {
        this.voiceChannel.send(JSON.stringify(message));
      } catch {}
    }

    return this.sendSignalingEvent("barge_in", {});
  }

  public async sendSpeechStart(): Promise<any> {
    const message = {
      type: "speech_start",
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    if (this.voiceChannel && this.voiceChannel.readyState === "open") {
      try {
        this.voiceChannel.send(JSON.stringify(message));
      } catch {}
    }

    return this.sendSignalingEvent("speech_start", {});
  }

  public async sendSpeechEnd(): Promise<any> {
    const message = {
      type: "speech_end",
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    if (this.voiceChannel && this.voiceChannel.readyState === "open") {
      try {
        this.voiceChannel.send(JSON.stringify(message));
      } catch {}
    }

    return this.sendSignalingEvent("speech_end", {});
  }

  private async sendSignalingEvent(type: string, payload: any): Promise<any> {
    try {
      const res = await fetch(this.signalingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          payload,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Signaling fallback
    }
    return null;
  }

  private setConnectionState(state: string) {
    this.connectionState = state;
    this.onConnectionStateChange?.(state);
  }

  public close(): void {
    this.isClosed = true;
    clientRegistry.delete(this.sessionId);
    try {
      this.strokesChannel?.close();
      this.intelligenceChannel?.close();
      this.voiceChannel?.close();
      this.localAudioStream?.getTracks().forEach(t => t.stop());
      this.localVideoStream?.getTracks().forEach(t => t.stop());
      this.peerConnection?.close();
    } catch {}
    this.peerConnection = null;
    this.strokesChannel = null;
    this.intelligenceChannel = null;
    this.voiceChannel = null;
    this.senders.clear();
    this.setConnectionState("closed");
  }
}

// Session Client Cache
const clientRegistry = new Map<string, DuplexVoiceClient>();

export function getDuplexVoiceClient(sessionId: string, boostMode = false, options?: Partial<WebRTCClientOptions>): DuplexVoiceClient {
  let client = clientRegistry.get(sessionId);
  if (client && client.isClosed) {
    clientRegistry.delete(sessionId);
    client = undefined;
  }
  if (!client) {
    client = new DuplexVoiceClient({
      sessionId,
      boostMode,
      ...options,
    });
    clientRegistry.set(sessionId, client);
  }
  return client;
}

export function createDuplexVoiceClient(options: WebRTCClientOptions): DuplexVoiceClient {
  clientRegistry.delete(options.sessionId);
  const client = new DuplexVoiceClient(options);
  clientRegistry.set(options.sessionId, client);
  return client;
}
