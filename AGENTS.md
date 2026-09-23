# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- This is a static GitHub Pages site; serve it locally via the command in `README.md` (no bundler or install step).
- The graph model is `src/constant/graph.js`. After changing it, run `node scripts/generate-graph-index.mjs` to keep the checked-in no-JS index and Person JSON-LD in `index.html` in sync. `README.md` documents the renderer, vendored dependency and browser evidence.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
