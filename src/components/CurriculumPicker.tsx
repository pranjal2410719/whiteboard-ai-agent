"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Cpu,
  GraduationCap,
  Heart,
  LoaderCircle,
  Search,
  Sparkles,
  Zap,
  Atom,
  Layers,
  Activity
} from "lucide-react";
import { curriculumSubjects } from "@/lib/curriculum/taxonomy";
import type { CurriculumChapter, CurriculumSubject, CurriculumTopic, StudentLevel } from "@/lib/curriculum/types";

export interface SessionCreatePayload {
  topic: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  studentLevel?: StudentLevel;
}

export function CurriculumPicker({
  onClose,
  onCreate,
  connected,
  onConnect
}: {
  onClose: () => void;
  onCreate: (payload: SessionCreatePayload | string) => Promise<void>;
  connected: boolean;
  onConnect: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<CurriculumChapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [studentLevel, setStudentLevel] = useState<StudentLevel>("intermediate");
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const results: Array<{ subject: CurriculumSubject; chapter: CurriculumChapter; topic: CurriculumTopic }> = [];
    for (const sub of curriculumSubjects) {
      for (const ch of sub.chapters) {
        for (const top of ch.topics) {
          if (
            top.title.toLowerCase().includes(q) ||
            top.description.toLowerCase().includes(q) ||
            sub.name.toLowerCase().includes(q) ||
            ch.title.toLowerCase().includes(q) ||
            top.mandatoryConcepts.some(c => c.toLowerCase().includes(q))
          ) {
            results.push({ subject: sub, chapter: ch, topic: top });
          }
        }
      }
    }
    return results;
  }, [searchQuery]);

  const handleSelectSubject = (subject: CurriculumSubject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSearchQuery("");
    setError("");
    setStep(2);
  };

  const handleSelectChapter = (chapter: CurriculumChapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic(chapter.topics[0] || null);
    setError("");
    setStep(3);
  };

  const handleQuickSelectSearch = (item: { subject: CurriculumSubject; chapter: CurriculumChapter; topic: CurriculumTopic }) => {
    setSelectedSubject(item.subject);
    setSelectedChapter(item.chapter);
    setSelectedTopic(item.topic);
    setSearchQuery("");
    setError("");
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;

    let payload: SessionCreatePayload;
    if (selectedTopic) {
      payload = {
        topic: selectedTopic.title,
        subjectId: selectedSubject?.id,
        chapterId: selectedChapter?.id,
        topicId: selectedTopic.id,
        studentLevel
      };
    } else if (customTopic.trim()) {
      payload = {
        topic: customTopic.trim(),
        subjectId: selectedSubject?.id,
        chapterId: selectedChapter?.id,
        studentLevel
      };
    } else {
      setError("Please select a topic or enter a custom lesson title.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await onCreate(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare classroom session. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="curriculum-picker-container" data-testid="curriculum-picker">
      {/* Wizard Progress Bar */}
      <div className="curriculum-steps-header">
        <button
          type="button"
          className={`step-badge ${step >= 1 ? "active" : ""}`}
          onClick={() => { if (!pending) setStep(1); }}
        >
          <span className="step-num">1</span>
          <span className="step-label">Subject</span>
        </button>
        <div className={`step-connector ${step >= 2 ? "active" : ""}`} />
        <button
          type="button"
          className={`step-badge ${step >= 2 ? "active" : ""}`}
          onClick={() => { if (!pending && selectedSubject) setStep(2); }}
          disabled={!selectedSubject}
        >
          <span className="step-num">2</span>
          <span className="step-label">Chapter</span>
        </button>
        <div className={`step-connector ${step >= 3 ? "active" : ""}`} />
        <button
          type="button"
          className={`step-badge ${step >= 3 ? "active" : ""}`}
          onClick={() => { if (!pending && selectedChapter) setStep(3); }}
          disabled={!selectedChapter}
        >
          <span className="step-num">3</span>
          <span className="step-label">Topic & Preparation</span>
        </button>
      </div>

      {/* Global Quick Search Bar */}
      <div className="curriculum-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search subjects, chapters, or topics (e.g. Heart, Cell, Circuit, Incline)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          disabled={pending}
        />
        {searchQuery && (
          <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
            ×
          </button>
        )}
      </div>

      {/* Search Results Dropdown / Panel */}
      {searchQuery.trim().length > 0 && (
        <div className="curriculum-search-results">
          {searchResults.length === 0 ? (
            <div className="empty-search-msg">No matching topics found in pre-built library. You can enter it as a custom topic in Step 3!</div>
          ) : (
            searchResults.map(item => (
              <button
                key={item.topic.id}
                type="button"
                className="search-result-item"
                onClick={() => handleQuickSelectSearch(item)}
              >
                <div className="result-text">
                  <strong>{item.topic.title}</strong>
                  <small>{item.subject.name} · {item.chapter.title}</small>
                </div>
                {item.topic.assetKey && (
                  <span className="asset-tag">Interactive Diagram</span>
                )}
                <ChevronRight size={16} />
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 1: Subject Selection */}
      {step === 1 && !searchQuery && (
        <div className="step-pane step-1-pane" data-testid="step-subjects">
          <div className="pane-title">Choose a Subject Area</div>
          <div className="subject-cards-grid">
            {curriculumSubjects.map(sub => (
              <button
                key={sub.id}
                type="button"
                className={`subject-card card-color-${sub.color} ${selectedSubject?.id === sub.id ? "selected" : ""}`}
                onClick={() => handleSelectSubject(sub)}
                disabled={pending}
                data-testid={`subject-card-${sub.id}`}
              >
                <div className="subject-icon-wrap">
                  {sub.id === "biology" && <Heart size={26} />}
                  {sub.id === "physics" && <Atom size={26} />}
                  {sub.id === "earth-science" && <Activity size={26} />}
                  {sub.id === "mathematics" && <Layers size={26} />}
                </div>
                <div className="subject-details">
                  <h3>{sub.name}</h3>
                  <p>{sub.description}</p>
                  <div className="subject-meta">
                    <span>{sub.chapters.length} Chapters</span>
                    <span>{sub.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)} Verified Topics</span>
                  </div>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Chapter Selection */}
      {step === 2 && !searchQuery && selectedSubject && (
        <div className="step-pane step-2-pane" data-testid="step-chapters">
          <div className="pane-header-nav">
            <button type="button" className="nav-back-btn" onClick={() => setStep(1)} disabled={pending}>
              <ArrowLeft size={16} /> Back to Subjects
            </button>
            <span className="current-context-tag">{selectedSubject.name}</span>
          </div>
          <div className="pane-title">Select a Chapter</div>
          <div className="chapters-list">
            {selectedSubject.chapters.map(ch => (
              <button
                key={ch.id}
                type="button"
                className={`chapter-list-item ${selectedChapter?.id === ch.id ? "selected" : ""}`}
                onClick={() => handleSelectChapter(ch)}
                disabled={pending}
                data-testid={`chapter-item-${ch.id}`}
              >
                <div className="chapter-info">
                  <h4>{ch.title}</h4>
                  <p>{ch.description}</p>
                </div>
                <div className="chapter-badge">
                  <span>{ch.topics.length} topics</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Topic Selection & Classroom Preparation */}
      {step === 3 && !searchQuery && selectedChapter && (
        <form onSubmit={handleSubmit} className="step-pane step-3-pane" data-testid="step-topics">
          <div className="pane-header-nav">
            <button type="button" className="nav-back-btn" onClick={() => setStep(2)} disabled={pending}>
              <ArrowLeft size={16} /> Back to Chapters
            </button>
            <span className="current-context-tag">
              {selectedSubject?.name} → {selectedChapter.title}
            </span>
          </div>

          <div className="pane-title">Select Topic & Teaching Requirements</div>

          {/* Topics selection list */}
          <div className="topics-horizontal-list">
            {selectedChapter.topics.map(t => (
              <button
                key={t.id}
                type="button"
                className={`topic-pill ${selectedTopic?.id === t.id ? "active" : ""}`}
                onClick={() => { setSelectedTopic(t); setCustomTopic(""); setError(""); }}
                disabled={pending}
                data-testid={`topic-pill-${t.id}`}
              >
                {t.assetKey && <Sparkles size={14} className="sparkle-icon" />}
                <span>{t.title}</span>
                {selectedTopic?.id === t.id && <Check size={14} />}
              </button>
            ))}
          </div>

          {/* Active Topic Classroom Preparation Box */}
          {selectedTopic ? (
            <div className="topic-preparation-card" data-testid="topic-preparation-card">
              <div className="prep-card-header">
                <div className="prep-title-block">
                  <span className="prep-eyebrow">PREPARATION ENGINE READY</span>
                  <h3>{selectedTopic.title}</h3>
                  <p>{selectedTopic.description}</p>
                </div>
                {selectedTopic.assetKey && (
                  <div className="asset-readiness-chip">
                    <Sparkles size={14} />
                    <span>Verified CIE Asset Ready ({selectedTopic.keyLandmarks.length} Landmarks)</span>
                  </div>
                )}
              </div>

              {/* Student Level Selector */}
              <div className="prep-section">
                <div className="section-label">STUDENT LEVEL & PEDAGOGICAL TONE</div>
                <div className="level-buttons-group">
                  {(["beginner", "intermediate", "advanced"] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      className={`level-btn ${studentLevel === lvl ? "active" : ""}`}
                      onClick={() => setStudentLevel(lvl)}
                      disabled={pending}
                    >
                      <span className="lvl-name">{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</span>
                      <small className="lvl-desc">
                        {lvl === "beginner" && "Foundational & intuitive"}
                        {lvl === "intermediate" && "Standard curriculum & flow"}
                        {lvl === "advanced" && "Rigor, formulas & edge cases"}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Objectives Checklist */}
              <div className="prep-section">
                <div className="section-label">LEARNING OBJECTIVES (PRE-CONFIGURED)</div>
                <ul className="objectives-list">
                  {selectedTopic.learningObjectives.map((obj, i) => (
                    <li key={i}>
                      <Check size={14} className="obj-check" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Concepts */}
              <div className="prep-section">
                <div className="section-label">MANDATORY CONCEPTS & LANDMARKS</div>
                <div className="concepts-chips-wrap">
                  {selectedTopic.mandatoryConcepts.map((concept, i) => (
                    <span key={i} className="concept-chip">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="custom-topic-fallback">
              <label htmlFor="custom-topic-input">Or enter a custom topic in this chapter:</label>
              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(null); setError(""); }}
                placeholder="e.g. Myocardial infarction pathophysiology"
                disabled={pending}
              />
            </div>
          )}

          {!connected && (
            <div className="connection-note">
              <Cpu size={16} />
              <span>
                Pre-built asset classes run instantly in guided mode.{" "}
                <button type="button" onClick={onConnect}>
                  Connect AI
                </button>{" "}
                for open-ended autonomous teaching.
              </span>
            </div>
          )}

          {error && <div className="inline-error" role="alert">{error}</div>}

          <div className="curriculum-modal-footer">
            <button type="button" className="secondary-button" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={(!selectedTopic && !customTopic.trim()) || pending}
              data-testid="start-prepared-class-btn"
            >
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={16} />
                  Preparing Live Classroom...
                </>
              ) : (
                <>
                  Launch Live Classroom <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
