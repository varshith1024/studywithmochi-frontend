"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Subject } from "@/lib/api";

const PRESETS = [15, 25, 45, 60];

type Props = {
  open: boolean; subjects: Subject[]; onClose: () => void;
  onAddSubject: (name: string) => Promise<Subject>;
  onStart: (subjectId: number, minutes: number) => Promise<void>;
};

export default function StudyModal({ open, subjects, onClose, onAddSubject, onStart }: Props) {
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setError(""); setBusy(false); setTimeout(() => dialog.current?.focus(), 50); } }, [open]);
  useEffect(() => { if (subjectId === "" && subjects.length) setSubjectId(subjects[0].id); }, [subjects, subjectId]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, busy, onClose]);

  const mins = custom ? Number(customVal) : minutes;
  const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

  async function saveSubject() {
    const name = newName.trim();
    if (!name) return setError("Give your subject a name.");
    setBusy(true); setError("");
    try { const s = await onAddSubject(name); setSubjectId(s.id); setAdding(false); setNewName(""); }
    catch (e) { setError(message(e)); }
    setBusy(false);
  }
  async function start() {
    if (subjectId === "") return setError("Pick or add a subject first.");
    if (!Number.isInteger(mins) || mins < 1 || mins > 1440) return setError("Choose between 1 and 1440 minutes.");
    setBusy(true); setError("");
    try { await onStart(subjectId, mins); } catch (e) { setError(message(e)); setBusy(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-center bg-night/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="focus-title"
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#2a1a45]/95 p-7 shadow-2xl outline-none sm:p-8"
          >
            <button onClick={onClose} disabled={busy} aria-label="Close" className="absolute right-6 top-6 grid size-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">✕</button>
            <div className="grid size-14 place-items-center rounded-2xl bg-purple-400/20 text-2xl" aria-hidden>📖</div>
            <h2 id="focus-title" className="mt-4 font-display text-2xl font-bold text-white">Ready to focus?</h2>
            <p className="mt-1 text-ink-dim">Choose your subject and study time.</p>

            <label htmlFor="subject" className="mt-6 block text-sm font-semibold text-white">Your subject</label>
            <select
              id="subject" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))} disabled={!subjects.length || busy}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#1a0f2e] px-4 py-3.5 text-white outline-none focus:border-purple-300/60"
            >
              {!subjects.length && <option value="">No subjects yet</option>}
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {adding ? (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus value={newName} maxLength={100} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveSubject())}
                  placeholder="e.g. Biology, DSA…" aria-label="New subject name"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#1a0f2e] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-purple-300/60"
                />
                <button onClick={saveSubject} disabled={busy} className="rounded-2xl bg-purple-400 px-4 font-semibold text-[#1e1233] disabled:opacity-60">Add</button>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="mt-3 w-full rounded-2xl border border-dashed border-purple-300/40 py-3 font-semibold text-purple-200 transition hover:bg-purple-400/10">＋ Add New Subject</button>
            )}

            <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-white"><span aria-hidden>🕒</span> Study duration</p>
            <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Study duration">
              {PRESETS.map((m) => (
                <button key={m} onClick={() => { setMinutes(m); setCustom(false); }} aria-pressed={!custom && minutes === m}
                  className={`rounded-xl border py-3 font-semibold transition ${!custom && minutes === m ? "border-purple-300 bg-purple-400/25 text-white" : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"}`}>{m}m</button>
              ))}
            </div>
            {custom ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-purple-300/40 bg-[#1a0f2e] px-4 py-2.5">
                <input autoFocus type="number" min={1} max={1440} value={customVal} onChange={(e) => setCustomVal(e.target.value)} placeholder="Minutes" aria-label="Custom minutes"
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35" />
                <span className="text-white/60">min</span>
              </div>
            ) : (
              <button onClick={() => setCustom(true)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-white/80 transition hover:bg-white/10">Custom duration</button>
            )}

            {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <button onClick={start} disabled={busy}
              className="mt-6 w-full rounded-2xl bg-gradient-to-b from-[#a78bfa] to-[#7c5ce0] py-4 font-semibold text-white shadow-[0_14px_40px_-10px_rgba(124,92,224,0.8)] transition hover:brightness-110 disabled:opacity-60">
              {busy ? "One moment…" : "▶  Start Session"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}