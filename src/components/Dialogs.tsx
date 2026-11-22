"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronRight, ChartPie as CirclePie, CloudRain, Cpu, Equal, Eye, EyeOff, FileStack, GraduationCap, Heart, Keyboard, KeyRound, Languages, LoaderCircle, MessageSquareText, Mic, Pencil, Settings2, ShieldCheck, Sparkles, TriangleRight, Volume2, WandSparkles, X, Zap } from "lucide-react";
import { catalog } from "@/lib/lessons";
import type { Preferences, StudySession, SupportedLanguage } from "@/lib/types";
import { GeminiMark, TutorAvatar } from "./Brand";

export const LessonIcon = ({ lesson, size = 20 }: { lesson: string; size?: number }) =>
  lesson === "fractions" ? <CirclePie size={size}/> :
  lesson === "water-cycle" || lesson === "water-diagram" ? <CloudRain size={size}/> :
  lesson === "circuit-diagram" ? <Zap size={size}/> :
  lesson === "heart-diagram" ? <Heart size={size}/> :
  lesson === "human-cell" || lesson === "cell-diagram" ? <Sparkles size={size}/> :
  lesson === "inclined-diagram" ? <TriangleRight size={size}/> :
  <TriangleRight size={size}/>;

export function Modal({ title, subtitle, onClose, children, icon, className = "" }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; icon?: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const titleId = useId(); const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); }
      if (e.key === "Tab") {
        const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex="0"]') || []).filter(n => n.offsetParent !== null);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
    <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button>
    {icon && <div className="modal-symbol">{icon}</div>}<h2 id={titleId}>{title}</h2>{subtitle && <p className="modal-subtitle">{subtitle}</p>}{children}
  </div></div>;
}

import { CurriculumPicker, type SessionCreatePayload } from "./CurriculumPicker";

export function NewSessionDialog({ onClose, onCreate, connected, onConnect }: { onClose: () => void; onCreate: (payload: any) => Promise<void>; connected: boolean; onConnect: () => void }) {
  const [tab, setTab] = useState<"catalog" | "curriculum">("catalog");
  const [topic, setTopic] = useState(""); const [selected, setSelected] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const start = async (e: React.FormEvent) => { e.preventDefault(); if (!topic.trim() || pending) return; setPending(true); setError(""); try { await onCreate(topic); } catch (err) { setError(err instanceof Error ? err.message : "Could not create a session. Please try again."); } finally { setPending(false); } };
  return <Modal title="Start a live topic class" subtitle="Select a subject and chapter, or enter any topic. The AI tutor prepares the diagrams and leads the class dynamically." icon={<GraduationCap size={24}/>} onClose={() => { if (!pending) onClose(); }} className={`new-session-modal ${tab === "curriculum" ? "curriculum-mode" : ""}`}>
    <div className="new-session-nav-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === "curriculum"} className={`session-tab-btn ${tab === "curriculum" ? "active" : ""}`} onClick={() => setTab("curriculum")}>
        <Sparkles size={14}/> 3-Step Curriculum Explorer
      </button>
      <button type="button" role="tab" aria-selected={tab === "catalog"} className={`session-tab-btn ${tab === "catalog" ? "active" : ""}`} onClick={() => setTab("catalog")}>
        <FileStack size={14}/> Guided Lessons
      </button>
    </div>

    {tab === "curriculum" ? (
      <CurriculumPicker onClose={onClose} onCreate={onCreate} connected={connected} onConnect={onConnect} />
    ) : (
      <form onSubmit={start}><label className="field-label" htmlFor="new-topic">What would you like to learn?</label><div className="topic-input-wrap"><Sparkles size={17}/><input id="new-topic" autoComplete="off" placeholder="e.g. How does blood circulate through the human heart?" value={topic} onChange={e => { setTopic(e.target.value); setSelected(""); setError(""); }} maxLength={600} disabled={pending}/></div>
        <div className="section-caption"><span>GUIDED LESSONS</span><span className="caption-rule"/></div><div className="lesson-options">{catalog.map(item => <button type="button" disabled={pending} key={item.key} onClick={() => { setSelected(item.key); setTopic(item.title); setError(""); }} className={`lesson-option ${selected === item.key ? "chosen" : ""}`}><span className={`lesson-icon ${item.color}`}><LessonIcon lesson={item.key}/></span>{selected === item.key && <Check className="option-check" size={15}/>}<strong>{item.title}</strong><small>{item.subject}</small></button>)}</div>
        {!connected && <div className="connection-note"><Cpu size={16}/><span>Guided lessons are ready. <button type="button" onClick={onConnect}>Connect AI</button> for any topic.</span></div>}
        {error && <div className="inline-error" role="alert">{error}</div>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose} disabled={pending}>Cancel</button><button type="submit" className="primary-button" disabled={!topic.trim() || pending}>{pending ? <><LoaderCircle className="spin" size={16}/>Preparing lesson</> : <>Start learning <ArrowRight size={16}/></>}</button></div>
      </form>
    )}
  </Modal>;
}

