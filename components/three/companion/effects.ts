import * as THREE from 'three';

// Imperative three.js effects for the companion helicopter. Everything here is
// procedural (canvas textures, small shaders): no extra downloads.

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Light-like blending for a transparent canvas laid over the page: adds colour
 * (premultiplied) but leaves the canvas alpha alone, so glows brighten the page
 * underneath instead of covering it with a dark, opaque patch.
 */
function glow<M extends THREE.Material>(m: M): M {
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  m.premultipliedAlpha = true; // built-in materials output rgb * alpha
  m.transparent = true;
  m.depthWrite = false;
  return m;
}

const radial = (stops: [number, string][]) =>
  canvasTexture(128, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });

// ---------------------------------------------------------------------------
// Rotor motion-blur discs (model space, children of the rotor hubs' parent)

export function makeRotorDisc(radius: number) {
  const tex = canvasTexture(256, (g, s) => {
    const c = s / 2;
    const grad = g.createRadialGradient(c, c, s * 0.04, c, c, c);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.12, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.85, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.97, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    // faint concentric streaks
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    for (let r = s * 0.15; r < c; r += s * 0.035) {
      g.beginPath();
      g.arc(c, c, r, 0, Math.PI * 2);
      g.stroke();
    }
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: '#bfffb0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), mat);
  mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------------------
// Navigation strobes (model space)

const glowTex = () => radial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.85)'], [0.45, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);

export function makeStrobe(color: string) {
  const mat = glow(new THREE.SpriteMaterial({ map: glowTex(), color, opacity: 0 }));
  const s = new THREE.Sprite(mat);
  s.renderOrder = 3;
  return s;
}

// ---------------------------------------------------------------------------
// Searchlight cone + ground spot (screen space, px)

const coneVert = /* glsl */ `
  attribute vec2 aUv;
  varying vec2 vUv;
  void main() { vUv = aUv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const coneFrag = /* glsl */ `
  uniform float uStrength;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float across = pow(1.0 - abs(vUv.x), 1.6);
    float along = mix(0.95, 0.35, vUv.y) * smoothstep(0.0, 0.06, vUv.y);
    float dust = 0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 3.0 + vUv.x * 6.0);
    gl_FragColor = vec4(vec3(0.55, 1.0, 0.45) * across * along * dust * uStrength * 0.34, 1.0);
  }
`;

export function makeSearchlight() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  geo.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]), 2));
  geo.setIndex([0, 2, 1, 1, 2, 3]);
  const uniforms = { uStrength: { value: 0 }, uTime: { value: 0 } };
  const cone = new THREE.Mesh(
    geo,
    glow(new THREE.ShaderMaterial({ uniforms, vertexShader: coneVert, fragmentShader: coneFrag }))
  );
  cone.frustumCulled = false;
  cone.renderOrder = -2;

  const spotMat = glow(
    new THREE.MeshBasicMaterial({
      map: radial([[0, 'rgba(200,255,180,0.9)'], [0.4, 'rgba(170,255,150,0.35)'], [1, 'rgba(170,255,150,0)']]),
      opacity: 0,
    })
  );
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), spotMat);
  spot.renderOrder = -2;

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const group = new THREE.Group();
  group.add(cone, spot);
  return {
    group,
    /** Origin and target in scene px (y up); widths in px. */
    update(ox: number, oy: number, tx: number, ty: number, strength: number, t: number) {
      const on = strength > 0.01;
      group.visible = on;
      if (!on) return;
      const dx = tx - ox, dy = ty - oy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const w0 = 5, w1 = Math.min(150, 40 + len * 0.18);
      pos.setXYZ(0, ox - nx * w0, oy - ny * w0, 0);
      pos.setXYZ(1, ox + nx * w0, oy + ny * w0, 0);
      pos.setXYZ(2, tx - nx * w1, ty - ny * w1, 0);
      pos.setXYZ(3, tx + nx * w1, ty + ny * w1, 0);
      // (the group sits behind the helicopter in depth, so the hull hides the beam's root)
      pos.needsUpdate = true;
      geo.computeBoundingSphere();
      uniforms.uStrength.value = strength;
      uniforms.uTime.value = t;
      spot.position.set(tx, ty, 0);
      spot.scale.set(w1 * 2.4, w1 * 0.9, 1);
      spotMat.opacity = strength * 0.55;
    },
  };
}

// ---------------------------------------------------------------------------
// Soft ground shadow (screen space)

export function makeShadow() {
  const mat = new THREE.MeshBasicMaterial({
    map: radial([[0, 'rgba(0,0,0,0.85)'], [0.5, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]),
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = -3;
  return mesh;
}

// ---------------------------------------------------------------------------
// Dust kicked up by the downwash + faint airborne motes pushed by rotor wash

const MOTES = 36;
const DUST = 140;

const pointsVert = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const pointsFrag = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vec3(0.78, 1.0, 0.7) * a, a);
  }
`;

