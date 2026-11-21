"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, AudioLines, BookOpen, Bookmark, Captions, Check, ChevronRight, ChevronsUpDown, CircleCheck, CircleHelp, CloudCheck, CloudOff, Clock3, CornerDownLeft, History, Keyboard, LoaderCircle, MessageSquareText, Mic, MicOff, PanelLeft, Phone, PhoneOff, Play, Plus, Presentation, Settings, Sparkles, SquarePen, Volume2, VolumeX, WandSparkles, X, Zap } from "lucide-react";
import { previewSessions } from "@/lib/lessons";
import { GeminiMark } from "./Brand";
import { defaultPreferences, localizedSuggestions, MAX_LECTURE_SECONDS, type BoardMark, type Preferences, type SessionData, type StudySession, type SupportedLanguage } from "@/lib/types";
import { Brand, TutorAvatar } from "./Brand";
import Whiteboard from "./Whiteboard";
import { HelpDialog, NewSessionDialog, SettingsDialog, TranscriptDialog } from "./Dialogs";
import Library from "./Library";
import LecturePlayer from "./LecturePlayer";
import ClassNotes from "./ClassNotes";
import { useClassPlayback } from "./useClassPlayback";
import { drawingAtCue, isRecordedClassKey, recordedClass } from "@/lib/recorded-classes";
import GoogleMeetBar from "./GoogleMeetBar";
import SlidingChatPanel from "./SlidingChatPanel";
import { LiveCaptionsOverlay } from "./LiveCaptionsOverlay";
import LeaveCallDialog from "./LeaveCallDialog";
import { findNextSentenceBoundary } from "@/lib/spatial";

