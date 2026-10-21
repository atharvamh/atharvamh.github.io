import { profile, sections, notes, trips, projects, lab } from "/assets/js/content.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export { $, $$, esc };

const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- header + footer ---------- */
export function mountChrome({ home = false } = {}) {
  const base = home ? "" : "/";
  const header = document.createElement("header");
  header.className = "bar";
  header.innerHTML = `
    <a class="brand" href="/" aria-label="${esc(profile.name)} - home"><span class="brand-mark"></span><span>${esc(profile.handle)}</span></a>
    <nav class="bar-nav" aria-label="Primary">
      ${sections.map((s) => `<a href="${base}#${s.id}" data-nav="${s.id}">${esc(s.label)}</a>`).join("")}
    </nav>
    <button class="kbd-btn" type="button" data-open-palette aria-label="Open command menu"><span>Search</span><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd></button>`;
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "foot";
  footer.innerHTML = `
    <div class="wrap foot-in">
      <span>© ${new Date().getFullYear()} ${esc(profile.name)} · <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a></span>
      <span class="foot-links">${profile.links.map((l) => `<a href="${esc(l.href)}" rel="me noopener">${esc(l.label)}</a>`).join("")}</span>
    </div>`;
  document.body.append(footer);

  let last = 0;
  addEventListener("scroll", () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    header.classList.toggle("is-hidden", y > last && y > 400);
    last = y;
  }, { passive: true });
}

/* ---------- scroll reveal ---------- */
export function reveal() {
  const els = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e, i) => { e.style.setProperty("--d", `${(i % 6) * 60}ms`); io.observe(e); });
}

/* ---------- pointer glow, card spotlight, tilt, magnet ---------- */
export function interactions() {
  if (!fine) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.append(glow);
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => glow.classList.remove("on"));
  (function loop() {
    gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".card, .row");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (card.classList.contains("tilt") && !reduce) {
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateZ(0)`;
    }
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest?.(".tilt");
    if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
  });

  $$("[data-magnet]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

/* ---------- command palette (⌘K / Ctrl+K, or "/") ---------- */
export function palette() {
  const items = [
    ...sections.map((s) => ({ group: "Go to", label: s.label, hint: "section", href: location.pathname === "/" ? `#${s.id}` : `/#${s.id}` })),
    { group: "Go to", label: "Resume (printable)", hint: "page", href: "/resume/" },
    { group: "Go to", label: "All notes", hint: "page", href: "/engineering-notes/" },
    { group: "Go to", label: "All trips", hint: "page", href: "/trips/" },
    ...notes.filter((n) => !n.draft).map((n) => ({ group: "Notes", label: n.title, hint: n.tags.join(", "), href: `/engineering-notes/${n.slug}/` })),
    ...trips.filter((t) => !t.draft).map((t) => ({ group: "Trips", label: t.title, hint: t.where, href: `/trips/${t.slug}/` })),
    ...projects.filter((p) => p.href).map((p) => ({ group: "Projects", label: p.title, hint: p.stack.join(", "), href: p.href, ext: true })),
    ...lab.map((l) => ({ group: "Lab", label: l.title, hint: "interactive", href: l.href })),
    ...profile.links.map((l) => ({ group: "Elsewhere", label: l.label, hint: "external", href: l.href, ext: true })),
  ];

  const dlg = document.createElement("dialog");
  dlg.className = "palette";
  dlg.setAttribute("aria-label", "Command menu");
  dlg.innerHTML = `
    <div class="pal-in">
      <input type="text" placeholder="Jump to a section, note, trip, project…" aria-label="Search" autocomplete="off" spellcheck="false" />
      <ul role="listbox"></ul>
      <div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
    </div>`;
  document.body.append(dlg);
  const input = $("input", dlg), list = $("ul", dlg);
  let shown = [], idx = 0;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = items.filter((i) => !q || `${i.label} ${i.hint} ${i.group}`.toLowerCase().includes(q));
    idx = Math.min(idx, Math.max(shown.length - 1, 0));
    let g = "";
    list.innerHTML = shown.length
      ? shown.map((i, n) => {
          const head = i.group !== g ? `<li class="pal-group" role="presentation">${esc((g = i.group))}</li>` : "";
          return `${head}<li role="option" data-i="${n}" aria-selected="${n === idx}"><span>${esc(i.label)}</span><small>${esc(i.hint)}</small></li>`;
        }).join("")
      : `<li class="pal-empty">Nothing matches “${esc(input.value)}”.</li>`;
    $('[aria-selected="true"]', list)?.scrollIntoView({ block: "nearest" });
  };
  const go = (i) => {
    if (!i) return;
    dlg.close();
    if (i.ext) window.open(i.href, "_blank", "noopener");
    else location.href = i.href;
  };

  const open = () => { input.value = ""; idx = 0; render(); dlg.showModal(); input.focus(); };
  input.addEventListener("input", () => { idx = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { idx = Math.min(idx + 1, shown.length - 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { idx = Math.max(idx - 1, 0); render(); e.preventDefault(); }
    else if (e.key === "Enter") go(shown[idx]);
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) go(shown[+li.dataset.i]); });
  list.addEventListener("pointermove", (e) => {
    const li = e.target.closest("[data-i]");
    if (li && +li.dataset.i !== idx) { idx = +li.dataset.i; $$("[data-i]", list).forEach((x) => x.setAttribute("aria-selected", x === li)); }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  addEventListener("keydown", (e) => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (e.key === "/" && !typing && !dlg.open) { e.preventDefault(); open(); }
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-open-palette]")) open(); });
}

/* ---------- 3D background bootstrap shared by every page ---------- */
export async function mountScene({ ambient = false, hero = null, opacity = 0.55 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.id = "scene";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  let api = null;
  try {
    const { createScene } = await import("/assets/js/scene.js");
    api = createScene(canvas, { sections, ambient });
  } catch (err) {
    console.warn("3D scene unavailable, falling back to static background.", err);
  }
  if (!api) { canvas.remove(); document.documentElement.classList.add("no-3d"); return null; }

  document.documentElement.classList.add("has-3d");
  api.setHue(sections[0].hue, sections[1].hue);
  api.start();

  addEventListener("scroll", () => {
    const h = hero ? hero.offsetHeight : innerHeight;
    const p = Math.min(Math.max(scrollY / (h * 0.9), 0), 1);
    api.setProgress(ambient ? 1 : p);
    canvas.style.opacity = String(ambient ? opacity : 1 - p * (innerWidth < 760 ? 0.78 : 0.45)); // phones: fade harder so body text stays readable
  }, { passive: true });
  dispatchEvent(new Event("scroll"));
  return api;
}

export function boot({ home = false } = {}) {
  mountChrome({ home });
  palette();
  interactions();
  reveal();
}
