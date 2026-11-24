"use client";

import { useEffect, useState } from "react";
import {
  Captions,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Pause,
  Play,
  X,
} from "lucide-react";

export type GoogleMeetBarProps = {
  title: string;
  listening: boolean;
  speaking: boolean;
  busy: boolean;
  cameraActive?: boolean;
  captionsActive: boolean;
  chatOpen: boolean;
  unreadCount?: number;
  presenting?: boolean;
  handRaised?: boolean;
  audioLevel?: number;
  vadActive?: boolean;
  onToggleMic: () => void;
  onToggleCamera?: () => void;
  onToggleCaptions: () => void;
  onTogglePresent?: () => void;
  onRaiseHand?: () => void;
  onToggleChat: () => void;
  onLeaveCall?: () => void;
  onOpenInfo?: () => void;
  onOpenPeople?: () => void;
  // Lecture playback integration:
  lectureActive?: boolean;
  lecturePlaying?: boolean;
  lectureIndex?: number;
  lectureTotal?: number;
  audioIssue?: string;
  onLecturePrev?: () => void;
  onLectureToggle?: () => void;
  onLectureNext?: () => void;
  onExitLecture?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  boostMode?: boolean;
  onToggleBoost?: () => void;
};

export default function GoogleMeetBar({
  title,
  listening,
  speaking,
  busy,
  captionsActive,
  chatOpen,
  unreadCount = 0,
  audioLevel = 0,
  vadActive = false,
  onToggleMic,
  onToggleCaptions,
  onToggleChat,
  lectureActive = false,
  lecturePlaying = false,
  lectureIndex = 0,
  lectureTotal = 1,
  audioIssue = "",
  onLecturePrev,
  onLectureToggle,
  onLectureNext,
  onExitLecture,
  speed = 1,
  onSpeedChange,
}: GoogleMeetBarProps) {
  const handleCycleSpeed = () => {
    if (!onSpeedChange) return;
    const CYCLE_SPEEDS = [1, 1.25, 1.5, 2, 0.75];
    const current = speed ?? 1;
    const idx = CYCLE_SPEEDS.indexOf(current);
    const next = idx === -1 || idx === CYCLE_SPEEDS.length - 1 ? CYCLE_SPEEDS[0] : CYCLE_SPEEDS[idx + 1];
    onSpeedChange(next);
  };

  return (
    <footer className="meet-bottom-bar" role="toolbar" aria-label="Learning controls">
      {/* Left section: Current Lesson / Topic Title */}
      <div className="meet-bar-left">
        <div className="meet-call-title-wrap" title={title}>
          <span className="meet-call-title">{title}</span>
        </div>
      </div>

      {/* Center section: Unified Lesson Playback & Voice Controls */}
      <div className="meet-bar-center">
        {/* Playback navigation: Previous, Play/Pause, Next, Exit */}
        <div className="meet-lecture-controls lecture-player" role="region" aria-label="Prerecorded class player">
          {/* Previous chapter */}
          <button
            type="button"
            className="meet-playback-btn"
            onClick={onLecturePrev}
            disabled={!lectureActive || lectureIndex === 0}
            title="Previous chapter"
            aria-label="Previous chapter"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            className={`meet-playback-btn ${lecturePlaying ? "is-active-feature" : ""}`}
            onClick={onLectureToggle}
            title={lecturePlaying ? "Pause class" : "Resume class"}
            aria-label={lecturePlaying ? "Pause class" : "Resume class"}
            aria-pressed={lecturePlaying}
          >
            {lecturePlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Next chapter */}
          <button
            type="button"
            className="meet-playback-btn"
            onClick={onLectureNext}
            disabled={!lectureActive || (lectureTotal !== undefined && lectureIndex !== undefined && lectureIndex >= lectureTotal - 1)}
            title="Next chapter"
            aria-label="Next chapter"
          >
            <ChevronRight size={20} />
          </button>

          {/* Exit Class */}
          {lectureActive && onExitLecture && (
            <button
              type="button"
              className="meet-playback-btn"
              onClick={onExitLecture}
              title="Exit class"
              aria-label="Exit class"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Microphone: Voice input with live VAD meter */}
        <button
          type="button"
          className={`meet-ctrl-btn ${listening ? "is-active-mic" : speaking ? "is-tutor-speaking" : "is-muted-mic"}`}
          onClick={onToggleMic}
          disabled={busy}
          title={listening ? "Microphone is ON (click to send question)" : "Turn on microphone to ask Professor (Ctrl + d / M)"}
          aria-label={listening ? "Turn off microphone" : "Turn on microphone"}
          aria-pressed={listening}
          data-vad-active={vadActive ? "true" : "false"}
          data-audio-level={audioLevel}
        >
          {listening ? <Mic size={20} className="pulse-mic-icon" /> : <MicOff size={20} />}
          {audioLevel > 0.05 && (
            <span
              className="live-audio-meter-pulse"
              style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Closed Captions */}
        <button
          type="button"
          className={`meet-ctrl-btn ${captionsActive ? "is-active-feature" : ""}`}
          onClick={onToggleCaptions}
          title={captionsActive ? "Turn off captions (c)" : "Turn on captions (c)"}
          aria-label={captionsActive ? "Turn off captions" : "Turn on captions"}
          aria-pressed={captionsActive}
        >
          <Captions size={20} />
        </button>

        {/* Playback Speed Controller */}
        {onSpeedChange && (
          <button
            type="button"
            className={`meet-ctrl-btn meet-speed-btn ${speed && speed !== 1 ? "is-active-feature" : ""}`}
            onClick={handleCycleSpeed}
            title={`Playback speed: ${speed || 1}x (click to change)`}
            aria-label={`Playback speed: ${speed || 1}x`}
          >
            <span className="meet-speed-label">{speed || 1}x</span>
          </button>
        )}

        {audioIssue && <span className="class-audio-message sr-only" role="status">{audioIssue}</span>}
      </div>

      {/* Right section: balanced spacer */}
      <div className="meet-bar-right" />
    </footer>
  );
}
