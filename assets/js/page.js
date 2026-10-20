import { notes, trips } from "/assets/js/content.js";
import { $, esc, boot, mountScene } from "/assets/js/ui.js";

const arrow = `<svg class="arr" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const el = (href, cls, inner) => href ? `<a data-reveal class="${cls}" href="${esc(href)}">${inner}</a>` : `<div data-reveal class="${cls} is-soon">${inner}</div>`;

const kind = document.body.dataset.kind;
if (kind === "notes") {
  $("#items").innerHTML = [...notes].sort((a, b) => b.date.localeCompare(a.date)).map((n) =>
    el(n.draft ? null : `/engineering-notes/${n.slug}/`, "row", `
      <time datetime="${n.date}">${fmt(n.date)}</time>
      <span class="row-main"><strong>${esc(n.title)}</strong><span>${esc(n.blurb)}</span></span>
      <span class="row-end">${n.draft ? '<span class="soon">soon</span>' : arrow}</span>`)).join("");
} else if (kind === "trips") {
  $("#items").innerHTML = trips.map((t) =>
    el(t.draft ? null : `/trips/${t.slug}/`, "card trip", `
      <div class="big">${t.days}<small>days</small></div><h3>${esc(t.title)}</h3><p>${esc(t.blurb)}</p>
      <div class="card-top"><span class="chip">${esc(t.where)} · ${esc(t.when)}</span>${t.draft ? '<span class="soon">soon</span>' : arrow}</div>`)).join("");
}

// reading progress bar for articles
const bar = $(".progress");
if (bar) addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
}, { passive: true });

boot();
mountScene({ ambient: true, opacity: $(".prose") ? 0.16 : 0.38 }).then((api) => api?.setHue(document.body.dataset.hue || "#8b7bff", document.body.dataset.hue2 || "#4fe3d1"));
requestAnimationFrame(() => document.documentElement.classList.add("ready"));
