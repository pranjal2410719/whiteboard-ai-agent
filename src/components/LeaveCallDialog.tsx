"use client";

/**
 * LeaveCallDialog has been deprecated. Meeting-style call departure modals
 * have been removed in favor of direct student navigation and classroom controls.
 */
export type LeaveCallDialogProps = {
  isOpen?: boolean;
  onRejoin?: () => void;
  onReturnHome?: () => void;
};

export default function LeaveCallDialog(_props: LeaveCallDialogProps) {
  return null;
}
