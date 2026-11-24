"use client";

import { memo } from "react";
import { Volume2 } from "lucide-react";

export type LiveCaptionsOverlayProps = {
  active: boolean;
  speaking: boolean;
  listening: boolean;
  latestReply: string;
  liveUserSpeech: string;
  pendingQuestion?: string;
  lectureCaption?: string;
};

export const LiveCaptionsOverlay = memo(function LiveCaptionsOverlay({
  active,
  speaking,
  listening,
  latestReply,
  liveUserSpeech,
  pendingQuestion,
  lectureCaption,
}: LiveCaptionsOverlayProps) {
  if (!active) return null;

  const userText = (liveUserSpeech || (listening ? pendingQuestion : "") || "").trim();
  const tutorText = (lectureCaption || latestReply || "").trim();
  const hasContent = Boolean(userText || (speaking && tutorText));

  if (!hasContent) return null;

  return (
    <div className="meet-captions-overlay" role="region" aria-label="Live captions">
      {userText ? (
        <div className="meet-caption-line user-caption">
          <span className="meet-caption-speaker">You:</span>
          <span className="meet-caption-text" title={userText}>“{userText}”</span>
        </div>
      ) : speaking && tutorText ? (
        <div className="meet-caption-line tutor-caption">
          <span className="meet-caption-speaker">
            <Volume2 size={13} className="speaking-wave" />
            Professor:
          </span>
          <span className="meet-caption-text" title={tutorText}>{tutorText}</span>
        </div>
      ) : null}
    </div>
  );
});
