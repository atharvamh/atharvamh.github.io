# atharvamh.github.io

Personal site: static HTML + ES modules + a Three.js scene. No build step.

- **Preview locally:** `python3 -m http.server 8000`, then open http://localhost:8000
- **Edit content:** everything on the home page, the listings, the ⌘K palette and the resume comes from `assets/js/content.js` (search for `TODO`).
- **New note:** add a folder under `engineering-notes/` with an `index.html`, plus an entry in `notes` in `content.js`. Include `<meta name="robots" content="noindex, noarchive, nosnippet">` and the breadcrumb (see an existing note) for consistency. Trips work the same way under `trips/`.
- **3D scene:** `assets/js/scene.js`. Per-section colours live in `sections` in `content.js`.
- **Deploy:** push to `main` (GitHub Pages user site).
