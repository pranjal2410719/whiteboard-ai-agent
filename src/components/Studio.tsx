"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, BookOpen, Bookmark, Check, ChevronRight, ChevronsUpDown, CircleCheck, CircleHelp, CloudCheck, CloudOff, Clock3, CornerDownLeft, History, Lightbulb, LoaderCircle, MessageSquareText, Mic, MicOff, PanelLeft, Plus, Presentation, Settings, Sparkles, SquarePen, Volume2, VolumeX, WandSparkles, X, Zap } from "lucide-react";
import { previewSessions } from "@/lib/lessons";
import { GeminiMark } from "./Brand";
import { defaultPreferences, MAX_LECTURE_SECONDS, type BoardMark, type Preferences, type SessionData, type StudySession } from "@/lib/types";
import { Brand, TipDoodle, TutorAvatar } from "./Brand";
import Whiteboard from "./Whiteboard";
import { HelpDialog, NewSessionDialog, SettingsDialog, TranscriptDialog } from "./Dialogs";
import Library from "./Library";
import LecturePlayer from "./LecturePlayer";
import ClassNotes from "./ClassNotes";
import { useClassPlayback } from "./useClassPlayback";
import { drawingAtCue, isRecordedClassKey, recordedClass } from "@/lib/recorded-classes";

