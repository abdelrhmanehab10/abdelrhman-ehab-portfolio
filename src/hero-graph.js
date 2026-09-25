import { graphNodes, graphEdges, graphGroups } from "./constant/graph.js";
import { projectNotices } from "./constant/index.js";

const byId = new Map(graphNodes.map((node) => [node.id, node]));
const adjacency = new Map(graphNodes.map((node) => [node.id, new Set()]));
for (const edge of graphEdges) {
  adjacency.get(edge.source)?.add(edge.target);
  adjacency.get(edge.target)?.add(edge.source);
}
const idOf = (endpoint) => typeof endpoint === "object" ? endpoint.id : endpoint;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
// Shared with the generated index: external links open a new tab, bundled files
// such as the resume download, and any other scheme is never rendered.
export function nodeLinkHTML(node, className) {
  if (!node.href || !/^(https?:\/\/|mailto:|\.\/assets\/)/.test(node.href)) return "";
  const attributes = /^https?:/.test(node.href) ? ' target="_blank" rel="noopener noreferrer"'
    : node.href.startsWith("./assets/") ? " download" : "";
  return `<a class="${className}" href="${escapeHTML(node.href)}"${attributes}>${escapeHTML(node.linkLabel || "Open link")}</a>`;
}

// The details panel is a callout card: its group label names one node, not the section.
const groupNames = { root: "Profile", hub: "Section", role: "Experience", project: "Project", skill: "Skill set", domain: "Domain", craft: "Practice", link: "Connect" };
const facts = (meta) => (meta || "").replace(/^\(|\)$/g, "").split(/\s\|\s|\s·\s|,\s(?=\d+ months)/).map((fact) => fact.trim()).filter(Boolean);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const CALLOUT_GAP = 30;
const CALLOUT_MARGIN = 12;

// Places the callout beside the node (right, else left) when it fits on a wide stage,
// otherwise below or above it; phones always use the vertical placement. Returns stage
// pixels, and a null arrow when the node itself is off the stage.
export function placeCallout({ x, y, width, height, cardWidth, cardHeight, mobile }) {
  const onStage = x >= 0 && x <= width && y >= 0 && y <= height;
  const ax = clamp(x, 0, width);
  const ay = clamp(y, 0, height);
  if (!mobile) {
    const right = ax + CALLOUT_GAP + cardWidth <= width - CALLOUT_MARGIN;
    const left = ax - CALLOUT_GAP - cardWidth >= CALLOUT_MARGIN;
    if (right || left) {
      const maxHeight = height - 2 * CALLOUT_MARGIN;
      const shown = Math.min(cardHeight, maxHeight);
      const top = clamp(ay - 60, CALLOUT_MARGIN, height - shown - CALLOUT_MARGIN);
      const arrow = ay - top;
      return {
        side: right ? "right" : "left", left: Math.round(right ? ax + CALLOUT_GAP : ax - CALLOUT_GAP - cardWidth),
        top: Math.round(top), maxHeight: Math.round(maxHeight), arrow: onStage && arrow >= 18 && arrow <= shown - 18 ? Math.round(arrow) : null,
      };
    }
  }
  const below = height - ay - CALLOUT_GAP - CALLOUT_MARGIN;
  const above = ay - CALLOUT_GAP - CALLOUT_MARGIN;
  const down = below >= Math.min(cardHeight, 220) || below >= above;
  const maxHeight = Math.max(0, (down ? below : above) - 2);
  const shown = Math.min(cardHeight, Math.max(24, maxHeight + 2));
  const left = mobile ? CALLOUT_MARGIN : clamp(ax - cardWidth / 2, CALLOUT_MARGIN, width - cardWidth - CALLOUT_MARGIN);
  const targetTop = down ? ay + CALLOUT_GAP : ay - CALLOUT_GAP - shown;
  const top = clamp(targetTop, CALLOUT_MARGIN, Math.max(CALLOUT_MARGIN, height - shown - CALLOUT_MARGIN));
  const arrow = ax - left;
  return {
    side: down ? "below" : "above", left: Math.round(left), top: Math.round(top), maxHeight: Math.round(maxHeight),
    arrow: onStage && Math.abs(top - targetTop) < 1 && arrow >= 18 && arrow <= cardWidth - 18 ? Math.round(arrow) : null,
  };
}

