"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createUnlockItems } from "@/lib/roomUnlocks";

export type Place = "couch" | "desk";
export type Activity = "watch" | "idle" | "focus" | "rest" | "cheer";
export type TvState =
  | { mode: "idle" }
  | { mode: "study"; subject: string; remaining: number; total: number; paused: boolean }
  | { mode: "done"; subject: string; energy: number };
type Props = {
  at: Place; activity: Activity; tv: TvState;
  onArrive: (p: Place) => void; onTvAction: (a: "toggle" | "stop") => void;
  unlocked?: string[];
};

const TV_W = 512, TV_H = 320;
const BTN = { toggle: { x: 88, y: 240, w: 160, h: 46 }, stop: { x: 264, y: 240, w: 160, h: 46 } };
const FLOOR_Y = 1.07, COUCH_Y = 1.77, DESK_Y = 2.65, WALK = 3.4;
const TVX = -1.5, TVZ = 0.7;              // TV stand position
const WATCH_HEADING = 1.1;                // how Mochi turns toward the TV
const TV_TURN = -0.55;                    // TV swivel toward Mochi while he watches

/* ---------- helpers ---------- */
const cv = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return { c, g: c.getContext("2d")! }; };
const setSp = (g: CanvasRenderingContext2D, v: string) => { (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v; };
const easeIO = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const fmt = (s: number) => {
  s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
function fit(g: CanvasRenderingContext2D, s: string, maxW: number) {
  if (g.measureText(s).width <= maxW) return s;
  while (s.length > 1 && g.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}
function glowTex(color: string) {
  const { c, g } = cv(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, color); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
function heartPath(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.beginPath(); g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.4);
  g.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); g.fill();
}
function heartTex(color: string) { const { c, g } = cv(64, 64); g.fillStyle = color; heartPath(g, 32, 30, 22); return new THREE.CanvasTexture(c); }
function skyTex() {
  const w = 600, h = 440; const { c, g } = cv(w, h);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#232a86"); sky.addColorStop(1, "#141a5e");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h * 0.6, Math.random() * 1.6 + 0.5, 0, 7); g.fill(); }
  const halo = g.createRadialGradient(470, 90, 10, 470, 90, 100); halo.addColorStop(0, "rgba(200,190,255,0.5)"); halo.addColorStop(1, "rgba(200,190,255,0)");
  g.fillStyle = halo; g.fillRect(350, 0, 250, 230);
  g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(470, 90, 34, 0, 7); g.fill();
  g.fillStyle = "#1c2378"; g.beginPath(); g.arc(486, 80, 31, 0, 7); g.fill();
  let x = 0;
  while (x < w) {
    const bw = 50 + Math.random() * 60, bh = 80 + Math.random() * 130; g.fillStyle = "#171c66"; g.fillRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 14; wy < h - 10; wy += 26) for (let wx = x + 10; wx < x + bw - 10; wx += 22) if (Math.random() > 0.6) { g.fillStyle = "#ffc94d"; g.fillRect(wx, wy, 4, 5); }
    x += bw + 4;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function woodTex() {
  const { c, g } = cv(512, 512);
  for (let y = 0; y < 8; y++) {
    g.fillStyle = `hsl(330 28% ${20 + Math.random() * 6}%)`; g.fillRect(0, y * 64, 512, 64);
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y * 64, 512, 2); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect((y * 173) % 512, y * 64, 2, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); return t;
}

/* ---------- everything drawn on the TV ---------- */
function drawTv(g: CanvasRenderingContext2D, tv: TvState, t: number, hover: string | null, f: { d: string; t: string }) {
  const W = TV_W, H = TV_H;
  const ell = (x: number, y: number, rx: number, ry: number, color: string) => { g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  g.textAlign = "center"; g.textBaseline = "alphabetic"; setSp(g, "0px");

  if (tv.mode === "idle") {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#2d2fa0"); sky.addColorStop(1, "#151866");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.55 * Math.abs(Math.sin(t * 1.5 + i))})`; g.beginPath(); g.arc((i * 97) % W, (i * 53) % 170, 1 + (i % 3) * 0.6, 0, 7); g.fill(); }
    ell(432, 62, 21, 21, "#ffd36a");
    const cx0 = ((t * 16) % (W + 220)) - 110; ell(cx0, 92, 46, 13, "rgba(255,255,255,0.16)"); ell(cx0 + 30, 82, 28, 12, "rgba(255,255,255,0.16)");
    ([[238, "#3a2fa8", 0.018, 16, 22], [264, "#2a2182", 0.024, 12, 34]] as [number, string, number, number, number][]).forEach(([y0, col, fq, amp, sp]) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 + Math.sin((x + t * sp) * fq) * amp); g.lineTo(W, H); g.closePath(); g.fill();
    });
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.18 + i / 6) % 1; g.globalAlpha = Math.sin(p * Math.PI) * 0.7;
      g.fillStyle = ["#ff9fcb", "#c4a8ff", "#ffd36a"][i % 3]; heartPath(g, 50 + i * 80 + Math.sin(t * 1.2 + i) * 14, H - p * (H + 20), 7 + (i % 3) * 2);
    }
    g.globalAlpha = 1;
    // tiny Mochi hopping on the hills
    const hop = Math.abs(Math.sin(t * 3.2)) * 34, cx = W / 2, cy = 206 - hop;
    ell(cx, 242, 32 - hop * 0.3, 7, "rgba(10,8,50,0.35)");
    for (const s of [-1, 1]) { g.save(); g.translate(cx + s * 13, cy - 26); g.rotate(s * (0.22 + Math.sin(t * 3.2) * 0.12)); ell(0, -20, 8, 22, "#b79cf5"); ell(0, -18, 4, 15, "#e9dcff"); g.restore(); }
    ell(cx, cy, 36, 32, "#fff0e8"); ell(cx, cy - 30, 12, 6, "#fff0e8");
    const blink = t % 3.4 > 3.28;
    for (const s of [-1, 1]) {
      ell(cx + s * 13, cy - 4, 6, blink ? 1 : 8, "#2a1a6e"); if (!blink) ell(cx + s * 13 + 2, cy - 8, 2.4, 2.4, "#fff");
      g.globalAlpha = 0.6; ell(cx + s * 24, cy + 8, 7, 4, "#ff9fcb"); g.globalAlpha = 1; ell(cx + s * 38, cy + 4 + Math.sin(t * 6 + s) * 3, 8, 11, "#fff0e8");
    }
    g.strokeStyle = "#8a4a6e"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.fillStyle = "#8b5cf6"; g.beginPath(); g.moveTo(cx, cy + 12); g.lineTo(cx + 5, cy + 19); g.lineTo(cx, cy + 27); g.lineTo(cx - 5, cy + 19); g.closePath(); g.fill();
    const cyc = (t % 6.5) / 6.5;
    if (cyc > 0.5 && cyc < 0.72) { g.fillStyle = "#fffaf5"; g.beginPath(); g.roundRect(cx + 40, cy - 78, 74, 34, 14); g.fill(); g.fillStyle = "#3b2a5e"; g.font = `700 17px ${f.d}`; g.fillText("yay! ✦", cx + 77, cy - 55); }
    g.fillStyle = "rgba(255,255,255,0.13)"; g.beginPath(); g.roundRect(14, 12, 100, 26, 13); g.fill();
    g.fillStyle = "#e6dcff"; g.font = `700 11px ${f.t}`; setSp(g, "3px"); g.fillText("MOCHI TV ✦", 64, 29); setSp(g, "0px");
    return;
  }

  if (tv.mode === "done") {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#32207f"); bg.addColorStop(1, "#13104a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { const p = (t * 0.25 + i * 0.37) % 1; g.globalAlpha = Math.sin(p * Math.PI); g.fillStyle = i % 2 ? "#ffd36a" : "#ff9fcb"; g.font = `${14 + (i % 4) * 5}px ${f.t}`; g.fillText("✦", (i * 71) % W, p * H); }
    g.globalAlpha = 1;
    g.fillStyle = "#ffe6a0"; g.font = `700 24px ${f.d}`; setSp(g, "4px"); g.fillText("SESSION COMPLETE!", W / 2, 62); setSp(g, "0px");
    g.fillStyle = "#cdbbff"; g.font = `600 18px ${f.t}`; g.fillText(fit(g, tv.subject, 400), W / 2, 94);
    const pop = 1 + Math.sin(t * 5) * 0.03; g.save(); g.translate(W / 2, 178); g.scale(pop, pop);
    g.fillStyle = "#ff9fcb"; g.font = `700 78px ${f.d}`; g.fillText(`+${tv.energy}`, 0, 0); g.restore();
    g.fillStyle = "#fff"; g.font = `600 22px ${f.t}`; g.fillText("Focus Energy", W / 2 + 14, 214); g.fillStyle = "#ff9fcb"; heartPath(g, W / 2 - 78, 208, 9);
    g.fillStyle = "rgba(255,255,255,0.75)"; g.font = `500 16px ${f.t}`; g.fillText("Mochi is so proud of you ✦", W / 2, 268);
    return;
  }

  // study mode
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#22237f"); bg.addColorStop(1, "#0e0f45"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const gl = g.createRadialGradient(W / 2, 130, 10, W / 2, 130, 230); gl.addColorStop(0, "rgba(150,110,255,0.28)"); gl.addColorStop(1, "rgba(150,110,255,0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  g.fillStyle = tv.paused ? "#ffd59a" : "#ffffff"; g.font = `700 24px ${f.d}`; setSp(g, "5px"); g.fillText(tv.paused ? "PAUSED" : "STUDY TIME", W / 2, 50); setSp(g, "0px");
  g.font = `600 20px ${f.t}`; g.fillStyle = "#cdbbff"; g.fillText(fit(g, tv.subject, 400), W / 2, 84);
  g.font = `700 92px ${f.d}`; g.fillStyle = "#fff"; g.fillText(fmt(tv.remaining), W / 2, 166);
  const frac = Math.min(1, Math.max(0, 1 - tv.remaining / Math.max(1, tv.total)));
  g.fillStyle = "rgba(255,255,255,0.15)"; g.beginPath(); g.roundRect(96, 184, 320, 10, 5); g.fill();
  if (frac > 0) { const pg = g.createLinearGradient(96, 0, 416, 0); pg.addColorStop(0, "#a78bfa"); pg.addColorStop(1, "#f9a8d4"); g.fillStyle = pg; g.beginPath(); g.roundRect(96, 184, Math.max(10, 320 * frac), 10, 5); g.fill(); }
  g.font = `600 13px ${f.t}`; setSp(g, "2px"); g.fillStyle = "rgba(255,255,255,0.7)"; g.fillText(tv.paused ? "TAKE A BREATH. MOCHI WILL WAIT ✦" : "YOU'VE GOT THIS!", W / 2, 224); setSp(g, "0px");
  const button = (key: "toggle" | "stop", label: string, c1: string, c2: string) => {
    const b = BTN[key], hot = hover === key;
    const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.beginPath(); g.roundRect(b.x, hot ? b.y - 2 : b.y, b.w, b.h, 14); g.fill();
    g.strokeStyle = hot ? "#fff" : "rgba(255,255,255,0.3)"; g.lineWidth = 2; g.stroke();
    g.fillStyle = "#fff"; g.font = `700 17px ${f.d}`; setSp(g, "2px"); g.fillText(label, b.x + b.w / 2, b.y + 29); setSp(g, "0px");
  };
  button("toggle", tv.paused ? "RESUME" : "PAUSE", "#7c5ce0", "#5236b8");
  button("stop", "STOP", "#e0457a", "#b02357");
}

