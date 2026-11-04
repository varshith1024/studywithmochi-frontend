"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MochiAuthScene, { type Mood } from "./MochiAuthScene";
import { api, ApiError, type User } from "@/lib/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const short = (s: string) => (s.length > 22 ? s.slice(0, 22) + "…" : s);

function Field({ label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: string }) {
  return (
    <label className="block">
      <span className="auth-label">{label}</span>
      <span className="relative block">
        <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-70">{icon}</span>
        <input
          {...props}
          className="auth-input w-full border border-white/10 bg-[#1d1236] text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-purple-300/70 focus:bg-[#22153f] focus:ring-4 focus:ring-purple-400/15 disabled:opacity-60"
        />
      </span>
    </label>
  );
}

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isReg = mode === "register";
  const router = useRouter();
  const greeting = isReg ? "Hiii! I'm Mochi! Let's be study buddies 👋" : "Hiii! I missed you! 👋";

  const [mood, setMood] = useState<Mood>("greet");
  const [speech, setSpeech] = useState(greeting);
  const [pulse, setPulse] = useState(0);
  const [look, setLook] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const done = useRef(false);

  // Mochi waves and dances for a few seconds, then settles
  useEffect(() => {
    const id = setTimeout(() => setMood((m) => (m === "greet" ? "idle" : m)), 4500);
    return () => clearTimeout(id);
  }, []);

  const say = (m: Mood, text: string) => { setMood(m); setSpeech(text); };
  const typed = (len: number) => { setPulse((p) => p + 1); setLook(Math.min(len / 24, 1) * 2 - 1); setError(""); };
  const first = (s: string) => s.trim().split(" ")[0];

  const onName = (v: string) => {
    setName(v); typed(v.length);
    say("listen", v.trim() ? `Nice to meet you, ${first(v)}! 💜` : "What should I call you? 😊");
  };
  const onEmail = (v: string) => {
    setEmail(v); typed(v.length);
    say("listen", !v.trim() ? "Where should I send the magic? ✉️" : EMAIL.test(v) ? "Perfect, that looks right! ✨" : `Typing ${short(v)}… ✉️`);
  };
  const onPassword = (v: string) => {
    setPassword(v); setError("");
    say("shy", v ? "My eyes are closed! 🙈" : "I won't peek, promise! 🙈");
  };

  const fail = (msg: string) => { setError(msg); say("sad", `Oh no… ${msg} 😢`); };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || done.current) return;
    if (isReg && !name.trim()) return fail("I need a name to call you!");
    if (!EMAIL.test(email)) return fail("that email looks a little off");
    if (!password) return fail("don't forget your password");
    if (isReg && password.length < 8) return fail("passwords need at least 8 characters");

    setError(""); setLoading(true); say("listen", "Checking… 🔍");
    try {
      if (isReg) await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: name.trim(), email, password }) });
      const user = await api<User | undefined>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      done.current = true;
      const who = first(user?.name ?? name);
      say("happy", who ? `Yay! Welcome, ${who}! 🎉` : "Yay! Welcome! 🎉");
      setTimeout(() => router.push("/dashboard"), 2200);
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 401 ? "that email or password doesn't look right" : err instanceof Error ? err.message : "something went wrong";
      setLoading(false);
      fail(msg);
    }
  }

  return (
    <main className="auth-shell relative bg-[#1e1233]">
      <div aria-hidden className="pointer-events-none absolute left-[22%] top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[130px]" />

      {/* Mochi side (top in portrait, left in landscape) */}
      <section className="auth-scene">
        <Link href="/" className="absolute left-3 top-3 z-20 flex items-center gap-2 font-display text-sm font-semibold text-white sm:left-6 sm:top-5 sm:gap-3 sm:text-lg">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-mochi to-mochi-deep shadow-[0_0_24px_rgba(168,85,247,0.6)] sm:size-10" aria-hidden>✦</span>
          StudyWithMochi
        </Link>
        <MochiAuthScene mood={mood} look={look} pulse={pulse} speech={speech} />

        <div className="pointer-events-none absolute left-[4%] top-[19%] z-10 max-w-[46%] sm:max-w-[32%] lg:max-w-[28%]" role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={speech}
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl bg-[#fffaf5] px-3 py-1.5 text-center font-display text-[10px] font-semibold leading-snug text-[#3b2a5e] shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)] sm:px-4 sm:py-2 sm:text-xs lg:text-[13px]"
            >
              {speech}
              <span className="absolute -bottom-2.5 left-5 size-2 rounded-full bg-[#fffaf5] sm:-bottom-3 sm:size-2.5" />
              <span className="absolute -bottom-4 left-3 size-1.5 rounded-full bg-[#fffaf5] sm:-bottom-5 sm:size-2" />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Form side (below in portrait, right in landscape) */}
      <section className="auth-formwrap">
        <form
          onSubmit={onSubmit} noValidate
          className="auth-form border border-white/10 bg-gradient-to-b from-[#33205a]/85 to-[#241540]/85 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur"
        >
          <p className="auth-eyebrow font-semibold uppercase tracking-[0.3em] text-purple-300">{isReg ? "Join the cozy club" : "Welcome back"}</p>
          <h1 className="auth-title font-display font-bold text-white">{isReg ? "Create your StudyWithMochi world" : "Login to StudyWithMochi"}</h1>
          <p className="auth-sub text-ink-dim">{isReg ? "Mochi can't wait to study with you." : "Your little study world has been waiting for you."}</p>

          <div className="auth-fields">
            {isReg && (
              <Field label="Name" icon="👤" autoComplete="name" maxLength={100} placeholder="What should Mochi call you?" value={name} disabled={loading}
                onChange={(e) => onName(e.target.value)}
                onFocus={() => !name && say("listen", "What should I call you? 😊")} />
            )}
            <Field label="Email" icon="✉️" type="email" autoComplete="email" placeholder="you@example.com" value={email} disabled={loading}
              onChange={(e) => onEmail(e.target.value)}
              onFocus={() => say("listen", email ? `Typing ${short(email)}… ✉️` : "Where should I send the magic? ✉️")} />
            <Field label="Password" icon="🔒" type="password" autoComplete={isReg ? "new-password" : "current-password"} maxLength={100}
              placeholder={isReg ? "At least 8 characters" : "Enter your password"} value={password} disabled={loading}
              onChange={(e) => onPassword(e.target.value)}
              onFocus={() => say("shy", "I won't peek, promise! 🙈")}
              onBlur={() => !loading && !done.current && mood === "shy" && say("listen", "Thanks for trusting me 💜")} />
          </div>

          {error && <p role="alert" className="auth-error rounded-xl border border-red-300/20 bg-red-500/10 text-red-200">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="auth-btn w-full bg-gradient-to-b from-[#c99bff] to-[#a35cf0] font-semibold text-[#1e1233] shadow-[0_14px_40px_-10px_rgba(168,85,247,0.75),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? "One moment… ✨" : isReg ? "Create My World ✨" : "Enter My World ✨"}
          </button>

          <p className="auth-alt text-center text-ink-dim">
            {isReg ? "Already have an account? " : "Don't have an account? "}
            <Link href={isReg ? "/login" : "/register"} className="font-semibold text-purple-300 hover:underline">{isReg ? "Log in" : "Create one"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}