export function initHeroGraph() {
  const stage = document.querySelector("#graph-stage");
  if (!stage) return;
  const host = document.querySelector("#graph-canvas-host");
  const index = document.querySelector("#graph-index-wrap");
  const panel = document.querySelector("#graph-panel");
  const status = document.querySelector("#graph-status");
  const listButton = document.querySelector("#btn-list");
  const resetButton = document.querySelector("#btn-reset");
  const motionButton = document.querySelector("#btn-motion");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mobile = matchMedia("(max-width: 639px)");
  let graph;
  let hovered = null;
  let selected = null;
  let lastFocus = null;
  let placed = "";
  let panelVersion = 0;
  let press = null;
  let moved = false;
  let ticks = 0;

  function showFallback() {
    index.insertBefore(panel, index.querySelector("#graph-index"));
    stage.hidden = true;
    index.classList.remove("graph-index-hidden");
    status.textContent = "Graph unavailable — showing profile list";
    listButton.hidden = resetButton.hidden = motionButton.hidden = true;
  }

  const active = () => hovered || selected;
  const neighbourhood = (id) => new Set([id, ...(adjacency.get(id) || [])]);
  function nodeColor(node) {
    const focus = active();
    if (!focus) return graphGroups[node.group].color;
    return neighbourhood(focus).has(node.id) ? (node.id === focus ? "#67e8f9" : "#e2e8f0") : "rgba(148,163,184,0.12)";
  }
  function edgeColor(edge) {
    const focus = active();
    if (!focus) return "rgba(148,163,184,0.23)";
    return idOf(edge.source) === focus || idOf(edge.target) === focus
      ? "rgba(103,232,249,0.9)" : "rgba(148,163,184,0.05)";
  }
  function edgeWidth(edge) {
    const focus = active();
    return focus && (idOf(edge.source) === focus || idOf(edge.target) === focus) ? 2.2 : 1;
  }
  function repaint() {
    graph?.nodeColor(nodeColor).linkColor(edgeColor).linkWidth(edgeWidth);
  }
  function nodeAt(event) {
    const canvas = host.querySelector("canvas");
    if (!canvas || !graph) return null;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * stage.clientWidth / bounds.width;
    const y = (event.clientY - bounds.top) * stage.clientHeight / bounds.height;
    const nodes = graph.graphData().nodes;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const screen = graph.graph2ScreenCoords(node.x, node.y);
      const radius = Math.sqrt(node.val) * graph.nodeRelSize() * graph.zoom();
      if (Math.hypot(screen.x - x, screen.y - y) <= radius) return node;
    }
    return null;
  }

  // Runs every rendered frame, so the card follows its node through ticks, pan and zoom;
  // the key skips layout work when nothing moved by a whole pixel.
  function positionPanel() {
    if (!graph || !selected || panel.hidden || stage.hidden) return;
    const node = graph.graphData().nodes.find((entry) => entry.id === selected);
    if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) return;
    const screen = graph.graph2ScreenCoords(node.x, node.y);
    const scroll = panel.querySelector(".graph-panel-scroll");
    const key = [Math.round(screen.x), Math.round(screen.y), stage.clientWidth, stage.clientHeight, mobile.matches, panelVersion].join();
    if (key === placed) return;
    placed = key;
    const spot = placeCallout({
      x: screen.x, y: screen.y, width: stage.clientWidth, height: stage.clientHeight,
      cardWidth: panel.offsetWidth || 330, cardHeight: (scroll.scrollHeight || 0) + 2, mobile: mobile.matches,
    });
    panel.dataset.side = spot.side;
    panel.style.left = `${spot.left}px`;
    panel.style.top = `${spot.top}px`;
    scroll.style.maxHeight = `${spot.maxHeight}px`;
    const arrow = panel.querySelector(".graph-panel-arrow");
    arrow.hidden = spot.arrow === null;
    const vertical = spot.side === "below" || spot.side === "above";
    arrow.style.top = vertical || spot.arrow === null ? "" : `${spot.arrow}px`;
    arrow.style.left = !vertical || spot.arrow === null ? "" : `${spot.arrow}px`;
  }

  function closePanel({ restoreFocus = true } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    selected = null;
    repaint();
    if (location.hash.startsWith("#node/")) history.replaceState(null, "", location.pathname + location.search);
    if (restoreFocus) (lastFocus || listButton).focus();
    lastFocus = null;
  }
  function openNode(id, origin) {
    const node = byId.get(id);
    if (!node) return;
    lastFocus = origin || document.activeElement;
    hovered = null;
    selected = id;
    const link = nodeLinkHTML(node, "graph-action");
    const notice = projectNotices[id] ? `<p class="graph-notice">${escapeHTML(projectNotices[id])}</p>` : "";
    const detail = facts(node.meta);
    // Skill summaries repeat their tags; a Connect node's address reads as a muted line.
    const text = node.tags?.length && node.summary === node.tags.join(" · ") ? "" : node.summary || "";
    const address = node.group === "link" && /^(https?:\/\/\S+|\S+@\S+)$/.test(text);
    const summary = !text ? "" : `<p class="${address ? "graph-url" : "graph-summary"}">${escapeHTML(text)}</p>`;
    // The clamp is for the floating card; the list-index fallback shows everything.
    const long = !stage.hidden && (text.length > 150 || node.bullets?.length > 0 || node.tags?.length > 4);
    panel.innerHTML = `<span class="graph-panel-arrow" aria-hidden="true"></span><div class="graph-panel-scroll">
      <div class="graph-panel-heading"><p class="graph-group-name">${escapeHTML(groupNames[node.group] || graphGroups[node.group].label)}</p>
      <button type="button" id="graph-panel-close" aria-label="Close node details"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <h2 id="graph-panel-title">${escapeHTML(node.title)}</h2>
      ${detail.length ? `<ul class="graph-facts">${detail.map((fact) => `<li>${escapeHTML(fact)}</li>`).join("")}</ul>` : ""}
      <div class="graph-body${long ? " is-clamped" : ""}" id="graph-panel-body">${summary}${notice}
      ${node.bullets?.length ? `<ul class="graph-bullets">${node.bullets.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
      ${node.tags?.length ? `<div class="graph-tags">${node.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>` : ""}</div>
      ${long ? `<button type="button" id="graph-panel-more" class="graph-more" aria-expanded="false" aria-controls="graph-panel-body">Read more</button>` : ""}
      <div class="graph-panel-foot">${link || '<button type="button" id="graph-panel-copy" class="graph-copy">Copy link</button>'}
      <p class="graph-meta">${adjacency.get(id)?.size || 0} connections</p></div></div>`;
    panel.hidden = false;
    delete panel.dataset.side;
    panel.querySelector("#graph-panel-close").addEventListener("click", () => closePanel());
    if (long) {
      const more = panel.querySelector("#graph-panel-more");
      more.addEventListener("click", () => {
        const open = more.getAttribute("aria-expanded") !== "true";
        panel.querySelector("#graph-panel-body").classList.toggle("is-clamped", !open);
        more.setAttribute("aria-expanded", String(open));
        more.textContent = open ? "Show less" : "Read more";
        panelVersion++;
        positionPanel();
      });
    }
    if (!link) {
      const copy = panel.querySelector("#graph-panel-copy");
      copy.addEventListener("click", () => {
        const done = (text) => { copy.textContent = text; setTimeout(() => { copy.textContent = "Copy link"; }, 1600); };
        const url = `${location.origin}${location.pathname}#node/${id}`;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => done("Link copied"), () => done("Copy failed"));
      });
    }
    panelVersion++;
    positionPanel();
    panel.focus({ preventScroll: true });
    repaint();
    history.replaceState(null, "", `#node/${id}`);
  }

  index.addEventListener("click", (event) => {
    const button = event.target.closest("[data-node]");
    if (button) openNode(button.dataset.node, button);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
  function syncHash() {
    if (!location.hash.startsWith("#node/")) {
      closePanel({ restoreFocus: false });
      return;
    }
    let id;
    try { id = decodeURIComponent(location.hash.slice(6)); }
    catch { return; }
    if (byId.has(id) && selected !== id) {
      openNode(id, index.querySelector(`[data-node="${id}"]`) || listButton);
    }
  }
  window.addEventListener("hashchange", syncHash);
  listButton.addEventListener("click", () => {
    const open = !index.classList.toggle("graph-index-hidden");
    listButton.setAttribute("aria-expanded", String(open));
    listButton.textContent = open ? "Hide list" : "List view";
  });
  resetButton.addEventListener("click", () => {
    closePanel({ restoreFocus: false });
    moved = false;
    fit(400);
  });
  host.addEventListener("pointerdown", (event) => {
    press = event.isPrimary === false ? null : { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  });
  host.addEventListener("pointermove", (event) => {
    if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) press.moved = true;
    if (graph && selected) {
      const next = nodeAt(event)?.id || null;
      if (hovered !== next) {
        hovered = next;
        host.style.cursor = next ? "pointer" : "grab";
        repaint();
      }
    }
  });
  host.addEventListener("pointercancel", () => { press = null; });
  host.addEventListener("pointerup", (event) => {
    if (press?.id === event.pointerId && !press.moved && event.button === 0 && motionButton.getAttribute("aria-pressed") === "true") {
      const clicked = nodeAt(event);
      if (clicked) openNode(clicked.id, listButton);
    }
    press = null;
  });
  motionButton.addEventListener("click", () => {
    const paused = motionButton.getAttribute("aria-pressed") !== "true";
    motionButton.setAttribute("aria-pressed", String(paused));
    if (paused) graph?.cooldownTicks(0);
    else graph?.cooldownTicks(coarse ? 120 : 200).d3ReheatSimulation();
    motionButton.textContent = paused ? "Resume motion" : "Pause motion";
  });

  // Static HTML index is generated from graphNodes at authoring time so it is
  // readable even with JavaScript disabled or when the module fails to load.
  if (typeof window.ForceGraph !== "function") {
    showFallback();
    syncHash();
    return;
  }
  try {
    graph = new window.ForceGraph(host)
      .width(stage.clientWidth).height(stage.clientHeight)
      .backgroundColor("rgba(0,0,0,0)")
      .nodeId("id").nodeVal("val").nodeRelSize(coarse ? 5 : 4)
      .nodeLabel((node) => `<div class="graph-tooltip">${escapeHTML(node.title)}</div>`)
      .nodeColor(nodeColor).linkColor(edgeColor).linkWidth(edgeWidth)
      .linkCurvature((edge) => edge.type === "concurrent-with" ? 0.25 : 0)
      .nodeCanvasObjectMode(() => "after")
      .nodeCanvasObject((node, ctx, scale) => {
        const major = node.group === "root" || node.group === "hub";
        const focus = active();
        const lit = !focus || neighbourhood(focus).has(node.id);
        // Ring/weight distinguish hubs even in monochrome or grayscale.
        if (major || node.id === focus) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, Math.sqrt(node.val) * graph.nodeRelSize() + 2 / scale, 0, 2 * Math.PI);
          ctx.strokeStyle = lit ? "#67e8f9" : "rgba(148,163,184,0.12)";
          ctx.lineWidth = (major ? 1.7 : 2) / scale;
          ctx.stroke();
        }
        if (!major && scale < 1.5 && node.id !== focus) return;
        const size = Math.max(10 / scale, 2.2);
        ctx.font = `${major ? 700 : 500} ${size}px Manrope, sans-serif`;
        ctx.textBaseline = "top";
        const radius = Math.sqrt(node.val) * graph.nodeRelSize();
        const screen = graph.graph2ScreenCoords(node.x, node.y);
        const textWidth = ctx.measureText(node.label).width * scale;
        // Flip long labels inward when their centred placement would clip.
        ctx.textAlign = screen.x - textWidth / 2 < 8 ? "left" :
          screen.x + textWidth / 2 > stage.clientWidth - 8 ? "right" : "center";
        ctx.fillStyle = lit ? "#e2e8f0" : "rgba(148,163,184,0.12)";
        ctx.fillText(node.label, node.x, node.y + radius + 2 / scale);
      })
      .onNodeHover((node) => {
        hovered = node?.id || null;
        host.style.cursor = node ? "pointer" : "grab";
        repaint();
      })
      .onNodeClick((node) => {
        if (motionButton.getAttribute("aria-pressed") !== "true") openNode(node.id, listButton);
      })
      .onBackgroundClick(() => {
        if (motionButton.getAttribute("aria-pressed") !== "true") closePanel();
      })
      .onRenderFramePost(() => positionPanel())
      .onEngineTick(() => { if (!moved && ++ticks % 12 === 0) fit(0); })
      .onEngineStop(() => { if (!moved) fit(reduced ? 0 : 400); });

    graph.d3Force("charge").strength(-160).distanceMax(420);
    graph.d3Force("link").distance((edge) => edge.type === "contains" ? 45 : 90);
    graph.d3VelocityDecay(0.28);
    if (reduced) {
      graph.warmupTicks(220).cooldownTicks(0);
      motionButton.setAttribute("aria-pressed", "true");
      motionButton.textContent = "Resume motion";
    } else graph.cooldownTicks(coarse ? 120 : 200).cooldownTime(Infinity);
    graph.graphData({
      nodes: graphNodes.map((node) => ({ ...node, val: graphGroups[node.group].size })),
      links: graphEdges.map((edge) => ({ ...edge })),
    });
    for (const name of ["wheel", "pointerdown", "touchstart"]) {
      host.addEventListener(name, () => { moved = true; }, { passive: true });
    }
    new ResizeObserver(() => {
      graph.width(stage.clientWidth).height(stage.clientHeight);
      if (!moved) fit(0);
    }).observe(stage);
    mobile.addEventListener("change", () => { if (!moved) fit(0); });
    status.textContent = `${graphNodes.length} nodes · ${graphEdges.length} connections`;
    document.documentElement.dataset.graphReady = "true";
    // With cooldownTicks(0), the library has no animated tick on which to
    // refit; let it commit its warmup positions to the canvas first.
    if (reduced) requestAnimationFrame(() => requestAnimationFrame(() => fit(0)));
    else fit(0);
    syncHash();
  } catch (error) {
    console.warn("Graph could not start; using profile list", error);
    graph = null;
    showFallback();
    syncHash();
  }

  function fit(duration) {
    if (!graph) return;
    const time = motionButton.getAttribute("aria-pressed") === "true" ? 0 : duration;
    if (mobile.matches) {
      const bbox = graph.getGraphBbox();
      const root = graph.graphData().nodes.find((node) => node.id === "me");
      if (bbox && root && Number.isFinite(root.x) && Number.isFinite(root.y)) {
        const fitted = Math.min(
          (stage.clientWidth - 96) / (bbox.x[1] - bbox.x[0]),
          (stage.clientHeight - 96) / (bbox.y[1] - bbox.y[0]),
        );
        const target = 40 / (2 * Math.sqrt(graphGroups.project.size) * graph.nodeRelSize());
        graph.centerAt(root.x, root.y, time);
        graph.zoom(Math.min(Math.max(target, fitted), fitted * 2), time);
      }
    } else graph.zoomToFit(time, 48);
    if (time === 0) repaint();
  }
}
