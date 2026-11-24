"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VADOptions {
  speechThreshold?: number; // RMS threshold above which speech is detected
  silenceDurationMs?: number; // Duration of silence (ms) required to trigger speech end
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onAudioLevel?: (level: number) => void;
}

export function useVAD({
  speechThreshold = 0.038,
  silenceDurationMs = 350, // Ultra-fast real-time speech pause detection (sub-400ms)
  onSpeechStart,
  onSpeechEnd,
  onAudioLevel
}: VADOptions = {}) {
  const [isActive, setIsActive] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userSpeakingRef = useRef(false);

  const callbacksRef = useRef({ onSpeechStart, onSpeechEnd, onAudioLevel });
  callbacksRef.current = { onSpeechStart, onSpeechEnd, onAudioLevel };

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate RMS energy of current audio frame
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const normalizedLevel = Math.min(1.0, rms * 5.0);

    setAudioLevel(normalizedLevel);
    callbacksRef.current.onAudioLevel?.(normalizedLevel);

    // VAD State Machine: Speech Detection vs Silence
    if (rms > speechThreshold) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!userSpeakingRef.current) {
        userSpeakingRef.current = true;
        setUserSpeaking(true);
        // Student started speaking -> immediately trigger barge-in interruption!
        callbacksRef.current.onSpeechStart?.();
      }
    } else if (userSpeakingRef.current) {
      // Audio fell below threshold; start silence countdown
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          userSpeakingRef.current = false;
          setUserSpeaking(false);
          silenceTimerRef.current = null;
          // Student finished speaking -> trigger query submission
          callbacksRef.current.onSpeechEnd?.();
        }, silenceDurationMs);
      }
    }

    animFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [speechThreshold, silenceDurationMs]);

  const startVAD = useCallback(async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === "running") {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsActive(true);
      setError(null);
      analyzeAudio();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone permission denied";
      setError(msg);
      setIsActive(false);
    }
  }, [analyzeAudio]);

  const stopVAD = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    userSpeakingRef.current = false;
    setUserSpeaking(false);
    setIsActive(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, [stopVAD]);

  return {
    isActive,
    userSpeaking,
    audioLevel,
    error,
    startVAD,
    stopVAD
  };
}
