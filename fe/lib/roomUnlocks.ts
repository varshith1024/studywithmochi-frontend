import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const mat = (c: string, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = (color: string) => canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, color); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
}, false);
const easeOutBack = (u: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };

export type UnlockItems = { sync: (types: string[]) => void; update: (t: number, dt: number) => void };

export function createUnlockItems(world: THREE.Object3D, deskX = 3.6): UnlockItems {
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
  const groups = new Map<string, THREE.Group>(), anims = new Map<string, (t: number) => void>();
  const shown = new Set<string>(), pops = new Map<string, number>();
  let initialized = false, lastKey = "";

  const add = (type: string, x: number, y: number, z: number) => { const g = new THREE.Group(); g.position.set(x, y, z); g.visible = false; world.add(g); groups.set(type, g); return g; };
  const box = (p: THREE.Object3D, w: number, h: number, d: number, c: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.05, w / 2, h / 2, d / 2)), mat(c)); m.position.set(x, y, z); p.add(m); return m;
  };
  const cyl = (p: THREE.Object3D, rt: number, rb: number, h: number, c: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat(c)); m.position.set(x, y, z); p.add(m); return m;
  };
  const ball = (p: THREE.Object3D, rx: number, ry: number, rz: number, c: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat(c, 0.85)); m.scale.set(rx, ry, rz); m.position.set(x, y, z); p.add(m); return m;
  };
  const dot = (p: THREE.Object3D, r: number, c: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); p.add(m); return m;
  };
  const glow = (p: THREE.Object3D, color: string, size: number, x: number, y: number, z: number) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(size); s.position.set(x, y, z); p.add(s); return s;
  };

  /* ---- TINY_PLANT: smiling pot on the desk ---- */
  {
    const g = add("TINY_PLANT", deskX - 1.95, 1.8, -0.5);
    cyl(g, 0.21, 0.16, 0.3, "#f2a6b8", 0, 0.15, 0);
    const leaves = new THREE.Group(); leaves.position.set(0, 0.3, 0); g.add(leaves);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const l = ball(leaves, 0.09, 0.3, 0.05, i % 2 ? "#3b9560" : "#52b57a", Math.cos(a) * 0.1, 0.25, Math.sin(a) * 0.1); l.rotation.z = -Math.cos(a) * 0.6; l.rotation.x = Math.sin(a) * 0.6; }
    ball(leaves, 0.08, 0.08, 0.08, "#ff9fcb", 0, 0.52, 0);
    for (const s of [-1, 1]) { dot(g, 0.022, "#3b2a5e", s * 0.07, 0.18, 0.19); const b = ball(g, 0.04, 0.025, 0.01, "#ff8fb0", s * 0.12, 0.13, 0.18); b.material = new THREE.MeshBasicMaterial({ color: "#ff8fb0" }); }
    anims.set("TINY_PLANT", (t) => { leaves.rotation.z = Math.sin(t * 1.4) * 0.05 * rm; });
  }

  /* ---- ROOM_DECORATION: flag garland + hanging moon ---- */
  {
    const g = add("ROOM_DECORATION", -5.2, 5.9, -2.6);
    const pts: THREE.Vector3[] = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new THREE.Vector3(-2.2 + u * 4.4, -Math.sin(u * Math.PI) * 0.5, -0.15)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.012, 6, false), mat("#e9d5ff")));
    const tri = new THREE.Shape(); tri.moveTo(-0.17, 0); tri.lineTo(0.17, 0); tri.lineTo(0, -0.4); tri.closePath();
    const flagCols = ["#f9a8d4", "#c4b5fd", "#fde68a", "#a5f3fc", "#fdba74"];
    for (let i = 0; i < 11; i++) {
      const u = (i + 0.5) / 11, f = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: flagCols[i % 5], roughness: 0.9, side: THREE.DoubleSide }));
      f.position.set(-2.2 + u * 4.4, -Math.sin(u * Math.PI) * 0.5, -0.14); g.add(f);
    }
    const swing = new THREE.Group(); swing.position.set(1.5, -0.24, -0.1); g.add(swing);
    cyl(swing, 0.008, 0.008, 0.9, "#e9d5ff", 0, -0.45, 0);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({
      map: canvasTex(128, 128, (c) => { c.fillStyle = "#ffd36a"; c.beginPath(); c.arc(64, 64, 40, 0, 7); c.fill(); c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(80, 54, 36, 0, 7); c.fill(); }), transparent: true,
    }));
    moon.position.set(0, -1.1, 0.02); swing.add(moon); glow(swing, "rgba(255,220,130,0.55)", 1.6, 0, -1.1, 0);
    anims.set("ROOM_DECORATION", (t) => { swing.rotation.z = Math.sin(t * 1.1) * 0.07 * rm; });
  }

  /* ---- PET_FRIEND: sleepy cat on the armchair ---- */
  {
    const g = add("PET_FRIEND", -6.45, 1.52, -1.0), C = "#d99aa8";
    const body = new THREE.Group(); g.add(body);
    ball(body, 0.55, 0.3, 0.42, C, 0, 0.3, 0);
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 8, 20, Math.PI * 1.1), mat("#c7808f", 0.85)); tail.rotation.set(Math.PI / 2, 0, 0.4); tail.position.set(0, 0.17, 0.02); body.add(tail);
    const head = new THREE.Group(); head.position.set(-0.38, 0.42, 0.28); body.add(head);
    ball(head, 0.25, 0.21, 0.22, C, 0, 0, 0);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.17, 4), mat(C)); e.position.set(s * 0.14, 0.19, 0); head.add(e);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 10, Math.PI), new THREE.MeshBasicMaterial({ color: "#6a3a52" })); eye.rotation.z = Math.PI; eye.position.set(s * 0.1, 0.02, 0.2); head.add(eye);
    }
    dot(head, 0.02, "#f08aa0", 0, -0.04, 0.215);
    const zt = canvasTex(64, 64, (c) => { c.font = "700 44px sans-serif"; c.fillStyle = "#e9dcff"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("z", 32, 34); });
    const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthWrite: false })); g.add(s); return s; });
    anims.set("PET_FRIEND", (t) => {
      body.scale.y = 1 + Math.sin(t * 1.5) * 0.04 * rm;
      zs.forEach((s, i) => { const p = rm ? (t * 0.25 + i / 3) % 1 : i / 3; s.position.set(-0.38 + p * 0.3 + Math.sin(p * 6) * 0.05, 0.85 + p * 0.8, 0.3); s.material.opacity = Math.sin(p * Math.PI); s.scale.setScalar(0.15 + 0.12 * p); });
    });
  }

  /* ---- LIBRARY: two floating shelves ---- */
  {
    const g = add("LIBRARY", -5.7, 4.4, -2.7), bookCols = ["#7a5bc0", "#c4607a", "#e0a24a", "#6b57b0", "#3b9fb0", "#d9738a"];
    for (const y of [-0.5, 0.5]) box(g, 1.95, 0.08, 0.45, "#9a6246", 0, y, 0);
    [0, 1].forEach((row) => {
      const y0 = (row ? 0.5 : -0.5) + 0.04; let x = -0.85;
      for (let i = 0; i < 9; i++) { const h = 0.34 + rnd(row * 20 + i) * 0.2, w = 0.1 + rnd(row * 30 + i + 5) * 0.06; box(g, w, h, 0.3, bookCols[(i + row * 2) % 6], x + w / 2, y0 + h / 2, 0); x += w + 0.035; }
    });
    cyl(g, 0.04, 0.06, 0.1, "#c9a24a", 0.75, -0.41, 0); ball(g, 0.17, 0.17, 0.17, "#5ec2d1", 0.75, -0.22, 0);
    cyl(g, 0.09, 0.07, 0.12, "#d5805a", 0.75, 0.6, 0); ball(g, 0.1, 0.17, 0.1, "#3b9560", 0.75, 0.78, 0);
  }

  /* ---- GARDEN: flower box with butterflies ---- */
  {
    const g = add("GARDEN", 7.0, 0, -2.2);
    box(g, 1.3, 0.45, 0.6, "#b98a5e", 0, 0.225, 0); box(g, 1.18, 0.06, 0.48, "#4a3025", 0, 0.45, 0);
    const cols = ["#ff9fcb", "#ffd36a", "#ffffff", "#c4a8ff", "#ff8f8f", "#9bcbff", "#ffd59a"], flowers: THREE.Group[] = [];
    cols.forEach((c, i) => {
      const h = 0.45 + rnd(i + 3) * 0.45, f = new THREE.Group(); f.position.set(-0.52 + i * 0.175, 0.45, (rnd(i) - 0.5) * 0.2); g.add(f);
      cyl(f, 0.014, 0.014, h, "#4caf70", 0, h / 2, 0); ball(f, 0.12, 0.12, 0.06, c, 0, h + 0.02, 0.02); dot(f, 0.04, "#f6c453", 0, h + 0.02, 0.075); ball(f, 0.1, 0.04, 0.03, "#4caf70", 0.07, h * 0.45, 0); flowers.push(f);
    });
    const bf = [0, 1].map((i) => {
      const b = new THREE.Group(); g.add(b); const col = i ? "#9bcbff" : "#f9a8d4";
      const w1 = ball(b, 0.12, 0.09, 0.01, col, -0.1, 0, 0), w2 = ball(b, 0.12, 0.09, 0.01, col, 0.1, 0, 0); ball(b, 0.015, 0.07, 0.015, "#3b2a5e", 0, 0, 0);
      return { b, w1, w2, ph: i * 2.1 };
    });
    anims.set("GARDEN", (t) => {
      flowers.forEach((f, i) => { f.rotation.z = Math.sin(t * 1.2 + i) * 0.06 * rm; });
      bf.forEach(({ b, w1, w2, ph }) => {
        const tt = t * rm; b.position.set(Math.sin(tt * 0.7 + ph) * 1.0, 1.3 + Math.sin(tt * 1.3 + ph) * 0.35, 0.3 + Math.cos(tt * 0.6 + ph) * 0.35); b.rotation.z = Math.sin(tt * 2 + ph) * 0.3;
        const s = 0.35 + 0.65 * Math.abs(Math.sin(t * 14 * rm + ph)); w1.scale.x = 0.12 * s; w2.scale.x = 0.12 * s;
      });
    });
  }

  /* ---- NEW_AREA: magic door ---- */
  {
    const g = add("NEW_AREA", -3.6, 1.9, -2.8);
    const halo = glow(g, "rgba(190,150,255,0.8)", 5.2, 0, 0.2, 0.05);
    const tex = canvasTex(256, 512, (c) => {
      const W = 256, H = 512, arch = (i: number) => { c.beginPath(); c.moveTo(i, H - i); c.lineTo(i, 128); c.arc(128, 128, 128 - i, Math.PI, 0, false); c.lineTo(W - i, H - i); c.closePath(); };
      arch(6); c.fillStyle = "#f0d58c"; c.fill();
      arch(20); const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#a78bfa"); gr.addColorStop(1, "#5b3fd0"); c.fillStyle = gr; c.fill();
      c.strokeStyle = "rgba(255,255,255,0.16)"; c.lineWidth = 3; for (const x of [90, 128, 166]) { c.beginPath(); c.moveTo(x, 200); c.lineTo(x, H - 24); c.stroke(); }
      c.fillStyle = "#ffe9a8"; c.beginPath(); c.arc(128, 150, 34, 0, 7); c.fill(); c.strokeStyle = "#f0d58c"; c.lineWidth = 6; c.stroke();
      c.fillStyle = "#b07cf0"; c.font = "34px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("✦", 128, 152);
      c.fillStyle = "#f0d58c"; c.beginPath(); c.arc(190, 320, 12, 0, 7); c.fill();
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); door.position.set(0, 0, 0.04); g.add(door);
    const sp = [0, 1, 2].map((i) => glow(g, i % 2 ? "rgba(255,230,160,0.9)" : "rgba(220,190,255,0.9)", 0.3, 0, 0, 0.3));
    anims.set("NEW_AREA", (t) => {
      halo.material.opacity = 0.65 + Math.sin(t * 1.8) * 0.2 * rm;
      sp.forEach((s, i) => { const p = rm ? (t * 0.2 + i / 3) % 1 : i / 3; s.position.set(-0.9 + i * 0.9 + Math.sin(p * 8 + i) * 0.1, -1.4 + p * 3, 0.3); s.material.opacity = Math.sin(p * Math.PI); });
    });
  }

  groups.forEach((g) => g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material instanceof THREE.MeshStandardMaterial) { m.castShadow = true; m.receiveShadow = true; } }));

  /* sparkle burst when something new appears */
  const burstTex = glowTex("rgba(255,235,255,1)");
  const sparks = Array.from({ length: 24 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: burstTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.visible = false; world.add(s); return { s, v: new THREE.Vector3(), life: 0 }; });
  const burst = (x: number, y: number, z: number) => sparks.forEach((p, i) => {
    p.life = 1; p.s.visible = true; p.s.scale.setScalar(0.25 + rnd(i) * 0.3); p.s.position.set(x, y, z);
    const a = (i / sparks.length) * Math.PI * 2; p.v.set(Math.cos(a) * 1.6, 1.2 + rnd(i + 9) * 1.6, Math.sin(a) * 0.7);
  });

  return {
    sync(types) {
      const key = [...types].sort().join(","); if (key === lastKey) return; lastKey = key;
      const set = new Set(types);
      groups.forEach((g, type) => {
        const has = set.has(type);
        if (has && !shown.has(type)) {
          shown.add(type); g.visible = true;
          if (initialized) { g.scale.setScalar(0.001); pops.set(type, 0); burst(g.position.x, g.position.y + 0.6, g.position.z + 0.5); } else g.scale.setScalar(1);
        } else if (!has && shown.has(type)) { shown.delete(type); g.visible = false; pops.delete(type); }
      });
      initialized = true;
    },
    update(t, dt) {
      pops.forEach((age, type) => {
        const a = age + dt, u = Math.min(1, a / 0.9); groups.get(type)!.scale.setScalar(Math.max(0.001, easeOutBack(u)));
        if (u >= 1) pops.delete(type); else pops.set(type, a);
      });
      shown.forEach((type) => anims.get(type)?.(t));
      sparks.forEach((p) => { if (p.life <= 0) return; p.life -= dt * 1.1; p.v.y -= dt * 3; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = Math.max(0, p.life); if (p.life <= 0) p.s.visible = false; });
    },
  };
}