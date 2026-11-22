"use client";

import { memo } from "react";

/**
 * TeacherCam has been deprecated in favor of a clean, distraction-free whiteboard learning experience.
 * Professor speaks directly via the unified speech service and draws on the live canvas.
 */
export const TeacherCam = memo(function TeacherCam(_props: {
  speaking?: boolean;
  paused?: boolean;
  muted?: boolean;
}) {
  return null;
});
