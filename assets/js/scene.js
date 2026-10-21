import * as THREE from "three";

/**
 * Ambient 3D scene: a breathing energy core, wireframe shell, orbit rings,
 * a drifting star field and one satellite per site section.
 *
 * Returns a controller. The page tells it about scroll progress, the active
 * section colour, and where section nodes are on screen (for HTML labels).
 */
export function createScene(canvas, { sections = [], ambient = false } = {}) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null; // no WebGL: CSS gradient fallback stays visible
  }
  const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 11);

  const rig = new THREE.Group();
  scene.add(rig);

  const uniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uColorA: { value: new THREE.Color("#8b7bff") },
    uColorB: { value: new THREE.Color("#4fe3d1") },
    uPixel: { value: DPR },
    uMouse: { value: new THREE.Vector2() },
  };

  /* ---------- core ---------- */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 96, 96),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPulse;
        varying vec3 vN; varying vec3 vV; varying float vD;
        void main() {
          vec3 p = position;
          float d = sin(p.x*2.6+uTime*.8) * sin(p.y*2.9+uTime*1.1) * sin(p.z*2.4+uTime*.6);
          d += .35 * sin(p.y*7.+uTime*1.7) * sin(p.x*6.-uTime*1.3);
          p += normal * d * (.16 + uPulse*.14);
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vD = d;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA; uniform vec3 uColorB; uniform float uPulse;
        varying vec3 vN; varying vec3 vV; varying float vD;
        void main() {
          float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.2);
          vec3 c = mix(uColorA, uColorB, smoothstep(-.4, .5, vD) * .8 + f * .3);
          float a = .16 + f * .95 + uPulse * .12;
          gl_FragColor = vec4(c * (.55 + f * 1.4), a);
        }`,
    })
  );
  rig.add(core);

  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.1, 2)),
    new THREE.LineBasicMaterial({ color: 0x8b7bff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  rig.add(shell);

  const inner = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.75, 1)),
    new THREE.LineBasicMaterial({ color: 0x4fe3d1, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  rig.add(inner);

  /* ---------- rings ---------- */
  const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = [3.6, 4.6, 5.8].map((r, i) => {
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const a = (k / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    ring.rotation.set(0.9 - i * 0.55, i * 0.7, i * 0.3);
    rig.add(ring);
    return ring;
  });

  /* ---------- stars ---------- */
  const N = coarse ? 900 : 2200;
  const pos = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 6 + Math.pow(Math.random(), 0.7) * 38;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.7, r * Math.cos(ph)], i * 3);
    size[i] = 0.6 + Math.random() * 1.8;
    seed[i] = Math.random();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const stars = new THREE.Points(
    starGeo,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSize; attribute float aSeed;
        uniform float uTime; uniform float uPixel; uniform vec2 uMouse;
        varying float vT; varying float vS;
        void main() {
          vec3 p = position;
          p += vec3(sin(uTime*.12+aSeed*40.), cos(uTime*.1+aSeed*30.), sin(uTime*.09+aSeed*20.)) * .35;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          vT = .5 + .5 * sin(uTime * (.6 + aSeed*1.8) + aSeed * 60.);
          vS = aSeed;
          gl_PointSize = aSize * uPixel * (34. / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA; uniform vec3 uColorB;
        varying float vT; varying float vS;
        void main() {
          float d = length(gl_PointCoord - .5);
          float a = smoothstep(.5, 0., d);
          a *= a;
          vec3 c = mix(vec3(1.), mix(uColorA, uColorB, vS), .55);
          gl_FragColor = vec4(c, a * (.25 + .75 * vT));
        }`,
    })
  );
  scene.add(stars);

  /* ---------- section satellites ---------- */
  const nodes = sections.map((s, i) => {
    const group = new THREE.Group();
    const color = new THREE.Color(s.hue);
    const body = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(body, halo);
    const a = (i / sections.length) * Math.PI * 2 + 0.4;
    const r = 4.1 + (i % 2) * 0.9;
    group.position.set(Math.cos(a) * r, Math.sin(a * 1.7) * 1.9, Math.sin(a) * r * 0.55);
    rig.add(group);
    return { group, body, halo, base: group.position.clone(), phase: i * 1.3, boost: 0, target: 0, id: s.id };
  });

  /* ---------- state ---------- */
  const state = {
    mx: 0, my: 0, tx: 0, ty: 0,
    progress: 0,         // 0 at top of page, 1 once hero is fully scrolled away
    pulse: 0,
    colorA: new THREE.Color("#8b7bff"),
    colorB: new THREE.Color("#4fe3d1"),
    visible: true,
    running: false,
    raf: 0,
  };
  const labelPos = new THREE.Vector3();
  let onProject = null;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the core framed on narrow screens
    camera.position.z = (w / h < 0.8 ? 15 : 11) + state.progress * 3;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  addEventListener("pointermove", (e) => {
    state.tx = (e.clientX / innerWidth) * 2 - 1;
    state.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener("pointerdown", () => { state.pulse = 1; }, { passive: true });

  const clock = new THREE.Clock();
  const tmp = new THREE.Color();

  function frame() {
    state.raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = (uniforms.uTime.value += reduceMotion ? 0 : dt);

    state.mx += (state.tx - state.mx) * 0.06;
    state.my += (state.ty - state.my) * 0.06;
    state.pulse *= 0.94;
    uniforms.uPulse.value = state.pulse;

    // ease palette toward the active section
    uniforms.uColorA.value.lerp(state.colorA, 0.04);
    uniforms.uColorB.value.lerp(state.colorB, 0.04);
    shell.material.color.copy(uniforms.uColorA.value);
    inner.material.color.copy(uniforms.uColorB.value);

    // rig follows pointer + scroll
    const p = state.progress;
    const aspect = innerWidth / innerHeight;
    const wide = aspect > 1.1;
    const portrait = !wide; // phones and tablets held upright: core in the upper-middle, hero copy right below it
    const restZ = aspect < 0.8 ? 15 : 11;
    const portraitY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * restZ * 0.13; // ~44% down the screen
    // wide screens: core + planets live in the right half so they never sit behind the hero copy
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 11 * aspect;
    const wideX = halfW * 0.3;
    const wideScale = Math.min(0.95, 0.45 + halfW * 0.05);
    rig.position.x += ((wide ? wideX : 0) - rig.position.x) * 0.06;
    rig.position.y += ((wide ? 0 : portraitY) - rig.position.y) * 0.06;
    rig.scale.setScalar(rig.scale.x + ((wide ? wideScale : 0.88) - rig.scale.x) * 0.06);
    rig.rotation.y += (state.mx * 0.5 + t * 0.05 - rig.rotation.y) * 0.04;
    rig.rotation.x += (state.my * 0.25 - rig.rotation.x) * 0.04;
    camera.position.z += ((restZ + p * 3) - camera.position.z) * 0.05;

    core.rotation.y = t * 0.12;
    shell.rotation.set(t * 0.07, t * 0.1, 0);
    inner.rotation.set(-t * 0.12, t * 0.08, t * 0.05);
    rings.forEach((r, i) => (r.rotation.y += dt * (0.05 + i * 0.03)));
    stars.rotation.y = t * 0.006 + state.mx * 0.04;
    stars.rotation.x = state.my * 0.03;

    nodes.forEach((n) => {
      n.boost += (n.target - n.boost) * 0.12;
      const s = 1 + n.boost * 0.9;
      n.group.scale.setScalar(s);
      n.group.position.y = n.base.y + Math.sin(t * 0.8 + n.phase) * 0.18;
      n.halo.material.opacity = 0.1 + n.boost * 0.25;
    });

    if (onProject) {
      rig.updateMatrixWorld();
      onProject(nodes.map((n) => {
        n.group.getWorldPosition(labelPos);
        const depth = labelPos.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()));
        labelPos.project(camera);
        return { id: n.id, x: (labelPos.x * 0.5 + 0.5) * innerWidth, y: (-labelPos.y * 0.5 + 0.5) * innerHeight, depth };
      }));
    }

    renderer.render(scene, camera);
  }

  function start() {
    if (state.running) return;
    state.running = true;
    clock.getDelta();
    frame();
  }
  function stop() {
    state.running = false;
    cancelAnimationFrame(state.raf);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : state.visible && start()));

  return {
    start,
    stop,
    setVisible(v) { state.visible = v; v && !document.hidden ? start() : stop(); },
    setProgress(p) { state.progress = p; },
    setHue(a, b) { state.colorA.set(a); state.colorB.set(b || a).offsetHSL(0.12, 0, 0); },
    hoverNode(id) { nodes.forEach((n) => (n.target = n.id === id ? 1 : 0)); },
    onProject(fn) { onProject = fn; },
    pulse() { state.pulse = 1; },
  };
}
