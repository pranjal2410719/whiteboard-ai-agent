export function Brand() {
  return <div className="brand"><svg width="37" height="37" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7.4 7.8 30 5.7c2.4-.2 4.1 1.5 3.9 3.8l-1.6 17.7c-.2 2-1.5 3.3-3.5 3.4l-14 .9-7 5 .3-5.3-3.1.1c-1.7.1-2.9-1.3-2.7-3.1l2.1-17.9c.2-1.6 1.3-2.4 3-2.5Z" fill="#a7cbb2"/><path d="m10.3 4.6 23.1-.5c2.2 0 3.4 1.5 3 3.8l-3.3 17.9c-.4 1.9-1.7 3.1-3.6 3.1l-13.6.2-7.4 4.5.9-5.1-3.3-.1c-1.5 0-2.6-1.5-2.2-3L7.2 7.4c.3-1.7 1.4-2.7 3.1-2.8Z" fill="#357657"/><path d="m13 12.1 13.8-.4m-15 6.6 10.1-.2" stroke="#f2f8ed" strokeWidth="3" strokeLinecap="round"/></svg><span>Chalkly</span></div>;
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