type View = "studio" | "saved" | "history";
type Dialog = "new" | "settings" | "help" | "transcript" | "class-notes" | null;
const viewNames: Record<View, string> = { studio: "Learning studio", saved: "Saved boards", history: "Session history" };
const viewDescriptions: Record<View, string> = { studio: "Your personal whiteboard, powered by an AI tutor.", saved: "Your favorite whiteboards, notes, and lightbulb moments.", history: "Pick up where you left off, one lesson at a time." };
const starter = previewSessions();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
  const [ready, setReady] = useState(false); const [loadAttempt, setLoadAttempt] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [serverConnected, setServerConnected] = useState(false); const [serverConfigured, setServerConfigured] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini"); const [tabKeys, setTabKeys] = useState<{ gemini: string; openai: string }>({ gemini: "", openai: "" });
  const [model, setModel] = useState("gemini-2.5-flash");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [collapsed, setCollapsed] = useState(false); const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false); const [pendingQuestion, setPendingQuestion] = useState("");
  const [tutorError, setTutorError] = useState(""); const [animation, setAnimation] = useState(0); const [animationDuration, setAnimationDuration] = useState(0); const [speaking, setSpeaking] = useState(false);
  const [doubtMarks, setDoubtMarks] = useState<BoardMark[]>([]);
  // null = no live turn attempted yet in this tab, so we never claim the model works unverified.
  const [tutorHealthy, setTutorHealthy] = useState<boolean | null>(null);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveCallActive, setLiveCallActive] = useState(true);
  const liveCallActiveRef = useRef(true);
  liveCallActiveRef.current = liveCallActive;
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [liveUserSpeech, setLiveUserSpeech] = useState("");
  const [cameraActive, setCameraActive] = useState(true);
  const [captionsActive, setCaptionsActive] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const handRaisedRef = useRef(false);
  handRaisedRef.current = handRaised;
  const [presenting, setPresenting] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [doubtMode, setDoubtMode] = useState(false);
  const [pausedTimestamp, setPausedTimestamp] = useState<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const usedVoice = useRef(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lecturePanel = useRef<HTMLDivElement>(null);
  const lectureBoard = useRef<HTMLDivElement>(null);
  const shouldBringPlayerIntoView = useRef(false);
  const [toast, setToast] = useState(""); const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWrites = useRef<Promise<void>>(Promise.resolve()); const writeCount = useRef(0); const sending = useRef(false);
  const active = sessions.find(s => s.id === activeId) || sessions[0] || starter[0];
  const tabProvider = tabKeys.gemini ? "gemini" as const : tabKeys.openai ? "openai" as const : null;
  const connected = serverConnected || Boolean(tabProvider);
  const activeProvider = tabProvider || provider;
  const providerName = activeProvider === "gemini" ? "Gemini" : "OpenAI";
  const connectionTone = tutorError || tutorHealthy === false ? "error" : !connected ? "unconfigured" : tutorHealthy === true ? "working" : "idle";
  const connectionLabel = connectionTone === "error" ? "Not working" : connectionTone === "unconfigured" ? "Not connected" : connectionTone === "working" ? "Working" : "Key detected";
  const connectionTitle = connectionTone === "unconfigured"
    ? `No ${providerName} API key is configured, so lessons use the built-in guided tutor. Set GEMINI_API_KEY (or OPENAI_API_KEY) on the server to enable the AI model.`
    : connectionTone === "error"
    ? `${providerName} is not answering: ${tutorError || "the last request was rejected, so this reply came from the guided tutor."}`
    : connectionTone === "working"
    ? `${providerName} · ${model} · last tutor turn succeeded (key from ${tabProvider ? "this tab" : "the server"}).`
    : `${providerName} · ${model} · key from ${tabProvider ? "this tab" : "the server"}. No live turn has run in this tab yet, so this is unverified.`;
  const connectionAria = `${providerName}: ${connectionLabel}. ${connectionTitle}`;
  const latestReply = useMemo(() => [...active.data.messages].reverse().find(m => m.role === "assistant")?.content || "What would you like to explore?", [active.data.messages]);
  const recording = useMemo(() => isRecordedClassKey(active.data.lessonKey) ? recordedClass(active.data.lessonKey) : undefined, [active.data.lessonKey]);
  const lecture = active.data.lecture ?? null;
  const lectureScenes = useMemo(() => recording
    ? recording.scenes.map(page => ({ ...page, ink: active.data.recordingInk?.[page.id] || page.ink }))
    : lecture ? active.data.pages.slice(lecture.startIndex, lecture.startIndex + lecture.sceneCount) : [],
    [recording, active.data.recordingInk, active.data.pages, lecture]);
  const sceneStarts = useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const scene of lectureScenes) {
      starts.push(acc);
      acc += scene.seconds || 40;
    }
    return starts;
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
      if (saved) setPreferences({ name: typeof saved.name === "string" && saved.name.trim() ? saved.name.slice(0, 40) : defaultPreferences.name, paper: ["dots", "grid", "plain"].includes(saved.paper) ? saved.paper : "dots", narration: saved.narration === true, language: ["en", "hi", "hinglish"].includes(saved.language) ? saved.language : "en" });
    } catch { /* Use default preferences when browser storage is unavailable. */ }
    api<{ sessions: StudySession[]; connected: boolean; model: string; provider: "gemini" | "openai"; serverKeyConfigured: boolean }>("/api/sessions").then(result => {
      if (cancelled) return;
      setSessions(prev => {
        return result.sessions.map(s => {
          const match = prev.find(p => p.id === s.id || (p.data.lessonKey && p.data.lessonKey === s.data.lessonKey));
          if (match && match.data.pages.some(p => p.ink && p.ink.length > 0)) {
            return {
              ...s,
              data: {
                ...s.data,
                pages: s.data.pages.map((page, idx) => {
                  const prevPage = match.data.pages[idx];
                  return prevPage && prevPage.ink && prevPage.ink.length > 0
                    ? { ...page, ink: [...prevPage.ink] }
                    : page;
                }),
              },
            };
          }
          return s;
        });
      });
      setServerConnected(result.connected); setModel(result.model); setProvider(result.provider); setServerConfigured(result.serverKeyConfigured); setReady(true); setSaveState("saved");
      let last = ""; try { last = localStorage.getItem("chalkly.active") || ""; } catch { /* optional storage */ }
      setActiveId(prevActiveId => {
        if (last) {
          const matchLast = result.sessions.find(s => s.id === last || s.data.lessonKey === last);
          if (matchLast) return matchLast.id;
        }
        const matchPrev = result.sessions.find(s => s.id === prevActiveId || (s.data.lessonKey && prevActiveId.includes(s.data.lessonKey)));
        return matchPrev ? matchPrev.id : result.sessions[0].id;
      });
    }).catch(() => { if (!cancelled) { setSaveState("error"); notify("Could not load your workspace. Click “Reconnect” to try again."); } });
    return () => { cancelled = true; };
  }, [loadAttempt, notify]);
  const rememberActive = (id: string) => { setActiveId(id); try { localStorage.setItem("chalkly.active", id); } catch { /* optional storage */ } };
  const openSession = (id: string) => { if (busy || lectureLoading) return; closeClass(); rememberActive(id); setView("studio"); setMobileNav(false); setTutorError(""); if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; } window.speechSynthesis?.cancel(); setSpeaking(false); };
  const navigate = (next: View) => { if (next !== "studio") closeClass(); setView(next); setMobileNav(false); setTutorError(""); };
  const showSettings = () => { pauseClass(); setDialog("settings"); setMobileNav(false); };
  const upsert = (session: StudySession) => setSessions(prev => prev.some(s => s.id === session.id) ? prev.map(s => s.id === session.id ? session : s) : [session, ...prev]);
  const setData = (id: string, change: (data: SessionData) => SessionData) => setSessions(prev => prev.map(s => s.id === id ? { ...s, data: change(s.data), updatedAt: new Date().toISOString() } : s));
  const patch = useCallback((id: string, body: Record<string, unknown>) => {
    let targetId = id;
    if (!uuidPattern.test(targetId)) {
      const loaded = sessions.find(s => s.id === id || (s.data.lessonKey && id.includes(s.data.lessonKey)));
      if (loaded && uuidPattern.test(loaded.id)) {
        targetId = loaded.id;
      } else {
        return;
      }
    }
    setSaveState("saving"); writeCount.current++;
    pendingWrites.current = pendingWrites.current.catch(() => {}).then(async () => {
      try {
        await api(`/api/sessions/${targetId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (writeCount.current === 1) setSaveState("saved");
      } catch {
        setSaveState("error");
        notify("Could not save the last change. Reconnect and try again.");
      } finally {
        writeCount.current--;
      }
    });
  }, [sessions, notify]);
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
    if (recording?.scenes.some(scene => scene.id === pageId)) {
      setData(active.id, data => ({ ...data, recordingInk: { ...data.recordingInk, [pageId]: ink } }));
    } else setData(active.id, data => ({ ...data, pages: data.pages.map(p => p.id === pageId ? { ...p, ink } : p) }));
    if (ready) {
      patch(active.id, { pageId, ink });
    }
  }, [ready, recording, active.id, patch]);
  const pageChange = useCallback((pageIndex: number) => { setData(active.id, data => ({ ...data, pageIndex })); patch(active.id, { pageIndex }); }, [active.id, patch]);
  const baseHeaders = useCallback((): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(tabKeys.gemini ? { "x-gemini-key": tabKeys.gemini } : {}),
    ...(tabKeys.openai ? { "x-openai-key": tabKeys.openai } : {})
  }), [tabKeys.gemini, tabKeys.openai]);
  const toggleListeningRef = useRef<((overrideLang?: SupportedLanguage) => void) | null>(null);
  const speak = useCallback((text: string, overrideLang?: SupportedLanguage, onStart?: (durationSeconds: number) => void) => {
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

    const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const activeLang: SupportedLanguage = overrideLang || (isDevanagari ? "hi" : preferences.language || "en");

    let started = false;
    const notifyStart = (durSec: number) => {
      if (started) return;
      started = true;
      onStart?.(durSec);
    };

    // Server-side TTS via Gemini on Vertex AI — works without browser gesture blocking
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, language: activeLang }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("TTS server error");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsAudioRef.current = audio;

        audio.onplay = () => {
          const estimated = Math.max(2.0, cleanText.split(/\s+/u).length / 2.3);
          const dur = (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0.5)
            ? audio.duration
            : estimated;
          notifyStart(dur);
        };

        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          if (liveCallActiveRef.current) {
            setTimeout(() => { toggleListeningRef.current?.(); }, 600);
          }
        };
        audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); ttsAudioRef.current = null; };
        return audio.play().catch((err) => {
          setSpeaking(false);
          throw err;
        });
      })
      .catch(() => {
        // Fallback to browser speechSynthesis if server TTS fails
        if (!("speechSynthesis" in window)) { setSpeaking(false); return; }
        const synth = window.speechSynthesis;
        try { synth.cancel(); } catch { /* ignore */ }
        const speech = new SpeechSynthesisUtterance(cleanText);
        speech.rate = 1.0;
        const voices = synth.getVoices();

        if (activeLang === "hi" || isDevanagari) {
          speech.lang = "hi-IN";
          const hiVoice = voices.find(v => v.lang.startsWith("hi") || v.lang.includes("hi-IN") || /hindi/i.test(v.name));
          if (hiVoice) speech.voice = hiVoice;
        } else if (activeLang === "hinglish") {
          speech.lang = "en-IN";
          const inVoice = voices.find(v => v.lang === "en-IN" || v.lang.startsWith("en-IN") || /india/i.test(v.name));
          if (inVoice) speech.voice = inVoice;
          else {
            const enVoice = voices.find(v => v.lang === "en-US") || voices.find(v => v.lang.startsWith("en"));
            if (enVoice) speech.voice = enVoice;
          }
        } else {
          speech.lang = "en-US";
          const enVoice = voices.find(v => v.lang === "en-US") || voices.find(v => v.lang.startsWith("en")) || voices[0];
          if (enVoice) speech.voice = enVoice;
        }

        speech.onstart = () => {
          const words = cleanText.split(/\s+/u).length;
          const dur = Math.max(2.0, words / 2.3);
          notifyStart(dur);
        };

        speech.onend = () => {
          setSpeaking(false);
          if (liveCallActiveRef.current) {
            setTimeout(() => { toggleListeningRef.current?.(); }, 600);
          }
        };
        speech.onerror = () => setSpeaking(false);
        synth.speak(speech);
      });
  }, [preferences.language]);
  const toggleListening = useCallback((overrideLang?: SupportedLanguage) => {
    const activeLang = overrideLang || preferences.language || "en";
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
      if (activeLang === "hi") {
        rec.lang = "hi-IN";
      } else if (activeLang === "hinglish") {
        rec.lang = "en-IN";
      } else {
        rec.lang = "en-US";
      }
      rec.onstart = () => {
        setListening(true);
        usedVoice.current = true;
        setLiveUserSpeech("");
        const msg = activeLang === "hi"
          ? "सुन रहा हूँ… हिंदी में बोलिए (Listening in Hindi…)"
          : activeLang === "hinglish"
          ? "Listening in Hinglish… speak your query."
          : "Listening… speak your query into your microphone.";
        notify(msg);
      };
      rec.onresult = (e: SpeechEvent) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join("");
        setLiveUserSpeech(text);
        usedVoice.current = true;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (liveCallActiveRef.current && text.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            if (text.trim() && !sending.current) {
              rec.stop();
              setListening(false);
              void sendRef.current(text.trim());
            }
          }, 1400);
        }
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
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      notify("Microphone could not be started. Check your browser permissions.");
    }
  }, [listening, preferences.language, notify]);
  toggleListeningRef.current = toggleListening;
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
      setVoiceSupported(true);
    }
  }, []);
  useEffect(() => { closeClass(); setDoubtMode(false); setPausedTimestamp(null); }, [active.id, closeClass]);
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
    if ((recording && !playback.audioIssue) || !lectureActive || !lecturePlaying || lectureMuted || !voiceSupported || !currentScene?.narration || doubtMode || Boolean(pausedTimestamp !== null)) return;
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
  }, [recording, lectureActive, lecturePlaying, lectureMuted, voiceSupported, currentScene?.narration, playbackRevision, readClass, sceneStart, sceneSeconds, playback.audioIssue, doubtMode, pausedTimestamp]);
  const startLecture = useCallback(async () => {
    if (!canStartClass) return;
    window.speechSynthesis?.cancel(); setSpeaking(false); setTutorError("");
    shouldBringPlayerIntoView.current = true;
    if (lectureScenes.length) { playClass(); return; }
    setLectureLoading(true);
    try {
      await pendingWrites.current;
      const result = await api<{ session: StudySession; notice?: string; mode?: "guided" | "llm" }>("/api/tutor", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ sessionId: active.id, message: `Teach me a detailed two-minute lecture on ${active.data.title}. Include a worked example and a practice question with its answer.`, lecture: true, language: preferences.language || "en" }) });
      upsert(result.session); setSaveState("saved"); noteTurn(result.mode, result.notice);
      playClass();
      if (result.notice) notify(result.notice);
    } catch (err) { setTutorHealthy(false); setTutorError(err instanceof Error ? err.message : "The lecture could not be prepared."); }
    finally { setLectureLoading(false); }
  }, [canStartClass, lectureScenes.length, playClass, active.id, active.data.title, notify, baseHeaders]);
  const showClassNotes = () => { pauseClass(); setDialog("class-notes"); };
  // Only a turn the model itself answered proves the connection works; a guided fallback does not,
  // and a turn carrying a notice means the model was tried and failed.
  const noteTurn = (mode: "guided" | "llm" | undefined, notice?: string) => {
    if (notice) setTutorHealthy(false);
    else if (mode === "llm") setTutorHealthy(true);
  };
  const send = async (message: string) => {
    const trimmed = message.trim(); if (!trimmed || sending.current || !ready || lectureLoading) return;

    // 1. Immediately cancel speech & listening to prevent any conflicting voices
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
    window.speechSynthesis?.cancel();
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = "";
      ttsAudioRef.current = null;
    }
    setSpeaking(false);

    // 2. If a lecture is playing, immediately pause and capture the exact position
    if (lectureActive && lecturePlaying) {
      const at = readClass();
      pauseClass();
      if (playback.audioRef?.current) {
        try { playback.audioRef.current.pause(); } catch {}
      }
      setPausedTimestamp(at);
      setDoubtMode(true);
    }

    const isDoubt = Boolean(lectureOpen && (doubtMode || pausedTimestamp !== null));
    if (lectureOpen && !isDoubt) closeClass();
    sending.current = true; setBusy(true); setTutorError(""); setPendingQuestion(trimmed);
    try {
      await pendingWrites.current;
      const lectureContext = isDoubt ? {
        topic: active.data.title,
        chapter: safeScene + 1,
        chapterTitle: currentScene?.title || sceneTitle,
        timestamp: pausedTimestamp ?? lectureTime,
        caption: lectureCaption,
      } : undefined;
      const result = await api<{ session: StudySession; drew: boolean; notice?: string; mode?: "guided" | "llm" }>("/api/tutor", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ sessionId: active.id, message: trimmed, language: preferences.language || "en", lectureContext }) });
      upsert(result.session); setSaveState("saved"); if (result.notice) notify(result.notice);
      usedVoice.current = false;
      const lastReply = result.session.data.messages[result.session.data.messages.length - 1]?.content;
      noteTurn(result.mode, result.notice);

      if (isDoubt) {
        const turnMarks = result.session.data.pages[result.session.data.pageIndex]?.marks || [];
        const newDoubtMarks = turnMarks.filter(m => m.annotation || m.type !== "image");
        if (currentScene) {
          currentScene.doubtMarks = newDoubtMarks;
        }
        setDoubtMarks(newDoubtMarks);
      }

      let drawingTriggered = false;
      const triggerDrawing = (durationSec?: number) => {
        if (drawingTriggered) return;
        drawingTriggered = true;
        if (durationSec && durationSec > 0) {
          setAnimationDuration(durationSec * 1000);
        }
        if (result.drew || (isDoubt && result.session.data.pages[result.session.data.pageIndex]?.marks?.length)) {
          setAnimation(n => n + 1);
        }
      };

      if (lastReply) {
        // Fallback safety: start drawing if voice generation exceeds 2.2s
        const fallbackTimer = setTimeout(() => {
          triggerDrawing();
        }, 2200);

        speak(lastReply, preferences.language || "en", (durationSec) => {
          clearTimeout(fallbackTimer);
          triggerDrawing(durationSec);
        });
      } else if (result.drew) {
        triggerDrawing();
      }
    } catch (err) { setTutorHealthy(false); setTutorError(err instanceof Error ? err.message : "The tutor couldn’t finish. Please try again."); }
    finally { sending.current = false; setBusy(false); setPendingQuestion(""); }
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  const handleTogglePresent = useCallback(async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setPresenting(false);
      notify("Screen presentation stopped.");
      return;
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setScreenStream(null);
            setPresenting(false);
            notify("Screen sharing ended.");
          };
        }
        setScreenStream(stream);
        setPresenting(true);
        notify("Screen sharing active. Presentation stream displayed on whiteboard.");
      } catch (err: any) {
        if (err?.name === "NotAllowedError" || err?.name === "AbortError") {
          notify("Screen share permission cancelled.");
        } else {
          notify(`Could not share screen: ${err?.message || "Unknown error"}`);
        }
        setPresenting(false);
      }
    } else {
      setPresenting(p => !p);
      notify("Presentation mode toggled.");
    }
  }, [screenStream, notify]);

  const handleBigMicClick = useCallback(() => {
    if (lectureActive && lecturePlaying) {
      const boundary = findNextSentenceBoundary(currentScene?.cues || [], lectureTime, 1.0, 4.0);
      playback.gracefulPause(boundary.boundaryTime, (pausedAt) => {
        setDoubtMode(true);
        setPausedTimestamp(pausedAt);
        notify(`Lecture paused at sentence boundary ${Math.floor(pausedAt / 60)}:${String(Math.floor(pausedAt % 60)).padStart(2, "0")} for doubt solving.`);
      });
    }
    if (speaking) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      toggleListening();
      return;
    }
    if (listening) {
      if (liveUserSpeech.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        recognitionRef.current?.stop();
        setListening(false);
        void send(liveUserSpeech.trim());
      } else {
        toggleListening();
      }
      return;
    }
    toggleListening();
  }, [speaking, listening, liveUserSpeech, toggleListening, send]);

  const toggleLiveCall = useCallback(() => {
    const next = !liveCallActive;
    setLiveCallActive(next);
    liveCallActiveRef.current = next;
    if (!next) {
      if (listening) {
        recognitionRef.current?.stop();
        setListening(false);
      }
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      notify("1-on-1 Voice Call ended.");
    } else {
      notify("1-on-1 Live Voice Call active. Listening for your query…");
      toggleListening();
    }
  }, [liveCallActive, listening, notify, toggleListening]);
  const createSession = async (payload: string | { topic: string; subjectId?: string; chapterId?: string; topicId?: string; studentLevel?: string }) => {
    await pendingWrites.current;
    const body = typeof payload === "string" ? { topic: payload } : payload;
    const result = await api<{ session: StudySession; notice?: string }>("/api/sessions", { method: "POST", headers: baseHeaders(), body: JSON.stringify(body) });
    upsert(result.session); setReady(true); openSession(result.session.id); setDialog(null);
    if (result.notice) notify(result.notice); else notify("A fresh session is ready.");
    const intro = result.session.data.messages[0]?.content;
    let drawingTriggered = false;
    const triggerDrawing = (durationSec?: number) => {
      if (drawingTriggered) return;
      drawingTriggered = true;
      if (durationSec && durationSec > 0) setAnimationDuration(durationSec * 1000);
      setAnimation(n => n + 1);
    };
    if (intro) {
      const fallbackTimer = setTimeout(() => triggerDrawing(), 2200);
      speak(intro, preferences.language || "en", (durationSec) => {
        clearTimeout(fallbackTimer);
        triggerDrawing(durationSec);
      });
    } else {
      triggerDrawing();
    }
  };
  const deleteSession = async (id: string) => {
    await pendingWrites.current; await api(`/api/sessions/${id}`, { method: "DELETE" });
    const left = sessions.filter(s => s.id !== id); setSessions(left); if (active.id === id && left[0]) rememberActive(left[0].id); notify("Session deleted.");
  };
  const savePreferences = (prefs: Preferences) => {
    const langChanged = prefs.language !== preferences.language;
    if (langChanged) {
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      if (listening) {
        recognitionRef.current?.stop();
        setListening(false);
      }
    }
    setPreferences(prefs);
    try { localStorage.setItem("chalkly.preferences", JSON.stringify(prefs)); } catch { /* optional storage */ }
    setDialog(null);
    const langNames: Record<SupportedLanguage, string> = {
      en: "English (en-US)",
      hinglish: "Hinglish (हिंग्लिश · en-IN)",
      hi: "हिन्दी (Hindi · hi-IN)",
    };
    notify(`Preferences saved. Tutor will teach in ${langNames[prefs.language || "en"]}.`);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.closest("input, textarea, [contenteditable=true]") || document.querySelector('[role="dialog"]'))) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setCameraActive(c => !c);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleBigMicClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBigMicClick]);

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${mobileNav ? "mobile-nav-open" : ""}`}>
    <a className="skip-link" href="#main-content">Skip to workspace</a>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <aside className="sidebar"><div className="brand-row"><Brand/><button className="mobile-nav-close icon-button" aria-label="Close sidebar" onClick={() => setMobileNav(false)}><X size={17}/></button></div>
      <div className="sidebar-content">
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="primary-button new-session-sidebar-hero"
            onClick={() => { pauseClass(); setDialog("new"); setMobileNav(false); }}
            disabled={busy || lectureLoading}
            title="Start a live AI class on any topic"
          >
            <Plus size={16}/>
            <span>New Session</span>
          </button>
        </div>
        <div className="recent-heading"><div className="sidebar-label">Demo Lectures</div><button aria-label="Create a session" title="Create a session" onClick={() => { setDialog("new"); setMobileNav(false); }}><Plus size={14}/></button></div>
        <nav className="recent-sessions" aria-label="Recent sessions">{sortedSessions.slice(0, 16).map(s => <button key={s.id} disabled={busy || lectureLoading} onClick={() => openSession(s.id)} className={s.id === active.id && view === "studio" ? "current" : ""} title={s.data.title}><span className={`session-dot dot-${s.data.lessonKey}`}/><span>{s.data.title.replace(/^The /, "").replace(/^Pythagorean/, "Pythagorean").replace(/^water/, "Water")}</span></button>)}</nav>
        <div className="sidebar-rule"/><div className="sidebar-label">Workspace</div><nav className="primary-nav" aria-label="Workspace navigation">{([['studio', Presentation], ['saved', Bookmark], ['history', History]] as const).map(([id, Icon]) => <button key={id} className={`nav-link ${view === id ? "selected" : ""}`} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}><Icon size={18}/><span>{viewNames[id]}</span>{id === "saved" && sessions.some(s => s.data.saved) && <small>{sessions.filter(s => s.data.saved).length}</small>}</button>)}</nav>
      </div>
      <div className="sidebar-bottom"><button className="settings-link" onClick={() => showSettings()}><Settings size={17}/>Settings</button><button className="profile-button" onClick={() => showSettings()} aria-label="Open profile settings"><span className="user-avatar">{initials(preferences.name)}</span><span className="profile-details"><strong>{preferences.name}</strong><small>Personal workspace</small></span><ChevronsUpDown size={14}/></button></div>
    </aside>
    <div className="workspace-shell"><header className="topbar"><div className="breadcrumbs"><button className="icon-button sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar" onClick={() => { if (window.innerWidth <= 900) setMobileNav(!mobileNav); else setCollapsed(!collapsed); }}><PanelLeft size={18}/></button><span className="topbar-divider"/><span className="crumb-home"><span className="desktop-crumb">Qrie Workspace</span><span className="mobile-wordmark">Qrie</span></span><ChevronRight size={13}/><span className="crumb-current">{viewNames[view]}</span></div><div className="topbar-actions"><button className="primary-button new-session-topbar" onClick={() => { pauseClass(); setDialog("new"); }} disabled={busy || lectureLoading} title="Create a new session"><Plus size={14}/><span>New session</span></button><span className="topbar-divider"/>{saveState === "error" ? <button className="reconnect-button" onClick={() => setLoadAttempt(n => n + 1)}><CloudOff size={16}/>Reconnect</button> : <span className="save-status">{saveState === "saving" ? <LoaderCircle size={15} className="spin"/> : <CloudCheck size={16}/>}<span>{saveState === "saving" ? "Saving changes…" : "All changes saved"}</span></span>}<span className="topbar-divider"/><div className={`gemini-status-strip ${connectionTone}`} title={connectionTitle} role="status" aria-live="polite" aria-label={connectionAria}><div className="gemini-strip-left"><GeminiMark size={14}/><span className="gemini-title">{providerName}</span><span className="gemini-active-indicator"><i className={connectionTone === "working" ? "pulsing" : ""}/><span>{connectionLabel}</span></span></div><span className="gemini-strip-divider"/><div className="gemini-credits-pill"><span>{connected ? model : "Guided only"}</span></div></div><button className="icon-button help-button" title="Help & shortcuts" aria-label="Help and keyboard shortcuts" onClick={() => { pauseClass(); setDialog("help"); }}><CircleHelp size={18}/></button></div></header>
      <main id="main-content" className={`main-content ${view === "studio" ? "studio-main" : ""}`}>{view !== "studio" && <div className="page-heading"><div><div className="page-eyebrow"><span className="eyebrow-line"/>Your workspace</div><h1>{viewNames[view]}</h1><p>{viewDescriptions[view]}</p></div><button className="primary-button new-session-button" onClick={() => { pauseClass(); setDialog("new"); }} disabled={busy || lectureLoading}><Plus size={17}/>New session</button></div>}
      {view === "studio" && sessions.length > 0 ? <div className="studio-content">
        {recording && <audio key={recording.audio} ref={playback.audioRef} src={recording.audio} preload="none" muted={lectureMuted} onError={playback.onAudioError} onEnded={playback.onAudioEnded} onWaiting={playback.onAudioWaiting} onPlaying={playback.onAudioPlaying}/>}
        <div className="lecture-board-anchor" ref={lectureBoard}>
          {doubtMode && pausedTimestamp !== null && (
            <div className="meet-doubt-banner" role="status">
              <span className="meet-doubt-dot" />
              <div className="meet-doubt-copy">
                <strong>Doubt-Solving Mode</strong>
                <span>Lecture paused at {Math.floor(pausedTimestamp / 60)}:{String(Math.floor(pausedTimestamp % 60)).padStart(2, "0")} · Ask your question via mic or chat</span>
              </div>
              <button
                type="button"
                className="meet-resume-doubt-btn"
                onClick={() => {
                  if (currentScene) {
                    currentScene.doubtMarks = [];
                  }
                  setDoubtMarks([]);
                  if (typeof (window as any).__qrieSpatial?.clearDoubtMarks === "function") {
                    (window as any).__qrieSpatial.clearDoubtMarks();
                  }
                  // Stop any doubt voice playback immediately
                  if (ttsAudioRef.current) {
                    ttsAudioRef.current.pause();
                    ttsAudioRef.current.src = "";
                    ttsAudioRef.current = null;
                  }
                  window.speechSynthesis?.cancel();
                  setSpeaking(false);

                  setDoubtMode(false);
                  handRaisedRef.current = false;
                  setHandRaised(false);
                  playback.seek(pausedTimestamp);
                  playback.start();
                  setPausedTimestamp(null);
                  notify("Resumed lecture.");
                }}
              >
                <Play size={13} fill="currentColor" />
                <span>Resume lecture ({Math.floor(pausedTimestamp / 60)}:{String(Math.floor(pausedTimestamp % 60)).padStart(2, "0")})</span>
              </button>
            </div>
          )}
          <Whiteboard session={active} paper={preferences.paper} animation={animation} animationDuration={animationDuration} doubtMarks={doubtMarks} busy={busy} onInk={inkChange} onPage={pageChange} onSave={saveActiveBoard} notify={notify}
          overridePage={lectureActive ? currentScene : null} overrideIndex={safeScene} overrideTotal={lectureScenes.length} locked={lectureActive && lecturePlaying}
          tutorSpeaking={Boolean(busy || speaking || (lectureActive && lecturePlaying))} tutorPaused={lectureActive && !lecturePlaying} tutorMuted={lectureMuted}
          playbackPlaying={lectureActive && lecturePlaying} readPlayback={readClass} playbackSceneStart={sceneStart} playbackSceneSeconds={sceneSeconds}
          playbackCues={currentScene?.cues} playbackMarkPosition={lectureActive ? (cue?.markProgress ?? sceneProgress * (currentScene?.marks.length || 0)) : undefined}
          playbackRevision={playbackRevision}
          onClass={recording && !lectureActive ? startLecture : undefined} classDisabled={!canStartClass} classComplete={lectureTime >= totalSeconds}
          listening={listening}
          speaking={speaking}
          onAskMic={handleBigMicClick}
          onSendQuery={(q: string) => void send(q)}
          language={preferences.language || "en"}
          liveUserSpeech={liveUserSpeech}
          pendingQuestion={pendingQuestion}
          latestReply={latestReply}
          onOpenTranscript={() => setDialog("transcript")}
          onToggleVoiceReadAloud={() => {
            if (speaking) {
              if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
              window.speechSynthesis?.cancel();
              setSpeaking(false);
            } else {
              speak(latestReply);
            }
          }}
          suggestions={
            (preferences.language && preferences.language !== "en" && (!active.data.messages || active.data.messages.length <= 1))
              ? localizedSuggestions[preferences.language]
              : active.data.suggestions
          }
          cameraActive={cameraActive}
          studentName={preferences.name || "You"}
          presentationStream={screenStream}
          onStopPresent={handleTogglePresent}
        /></div>
        {tutorError && <div className="inline-error" role="alert">{tutorError}</div>}
        <LiveCaptionsOverlay
          active={captionsActive}
          speaking={Boolean(busy || speaking || (lectureActive && lecturePlaying))}
          listening={listening}
          latestReply={latestReply}
          liveUserSpeech={liveUserSpeech}
          pendingQuestion={pendingQuestion}
        />
        <GoogleMeetBar
          title={lectureActive ? (sceneTitle || active.data.title) : active.data.title}
          listening={listening}
          speaking={Boolean(busy || speaking || (lectureActive && lecturePlaying))}
          busy={busy}
          cameraActive={cameraActive}
          captionsActive={captionsActive}
          chatOpen={chatOpen}
          unreadCount={unreadCount}
          presenting={presenting}
          handRaised={handRaised}
          onToggleMic={handleBigMicClick}
          onToggleCamera={() => setCameraActive(c => !c)}
          onToggleCaptions={() => setCaptionsActive(c => !c)}
          onTogglePresent={handleTogglePresent}
          lectureActive={lectureActive}
          lecturePlaying={lecturePlaying}
          lectureIndex={safeScene}
          lectureTotal={lectureScenes.length}
          audioIssue={playback.audioIssue}
          onLecturePrev={() => {
            if (safeScene > 0) {
              playback.seek(sceneStarts[safeScene - 1]);
            }
          }}
          onLectureToggle={playback.toggle}
          onLectureNext={() => {
            if (safeScene < lectureScenes.length - 1) {
              playback.seek(sceneStarts[safeScene + 1]);
            }
          }}
          onExitLecture={closeClass}
          onRaiseHand={() => {
            if (handRaisedRef.current) {
              // Lower hand
              handRaisedRef.current = false;
              setHandRaised(false);
              if (listening) {
                toggleListening();
              }
              // If lecture was paused due to hand raise and doubt hasn't been submitted yet, resume
              if (doubtMode && pausedTimestamp !== null && (!currentScene?.doubtMarks || currentScene.doubtMarks.length === 0) && (!doubtMarks || doubtMarks.length === 0)) {
                setDoubtMode(false);
                playback.seek(pausedTimestamp);
                playback.start();
                setPausedTimestamp(null);
                notify("Hand lowered. Resuming lecture.");
              } else {
                notify("Hand lowered.");
              }
              return;
            }

            // Raising hand
            if (lectureActive && lecturePlaying) {
              // 1. Immediately pause the lecture & halt all playback audio
              const at = readClass();
              pauseClass();
              if (playback.audioRef?.current) {
                try { playback.audioRef.current.pause(); } catch {}
              }
              window.speechSynthesis?.cancel();
              if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current.src = "";
                ttsAudioRef.current = null;
              }
              setSpeaking(false);

              // 2. Store exact pause timestamp and enter doubt mode
              setPausedTimestamp(at);
              setDoubtMode(true);
              setHandRaised(true);
              handRaisedRef.current = true;

              // 3. Immediately activate microphone to listen to student's question!
              if (!listening) {
                toggleListening();
              }
              notify(`Hand raised! Lecture paused at ${Math.floor(at / 60)}:${String(Math.floor(at % 60)).padStart(2, "0")}. The teacher is listening to your question… (speak into mic or type)`);
            } else {
              const next = true;
              handRaisedRef.current = next;
              setHandRaised(next);
              if (!listening) toggleListening();
              notify("Hand raised! The teacher is listening for your question…");
            }
          }}
          onToggleChat={() => {
            setChatOpen(prev => {
              if (!prev) setUnreadCount(0);
              return !prev;
            });
          }}
          onLeaveCall={() => setLeaveModalOpen(true)}
          onOpenInfo={() => notify(`${active.data.title} · Studio Session`)}
          onOpenPeople={() => notify(`2 in call: ${preferences.name || "You"} (Student), AI Tutor`)}
        />
      </div> : view === "studio" ? <div className="empty-library"><span className="empty-symbol"><SquarePen size={32}/></span><h2>A fresh start</h2><p>Create a session to begin learning with your tutor.</p><button className="primary-button" onClick={() => setDialog("new")}>Create a session<ArrowRight size={15}/></button></div> : <Library key={view} sessions={sortedSessions} view={view} onOpen={openSession} onDelete={deleteSession} onSave={saveBoard} onStudio={() => navigate("studio")}/>}
      </main>
    </div>
    {dialog === "class-notes" && recording && <ClassNotes recording={recording} onClose={() => setDialog(null)}/>}
    {dialog === "new" && <NewSessionDialog onClose={() => setDialog(null)} onCreate={createSession} connected={connected} onConnect={() => showSettings()}/>}
    {dialog === "settings" && <SettingsDialog preferences={preferences} onSave={savePreferences} onClose={() => setDialog(null)}/>}
    {dialog === "help" && <HelpDialog onClose={() => setDialog(null)}/>}{dialog === "transcript" && <TranscriptDialog session={active} onClose={() => setDialog(null)}/>}
    {toast && <div className="toast" role="status"><CircleCheck size={17}/><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={14}/></button></div>}
    {view === "studio" && sessions.length > 0 && (
      <>
        <SlidingChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={active.data.messages || []}
          busy={busy}
          pendingQuestion={pendingQuestion}
          onSend={(q) => void send(q)}
          suggestions={
            (preferences.language && preferences.language !== "en" && (!active.data.messages || active.data.messages.length <= 1))
              ? localizedSuggestions[preferences.language]
              : active.data.suggestions
          }
          studentName={preferences.name || "You"}
        />
        <LeaveCallDialog
          isOpen={leaveModalOpen}
          onRejoin={() => setLeaveModalOpen(false)}
          onReturnHome={() => {
            setLeaveModalOpen(false);
            navigate("history");
          }}
        />
      </>
    )}
  </div>;
}
