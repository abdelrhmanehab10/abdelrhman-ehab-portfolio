import { graphNodes, graphEdges, graphGroups } from "./constant/graph.js";

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
  let press = null;
  let moved = false;
  let zooming = false;
  let pauseTicket = 0;
  let ticks = 0;

  function showFallback() {
    index.insertBefore(panel, index.querySelector("#graph-index"));
    stage.hidden = true;
    index.classList.remove("graph-index-hidden");
    index.classList.add("graph-list-open");
    status.textContent = "Graph unavailable — showing profile list";
    listButton.hidden = resetButton.hidden = motionButton.hidden = true;
  }

  const active = () => selected || hovered;
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
    if (graph && motionButton.getAttribute("aria-pressed") === "true") {
      graph.resumeAnimation();
      if (!zooming) {
        const ticket = ++pauseTicket;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (ticket === pauseTicket && !zooming && motionButton.getAttribute("aria-pressed") === "true") graph?.pauseAnimation();
        }));
      }
    }
  }
  function nodeAt(event) {
    const canvas = host.querySelector("canvas");
    if (!canvas || !graph) return null;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * stage.clientWidth / bounds.width;
    const y = (event.clientY - bounds.top) * stage.clientHeight / bounds.height;
    return graph.graphData().nodes.find((node) => {
      const screen = graph.graph2ScreenCoords(node.x, node.y);
      const radius = Math.sqrt(node.val) * graph.nodeRelSize() * graph.zoom();
      return Math.hypot(screen.x - x, screen.y - y) <= radius;
    }) || null;
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
    selected = id;
    const group = graphGroups[node.group].label;
    const link = node.href && /^(https?:\/\/|mailto:|\.\/assets\/)/.test(node.href)
      ? `<a class="graph-action" href="${escapeHTML(node.href)}" ${/^https?:/.test(node.href) ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHTML(node.linkLabel || "Open link")}</a>` : "";
    const sectionTitle = node.sectionId && document.getElementById(node.sectionId)?.querySelector("h2")?.textContent.trim();
    const section = sectionTitle
      ? `<a class="graph-secondary" href="#${escapeHTML(node.sectionId)}">See in ${escapeHTML(sectionTitle)}</a>` : "";
    panel.innerHTML = `<div class="graph-panel-heading"><div><p class="graph-group-name">${escapeHTML(group)}</p>
      <h2 id="graph-panel-title">${escapeHTML(node.title)}</h2>
      ${node.meta ? `<p class="graph-meta">${escapeHTML(node.meta)}</p>` : ""}</div>
      <button type="button" id="graph-panel-close" aria-label="Close node details">&times;</button></div>
      <p class="graph-summary">${escapeHTML(node.summary)}</p>
      ${node.bullets?.length ? `<ul class="graph-bullets">${node.bullets.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
      ${node.tags?.length ? `<div class="graph-tags">${node.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>` : ""}
      ${link}${section}<p class="graph-meta">${adjacency.get(id)?.size || 0} connections</p>`;
    panel.hidden = false;
    panel.querySelector("#graph-panel-close").addEventListener("click", () => closePanel());
    panel.querySelector(".graph-secondary")?.addEventListener("click", () => closePanel({ restoreFocus: false }));
    panel.focus();
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
  listButton.addEventListener("click", () => {
    const open = index.classList.toggle("graph-list-open");
    index.classList.toggle("graph-index-hidden", !open);
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
    ++pauseTicket;
    if (paused) graph?.pauseAnimation();
    else graph?.resumeAnimation();
    motionButton.textContent = paused ? "Resume motion" : "Pause motion";
  });

  // Static HTML index is generated from graphNodes at authoring time so it is
  // readable even with JavaScript disabled or when the module fails to load.
  if (typeof window.ForceGraph !== "function") {
    showFallback();
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
      .onNodeDrag(() => { if (motionButton.getAttribute("aria-pressed") === "true") repaint(); })
      .onNodeDragEnd(() => { if (motionButton.getAttribute("aria-pressed") === "true") repaint(); })
      .onZoom(() => {
        if (motionButton.getAttribute("aria-pressed") === "true") {
          zooming = true;
          ++pauseTicket;
          graph?.resumeAnimation();
        }
      })
      .onZoomEnd(() => {
        if (zooming) {
          zooming = false;
          repaint();
        }
      })
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
    function syncHash() {
      if (!location.hash.startsWith("#node/")) {
        closePanel({ restoreFocus: false });
        return;
      }
      let id;
      try { id = decodeURIComponent(location.hash.slice(6)); }
      catch { return; }
      if (byId.has(id) && selected !== id) openNode(id, listButton);
    }
    window.addEventListener("hashchange", syncHash);
    syncHash();
  } catch (error) {
    console.warn("Graph could not start; using profile list", error);
    graph = null;
    showFallback();
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
