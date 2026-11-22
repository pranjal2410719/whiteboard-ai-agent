"use client";

import { memo } from "react";
import { Sparkles, Volume2 } from "lucide-react";

export type LiveCaptionsOverlayProps = {
  active: boolean;
  speaking: boolean;
  listening: boolean;
  latestReply: string;
  liveUserSpeech: string;
  pendingQuestion?: string;
};

export const LiveCaptionsOverlay = memo(function LiveCaptionsOverlay({
  active,
  speaking,
  listening,
  latestReply,
  liveUserSpeech,
  pendingQuestion,
}: LiveCaptionsOverlayProps) {
  if (!active) return null;

  const userText = liveUserSpeech || (listening ? pendingQuestion : "");
  const hasContent = Boolean(userText || (speaking && latestReply));

  if (!hasContent) return null;

  return (
    <div className="meet-captions-overlay" role="region" aria-label="Closed captions">
      {userText ? (
        <div className="meet-caption-line user-caption">
          <span className="meet-caption-speaker">You:</span>
          <span className="meet-caption-text">“{userText}”</span>
        </div>
      ) : speaking && latestReply ? (
        <div className="meet-caption-line tutor-caption">
          <span className="meet-caption-speaker">
            <Volume2 size={13} className="speaking-wave" />
            Professor:
          </span>
          <span className="meet-caption-text">{latestReply}</span>
        </div>
      ) : null}
    </div>
  );
});