export function makeParticles(pixelRatio: number) {
  const N = MOTES + DUST;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 2);
  const life = new Float32Array(N); // dust: seconds left; motes: unused
  const maxLife = new Float32Array(N);
  const alpha = new Float32Array(N);
  const size = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const points = new THREE.Points(
    geo,
    Object.assign(glow(new THREE.ShaderMaterial({ vertexShader: pointsVert, fragmentShader: pointsFrag })), { depthTest: false })
  );
  points.frustumCulled = false;
  points.renderOrder = 4;

  let seeded = false;
  let spawnDebt = 0;
  let next = MOTES;

  const seedMote = (i: number, W: number, H: number) => {
    pos[i * 3] = (Math.random() - 0.5) * W;
    pos[i * 3 + 1] = (Math.random() - 0.5) * H;
    vel[i * 2] = (Math.random() - 0.5) * 8;
    vel[i * 2 + 1] = (Math.random() - 0.5) * 6;
    size[i] = (1 + Math.random() * 1.6) * pixelRatio;
  };

  return {
    points,
    /** Heli at (hx, hy) scene px with rotor radius r; ground at gy (scene px) with dust strength d. Returns true while dust is alive. */
    update(dt: number, W: number, H: number, hx: number, hy: number, r: number, gy: number | null, d: number, wash: number) {
      if (!seeded) {
        for (let i = 0; i < MOTES; i++) seedMote(i, W, H);
        seeded = true;
      }
      // Airborne motes: slow drift; pushed outward and down inside the rotor wash.
      for (let i = 0; i < MOTES; i++) {
        const ix = i * 3, iv = i * 2;
        const dx = pos[ix] - hx, dy = pos[ix + 1] - hy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = r * 1.8;
        if (dist < reach) {
          const f = (1 - dist / reach) * 900 * wash * dt;
          vel[iv] += (dx / dist) * f;
          vel[iv + 1] += (dy / dist) * f - f * 0.6;
        }
        vel[iv] *= 1 - 1.2 * dt;
        vel[iv + 1] *= 1 - 1.2 * dt;
        pos[ix] += (vel[iv] + Math.sin(i * 1.7 + hx * 0.001) * 3) * dt;
        pos[ix + 1] += vel[iv + 1] * dt;
        if (Math.abs(pos[ix]) > W * 0.55 || Math.abs(pos[ix + 1]) > H * 0.55) seedMote(i, W, H);
        // Only visible around the helicopter (they read as dust caught in its lights / wash).
        alpha[i] = 0.3 * Math.max(0, Math.min(1, (r * 3.2 - dist) / (r * 2)));
      }

      // Dust: spawned at the ground under the rotor, thrown outward by the downwash.
      let alive = false;
      const height = gy === null ? Infinity : hy - gy; // scene y is up
      const kick = gy === null ? 0 : d * Math.max(0, 1 - height / (r * 3.2));
      spawnDebt += kick * 160 * dt;
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        const i = next;
        next = next + 1 >= MOTES + DUST ? MOTES : next + 1;
        const side = Math.random() < 0.5 ? -1 : 1;
        pos[i * 3] = hx + side * Math.random() * r * 0.7;
        pos[i * 3 + 1] = (gy ?? 0) + Math.random() * 6;
        vel[i * 2] = side * (120 + Math.random() * 320) * (0.6 + kick);
        vel[i * 2 + 1] = 15 + Math.random() * 70;
        maxLife[i] = life[i] = 0.7 + Math.random() * 0.9;
        size[i] = (1.5 + Math.random() * 3) * pixelRatio;
      }
      for (let i = MOTES; i < MOTES + DUST; i++) {
        if (life[i] <= 0) {
          alpha[i] = 0;
          continue;
        }
        alive = true;
        life[i] -= dt;
        const iv = i * 2;
        vel[iv] *= 1 - 1.6 * dt;
        vel[iv + 1] -= 60 * dt;
        pos[i * 3] += vel[iv] * dt;
        pos[i * 3 + 1] = Math.max((gy ?? 0) - 4, pos[i * 3 + 1] + vel[iv + 1] * dt);
        const k = life[i] / maxLife[i];
        alpha[i] = Math.sin(Math.PI * k) * 0.55;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      return alive;
    },
  };
}

