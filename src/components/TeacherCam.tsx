"use client";

import { memo, useId } from "react";
import { VolumeX } from "lucide-react";

/**
 * Lightweight circular "talking portrait" for the AI tutor.
 * All motion uses compositor-only properties (transform and opacity) so it never
 * triggers layout/paint or slows the whiteboard's 60fps marker loop.
 */
export const TeacherCam = memo(function TeacherCam({ speaking, paused = false, muted = false }: { speaking: boolean; paused?: boolean; muted?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `tutor-cam-round-${uid}`;
  const skyId = `tutor-cam-sky-${uid}`;
  const blobId = `tutor-cam-blob-${uid}`;
  const state = speaking ? "speaking" : paused ? "paused" : "ready";

  return <div className={`tutor-cam${speaking ? " is-speaking" : ""}${paused ? " is-paused" : ""}${muted ? " is-muted" : ""}`} role="img" aria-label={`AI tutor portrait · ${state}`} data-motion="css-only" data-speaking={speaking}>
    <div className="tutor-cam-frame">
      <svg viewBox="0 0 88 88" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId}><circle cx="44" cy="44" r="43"/></clipPath>
          <linearGradient id={skyId} x1="12" y1="6" x2="76" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f2f8ec"/><stop offset=".65" stopColor="#e3f0da"/><stop offset="1" stopColor="#d2e5c7"/>
          </linearGradient>
          <linearGradient id={blobId} x1="26" y1="16" x2="62" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ea173"/><stop offset=".55" stopColor="#4f8259"/><stop offset="1" stopColor="#3c6747"/>
          </linearGradient>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="88" height="88" fill={`url(#${skyId})`}/>
          <circle cx="71" cy="18" r="9.5" fill="#f7e9b2" opacity=".82"/>
          <path d="M-2 77q24-11 46-7t46 5v15H-2Z" fill="#cde0c2" opacity=".7"/>
          <circle cx="15" cy="23" r="1.4" fill="#92b38a" opacity=".75"/>
          <circle cx="22" cy="16" r=".95" fill="#92b38a" opacity=".6"/>
          <path d="M64 26l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9Z" fill="#7da573" opacity=".85"/>

          <g className="tutor-cam-blob">
            {/* Soft organic sage blob silhouette */}
            <path d="M18 86c-2-15 0-36 6-50 4-11 11-18 20-18s16 7 20 18c6 14 8 35 6 50Z" fill={`url(#${blobId})`} stroke="#35583e" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M27 32c3-8 9-12 16-12 3 0 5 .6 7 1.6-6 .4-12 4.4-16 11.4-2.5 4.4-4 10-5 15.5-.8-6.2-.5-11.8-2-16.5Z" fill="#89ba8b" opacity=".32"/>
            {/* Teacher collar and tidy ribbon accent */}
            <path d="M35 69c3 3.2 15 3.2 18 0l3 17H32Z" fill="#f7f1e1" stroke="#35583e" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M38 69l6 5.5 6-5.5" fill="none" stroke="#c8bea2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M40.5 73.5l3.5 1.9 3.5-1.9v3.6l-3.5-1.9-3.5 1.9Z" fill="#52805b" stroke="#35583e" strokeWidth="1" strokeLinejoin="round"/>
          </g>

          {/* Animated bouncy ponytail with hair tie */}
          <g className="tutor-cam-ponytail">
            <ellipse cx="61.5" cy="35" rx="2.6" ry="3.8" fill="#bc7948" stroke="#35583e" strokeWidth="1.1" transform="rotate(-28 61.5 35)"/>
            <path d="M62 33.5 C68 28 78 32 79 41 C79.5 48 73 53 67 52 C62 51 68 44 67 39 C65.5 35 62 34 62 33.5 Z" fill={`url(#${blobId})`} stroke="#35583e" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M64 34.5 C69 31.5 74 35 75 41 C75 45 71.5 48 68 49" fill="none" stroke="#89ba8b" strokeWidth="1" strokeLinecap="round" opacity=".55"/>
          </g>

          <g className="tutor-cam-head">
            {/* Warm cozy face tucked inside the blob */}
            <path d="M27 44c0-11.5 7.2-19 17-19s17 7.5 17 19c0 10.2-7.3 17.2-17 17.2S27 54.2 27 44Z" fill="#faf4e6" stroke="#3c6246" strokeWidth="1.45"/>
            <path d="M30 34c3-5 8.5-7.5 14-7.5 6.5 0 11 3 13.5 7.5-4.5-2.6-9-3.5-14.5-3.5-5 0-9.5 1.1-13 3.5Z" fill="#efe6d1"/>

            {/* Expressive brows */}
            <g className="tutor-cam-brows">
              <path d="M31.5 36.2q3.8-2.2 7.2 0M49.3 36.2q3.4-2.2 7.2 0" stroke="#57745c" strokeWidth="1.35" strokeLinecap="round" fill="none"/>
            </g>

            {/* Blinking eyes with catchlights */}
            <g className="tutor-cam-eyes">
              <ellipse cx="35.3" cy="42.4" rx="2.05" ry="2.45" fill="#2c3d30"/>
              <ellipse cx="52.7" cy="42.4" rx="2.05" ry="2.45" fill="#2c3d30"/>
              <circle cx="36.0" cy="41.4" r=".75" fill="#ffffff"/>
              <circle cx="53.4" cy="41.4" r=".75" fill="#ffffff"/>
            </g>

            {/* Round teacher glasses */}
            <g fill="none" stroke="#496850" strokeWidth="1.45" strokeLinecap="round">
              <circle cx="35.3" cy="42.4" r="5.6"/>
              <circle cx="52.7" cy="42.4" r="5.6"/><path d="M31.6 39.4a3.8 3.8 0 0 1 2.2-1.2M49.0 39.4a3.8 3.8 0 0 1 2.2-1.2" stroke="#ffffff" strokeWidth=".9" opacity=".65"/>
              <path d="M40.9 42.1q3.1-1.3 6.2 0M29.7 42.2l-2.6-.7M58.3 42.2l2.6-.7"/>
            </g>

            {/* Rosy cheeks */}
            <ellipse cx="30.2" cy="49.2" rx="3.1" ry="1.8" fill="#e5998c" opacity=".42"/>
            <ellipse cx="57.8" cy="49.2" rx="3.1" ry="1.8" fill="#e5998c" opacity=".42"/>

            {/* Expressive mouth: calm smile when idle, open rounded talk shape when speaking */}
            <g className="tutor-cam-mouth">
              <path className="tutor-cam-smile" d="M39.4 51.6q4.6 4.2 9.2 0" stroke="#8b5548" strokeWidth="1.9" strokeLinecap="round" fill="none"/>
              <g className="tutor-cam-talk-shape">
                <ellipse cx="44" cy="52.3" rx="4.2" ry="3.2" fill="#773c36"/>
                <path d="M41.3 53.6q2.7 1.7 5.4 0a3.4 2.2 0 0 1-5.4 0Z" fill="#d87f72"/>
              </g>
            </g>
          </g>

          {/* Animated speaking level bars */}
          <g className="tutor-cam-wave" aria-hidden="true">
            <rect className="wave-a" x="69" y="54" width="2.2" height="9" rx="1.1"/>
            <rect className="wave-b" x="73" y="50" width="2.2" height="15" rx="1.1"/>
            <rect className="wave-c" x="77" y="56" width="2.2" height="7" rx="1.1"/>
          </g>
        </g>
        <circle cx="44" cy="44" r="42.2" fill="none" stroke="#ffffff" strokeWidth="2.8" opacity=".78"/>
      </svg>
      <span className="tutor-cam-status" aria-hidden="true"/>
      {muted && <span className="tutor-cam-muted" aria-hidden="true"><VolumeX size={9}/></span>}
    </div>
    <span className="tutor-cam-label" aria-hidden="true">AI Tutor</span>
  </div>;
});
