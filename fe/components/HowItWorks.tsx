"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StepCube, { type CubeStep } from "./StepCube";

const steps: CubeStep[] = [
  { number: "01", title: "Build your world", subtitle: "START WITH THE BASICS", icon: "📚", accent: "#a78bfa",
    body: "Create subjects for everything you study, from Biology to DSA. Give every learning goal its own little home." },
  { number: "02", title: "Find your focus", subtitle: "TIME TO LOCK IN", icon: "⏳", accent: "#f472b6",
    body: "Choose a subject, start your focus timer, and settle in. Mochi will be right there, keeping you company." },
  { number: "03", title: "Capture the magic", subtitle: "MAKE IT STICK", icon: "📝", accent: "#38bdf8",
    body: "Reflect on what you've learned after every session. Small reflections turn today's effort into tomorrow's knowledge." },
  { number: "04", title: "Grow together", subtitle: "YOUR WORLD, YOUR RULES", icon: "💎", accent: "#fbbf24",
    body: "Earn Focus Energy as you study and unlock cozy decorations and new possibilities for Mochi's world." },
];

export default function HowItWorks() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // auto-advance every 5s; restarts after any manual change
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % steps.length), 5000);
    return () => clearTimeout(id);
  }, [index, paused]);

  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_70%_55%_at_50%_58%,#4c2a8c_0%,#301a62_30%,#180d35_62%,#0b0518_100%)] px-6 pt-6 pb-24 sm:pt-8 sm:pb-28 lg:px-10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-night to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-night to-transparent" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/[0.08] px-5 py-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-100">Your journey with Mochi</span>
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
            Little steps.
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-400 bg-clip-text text-transparent">Magical progress.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink-dim sm:text-lg">
            Show up, focus a little, and watch your world grow with every session.
          </p>
        </motion.div>

        {/* the cube */}
        <div
        className="relative mx-auto mt-10 h-[380px] w-full max-w-3xl touch-pan-y sm:h-[540px]"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <StepCube steps={steps} index={index} onIndexChange={setIndex} />
        </div>
        <p className="mt-2 text-center text-xs text-ink-dim/70">Drag the cube to explore</p>

        {/* the cube is a canvas, so screen readers get the steps as plain text */}
        <ol className="sr-only">
          {steps.map((s) => (
            <li key={s.number}>{`Step ${s.number}: ${s.title}. ${s.body}`}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}