type View = "studio" | "saved" | "history";
type Dialog = "new" | "settings" | "help" | "transcript" | "class-notes" | null;
const viewNames: Record<View, string> = { studio: "Learning studio", saved: "Saved boards", history: "Session history" };
const viewDescriptions: Record<View, string> = { studio: "Your personal whiteboard, powered by an AI tutor.", saved: "Your favorite whiteboards, notes, and lightbulb moments.", history: "Pick up where you left off, one lesson at a time." };
const starter = previewSessions();
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Your workspace could not be reached. Please try again.");
  return body as T;
}
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
function captionForProgress(narration: string, progress: number) {
  const lines = narration.match(/[^.!?]+[.!?]+(?:[””])?|[^.!?]+$/g)?.map(part => part.trim()).filter(Boolean) || [narration];
  const wordCounts = lines.map(line => line.split(/\s+/).filter(Boolean).length);
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  let word = Math.floor(Math.max(0, Math.min(.9999, progress)) * totalWords);
  for (let i = 0; i < lines.length; i++) { if (word < wordCounts[i]) return lines[i]; word -= wordCounts[i]; }
  return lines.at(-1) || narration;
}
function RichText({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|Pythagorean theorem)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part === "Pythagorean theorem" ? <strong key={i}>{part}</strong> : part)}</>;
}
export default function Studio() {
  const [sessions, setSessions] = useState<StudySession[]>(starter);
  const [activeId, setActiveId] = useState(starter[0].id);
  const [view, setView] = useState<View>("studio");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [settingsTab, setSettingsTab] = useState<"workspace" | "connection">("workspace");
  const [ready, setReady] = useState(false); const [loadAttempt, setLoadAttempt] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [serverConnected, setServerConnected] = useState(false); const [serverConfigured, setServerConfigured] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini"); const [tabKeys, setTabKeys] = useState<{ gemini: string; openai: string }>({ gemini: "", openai: "" });
  const [model, setModel] = useState("gemini-2.5-flash");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [collapsed, setCollapsed] = useState(false); const [mobileNav, setMobileNav] = useState(false);
  const [question, setQuestion] = useState(""); const [busy, setBusy] = useState(false); const [pendingQuestion, setPendingQuestion] = useState("");
  const [tutorError, setTutorError] = useState(""); const [animation, setAnimation] = useState(0); const [speaking, setSpeaking] = useState(false);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const usedVoice = useRef(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lecturePanel = useRef<HTMLDivElement>(null);
  const lectureBoard = useRef<HTMLDivElement>(null);
  const shouldBringPlayerIntoView = useRef(false);
  const [toast, setToast] = useState(""); const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWrites = useRef<Promise<void>>(Promise.resolve()); const writeCount = useRef(0); const questionInput = useRef<HTMLTextAreaElement>(null); const sending = useRef(false);
  const active = sessions.find(s => s.id === activeId) || sessions[0] || starter[0];
  const tabProvider = tabKeys.gemini ? "gemini" as const : tabKeys.openai ? "openai" as const : null;
  const connected = serverConnected || Boolean(tabProvider);
  const activeProvider = tabProvider || provider;
  const latestReply = useMemo(() => [...active.data.messages].reverse().find(m => m.role === "assistant")?.content || "What would you like to explore?", [active.data.messages]);
  const recording = useMemo(() => isRecordedClassKey(active.data.lessonKey) ? recordedClass(active.data.lessonKey) : undefined, [active.data.lessonKey]);
  const lecture = active.data.lecture ?? null;
  const lectureScenes = useMemo(() => recording
    ? recording.scenes.map(page => ({ ...page, ink: active.data.recordingInk?.[page.id] || page.ink }))
    : lecture ? active.data.pages.slice(lecture.startIndex, lecture.startIndex + lecture.sceneCount) : [],
    [recording, active.data.recordingInk, active.data.pages, lecture]);
  const sceneStarts = useMemo(() => {
    let start = 0;
    return lectureScenes.map(scene => { const where = start; start += scene.seconds || 40; return where; });
  }, [lectureScenes]);
  const lectureBoundaries = useMemo(() => {
    const pts: number[] = [];
    lectureScenes.forEach((scene, idx) => {
      const base = sceneStarts[idx] || 0;
      pts.push(base);
      if (scene.cues) for (const c of scene.cues) if (c.from > 0) pts.push(base + c.from);
    });
    return pts;
  }, [lectureScenes, sceneStarts]);
  const totalSeconds = recording?.totalSeconds ?? lecture?.totalSeconds ?? MAX_LECTURE_SECONDS;
  const playback = useClassPlayback(totalSeconds, recording?.audio, lectureBoundaries);
  const { start: playClass, close: closeClass, pause: pauseClass, read: readClass, open: lectureOpen, playing: lecturePlaying, seconds: lectureTime, muted: lectureMuted, revision: playbackRevision } = playback;
  let safeScene = 0;
  while (safeScene + 1 < sceneStarts.length && sceneStarts[safeScene + 1] <= lectureTime) safeScene++;
  const currentScene = lectureScenes[safeScene] || null;
  const sceneSeconds = currentScene?.seconds || 40, sceneStart = sceneStarts[safeScene] || 0;
  const elapsedInScene = Math.max(0, lectureTime - sceneStart);
  const sceneProgress = Math.min(1, elapsedInScene / sceneSeconds);
  const cue = currentScene?.cues ? drawingAtCue(currentScene.cues, elapsedInScene) : null;
  const lectureCaption = cue?.caption || captionForProgress(currentScene?.narration || "", sceneProgress);
  const lectureActive = lectureOpen && Boolean(currentScene) && view === "studio";
  const sceneTitle = recording?.title ?? lecture?.title ?? "Whiteboard lecture";
  const canStartClass = ready && !busy && !lectureLoading && (lectureScenes.length > 0 || connected);
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [sessions]);
  const notify = useCallback((message: string) => { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), message.length > 150 ? 5000 : 3600); }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); window.speechSynthesis?.cancel(); if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; } }, []);
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = JSON.parse(localStorage.getItem("chalkly.preferences") || "null");
      if (saved) setPreferences({ name: typeof saved.name === "string" && saved.name.trim() ? saved.name.slice(0, 40) : defaultPreferences.name, paper: ["dots", "grid", "plain"].includes(saved.paper) ? saved.paper : "dots", narration: saved.narration === true });
    } catch { /* Use default preferences when browser storage is unavailable. */ }
    api<{ sessions: StudySession[]; connected: boolean; model: string; provider: "gemini" | "openai"; serverKeyConfigured: boolean }>("/api/sessions").then(result => {
      if (cancelled) return;
      setSessions(result.sessions); setServerConnected(result.connected); setModel(result.model); setProvider(result.provider); setServerConfigured(result.serverKeyConfigured); setReady(true); setSaveState("saved");
      let last = ""; try { last = localStorage.getItem("chalkly.active") || ""; } catch { /* optional storage */ }
      setActiveId(result.sessions.find(s => s.id === last)?.id || result.sessions[0].id);
    }).catch(() => { if (!cancelled) { setSaveState("error"); notify("Could not load your workspace. Click “Reconnect” to try again."); } });
    return () => { cancelled = true; };
  }, [loadAttempt, notify]);
  const rememberActive = (id: string) => { setActiveId(id); try { localStorage.setItem("chalkly.active", id); } catch { /* optional storage */ } };
  const openSession = (id: string) => { if (busy || lectureLoading) return; closeClass(); rememberActive(id); setView("studio"); setMobileNav(false); setQuestion(""); setTutorError(""); if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; } window.speechSynthesis?.cancel(); setSpeaking(false); };
  const navigate = (next: View) => { if (next !== "studio") closeClass(); setView(next); setMobileNav(false); setTutorError(""); };
  const showSettings = (tab: "workspace" | "connection" = "workspace") => { pauseClass(); setSettingsTab(tab); setDialog("settings"); setMobileNav(false); };
  const upsert = (session: StudySession) => setSessions(prev => prev.some(s => s.id === session.id) ? prev.map(s => s.id === session.id ? session : s) : [session, ...prev]);
  const setData = (id: string, change: (data: SessionData) => SessionData) => setSessions(prev => prev.map(s => s.id === id ? { ...s, data: change(s.data), updatedAt: new Date().toISOString() } : s));
  const patch = useCallback((id: string, body: Record<string, unknown>) => {
    if (!ready) { notify("Please wait for your workspace to connect."); return; }
    setSaveState("saving"); writeCount.current++;
    pendingWrites.current = pendingWrites.current.catch(() => {}).then(async () => {
      try { await api(`/api/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (writeCount.current === 1) setSaveState("saved"); }
      catch { setSaveState("error"); notify("Could not save the last change. Reconnect and try again."); }
      finally { writeCount.current--; }
    });
  }, [ready, notify]);
  const saveBoard = useCallback((id: string) => {
    setSessions(prev => {
      const target = prev.find(item => item.id === id);
      if (!target || !ready) return prev;
      const saved = !target.data.saved;
      patch(id, { saved });
      notify(saved ? "Whiteboard added to Saved boards." : "Whiteboard removed from Saved boards.");
      return prev.map(s => s.id === id ? { ...s, data: { ...s.data, saved }, updatedAt: new Date().toISOString() } : s);
    });
  }, [ready, patch, notify]);
  const saveActiveBoard = useCallback(() => saveBoard(active.id), [saveBoard, active.id]);
  const inkChange = useCallback((pageId: string, ink: BoardMark[]) => {
    if (!ready) { notify("Your workspace is still connecting. Try your pen again in a moment."); return; }
    if (recording?.scenes.some(scene => scene.id === pageId)) {
      setData(active.id, data => ({ ...data, recordingInk: { ...data.recordingInk, [pageId]: ink } }));
    } else setData(active.id, data => ({ ...data, pages: data.pages.map(p => p.id === pageId ? { ...p, ink } : p) }));
    patch(active.id, { pageId, ink });
  }, [ready, notify, recording, active.id, patch]);
  const pageChange = useCallback((pageIndex: number) => { setData(active.id, data => ({ ...data, pageIndex })); patch(active.id, { pageIndex }); }, [active.id, patch]);
  const baseHeaders = (): Record<string, string> => ({ "Content-Type": "application/json", ...(tabKeys.gemini ? { "x-gemini-key": tabKeys.gemini } : {}), ...(tabKeys.openai ? { "x-openai-key": tabKeys.openai } : {}) });
  const speak = useCallback((text: string) => {
    const cleanText = text.replace(/[*#_`~]/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim();
    if (!cleanText) return;

    // Stop any existing TTS audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = "";
      ttsAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    setSpeaking(true);

    // Server-side TTS via Gemini on Vertex AI — works without browser gesture blocking
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("TTS server error");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsAudioRef.current = audio;
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); ttsAudioRef.current = null; };
        audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); ttsAudioRef.current = null; };
        audio.play().catch(() => setSpeaking(false));
      })
      .catch(() => {
        // Fallback to browser speechSynthesis if server TTS fails
        if (!("speechSynthesis" in window)) { setSpeaking(false); return; }
        const synth = window.speechSynthesis;
        try { synth.cancel(); } catch { /* ignore */ }
        const speech = new SpeechSynthesisUtterance(cleanText);
        speech.rate = 1.0;
        speech.lang = "en-US";
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang === "en-US") || voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (voice) speech.voice = voice;
        speech.onend = () => setSpeaking(false);
        speech.onerror = () => setSpeaking(false);
        synth.speak(speech);
      });
  }, []);
  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    type SpeechError = { error: string };
    type SpeechEvent = { results: { [key: number]: { transcript: string } }[] };
    type SpeechRecInstance = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: SpeechEvent) => void;
      onerror: (e: SpeechError) => void;
      onend: () => void;
      onstart: () => void;
      start: () => void;
      stop: () => void;
    };
    const Win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecInstance;
      webkitSpeechRecognition?: new () => SpeechRecInstance;
    };
    const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SpeechRec) {
      notify("In Brave: open brave://settings/privacy and enable 'Use Google services for speech recognition'.");
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onstart = () => {
        setListening(true);
        usedVoice.current = true;
        notify("Listening… speak your question into your microphone.");
      };
      rec.onresult = (e: SpeechEvent) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join("");
        setQuestion(text);
        usedVoice.current = true;
      };
      rec.onerror = (e: SpeechError) => {
        setListening(false);
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          notify("Microphone permission was denied. Please allow microphone access in your browser address bar.");
        } else if (e.error === "network" || e.error === "service-not-allowed") {
          notify("Brave blocked speech services. Open brave://settings/privacy and enable 'Use Google services for speech recognition'.");
        } else if (e.error === "no-speech") {
          notify("No speech was heard. Click the mic again and speak clearly.");
        } else {
          notify(`Microphone error (${e.error}). You can also type your question.`);
        }
      };
      rec.onend = () => {
        setListening(false);
        questionInput.current?.focus();
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      notify("Microphone could not be started. Check your browser permissions.");
    }
  }, [listening, notify]);
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
      setVoiceSupported(true);
    }
  }, []);
  useEffect(() => { closeClass(); }, [active.id, closeClass]);
  useEffect(() => {
    if (!lectureActive || !shouldBringPlayerIntoView.current) return;
    shouldBringPlayerIntoView.current = false;
    const frame = requestAnimationFrame(() => {
      const panel = lecturePanel.current;
      if (window.innerWidth <= 620 || (panel && panel.getBoundingClientRect().top > window.innerHeight - 155)) lectureBoard.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [lectureActive]);
  useEffect(() => {
    if (recording || !lectureActive || !lecturePlaying || lectureMuted || !voiceSupported || !currentScene?.narration) return;
    const engine = window.speechSynthesis;
    const words = currentScene.narration.trim().split(/\s+/u);
    const offset = Math.max(0, readClass() - sceneStart);
    const remaining = words.slice(Math.floor(Math.min(1, offset / sceneSeconds) * words.length));
    if (!remaining.length) return;
    engine.cancel();
    const speech = new SpeechSynthesisUtterance(remaining.join(" "));
    speech.lang = "en-US";
    speech.rate = Math.max(.82, Math.min(1.35, words.length * 60 / (sceneSeconds * 155)));
    engine.speak(speech);
    return () => { engine.cancel(); };
  }, [recording, lectureActive, lecturePlaying, lectureMuted, voiceSupported, currentScene?.narration, playbackRevision, readClass, sceneStart, sceneSeconds]);
  const startLecture = useCallback(async () => {
    if (!canStartClass) return;
    window.speechSynthesis?.cancel(); setSpeaking(false); setTutorError("");
    shouldBringPlayerIntoView.current = true;
    if (lectureScenes.length) { playClass(); return; }
    setLectureLoading(true);
    try {
      await pendingWrites.current;
      const result = await api<{ session: StudySession; notice?: string }>("/api/tutor", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ sessionId: active.id, message: `Teach me a detailed two-minute lecture on ${active.data.title}. Include a worked example and a practice question with its answer.`, lecture: true }) });
      upsert(result.session); setSaveState("saved");
      playClass();
      if (result.notice) notify(result.notice);
    } catch (err) { setTutorError(err instanceof Error ? err.message : "The lecture could not be prepared."); }
    finally { setLectureLoading(false); }
  }, [canStartClass, lectureScenes.length, playClass, active.id, active.data.title, notify]);
  const showClassNotes = () => { pauseClass(); setDialog("class-notes"); };
  const send = async (message: string) => {
    const trimmed = message.trim(); if (!trimmed || sending.current || !ready || lectureLoading) return;
    if (lectureOpen) closeClass();
    sending.current = true; setBusy(true); setTutorError(""); setPendingQuestion(trimmed); setQuestion("");
    try {
      await pendingWrites.current;
      const result = await api<{ session: StudySession; drew: boolean; notice?: string }>("/api/tutor", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ sessionId: active.id, message: trimmed }) });
      upsert(result.session); setSaveState("saved"); if (result.drew) setAnimation(n => n + 1); if (result.notice) notify(result.notice);
      if (preferences.narration || usedVoice.current) {
        usedVoice.current = false;
        speak(result.session.data.messages[result.session.data.messages.length - 1].content);
      }
    } catch (err) { setTutorError(err instanceof Error ? err.message : "The tutor couldn’t finish. Please try again."); setQuestion(trimmed); }
    finally { sending.current = false; setBusy(false); setPendingQuestion(""); }
  };
  const createSession = async (topic: string) => {
    await pendingWrites.current;
    const result = await api<{ session: StudySession; notice?: string }>("/api/sessions", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ topic }) });
    upsert(result.session); setReady(true); openSession(result.session.id); setDialog(null); setAnimation(n => n + 1);
    if (result.notice) notify(result.notice); else notify("A fresh session is ready.");
  };
  const deleteSession = async (id: string) => {
    await pendingWrites.current; await api(`/api/sessions/${id}`, { method: "DELETE" });
    const left = sessions.filter(s => s.id !== id); setSessions(left); if (active.id === id && left[0]) rememberActive(left[0].id); notify("Session deleted.");
  };
  const savePreferences = (prefs: Preferences) => { setPreferences(prefs); try { localStorage.setItem("chalkly.preferences", JSON.stringify(prefs)); } catch { /* optional storage */ } setDialog(null); notify("Studio preferences saved."); };
  const onConnect = async (chosen: "gemini" | "openai", key: string) => {
    const r = await api<{ model: string; provider: "gemini" | "openai" }>("/api/connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: chosen, key }) });
    setTabKeys(keys => ({ ...keys, [chosen]: key })); setProvider(chosen); setModel(r.model); setServerConnected(true);
    notify(`${chosen === "gemini" ? "Gemini" : "OpenAI"} is connected for this tab.`);
  };
  const onDisconnect = (chosen: "gemini" | "openai") => {
    setTabKeys(keys => ({ ...keys, [chosen]: "" })); notify("The tab API key was removed from memory.");
    api<{ connected: boolean; provider: "gemini" | "openai"; model: string }>("/api/connection").then(r => { setServerConnected(r.connected); setProvider(r.provider); setModel(r.model); }).catch(() => setServerConnected(false));
  };
  const onCheckConnection = async (chosen: "gemini" | "openai") => {
    const r = await api<{ connected: boolean; model: string }>("/api/connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: chosen }) });
    return r.connected ? `${chosen === "gemini" ? "Gemini" : "OpenAI"} replied successfully with ${r.model}.` : "The provider did not respond.";
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); if (!question.trim()) { questionInput.current?.focus(); return; } void send(question); };
  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${mobileNav ? "mobile-nav-open" : ""}`}>
    <a className="skip-link" href="#main-content">Skip to workspace</a>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <aside className="sidebar"><div className="brand-row"><Brand/><button className="mobile-nav-close icon-button" aria-label="Close sidebar" onClick={() => setMobileNav(false)}><X size={17}/></button></div>
      <div className="sidebar-content"><div className="sidebar-label">Workspace</div><nav className="primary-nav" aria-label="Workspace navigation">{([['studio', Presentation], ['saved', Bookmark], ['history', History]] as const).map(([id, Icon]) => <button key={id} className={`nav-link ${view === id ? "selected" : ""}`} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}><Icon size={18}/><span>{viewNames[id]}</span>{id === "saved" && sessions.some(s => s.data.saved) && <small>{sessions.filter(s => s.data.saved).length}</small>}</button>)}</nav>
        <div className="sidebar-rule"/><div className="recent-heading"><div className="sidebar-label">Recent sessions</div><button aria-label="Create a session" title="Create a session" onClick={() => { setDialog("new"); setMobileNav(false); }}><Plus size={14}/></button></div>
        <nav className="recent-sessions" aria-label="Recent sessions">{sortedSessions.slice(0, 6).map(s => <button key={s.id} disabled={busy || lectureLoading} onClick={() => openSession(s.id)} className={s.id === active.id && view === "studio" ? "current" : ""} title={s.data.title}><span className={`session-dot dot-${s.data.lessonKey}`}/><span>{s.data.title.replace(/^The /, "").replace(/^Pythagorean/, "Pythagorean").replace(/^water/, "Water")}</span></button>)}</nav>
      </div>
      <div className="sidebar-bottom"><div className="study-tip"><TipDoodle/><div className="tip-heading"><Lightbulb size={16}/><span>Study tip</span></div><p>Ask “why?” or “show me” to go a little deeper with your tutor.</p></div><button className="settings-link" onClick={() => showSettings()}><Settings size={17}/>Settings</button><button className="profile-button" onClick={() => showSettings()} aria-label="Open profile settings"><span className="user-avatar">{initials(preferences.name)}</span><span className="profile-details"><strong>{preferences.name}</strong><small>Personal workspace</small></span><ChevronsUpDown size={14}/></button></div>
    </aside>
    <div className="workspace-shell"><header className="topbar"><div className="breadcrumbs"><button className="icon-button sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar" onClick={() => { if (window.innerWidth <= 900) setMobileNav(!mobileNav); else setCollapsed(!collapsed); }}><PanelLeft size={18}/></button><span className="topbar-divider"/><span className="crumb-home"><span className="desktop-crumb">Workspace</span><span className="mobile-wordmark">Chalkly</span></span><ChevronRight size={13}/><span className="crumb-current">{viewNames[view]}</span></div><div className="topbar-actions">{saveState === "error" ? <button className="reconnect-button" onClick={() => setLoadAttempt(n => n + 1)}><CloudOff size={16}/>Reconnect</button> : <span className="save-status">{saveState === "saving" ? <LoaderCircle size={15} className="spin"/> : <CloudCheck size={16}/>}<span>{saveState === "saving" ? "Saving changes…" : "All changes saved"}</span></span>}<span className="topbar-divider"/><button className={`gemini-button ${connected ? "ready" : ""}`} title={connected ? `${activeProvider === "gemini" ? "Gemini" : "OpenAI"} tutor connection · ${model}` : "Connect your Gemini API key"} aria-label="Gemini API connection settings" onClick={() => showSettings("connection")}><GeminiMark size={14}/><span>Gemini API</span><i/></button><button className="icon-button help-button" title="Help & shortcuts" aria-label="Help and keyboard shortcuts" onClick={() => { pauseClass(); setDialog("help"); }}><CircleHelp size={18}/></button></div></header>
      <main id="main-content" className="main-content"><div className="page-heading"><div><div className="page-eyebrow"><span className="eyebrow-line"/>Your workspace</div><h1>{viewNames[view]}{view === "studio" && <svg className="title-doodle" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m7 15 4-9m3 13 9-7m-6 14 10-2" stroke="#8ea889" strokeWidth="2.5" strokeLinecap="round"/></svg>}</h1><p>{viewDescriptions[view]}</p></div><button className="primary-button new-session-button" onClick={() => { pauseClass(); setDialog("new"); }} disabled={busy || lectureLoading}><Plus size={17}/>New session</button></div>
      {view === "studio" && sessions.length > 0 ? <div className="studio-content">
        {recording && <audio key={recording.audio} ref={playback.audioRef} src={recording.audio} preload="none" muted={lectureMuted} onError={playback.onAudioError} onEnded={playback.onAudioEnded} onWaiting={playback.onAudioWaiting} onPlaying={playback.onAudioPlaying}/>}
        <div className="lecture-board-anchor" ref={lectureBoard}><Whiteboard session={active} paper={preferences.paper} animation={animation} busy={busy} onInk={inkChange} onPage={pageChange} onSave={saveActiveBoard} notify={notify}
          overridePage={lectureActive ? currentScene : null} overrideIndex={safeScene} overrideTotal={lectureScenes.length} locked={lectureActive && lecturePlaying}
          tutorSpeaking={Boolean(busy || speaking || (lectureActive && lecturePlaying))} tutorPaused={lectureActive && !lecturePlaying} tutorMuted={lectureMuted}
          playbackPlaying={lectureActive && lecturePlaying} readPlayback={readClass} playbackSceneStart={sceneStart} playbackSceneSeconds={sceneSeconds}
          playbackCues={currentScene?.cues} playbackMarkPosition={lectureActive ? (cue?.markProgress ?? sceneProgress * (currentScene?.marks.length || 0)) : undefined}
          playbackRevision={playbackRevision}
          onClass={recording && !lectureActive ? startLecture : undefined} classDisabled={!canStartClass} classComplete={lectureTime >= totalSeconds}/></div>
        <div ref={lecturePanel}><LecturePlayer key={active.id} recording={recording} open={lectureActive} hasLecture={lectureScenes.length > 0} requesting={lectureLoading} canStart={canStartClass}
          playing={lecturePlaying} muted={lectureMuted} voiceSupported={Boolean(recording) || voiceSupported} buffering={playback.buffering} audioIssue={playback.audioIssue}
          title={sceneTitle} caption={lectureCaption} index={safeScene} holding={Boolean(cue?.holding)}
          scenes={lectureScenes.map((scene, index) => ({ title: scene.title, narration: scene.narration || "", seconds: scene.seconds || 40, start: sceneStarts[index] }))}
          elapsed={lectureTime} totalSeconds={totalSeconds} onStart={() => void startLecture()} onToggle={playback.toggle} onSeek={playback.seek} onExit={closeClass} onToggleMute={playback.toggleMute} onNotes={showClassNotes}/></div>
        <section className="tutor-panel" aria-label="Tutor conversation"><div className="response-row"><TutorAvatar/><div className="response-main"><div className="response-heading"><div className="tutor-name"><h2>AI Tutor</h2><button className="tutor-presence" title={connected ? "View your language model connection" : "Guided lesson · Connect a model to teach any topic"} onClick={() => showSettings("connection")}><i/> {busy ? "Thinking" : connected ? "Connected" : "Guided lesson"}</button></div><div className="tutor-actions"><button className={`icon-button ${speaking ? "is-saved" : ""}`} title={speaking ? "Stop reading" : "Read reply aloud"} aria-label={speaking ? "Stop reading" : "Read reply aloud"} onClick={() => { if (lectureActive) pauseClass(); if (speaking) { if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; } window.speechSynthesis?.cancel(); setSpeaking(false); } else speak(latestReply); }}>{speaking ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button><button className="conversation-button" title="View conversation history" aria-label="View conversation history" onClick={() => { pauseClass(); setDialog("transcript"); }}><MessageSquareText size={15}/><span>Chat history</span></button></div></div>
          <div className="tutor-copy" aria-live="polite">{busy ? <div className="thinking-reply"><span className="pending-question">“{pendingQuestion}”</span><span className="thinking-line"><i/><i/><i/>Your tutor is thinking it through</span></div> : <RichText text={latestReply}/>}</div>
          <div className="suggestions">{active.data.suggestions.map((item, i) => <button key={item} onClick={() => void send(item)} disabled={busy || !ready || lectureLoading}>{/quiz|practice|test/i.test(item) ? <Zap size={13}/> : /simple|lesson|explain/i.test(item) ? <BookOpen size={13}/> : i === 0 ? <Lightbulb size={13}/> : <Sparkles size={13}/>}<span>{item}</span></button>)}</div>
        </div></div>{tutorError && <div className="inline-error" role="alert">{tutorError}</div>}
        <form className="composer" onSubmit={onSubmit}><span className="composer-spark"><Sparkles size={18}/></span><textarea ref={questionInput} aria-label="Ask your tutor a question" rows={1} placeholder={active.data.quiz ? "Type your answer, or ask for a hint…" : "Ask a question, or tell your tutor what to draw…"} maxLength={4000} value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(question); } }}/><span className="enter-hint">Enter <CornerDownLeft size={10}/></span><button type="button" className={`voice-record-button ${listening ? "is-recording" : ""}`} aria-label={listening ? "Stop voice input" : "Speak to your tutor"} title={listening ? "Stop voice input" : "Speak to your tutor (speech-to-text)"} onClick={toggleListening} disabled={busy || !ready || lectureLoading}>{listening ? <MicOff size={16}/> : <Mic size={16}/>}</button><button type="submit" className="send-button" aria-label="Send question" title="Send question" disabled={busy || !ready || lectureLoading}>{busy ? <LoaderCircle size={17} className="spin"/> : <ArrowUp size={19}/>}</button></form>
        </section><div className="studio-footnote"><Sparkles size={11}/><span>AI can make mistakes. Stay curious and double-check.</span></div>
      </div> : view === "studio" ? <div className="empty-library"><span className="empty-symbol"><SquarePen size={32}/></span><h2>A fresh start</h2><p>Create a session to begin learning with your tutor.</p><button className="primary-button" onClick={() => setDialog("new")}>Create a session<ArrowRight size={15}/></button></div> : <Library key={view} sessions={sortedSessions} view={view} onOpen={openSession} onDelete={deleteSession} onSave={saveBoard} onStudio={() => navigate("studio")}/>}
      </main>
    </div>
    {dialog === "class-notes" && recording && <ClassNotes recording={recording} onClose={() => setDialog(null)}/>}
    {dialog === "new" && <NewSessionDialog onClose={() => setDialog(null)} onCreate={createSession} connected={connected} onConnect={() => showSettings("connection")}/>}
    {dialog === "settings" && <SettingsDialog preferences={preferences} onSave={savePreferences} onClose={() => setDialog(null)} connection={{ connected, provider: activeProvider, model, serverConfigured, tabKey: Boolean(tabProvider) }} initialTab={settingsTab} onConnect={onConnect} onDisconnect={onDisconnect} onCheck={onCheckConnection}/>}
    {dialog === "help" && <HelpDialog onClose={() => setDialog(null)}/>}{dialog === "transcript" && <TranscriptDialog session={active} onClose={() => setDialog(null)}/>}
    {toast && <div className="toast" role="status"><CircleCheck size={17}/><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={14}/></button></div>}
  </div>;
}
