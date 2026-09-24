# Abdelrhman Ehab — Frontend Engineer Portfolio

Live portfolio for Abdelrhman Ehab, a Frontend Engineer building production web applications with React, Angular, Vue, TypeScript, and JavaScript.

The site presents the full profile: projects, open-source contributions, professional experience, deployment achievements, technologies, industries, languages, tools, and soft skills.

**[Open the live portfolio](https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/)**

## What this project demonstrates

- Responsive, accessible portfolio layout built without a frontend framework.
- Data-driven rendering for projects, experience, impact metrics, skills, and social links.
- Production-focused presentation of dashboards, admin systems, and operational workflows.
- Responsive navigation with active-section state while scrolling.
- Dark, interactive profile graph with pan, zoom, node details and shareable `#node/<id>` links; List view provides a keyboard-readable index with linked connections, also available without JavaScript or the graph library.
- Reduced-motion support for the technology slider and graph (pre-warmed without animated ticks), with a manual graph pause control.
- Search and social metadata, canonical URL, Open Graph/Twitter cards, and Person structured data.
- Static deployment through GitHub Pages.

Some featured work is client-owned or private. The portfolio intentionally describes that work at a high level without exposing source code or creating public case-study repositories.

## Tech stack

- HTML5
- Tailwind CSS via the browser CDN
- Vanilla JavaScript modules
- Vendored [force-graph 1.51.4](assets/vendor/force-graph-1.51.4.min.js) (MIT; [licence](assets/vendor/force-graph-LICENSE.txt)) for the canvas graph
- Font Awesome
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
│   ├── icons/       Technology icons
│   ├── images/      Project and profile imagery
│   ├── vendor/      Vendored graph library and licence
│   └── *.pdf        Downloadable resume
├── docs/graph-hero/  Browser verification and screenshots
├── scripts/          Profile/graph generators, graph topology and checks
├── src/
│   ├── constant/    Portfolio and graph data
│   ├── hero-graph.js Graph rendering and interactions
│   ├── hero-graph.css Graph and fallback styles
│   └── main.js      Page rendering and interactions
├── index.html       Page structure and metadata
└── README.md
```

The authoritative content is the external, read-only `profile.md`. After editing it, regenerate the checked-in public model and crawlable HTML (no build step at deploy time):

```bash
node scripts/generate-profile.mjs /mnt/d/CVs/source/profile.md
node scripts/generate-graph-index.mjs
npm run test:graph
node scripts/generate-profile.mjs /mnt/d/CVs/source/profile.md --check
```

Pass **your own absolute profile path** if it differs. `--check` exits nonzero if the committed graph no longer matches that source; `npm run test:graph` also checks the committed model, page projections and index/metadata without needing access to the external file. CI cannot compare against a private file it cannot read, so run the profile-path check whenever the source changes. Graph node IDs and edges are structural metadata in [`scripts/graph-layout.json`](scripts/graph-layout.json); update that mapping and the generator when profile headings or product relationships change. Verified project chips and their repository provenance are site-side metadata in [`scripts/project-tags.json`](scripts/project-tags.json), not profile-derived guesses; review repository manifests/languages before editing them. EFA, Boots & Ladders, Watu, and Pro Event Storefront have no verified repository in the accessible account/org and intentionally have no chips; include this limitation in the PR. Do not edit generated [`src/constant/graph.js`](src/constant/graph.js) or the HTML index/SEO metadata by hand. [`src/constant/index.js`](src/constant/index.js) derives page sections from the graph, and [`src/main.js`](src/main.js) renders them. The generator applies a public-copy safety policy before any surface is emitted. The graph canvas renderer and styles live in [`src/hero-graph.js`](src/hero-graph.js) and [`src/hero-graph.css`](src/hero-graph.css). Browser evidence, Lighthouse figures and the public-copy privacy review are in [`docs/profile-sync/verification.md`](docs/profile-sync/verification.md); earlier graph evidence remains in [`docs/graph-hero/`](docs/graph-hero/).

## Deployment

The live site is published at:

<https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/>

## Contact

- [LinkedIn](https://www.linkedin.com/in/abdelrahman-ehab-87261a244/)
- [GitHub](https://github.com/abdelrhmanehab10)

## Reuse

This repository is a personal portfolio. Please contact me before reusing its content, imagery, or resume assets.
