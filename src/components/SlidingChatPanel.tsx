"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, GraduationCap } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export type SlidingChatPanelProps = {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  busy: boolean;
  pendingQuestion?: string;
  onSend: (text: string) => void;
  suggestions?: string[];
  studentName?: string;
};

export default function SlidingChatPanel({
  open,
  onClose,
  messages,
  busy,
  pendingQuestion,
  onSend,
  suggestions = [],
  studentName = "You",
}: SlidingChatPanelProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, busy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <aside
      className={`meet-sliding-chat ${open ? "is-open" : ""}`}
      role="region"
      aria-label="Conversation transcript and discussion"
      aria-hidden={!open}
    >
      {/* Panel Header */}
      <div className="meet-chat-header">
        <div className="meet-chat-header-title">
          <GraduationCap size={20} className="meet-chat-prof-icon" />
          <div>
            <h2>Conversation & Transcript</h2>
            <p className="meet-chat-subtitle">Discussion & Q&A with Professor</p>
          </div>
        </div>
        <button
          type="button"
          className="meet-chat-close-btn"
          onClick={onClose}
          title="Close conversation panel"
          aria-label="Close conversation panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Stream: Unified chronological transcript */}
      <div className="meet-chat-messages" tabIndex={0} role="log" aria-live="polite">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className={`meet-chat-msg ${isUser ? "is-user" : "is-tutor"}`}>
              <div className="meet-chat-author-row">
                <span className="meet-chat-author-name">{isUser ? studentName : "Professor"}</span>
                <span className="meet-chat-timestamp">Now</span>
              </div>
              <div className={`meet-chat-bubble ${!isUser ? "meet-tutor-bubble" : ""}`}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Live busy / thinking state */}
        {busy && (
          <div className="meet-chat-msg is-tutor is-thinking">
            <div className="meet-chat-author-row">
              <span className="meet-chat-author-name">Professor</span>
              <span className="meet-chat-timestamp">Professor is thinking…</span>
            </div>
            <div className="meet-chat-bubble meet-tutor-bubble thinking-bubble">
              <span className="meet-thinking-dots">
                <i className="dot d1" />
                <i className="dot d2" />
                <i className="dot d3" />
              </span>
              <span>
                {pendingQuestion
                  ? `“${pendingQuestion}” · Professor is demonstrating on the whiteboard…`
                  : "Professor is thinking & demonstrating on the whiteboard…"}
              </span>
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        {suggestions.length > 0 && !busy && (
          <div className="meet-chat-suggestions">
            <span className="meet-chat-sug-title">Suggested questions:</span>
            <div className="meet-chat-sug-list">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="meet-chat-sug-pill"
                  onClick={() => onSend(s)}
                  disabled={busy}
                >
                  <Sparkles size={11} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Unified Question Composer */}
      <form className="meet-chat-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          className="meet-chat-input"
          aria-label="Ask Professor a question"
          placeholder="Ask Professor a question or request a diagram…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          className="meet-chat-send-btn"
          disabled={!draft.trim() || busy}
          title="Send question"
          aria-label="Send question"
        >
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
