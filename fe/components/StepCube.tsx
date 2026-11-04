"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type CubeStep = { number: string; title: string; subtitle: string; body: string; icon: string; accent: string };
type Props = { steps: CubeStep[]; index: number; onIndexChange: (i: number) => void };

const SIZE = 2.7, FLOOR = -1.9, STEP = Math.PI / 2, TAU = Math.PI * 2;

function setSpacing(g: CanvasRenderingContext2D, v: string) {
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
}
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = "", yy = y;
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = word; yy += lh; } else line = test;
  }
  g.fillText(line, x, yy);
  return yy + lh;
}
function radial(color: string) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, color); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* one card painted onto a cube face */
function faceTexture(s: CubeStep, i: number, total: number, display: string, text: string, aniso: number) {
  const N = 768, P = 56;
  const c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, N, N);
  bg.addColorStop(0, "rgba(112,72,196,0.58)"); bg.addColorStop(1, "rgba(28,14,70,0.72)");
  g.fillStyle = bg; g.fillRect(0, 0, N, N);
  const gl = g.createRadialGradient(N / 2, N, 20, N / 2, N, N * 0.85);
  gl.addColorStop(0, s.accent + "66"); gl.addColorStop(1, s.accent + "00");
  g.fillStyle = gl; g.fillRect(0, 0, N, N);
  const hl = g.createLinearGradient(0, 0, N, N * 0.6);
  hl.addColorStop(0, "rgba(255,255,255,0.25)"); hl.addColorStop(0.35, "rgba(255,255,255,0)");
  g.fillStyle = hl; g.fillRect(0, 0, N, N);
  g.strokeStyle = s.accent + "aa"; g.lineWidth = 6; g.strokeRect(3, 3, N - 6, N - 6);

  g.textBaseline = "alphabetic";
  g.fillStyle = "rgba(255,255,255,0.6)"; g.font = `600 26px ${text}`; setSpacing(g, "5px");
  g.fillText(`STEP ${s.number}`, P, 88);
  g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,0.45)"; g.font = `28px ${text}`; setSpacing(g, "0px");
  g.fillText("✦", N - P, 90); g.textAlign = "left";

  // icon tile
  g.fillStyle = "rgba(255,255,255,0.09)"; g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 3;
  g.beginPath(); g.roundRect(N / 2 - 78, 128, 156, 156, 36); g.fill(); g.stroke();
  g.textAlign = "center"; g.font = "80px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  g.fillStyle = "#fff"; g.fillText(s.icon, N / 2, 238); g.textAlign = "left";

  g.fillStyle = s.accent; g.font = `600 22px ${text}`; setSpacing(g, "4px");
  g.fillText(s.subtitle, P, 340);
  setSpacing(g, "0px");
  g.fillStyle = "#fff"; g.font = `700 50px ${display}`;
  const y = wrap(g, s.title, P, 400, N - P * 2, 58);
  g.fillStyle = "rgba(255,255,255,0.74)"; g.font = `400 27px ${text}`;
  wrap(g, s.body, P, y + 6, N - P * 2, 38);

  // progress bar like the original cards
  g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.roundRect(P, 698, 540, 10, 5); g.fill();
  const pg = g.createLinearGradient(P, 0, P + 540, 0); pg.addColorStop(0, s.accent); pg.addColorStop(1, "#f9a8d4");
  g.fillStyle = pg; g.beginPath(); g.roundRect(P, 698, (540 * (i + 1)) / total, 10, 5); g.fill();
  g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,0.5)"; g.font = `600 24px ${text}`;
  g.fillText(`${i + 1}/${total}`, N - P, 710);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  return t;
}

