import * as THREE from "three";

/**
 * Interstellar-style background: a Gargantua-like black hole.
 *
 * A full-screen fragment shader traces each pixel's light ray through a Schwarzschild
 * spacetime (Rs = 1), so the lensing is real: the disk's far side bends up over and under
 * the hole, a thin photon ring hugs the shadow, and the stars behind are stretched into arcs.
 * The accretion disk is a thin glowing plane (turbulent, differentially rotating, Doppler-
 * brightened on the approaching side).
 *
 * Same public API as before: start/stop/setVisible, setProgress, pulse; setHue, hoverNode and
 * onProject are kept as no-ops so existing pages keep working.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const FRAG = /* glsl */ `
  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uCenter;   // where the hole sits, in screen-height units from the screen centre
  uniform float uScale;    // 1 = default apparent size
  uniform vec2  uLook;     // camera yaw / elevation nudges (pointer parallax)
  uniform float uPulse;    // brief flare on click
  uniform vec2  uFade;     // darken the left (x) / bottom (y) so hero text stays readable
  uniform int   uSteps;
  varying vec2 vUv;

  const float BH_PI    = 3.14159265359;
  const float RIN   = 2.3;     // inner edge of the disk (in Schwarzschild radii)
  const float ROUT  = 8.5;     // outer edge
  const float CAMD  = 20.0;    // camera distance
  const int   MAXSTEPS = 160;

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float hash31(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
  }

  // value noise that repeats every 'per' cells along x (so it wraps around the disk)
  float pnoise(vec2 p, float per) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(vec2(mod(i.x, per), i.y));
    float b = hash21(vec2(mod(i.x + 1.0, per), i.y));
    float c = hash21(vec2(mod(i.x, per), i.y + 1.0));
    float d = hash21(vec2(mod(i.x + 1.0, per), i.y + 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec3 diskColor(float t) {
    vec3 c0 = vec3(0.30, 0.06, 0.015);
    vec3 c1 = vec3(1.00, 0.42, 0.10);
    vec3 c2 = vec3(1.00, 0.76, 0.42);
    vec3 c3 = vec3(1.00, 0.95, 0.84);
    if (t < 0.4)  return mix(c0, c1, t / 0.4);
    if (t < 0.75) return mix(c1, c2, (t - 0.4) / 0.35);
    return mix(c2, c3, (t - 0.75) / 0.25);
  }

  vec3 starfield(vec3 d, float t) {
    vec3 col = vec3(0.0);
    for (int L = 0; L < 2; L++) {
      float s = (L == 0) ? 70.0 : 150.0;
      float thr = (L == 0) ? 0.945 : 0.965;
      vec3 p = d * s;
      vec3 id = floor(p);
      vec3 f = fract(p);
      float present = step(thr, hash31(id));
      vec3 c = 0.2 + 0.6 * hash33(id + 17.0);
      float dist = length(f - c);
      float h = hash31(id + 3.7);
      float star = smoothstep(0.22, 0.0, dist) * present;
      float tw = 0.75 + 0.25 * sin(t * (1.5 + 3.0 * h) + h * 60.0);
      vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.84, 0.66), hash31(id + 9.1));
      col += tint * star * (0.55 + 1.4 * h) * tw * ((L == 0) ? 1.0 : 0.7);
    }
    // faint dust band of the galaxy
    vec3 axis = normalize(vec3(0.35, 1.0, 0.25));
    float b = dot(d, axis);
    float phi = atan(d.z, d.x);
    float haze = exp(-b * b * 16.0) * (0.35 + 0.65 * pnoise(vec2(phi / (2.0 * BH_PI) * 12.0, d.y * 7.0), 12.0));
    col += haze * 0.07 * vec3(0.62, 0.55, 0.62);
    return col;
  }

  void main() {
    vec2 uv = (vUv * uRes - 0.5 * uRes) / uRes.y;
    uv -= uCenter;

    // camera: slightly above the disk plane, looking at the hole
    float yaw = uLook.x;
    float el = 0.13 + uLook.y;
    vec3 ro = CAMD * vec3(sin(yaw) * cos(el), sin(el), cos(yaw) * cos(el));
    vec3 fwd = normalize(-ro);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);
    float f = 1.7 * uScale;
    vec3 rd = normalize(fwd * f + right * uv.x + up * uv.y);

    // trace the ray through curved space
    vec3 pos = ro;
    vec3 vel = rd;
    vec3 hv = cross(pos, vel);
    float h2 = dot(hv, hv);

    vec3 col = vec3(0.0);
    float trans = 1.0;
    bool escaped = false;

    for (int i = 0; i < MAXSTEPS; i++) {
      if (i >= uSteps) break;
      float r2 = dot(pos, pos);
      float r = sqrt(r2);
      if (r < 1.0) { trans = 0.0; break; }
      if (r > 45.0 && dot(pos, vel) > 0.0) { escaped = true; break; }

      float dt = clamp(0.05 * (r - 0.6), 0.03, 1.5);
      vec3 np = pos + vel * dt;

      // soft glow of hot gas around the hole
      col += trans * vec3(1.0, 0.52, 0.20) * (0.018 * dt / (r2 + 0.4)) * (1.0 + uPulse);

      // did the ray cross the disk plane this step?
      if (pos.y * np.y < 0.0) {
        float k = pos.y / (pos.y - np.y);
        vec3 hp = mix(pos, np, k);
        float rr = length(hp.xz);
        if (rr > RIN && rr < ROUT) {
          float edge = smoothstep(RIN, RIN + 0.35, rr) * (1.0 - smoothstep(ROUT - 2.6, ROUT, rr));
          float phi = atan(hp.z, hp.x);
          float ang = phi + uTime * 2.7 * pow(rr, -1.5);          // differential rotation
          float u = ang / (2.0 * BH_PI) * 24.0;
          float tex = 0.45 * pnoise(vec2(u, rr * 2.2), 24.0)
                    + 0.35 * pnoise(vec2(u * 2.0, rr * 5.0 + 3.1), 48.0)
                    + 0.20 * pnoise(vec2(u * 4.0, rr * 7.0), 96.0);
          float streak = 0.55 + 0.9 * tex;

          float temp = pow(RIN / rr, 0.75);
          vec3 tdir = normalize(vec3(-hp.z, 0.0, hp.x));
          float vorb = sqrt(0.5 / max(rr, 1.0));
          float beam = clamp(1.0 + 1.2 * vorb * dot(tdir, -normalize(vel)), 0.35, 1.9);
          float redshift = sqrt(max(1.0 - 1.0 / rr, 0.05));

          float inten = pow(temp, 2.2) * 2.4 * streak * beam * redshift * (1.0 + uPulse * 0.8);
          col += trans * edge * inten * diskColor(clamp(temp * beam * 0.9, 0.0, 1.0));
          trans *= 1.0 - edge * 0.93;
        }
      }

      // bend the light
      float nr2 = dot(np, np);
      vel += -1.5 * h2 * np / (nr2 * nr2 * sqrt(nr2)) * dt;
      pos = np;
    }

    if (escaped) col += trans * starfield(normalize(vel), uTime);

    // keep the hero copy readable: darken the left / bottom of the frame
    col *= 1.0 - uFade.x * (1.0 - smoothstep(0.34, 0.72, vUv.x)) * 0.8;
    col *= 1.0 - uFade.y * (1.0 - smoothstep(0.18, 0.46, vUv.y)) * 0.85;

    col = 1.0 - exp(-col * 1.15);          // soft tone-map
    col = pow(col, vec3(0.92));
    float vig = smoothstep(1.35, 0.35, length(vUv - 0.5) * 1.6);
    col *= mix(0.6, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createScene(canvas, { sections = [], ambient = false } = {}) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null; // no WebGL: the CSS backdrop stays
  }

  // the shader is heavy per pixel, so render below native resolution and let the browser upscale
  let quality = coarse ? 0.5 : Math.min(devicePixelRatio || 1, 1.25) * 0.55;
  const minQuality = 0.45;
  const steps = coarse ? 72 : 110;   // fewer steps = cheaper, slightly less accurate lensing

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: reduceMotion ? 4.0 : 0 },
    uCenter: { value: new THREE.Vector2(0, 0) },
    uScale: { value: 1 },
    uLook: { value: new THREE.Vector2(0, 0) },
    uPulse: { value: 0 },
    uFade: { value: new THREE.Vector2(0, 0) },
    uSteps: { value: steps },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.Camera();

  const state = {
    progress: 0, mx: 0, my: 0, tx: 0, ty: 0, pulse: 0, hover: null,
    cx: 0, cy: 0, scale: 1, fadeX: 0, fadeY: 0,
    visible: true, running: false, raf: 0, dirty: true, ema: 16, lastAdjust: 0,
  };

  function resize() {
    renderer.setPixelRatio(quality);
    renderer.setSize(innerWidth, innerHeight, false);
    const b = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uRes.value.copy(b);
    state.dirty = true;
  }
  addEventListener("resize", resize);
  resize();

  addEventListener("pointermove", (e) => {
    state.tx = (e.clientX / innerWidth) * 2 - 1;
    state.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener("pointerdown", () => { state.pulse = 1; state.dirty = true; }, { passive: true });

  /** Where the hole sits and how big it is, for the current window shape. */
  function layout(p) {
    const aspect = innerWidth / innerHeight;
    if (aspect > 1.1) {
      // wide: hole in the right half, hero copy on the left
      return { cx: (0.23 + 0.02 * p) * aspect, cy: 0.0, scale: Math.min(0.74, 0.4 + aspect * 0.18), fx: 1, fy: 0 };
    }
    // upright: hole above, hero copy below
    return { cx: 0, cy: 0.17 + 0.07 * p, scale: Math.min(0.95, Math.max(0.5, aspect * 1.25)), fx: 0, fy: 1 };
  }

  let last = performance.now();
  function frame(now) {
    state.raf = requestAnimationFrame(frame);
    const dtMs = now - last;
    last = now;
    const dt = Math.min(dtMs / 1000, 0.05);

    // keep the frame rate healthy on weak GPUs: lower the render resolution
    state.ema = state.ema * 0.94 + Math.min(dtMs, 100) * 0.06;
    if (!reduceMotion && state.ema > 45 && quality > minQuality && now - state.lastAdjust > 4000) {
      quality = Math.max(minQuality, quality * 0.88);
      state.lastAdjust = now;
      resize();
    }

    state.mx += (state.tx - state.mx) * 0.05;
    state.my += (state.ty - state.my) * 0.05;
    state.pulse *= 0.95;

    const L = layout(state.progress);
    const k = 0.07;
    state.cx += (L.cx - state.cx) * k;
    state.cy += (L.cy - state.cy) * k;
    state.scale += (L.scale - state.scale) * k;
    state.fadeX += (L.fx - state.fadeX) * k;
    state.fadeY += (L.fy - state.fadeY) * k;

    if (!reduceMotion) uniforms.uTime.value += dt;
    uniforms.uPulse.value = state.pulse;
    uniforms.uCenter.value.set(state.cx + state.mx * 0.012, state.cy - state.my * 0.01);
    uniforms.uScale.value = state.scale;
    uniforms.uLook.value.set(state.mx * 0.12, -state.my * 0.045);
    uniforms.uFade.value.set(ambient ? 0 : state.fadeX, ambient ? 0 : state.fadeY);

    if (!reduceMotion || state.dirty) {
      renderer.render(scene, camera);
      state.dirty = false;
    }
  }

  function start() {
    if (state.running) return;
    state.running = true;
    last = performance.now();
    state.raf = requestAnimationFrame(frame);
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
    setProgress(p) { state.progress = p; state.dirty = true; },
    setHue() {},                       // the black hole keeps its own palette
    hoverNode() {},                    // section links no longer float over the scene
    onProject() {},
    pulse() { state.pulse = 1; state.dirty = true; },
  };
}
