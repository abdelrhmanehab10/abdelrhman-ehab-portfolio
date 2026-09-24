# Graph-only page verification

The page is now the graph view alone. Checked on the real page served from localhost with `chrome-devtools-axi` (Chrome) at 1440 × 900 and 390 × 844 (DPR 3, mobile, touch).

| State | Desktop 1440 × 900 | Phone 390 × 844 |
| --- | --- | --- |
| Settled default | [desktop](desktop-default.png) | [phone](mobile-default.png) |
| List view with a project's details | [desktop](desktop-list-detail.png) | [phone list](mobile-list.png) |
| Connect and role details | [email](desktop-connect-email.png) | [resume](mobile-detail-resume.png), [role](mobile-detail-role.png) |

- **Fills the page:** `main` is exactly the viewport, and document scroll size equals the viewport at both widths (1440 × 900 and 390 × 844). This holds with List view open, and with a detail panel open, because the list scrolls inside the stage area. No header, navigation, hero, `section` or footer remains; the accessible `h1`, title, description, the root node and its label identify Abdelrhman Ehab.
- **Connect:** the Email node opens `mailto:abdelrhmanehab047@gmail.com`; the LinkedIn and GitHub nodes open the profile URLs in a new tab; the Resume (PDF) action has `download`. Clicking it in Chrome downloaded a file byte-identical to `assets/abdelrhmanehab_resume.pdf`. The same links are rendered in the List view index, so they also work without JavaScript.
- **Keyboard:** starting from the top of the page, 300 Tab presses reached all 52 index node buttons and all 6 node links (4 Connect, 2 project sites) without scrolling the page. Enter opens a node, and Escape returns focus to it (see `scripts/test-hero-live.mjs`).
- **Content:** experience, projects, skills, domains and practices are fully reachable through node details. Client-owned VirtuWa HV and QR verification keep their source notices in the detail panel and in the index.
- **Console:** no messages on desktop or phone loads. An inline favicon replaces the previous `/favicon.ico` 404.
- **Sharing:** Open Graph/Twitter now use [`assets/images/og-graph.png`](../../assets/images/og-graph.png), a 1200 × 630 capture of this page, in place of a client storefront screenshot.

`HERO_GRAPH_EVIDENCE_DIR=<dir> node scripts/test-hero-live.mjs` (headless `google-chrome`) also passed. It covers the desktop and phone paths, paused and reduced-motion picking, deep links, vendor-script failure, and JavaScript disabled (complete index, no blank stage).
