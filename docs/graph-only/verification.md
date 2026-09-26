# Fullscreen graph verification

The page is the graph view alone. Browser screenshots were refreshed from the locally served page with `chrome-devtools-axi` at 1440 × 900 and 390 × 844 (DPR 3, mobile, touch). The browser checks and screenshot captures also cover JavaScript disabled at both sizes.

| State | Desktop 1440 × 900 | Phone 390 × 844 |
| --- | --- | --- |
| Fullscreen graph (JavaScript enabled) | [desktop](desktop-default.png) | [phone](mobile-default.png) |
| Keyboard focus and list | [skip link](desktop-keyboard-focus.png), [opened list](desktop-list-view.png) | — |
| Selected profile callout | [desktop](desktop-callout.png) | [phone](mobile-callout-profile.png) |
| Static list fallback (JavaScript disabled) | [desktop](desktop-no-javascript.png) | [phone](mobile-no-javascript.png) |

- **Fullscreen shell:** at both widths, `#graph-stage` is positioned at `(0, 0)` and measures exactly `100vw × 100dvh`. The document has no page margins or scrollbars. There is no controls bar, List view / Reset view / Pause motion toolbar button, stage outline, or decorative page-chrome border. The graph and page use one solid `#060c17` background, with no background image. The node details callout keeps its own card border and shadow.
- **List and keyboard:** the “Skip to profile list” link appears on keyboard focus and opens the index. “Return to graph” restores graph focus. Tab reaches all profile entries and connection links; Enter opens a focused node, and Escape closes the callout and restores focus. Escape from the graph resets its view; double-clicking the graph also resets it. The graph's visually hidden instructions describe these actions, and visible keyboard focus outlines remain.
- **Motion:** `prefers-reduced-motion: reduce` pre-warms the graph without animated ticks and suppresses callout animation. No manual pause control is shown.
- **No-JavaScript fallback:** at desktop and phone sizes, the interactive stage is absent and the complete generated index fills the viewport and scrolls internally. The skip link, readable profile content, and Connect actions remain available.
- **Callout:** details remain clamped inside the graph at desktop and phone widths; the card scrolls internally when its content is taller than the available space. Escape closes it and returns focus to its source.
- **Fallback status:** the `role="status"` announcement stays outside the graph stage so it remains available if the graph library fails and the stage is hidden.

Re-run the checks with:

```bash
npm run test:graph
HERO_GRAPH_EVIDENCE_DIR=/tmp/hero-live node scripts/test-hero-live.mjs
HERO_GRAPH_EVIDENCE_DIR=/tmp/callout-live node scripts/test-callout-live.mjs
```

The live tests assert fullscreen geometry, flat background, missing toolbar, zero page overflow, keyboard list/reset paths, reduced motion, callout clamping, library failure, and JavaScript-disabled fallbacks in Chrome.
