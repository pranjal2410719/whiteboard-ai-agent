"use client";

import { memo, useEffect, useRef, useState, useMemo } from "react";
import { Volume2, Sparkles } from "lucide-react";

export type LiveCaptionsOverlayProps = {
  active: boolean;
  speaking: boolean;
  busy?: boolean;
  listening: boolean;
  latestReply: string;
  liveUserSpeech: string;
  pendingQuestion?: string;
  lectureCaption?: string;
  lectureActive?: boolean;
  lecturePlaying?: boolean;
};

type CaptionState = {
  speaker: "user" | "tutor";
  text: string;
  isThinking?: boolean;
};

export const LiveCaptionsOverlay = memo(function LiveCaptionsOverlay({
  active,
  speaking,
  busy = false,
  listening,
  latestReply,
  liveUserSpeech,
  pendingQuestion,
  lectureCaption,
  lectureActive = false,
  lecturePlaying = false,
}: LiveCaptionsOverlayProps) {
  // Determine current active content based on priority hierarchy
  const userText = (liveUserSpeech || (listening ? pendingQuestion : "") || "").trim();
  const tutorReply = latestReply.trim();
  const classCaption = (lectureCaption || "").trim();

  // Active target determination
  let currentTarget: CaptionState | null = null;
  if (userText) {
    currentTarget = { speaker: "user", text: userText };
  } else if (busy && !speaking) {
    currentTarget = {
      speaker: "tutor",
      text: pendingQuestion ? `“${pendingQuestion}” · Professor is thinking…` : "Professor is thinking…",
      isThinking: true,
    };
  } else if (speaking && tutorReply) {
    currentTarget = { speaker: "tutor", text: tutorReply };
  } else if (lectureActive && classCaption && (lecturePlaying || speaking)) {
    currentTarget = { speaker: "tutor", text: classCaption };
  } else if (lectureActive && classCaption && !lecturePlaying) {
    // When paused during a lecture, keep the current scene sentence displayed
    currentTarget = { speaker: "tutor", text: classCaption };
  }

  // State to hold the displayed text with typing effect and hold/fade-out
  const [displayedCount, setDisplayedCount] = useState(0);
  const [activeCaption, setActiveCaption] = useState<CaptionState | null>(null);
  const [isFading, setIsFading] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeCaption and handle smooth hold & fade-out when speech completes
  useEffect(() => {
    if (currentTarget) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setIsFading(false);

      setActiveCaption(prev => {
        if (!prev || prev.speaker !== currentTarget!.speaker || prev.text !== currentTarget!.text) {
          // If the new text extends the previous text (e.g. streaming speech recognition)
          if (
            prev &&
            prev.speaker === currentTarget!.speaker &&
            currentTarget!.text.startsWith(prev.text)
          ) {
            // Keep displayedCount where it is so it smoothly catches up
            return currentTarget;
          }
          // New text: reset displayed count to start typing animation
          setDisplayedCount(0);
          return currentTarget;
        }
        return prev;
      });
    } else if (activeCaption && !isFading) {
      // Speech just ended: hold the caption gracefully for 2.6s before fading
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        setIsFading(true);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => {
          setActiveCaption(null);
          setIsFading(false);
          setDisplayedCount(0);
        }, 500);
      }, 2600);
    }

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [currentTarget?.speaker, currentTarget?.text, currentTarget?.isThinking]);

  // Unicode safe characters array (handles Devanagari and multi-byte characters accurately)
  const targetChars = useMemo(() => {
    if (!activeCaption?.text) return [];
    return Array.from(activeCaption.text);
  }, [activeCaption?.text]);

  // Typing animation effect with synchronized cadence
  useEffect(() => {
    if (!activeCaption?.text || displayedCount >= targetChars.length) return;

    const remaining = targetChars.length - displayedCount;
    // Dynamically pace character step to stay synchronized with speech cadence
    const step = remaining > 35 ? 3 : remaining > 16 ? 2 : 1;
    const speed = activeCaption.isThinking ? 42 : 22; // ms per tick

    const timer = setTimeout(() => {
      setDisplayedCount(prev => Math.min(targetChars.length, prev + step));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedCount, targetChars.length, activeCaption]);

  if (!active || !activeCaption) return null;

  const currentChars = targetChars.slice(0, displayedCount);
  const displayedText = currentChars.join("");
  const isTyping = displayedCount < targetChars.length;
  const isUser = activeCaption.speaker === "user";

  return (
    <div
      className={`meet-captions-overlay ${isFading ? "caption-fading" : ""}`}
      role="region"
      aria-label="Live captions"
    >
      <div className={`meet-caption-line ${isUser ? "user-caption" : "tutor-caption"}`}>
        <span className="meet-caption-speaker">
          {isUser ? (
            "You:"
          ) : (
            <>
              {activeCaption.isThinking ? (
                <Sparkles size={13} className="speaking-wave thinking-glow" />
              ) : (
                <Volume2 size={13} className="speaking-wave" />
              )}
              Professor:
            </>
          )}
        </span>
        <span className="meet-caption-text" title={activeCaption.text}>
          {isUser ? `“${displayedText}”` : displayedText}
          {(isTyping || activeCaption.isThinking) && (
            <span className="meet-caption-cursor" aria-hidden="true" />
          )}
        </span>
      </div>
    </div>
  );
});
