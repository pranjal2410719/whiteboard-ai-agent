"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronRight, ChartPie as CirclePie, CloudRain, Cpu, Equal, Eye, EyeOff, FileStack, GraduationCap, Keyboard, KeyRound, LoaderCircle, MessageSquareText, Pencil, Settings2, ShieldCheck, Sparkles, TriangleRight, Volume2, WandSparkles, X, Zap } from "lucide-react";
import { catalog } from "@/lib/lessons";
import type { Preferences, StudySession } from "@/lib/types";
import { GeminiMark, TutorAvatar } from "./Brand";

export const LessonIcon = ({ lesson, size = 20 }: { lesson: string; size?: number }) => lesson === "fractions" ? <CirclePie size={size}/> : lesson === "water-cycle" ? <CloudRain size={size}/> : lesson === "linear-equations" ? <Equal size={size}/> : <TriangleRight size={size}/>;

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

export function NewSessionDialog({ onClose, onCreate, connected, onConnect }: { onClose: () => void; onCreate: (topic: string) => Promise<void>; connected: boolean; onConnect: () => void }) {
  const [topic, setTopic] = useState(""); const [selected, setSelected] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const start = async (e: React.FormEvent) => { e.preventDefault(); if (!topic.trim() || pending) return; setPending(true); setError(""); try { await onCreate(topic); } catch (err) { setError(err instanceof Error ? err.message : "Could not create a session. Please try again."); } finally { setPending(false); } };
  return <Modal title="Start a new session" subtitle="Bring a question, or pick a lesson to explore together." icon={<GraduationCap size={24}/>} onClose={() => { if (!pending) onClose(); }} className="new-session-modal">
    <form onSubmit={start}><label className="field-label" htmlFor="new-topic">What would you like to learn?</label><div className="topic-input-wrap"><Sparkles size={17}/><input id="new-topic" autoComplete="off" placeholder="e.g. How do linear equations work?" value={topic} onChange={e => { setTopic(e.target.value); setSelected(""); setError(""); }} maxLength={600} disabled={pending}/></div>
      <div className="section-caption"><span>GUIDED LESSONS</span><span className="caption-rule"/></div><div className="lesson-options">{catalog.map(item => <button type="button" disabled={pending} key={item.key} onClick={() => { setSelected(item.key); setTopic(item.title); setError(""); }} className={`lesson-option ${selected === item.key ? "chosen" : ""}`}><span className={`lesson-icon ${item.color}`}><LessonIcon lesson={item.key}/></span>{selected === item.key && <Check className="option-check" size={15}/>}<strong>{item.title}</strong><small>{item.subject}</small></button>)}</div>
      {!connected && <div className="connection-note"><Cpu size={16}/><span>Guided lessons are ready. <button type="button" onClick={onConnect}>Connect AI</button> for any topic.</span></div>}
      {error && <div className="inline-error" role="alert">{error}</div>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose} disabled={pending}>Cancel</button><button type="submit" className="primary-button" disabled={!topic.trim() || pending}>{pending ? <><LoaderCircle className="spin" size={16}/>Preparing lesson</> : <>Start learning <ArrowRight size={16}/></>}</button></div>
    </form>
  </Modal>;
}

