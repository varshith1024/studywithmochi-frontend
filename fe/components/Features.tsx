"use client";

import { motion } from "framer-motion";

type Kind = "focus" | "progress" | "reflect" | "world";

const cards: { numeral: string; title: string; description: string; color: string; kind: Kind; rot: number; y: number }[] = [
  {
    numeral: "I",
    title: "Focus sessions",
    description: "Find your flow, focus on one subject, and let every minute bring you closer to your goals.",
    color: "#B99AFF", kind: "focus", rot: -9, y: 30,
  },
  {
    numeral: "II",
    title: "Daily & weekly progress",
    description: "Watch your study minutes grow and celebrate the little wins that make a big difference.",
    color: "#FF9ED7", kind: "progress", rot: -3, y: 6,
  },
  {
    numeral: "III",
    title: "Learning reflections",
    description: "Capture what you learned and revisit the knowledge you've collected along your journey.",
    color: "#9BCBFF", kind: "reflect", rot: 3, y: 6,
  },
  {
    numeral: "IV",
    title: "Mochi's growing world",
    description: "Earn Focus Energy, unlock adorable decorations, and create a magical home for Mochi.",
    color: "#FFD59A", kind: "world", rot: 9, y: 30,
  },
];

// Mochi theme palette (replaces the old gold)
const LINE = "#c4a8ff";   // borders, ticks, small details
const SOFT = "#f5d0fe";   // highlights, stars, text accents

