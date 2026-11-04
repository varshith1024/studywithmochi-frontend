"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LivingRoomScene, { type Activity, type Place, type TvState } from "@/components/LivingRoomScene";
import StudyModal from "@/components/StudyModal";
import ReflectionModal from "@/components/ReflectionModal";
import { api, ApiError, getMe, logout, type Progress, type StudySession, type Subject, type User } from "@/lib/api";
import { UNLOCK_DEFS, unlockDef, type Unlock, type UnlockDef } from "@/lib/unlocks";

type Phase = "living" | "walking" | "setup" | "studying" | "celebrating" | "reflecting" | "returning";
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [energy, setEnergy] = useState(0);
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ def: UnlockDef; more: number } | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<Phase>("living");
  const [gain, setGain] = useState(0);
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState("");

  const endAt = useRef(0), finishing = useRef(false), busy = useRef(false);
  const sessionRef = useRef<StudySession | null>(null), energyRef = useRef(0), unlocksRef = useRef<string[]>([]);
  sessionRef.current = session; energyRef.current = energy; unlocksRef.current = unlocks;

  const apply = useCallback((s: StudySession) => { setSession(s); setRemaining(s.remainingSeconds); endAt.current = Date.now() + s.remainingSeconds * 1000; }, []);

  // load everything once; send logged-out visitors to /login
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        await api("/api/unlocks/refresh", { method: "POST" }).catch(() => undefined); // catches any unlock that was missed
        const [subs, prog, active, ul] = await Promise.all([
          api<Subject[]>("/api/subjects"), api<Progress>("/api/progress"), api<StudySession | undefined>("/api/sessions/active"), api<Unlock[]>("/api/unlocks"),
        ]);
        if (!alive) return;
        setUser(me); setSubjects(subs); setEnergy(prog.focusEnergy); setUnlocks(ul.map((u) => u.unlockType));
        if (active) { apply(active); setPhase("studying"); }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
        if (alive) setToast(msg(e));
      }
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(""), 5000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(null), 9000); return () => clearTimeout(id); }, [notice]);

  // timer hit zero: complete the session, celebrate (and show any new unlock), then ask what was learned
  const finish = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || finishing.current) return;
    finishing.current = true;
    try {
      await api(`/api/sessions/${s.id}/complete`, { method: "POST" });
      const prog = await api<Progress>("/api/progress");
      setGain(Math.max(0, prog.focusEnergy - energyRef.current)); setEnergy(prog.focusEnergy);
      try {
        const ul = (await api<Unlock[]>("/api/unlocks")).map((u) => u.unlockType);
        const fresh = ul.filter((t) => !unlocksRef.current.includes(t));
        setUnlocks(ul);
        const def = fresh.length ? unlockDef(fresh[fresh.length - 1]) : undefined;
        if (def) setNotice({ def, more: fresh.length - 1 });
      } catch { /* unlocks are a bonus, never block the session result */ }
      setPhase("celebrating");
      setTimeout(() => { finishing.current = false; setPhase((p) => (p === "celebrating" ? "reflecting" : p)); }, 4500);
    } catch (e) { setToast(msg(e)); setTimeout(() => { finishing.current = false; }, 4000); }
  }, []);

  // countdown (the server sends remainingSeconds, we count down from it)
  useEffect(() => {
    if (phase !== "studying" || !session || session.status !== "RUNNING") return;
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) finish();
    }, 250);
    return () => clearInterval(id);
  }, [phase, session, finish]);

  const guard = async (fn: () => Promise<void>) => {
    if (busy.current) return; busy.current = true;
    try { await fn(); } catch (e) { setToast(msg(e)); } finally { busy.current = false; }
  };

  const tvAction = (a: "toggle" | "stop") => guard(async () => {
    const s = sessionRef.current; if (!s || phase !== "studying") return;
    if (a === "toggle") apply(await api<StudySession>(`/api/sessions/${s.id}/${s.status === "RUNNING" ? "pause" : "resume"}`, { method: "POST" }));
    else {
      await api(`/api/sessions/${s.id}/stop`, { method: "POST" });
      setSession(null); setPhase("returning"); setToast("Session stopped. Focus Energy is earned when you finish a session.");
    }
  });

  const startSession = async (subjectId: number, minutes: number) => {
    apply(await api<StudySession>("/api/sessions", { method: "POST", body: JSON.stringify({ subjectId, durationMinutes: minutes }) }));
    setPhase("studying");
  };
  const addSubject = async (name: string) => {
    const s = await api<Subject>("/api/subjects", { method: "POST", body: JSON.stringify({ name }) });
    setSubjects((p) => [...p, s]); return s;
  };

  // reflection: save (POST /api/reflections) or skip, then Mochi walks back to the TV
  const leaveDesk = (note: string) => { setTyping(false); setSession(null); setPhase("returning"); if (note) setToast(note); };
  const saveReflection = async (answer: string) => {
    const s = sessionRef.current; if (!s) return;
    await api("/api/reflections", { method: "POST", body: JSON.stringify({ sessionId: s.id, answer }) });
    leaveDesk("Reflection saved. Mochi will remember it ♥");
  };

  const onArrive = (p: Place) => setPhase((c) => (p === "desk" ? (c === "walking" ? "setup" : c) : c === "returning" ? "living" : c));

  const subjectName = subjects.find((s) => s.id === session?.subjectId)?.name ?? "Study time";
  const next = UNLOCK_DEFS.find((d) => !unlocks.includes(d.type));
  const at: Place = phase === "living" || phase === "returning" ? "couch" : "desk";
  const activity: Activity =
    phase === "setup" ? "idle"
    : phase === "studying" ? (session?.status === "PAUSED" ? "rest" : "focus")
    : phase === "celebrating" ? "cheer"
    : phase === "reflecting" ? (typing ? "focus" : "idle")
    : "watch";
  const tv: TvState =
    phase === "studying" && session ? { mode: "study", subject: subjectName, remaining, total: session.durationMinutes * 60, paused: session.status === "PAUSED" }
    : phase === "celebrating" || phase === "reflecting" ? { mode: "done", subject: subjectName, energy: gain } : { mode: "idle" };

  return (
    <main className="relative h-svh min-h-[560px] overflow-hidden bg-night">
      {!ready ? (
        <div className="grid h-full place-items-center text-ink-dim"><p className="animate-pulse">✦ Mochi is getting your room ready…</p></div>
      ) : (
        <>
          <LivingRoomScene at={at} activity={activity} tv={tv} unlocked={unlocks} onArrive={onArrive} onTvAction={tvAction} />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-6">
            <div className="pointer-events-auto flex flex-col items-start gap-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-night/60 px-4 py-3 backdrop-blur">
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-mochi to-mochi-deep text-white" aria-hidden>✦</span>
                <div><p className="font-display font-semibold leading-tight text-white">StudyWithMochi</p><p className="text-xs text-ink-dim">{user ? `Hi, ${user.name.split(" ")[0]} ♥` : "Your cozy little world"}</p></div>
              </div>
              <Link href="/journal" className="flex items-center gap-2 rounded-full border border-white/10 bg-night/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"><span aria-hidden>📔</span> My Journal</Link>
              <button onClick={async () => { try { await logout(); } catch {} router.push("/"); }} className="rounded-full px-3 py-1 text-xs text-ink-dim transition hover:bg-white/10 hover:text-white">Log out</button>
            </div>

            <div className="pointer-events-auto flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-night/60 px-5 py-3 backdrop-blur" aria-label={`${energy} Focus Energy`}>
                <span className="text-purple-300" aria-hidden>♥</span><span className="font-semibold text-white">{energy}</span><span className="text-sm text-ink-dim">Focus Energy</span>
              </div>
              {next && (
                <Link href="/journal" className="w-56 rounded-2xl border border-white/10 bg-night/60 px-4 py-3 backdrop-blur transition hover:bg-white/10" aria-label={`${next.need - energy > 0 ? next.need - energy : 0} Focus Energy until ${next.name}`}>
                  <p className="flex items-center justify-between text-xs text-ink-dim"><span>Next unlock</span><span>{Math.min(energy, next.need)}/{next.need}</span></p>
                  <p className="mt-1 text-sm font-semibold text-white"><span aria-hidden>{next.icon}</span> {next.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (energy / next.need) * 100)}%`, background: next.color }} /></div>
                </Link>
              )}
            </div>
          </div>

          {phase === "living" && (
            <button onClick={() => setPhase("walking")} className="absolute bottom-6 right-4 z-10 flex items-center gap-2 rounded-full bg-gradient-to-b from-[#c084fc] to-[#9333ea] px-7 py-4 font-semibold text-white shadow-[0_0_40px_rgba(168,85,247,0.55)] transition hover:scale-105 sm:bottom-8 sm:right-8">
              <span aria-hidden>📖</span> Start Studying <span aria-hidden>✦</span>
            </button>
          )}

          {/* keyboard / screen-reader controls for the buttons drawn on the TV */}
          {phase === "studying" && session && (
            <div className="absolute bottom-4 left-4 z-10 flex gap-2">
              <button onClick={() => tvAction("toggle")} className="sr-only focus:not-sr-only focus:rounded-full focus:bg-purple-500 focus:px-5 focus:py-2 focus:text-white">{session.status === "RUNNING" ? "Pause session" : "Resume session"}</button>
              <button onClick={() => tvAction("stop")} className="sr-only focus:not-sr-only focus:rounded-full focus:bg-rose-600 focus:px-5 focus:py-2 focus:text-white">Stop session</button>
            </div>
          )}

          {notice && (
            <div role="status" className="absolute left-1/2 top-24 z-50 w-[min(92vw,26rem)] -translate-x-1/2 overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur" style={{ borderColor: `${notice.def.color}88`, background: "rgba(34,20,60,0.95)" }}>
              <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full blur-[40px]" style={{ background: `${notice.def.color}55` }} />
              <div className="relative flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: `${notice.def.color}26` }} aria-hidden>{notice.def.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: notice.def.color }}>✦ New unlock!</p>
                  <p className="font-display text-lg font-semibold text-white">{notice.def.name}</p>
                  <p className="text-sm text-ink-dim">{notice.def.blurb}{notice.more > 0 ? ` (+${notice.more} more)` : ""}</p>
                </div>
              </div>
            </div>
          )}

          {toast && <div role="status" className={`absolute left-1/2 z-30 w-[min(90vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#2a1a45]/95 px-5 py-3 text-center text-sm text-white shadow-xl ${notice ? "top-48" : "top-24"}`}>{toast}</div>}

          <StudyModal open={phase === "setup"} subjects={subjects} onClose={() => setPhase("returning")} onAddSubject={addSubject} onStart={startSession} />
          <ReflectionModal open={phase === "reflecting"} subject={subjectName} energy={gain} onSave={saveReflection} onSkip={() => leaveDesk("")} onTyping={setTyping} />
        </>
      )}
    </main>
  );
}