export function SettingsDialog({ onClose, preferences, onSave, connection, initialTab, onConnect, onDisconnect, onCheck }: { onClose: () => void; preferences: Preferences; onSave: (p: Preferences) => void; connection: { connected: boolean; provider: "gemini" | "openai"; model: string; serverConfigured: boolean; tabKey: boolean }; initialTab: "workspace" | "connection"; onConnect: (provider: "gemini" | "openai", key: string) => Promise<void>; onDisconnect: (provider: "gemini" | "openai") => void; onCheck: (provider: "gemini" | "openai") => Promise<string> }) {
  const [tab, setTab] = useState(initialTab); const [prefs, setPrefs] = useState({ ...preferences });
  const [provider, setProvider] = useState<"gemini" | "openai">(connection.provider || "gemini");
  const [key, setKey] = useState(""); const [visible, setVisible] = useState(false); const [checking, setChecking] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState("");
  const [verified, setVerified] = useState<{ provider: "gemini" | "openai"; ok: boolean } | null>(null);
  const checkedOnce = useRef<Set<string>>(new Set());
  const connect = async (e: React.FormEvent) => { e.preventDefault(); setChecking(true); setError(""); setResult(""); try { await onConnect(provider, key.trim()); setKey(""); setResult("Connection verified."); setVerified({ provider, ok: true }); } catch (err) { setError(err instanceof Error ? err.message : "Connection failed."); } finally { setChecking(false); } };
  const check = async () => { setChecking(true); setError(""); setResult(""); try { setResult(await onCheck(provider)); setVerified({ provider, ok: true }); } catch (err) { setError(err instanceof Error ? err.message : "Connection check failed."); setVerified({ provider, ok: false }); } finally { setChecking(false); } };
  const activeNow = connection.provider === provider;
  useEffect(() => {
    if (tab !== "connection" || !activeNow || !connection.connected) return;
    const already = `${provider}:${connection.model}`;
    if (checkedOnce.current.has(already)) return;
    checkedOnce.current.add(already);
    setChecking(true);
    onCheck(provider).then(message => { setResult(message); setVerified({ provider, ok: true }); }).catch((err: unknown) => { setError(err instanceof Error ? err.message : "Connection check failed."); setVerified({ provider, ok: false }); }).finally(() => setChecking(false));
  }, [tab, provider, activeNow, connection.connected, connection.model, onCheck]);
  const active = connection.provider === provider;
  return <Modal title="Studio settings" subtitle="Make this learning space your own." icon={<Settings2 size={22}/>} onClose={onClose}>
    <div className="settings-tabs"><button className={tab === "workspace" ? "active" : ""} onClick={() => setTab("workspace")}>Workspace</button><button className={tab === "connection" ? "active" : ""} onClick={() => setTab("connection")}>Tutor connection</button></div>
    {tab === "workspace" ? <form onSubmit={e => { e.preventDefault(); onSave({ ...prefs, name: prefs.name.trim() || "Alex Morgan" }); }}><label htmlFor="profile-name" className="field-label">Your name</label><input id="profile-name" className="standard-input" maxLength={40} value={prefs.name} onChange={e => setPrefs({ ...prefs, name: e.target.value })}/><label className="field-label spaced">Whiteboard paper</label><div className="paper-options">{(["dots", "grid", "plain"] as const).map(p => <button key={p} type="button" className={prefs.paper === p ? "chosen" : ""} onClick={() => setPrefs({ ...prefs, paper: p })}><span className={`paper-sample paper-${p}`}/><span>{p === "dots" ? "Dotted" : p === "grid" ? "Grid" : "Plain"}{prefs.paper === p && <Check size={12}/>}</span></button>)}</div><div className="setting-row"><Volume2 size={19}/><div><strong>Read replies aloud</strong><small>Use your browser’s voice for new tutor replies.</small></div><button type="button" role="switch" aria-checked={prefs.narration} aria-label="Read replies aloud" className={`switch ${prefs.narration ? "on" : ""}`} onClick={() => setPrefs({ ...prefs, narration: !prefs.narration })}><i/></button></div><div className="modal-footer"><span className="quiet-note">Preferences stay in this browser.</span><button className="primary-button" type="submit">Save changes</button></div></form> : <div>
      <div className="provider-tabs" role="tablist" aria-label="Model provider">{([["gemini", "Google Gemini"], ["openai", "OpenAI"]] as const).map(([id, label]) => <button type="button" role="tab" aria-selected={provider === id} key={id} className={provider === id ? "active" : ""} onClick={() => { setProvider(id); setError(""); setResult(""); }}>{id === "gemini" ? <GeminiMark size={14}/> : <Cpu size={14}/>}{label}</button>)}</div>
      <div className={`provider-status ${active && connection.connected ? "connected" : ""}`}><span className="provider-icon">{provider === "gemini" ? <GeminiMark size={20}/> : <Cpu size={21}/>}</span><div><strong>{active && connection.connected ? `${provider === "gemini" ? "Gemini" : "OpenAI"} key configured` : `Connect ${provider === "gemini" ? "Gemini" : "OpenAI"}`}</strong><small>{active && connection.connected ? `${connection.model} · ${connection.tabKey ? "this tab only" : "server key"}` : connection.connected ? `Currently using ${connection.provider === "gemini" ? "Gemini" : "OpenAI"} (${connection.model})` : "Guided lessons only until a model is connected"}</small></div>{active && connection.connected && <CheckCircle2 size={18}/>}</div>
      <p className="settings-explainer">{active && connection.connected ? "Gemini chooses what to explain and draws on the whiteboard through a forced draw_on_whiteboard function call. Drawings are validated before they appear." : "Connect a model to teach any topic, answer open questions, and let the tutor draw its own diagrams."}</p>
      {active && connection.connected && <div className="connection-ready"><div><strong>{verified?.provider === provider ? (verified.ok ? "Model ready" : "Billing needs attention") : "Verify a live reply"}</strong><small>{verified?.provider === provider ? (verified.ok ? "A test reply was generated successfully." : "The key authenticates, but generation is blocked—see the message below.") : "Generate a tiny test reply to confirm the key and billing."}</small></div><button type="button" className="secondary-button" onClick={check} disabled={checking}>{checking ? <LoaderCircle size={14} className="spin"/> : <Zap size={14}/>} {checking ? "Checking" : "Check connection"}</button></div>}
      <form onSubmit={connect}><label className="field-label" htmlFor={`${provider}-key`}>{provider === "gemini" ? "Gemini API key" : "OpenAI API key"}</label><div className="key-input"><KeyRound size={16}/><input id={`${provider}-key`} type={visible ? "text" : "password"} value={key} onChange={e => { setKey(e.target.value); setError(""); setResult(""); }} autoComplete="off" spellCheck={false} placeholder={provider === "gemini" ? "AIza… or AQ.…" : "sk-…"}/><button type="button" aria-label={visible ? "Hide API key" : "Show API key"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div><p className="field-help">Held only in this tab for the session, never written to the database or browser storage. {provider === "gemini" ? "Create or manage keys in Google AI Studio." : "Provider usage charges may apply."}</p>
        {error && <div className="inline-error" role="alert">{error}</div>}{result && <div className="inline-success" role="status"><CheckCircle2 size={14}/>{result}</div>}
        <button className="primary-button wide-button" type="submit" disabled={!key.trim() || checking} aria-label={`Connect ${provider === "gemini" ? "Gemini" : "OpenAI"} key`}>{checking ? <LoaderCircle size={16} className="spin"/> : provider === "gemini" ? <GeminiMark size={14}/> : <KeyRound size={15}/>} {checking ? "Verifying key and billing" : `Connect ${provider === "gemini" ? "Gemini" : "OpenAI"}`}</button></form>
      <div className="provider-highlights"><span><WandSparkles size={13}/>Forced drawing tool</span><span><ShieldCheck size={13}/>Key stays in this tab</span><span><FileStack size={13}/>Boards saved privately</span></div>
      {provider === "gemini" && <div className="server-hint">Need credits? {connection.serverConfigured ? "This deployment uses the server's GEMINI_API_KEY; " : ""}Gemini API billing is managed at <a href="https://ai.studio/projects" target="_blank" rel="noreferrer">ai.studio/projects</a>. A valid key with depleted prepayment credits can authenticate but cannot generate replies.</div>}
      <div className="modal-footer">{connection.tabKey && active && <button className="secondary-button" onClick={() => onDisconnect(provider)}>Disconnect tab key</button>}<button className="primary-button" onClick={onClose}>Back to studio<ChevronRight size={16}/></button></div>
    </div>}
  </Modal>;
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Your studio, at a glance" subtitle="A few small shortcuts for a smoother learning session." icon={<Keyboard size={23}/>} onClose={onClose}>
    <div className="help-intro"><Pencil size={19}/><p>Ask the tutor a question, then sketch alongside it. Your notes are saved automatically on each board page.</p></div>
    <div className="shortcut-list">{[["Select & pan", "V"], ["Marker pen", "P"], ["Erase an annotation", "E"], ["Draw a rectangle / ellipse", "R / C"], ["Add handwritten text", "T"], ["Undo / redo", "Ctrl/⌘ Z / ⇧ Z"], ["Send your question", "Enter"], ["Close a dialog or expanded board", "Esc"]].map(([name, key]) => <div key={name}><span>{name}</span><kbd>{key}</kbd></div>)}</div><div className="modal-footer"><button className="primary-button" onClick={onClose}>Got it <Check size={15}/></button></div>
  </Modal>;
}
export function TranscriptDialog({ session, onClose }: { session: StudySession; onClose: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, []);
  return <Modal title="Session conversation" subtitle={session.data.title} icon={<MessageSquareText size={22}/>} onClose={onClose} className="transcript-modal"><div className="transcript-list">{session.data.messages.map((msg, i) => <div className={`transcript-message ${msg.role}`} key={i}><div className="transcript-author">{msg.role === "assistant" ? <TutorAvatar small/> : <span className="mini-user">Y</span>}<strong>{msg.role === "assistant" ? "AI Tutor" : "You"}</strong></div><p>{msg.content}</p></div>)}<div ref={end}/></div></Modal>;
}