function Star({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return <path d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28}Z`} fill={color} />;
}

function Art({ kind, color }: { kind: Kind; color: string }) {
  return (
    <svg viewBox="0 0 190 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`glow-${kind}`} cx="50%" cy="64%" r="62%">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="190" height="200" fill={`url(#glow-${kind})`} />
      {[[22, 20], [150, 28], [72, 10], [172, 74], [14, 84], [122, 14], [40, 52]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill="#fff" opacity="0.8" />
      ))}

      {kind === "focus" && (
        <g transform="translate(95 112)">
          <circle r="48" fill="#0d0818" stroke={color} strokeWidth="3" />
          <circle r="40" fill="none" stroke={LINE} strokeOpacity="0.6" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} y1="-34" y2={i % 3 === 0 ? "-27" : "-30"} stroke={LINE} strokeWidth="2" transform={`rotate(${i * 30})`} />
          ))}
          <path d="M0 0 V-27 M0 0 L19 10" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle r="4.5" fill={SOFT} />
        </g>
      )}

      {kind === "progress" && (
        <g>
          <line x1="26" y1="164" x2="164" y2="164" stroke={LINE} strokeOpacity="0.6" strokeWidth="2" />
          {[[38, 34], [68, 56], [98, 80], [128, 108]].map(([x, h], i) => (
            <rect key={i} x={x} y={164 - h} width="20" height={h} rx="5" fill={color} opacity={0.35 + i * 0.2} />
          ))}
          <polyline points="48,124 78,102 108,78 138,50" fill="none" stroke={SOFT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Star x={140} y={44} s={13} color={SOFT} />
        </g>
      )}

      {kind === "reflect" && (
        <g>
          <path d="M95 158 C75 146 50 146 28 154 V92 C50 84 75 84 95 96Z" fill="#1a1230" stroke={LINE} strokeWidth="2" />
          <path d="M95 158 C115 146 140 146 162 154 V92 C140 84 115 84 95 96Z" fill="#241a42" stroke={LINE} strokeWidth="2" />
          {[104, 114, 124].map((y) => (
            <g key={y}>
              <line x1="42" y1={y} x2="84" y2={y + 6} stroke={color} strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="106" y1={y + 6} x2="148" y2={y} stroke={color} strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ))}
          <Star x={95} y={58} s={17} color={SOFT} />
          <Star x={128} y={42} s={6} color={color} />
          <Star x={62} y={46} s={5} color={color} />
        </g>
      )}

      {kind === "world" && (
        <g>
          <path d="M146 30 a16 16 0 1 0 12 26 a13 13 0 1 1 -12 -26z" fill="#fbcfe8" />
          <path d="M0 200 V152 Q95 112 190 152 V200Z" fill="#1a1230" stroke={LINE} strokeOpacity="0.5" />
          <rect x="66" y="124" width="40" height="32" rx="3" fill="#2a1d47" stroke={LINE} strokeOpacity="0.7" />
          <polygon points="60,126 86,102 112,126" fill={color} />
          <rect x="79" y="134" width="14" height="14" rx="2" fill="#ffd59a" />
          <path d="M142 168 V138" stroke="#6fbf7a" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="133" cy="138" rx="10" ry="5" fill="#6fbf7a" transform="rotate(-25 133 138)" />
          <ellipse cx="152" cy="132" rx="10" ry="5" fill="#8fd69a" transform="rotate(25 152 132)" />
        </g>
      )}
    </svg>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative isolate overflow-hidden px-5 py-24 sm:px-8 lg:px-10 lg:py-12">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[70rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/[0.12] blur-[120px]" />

      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/[0.07] px-5 py-2.5">
            <span className="text-purple-300">✦</span>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-100">Your deck of little wonders</span>
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Four cards.{" "}
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-400 bg-clip-text text-transparent">One cozy habit.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-ink-dim sm:text-lg">
            Discover the little things that make studying with Mochi special.
          </p>
        </div>

        {/* Tarot fan */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-3 lg:pb-10 xl:gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.numeral}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              className="group relative hover:z-20"
            >
              <div
                className="transition-transform duration-500 ease-out will-change-transform lg:[transform:translateY(var(--y))_rotate(var(--r))] lg:hover:[transform:translateY(-14px)_rotate(0deg)_scale(1.04)]"
                style={{ "--r": `${c.rot}deg`, "--y": `${c.y}px` } as React.CSSProperties}
              >
                {/* lavender-to-pink frame */}
                <article className="relative mx-auto w-full max-w-[300px] rounded-[1.5rem] bg-gradient-to-br from-[#e9d5ff] via-[#a855f7] to-[#f9a8d4] p-[3px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] transition-shadow duration-500 group-hover:shadow-[0_40px_90px_-20px_rgba(192,132,252,0.45)]">
                  <div className="relative flex min-h-[500px] flex-col items-center overflow-hidden rounded-[1.35rem] bg-[#0d0818] px-5 pb-7 pt-5">
                    {/* inner frame + corners */}
                    <div className="pointer-events-none absolute inset-2 rounded-[1.1rem] border border-[#c4a8ff]/35" />
                    {["left-3.5 top-3.5", "right-3.5 top-3.5", "bottom-3.5 left-3.5", "bottom-3.5 right-3.5"].map((pos) => (
                      <span key={pos} aria-hidden className={`absolute ${pos} text-[10px] leading-none text-[#c4a8ff]`}>✦</span>
                    ))}

                    {/* numeral plaque */}
                    <div className="relative mt-1 flex h-8 min-w-12 items-center justify-center rounded-md border border-[#c4a8ff]/60 bg-[#1a1230] px-3">
                      <span className="font-display text-sm font-semibold tracking-widest text-[#f5d0fe]">{c.numeral}</span>
                    </div>

                    {/* arched window */}
                    <div
                      className="relative mt-4 h-44 w-full overflow-hidden rounded-t-[999px] rounded-b-xl border border-[#c4a8ff]/50"
                      style={{ background: `linear-gradient(180deg, #120b26 0%, ${c.color}22 100%)` }}
                    >
                      <Art kind={c.kind} color={c.color} />
                    </div>

                    {/* title ribbon */}
                    <div className="relative mt-5 w-full rounded-md border border-[#c4a8ff]/60 bg-gradient-to-b from-[#241a42] to-[#150e29] px-3 py-2.5 text-center">
                      <h3 className="font-display text-[13px] font-semibold uppercase leading-snug tracking-[0.14em] text-[#f5d0fe]" style={{ textWrap: "balance" }}>
                        {c.title}
                      </h3>
                    </div>

                    {/* info */}
                    <p className="relative mt-4 text-center text-sm leading-6 text-white/70">{c.description}</p>

                    <span className="relative mt-auto pt-5 text-[10px] font-semibold tracking-[0.3em]" style={{ color: c.color }}>
                      ✦ ✦ ✦
                    </span>

                    {/* soft sheen on hover */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e9d5ff]/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                    />
                  </div>
                </article>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-dim">✦ A little magic in every session.</p>
      </div>
    </section>
  );
}