"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Props = { onMochiClick?: () => void };

/* ---------- canvas textures ---------- */
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return { c, g: c.getContext("2d")! };
}
function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function glowTexture(color: string) {
  const { c, g } = canvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, color); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function skyTexture() {
  const w = 600, h = 440;
  const { c, g } = canvas(w, h);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#232a86"); sky.addColorStop(1, "#141a5e");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`;
    g.beginPath(); g.arc(Math.random() * w, Math.random() * h * 0.6, Math.random() * 1.6 + 0.5, 0, 7); g.fill();
  }
  const halo = g.createRadialGradient(470, 90, 10, 470, 90, 100);
  halo.addColorStop(0, "rgba(200,190,255,0.5)"); halo.addColorStop(1, "rgba(200,190,255,0)");
  g.fillStyle = halo; g.fillRect(350, 0, 250, 230);
  g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(470, 90, 34, 0, 7); g.fill();
  g.fillStyle = "#1c2378"; g.beginPath(); g.arc(486, 80, 31, 0, 7); g.fill();
  let x = 0;
  while (x < w) {
    const bw = 50 + Math.random() * 60, bh = 80 + Math.random() * 130;
    g.fillStyle = "#171c66"; g.fillRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 14; wy < h - 10; wy += 26)
      for (let wx = x + 10; wx < x + bw - 10; wx += 22)
        if (Math.random() > 0.6) { g.fillStyle = "#ffc94d"; g.fillRect(wx, wy, 4, 5); }
    x += bw + 4;
  }
  return tex(c);
}
function woodTexture() {
  const { c, g } = canvas(512, 512);
  for (let y = 0; y < 8; y++) {
    const l = 20 + Math.random() * 6;
    g.fillStyle = `hsl(330 28% ${l}%)`; g.fillRect(0, y * 64, 512, 64);
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y * 64, 512, 2);
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(((y * 173) % 512), y * 64, 2, 64);
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
  return t;
}
function gridTexture() {
  const { c, g } = canvas(256, 256);
  g.fillStyle = "#b9685e"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 5;
  for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  return tex(c);
}

