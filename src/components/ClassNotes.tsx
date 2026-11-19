"use client";

import { ArrowRight, BookOpen, Lightbulb, ListChecks } from "lucide-react";
import type { RecordedClass } from "@/lib/recorded-classes";
import { Modal } from "./Dialogs";

export default function ClassNotes({ recording, onClose }: { recording: RecordedClass; onClose: () => void }) {
  const { notes, mistake, practice } = recording.notes;
  return <Modal title="Study notes" subtitle={recording.title} icon={<BookOpen size={23}/>} className="class-notes-modal" onClose={onClose}>
    <div className="class-notes-intro"><span>TAKE IT AT YOUR OWN PACE</span><p>{recording.summary} These notes go beyond the two-minute class.</p></div>
    <ol className="class-notes-list">{notes.map((note, i) => <li key={note.title}>
      <span className="class-note-number">{String(i + 1).padStart(2, "0")}</span><div><h3>{note.title}</h3><p>{note.text}</p><div className="class-note-equation">{note.equation}</div></div>
    </li>)}</ol>
    <aside className="class-mistake"><Lightbulb size={17}/><div><strong>A common mistake</strong><p>{mistake}</p></div></aside>
    <div className="class-note-practice"><h3><ListChecks size={17}/>Try another</h3><p>{practice.question}</p><details><summary>Show the worked answer <ArrowRight size={14}/></summary><p>{practice.answer}</p></details></div>
  </Modal>;
}