export function SettingsDialog({ onClose, preferences, onSave }: {
  onClose: () => void;
  preferences: Preferences;
  onSave: (p: Preferences) => void;
  connection?: { connected: boolean; provider: "gemini" | "openai"; model: string; serverConfigured: boolean; tabKey: boolean };
  initialTab?: "workspace" | "connection";
  onConnect?: (provider: "gemini" | "openai", key: string) => Promise<void>;
  onDisconnect?: (provider: "gemini" | "openai") => void;
  onCheck?: (provider: "gemini" | "openai") => Promise<string>;
}) {
  const [prefs, setPrefs] = useState({ ...preferences });

  return <Modal title="Studio settings" subtitle="Make this learning space your own." icon={<Settings2 size={22}/>} onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); onSave({ ...prefs, name: prefs.name.trim() || "Alex Morgan", language: prefs.language || "en" }); }}>
      <label htmlFor="profile-name" className="field-label">Your name</label>
      <input id="profile-name" className="standard-input" maxLength={40} value={prefs.name} onChange={e => setPrefs({ ...prefs, name: e.target.value })}/>
      <label className="field-label spaced">Whiteboard paper</label>
      <div className="paper-options">
        {(["dots", "grid", "plain"] as const).map(p => (
          <button key={p} type="button" className={prefs.paper === p ? "chosen" : ""} onClick={() => setPrefs({ ...prefs, paper: p })}>
            <span className={`paper-sample paper-${p}`}/>
            <span>{p === "dots" ? "Dotted" : p === "grid" ? "Grid" : "Plain"}{prefs.paper === p && <Check size={12}/>}</span>
          </button>
        ))}
      </div>
      <label className="field-label spaced">Tutor language & voice</label>
      <div className="language-options">
        {([["en", "English", "en-US"], ["hinglish", "Hinglish (हिंग्लिश)", "en-IN / Roman Hindi"], ["hi", "हिन्दी (Hindi)", "hi-IN / Devanagari"]] as const).map(([code, label, desc]) => (
          <button key={code} type="button" className={`lang-option ${prefs.language === code || (!prefs.language && code === "en") ? "chosen" : ""}`} onClick={() => setPrefs({ ...prefs, language: code as SupportedLanguage })}>
            <span><strong>{label}</strong><small>{desc}</small></span>
            {(prefs.language === code || (!prefs.language && code === "en")) && <Check size={14}/>}
          </button>
        ))}
      </div>
      <div className="setting-row">
        <Volume2 size={19}/>
        <div>
          <strong>Read replies aloud</strong>
          <small>Use your browser’s voice for new tutor replies.</small>
        </div>
        <button type="button" role="switch" aria-checked={prefs.narration} aria-label="Read replies aloud" className={`switch ${prefs.narration ? "on" : ""}`} onClick={() => setPrefs({ ...prefs, narration: !prefs.narration })}>
          <i/>
        </button>
      </div>
      <div className="modal-footer">
        <span className="quiet-note">Preferences stay in this browser.</span>
        <button className="primary-button" type="submit">Save changes</button>
      </div>
    </form>
  </Modal>;
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Your studio, at a glance" subtitle="A few shortcuts for a smooth learning session." icon={<Keyboard size={23}/>} onClose={onClose}>
    <div className="help-intro"><Mic size={19}/><p>Ask your tutor questions via voice mic. Your tutor draws, explains, and demonstrates on the whiteboard in real-time.</p></div>
    <div className="shortcut-list">{[["Toggle voice mic", "M"], ["Send typed question", "Enter"], ["Boost Mode (120fps GPU)", "Ctrl/⌘ B / /boost"], ["Start / pause class", "Space"], ["Close dialog or expanded board", "Esc"]].map(([name, key]) => <div key={name}><span>{name}</span><kbd>{key}</kbd></div>)}</div><div className="modal-footer"><button className="primary-button" onClick={onClose}>Got it <Check size={15}/></button></div>
  </Modal>;
}
export function TranscriptDialog({ session, onClose }: { session: StudySession; onClose: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, []);
  return <Modal title="Session conversation" subtitle={session.data.title} icon={<MessageSquareText size={22}/>} onClose={onClose} className="transcript-modal"><div className="transcript-list">{session.data.messages.map((msg, i) => <div className={`transcript-message ${msg.role}`} key={i}><div className="transcript-author">{msg.role === "assistant" ? <TutorAvatar small/> : <span className="mini-user">Y</span>}<strong>{msg.role === "assistant" ? "Professor" : "You"}</strong></div><p>{msg.content}</p></div>)}<div ref={end}/></div></Modal>;
}
