"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe, type User } from "@/lib/api";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10" aria-label="Main">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-semibold text-white">
          <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-mochi to-mochi-deep shadow-[0_0_24px_rgba(168,85,247,0.6)]" aria-hidden>✦</span>
          StudyWithMochi
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium text-ink-dim sm:gap-3">
          <a href="#how-it-works" className="hidden rounded-full px-4 py-2 transition hover:text-white sm:block">How it works</a>
          <a href="#features" className="hidden rounded-full px-4 py-2 transition hover:text-white sm:block">Features</a>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            {user ? "Dashboard" : "Log in"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
