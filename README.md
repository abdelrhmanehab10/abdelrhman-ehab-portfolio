# Abdelrhman Ehab — Frontend Engineer Portfolio

Live portfolio for Abdelrhman Ehab, a Frontend Engineer building production web applications with React, Angular, Vue, TypeScript, and JavaScript.

The site presents selected product work, measurable frontend outcomes, professional experience, and the technologies used across shipped projects.

**[Open the live portfolio](https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/)**

## What this project demonstrates

- Responsive, accessible portfolio layout built without a frontend framework.
- Data-driven rendering for projects, experience, impact metrics, skills, and social links.
- Production-focused presentation of dashboards, admin systems, and operational workflows.
- Responsive navigation with active-section state while scrolling.
- Reduced-motion support for the technology slider.
- Search and social metadata, canonical URL, Open Graph/Twitter cards, and Person structured data.
- Static deployment through GitHub Pages.

Some featured work is client-owned or private. The portfolio intentionally describes that work at a high level without exposing source code or creating public case-study repositories.

## Tech stack

- HTML5
- Tailwind CSS via the browser CDN
- Vanilla JavaScript modules
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
│   └── *.pdf        Downloadable resume
├── src/
│   ├── constant/    Portfolio content and profile data
│   └── main.js      Rendering and interaction logic
├── index.html       Page structure and metadata
└── README.md
```

Most portfolio content can be updated in [`src/constant/index.js`](src/constant/index.js). The page rendering and interactions live in [`src/main.js`](src/main.js).

## Deployment

The live site is published at:

<https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/>

## Contact

- [LinkedIn](https://www.linkedin.com/in/abdelrahman-ehab-87261a244/)
- [GitHub](https://github.com/abdelrhmanehab10)

## Reuse

This repository is a personal portfolio. Please contact me before reusing its content, imagery, or resume assets.
