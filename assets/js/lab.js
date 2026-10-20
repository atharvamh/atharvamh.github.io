import { mountScene } from "/assets/js/ui.js";

// Ambient 3D background for the thought-experiment pages, tinted blue/violet to match Lab.
mountScene({ ambient: true, opacity: 0.22 }).then((api) => api?.setHue("#7ec8ff", "#8b7bff"));
requestAnimationFrame(() => document.documentElement.classList.add("ready"));
