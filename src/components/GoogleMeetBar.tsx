"use client";

import { useEffect, useState } from "react";
import {
  Captions,
  Hand,
  Info,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  Sparkles,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

export type GoogleMeetBarProps = {
  title: string;
  listening: boolean;
  speaking: boolean;
  busy: boolean;
  cameraActive: boolean;
  captionsActive: boolean;
  chatOpen: boolean;
  unreadCount?: number;
  presenting: boolean;
  handRaised: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleCaptions: () => void;
  onTogglePresent: () => void;
  onRaiseHand: () => void;
  onToggleChat: () => void;
  onLeaveCall: () => void;
  onOpenInfo?: () => void;
  onOpenPeople?: () => void;
};

export default function GoogleMeetBar({
  title,
  listening,
  speaking,
  busy,
  cameraActive,
  captionsActive,
  chatOpen,
  unreadCount = 0,
  presenting,
  handRaised,
  onToggleMic,
  onToggleCamera,
  onToggleCaptions,
  onTogglePresent,
  onRaiseHand,
  onToggleChat,
  onLeaveCall,
  onOpenInfo,
  onOpenPeople,
}: GoogleMeetBarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="meet-bottom-bar" role="toolbar" aria-label="Meeting controls">
      {/* Left section: Time and Meeting details */}
      <div className="meet-bar-left">
        <div className="meet-call-clock">{time || "12:00 PM"}</div>
        <span className="meet-bar-divider" aria-hidden="true" />
        <div className="meet-call-title-wrap" title={title}>
          <span className="meet-call-dot" />
          <span className="meet-call-title">{title}</span>
        </div>
      </div>

      {/* Center section: The iconic Google Meet rounded control buttons */}
      <div className="meet-bar-center">
        {/* Microphone */}
        <button
          type="button"
          className={`meet-ctrl-btn ${listening ? "is-active-mic" : speaking ? "is-tutor-speaking" : "is-muted-mic"}`}
          onClick={onToggleMic}
          disabled={busy}
          title={listening ? "Microphone is ON (click to send query)" : "Turn on microphone to ask tutor (Ctrl + d)"}
          aria-label={listening ? "Turn off microphone" : "Turn on microphone"}
          aria-pressed={listening}
        >
          {listening ? <Mic size={20} className="pulse-mic-icon" /> : <MicOff size={20} />}
        </button>

        {/* Camera */}
        <button
          type="button"
          className={`meet-ctrl-btn ${cameraActive ? "is-active-camera" : "is-muted-camera"}`}
          onClick={onToggleCamera}
          title={cameraActive ? "Hide teacher avatar (Ctrl + e)" : "Show teacher avatar (Ctrl + e)"}
          aria-label={cameraActive ? "Hide teacher avatar" : "Show teacher avatar"}
          aria-pressed={cameraActive}
        >
          {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
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

        {/* Raise Hand */}
        <button
          type="button"
          className={`meet-ctrl-btn ${handRaised ? "is-active-hand" : ""}`}
          onClick={onRaiseHand}
          disabled={busy}
          title={handRaised ? "Lower hand" : "Raise hand to ask question"}
          aria-label={handRaised ? "Lower hand" : "Raise hand"}
          aria-pressed={handRaised}
        >
          <Hand size={20} />
        </button>

        {/* Present Whiteboard */}
        <button
          type="button"
          className={`meet-ctrl-btn ${presenting ? "is-active-feature" : ""}`}
          onClick={onTogglePresent}
          title={presenting ? "Stop presenting" : "Present whiteboard"}
          aria-label={presenting ? "Stop presenting" : "Present whiteboard"}
          aria-pressed={presenting}
        >
          <ScreenShare size={20} />
        </button>

        {/* Leave Call (Red Pill Button) */}
        <button
          type="button"
          className="meet-ctrl-btn meet-btn-leave"
          onClick={onLeaveCall}
          title="Leave call"
          aria-label="Leave call"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Right section: Info, Participants, Chat */}
      <div className="meet-bar-right">
        {onOpenInfo && (
          <button
            type="button"
            className="meet-side-ctrl-btn"
            onClick={onOpenInfo}
            title="Meeting details"
            aria-label="Meeting details"
          >
            <Info size={19} />
          </button>
        )}

        {onOpenPeople && (
          <button
            type="button"
            className="meet-side-ctrl-btn"
            onClick={onOpenPeople}
            title="People (2)"
            aria-label="Show everyone in call"
          >
            <Users size={19} />
            <span className="meet-people-count">2</span>
          </button>
        )}

        {/* Chat button */}
        <button
          type="button"
          className={`meet-side-ctrl-btn ${chatOpen ? "is-panel-open" : ""}`}
          onClick={onToggleChat}
          title={chatOpen ? "Close chat" : "Chat with everyone (in-call messages)"}
          aria-label={chatOpen ? "Close chat" : "Chat with everyone"}
          aria-expanded={chatOpen}
        >
          <MessageSquare size={19} />
          {!chatOpen && unreadCount > 0 && <span className="meet-unread-dot" />}
        </button>
      </div>
    </footer>
  );
}
