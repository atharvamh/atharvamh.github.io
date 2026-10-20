import { mountScene } from "/assets/js/ui.js";

// Generic ambient 3D background. Configure per page through <body data-hue data-hue2 data-opacity>.
const d = document.body.dataset;
mountScene({ ambient: true, opacity: parseFloat(d.opacity || "0.3") }).then((api) => api?.setHue(d.hue || "#8b7bff", d.hue2 || "#4fe3d1"));
requestAnimationFrame(() => document.documentElement.classList.add("ready"));