// ---------------------------------------------------------------------------
// Engine-heat shimmer above the exhaust (model space). There is no screen
// refraction pass on the shared canvas, so this is a faint, rippling haze.

const shimmerFrag = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float wave = sin(vUv.y * 38.0 - uTime * 11.0 + sin(vUv.x * 5.0 + uTime * 3.0) * 0.8) * sin(vUv.x * 17.0 + uTime * 2.0);
    float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x) * smoothstep(1.0, 0.1, vUv.y) * smoothstep(0.0, 0.08, vUv.y);
    float a = (0.5 + 0.5 * wave) * edge * uStrength * 0.07;
    gl_FragColor = vec4(vec3(0.85, 1.0, 0.8) * a, a);
  }
`;

export function makeShimmer() {
  const uniforms = { uTime: { value: 0 }, uStrength: { value: 1 } };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.34),
    glow(
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: shimmerFrag,
        side: THREE.DoubleSide,
      })
    )
  );
  mesh.renderOrder = 2;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------------------
// Crew silhouettes on the outboard benches (basic shapes, model space)

export function makeCrew(material: THREE.Material) {
  const group = new THREE.Group();
  group.name = 'crew';
  const torso = new THREE.CapsuleGeometry(0.05, 0.1, 4, 8);
  const head = new THREE.SphereGeometry(0.045, 10, 8);
  const leg = new THREE.CapsuleGeometry(0.022, 0.16, 3, 6);
  // Two operators per side, sitting on the pods (z = ±0.41 around the body centre line), legs over the side.
  const zc = -0.036;
  for (const side of [1, -1]) {
    for (const x of [0.06, 0.32]) {
      const op = new THREE.Group();
      op.position.set(x, -0.2, zc + side * 0.4);
      const t = new THREE.Mesh(torso, material);
      t.position.set(0, 0.04, 0);
      t.rotation.x = side * 0.18;
      const h = new THREE.Mesh(head, material);
      h.position.set(0.01, 0.16, side * 0.02);
      op.add(t, h);
      for (const dx of [-0.03, 0.03]) {
        const l = new THREE.Mesh(leg, material);
        l.position.set(dx, -0.1, side * 0.07);
        l.rotation.x = side * 0.5;
        op.add(l);
      }
      group.add(op);
    }
  }
  return group;
}

// ---------------------------------------------------------------------------
// Tail number decal on both sides of the rear fuselage

export function makeTailNumber(text: string, placeholder: boolean) {
  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const g = c.getContext('2d')!;
    g.font = '700 84px "JetBrains Mono", ui-monospace, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = placeholder ? 'rgba(255,176,32,0.95)' : 'rgba(232,228,217,0.92)';
    g.fillText(text, 256, 68, 490);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  })();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const geo = new THREE.PlaneGeometry(0.3, 0.075);
  const group = new THREE.Group();
  group.name = 'tail_number';
  const right = new THREE.Mesh(geo, mat); // starboard (+Z), reads left to right from that side
  right.position.set(-0.27, 0.06, 0.13);
  const left = new THREE.Mesh(geo, mat);
  left.position.set(-0.27, 0.06, -0.2);
  left.rotation.y = Math.PI;
  group.add(right, left);
  return group;
}
