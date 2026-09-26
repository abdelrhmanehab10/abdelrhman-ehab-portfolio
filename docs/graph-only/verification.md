# Graph-only page verification

The page is the graph view alone. Fresh default-view screenshots were captured from the locally served page in Chrome with `chrome-devtools-axi` at 1440 × 900 and 390 × 844 (DPR 3, mobile, touch). The stage outline, visible graph totals and bottom caption are removed; the controls retain their positions, and the graph uses the space formerly occupied by the caption.

| State | Desktop 1440 × 900 | Phone 390 × 844 |
| --- | --- | --- |
| Decluttered default (JavaScript enabled) | [desktop](desktop-default.png) | [phone](mobile-default.png) |
| List view with a project's details | [desktop](desktop-list-detail.png) | [phone list](mobile-list.png) |
| Connect and role details | [email](desktop-connect-email.png) | [resume](mobile-detail-resume.png), [role](mobile-detail-role.png) |
| Node details callout | [beside its node](desktop-callout.png), [after zoom and pan](desktop-callout-panned.png) | [profile](mobile-callout-profile.png), [reduced motion](mobile-callout-reduced.png) |
| Graph library unavailable (list-index fallback) | | [static card in the index](mobile-fallback-detail.png) |

- **Decluttered shell:** the graph stage has no outline border; its background and rounded shape remain. The controls no longer display node/connection totals, and `#graph-caption` is removed. `#graph-status` remains a visually hidden `role="status"` for fallback announcements, but successful graph load does not replace it with counts. The stage's `aria-describedby` points to visually hidden drag/zoom/selection and keyboard instructions. The no-JavaScript profile index also tells keyboard users to use Tab and Enter.
- **Fills the page:** `main` is exactly the viewport, and document scroll size equals the viewport at both widths (1440 × 900 and 390 × 844). This holds with List view open, and with a detail panel open, because the list scrolls inside the stage area. No header, navigation, hero, `section` or footer remains; the accessible `h1`, title, description, the root node and its label identify Abdelrhman Ehab.
- **Connect:** the Email node opens `mailto:abdelrhmanehab047@gmail.com`; the LinkedIn and GitHub nodes open the profile URLs in a new tab; the Resume (PDF) action has `download`. Clicking it in Chrome downloaded a file byte-identical to `assets/abdelrhmanehab_resume.pdf`. The same links are rendered in the List view index, so they also work without JavaScript.
- **Keyboard:** starting from the top of the page, 300 Tab presses reached all 52 index node buttons and all 6 node links (4 Connect, 2 project sites) without scrolling the page. Enter opens a node, and Escape returns focus to it (see `scripts/test-hero-live.mjs`).
- **Node details callout:** selecting a node opens `#graph-panel` as a card pinned beside that node. The arrow points at it when alignment is possible.
  - **Desktop:** the card sits to the right of the node, flips to the left near the right edge, and drops below or above the node when neither side fits. It stays clamped inside the stage.
  - **Phone:** the card sits full-width below the node, or above it near the bottom of the stage.
  - **Following the node:** it is re-placed on every rendered frame (`onRenderFramePost`), so it tracks the node through simulation ticks, zoom and pan. The live test samples the arrow's target pixel on the canvas and finds the selected node's cyan fill there (49 of 49 pixels) after load, after a wheel zoom and after a drag pan. Over 40 frames with motion on, the card moved at most 1px per frame (no jitter).
  - **Off-stage or cramped stage:** the arrow hides if the node is off-stage or the card must be clamped away from it. Card height uses the available space; longer content scrolls inside.
  - **Read more:** long nodes are clamped, and Read more / Show less toggles `aria-expanded`.
  - **Content fixes:** skill nodes no longer repeat their tags as a summary, Connect addresses read as a muted monospace line, and group labels are singular. Nodes without an external link offer Copy link to their `#node/<id>` URL.
  - **Kept behaviour:** dialog semantics, focus on open, Escape and close restoring focus, hash sync and the list-index fallback (a static card with no clamp) are unchanged. With reduced motion the card does not animate.
  - **Keyboard only:** List view → Enter on a node → Tab reaches Close, Read more and Copy link → Escape returns focus to the list entry.
- **Content:** experience, projects, skills, domains and practices are fully reachable through node details. Client-owned VirtuWa HV and QR verification keep their source notices in the detail panel and in the index.
- **Console:** no messages on desktop or phone loads. An inline favicon replaces the previous `/favicon.ico` 404.
- **Sharing:** Open Graph/Twitter now use [`assets/images/og-graph.png`](../../assets/images/og-graph.png), a 1200 × 630 capture of this page, in place of a client storefront screenshot.

`HERO_GRAPH_EVIDENCE_DIR=<dir> node scripts/test-hero-live.mjs` (headless `google-chrome`) and `HERO_GRAPH_EVIDENCE_DIR=<dir> node scripts/test-callout-live.mjs` also passed. They cover the desktop and phone paths, the callout placement after zoom and pan, paused and reduced-motion picking, deep links, vendor-script failure, and JavaScript disabled at both widths (complete index, no blank stage).
