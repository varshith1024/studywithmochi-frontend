import { UNLOCK_DEFS, type Unlock } from "@/lib/unlocks";

const dateOf = (s: string) => new Date(s.slice(0, 19)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function WorldSection({ energy, unlocks }: { energy: number; unlocks: Unlock[] }) {
  const got = new Map(unlocks.map((u) => [u.unlockType, u.unlockedAt]));
  const next = UNLOCK_DEFS.find((d) => !got.has(d.type));
  return (
    <section aria-labelledby="world-h" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="world-h" className="font-display text-2xl font-semibold text-white">Mochi&apos;s world</h2>
          <p className="mt-1 text-sm text-ink-dim">{got.size} of {UNLOCK_DEFS.length} unlocked{next ? ` · ${Math.max(0, next.need - energy)} Focus Energy to ${next.name}` : " · everything unlocked ✦"}</p>
        </div>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {UNLOCK_DEFS.map((d) => {
          const at = got.get(d.type), isNext = next?.type === d.type;
          return (
            <li key={d.type} className={`relative overflow-hidden rounded-2xl border p-5 ${at ? "bg-white/[0.05]" : "border-white/10 bg-white/[0.02]"}`} style={at ? { borderColor: `${d.color}66` } : undefined}>
              {at && <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full blur-[40px]" style={{ background: `${d.color}33` }} />}
              <div className="relative flex items-start gap-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${at ? "" : "opacity-40 grayscale"}`} style={{ background: at ? `${d.color}26` : "rgba(255,255,255,0.06)" }} aria-hidden>{at ? d.icon : "🔒"}</span>
                <div className="min-w-0">
                  <p className={`font-display font-semibold ${at ? "text-white" : "text-white/60"}`}>{d.name}</p>
                  <p className="mt-0.5 text-sm text-ink-dim">{d.blurb}</p>
                  <p className="mt-2 text-xs font-semibold" style={{ color: at ? d.color : "rgba(255,255,255,0.45)" }}>{at ? `Unlocked ${dateOf(at)}` : `Needs ${d.need} Focus Energy`}</p>
                </div>
              </div>
              {isNext && (
                <div className="relative mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (energy / d.need) * 100)}%`, background: d.color }} /></div>
                  <p className="mt-1 text-right text-[11px] text-white/50">{Math.min(energy, d.need)} / {d.need}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}