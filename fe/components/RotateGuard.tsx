"use client";
import { useEffect, useState } from "react";

type LockableOrientation = { lock?: (o: string) => Promise<void> };

export default function RotateGuard() {
  const [skipped, setSkipped] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setSkipped(sessionStorage.getItem("rotate-skip") === "1");
    setCanFullscreen(typeof document.documentElement.requestFullscreen === "function");
  }, []);

  // Android Chrome: fullscreen + landscape lock. Not supported on iPhone, where this just does nothing.
  async function rotateForMe() {
    try {
      await document.documentElement.requestFullscreen();
      await (screen.orientation as unknown as LockableOrientation).lock?.("landscape");
    } catch { /* not supported here: the user can simply turn the phone */ }
  }
  const skip = () => { sessionStorage.setItem("rotate-skip", "1"); setSkipped(true); };

  if (skipped) return null;
  return (
    <div className="rotate-guard fixed inset-0 z-[100] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#3a2166_0%,#1e1233_70%)] px-8 text-center" role="dialog" aria-modal="true" aria-labelledby="rotate-title">
      <div className="rotate-phone relative h-[84px] w-[48px] rounded-[12px] border-[3px] border-purple-200/80 bg-[#2a1a45] shadow-[0_0_40px_rgba(168,85,247,0.5)]" aria-hidden>
        <span className="absolute left-1/2 top-1.5 h-1 w-4 -translate-x-1/2 rounded-full bg-purple-200/60" />
        <span className="absolute inset-0 grid place-items-center text-lg">✦</span>
      </div>
      <h2 id="rotate-title" className="mt-8 font-display text-2xl font-bold text-white">Turn your phone sideways</h2>
      <p className="mt-2 max-w-xs text-ink-dim">Mochi&apos;s room looks best in landscape ♥</p>
      {canFullscreen && (
        <button onClick={rotateForMe} className="mt-7 rounded-full bg-gradient-to-b from-[#c084fc] to-[#9333ea] px-7 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]">
          Rotate for me ✦
        </button>
      )}
      <button onClick={skip} className="mt-4 rounded-full px-4 py-2 text-sm text-ink-dim underline-offset-4 hover:text-white hover:underline">Continue anyway</button>
    </div>
  );
}