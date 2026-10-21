import { mountScene } from "/assets/js/ui.js";

// Ambient 3D background for the standalone trip pages, tinted pink/amber to match Trips.
mountScene({ ambient: true, opacity: innerWidth < 760 ? 0.12 : 0.3 }).then((api) => api?.setHue("#ff7eb6", "#ffb86b"));
requestAnimationFrame(() => document.documentElement.classList.add("ready"));

// day nav: highlight the day being read and keep it in view
const nav = document.querySelector(".daynav .nav-links");
if (nav) {
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const show = (a) => {
    links.forEach((l) => l.classList.toggle("active", l === a));
    nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && show(byId.get(e.target.id)));
  }, { rootMargin: "-35% 0px -60% 0px" });
  byId.forEach((_, id) => { const el = document.getElementById(id); el && io.observe(el); });
}
