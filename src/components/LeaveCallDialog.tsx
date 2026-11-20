"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";

export type LeaveCallDialogProps = {
  isOpen: boolean;
  onRejoin: () => void;
  onReturnHome: () => void;
};

export default function LeaveCallDialog({
  isOpen,
  onRejoin,
  onReturnHome,
}: LeaveCallDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay meet-leave-overlay" role="dialog" aria-modal="true" aria-labelledby="leave-title">
      <div className="meet-leave-card">
        <h2 id="leave-title">You left the meeting</h2>
        <p className="meet-leave-sub">Your whiteboard notes and study progress have been saved.</p>

        <div className="meet-leave-actions">
          <button type="button" className="meet-leave-rejoin-btn" onClick={onRejoin}>
            <RotateCcw size={15} />
            <span>Rejoin</span>
          </button>
          <button type="button" className="meet-leave-home-btn" onClick={onReturnHome}>
            <ArrowLeft size={15} />
            <span>Return to workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
