import { profile, projects, notes, trips, lab, resume, sections } from "/assets/js/content.js";
import { $, $$, esc, boot, mountScene } from "/assets/js/ui.js";

const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const arrow = `<svg class="arr" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const wrapTag = (href, cls, inner, ext) =>
  href ? `<a data-reveal class="${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>` : `<div data-reveal class="${cls} is-soon">${inner}</div>`;

/* ---------- render content ---------- */
function render() {
  // no projects yet: drop the Build section, point the hero CTA at the notes, renumber the rest
  if (!projects.length) {
    $("#build")?.remove();
    const cta = $("#hero-cta");
    if (cta) { cta.href = "#notes"; cta.textContent = "Read my notes"; }
  }
  $$("section.s .eyebrow").forEach((el, i) => { el.textContent = el.textContent.replace(/^\d+/, String(i + 1).padStart(2, "0")); });

  const h1 = $("#hero-name");
  h1.setAttribute("aria-label", profile.name);
  h1.innerHTML = profile.name.split(" ").map((w, wi) =>
    `<span class="word" aria-hidden="true">${[...w].map((c, i) => `<span class="ch" style="--i:${wi * 6 + i}">${esc(c)}</span>`).join("")}</span>`
  ).join(" ");
  $("#hero-tag").textContent = profile.tagline;

  $("#about-body").innerHTML = profile.about.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#about-facts").innerHTML = profile.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  if (projects.length) $("#build-grid").innerHTML = projects.map((p) =>
    wrapTag(p.href, "card tilt", `
      <div class="card-top"><span class="chip">${esc(p.year)}</span>${p.href ? arrow : `<span class="soon">${p.draft ? "soon" : "private"}</span>`}</div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.blurb)}</p>
      <ul class="tags">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`, true)
  ).join("");

  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  $("#notes-list").innerHTML = sorted.map((n) =>
    wrapTag(n.draft ? null : `/engineering-notes/${n.slug}/`, "row", `
      <time datetime="${n.date}">${fmtDate(n.date)}</time>
      <span class="row-main"><strong>${esc(n.title)}</strong><span>${esc(n.blurb)}</span></span>
      <span class="row-end">${n.draft ? '<span class="soon">soon</span>' : arrow}</span>`)
  ).join("");

  $("#trips-grid").innerHTML = trips.map((t) =>
    wrapTag(t.draft ? null : `/trips/${t.slug}/`, "card trip", `
      <div class="big">${t.days}<small>days</small></div>
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.blurb)}</p>
      <div class="card-top"><span class="chip">${esc(t.where)} · ${esc(t.when)}</span>${t.draft ? '<span class="soon">soon</span>' : arrow}</div>`)
  ).join("");

  $("#lab-grid").innerHTML = lab.map((l) =>
    wrapTag(l.href, "card tilt", `
      <div class="card-top"><span class="chip">${esc(l.tags[0])}</span>${arrow}</div>
      <h3>${esc(l.title)}</h3><p>${esc(l.blurb)}</p>`)
  ).join("");

  $("#resume-summary").textContent = resume.summary;
  $("#resume-tl").innerHTML = resume.experience.slice(0, 4).map((e) => `
    <li data-reveal><span class="dot"></span><div><h4>${esc(e.role)} <span>· ${esc(e.org)}</span></h4><time>${esc(e.when)}</time></div></li>`).join("");

  const mail = $("#mail");
  mail.href = `mailto:${profile.email}`;
  mail.querySelector("span").textContent = profile.email;
}

/* ---------- hero: rotating role ---------- */
function rotator() {
  const el = $("#role"), art = $("#art");
  if (!el) return;
  const set = (r) => {
    const { text, bare } = typeof r === "string" ? { text: r, bare: false } : r;
    el.textContent = text;
    art.hidden = bare;
    art.textContent = /^[aeiou]/i.test(text) ? "an" : "a";
    art.nextSibling.textContent = bare ? "" : " "; // the space after the article
  };
  set(profile.roles[0]);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0;
  setInterval(() => {
    el.classList.add("out");
    setTimeout(() => { i = (i + 1) % profile.roles.length; set(profile.roles[i]); el.classList.remove("out"); }, 350);
  }, 2600);
}

/* ---------- 3D wiring: labels, hover, active section ---------- */
async function wire() {
  const hero = $("#top");
  const api = await mountScene({ hero });
  const layer = $("#nodes");

  layer.innerHTML = sections.map((s) =>
    `<a class="node" href="#${s.id}" data-id="${s.id}" style="--c:${s.hue}"><i></i><span>${esc(s.label)}</span></a>`).join("");
  const labels = Object.fromEntries($$(".node", layer).map((n) => [n.dataset.id, n]));

  if (!api) { layer.classList.add("static"); return; }

  api.onProject((pts) => {
    const fade = Math.max(0, 1 - scrollY / (hero.offsetHeight * 0.55));
    layer.style.opacity = fade;
    layer.style.visibility = fade < 0.02 ? "hidden" : "visible";
    if (fade < 0.02) return;
    for (const p of pts) {
      const el = labels[p.id];
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      el.style.zIndex = String(Math.round(1000 - p.depth * 10));
    }
  });
  for (const [id, el] of Object.entries(labels)) {
    el.addEventListener("pointerenter", () => api.hoverNode(id));
    el.addEventListener("pointerleave", () => api.hoverNode(null));
    el.addEventListener("focus", () => api.hoverNode(id));
    el.addEventListener("blur", () => api.hoverNode(null));
    el.addEventListener("click", () => api.pulse());
  }
  $("#top").addEventListener("pointerdown", () => api.pulse());

  // palette follows the section you're reading
  const hueOf = Object.fromEntries(sections.map((s) => [s.id, s.hue]));
  const nextHue = (id) => sections[(sections.findIndex((s) => s.id === id) + 1) % sections.length].hue;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      api.setHue(hueOf[id], nextHue(id));
      $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === id));
      document.documentElement.style.setProperty("--accent", hueOf[id]);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => { const el = document.getElementById(s.id); el && io.observe(el); });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { api.setHue(sections[0].hue, sections[1].hue); $$("[data-nav]").forEach((a) => a.classList.remove("active")); }
  }, { rootMargin: "-10% 0px -60% 0px" }).observe(hero);
}

render();
boot({ home: true });
rotator();
wire();
requestAnimationFrame(() => document.documentElement.classList.add("ready"));
