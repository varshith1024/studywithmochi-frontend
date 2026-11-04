"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type Mood = "greet" | "idle" | "listen" | "shy" | "sad" | "happy";
type Props = { mood: Mood; look: number; pulse: number; speech: string };

const cv = (w: number, h: number) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  return { c, g: c.getContext("2d")! };
};
function glowTex(color: string) {
  const { c, g } = cv(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, color); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function heartTex(color: string) {
  const { c, g } = cv(64, 64);
  g.fillStyle = color; g.beginPath(); g.moveTo(32, 56);
  g.bezierCurveTo(4, 36, 6, 10, 24, 10); g.bezierCurveTo(30, 10, 32, 16, 32, 18);
  g.bezierCurveTo(32, 16, 34, 10, 40, 10); g.bezierCurveTo(58, 10, 60, 36, 32, 56); g.fill();
  return new THREE.CanvasTexture(c);
}
function keysTex() {
  const { c, g } = cv(256, 160);
  g.fillStyle = "#c9cde8"; g.fillRect(0, 0, 256, 160); g.fillStyle = "#4a4f7a";
  for (let r = 0; r < 5; r++) for (let i = 0; i < 12; i++) g.fillRect(10 + i * 19.5, 12 + r * 20, 16, 15);
  g.fillRect(70, 118, 120, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function MochiAuthScene({ mood, look, pulse, speech }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ mood, look, pulse, speech });
  live.current = { mood, look, pulse, speech };

  useEffect(() => {
    const el = host.current!;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    const camBase = new THREE.Vector3(0, 3.5, 11);
    const world = new THREE.Group(); scene.add(world);

    const mat = (c: string, r = 0.75, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const rbox = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, rad = 0.12, parent: THREE.Object3D = world) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(rad, w / 2, h / 2, d / 2)), mat(c));
      mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    const cyl = (rt: number, rb: number, h: number, c: string, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24), mat(c));
      mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    const glow = (color: string, size: number, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.scale.setScalar(size); s.position.set(x, y, z); parent.add(s); return s;
    };

    /* lights */
    world.add(new THREE.HemisphereLight("#d9c8ff", "#5a3a7a", 1.0));
    world.add(new THREE.AmbientLight("#a58be0", 0.5));
    const key = new THREE.DirectionalLight("#ffe8d6", 1.3); key.position.set(3, 9, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -3, near: 1, far: 30 });
    key.shadow.bias = -0.0006; key.shadow.radius = 4; world.add(key);
    const lampLight = new THREE.PointLight("#ffb36b", 14, 9, 2); lampLight.position.set(2.4, 3.4, 2.0); world.add(lampLight);
    const screenLight = new THREE.PointLight("#bcd8ff", 8, 6, 2); screenLight.position.set(-1.7, 2.8, 1.3); world.add(screenLight);

    /* backdrop glow, floor, bokeh */
    glow("rgba(160,110,255,0)", 13, 0, 3.4, -3.5);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), mat("#2a1850", 0.8));
    floor.rotation.x = -Math.PI / 2; world.add(floor);
    // const bokeh = Array.from({ length: 12 }, (_, i) => ({ s: glow("rgba(255,222,150,1)", 0.3 + (i % 3) * 0.15, -6 + i * 1.1, 4.5 + Math.sin(i * 2.3) * 1.8, -3), p: i * 1.7 }));

    /* chair */
    rbox(2.6, 0.28, 2.3, "#8b6ad8", 0, 1.2, -0.35, 0.1);
    rbox(2.6, 2.4, 0.28, "#8b6ad8", 0, 2.55, -1.55, 0.14);
    for (const x of [-1.1, 1.1]) for (const z of [-1.3, 0.5]) cyl(0.1, 0.09, 1.1, "#8b6ad8", x, 0.55, z);

    /* table */
    rbox(5.8, 0.25, 2.0, "#8a5a44", 0, 1.7, 1.9, 0.08);
    rbox(5.6, 0.3, 0.1, "#7a4c38", 0, 1.45, 2.85, 0.03);
    for (const x of [-2.2, 2.2]) for (const z of [1.1, 2.7]) cyl(0.12, 0.1, 1.6, "#6a4030", x, 0.8, z);

    /* laptop */
    const laptop = new THREE.Group(); laptop.position.set(-2, 1.825, 2.2); laptop.rotation.y = 0.5; world.add(laptop);
    rbox(1.9, 0.09, 1.3, "#aab0d4", 0, 0.045, 0, 0.04, laptop);
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.95), new THREE.MeshBasicMaterial({ map: keysTex() }));
    keys.rotation.set(-Math.PI / 2, 0, Math.PI); keys.position.set(0, 0.095, -0.05); laptop.add(keys);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.09, 0.62); hinge.rotation.x = 0.28; laptop.add(hinge);
    rbox(1.9, 1.25, 0.07, "#9ba1c8", 0, 0.62, 0, 0.04, hinge);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 1.1), new THREE.MeshBasicMaterial({ color: "#d6e8ff" }));
    scr.position.set(0, 0.62, -0.04); scr.rotation.y = Math.PI; hinge.add(scr);
    glow("rgba(210,190,255,0)", 0.5, 0, 0.62, 0.06, hinge);

    /* books + mug */
    rbox(1.5, 0.2, 1.05, "#e8b25a", 0.1, 1.925, 2.1, 0.04);
    // const b2 = rbox(1.35, 0.18, 0.95, "#e0728f", 0.1, 2.115, 2.1, 0.04); b2.rotation.y = 0.15;
    // const b3 = rbox(1.2, 0.16, 0.9, "#e8b25a", 0.1, 2.285, 2.1, 0.04); b3.rotation.y = -0.1;
    cyl(0.26, 0.22, 0.4, "#fff0e8", 1.35, 2.025, 2.7);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI), mat("#fff0e8")); handle.position.set(1.62, 2.025, 2.7); handle.rotation.z = -Math.PI / 2; world.add(handle);

    /* lamp */
    const lamp = new THREE.Group(); lamp.position.set(2.4, 1.825, 2.0); world.add(lamp);
    cyl(0.45, 0.5, 0.1, "#6b52b8", 0, 0.05, 0, lamp);
    cyl(0.04, 0.04, 1.5, "#c9b3ff", 0, 0.85, 0, lamp);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 0.55, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffb066", emissiveIntensity: 1.2, side: THREE.DoubleSide })
    );
    shade.position.set(0, 1.75, 0);
    lamp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: "#fff1c4" }));
    bulb.position.set(0, 1.62, 0);
    lamp.add(bulb);
    glow("rgba(255,200,120,0.2)", 1.8, 2.4, 3.4, 1.8);

    /* ================= Mochi ================= */
    const mochi = new THREE.Group(); mochi.position.set(0, 2.55, -0.35); world.add(mochi);
    const cream = new THREE.MeshPhysicalMaterial({ color: "#f1ddd6", roughness: 0.65, sheen: 0.4, sheenColor: new THREE.Color("#ffd6ee"), sheenRoughness: 0.4 });
    const lav = new THREE.MeshStandardMaterial({ color: "#b79cf5", roughness: 0.6 });
    const ink = () => new THREE.MeshBasicMaterial({ color: "#2a1a6e" });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), cream); body.scale.set(1.08, 0.95, 0.98); mochi.add(body);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), cream); tuft.position.set(0, 0.93, 0.05); tuft.scale.set(1.3, 0.7, 1); mochi.add(tuft);

    const earG: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(s * 0.3, 0.92, -0.05); mochi.add(eg); earG.push(eg);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lav); ear.scale.set(0.2, 0.72, 0.11); ear.position.set(0, 0.62, 0); eg.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: "#e9dcff", roughness: 0.7 })); inner.scale.set(0.55, 0.78, 0.5); inner.position.z = 0.7; ear.add(inner);
    }

    const eyes = new THREE.Group(); mochi.add(eyes);
    const arcGeo = new THREE.TorusGeometry(0.15, 0.028, 8, 20, Math.PI);
    const eyeParts: { open: THREE.Group; happy: THREE.Mesh; closed: THREE.Mesh }[] = [];
    const brows: THREE.Mesh[] = [];
    const cheekMats: THREE.MeshBasicMaterial[] = [];
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 0.42, 0.14, 0.84); eyes.add(g);
      const open = new THREE.Group(); g.add(open);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.23, 28, 20), new THREE.MeshStandardMaterial({ color: "#2a1a6e", roughness: 0.25 })); ball.scale.set(1, 1.18, 0.5); open.add(ball);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshBasicMaterial({ color: "#5b3fd0" })); iris.position.set(0, -0.03, 0.06); iris.scale.set(1, 1.15, 0.4); open.add(iris);
      for (const [hx, hy, hr] of [[0.07, 0.11, 0.06], [-0.06, -0.09, 0.03]]) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 10), new THREE.MeshBasicMaterial({ color: "#fff" })); h.position.set(hx, hy, 0.13); open.add(h);
      }
      const happy = new THREE.Mesh(arcGeo, ink()); happy.position.set(0, -0.05, 0.1); g.add(happy);
      const closed = new THREE.Mesh(arcGeo, ink()); closed.rotation.z = Math.PI; closed.position.set(0, 0.06, 0.1); g.add(closed);
      eyeParts.push({ open, happy, closed });

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.045, 0.04), new THREE.MeshBasicMaterial({ color: "#6b4a7a" }));
      brow.position.set(s * 0.42, 0.46, 0.86); brow.rotation.z = -s * 0.35; brow.visible = false; mochi.add(brow); brows.push(brow);

      const cm = new THREE.MeshBasicMaterial({ color: "#ffa0c0", transparent: true, opacity: 0.65 }); cheekMats.push(cm);
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), cm); cheek.scale.y = 0.6; cheek.position.set(s * 0.7, -0.12, 0.68); cheek.rotation.y = s * 0.85; mochi.add(cheek);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: "#e98aa8" })); nose.position.set(0, -0.05, 0.96); mochi.add(nose);
    const mouthMat = new THREE.MeshBasicMaterial({ color: "#8a4a6e" });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14, Math.PI), mouthMat); smile.rotation.z = Math.PI; smile.position.set(0, -0.13, 0.95); mochi.add(smile);
    const frown = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 14, Math.PI), mouthMat); frown.position.set(0, -0.2, 0.95); frown.visible = false; mochi.add(frown);
    const openM = new THREE.Group(); openM.position.set(0, -0.15, 0.95); openM.visible = false; mochi.add(openM);
    const mo = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: "#7a2f55" })); mo.scale.y = 1.15; openM.add(mo);
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), new THREE.MeshBasicMaterial({ color: "#f27b8e" })); tongue.position.set(0, -0.05, 0.005); openM.add(tongue);

    const armL = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), cream); mochi.add(armL);
    const armR = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), cream); mochi.add(armR);
    for (const s of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), cream); foot.position.set(s * 0.52, -0.84, 0.55); foot.scale.set(1.2, 0.68, 1.1); mochi.add(foot);
    }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: "#8b5cf6", emissive: "#7c3aed", emissiveIntensity: 1.2, roughness: 0.2 }));
    gem.scale.set(0.9, 1.5, 0.6); gem.position.set(0, -0.5, 0.93); mochi.add(gem);
    const gemGlow = glow("rgba(170,120,255,0.9)", 0.4, 0, -0.5, 0.98, mochi);

    // tears
    const tears = [-1, 1].flatMap((s) => [0, 0.5].map((off) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshBasicMaterial({ color: "#9fdcff", transparent: true }));
      mesh.scale.y = 1.4; mesh.visible = false; mochi.add(mesh); return { mesh, x: s * 0.46, off };
    }));

    // hearts + sparkles when happy
    const heartTexs = [heartTex("#ff8fb8"), heartTex("#ffd36a"), heartTex("#c4a8ff")];
    const hearts = Array.from({ length: 16 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexs[i % 3], transparent: true, depthWrite: false }));
      s.visible = false; world.add(s); return { s, v: new THREE.Vector3(), life: 0 };
    });

    /* shadows on lit meshes */
    world.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && (mesh.material instanceof THREE.MeshStandardMaterial)) { mesh.castShadow = true; mesh.receiveShadow = true; }
    });
    floor.receiveShadow = true;

    /* camera / resize */
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => { ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = -((e.clientY / window.innerHeight) * 2 - 1); };
    window.addEventListener("pointermove", onMove);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight, a = w / h;
      renderer.setSize(w, h, false); camera.aspect = a; camera.updateProjectionMatrix();
            camBase.z = Math.min(32, Math.max(11, 10.4 / a + 2.9));   // always fits the whole desk, any screen shape
      world.position.x = 0;                                      // centered, no push to the right
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    /* animation */
    const base = { lx: -1, ly: -0.2, lz: 0.35, rx: 1, ry: -0.2, rz: 0.35, ear: 0.22, rotX: 0, rotY: 0.12, rotZ: 0, y: 0, blush: 0.65, as: 0.95 };
    const P = { ...base };
    let lastPulse = live.current.pulse, lastSpeech = live.current.speech, nodT = 0, talkT = 1.2, blinkAt = 2, heartT = 0, lookS = 0, raf = 0;
    const clock = new THREE.Clock();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      const pr = live.current, mood = pr.mood, k = 1 - Math.exp(-dt * 7);

      if (pr.pulse !== lastPulse) { lastPulse = pr.pulse; nodT = 1; }
      if (pr.speech !== lastSpeech) { lastSpeech = pr.speech; talkT = 1.1; }

      // target pose for the current mood
      const T = { ...base };
      switch (mood) {
        case "greet": // wave + little dance
          T.rx = 1.2 + Math.sin(t * 10) * 0.08 * m; T.ry = 0.72 + Math.sin(t * 10) * 0.2 * m;
          T.rotZ = Math.sin(t * 5) * 0.1 * m; T.y = Math.abs(Math.sin(t * 5)) * 0.14 * m; T.ear = 0.22 + Math.sin(t * 5) * 0.12 * m; T.rotY = 0; T.blush = 1; break;
        case "shy": // covers eyes
          T.lx = -0.34; T.ly = 0.15; T.lz = 0.95; T.rx = 0.34; T.ry = 0.15; T.rz = 0.95; T.as = 1.35; T.rotZ = Math.sin(t * 2) * 0.05 * m; T.rotX = 0.05; T.blush = 1; T.rotY = 0; break;
        case "sad": // wipes tears, droops
          T.lx = -0.55; T.ly = -0.02 + Math.sin(t * 7) * 0.05 * m; T.lz = 0.88; T.rx = 0.55; T.ry = -0.02 + Math.sin(t * 7 + 1) * 0.05 * m; T.rz = 0.88;
          T.as = 1.0; T.rotX = 0.28; T.ear = 1.0; T.y = -0.06; T.blush = 0.25; T.rotY = 0; break;
        case "happy": // cheers and jumps
          T.lx = -1.15; T.ly = 0.8 + Math.sin(t * 8) * 0.12 * m; T.lz = 0.2; T.rx = 1.15; T.ry = 0.8 + Math.sin(t * 8 + 1) * 0.12 * m; T.rz = 0.2;
          T.y = Math.abs(Math.sin(t * 6)) * 0.55 * m; T.rotZ = Math.sin(t * 3) * 0.12 * m; T.rotY = Math.sin(t * 2.2) * 0.4 * m; T.ear = 0.22 + Math.sin(t * 6) * 0.2 * m; T.blush = 1; break;
        case "listen": T.rotY = 0.3 + pr.look * 0.08; break;
        default: T.rotY = 0.12 + Math.sin(t * 0.5) * 0.05 * m;
      }
      (Object.keys(P) as (keyof typeof P)[]).forEach((key) => { P[key] += (T[key] - P[key]) * k; });

      // body
      nodT = Math.max(0, nodT - dt * 4);
      const nod = Math.sin((1 - nodT) * Math.PI) * 0.09 * (nodT > 0 ? 1 : 0);
      const breathe = Math.sin(t * 1.8) * 0.02 * m;
      const sy = 1 + breathe + (mood === "happy" ? Math.sin(t * 12) * 0.05 * m : 0) + (mood === "sad" ? Math.sin(t * 14) * 0.015 * m : 0);
      mochi.position.y = 2.55 + P.y + breathe;
      mochi.scale.set(1.15 / Math.sqrt(sy), 1.15 * sy, 1.15 / Math.sqrt(sy));
      mochi.rotation.set(P.rotX + nod, P.rotY, P.rotZ);
      armL.position.set(P.lx, P.ly, P.lz); armR.position.set(P.rx, P.ry, P.rz);
      armL.scale.set(P.as, 1.2, 1); armR.scale.set(P.as, 1.2, 1);
      earG.forEach((g, i) => { g.rotation.z = (i ? -1 : 1) * P.ear; }); // ears tilt outward
      cheekMats.forEach((c) => (c.opacity = P.blush));

      // eyes
      lookS += (pr.look - lookS) * 0.1; eyes.position.x = lookS * 0.045;
      const eyeMode = mood === "happy" ? "happy" : mood === "shy" ? "closed" : "open";
      if (eyeMode === "open" && t > blinkAt) { if (t > blinkAt + 0.13) blinkAt = t + 2 + Math.random() * 3.5; }
      const blinking = eyeMode === "open" && t > blinkAt - 0.0001 && t < blinkAt + 0.13;
      eyeParts.forEach((e) => {
        e.open.visible = eyeMode === "open"; e.happy.visible = eyeMode === "happy"; e.closed.visible = eyeMode === "closed";
        e.open.scale.set(mood === "sad" ? 1.12 : 1, blinking ? 0.1 : mood === "sad" ? 1.12 : 1, 1);
      });
      brows.forEach((b) => (b.visible = mood === "sad"));

      // mouth
      talkT -= dt;
      let mouth: "smile" | "open" | "frown" = "smile";
      if (mood === "sad") mouth = "frown"; else if (mood === "happy" || mood === "greet") mouth = "open"; else if (talkT > 0 && Math.sin(t * 18) > 0) mouth = "open";
      smile.visible = mouth === "smile"; frown.visible = mouth === "frown"; openM.visible = mouth === "open";

      // tears
      tears.forEach((tr) => {
        tr.mesh.visible = mood === "sad";
        const ph = (t * 0.9 + tr.off) % 1;
        tr.mesh.position.set(tr.x, 0.02 - ph * 0.75, 0.9);
        (tr.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - ph;
      });

      // hearts
      heartT -= dt;
      if (mood === "happy" && heartT <= 0) {
        heartT = 0.12;
        const h = hearts.find((x) => x.life <= 0);
        if (h) { h.life = 1; h.s.visible = true; h.s.scale.setScalar(0.3 + Math.random() * 0.25); h.s.position.set(mochi.position.x + (Math.random() - 0.5) * 2.6, mochi.position.y + 0.8, 0.8); h.v.set((Math.random() - 0.5) * 0.6, 1.2 + Math.random(), 0); }
      }
      hearts.forEach((h) => {
        if (h.life <= 0) return;
        h.life -= dt * 0.7; h.s.position.addScaledVector(h.v, dt); (h.s.material as THREE.SpriteMaterial).opacity = Math.max(0, h.life);
        if (h.life <= 0) h.s.visible = false;
      });

    //   gem.rotation.y = t * 1.1 * m; gemGlow.material.opacity = 0.7 + Math.sin(t * 2.4) * 0.25 * m;
    //   bokeh.forEach((b) => (b.s.material.opacity = 0.5 + Math.sin(t * 1.4 + b.p) * 0.3 * m));

      ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
      camera.position.set(ptr.sx * 0.4 * m, camBase.y + ptr.sy * 0.2 * m, camBase.z);
      camera.lookAt(0, 2.4, 0);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh; mesh.geometry?.dispose();
        const mt = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}