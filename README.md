# Abdelrhman Ehab — Frontend Engineer Portfolio

Live portfolio for Abdelrhman Ehab, a Frontend Engineer building production web applications with React, Angular, Vue, TypeScript, and JavaScript.

The whole site is one interactive profile graph. Visitors pan, zoom and select nodes to explore the full profile: projects, open-source contributions, professional experience, deployment achievements, technologies, industries, languages, tools, soft skills, and the Connect links for email, LinkedIn, GitHub and the resume PDF.

**[Open the live portfolio](https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/)**

## What this project demonstrates

- A graph-only page that fills the viewport on desktop and phone, built without a frontend framework.
- Dark, interactive profile graph with pan, zoom and shareable `#node/<id>` links. Selecting a node opens a callout beside it (below or above it on phones); long details expand with Read more and scroll within the card. The keyboard-focus-only Skip to profile list link opens a keyboard-readable index with linked connections and Connect links, also available without JavaScript or the graph library.
- Reduced-motion support (the graph is pre-warmed without animated ticks); Escape resets the graph view, and double-click is an alternative reset gesture.
- Search and social metadata, canonical URL, Open Graph/Twitter cards, and Person structured data.
- Static deployment through GitHub Pages.

Some featured work is client-owned or private. The portfolio intentionally describes that work at a high level without exposing source code or creating public case-study repositories.

## Tech stack

- HTML5 and plain CSS
- Vanilla JavaScript modules
- Vendored [force-graph 1.51.4](assets/vendor/force-graph-1.51.4.min.js) (MIT; [licence](assets/vendor/force-graph-LICENSE.txt)) for the canvas graph
- GitHub Pages

## Run locally

Clone the repository and serve it from a local HTTP server so the JavaScript modules load correctly:

```bash
git clone https://github.com/abdelrhmanehab10/abdelrhman-ehab-portfolio.git
cd abdelrhman-ehab-portfolio
pnpm dlx http-server -p 5173
```

Open [http://localhost:5173](http://localhost:5173).

Alternatively, use any static HTTP server. No build step is required.

## Project structure

```text
.
├── assets/
│   ├── images/      Open Graph share image
│   ├── vendor/      Vendored graph library and licence
│   └── *.pdf        Downloadable resume
├── docs/             Browser verification and screenshots
├── scripts/          Profile/graph generators, graph topology and checks
├── src/
│   ├── constant/    Graph data and site-side project notices
│   ├── hero-graph.js Graph rendering and interactions
│   ├── hero-graph.css Page, graph and fallback styles
│   └── main.js      Page entry point
├── index.html       Page structure and metadata
└── README.md
```

The authoritative profile content is external `profile.md`; the generator reads it without modifying it. After editing the source, regenerate the checked-in public model and crawlable HTML (no build step at deploy time):

```bash
node scripts/generate-profile.mjs /mnt/d/CVs/source/profile.md
node scripts/generate-graph-index.mjs
npm run test:graph
node scripts/generate-profile.mjs /mnt/d/CVs/source/profile.md --check
```

Pass **your own absolute profile path** if it differs. `--check` exits nonzero if the committed graph no longer matches that source; `npm run test:graph` also checks the committed model, the graph-only page and its index/metadata without needing access to the external file. CI cannot compare against a private file it cannot read, so run the profile-path check whenever the source changes. Graph node IDs and edges are structural metadata in [`scripts/graph-layout.json`](scripts/graph-layout.json); update that mapping and the generator when profile headings or product relationships change. Verified project chips and their repository provenance are site-side metadata in [`scripts/project-tags.json`](scripts/project-tags.json), not profile-derived guesses; review repository manifests/languages before editing them. Projects without verified repository evidence intentionally have no chips; note them in the PR. Do not edit generated [`src/constant/graph.js`](src/constant/graph.js) or the HTML index/SEO metadata by hand. [`src/constant/index.js`](src/constant/index.js) holds only the site-side source notices for client-owned projects, shown in their node details and index entries. The page has no sections outside the graph; everything a visitor needs must be reachable through a node. The generator applies a public-copy safety policy before any surface is emitted. The graph canvas renderer and styles live in [`src/hero-graph.js`](src/hero-graph.js) and [`src/hero-graph.css`](src/hero-graph.css). Browser evidence for the graph-only page is in [`docs/graph-only/verification.md`](docs/graph-only/verification.md); the public-copy privacy review is in [`docs/profile-sync/verification.md`](docs/profile-sync/verification.md), and earlier graph evidence remains in [`docs/graph-hero/`](docs/graph-hero/). `HERO_GRAPH_EVIDENCE_DIR=<dir> node scripts/test-hero-live.mjs` re-runs the headless Chrome checks and captures screenshots.

## Deployment

The live site is published at:

<https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/>

## Contact

Open the [Connect node](https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/#node/hub-connect) in the live portfolio for profile-backed contact links.

## Reuse

This repository is a personal portfolio. Please contact me before reusing its content, imagery, or resume assets.