export default function StepCube({ steps, index, onIndexChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const api = useRef<{ goTo: (i: number) => void } | null>(null);
  const cb = useRef(onIndexChange); cb.current = onIndexChange;

  useEffect(() => { indexRef.current = index; api.current?.goTo(index); }, [index]);

  useEffect(() => {
    const el = host.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false, raf = 0, cleanup = () => {};

    document.fonts.ready.then(() => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0.9, 9);
      const look = new THREE.Vector3(0, -0.2, 0);

      const cs = getComputedStyle(document.documentElement);
      const fam = (v: string, fb: string) => { const f = cs.getPropertyValue(v).trim(); return f ? `${f}, ${fb}` : fb; };
      const display = fam("--font-poppins", "system-ui, sans-serif"), text = fam("--font-inter", "system-ui, sans-serif");
      const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const n = steps.length;
      const textures = steps.map((s, i) => faceTexture(s, i, n, display, text, aniso));

      const build = (op: number) => {
        const root = new THREE.Group(); root.rotation.x = 0.28;
        const spin = new THREE.Group(); root.add(spin);
        const face = (t?: THREE.Texture) => new THREE.MeshStandardMaterial({
          map: t, color: t ? "#ffffff" : "#5b3fb0", transparent: true, opacity: t ? op : op * 0.45,
          roughness: 0.9, metalness: 0, emissive: t ? "#ffffff" : "#2a1466", emissiveMap: t, emissiveIntensity: t ? 0.6 : 0.4,
        });
        // BoxGeometry face order: +x, -x, +y, -y, +z, -z
        const mats = [face(textures[1]), face(textures[3 % n]), face(), face(), face(textures[0]), face(textures[2])];
        const geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
        const faces = new THREE.Mesh(geo, mats); faces.renderOrder = 1;
        const tint = new THREE.Mesh(new THREE.BoxGeometry(SIZE * 0.995, SIZE * 0.995, SIZE * 0.995),
          new THREE.MeshBasicMaterial({ color: "#8b5cf6", transparent: true, opacity: 0.16 * op, side: THREE.BackSide, depthWrite: false }));
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: "#e9d5ff", transparent: true, opacity: 0.9 * op }));
        edges.renderOrder = 2;
        spin.add(tint, faces, edges);
        return { root, spin };
      };

      const main = build(1);
      scene.add(main.root);
      const mirrorWrap = new THREE.Group(); mirrorWrap.position.y = 2 * FLOOR; mirrorWrap.scale.y = -1;
      const mirror = build(0.18); mirrorWrap.add(mirror.root); scene.add(mirrorWrap);

      // lights + floor glow that takes the active step's color
      scene.add(new THREE.AmbientLight("#c9b3ff", 0.8));
      const key = new THREE.DirectionalLight("#f1e6ff", 1.2); key.position.set(-3, 5, 4); scene.add(key);
      const accentLight = new THREE.HemisphereLight("#a78bfa", "#a78bfa", 0.7); scene.add(accentLight);
      const glowMat = new THREE.MeshBasicMaterial({ map: radial("rgba(255,255,255,1)"), color: "#a78bfa", transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
      const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.2), glowMat);
      floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = FLOOR + 0.01; scene.add(floorGlow);

      // rotation state
      let angle = 0, target = 0, dragging = false, lastX = 0;
      const goTo = (i: number) => {
        const base = -i * STEP;
        target = base + Math.round((angle - base) / TAU) * TAU;
      };
      api.current = { goTo }; goTo(indexRef.current); angle = target;

      const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; renderer.domElement.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => { if (!dragging) return; angle += (e.clientX - lastX) * 0.011; lastX = e.clientX; };
      const up = () => {
        if (!dragging) return; dragging = false;
        const k = Math.round(-angle / STEP);
        target = -k * STEP;
        cb.current(((k % n) + n) % n);
      };
      const dom = renderer.domElement;
      dom.addEventListener("pointerdown", down); dom.addEventListener("pointermove", move);
      dom.addEventListener("pointerup", up); dom.addEventListener("pointercancel", up);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight, a = w / h;
        renderer.setSize(w, h, false);
        camera.aspect = a; camera.updateProjectionMatrix();
        camera.position.z = a < 0.9 ? 12.5 : a < 1.4 ? 10.5 : 9;
      };
      const ro = new ResizeObserver(resize); ro.observe(el); resize();

      const clock = new THREE.Clock(); const tmp = new THREE.Color();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        if (!dragging) angle += (target - angle) * 0.075;
        const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.12;
        main.spin.rotation.y = mirror.spin.rotation.y = angle;
        main.root.position.y = mirror.root.position.y = 0.5 + bob;
        tmp.set(steps[indexRef.current]?.accent ?? "#a78bfa");
        accentLight.color.lerp(tmp, 0.06); glowMat.color.lerp(tmp, 0.06);
        glowMat.opacity = 0.55 + (reduced ? 0 : Math.sin(t * 1.6) * 0.08);
        camera.lookAt(look);
        renderer.render(scene, camera);
      };
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); api.current = null;
        dom.removeEventListener("pointerdown", down); dom.removeEventListener("pointermove", move);
        dom.removeEventListener("pointerup", up); dom.removeEventListener("pointercancel", up);
        scene.traverse((o) => {
          const m = o as THREE.Mesh; m.geometry?.dispose();
          const mt = m.material as THREE.Material | THREE.Material[] | undefined;
          (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
        });
        textures.forEach((x) => x.dispose()); glowMat.map?.dispose();
        renderer.dispose(); dom.remove();
      };
    });

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden />;
}