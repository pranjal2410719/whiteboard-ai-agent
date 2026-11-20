"use client";

import { BookOpen, Captions, Check, ChevronLeft, ChevronRight, Clapperboard, Clock3, Copy, FileText, LoaderCircle, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useId, useState } from "react";
import type { RecordedClass } from "@/lib/recorded-classes";

type Chapter = { title: string; narration: string; seconds: number; start: number };
const clock = (seconds: number) => { const value = Math.max(0, Math.floor(seconds + .0001)); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`; };

export type LecturePlayerProps = {
  recording?: RecordedClass; open: boolean; hasLecture: boolean; requesting: boolean; canStart: boolean;
  playing: boolean; muted: boolean; voiceSupported: boolean; buffering: boolean; audioIssue: string;
  title: string; caption: string; index: number; holding: boolean; scenes: Chapter[];
  elapsed: number; totalSeconds: number;
  onStart: () => void; onToggle: () => void; onSeek: (s: number) => void; onExit: () => void; onToggleMute: () => void; onNotes: () => void;
};

export default function LecturePlayer({ recording, open, hasLecture, requesting, canStart, playing, muted, voiceSupported, buffering, audioIssue, title, caption, index, holding, scenes, elapsed, totalSeconds, onStart, onToggle, onSeek, onExit, onToggleMute, onNotes }: LecturePlayerProps) {
  const [scriptOpen, setScriptOpen] = useState(false), [copied, setCopied] = useState(false);
  const id = useId();
  const complete = elapsed >= totalSeconds;
  const start = () => { setCopied(false); onStart(); };
  const copyScript = async () => {
    const lines = scenes.map((c, i) => `${i + 1}. ${c.title} · ${clock(c.start)}–${clock(c.start + c.seconds)}\n${c.narration}`);
    try { await navigator.clipboard.writeText(`${title}\n\n${lines.join("\n\n")}`); setCopied(true); } catch { /* The visible transcript can also be selected manually. */ }
  };
  const chapterList = (active: boolean) => <div className="class-chapters" aria-label={active ? "Playback chapters" : "Class outline"}>{scenes.map((chapter, i) => {
    const body = <><span className="class-chapter-num">{i < index && active ? <Check size={12}/> : String(i + 1).padStart(2, "0")}</span><span className="class-chapter-copy"><strong>{chapter.title}</strong><small>{clock(chapter.start)}</small></span></>;
    return active ? <button type="button" key={chapter.title + i} className={`class-chapter${i === index ? " current" : ""}`} aria-current={i === index ? "step" : undefined} onClick={() => onSeek(chapter.start)} aria-label={`Go to chapter ${i + 1}: ${chapter.title}`}>{body}</button> : <div className="class-chapter" key={chapter.title + i}>{body}</div>;
  })}</div>;
  if (!open || !hasLecture) return null;

  return <section className="lecture-player class-card is-open" aria-label={recording ? "Prerecorded class player" : "Whiteboard lecture player"}>
    <h2 className="class-player-title sr-only">{title}</h2>
    <div className="lecture-head class-player-head"><span className="lecture-live"><Clapperboard size={13}/>{recording ? "Recorded class" : "Tutor lecture"}</span><strong title={title}>{scenes[index]?.title || title}</strong><span className="lecture-remaining">{complete ? "Class complete" : buffering ? "Loading audio…" : !playing ? "Paused" : `${clock(Math.ceil(totalSeconds - elapsed))} left`}</span><button className="icon-button lecture-exit" aria-label="Exit class" title="Return to whiteboard" onClick={onExit}><X size={16}/></button></div>
    <div className="class-caption" aria-label="Current caption"><span><Captions size={18}/></span><div>{holding && <small>YOUR TURN · PAUSE TO TRY</small>}<p className="lecture-caption">{caption}</p></div></div>
    <div className="class-timeline"><label htmlFor={id} className="sr-only">Class timeline</label><input id={id} type="range" min={0} max={totalSeconds} step={.1} value={elapsed} aria-valuetext={`${clock(elapsed)} of ${clock(totalSeconds)}`} style={{ "--played": `${Math.min(100, elapsed / Math.max(totalSeconds, 1) * 100)}%` } as React.CSSProperties} onChange={e => onSeek(Number(e.currentTarget.value))}/>
      <div className="class-timecodes"><span>{clock(elapsed)}</span><span>{clock(totalSeconds)}</span></div>
    </div>
    <div className="lecture-controls class-controls"><div className="lecture-transport">
      <button className="icon-button" aria-label="Previous chapter" title="Previous chapter" disabled={index === 0} onClick={() => onSeek(scenes[index - 1].start)}><ChevronLeft size={16}/></button>
      <button className="lecture-play" aria-label={complete ? "Replay class" : playing ? "Pause class" : "Resume class"} title={complete ? "Replay class" : playing ? "Pause class" : "Resume class"} onClick={onToggle}>{buffering ? <LoaderCircle className="spin" size={16}/> : complete ? <RotateCcw size={16}/> : playing ? <Pause size={15} fill="currentColor"/> : <Play size={15} fill="currentColor"/>}</button>
      <button className="icon-button" aria-label="Next chapter" title="Next chapter" disabled={index >= scenes.length - 1} onClick={() => onSeek(scenes[index + 1].start)}><ChevronRight size={16}/></button>
      <button className="icon-button class-audio-button" aria-label={muted ? "Unmute narration" : "Mute narration"} title={muted ? "Unmute narration" : "Mute narration"} onClick={onToggleMute} disabled={!voiceSupported || Boolean(audioIssue)}>{muted || !voiceSupported || audioIssue ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>
    </div><div className="lecture-secondary">
      {recording && <button className="class-notes-button is-compact" onClick={onNotes}><BookOpen size={14}/> <span>Study notes</span></button>}
      <button className={`lecture-script-button ${scriptOpen ? "active" : ""}`} aria-expanded={scriptOpen} aria-controls={`${id}-transcript`} onClick={() => { setScriptOpen(v => !v); setCopied(false); }}><FileText size={14}/>{scriptOpen ? "Hide transcript" : "Transcript"}</button>
    </div></div>
    {chapterList(true)}
    {audioIssue && <p className="class-audio-message" role="status">{audioIssue}</p>}
    {scriptOpen && <div className="lecture-script" id={`${id}-transcript`} role="region" aria-label="Full class transcript">
      <div className="lecture-script-heading"><FileText size={14}/><strong>Full class transcript</strong><span>{clock(totalSeconds)}</span><button type="button" className="script-copy" onClick={() => void copyScript()} aria-label={copied ? "Transcript copied" : "Copy transcript"}>{copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? "Copied" : "Copy"}</button></div>
      {scenes.map((chapter, i) => <article key={chapter.title + i} className={`script-scene ${index === i ? "current" : ""}`} aria-current={index === i ? "step" : undefined}><div className="script-scene-title"><span>Chapter {i + 1}</span><strong>{chapter.title}</strong><small>{clock(chapter.start)}–{clock(chapter.start + chapter.seconds)}</small></div><p>{chapter.narration}</p></article>)}
    </div>}
  </section>;
}
