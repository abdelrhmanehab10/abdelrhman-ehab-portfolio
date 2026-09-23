# Graph hero verification

Run against the real page, served at `http://127.0.0.1:5173/`, via `chrome-devtools-axi` (Chrome). Screenshots below are from the page, not the prototypes.

| State | Desktop 1440 × 900 | Phone 390 × 844, DPR 3 |
| --- | --- | --- |
| Settled default | [desktop](desktop-default.png) | [phone](mobile-default.png) |
| Selected VirtuWa HV + 5 neighbours | [desktop](desktop-selected.png) | [phone bottom sheet](mobile-selected.png) |
| Keyboard focus | [desktop list](desktop-focus.png) | [phone list](mobile-keyboard-focus.png) |
| Library request returns 503 | — | [visible list](library-failure.png) |
| OS reduced motion | [settled without animated ticks](reduced-motion-stage.png) | — |

The page has 52 graph nodes, 104 drawn edges, 52 index buttons, no horizontal overflow at 390 px and an aspect-ratio-reserved 358 × 447.5 CSS px phone stage. On keyboard, Tab reaches an index button; Enter opens the node panel, focus moves into it, Escape closes it and returns focus to the originating button. Canvas is hidden from accessibility APIs; the complete DOM index is still in the tree. The real `prefers-reduced-motion: reduce` media query was tested in Chrome using `--force-prefers-reduced-motion`: the graph appeared settled, with the manual control reading "Resume motion"; selecting a node still highlights its neighbourhood. Manual Pause motion also allows one-frame hover/selection feedback while freezing ambient animation. The library-failure screenshot was taken with a server returning 503 for the vendor script: no canvas, controls hidden, all 52 entries visible. Removing the `graph-js` class (the state when JavaScript is disabled) also reveals the static index and hides the stage. If the main module fails, a load guard promotes the static index.

## Lighthouse (chrome-devtools-axi navigation)

| | Accessibility | Best Practices | SEO | Agentic Browsing | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Research prototype baseline | 100 | 100 | 90 | 100 | 0.003 |
| Real page mobile | 100 | 100 | 100 | 100 | 0.0207 |
| Real page desktop | 100 | 100 | 100 | 100 | 0.0007 |

Mobile CLS is **higher** than the isolated prototype baseline (0.0207 vs 0.003), though still under the 0.1 "good" threshold. The stage itself reserves space before canvas boot. These Lighthouse commands report accessibility, SEO, best practices and layout shift, not a performance category. The page still uses the original Tailwind browser CDN and external fonts; the hero adds no build step.

## Contrast (WCAG 2.2 relative luminance)

Against the slate-900 stage `#0f172a`: visible graph/index body text `#e2e8f0` = **14.48:1**, muted text `#94a3b8` = **6.96:1**, hubs and focus ring `#67e8f9` = **12.32:1**. All exceed 4.5:1 for normal text and 3:1 for a focus indicator. Faded, decorative canvas elements are excluded from the accessibility tree; the DOM index carries their full-contrast equivalents. Nodes are differentiated by grouping, size and outlined hubs rather than by distinct hues.
