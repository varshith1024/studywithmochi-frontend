export type Unlock = { id: number; unlockType: string; unlockedAt: string };
export type UnlockDef = { type: string; name: string; need: number; icon: string; color: string; blurb: string };

// thresholds match UnlockService.java
export const UNLOCK_DEFS: UnlockDef[] = [
  { type: "TINY_PLANT", name: "Tiny Plant", need: 30, icon: "🌱", color: "#34d399", blurb: "A little green friend for your desk." },
  { type: "ROOM_DECORATION", name: "Cozy Decorations", need: 120, icon: "🌙", color: "#fbbf24", blurb: "A flag garland and a hanging moon for the walls." },
  { type: "PET_FRIEND", name: "Sleepy Cat", need: 300, icon: "🐱", color: "#f472b6", blurb: "A cat curls up on the armchair." },
  { type: "LIBRARY", name: "Little Library", need: 600, icon: "📚", color: "#a78bfa", blurb: "Floating shelves full of books." },
  { type: "GARDEN", name: "Flower Garden", need: 1200, icon: "🌸", color: "#fb7185", blurb: "A flower box with fluttering butterflies." },
  { type: "NEW_AREA", name: "Magic Door", need: 3000, icon: "🚪", color: "#38bdf8", blurb: "A glowing door to a new area." },
];
export const unlockDef = (type: string) => UNLOCK_DEFS.find((d) => d.type === type);