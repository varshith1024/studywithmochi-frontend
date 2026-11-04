"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiError, getMe, type Progress, type StudySession, type Subject } from "@/lib/api";
import WorldSection from "@/components/WorldSection";
import type { Unlock } from "@/lib/unlocks";

type Dash = { todayStudyMinutes: number; weekStudyMinutes: number };
type Day = { date: string | number[]; studyMinutes: number };
type SubStat = { subjectId: number; subjectName: string; studyMinutes: number };
type Refl = { id: number; sessionId: number; answer: string; createdAt: string };
type Sess = StudySession & { actualStudySeconds?: number };
type Data = { progress: Progress; dash: Dash; history: Day[]; bySubject: SubStat[]; reflections: Refl[]; sessions: Sess[]; subjects: Subject[]; unlocks: Unlock[] };
const COLORS = ["#a78bfa", "#f472b6", "#38bdf8", "#fbbf24", "#34d399", "#fb7185"];
const colorFor = (id: number) => COLORS[Math.abs(id) % COLORS.length];

const dur = (m: number) => {
  m = Math.round(m); const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};
const parseDay = (d: string | number[]) => {
  if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
  const [y, m, dd] = d.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, dd);
};
const parseStamp = (s: string) => new Date(s.slice(0, 19));
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

export default function JournalPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<number | "all">("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      await getMe();
            const [progress, dash, history, bySubject, reflections, sessions, subjects, unlocks] = await Promise.all([
        api<Progress>("/api/progress"), api<Dash>("/api/progress/dashboard"), api<Day[]>("/api/progress/dashboard/history"),
        api<SubStat[]>("/api/progress/dashboard/subjects"), api<Refl[]>("/api/reflections"), api<Sess[]>("/api/sessions"), api<Subject[]>("/api/subjects"), api<Unlock[]>("/api/unlocks"),
      ]);
      setData({ progress, dash, history, bySubject, reflections, sessions, subjects, unlocks });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
      setError(msg(e));
    }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  // reflections joined with their session + subject
  const rows = useMemo(() => {
    if (!data) return [];
    const sessionById = new Map(data.sessions.map((s) => [s.id, s]));
    const nameById = new Map(data.subjects.map((s) => [s.id, s.name]));
    return [...data.reflections]
      .sort((a, b) => parseStamp(b.createdAt).getTime() - parseStamp(a.createdAt).getTime())
      .map((r) => {
        const s = sessionById.get(r.sessionId);
        const subjectId = s?.subjectId ?? -1;
        return { r, subjectId, subject: nameById.get(subjectId) ?? "Study session", minutes: s ? Math.round((s.actualStudySeconds ?? s.durationMinutes * 60) / 60) : 0 };
      });
  }, [data]);

  const chips = useMemo(() => {
    const seen = new Map<number, string>();
    rows.forEach((x) => seen.set(x.subjectId, x.subject));
    return [...seen.entries()];
  }, [rows]);

  const shown = rows.filter((x) => (filter === "all" || x.subjectId === filter) && (!q.trim() || x.r.answer.toLowerCase().includes(q.trim().toLowerCase())));

  if (error) return (
    <main className="grid min-h-svh place-items-center bg-night px-6 text-center">
      <div><p className="text-white">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-purple-500 px-5 py-2.5 font-semibold text-white">Try again</button></div>
    </main>
  );
  if (!data) return <main className="grid min-h-svh place-items-center bg-night text-ink-dim"><p className="animate-pulse">✦ Mochi is opening your journal…</p></main>;

  const { progress, dash, history, bySubject } = data;
  const total = progress.totalStudyMinutes;
  const maxDay = Math.max(30, ...history.map((d) => d.studyMinutes));
  const subjectTotal = bySubject.reduce((a, s) => a + s.studyMinutes, 0);
  const today = new Date();

  const stats = [
    { label: "Total study time", value: dur(total), sub: `${(total / 60).toFixed(1)} hours overall`, icon: "⏳", color: "#a78bfa" },
    { label: "This week", value: dur(dash.weekStudyMinutes), sub: "Monday to Sunday", icon: "📅", color: "#f472b6" },
    { label: "Today", value: dur(dash.todayStudyMinutes), sub: dash.todayStudyMinutes ? "Nice work ♥" : "Ready when you are", icon: "☀️", color: "#fbbf24" },
    { label: "Focus Energy", value: String(progress.focusEnergy), sub: "1 per minute studied", icon: "♥", color: "#38bdf8" },
  ];

  return (
    <main className="relative min-h-svh overflow-hidden bg-night px-5 pb-24 pt-8 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[30rem] w-[60rem] max-w-full -translate-x-1/2 rounded-full bg-purple-600/[0.14] blur-[140px]" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink-dim transition hover:bg-white/10 hover:text-white">← Mochi&apos;s room</Link>

        <header className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">Your journey</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">My Study Journal</h1>
          <p className="mt-3 max-w-xl text-ink-dim">Everything you&apos;ve studied and learned, kept safe by Mochi ♥</p>
        </header>

        {/* stat cards */}
        <section aria-label="Study totals" className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full blur-[40px]" style={{ background: `${s.color}33` }} />
              <span aria-hidden className="text-xl">{s.icon}</span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm" style={{ color: s.color }}>{s.sub}</p>
            </motion.div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* weekly chart */}
          <section aria-labelledby="week-h" className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-baseline justify-between">
              <h2 id="week-h" className="font-display text-lg font-semibold text-white">This week</h2>
              <p className="text-sm text-ink-dim">{dur(dash.weekStudyMinutes)} total</p>
            </div>
            <ul className="mt-6 flex h-52 items-end gap-2 sm:gap-3">
              {history.map((d) => {
                const date = parseDay(d.date), isToday = date.toDateString() === today.toDateString(), pct = (d.studyMinutes / maxDay) * 100;
                return (
                  <li key={date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2" aria-label={`${date.toLocaleDateString(undefined, { weekday: "long" })}: ${dur(d.studyMinutes)}`}>
                    <span className="text-[11px] text-white/60">{d.studyMinutes ? dur(d.studyMinutes) : ""}</span>
                    <div className="flex w-full flex-1 items-end">
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: `${Math.max(pct, d.studyMinutes ? 6 : 2)}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                        className="w-full rounded-t-md"
                        style={{ background: d.studyMinutes ? (isToday ? "linear-gradient(#f9a8d4,#a78bfa)" : "linear-gradient(#a78bfa,#6d4fd8)") : "rgba(255,255,255,0.1)" }}
                      />
                    </div>
                    <span className={`text-xs ${isToday ? "font-bold text-pink-300" : "text-white/50"}`}>{date.toLocaleDateString(undefined, { weekday: "short" })}</span>
                  </li>
                );
              })}
            </ul>
            {dash.weekStudyMinutes === 0 && <p className="mt-4 text-center text-sm text-ink-dim">No study time yet this week. Mochi is ready when you are ✦</p>}
          </section>

          {/* by subject */}
          <section aria-labelledby="sub-h" className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 id="sub-h" className="font-display text-lg font-semibold text-white">By subject</h2>
            {bySubject.length === 0 ? (
              <p className="mt-6 text-sm text-ink-dim">Finish a focus session and your subjects will show up here.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {[...bySubject].sort((a, b) => b.studyMinutes - a.studyMinutes).map((s) => (
                  <li key={s.subjectId}>
                    <div className="flex items-baseline justify-between text-sm"><span className="truncate pr-3 font-medium text-white">{s.subjectName}</span><span className="shrink-0 text-white/60">{dur(s.studyMinutes)}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${subjectTotal ? (s.studyMinutes / subjectTotal) * 100 : 0}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: colorFor(s.subjectId) }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <WorldSection energy={progress.focusEnergy} unlocks={data.unlocks} />

        {/* reflections */}
        <section aria-labelledby="ref-h" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="ref-h" className="font-display text-2xl font-semibold text-white">What I&apos;ve learned</h2>
              <p className="mt-1 text-sm text-ink-dim">{rows.length} {rows.length === 1 ? "reflection" : "reflections"} saved</p>
            </div>
            {rows.length > 0 && (
              <input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes…" aria-label="Search reflections" style={{ borderRadius: 8 }}
                className="w-full border border-white/15 bg-[#1a0f2e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-purple-300 sm:w-64"
              />
            )}
          </div>

          {chips.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by subject">
              {[["all", "All"] as const, ...chips.map(([id, name]) => [id, name] as const)].map(([id, name]) => (
                <button key={String(id)} onClick={() => setFilter(id)} aria-pressed={filter === id}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${filter === id ? "border-purple-300 bg-purple-400/25 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10"}`}>{name}</button>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center">
              <p className="text-3xl" aria-hidden>📝</p>
              <p className="mt-3 font-display text-lg font-semibold text-white">No reflections yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-dim">Finish a focus session and write what you learned. Mochi will keep it here for you ♥</p>
              <Link href="/dashboard" className="mt-5 inline-block rounded-full bg-gradient-to-b from-[#c084fc] to-[#9333ea] px-6 py-3 text-sm font-semibold text-white">Start studying</Link>
            </div>
          ) : shown.length === 0 ? (
            <p className="mt-8 text-center text-ink-dim">Nothing matches that. Try another word or subject.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {shown.map((x) => <li key={x.r.id}><ReflectionCard r={x.r} subject={x.subject} color={colorFor(x.subjectId)} minutes={x.minutes} /></li>)}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function ReflectionCard({ r, subject, color, minutes }: { r: Refl; subject: string; color: string; minutes: number }) {
  const [open, setOpen] = useState(false);
  const long = r.answer.length > 240;
  const d = parseStamp(r.createdAt);
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 pl-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full px-3 py-1 font-semibold" style={{ background: `${color}26`, color }}>{subject}</span>
        {minutes > 0 && <span className="text-white/50">{dur(minutes)} session</span>}
        <time dateTime={r.createdAt} className="ml-auto text-white/45">
          {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </time>
      </div>
      <p className={`mt-3 whitespace-pre-wrap leading-7 text-white/85 ${long && !open ? "line-clamp-4" : ""}`}>{r.answer}</p>
      {long && <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-semibold text-purple-300 hover:underline">{open ? "Show less" : "Read more"}</button>}
    </article>
  );
}