export default function MochiScene({ onMochiClick }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onMochiClick);
  clickRef.current = onMochiClick;

  useEffect(() => {
    const el = host.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2a1540");
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    const camBase = new THREE.Vector3(0, 3.4, 13);
    const look = new THREE.Vector3(0.6, 3.0, 0);

    const world = new THREE.Group();
    scene.add(world);

    /* helpers */
    const mat = (c: string, r = 0.75, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const rbox = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, rad = 0.12, parent: THREE.Object3D = world) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, Math.min(rad, w / 2, h / 2, d / 2)), mat(c));
      m.position.set(x, y, z); parent.add(m); return m;
    };
    const ell = (rx: number, ry: number, rz: number, c: string, x: number, y: number, z: number, parent: THREE.Object3D = world, r = 0.7) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(c, r));
      m.scale.set(rx, ry, rz); m.position.set(x, y, z); parent.add(m); return m;
    };
    const glow = (color: string, size: number, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.scale.setScalar(size); s.position.set(x, y, z); parent.add(s); return s;
    };

    /* lights */
    scene.add(new THREE.HemisphereLight("#d9c8ff", "#6a4580", 1.0));
    scene.add(new THREE.AmbientLight("#a58be0", 0.45));
    const key = new THREE.DirectionalLight("#ffe8d6", 1.4);
    key.position.set(4, 9, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -11, right: 13, top: 10, bottom: -4, near: 1, far: 30 });
    key.shadow.bias = -0.0006; key.shadow.radius = 4;
    scene.add(key);
    const windowLight = new THREE.PointLight("#8a9bff", 40, 16, 2); windowLight.position.set(3.9, 4.6, -1.2); world.add(windowLight);
    const lampLight = new THREE.PointLight("#ffb36b", 22, 11, 2); lampLight.position.set(-1.0, 3.4, -0.5); world.add(lampLight);
    const mochiLight = new THREE.PointLight("#d2a8ff", 2.5, 7, 2); world.add(mochiLight);

    /* room shell */
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 18), mat("#3a2050", 0.95)); wall.position.set(0, 7, -3); world.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 24), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 6); world.add(floor);
    rbox(44, 0.5, 0.15, "#2f1a40", 0, 0.25, -2.92, 0.05);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat("#3e2c7c", 0.95));
    rug.rotation.x = -Math.PI / 2; rug.scale.set(7.5, 3.6, 1); rug.position.set(1.8, 0.02, 0.2); world.add(rug);

    /* window + curtains */
    const wx = 3.9, wy = 4.7;
    rbox(5.5, 3.9, 0.25, "#8a5278", wx, wy, -2.9, 0.06);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.4), new THREE.MeshBasicMaterial({ map: skyTexture() }));
    glass.position.set(wx, wy, -2.76); world.add(glass);
    rbox(0.14, 3.4, 0.14, "#8a5278", wx, wy, -2.7, 0.03);
    rbox(5.0, 0.14, 0.14, "#8a5278", wx, wy, -2.7, 0.03);
    rbox(6.0, 0.22, 0.5, "#8a5278", wx, wy - 2.05, -2.7, 0.05);
    for (const s of [-1, 1]) {
      const cur = rbox(0.7, 4.4, 0.35, "#74406e", wx + s * 2.95, wy, -2.6, 0.15);
      cur.rotation.z = s * -0.03;
      ell(0.09, 0.09, 0.09, "#e8b4c8", wx + s * 2.95, wy - 0.3, -2.4);
    }

    /* shelf, books, plant (moved right, above the couch) */
    rbox(2.4, 0.16, 0.7, "#9a6246", -0.8, 5.4, -2.6, 0.04);
    ["#7a5bc0", "#c4607a", "#e0a24a"].forEach((c, i) =>
      rbox(0.3, 0.9 + (i % 2) * 0.3, 0.5, c, -1.7 + i * 0.36, 5.98 + (i % 2) * 0.15, -2.6, 0.03));
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.5, 20), mat("#d5805a")); pot.position.set(0.0, 5.73, -2.6); world.add(pot);
    for (let i = 0; i < 6; i++) {
      const l = ell(0.16, 0.55, 0.1, "#3b9560", 0.0 + (i - 2.5) * 0.14, 6.3 + (i % 2) * 0.12, -2.6);
      l.rotation.z = (i - 2.5) * 0.28;
    }

    /* picture frames */
    const frame = (x: number, y: number, w: number, h: number, c: string, art: string, rot: number) => {
      const f = rbox(w, h, 0.12, "#a8683f", x, y, -2.88, 0.04); f.rotation.z = rot;
      const a = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, h - 0.3), new THREE.MeshBasicMaterial({ color: c })); a.position.set(0, 0, 0.07); f.add(a);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: art })); dot.position.set(0.1, 0.15, 0.08); f.add(dot);
    };
    frame(-1.1, 4.2, 1.3, 1.5, "#2c3a8f", "#ffd36a", 0.04);
    frame(0.0, 3.85, 0.9, 1.1, "#f7c9b0", "#e86a8a", -0.03);

    /* hanging vine with fairy lights */
    const bulbs: { s: THREE.Sprite; phase: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const t = i / 23, x = -1.9 + Math.sin(t * 5) * 0.2 + (i % 2 ? 0.12 : -0.12), y = 5.3 - t * 2.0;
      const l = ell(0.1, 0.26, 0.05, i % 3 ? "#3b9560" : "#2c7a4e", x, y, -2.8); l.rotation.z = (i % 2 ? -1 : 1) * 0.6;
    }
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const x = i < 8 ? -1.9 + Math.sin(t * 9) * 0.25 : -1 + t * 8.5;
      const y = i < 8 ? 5.2 - t * 8 * 0.35 : 6.9 - Math.sin(t * Math.PI) * 0.5;
      const s = glow("rgba(255,222,140,1)", 0.32, x, y, -2.5); bulbs.push({ s, phase: Math.random() * 6 });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: "#fff0b8" })); core.position.set(x, y, -2.5); world.add(core);
    }

    /* couch */
    const cx = 1.9;
    rbox(6.6, 1.1, 2.0, "#c4695c", cx, 0.75, -1.3, 0.2);
    rbox(6.6, 1.8, 0.7, "#b55a50", cx, 2.2, -2.0, 0.3);
    for (const s of [-1, 1]) {
      rbox(0.8, 1.6, 2.0, "#a84f47", cx + s * 3.0, 1.6, -1.3, 0.3);
      rbox(0.2, 0.3, 0.2, "#6a3a30", cx + s * 3.0, 0.15, -0.5, 0.04);
    }
    rbox(2.6, 0.45, 1.5, "#d07a6c", cx - 1.35, 1.52, -0.95, 0.2);
    rbox(2.6, 0.45, 1.5, "#d07a6c", cx + 1.35, 1.52, -0.95, 0.2);
    const pillow = rbox(1.25, 1.25, 0.35, "#b9685e", cx - 1.7, 2.35, -1.55, 0.14);
    pillow.rotation.set(-0.12, 0.08, 0.06);
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: gridTexture() })); grid.position.z = 0.18; pillow.add(grid);

    /* ottoman + sleeping cat */
    rbox(1.6, 1.3, 1.4, "#7468b8", 1.2, 0.65, 0.2, 0.12);
    const catC = "#d99aa8";
    ell(0.8, 0.38, 0.55, catC, 1.15, 1.62, 0.2, world, 0.8);
    ell(0.34, 0.3, 0.3, catC, 1.8, 1.62, 0.4, world, 0.8);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), mat(catC)); e.position.set(1.8 + s * 0.17, 1.9, 0.4); e.rotation.y = Math.PI / 4; world.add(e);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 10, Math.PI), new THREE.MeshBasicMaterial({ color: "#6a3a52" })); eye.position.set(1.8 + s * 0.12, 1.64, 0.7); eye.rotation.z = Math.PI; world.add(eye);
    }
    [[0.45, 1.5, 0.35, 0.15], [0.25, 1.45, 0.55, 0.13], [0.3, 1.42, 0.78, 0.11]].forEach(([x, y, z, r]) => ell(r, r, r, catC, x, y, z, world, 0.8));

    /* dust */
    const dustN = 80, dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) dustPos.set([(Math.random() - 0.5) * 16 + 2, Math.random() * 8, -2 + Math.random() * 6], i * 3);
    const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    world.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.07, color: "#f3e3ff", transparent: true, opacity: 0.55, depthWrite: false })));

    /* ---------- Mochi ---------- */
    const BASE_Y = 2.85, BASE_S = 1.15;
    const mochi = new THREE.Group(); mochi.position.set(cx + 1.4, BASE_Y, -0.9); world.add(mochi);
    const cream = new THREE.MeshPhysicalMaterial({ color: "#f1ddd6", roughness: 0.65, sheen: 0.4, sheenColor: new THREE.Color("#ffd6ee"), sheenRoughness: 0.4 });
    const lav = new THREE.MeshStandardMaterial({ color: "#b79cf5", roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), cream); body.scale.set(1.08, 0.95, 0.98); mochi.add(body);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), cream); tuft.position.set(0, 0.93, 0.05); tuft.scale.set(1.3, 0.7, 1); mochi.add(tuft);
    const ears: THREE.Mesh[] = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lav);
      ear.scale.set(0.2, 0.72, 0.11); ear.position.set(s * 0.3, 1.5, -0.05); ear.rotation.z = -s * 0.22; mochi.add(ear); ears.push(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: "#e9dcff", roughness: 0.7 }));
      inner.scale.set(0.55, 0.78, 0.5); inner.position.z = 0.7; ear.add(inner);
    }
    const eyes = new THREE.Group(); mochi.add(eyes);
    const eyeParts: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Group(); eye.position.set(s * 0.42, 0.14, 0.84);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.23, 28, 20), new THREE.MeshStandardMaterial({ color: "#2a1a6e", roughness: 0.25 })); ball.scale.set(1, 1.18, 0.5); eye.add(ball);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshBasicMaterial({ color: "#5b3fd0" })); iris.position.set(0, -0.03, 0.06); iris.scale.set(1, 1.15, 0.4); eye.add(iris);
      for (const [hx, hy, hr] of [[0.07, 0.11, 0.06], [-0.06, -0.09, 0.03]]) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 10), new THREE.MeshBasicMaterial({ color: "#fff" })); h.position.set(hx, hy, 0.13); eye.add(h);
      }
      eyes.add(eye); eyeParts.push(eye);
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ color: "#ffa0c0", transparent: true, opacity: 0.65 }));
      cheek.scale.y = 0.6; cheek.position.set(s * 0.7, -0.12, 0.68); cheek.rotation.y = s * 0.85; mochi.add(cheek);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: "#e98aa8" })); nose.position.set(0, -0.05, 0.96); mochi.add(nose);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14, Math.PI), new THREE.MeshBasicMaterial({ color: "#8a4a6e" })); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.13, 0.95); mochi.add(mouth);
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), cream); arm.position.set(s * 1.0, -0.2, 0.35); arm.scale.set(0.95, 1.2, 1); mochi.add(arm);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), cream); foot.position.set(s * 0.52, -0.84, 0.55); foot.scale.set(1.2, 0.68, 1.1); mochi.add(foot);
    }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: "#8b5cf6", emissive: "#7c3aed", emissiveIntensity: 1.6, roughness: 0.2 }));
    gem.scale.set(0.9, 1.5, 0.6); gem.position.set(0, -0.5, 0.93); mochi.add(gem);
    const gemGlow = glow("rgba(170,120,255,0.9)", 0.4, 0, -0.5, 0.98, mochi);
    const hitTargets = [body, tuft, ...ears];

    const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(60,20,70,0.55)"), transparent: true, depthWrite: false }));
    shadowBlob.rotation.x = -Math.PI / 2; shadowBlob.position.set(cx + 1.4, 1.76, -0.85); world.add(shadowBlob);

    /* sparkles */
    const sparkTex = glowTexture("rgba(255,235,255,1)");
    const sparks: { s: THREE.Sprite; v: THREE.Vector3; life: number }[] = [];
    const burst = () => {
      for (let i = 0; i < 18; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        s.scale.setScalar(0.25 + Math.random() * 0.25);
        s.position.copy(mochi.position).add(new THREE.Vector3(0, 0.5, 0.8));
        const a = Math.random() * Math.PI * 2;
        sparks.push({ s, v: new THREE.Vector3(Math.cos(a) * 1.8, 1.6 + Math.random() * 2, Math.sin(a) * 0.8), life: 1 });
        world.add(s);
      }
    };

    /* shadows on every lit mesh */
    world.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !(m.material instanceof THREE.MeshBasicMaterial) && m !== wall && m !== rug) { m.castShadow = true; m.receiveShadow = true; }
    });
    wall.receiveShadow = true; rug.receiveShadow = true; floor.receiveShadow = true;

    /* interaction */
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let hovering = false, jumpT = 1;
    const hit = (e: PointerEvent | MouseEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObjects(hitTargets, false).length > 0;
    };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.y = -((e.clientY / window.innerHeight) * 2 - 1);
      const over = hit(e) && !(e.target as HTMLElement).closest("a,button");
      if (over !== hovering) { hovering = over; document.documentElement.style.cursor = over ? "pointer" : ""; }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button") || !hit(e)) return;
      jumpT = 0; burst(); clickRef.current?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("click", onClick);

    const CONTENT_W = 10.5;   // width of the room (couch + window + Mochi) in world units
