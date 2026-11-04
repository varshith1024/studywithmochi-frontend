"use client";
import Link from "next/link";
import { useState } from "react";
import MochiScene from "./MochiScene";

export default function Hero() {
  const [energy, setEnergy] = useState(0);

  return (
    <section className="relative h-svh min-h-[470px] overflow-hidden bg-night sm:min-h-[500px]">
      <MochiScene onMochiClick={() => setEnergy((e) => e + 1)} />

      {/* readability overlays */}
      <div className="pointer-events-none absolute inset-0 bg-night/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night/85 from-0% via-night/55 via-35% to-transparent to-65% max-lg:bg-gradient-to-b max-lg:from-night/90 max-lg:via-night/55 max-lg:via-40% max-lg:to-transparent max-lg:to-65%" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-night/90 to-transparent" />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pt-16 sm:px-6 lg:px-10 max-lg:justify-start max-lg:pt-24 sm:max-lg:pt-28 [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:pt-14">
        <p className="hero-in mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-mochi sm:mb-5 sm:text-xs sm:tracking-[0.25em]">
          Your cozy study companion
        </p>
        <h1 className="hero-in hero-in-2 font-display text-[clamp(2.4rem,11.5vw,3.1rem)] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl [@media(max-height:500px)]:!text-4xl">
          Study a little
          <br />
          Grow with{" "}
          <span className="bg-gradient-to-r from-mochi to-blush bg-clip-text text-transparent">Mochi</span>
        </h1>
        <p className="hero-in hero-in-3 mt-4 max-w-md text-base leading-relaxed text-ink-dim sm:mt-6 sm:text-lg [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-sm">
          Build your study habit, earn Focus Energy, and grow a beautiful world together with Mochi.
        </p>
        <div className="hero-in hero-in-3 pointer-events-auto mt-6 flex flex-wrap gap-3 sm:mt-9 [@media(max-height:500px)]:mt-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-b from-mochi to-mochi-deep px-7 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(168,85,247,0.55)] transition hover:brightness-110 sm:px-8 sm:py-3.5"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:px-8 sm:py-3.5"
          >
            See how it works
          </a>
        </div>
      </div>

      <p className="absolute bottom-4 right-5 z-10 flex items-center gap-2 text-xs text-ink-dim" aria-live="polite">
        <span className="size-1.5 rounded-full bg-amber-300" aria-hidden />
        {energy === 0 ? (
          <>
            <span className="[@media(hover:none)]:hidden">Move your mouse · click Mochi</span>
            <span className="hidden [@media(hover:none)]:inline">Tap Mochi</span>
          </>
        ) : (
          `+${energy} Focus Energy`
        )}
      </p>
    </section>
  );
}