/* ---------- the scene ---------- */
export default function LivingRoomScene({ at, activity, tv, onArrive, onTvAction, unlocked }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ at, activity, tv, onArrive, onTvAction, unlocked });
  live.current = { at, activity, tv, onArrive, onTvAction, unlocked };
  const startAt = useRef(at).current;

  useEffect(() => {
    const el = host.current!;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
    const cs = getComputedStyle(document.documentElement);
    const fam = (v: string, fb: string) => { const x = cs.getPropertyValue(v).trim(); return x ? `${x}, ${fb}` : fb; };
    const fonts = { d: fam("--font-poppins", "system-ui, sans-serif"), t: fam("--font-inter", "system-ui, sans-serif") };

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene(); scene.background = new THREE.Color("#2a1540");
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 90);
    const camBase = new THREE.Vector3(0, 3.7, 12); const look = new THREE.Vector3(0.4, 2.9, 0);
    const world = new THREE.Group(); scene.add(world);

    const mat = (c: string, r = 0.75, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const rbox = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, rad = 0.12, parent: THREE.Object3D = world) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(rad, w / 2, h / 2, d / 2)), mat(c)); m.position.set(x, y, z); parent.add(m); return m;
    };
    const cyl = (rt: number, rb: number, h: number, c: string, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 28), mat(c)); m.position.set(x, y, z); parent.add(m); return m;
    };
    const ell = (rx: number, ry: number, rz: number, c: string, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(c, 0.8)); m.scale.set(rx, ry, rz); m.position.set(x, y, z); parent.add(m); return m;
    };
    const glow = (color: string, size: number, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(size); s.position.set(x, y, z); parent.add(s); return s;
    };

    /* lights */
    world.add(new THREE.HemisphereLight("#d9c8ff", "#6a4580", 1.0)); world.add(new THREE.AmbientLight("#a58be0", 0.45));
    const key = new THREE.DirectionalLight("#ffe8d6", 1.4); key.position.set(3, 9, 9); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -3, near: 1, far: 34 });
    key.shadow.bias = -0.0006; key.shadow.radius = 4; world.add(key);
    const windowLight = new THREE.PointLight("#8a9bff", 30, 14, 2); windowLight.position.set(4.5, 5, -1.5); world.add(windowLight);
    const lampLight = new THREE.PointLight("#ffb36b", 16, 9, 2); lampLight.position.set(4.7, 3.3, 0.6); world.add(lampLight);
    const tvLight = new THREE.PointLight("#8da0ff", 10, 9, 2); tvLight.position.set(TVX, 2.1, TVZ + 1.5); world.add(tvLight);

    /* room shell */
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), mat("#3a2050", 0.95)); wall.position.set(0, 7, -3); world.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 26), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 6); world.add(floor);
    rbox(50, 0.5, 0.15, "#2f1a40", 0, 0.25, -2.92, 0.05);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat("#4a3590", 0.95)); rug.rotation.x = -Math.PI / 2; rug.scale.set(8.5, 3.4, 1); rug.position.set(0, 0.02, 0.4); world.add(rug);

    /* window + curtains */
    const wx = 4.5, wy = 5.6;
    rbox(5.5, 3.7, 0.25, "#8a5278", wx, wy, -2.9, 0.06);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.2), new THREE.MeshBasicMaterial({ map: skyTex(), toneMapped: false })); glass.position.set(wx, wy, -2.76); world.add(glass);
    rbox(0.14, 3.2, 0.14, "#8a5278", wx, wy, -2.7, 0.03); rbox(5.0, 0.14, 0.14, "#8a5278", wx, wy, -2.7, 0.03); rbox(6.0, 0.2, 0.5, "#8a5278", wx, wy - 1.95, -2.7, 0.05);
    for (const s of [-1, 1]) { const c = rbox(0.7, 3.8, 0.35, "#74406e", wx + s * 2.95, wy, -2.6, 0.15); c.rotation.z = s * -0.03; ell(0.09, 0.09, 0.09, "#e8b4c8", wx + s * 2.95, wy - 0.3, -2.4); }

    /* shelf, frames, vine, fairy lights */
    rbox(3.4, 0.16, 0.7, "#9a6246", -1.3, 5.6, -2.6, 0.04);
    ["#7a5bc0", "#c4607a", "#e0a24a", "#6b57b0"].forEach((c, i) => rbox(0.3, 0.9 + (i % 2) * 0.3, 0.5, c, -2.5 + i * 0.36, 6.18 + (i % 2) * 0.15, -2.6, 0.03));
    cyl(0.34, 0.26, 0.5, "#d5805a", -0.1, 5.93, -2.6);
    for (let i = 0; i < 6; i++) { const l = ell(0.16, 0.55, 0.1, "#3b9560", -0.1 + (i - 2.5) * 0.14, 6.5 + (i % 2) * 0.12, -2.6); l.rotation.z = (i - 2.5) * 0.28; }
    const frame = (x: number, y: number, w: number, h: number, c: string, art: string, rot: number) => {
      const f = rbox(w, h, 0.12, "#a8683f", x, y, -2.88, 0.04); f.rotation.z = rot;
      const a = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, h - 0.3), new THREE.MeshBasicMaterial({ color: c })); a.position.z = 0.07; f.add(a);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: art })); d.position.set(0.1, 0.15, 0.08); f.add(d);
    };
    frame(-1.9, 4.5, 1.5, 1.7, "#2c3a8f", "#ffd36a", 0.04); frame(-0.7, 3.8, 1.1, 1.3, "#f7c9b0", "#e86a8a", -0.03);
    for (let i = 0; i < 22; i++) { const t = i / 21; const l = ell(0.1, 0.26, 0.05, i % 3 ? "#3b9560" : "#2c7a4e", 0.5 + Math.sin(t * 5) * 0.28 + (i % 2 ? 0.14 : -0.14), 5.5 - t * 4.2, -2.8); l.rotation.z = (i % 2 ? -1 : 1) * 0.6; }
    const bulbs = Array.from({ length: 18 }, (_, i) => {
      const t = i / 17, x = -7 + t * 15, y = 7.1 - Math.sin(t * Math.PI) * 0.5;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: "#fff0b8" })); core.position.set(x, y, -2.5); world.add(core);
      return { s: glow("rgba(255,222,140,1)", 0.34, x, y, -2.5), p: i * 1.3 };
    });

    /* armchair */
    rbox(2.4, 1.0, 2.0, "#c4695c", -6.5, 0.7, -1.2, 0.2); rbox(0.7, 2.5, 2.0, "#b55a50", -7.35, 1.6, -1.2, 0.25);
    rbox(2.4, 0.8, 0.5, "#a84f47", -6.5, 1.3, -2.1, 0.2); rbox(2.4, 0.8, 0.5, "#a84f47", -6.5, 1.3, -0.3, 0.2); rbox(1.7, 0.35, 1.3, "#d07a6c", -6.3, 1.35, -1.2, 0.15);

    /* pouf (Mochi's TV spot, moved left) */
    cyl(0.95, 1.0, 0.7, "#7468b8", -4.9, 0.35, 0.9);

    /* cute TV stand + swiveling TV */
    rbox(2.4, 0.56, 1.0, "#d7a27a", TVX, 0.5, TVZ, 0.16);                       // cabinet
    rbox(2.2, 0.06, 0.9, "#e7b88f", TVX, 0.8, TVZ, 0.03);                       // top board
    for (const s of [-1, 1]) { rbox(0.9, 0.34, 0.04, "#c58f6a", TVX + s * 0.55, 0.5, TVZ + 0.51, 0.04); ell(0.06, 0.06, 0.04, "#fff0e8", TVX + s * 0.55, 0.5, TVZ + 0.56); } // drawers + knobs
    for (const sx of [-0.95, 0.95]) for (const sz of [-0.35, 0.35]) cyl(0.07, 0.05, 0.3, "#8a5a44", TVX + sx, 0.15, TVZ + sz); // legs
    cyl(0.14, 0.11, 0.2, "#f2b8c8", TVX + 0.85, 0.93, TVZ - 0.1); ell(0.14, 0.16, 0.14, "#3b9560", TVX + 0.85, 1.1, TVZ - 0.1); // tiny succulent
    const swivel = new THREE.Group(); swivel.position.set(TVX - 0.1, 0.83, TVZ - 0.05); swivel.rotation.y = startAt === "couch" ? TV_TURN : 0; world.add(swivel);
    cyl(0.45, 0.5, 0.06, "#26204f", 0, 0.03, 0, swivel); cyl(0.08, 0.08, 0.3, "#26204f", 0, 0.2, 0, swivel);
    rbox(2.5, 1.6, 0.22, "#26204f", 0, 1.12, 0, 0.08, swivel);
    const tvCanvas = cv(TV_W, TV_H); const tvTex = new THREE.CanvasTexture(tvCanvas.c); tvTex.colorSpace = THREE.SRGBColorSpace; tvTex.anisotropy = 4;
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.4), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false })); tvScreen.position.set(0, 1.12, 0.12); swivel.add(tvScreen);

    /* desk, chair, laptop, books, lamp, mug */
    rbox(5.0, 0.2, 1.7, "#8a5a44", 2.6, 1.7, 0, 0.06); rbox(4.8, 0.9, 0.12, "#7a4c38", 2.6, 1.15, 0.78, 0.04); rbox(4.7, 1.4, 0.1, "#6a4030", 2.6, 0.9, -0.78, 0.03);
    for (const x of [0.25, 4.95]) for (const z of [-0.7, 0.7]) cyl(0.11, 0.09, 1.6, "#6a4030", x, 0.8, z);
    rbox(1.9, 0.07, 1.6, "#8b6ad8", 2.6, 1.45, -1.65, 0.1); rbox(1.9, 2.0, 0.25, "#8b6ad8", 2.6, 2.5, -2.5, 0.14);
    for (const x of [1.8, 3.4]) for (const z of [-2.3, -1.0]) cyl(0.09, 0.08, 1.3, "#5e43a8", x, 0.65, z);
    const laptop = new THREE.Group(); laptop.position.set(2.6, 1.8, 0.1); laptop.rotation.y = Math.PI; world.add(laptop);
    rbox(1.9, 0.08, 1.3, "#9ba1c8", 0, 0.04, 0, 0.04, laptop);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.06, -0.62); hinge.rotation.x = -0.3; laptop.add(hinge);
    rbox(1.9, 0.68, 0.07, "#9ba1c8", 0, 0.34, 0, 0.04, hinge);
    // const logo = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), new THREE.MeshBasicMaterial({ color: "#e6dcff" })); logo.position.set(0, 0.34, -0.045); logo.rotation.y = Math.PI; hinge.add(logo);
    rbox(1.3, 0.14, 0.85, "#7a5bc0", 0.9, 1.87, 0.2, 0.04); rbox(1.2, 0.13, 0.8, "#e0728f", 0.9, 2.0, 0.2, 0.04).rotation.y = 0.12; rbox(1.1, 0.12, 0.75, "#e8b25a", 0.9, 2.12, 0.2, 0.04).rotation.y = -0.08;
    cyl(0.24, 0.2, 0.36, "#fff0e8", 4.0, 1.98, 0.35);
    const lamp = new THREE.Group(); lamp.position.set(4.7, 1.8, -0.1); world.add(lamp);
    cyl(0.42, 0.46, 0.1, "#6b52b8", 0, 0.05, 0, lamp); cyl(0.04, 0.04, 1.3, "#c9b3ff", 0, 0.7, 0, lamp);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 28, 1, true), new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffb066", emissiveIntensity: 1.2, side: THREE.DoubleSide })); shade.position.set(0, 1.45, 0); lamp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), new THREE.MeshBasicMaterial({ color: "#fff1c4" })); bulb.position.set(0, 1.35, 0); lamp.add(bulb);
    glow("rgba(255,200,120,0.9)", 1.9, 4.7, 3.2, -0.1);

    /* big floor plant on the right */
    cyl(0.55, 0.45, 0.9, "#d5805a", 7.3, 0.45, -1.9);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, l = ell(0.28, 1.0, 0.12, i % 2 ? "#3b9560" : "#2c7a4e", 7.3 + Math.cos(a) * 0.35, 1.9 + (i % 3) * 0.25, -1.9 + Math.sin(a) * 0.3);
      l.rotation.z = Math.cos(a) * 0.5; l.rotation.x = Math.sin(a) * 0.4;
    }

    /* ================= Mochi ================= */
    const mochi = new THREE.Group(); mochi.rotation.order = "YXZ"; world.add(mochi);
    const cream = new THREE.MeshPhysicalMaterial({ color: "#f1ddd6", roughness: 0.65, sheen: 0.4, sheenColor: new THREE.Color("#ffd6ee"), sheenRoughness: 0.4 });
    const lav = new THREE.MeshStandardMaterial({ color: "#b79cf5", roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), cream); body.scale.set(1.08, 0.95, 0.98); mochi.add(body);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), cream); tuft.position.set(0, 0.93, 0.05); tuft.scale.set(1.3, 0.7, 1); mochi.add(tuft);
    const earG: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(s * 0.3, 0.92, -0.05); mochi.add(eg); earG.push(eg);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lav); ear.scale.set(0.2, 0.72, 0.11); ear.position.y = 0.62; eg.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: "#e9dcff", roughness: 0.7 })); inner.scale.set(0.55, 0.78, 0.5); inner.position.z = 0.7; ear.add(inner);
    }
    const eyes = new THREE.Group(); mochi.add(eyes);
    const arcGeo = new THREE.TorusGeometry(0.15, 0.028, 8, 20, Math.PI);
    const eyeParts: { open: THREE.Group; happy: THREE.Mesh; closed: THREE.Mesh }[] = [];
    const cheekMats: THREE.MeshBasicMaterial[] = [];
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 0.42, 0.14, 0.84); eyes.add(g);
      const open = new THREE.Group(); g.add(open);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.23, 28, 20), new THREE.MeshStandardMaterial({ color: "#2a1a6e", roughness: 0.25 })); ball.scale.set(1, 1.18, 0.5); open.add(ball);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshBasicMaterial({ color: "#5b3fd0" })); iris.position.set(0, -0.03, 0.06); iris.scale.set(1, 1.15, 0.4); open.add(iris);
      for (const [hx, hy, hr] of [[0.07, 0.11, 0.06], [-0.06, -0.09, 0.03]]) { const h = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 10), new THREE.MeshBasicMaterial({ color: "#fff" })); h.position.set(hx, hy, 0.13); open.add(h); }
      const happy = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: "#2a1a6e" })); happy.position.set(0, -0.05, 0.1); g.add(happy);
      const closed = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: "#2a1a6e" })); closed.rotation.z = Math.PI; closed.position.set(0, 0.06, 0.1); g.add(closed);
      eyeParts.push({ open, happy, closed });
      const cm = new THREE.MeshBasicMaterial({ color: "#ffa0c0", transparent: true, opacity: 0.65 }); cheekMats.push(cm);
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), cm); cheek.scale.y = 0.6; cheek.position.set(s * 0.7, -0.12, 0.68); cheek.rotation.y = s * 0.85; mochi.add(cheek);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: "#e98aa8" })); nose.position.set(0, -0.05, 0.96); mochi.add(nose);
    const mouthMat = new THREE.MeshBasicMaterial({ color: "#8a4a6e" });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14, Math.PI), mouthMat); smile.rotation.z = Math.PI; smile.position.set(0, -0.13, 0.95); mochi.add(smile);
    const openM = new THREE.Group(); openM.position.set(0, -0.15, 0.95); openM.visible = false; mochi.add(openM);
    const mo = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: "#7a2f55" })); mo.scale.y = 1.15; openM.add(mo);
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), new THREE.MeshBasicMaterial({ color: "#f27b8e" })); tongue.position.set(0, -0.05, 0.005); openM.add(tongue);
    const armL = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), cream); const armR = armL.clone(); mochi.add(armL, armR);
    const footL = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), cream); footL.scale.set(1.2, 0.68, 1.1); const footR = footL.clone(); mochi.add(footL, footR);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: "#8b5cf6", emissive: "#7c3aed", emissiveIntensity: 1.2, roughness: 0.2 })); gem.scale.set(0.9, 1.5, 0.6); gem.position.set(0, -0.5, 0.93); mochi.add(gem);
    const gemGlow = glow("rgba(170,120,255,0.9)", 0.4, 0, -0.5, 0.98, mochi);

    const heartTexs = [heartTex("#ff8fb8"), heartTex("#ffd36a"), heartTex("#c4a8ff")];
    const hearts = Array.from({ length: 18 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexs[i % 3], transparent: true, depthWrite: false })); s.visible = false; world.add(s); return { s, v: new THREE.Vector3(), life: 0 }; });
    const spawnHearts = (n: number) => {
      for (let i = 0; i < n; i++) { const h = hearts.find((x) => x.life <= 0); if (!h) return; h.life = 1; h.s.visible = true; h.s.scale.setScalar(0.3 + Math.random() * 0.25); h.s.position.set(mochi.position.x + (Math.random() - 0.5) * 2, mochi.position.y + 0.9, mochi.position.z + 0.8); h.v.set((Math.random() - 0.5) * 0.7, 1.2 + Math.random(), 0); }
    };

    /* shadows */
    world.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material instanceof THREE.MeshStandardMaterial) { m.castShadow = true; m.receiveShadow = true; } });
    for (const m of [wall, floor, rug]) m.receiveShadow = true;

    const unlocks = createUnlockItems(world, 3.6);

    /* walking route: behind the TV stand, along the back wall, to the chair */
    const F = FLOOR_Y;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.0, F, 0.0), new THREE.Vector3(-3.6, F, -1.3), new THREE.Vector3(-2.4, F, -1.95), new THREE.Vector3(-0.8, F, -2.0), new THREE.Vector3(0.5, F, -1.85),
    ]);
    const couchPos = new THREE.Vector3(-4.6, COUCH_Y, 0.9), deskPos = new THREE.Vector3(2.6, DESK_Y, -1.7);

    /* TV pointer */
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let hoverBtn: "toggle" | "stop" | null = null;
    const hitTv = (e: PointerEvent | MouseEvent) => {
      if (live.current.tv.mode !== "study") return null;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
      const h = ray.intersectObject(tvScreen, false)[0]; if (!h || !h.uv) return null;
      const x = h.uv.x * TV_W, y = (1 - h.uv.y) * TV_H;
      for (const k of ["toggle", "stop"] as const) { const b = BTN[k]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return k; }
      return null;
    };
    const blocked = (e: Event) => !!(e.target as HTMLElement).closest("button,a,[role=dialog]");
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = -((e.clientY / window.innerHeight) * 2 - 1);
      const k = blocked(e) ? null : hitTv(e);
      if (k !== hoverBtn) { hoverBtn = k; document.documentElement.style.cursor = k ? "pointer" : ""; }
    };
    const onClick = (e: MouseEvent) => { if (blocked(e)) return; const k = hitTv(e); if (k) live.current.onTvAction(k); };
    window.addEventListener("pointermove", onMove); window.addEventListener("click", onClick);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight, a = w / h;
      renderer.setSize(w, h, false); camera.aspect = a; camera.updateProjectionMatrix();
      camBase.z = Math.min(34, Math.max(11.5, 26.6 / a - 2.75));
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    /* animation state */
    const base = { lx: -1, ly: -0.2, lz: 0.35, rx: 1, ry: -0.2, rz: 0.35, ear: 0.22, rotX: 0, rotZ: 0, blush: 0.65, flz: 0, fly: 0, frz: 0, fry: 0 };
    const P = { ...base };
    let loc: Place = startAt, move: { dir: 1 | -1; t: number } | null = null;
    let heading = startAt === "desk" ? 0 : WATCH_HEADING, blinkAt = 2, laughPrev = false, heartT = 0, tvAcc = 1, raf = 0;
    const cur = new THREE.Vector3(), tan = new THREE.Vector3(); const clock = new THREE.Clock();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, pr = live.current, kk = 1 - Math.exp(-dt * 8);

      /* TV: swivels toward Mochi while he watches, straight to the screen otherwise */
      const tvTarget = pr.at === "couch" && pr.tv.mode === "idle" ? TV_TURN : 0;
      swivel.rotation.y += (tvTarget - swivel.rotation.y) * (1 - Math.exp(-dt * 3));
      tvAcc += dt;
      if (tvAcc > 0.05) { tvAcc = 0; drawTv(tvCanvas.g, pr.tv, t, hoverBtn, fonts); tvTex.needsUpdate = true; }
      tvLight.intensity = 9 + Math.sin(t * 2) * 1.5 * rm;

      /* movement */
      if (!move && pr.at !== loc) move = { dir: pr.at === "desk" ? 1 : -1, t: 0 };
      let stage: "rest" | "hop" | "walk" = "rest", wphase = 0, targetHeading = loc === "desk" ? 0 : WATCH_HEADING;
      cur.copy(loc === "desk" ? deskPos : couchPos);
      if (move) {
        move.t += dt; const dir = move.dir, dDown = dir === 1 ? 0.5 : 0.7, dUp = dir === 1 ? 0.8 : 0.5, t0 = move.t;
        const sP = dir === 1 ? couchPos : deskPos, eP = dir === 1 ? deskPos : couchPos, pS = path.getPoint(dir === 1 ? 0 : 1), pE = path.getPoint(dir === 1 ? 1 : 0);
        if (t0 < dDown) { const u = t0 / dDown; cur.lerpVectors(sP, pS, easeIO(u)); cur.y += Math.sin(Math.PI * u) * 0.45; stage = "hop"; targetHeading = Math.atan2(pS.x - sP.x, pS.z - sP.z); }
        else if (t0 < dDown + WALK) { const e = easeIO((t0 - dDown) / WALK), s = dir === 1 ? e : 1 - e; path.getPoint(s, cur); path.getTangent(s, tan); if (dir === -1) tan.negate(); targetHeading = Math.atan2(tan.x, tan.z); stage = "walk"; wphase = (t0 - dDown) * 9; }
        else { const u = Math.min(1, (t0 - dDown - WALK) / dUp); cur.lerpVectors(pE, eP, easeIO(u)); cur.y += Math.sin(Math.PI * u) * 0.9; stage = "hop"; targetHeading = dir === 1 ? 0 : WATCH_HEADING; }
        if (t0 >= dDown + WALK + dUp) { loc = dir === 1 ? "desk" : "couch"; move = null; pr.onArrive(loc); }
      }

      /* pose */
      const T = { ...base }; let eyeMode: "open" | "happy" | "closed" = "open", mouth: "smile" | "open" = "smile", jy = 0, laugh = false;
      if (stage === "walk") {
        const s = Math.sin(wphase);
        T.ly = -0.2 + s * 0.28; T.ry = -0.2 - s * 0.28; T.flz = s * 0.24; T.frz = -s * 0.24; T.fly = Math.max(0, s) * 0.16; T.fry = Math.max(0, -s) * 0.16;
        T.rotZ = s * 0.1 * rm; T.ear = 0.22 + Math.sin(wphase * 2) * 0.12 * rm; T.blush = 1; mouth = "open";
      } else if (stage === "hop") {
        T.lx = -1.1; T.rx = 1.1; T.ly = 0.6; T.ry = 0.6; T.ear = 0.5; eyeMode = "happy"; mouth = "open"; T.blush = 1;
      } else {
        const a = pr.activity;
        if (loc === "couch") {
          const cyc = (t % 6.5) / 6.5; laugh = cyc > 0.5 && cyc < 0.72;
          T.lx = -0.8; T.rx = 0.8; T.ly = -0.35; T.ry = -0.35; T.lz = 0.62; T.rz = 0.62; T.flz = Math.sin(t * 2.2) * 0.07 * rm; T.frz = -T.flz; T.rotZ = Math.sin(t * 1.2) * 0.04 * rm; T.rotX = 0.06;
          if (laugh) { eyeMode = "happy"; mouth = "open"; T.lx = -1.1; T.rx = 1.1; T.ly = 0.35; T.ry = 0.35; T.ear = 0.5; T.blush = 1; T.rotZ = Math.sin(t * 22) * 0.07 * rm; jy = Math.abs(Math.sin(t * 9)) * 0.16 * rm; if (!laughPrev) spawnHearts(4); }
        } else if (a === "focus") {
          T.lx = -0.7; T.rx = 0.7; T.lz = 0.9; T.rz = 0.9; T.ly = -0.5 + Math.max(0, Math.sin(t * 13)) * 0.07 * rm; T.ry = -0.5 + Math.max(0, Math.sin(t * 13 + 2.4)) * 0.07 * rm; T.rotX = 0.14; T.blush = 0.8;
          if (Math.sin(t * 0.45) > 0.92) targetHeading = -0.55; // glances left toward the TV
        } else if (a === "rest") {
          const s = ((Math.sin(t * 0.9) + 1) / 2) * rm; T.lx = -1; T.rx = 1; T.ly = -0.1 + s * 0.9; T.ry = -0.1 + s * 0.9; T.lz = 0.25; T.rz = 0.25; T.rotX = -0.08 * s; T.ear = 0.4;
          eyeMode = s > 0.5 ? "closed" : "open"; mouth = s > 0.6 ? "open" : "smile";
        } else if (a === "cheer") {
          T.lx = -1.15; T.rx = 1.15; T.ly = 0.85 + Math.sin(t * 9) * 0.12 * rm; T.ry = 0.85 + Math.sin(t * 9 + 1) * 0.12 * rm; eyeMode = "happy"; mouth = "open";
          jy = Math.abs(Math.sin(t * 6)) * 0.5 * rm; T.rotZ = Math.sin(t * 3) * 0.12 * rm; T.ear = 0.22 + Math.sin(t * 6) * 0.2 * rm; T.blush = 1;
          heartT -= dt; if (heartT <= 0) { heartT = 0.14; spawnHearts(1); }
        } else { // idle at desk, waiting for the form
          T.lx = -0.7; T.rx = 0.7; T.lz = 0.9; T.rz = 0.9; T.ly = -0.5; T.ry = -0.5; T.rotX = 0.05; targetHeading = ptr.sx * 0.3;
        }
        laughPrev = laugh;
      }
      (Object.keys(P) as (keyof typeof P)[]).forEach((k) => { P[k] += (T[k] - P[k]) * kk; });
      heading += angDiff(targetHeading, heading) * (stage === "walk" ? 0.14 : 0.09);

      const breathe = Math.sin(t * 1.8) * 0.02 * rm, bounce = stage === "walk" ? Math.abs(Math.sin(wphase)) * 0.16 * rm : 0, sy = 1 + breathe;
      mochi.position.set(cur.x, cur.y + jy + bounce + breathe, cur.z);
      mochi.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
      mochi.rotation.set(P.rotX, heading, P.rotZ);
      armL.position.set(P.lx, P.ly, P.lz); armR.position.set(P.rx, P.ry, P.rz); armL.scale.set(0.95, 1.2, 1); armR.scale.set(0.95, 1.2, 1);
      footL.position.set(-0.52, -0.84 + P.fly, 0.55 + P.flz); footR.position.set(0.52, -0.84 + P.fry, 0.55 + P.frz);
      earG.forEach((g, i) => { g.rotation.z = (i ? -1 : 1) * P.ear; });
      cheekMats.forEach((c) => (c.opacity = P.blush));
      eyes.position.x = loc === "desk" ? ptr.sx * 0.04 : 0;
      if (t > blinkAt + 0.13) blinkAt = t + 2 + Math.random() * 3.5;
      const blinking = eyeMode === "open" && t > blinkAt && t < blinkAt + 0.13;
      eyeParts.forEach((e) => { e.open.visible = eyeMode === "open"; e.happy.visible = eyeMode === "happy"; e.closed.visible = eyeMode === "closed"; e.open.scale.y = blinking ? 0.1 : 1; });
      smile.visible = mouth === "smile"; openM.visible = mouth === "open";
      gem.rotation.y = t * 1.1 * rm; gemGlow.material.opacity = 0.7 + Math.sin(t * 2.4) * 0.25 * rm;

      hearts.forEach((h) => { if (h.life <= 0) return; h.life -= dt * 0.7; h.s.position.addScaledVector(h.v, dt); h.s.material.opacity = Math.max(0, h.life); if (h.life <= 0) h.s.visible = false; });
      bulbs.forEach((b) => (b.s.material.opacity = 0.7 + Math.sin(t * 1.5 + b.p) * 0.3 * rm));

      ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
      camera.position.set(camBase.x + ptr.sx * 0.45 * rm, camBase.y + ptr.sy * 0.2 * rm, camBase.z); camera.lookAt(look);
      unlocks.sync(pr.unlocked ?? []); unlocks.update(t, dt);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove); window.removeEventListener("click", onClick); document.documentElement.style.cursor = "";
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose()); });
      tvTex.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}