const CONTENT_CX = 2.6;   // horizontal centre of that content

const resize = () => {
  const w = el.clientWidth, h = el.clientHeight, a = w / h;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, a < 1.1 ? 1.5 : 2)); // lighter on phones
  renderer.setSize(w, h, false);
  camera.aspect = a; camera.updateProjectionMatrix();
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  if (a < 1.1) {
    // PHONE PORTRAIT: fit room to screen width, park it in the lower part, text sits above
    world.position.set(0, 0, 0);
    const d = Math.max(13, CONTENT_W / (2 * tanH * a));
    const viewH = 2 * d * tanH;
    look.set(CONTENT_CX, viewH * 0.42, 0);
    camBase.set(CONTENT_CX, look.y + 0.4, d);
  } else if (a < 1.5) {
    // TABLET
    world.position.set(0, 0, 0);
    camBase.set(0, 3.4, 15.5);
    look.set(0.6, 3.0, 0);
  } else {
    // LAPTOP / PHONE LANDSCAPE (your original look)
    world.position.set(2.0, 0, 0);
    camBase.set(0, 3.4, 13);
    look.set(0.6, 3.0, 0);
  }
};
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    const clock = new THREE.Clock();
    let blinkAt = 2.5, raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, m = reduced ? 0 : 1;
      ptr.sx += (ptr.x - ptr.sx) * 0.06; ptr.sy += (ptr.y - ptr.sy) * 0.06;

      camera.position.set(camBase.x + ptr.sx * 0.5 * m, camBase.y + ptr.sy * 0.25 * m, camBase.z);
      camera.lookAt(look);

      const breathe = Math.sin(t * 1.8) * 0.02 * m;
      let y = 0, sy = 1 + breathe;
      if (jumpT < 1) {
        jumpT = Math.min(1, jumpT + dt / 0.85);
        y = Math.sin(Math.PI * jumpT) * 1.1;
        sy = jumpT < 0.15 ? 1 - 0.18 * (jumpT / 0.15) : 1 + 0.1 * Math.sin(Math.PI * jumpT);
      }
      mochi.position.y = BASE_Y + y;
      mochi.scale.set(BASE_S / Math.sqrt(sy), BASE_S * sy, BASE_S / Math.sqrt(sy));
      shadowBlob.scale.setScalar(1 - y * 0.25);
      mochi.rotation.y += (ptr.sx * 0.4 - mochi.rotation.y) * 0.08;
      mochi.rotation.x += (-ptr.sy * 0.1 - mochi.rotation.x) * 0.08;
      eyes.position.set(ptr.sx * 0.05, ptr.sy * 0.035, 0);
      ears.forEach((e, i) => { e.rotation.z = (i ? 1 : -1) * 0.22 + Math.sin(t * 1.4 + i) * 0.05 * m; });
      if (t > blinkAt) { eyeParts.forEach((e) => (e.scale.y = 0.1)); if (t > blinkAt + 0.13) { eyeParts.forEach((e) => (e.scale.y = 1)); blinkAt = t + 2.5 + Math.random() * 3; } }

      gem.rotation.y = t * 1.1 * m;
      gemGlow.material.opacity = 0.7 + Math.sin(t * 2.4) * 0.25 * m;
      mochiLight.position.set(mochi.position.x, mochi.position.y - 0.2, mochi.position.z + 1.8);
      bulbs.forEach((b) => (b.s.material.opacity = 0.75 + Math.sin(t * 1.6 + b.phase) * 0.25 * m));
      const p = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustN; i++) p.setY(i, (p.getY(i) + dt * 0.12 * m) % 8);
      p.needsUpdate = true;

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]; sp.life -= dt * 1.1;
        sp.v.y -= dt * 3; sp.s.position.addScaledVector(sp.v, dt);
        sp.s.material.opacity = Math.max(0, sp.life);
        if (sp.life <= 0) { world.remove(sp.s); sp.s.material.dispose(); sparks.splice(i, 1); }
      }
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      document.documentElement.style.cursor = "";
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mt = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}