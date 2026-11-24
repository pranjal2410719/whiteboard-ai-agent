"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Anchor = { seconds: number; at: number; running: boolean; media: boolean };
const idle = (seconds = 0): Anchor => ({ seconds, at: 0, running: false, media: false });

/**
 * Use prerecorded audio time when available, and a monotonic clock for silent/custom playback.
 * `read()` returns continuous 60-120fps time (smoothly interpolating between audio decoder ticks)
 * while React `seconds` state updates at ~5fps (plus cue boundaries) so UI controls stay light.
 */
export function useClassPlayback(duration: number, source?: string, boundaries?: number[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const anchor = useRef<Anchor>(idle());
  const smoothMedia = useRef({ mediaTime: 0, perfAt: 0 });
  const request = useRef(0), failed = useRef(false), pending = useRef(false);
  const lastUiSync = useRef({ bucket: -1, boundaryIndex: -1 });
  const boundariesRef = useRef(boundaries);
  useEffect(() => {
    boundariesRef.current = boundaries;
  }, [boundaries]);

  const [open, setOpen] = useState(false), [playing, setPlaying] = useState(false), [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false), [buffering, setBuffering] = useState(false);
  const [audioIssue, setAudioIssue] = useState(""), [revision, setRevision] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);
  const gracefulPauseRef = useRef<{
    targetTime: number;
    startFadeAt: number;
    onPaused?: (pausedAt: number) => void;
  } | null>(null);

  const setSpeed = useCallback((newSpeed: number) => {
    const s = Math.max(0.25, Math.min(4, newSpeed));
    const state = anchor.current;
    if (state.running) {
      const current = state.media && audioRef.current && !pending.current
        ? audioRef.current.currentTime
        : state.seconds + (performance.now() - state.at) / 1000 * speedRef.current;
      anchor.current = {
        seconds: current,
        at: performance.now(),
        running: true,
        media: state.media,
      };
      if (smoothMedia.current.perfAt > 0) {
        smoothMedia.current = {
          mediaTime: audioRef.current ? audioRef.current.currentTime : current,
          perfAt: performance.now(),
        };
      }
    }
    speedRef.current = s;
    setSpeedState(s);
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = s;
      } catch {}
    }
  }, []);

  const read = useCallback(() => {
    const state = anchor.current;
    if (!state.running) return Math.max(0, Math.min(duration, state.seconds));
    const now = performance.now();
    if (state.media && audioRef.current) {
      if (pending.current || audioRef.current.seeking) {
        // While audio seek/play is pending or in-flight, return smooth monotonic time anchored to seek target
        return Math.max(0, Math.min(duration, state.seconds + (now - state.at) / 1000 * speedRef.current));
      }
      const mediaTime = audioRef.current.currentTime;
      const tracker = smoothMedia.current;
      if (Math.abs(mediaTime - tracker.mediaTime) > 0.001) {
        tracker.mediaTime = mediaTime;
        tracker.perfAt = now;
      } else if (tracker.perfAt === 0) {
        tracker.mediaTime = mediaTime;
        tracker.perfAt = now;
      }
      // Interpolate smoothly between ~30ms browser decoder ticks without ever drifting from audio.
      const interpolated = tracker.mediaTime + Math.min(0.08, Math.max(0, (now - tracker.perfAt) / 1000 * speedRef.current));
      return Math.max(0, Math.min(duration, interpolated));
    }
    return Math.max(0, Math.min(duration, state.seconds + (now - state.at) / 1000 * speedRef.current));
  }, [duration]);

  const halt = useCallback((at: number) => {
    request.current++;
    pending.current = false;
    anchor.current = idle(at);
    smoothMedia.current = { mediaTime: at, perfAt: 0 };
    audioRef.current?.pause();
    if (audioRef.current) {
      try { audioRef.current.volume = 1; } catch {}
    }
    const onPaused = gracefulPauseRef.current?.onPaused;
    gracefulPauseRef.current = null;
    setPlaying(false); setBuffering(false); setSeconds(at);
    onPaused?.(at);
  }, []);

  const onAudioError = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    if (anchor.current.media && anchor.current.running) {
      const at = pending.current ? anchor.current.seconds : read();
      anchor.current = { seconds: at, at: performance.now(), running: true, media: false };
      setSeconds(at);
    }
    pending.current = false;
    setBuffering(false); setAudioIssue("Audio isn’t available. The whiteboard and captions will continue.");
  }, [read]);

  const move = useCallback((position: number, play: boolean) => {
    const at = Math.max(0, Math.min(duration, position)), media = audioRef.current;
    gracefulPauseRef.current = null;
    if (media) {
      try { media.volume = 1; } catch {}
    }
    smoothMedia.current = { mediaTime: at, perfAt: performance.now() };
    lastUiSync.current = { bucket: Math.floor(at * 5), boundaryIndex: -1 };
    if (at >= duration || !play) {
      halt(at);
      if (media && source && !failed.current) {
        if (media.readyState >= 1) {
          try { media.currentTime = at; } catch { /* Set the next position again when playing. */ }
        } else {
          media.addEventListener("loadedmetadata", () => {
            try { media.currentTime = at; } catch {}
          }, { once: true });
        }
      }
      return;
    }
    const version = ++request.current;
    const useAudio = Boolean(source && media && !failed.current);
    anchor.current = { seconds: at, at: performance.now(), running: true, media: useAudio };
    setSeconds(at); setPlaying(true); setBuffering(useAudio); pending.current = useAudio;
    if (media && useAudio) {
      const applyPlay = () => {
        if (request.current !== version) return;
        try {
          media.playbackRate = speedRef.current;
          if (Math.abs(media.currentTime - at) > .02) media.currentTime = at;
          void media.play().then(() => {
            if (request.current === version) {
              media.playbackRate = speedRef.current;
              pending.current = false;
              smoothMedia.current = { mediaTime: media.currentTime, perfAt: performance.now() };
              setBuffering(false);
            }
          }).catch((err) => {
            if (request.current !== version) return;
            if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
              pending.current = false;
              setBuffering(false);
              anchor.current = { seconds: at, at: performance.now(), running: true, media: false };
              setAudioIssue("Autoplay was blocked by browser. Click to enable audio.");
              return;
            }
            onAudioError();
          });
        } catch {
          if (request.current === version) {
            pending.current = false;
            setBuffering(false);
            anchor.current = { seconds: at, at: performance.now(), running: true, media: false };
            onAudioError();
          }
        }
      };

      if (media.readyState >= 1) {
        applyPlay();
      } else {
        media.addEventListener("loadedmetadata", applyPlay, { once: true });
        // Safety timeout: if audio takes longer than 1200ms, proceed visually without hanging
        setTimeout(() => {
          if (request.current === version && pending.current) {
            pending.current = false;
            setBuffering(false);
            anchor.current = { seconds: at, at: performance.now(), running: true, media: false };
          }
        }, 1200);
      }
    }
  }, [duration, halt, onAudioError, source]);

  const pause = useCallback(() => halt(pending.current ? anchor.current.seconds : read()), [halt, read]);

  const gracefulPause = useCallback((targetTime?: number, onPaused?: (pausedAt: number) => void) => {
    const current = pending.current ? anchor.current.seconds : read();
    const target = targetTime !== undefined ? Math.max(current + 0.1, Math.min(duration, targetTime)) : current + 0.8;
    const fadeLead = Math.min(0.6, Math.max(0.2, (target - current) * 0.75));
    gracefulPauseRef.current = {
      targetTime: target,
      startFadeAt: Math.max(current, target - fadeLead),
      onPaused,
    };
  }, [duration, read]);

  const cancelGracefulPause = useCallback(() => {
    gracefulPauseRef.current = null;
    if (audioRef.current) {
      try { audioRef.current.volume = 1; } catch {}
    }
  }, []);

  const start = useCallback(() => { setOpen(true); setRevision(r => r + 1); move(0, true); }, [move]);
  const close = useCallback(() => { halt(0); setOpen(false); }, [halt]);
  const seek = useCallback((at: number) => { setRevision(r => r + 1); move(at, anchor.current.running); }, [move]);
  const toggle = useCallback(() => {
    if (anchor.current.running) { pause(); return; }
    const at = anchor.current.seconds;
    if (at >= duration) start(); else move(at, true);
  }, [duration, move, pause, start]);
  const onAudioEnded = useCallback(() => { if (anchor.current.media && anchor.current.running) halt(duration); }, [duration, halt]);

  const previousSource = useRef(source);
  useEffect(() => {
    if (previousSource.current === source) return;
    const oldSource = previousSource.current;
    previousSource.current = source;
    failed.current = false;
    setAudioIssue("");

    if (!source) {
      close();
      return;
    }

    if (oldSource && source !== oldSource) {
      const at = anchor.current.seconds;
      const wasRunning = anchor.current.running;
      if (wasRunning || open) {
        move(at, wasRunning);
      }
    }
  }, [source, close, move, open]);

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const value = pending.current ? anchor.current.seconds : read();

      // Check graceful pause and handle audio volume fade
      if (gracefulPauseRef.current) {
        const { targetTime, startFadeAt, onPaused } = gracefulPauseRef.current;
        if (value >= startFadeAt && audioRef.current && !failed.current) {
          const fadeDuration = Math.max(0.1, targetTime - startFadeAt);
          const remaining = Math.max(0, targetTime - value);
          const vol = Math.max(0, Math.min(1, remaining / fadeDuration));
          try {
            audioRef.current.volume = vol;
          } catch {}
        }
        if (value >= targetTime) {
          gracefulPauseRef.current = null;
          if (audioRef.current) {
            try { audioRef.current.volume = 1; } catch {}
          }
          halt(targetTime);
          onPaused?.(targetTime);
          return;
        }
      }

      if (value >= duration) { halt(duration); return; }
      const bucket = Math.floor(value * 5);
      const bList = boundariesRef.current;
      let bIdx = -1;
      if (bList) {
        for (let i = 0; i < bList.length; i++) {
          if (value >= bList[i]) bIdx = i; else break;
        }
      }
      if (bucket !== lastUiSync.current.bucket || bIdx !== lastUiSync.current.boundaryIndex) {
        lastUiSync.current = { bucket, boundaryIndex: bIdx };
        setSeconds(value);
      }
    };
    const timer = window.setInterval(tick, 50);
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [playing, duration, halt, read, pause]);

  return {
    audioRef, open, playing, seconds, muted, buffering, audioIssue, revision, read,
    speed, setSpeed,
    start, seek, pause, gracefulPause, cancelGracefulPause, close, toggle, onAudioError, onAudioEnded,
    toggleMute: () => setMuted(value => !value),
    onAudioWaiting: () => { if (anchor.current.media && anchor.current.running) setBuffering(true); },
    onAudioPlaying: () => {
      if (anchor.current.media && anchor.current.running) {
        if (audioRef.current) {
          try { audioRef.current.playbackRate = speedRef.current; } catch {}
          smoothMedia.current = { mediaTime: audioRef.current.currentTime, perfAt: performance.now() };
        }
        setBuffering(false);
      }
    },
  };
}
