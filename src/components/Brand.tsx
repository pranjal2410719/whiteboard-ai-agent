export function Brand() {
  return (
    <div className="brand" title="Qrie AI Classroom">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="34" height="34" rx="10" fill="#357657" />
        <path d="M14 12C10.5 12 8 15 8 20C8 25 10.5 28 14 28C17 28 19.5 25.5 19.8 21.5H14.5V18.5H23C23.2 25.5 19 31 13 31C6.5 31 3 26 3 20C3 13.5 7 9 14 9C18.5 9 21.8 11.5 23 15.5L19.8 16.8C18.8 13.8 16.5 12 14 12Z" fill="#ffffff" />
        <path d="M22 22L29 29M29 22L22 29" stroke="#9ee2b8" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
      <div className="brand-copy">
        <span className="brand-name">Qrie</span>
        <span className="brand-tag">AI Classroom</span>
      </div>
    </div>
  );
}
export function TutorAvatar({ small = false }: { small?: boolean }) {
  return <span className={`tutor-avatar${small ? " small" : ""}`}><svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="m8 12 18-1.3 1.5 15.1-20.3.6L8 12Z" fill="#f6faf0" stroke="#37724d" strokeWidth="1.8" strokeLinejoin="round"/><path d="m10.5 27 .4 3 5-3.4M17.5 11.2l-.6-3.5" stroke="#37724d" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16.5" cy="6.4" r="1.8" fill="#72a879"/><path d="m12 16.8.2 1.6m9.1-2 .2 1.6M14.7 21.6q2.7 2.4 5.3-.4" stroke="#37724d" strokeWidth="2" strokeLinecap="round"/><path d="m29.1 5.2.8 2.6 2.5.9-2.5.9-.8 2.5-.8-2.5-2.5-.9 2.5-.9.8-2.6Z" fill="#70a277"/></svg></span>;
}
export function TipDoodle() {
  return <svg className="tip-doodle" viewBox="0 0 75 60" fill="none" aria-hidden="true"><path d="M26 54c-8-13 2-28 12-23 11 6-3 19-11 8C15 23 32 9 52 18c8 4 13 0 16-8" stroke="#abc7a6" strokeWidth="1.6" strokeLinecap="round"/><path d="m60 12 9-5 1 11" stroke="#abc7a6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function GeminiMark({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c.7 4.9 4.1 8.3 9 9-4.9.7-8.3 4.1-9 9-.7-4.9-4.1-8.3-9-9 4.9-.7 8.3-4.1 9-9Z" fill="url(#gemini-gradient)"/><defs><linearGradient id="gemini-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#5b8def"/><stop offset=".5" stopColor="#8a72e0"/><stop offset="1" stopColor="#e08bb0"/></linearGradient></defs></svg>;
}
