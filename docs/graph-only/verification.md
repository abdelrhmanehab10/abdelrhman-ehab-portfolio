# Fullscreen graph verification

The page is the graph view alone, in the Smoke greyscale scheme. Browser screenshots were refreshed from the locally served page by `scripts/test-hero-live.mjs` and `scripts/test-callout-live.mjs` in headless Chrome at 1440 × 900 and 390 × 844 (DPR 3, mobile, touch). The browser checks and screenshot captures also cover JavaScript disabled at both sizes.

| State | Desktop 1440 × 900 | Phone 390 × 844 |
| --- | --- | --- |
| Fullscreen graph (JavaScript enabled) | [desktop](desktop-default.png) | [phone](mobile-default.png) |
| Keyboard focus and list | [skip link](desktop-keyboard-focus.png), [opened list](desktop-list-view.png) | — |
| Selected profile callout | [desktop](desktop-callout.png) | [phone](mobile-callout-profile.png), [Read more expanded](mobile-callout-expanded.png) |
| Static list fallback (JavaScript disabled) | [desktop](desktop-no-javascript.png) | [phone](mobile-no-javascript.png) |

- **Fullscreen shell:** at both widths, `#graph-stage` is positioned at `(0, 0)` and measures exactly `100vw × 100dvh`. The document has no page margins or scrollbars. There is no controls bar, List view / Reset view / Pause motion toolbar button, stage outline, or decorative page-chrome border. The graph and page use one solid Smoke `#1b1b1b` background, with no background image. The node details callout keeps its own card border and shadow.
- **List and keyboard:** the “Skip to profile list” link appears on keyboard focus and opens the index. “Return to graph” restores graph focus. Tab reaches all profile entries and connection links; Enter opens a focused node, and Escape closes the callout and restores focus. Escape from the graph resets its view; double-clicking the graph also resets it. The graph's visually hidden instructions describe these actions, and visible keyboard focus outlines remain.
- **Motion:** the callout fades and scales in from its node's side, fades out while inert before it hides (focus, hash and highlight change at once), slides and fades its content when switching nodes, and on Read more glides to its new position while newly revealed lines are clipped in without fading already-visible text. A second Escape during the exit follows the list-to-graph path. Callout motion uses Web Animations API keyframes on `opacity`/`transform`, plus `clip-path` for the Read more reveal. Canvas highlights ease over about 180 ms, with continuous redraw only while easing, and a one-shot ripple marks the opened node; the idle canvas is checked to go still again. `prefers-reduced-motion: reduce` pre-warms the graph without animated ticks and runs none of these animations (checked: zero `document.getAnimations()` and an instant close). No manual pause control is shown.
- **Callout footer:** the "N connections" count is gone; the footer holds only the node's action or Copy link.
- **No-JavaScript fallback:** at desktop and phone sizes, the interactive stage is absent and the complete generated index fills the viewport and scrolls internally. The skip link, readable profile content, and Connect actions remain available.
- **Callout:** details remain clamped inside the graph at desktop and phone widths; the card scrolls internally when its content is taller than the available space. Escape closes it and returns focus to its source.
- **Contrast (Smoke, WCAG 2.x):** callout title `#f2f2f2`/`#252525` 13.69:1, body `#dadada` 10.96:1, facts `#a8a8a8` 6.45:1, kicker `#c2c2c2` 8.61:1, links `#ececec` 12.98:1, tags `#dadada`/`#2b2b2b` 10.13:1, action `#1b1b1b`/`#d9d9d9` 12.20:1; list summary `#cfcfcf`/`#1b1b1b` 11.06:1, meta `#a8a8a8` 7.24:1, links 14.58:1; canvas labels `#d6d6d6` 11.85:1 and section labels `#f2f2f2` 15.39:1; darkest node fill `#808080` 4.36:1; focus ring `#ededed` 14.71:1 on the page and 13.09:1 on the callout. The headless Chrome checks sample computed text/focus colours and rendered canvas pixels for contrast and neutrality.
- **Fallback status:** the `role="status"` announcement stays outside the graph stage so it remains available if the graph library fails and the stage is hidden.

Re-run the checks with:

```bash
npm run test:graph
HERO_GRAPH_EVIDENCE_DIR=/tmp/hero-live node scripts/test-hero-live.mjs
HERO_GRAPH_EVIDENCE_DIR=/tmp/callout-live node scripts/test-callout-live.mjs
```

The live tests assert fullscreen geometry, flat Smoke background, rendered palette and computed contrast, missing toolbar, zero page overflow, keyboard list/reset paths, callout entrance/exit/Read more motion and its reduced-motion absence, the missing connection count, callout clamping, library failure, and JavaScript-disabled fallbacks in Chrome. For social-preview regeneration, follow the graph maintenance guidance in [README.md](../../README.md).
