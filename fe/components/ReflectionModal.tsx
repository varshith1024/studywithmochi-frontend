"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STARTERS = ["Today I learned…", "The hardest part was…", "Something that clicked for me…", "Next time I want to…"];
const MAX = 5000;

type Props = {
  open: boolean; subject: string; energy: number;
  onSave: (answer: string) => Promise<void>;
  onSkip: () => void;
  onTyping: (typing: boolean) => void;
};

export default function ReflectionModal({ open, subject, energy, onSave, onSkip, onTyping }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (open) { setText(""); setError(""); setBusy(false); } }, [open]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const typed = (v: string) => {
    setText(v); setError(""); onTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onTyping(false), 1200);
  };
  const addStarter = (s: string) => {
    typed(text.trim() ? `${text.trimEnd()}\n\n${s} ` : `${s} `);
    setTimeout(() => { area.current?.focus(); const n = area.current?.value.length ?? 0; area.current?.setSelectionRange(n, n); }, 0);
  };
  async function save() {
    const answer = text.trim();
    if (!answer) return setError("Write a line or two about what you learned.");
    setBusy(true); setError("");
    try { await onSave(answer); onTyping(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your reflection. Try again."); setBusy(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-center bg-night/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="reflect-title"
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#2a1a45]/95 p-7 shadow-2xl sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-14 place-items-center rounded-2xl bg-pink-400/20 text-2xl" aria-hidden>📝</div>
              <p className="rounded-full bg-purple-400/15 px-4 py-1.5 text-sm font-semibold text-purple-200"><span aria-hidden>♥ </span>+{energy} Focus Energy</p>
            </div>
            <h2 id="reflect-title" className="mt-4 font-display text-2xl font-bold text-white">What did you learn?</h2>
            <p className="mt-1 text-ink-dim">
              You studied <span className="font-semibold text-purple-200">{subject}</span>. Write a few lines so it sticks, and Mochi will remember it.
            </p>

            <div className="mt-5 flex flex-wrap gap-2" aria-label="Sentence starters">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => addStarter(s)} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10">{s}</button>
              ))}
            </div>

                        <textarea
              id="reflection" ref={area} autoFocus value={text} maxLength={MAX} rows={6} disabled={busy}
              onChange={(e) => typed(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); }}
              placeholder="Today I learned…"
              style={{ borderRadius: 6, boxShadow: "none" }}
              className="soft-scroll mt-3 block h-44 w-full resize-none overflow-y-auto border border-white/20 bg-[#1a0f2e] px-4 py-3 leading-relaxed text-white outline-none placeholder:text-white/35 focus:border-purple-300 disabled:opacity-60"
            />
            <p className="mt-1 text-right text-xs text-white/40">{text.length} / {MAX}</p>

            {error && <p role="alert" className="mt-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <div className="mt-5 flex items-center gap-3">
              <button onClick={save} disabled={busy}
                className="flex-1 rounded-2xl bg-gradient-to-b from-[#a78bfa] to-[#7c5ce0] py-4 font-semibold text-white shadow-[0_14px_40px_-10px_rgba(124,92,224,0.8)] transition hover:brightness-110 disabled:opacity-60">
                {busy ? "Saving…" : "Save reflection ✦"}
              </button>
              <button onClick={onSkip} disabled={busy} className="rounded-2xl px-5 py-4 text-sm text-ink-dim transition hover:bg-white/10 hover:text-white disabled:opacity-60">Skip for now</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}