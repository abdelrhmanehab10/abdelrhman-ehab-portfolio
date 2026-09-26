import assert from "node:assert/strict";
import { test } from "node:test";
import { graphGroups, graphNodes } from "../src/constant/graph.js";
import { graphInk, initHeroGraph, mixInk, placeCallout } from "../src/hero-graph.js";

function element() {
  const handlers = {};
  const attributes = {};
  const classes = new Set();
  return {
    hidden: false, style: {}, dataset: {}, classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
      toggle(name, force) {
        if (force === false || (force === undefined && classes.has(name))) { classes.delete(name); return false; }
        classes.add(name);
        return true;
      },
    },
    innerHTML: "", textContent: "", clientWidth: 390, clientHeight: 480, children: [],
    addEventListener(name, handler) { (handlers[name] ||= []).push(handler); },
    fire(name, event = {}) { handlers[name]?.forEach((handler) => handler(event)); },
    insertBefore(child) { child.parent = this; },
    getAttribute(name) { return attributes[name] ?? null; },
    setAttribute(name, value) { attributes[name] = value; },
    focus() { document.activeElement = this; },
    contains(child) { return child === this || child?.parent === this; },
    querySelector(selector) { return selector === "canvas" ? canvas : element(); },
    // Web Animations stand-in, present only when a test opts in; finish() settles it.
    ...(animations ? { animate(keyframes, options) {
      const animation = { element: this, keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
      animation.finished = new Promise((resolve) => { animation.finish = resolve; });
      animations.push(animation);
      return animation;
    } } : {}),
  };
}
let animations = null;
const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 480 }) };

function setup(mobile, libraryAvailable = true, initialHash = "", reduced = false, animated = false) {
  animations = animated ? [] : null;
  const selectors = new Map([
    "#graph-stage", "#graph-canvas-host", "#graph-index-wrap", "#graph-panel", "#graph-status",
    ".skip-link", "#graph-index-return",
  ].map((key) => [key, element()]));
  const stage = selectors.get("#graph-stage");
  const panel = selectors.get("#graph-panel");
  panel.hidden = true;
  panel.offsetWidth = 330;
  const parts = new Map();
  panel.querySelector = (selector) => {
    if (!parts.has(selector)) parts.set(selector, element());
    return parts.get(selector);
  };
  panel.parent = stage;
  const index = selectors.get("#graph-index-wrap");
  index.classList.add("graph-index-hidden");
  const nodeButtons = new Map();
  index.querySelector = (selector) => {
    if (!selector.startsWith("[data-node=")) return element();
    if (!nodeButtons.has(selector)) {
      const button = element();
      button.parent = index;
      nodeButtons.set(selector, button);
    }
    return nodeButtons.get(selector);
  };
  const documentHandlers = {};
  globalThis.document = {
    documentElement: { dataset: {} }, activeElement: selectors.get("#graph-stage"),
    querySelector: (key) => selectors.get(key),
    addEventListener(name, handler) { documentHandlers[name] = handler; },
    fire(name, event) { documentHandlers[name]?.(event); },
  };
  const windowHandlers = {};
  globalThis.location = { pathname: "/", search: "", hash: initialHash };
  globalThis.history = { replaceState(_state, _title, url) { location.hash = url.startsWith("#") ? url : ""; } };
  globalThis.matchMedia = (query) => ({ matches: query.includes("max-width") ? mobile : query.includes("prefers-reduced-motion") ? reduced : false, addEventListener() {} });
  globalThis.requestAnimationFrame = (callback) => { callback(); };
  globalThis.ResizeObserver = class { observe() {} };
  const nodes = graphNodes.map((node, i) => ({ ...node, x: i * 100, y: 0, val: graphGroups[node.group].size }));
  const graph = {
    nodes, callbacks: {}, scale: 1, center: null, offset: 0, visibleScale: 1, visibleOffset: 0, rendering: true,
    width() { return this; }, height() { return this; }, backgroundColor() { return this; },
    nodeId() { return this; }, nodeVal() { return this; }, nodeRelSize(value) { return value === undefined ? 5 : this; },
    nodeLabel() { return this; }, nodeColor(callback) { this.color = callback; return this; }, linkColor(callback) { this.edgeColor = callback; return this; }, linkWidth(callback) { this.edgeWidth = callback; return this; },
    linkCurvature() { return this; }, nodeCanvasObjectMode() { return this; }, nodeCanvasObject() { return this; },
    onNodeHover(callback) { this.callbacks.hover = callback; return this; },
    onNodeClick(callback) { this.callbacks.click = callback; return this; },
    onBackgroundClick(callback) { this.callbacks.background = callback; return this; },
    onRenderFramePre(callback) { this.callbacks.pre = callback; return this; },
    onRenderFramePost(callback) { this.callbacks.frame = callback; return this; },
    autoPauseRedraw(value) { this.autoPause = value; return this; },
    onEngineTick() { return this; }, onEngineStop() { return this; },
    d3Force() { return { strength: () => ({ distanceMax() {} }), distance() {} }; },
    d3VelocityDecay() { return this; }, warmupTicks() { return this; },
    cooldownTicks(value) { this.cooldown = value; return this; }, cooldownTime() { return this; },
    d3ReheatSimulation() { this.reheated = true; return this; },
    graphData(value) { if (value) { this.links = value.links; return this; } return { nodes: this.nodes, links: this.links }; },
    getGraphBbox() { return { x: [-100, 5300], y: [-100, 100] }; },
    graph2ScreenCoords(x, y) { return { x: x * this.scale + this.offset, y: y * this.scale }; },
    zoom(value) { if (value === undefined) return this.scale; this.scale = value; return this; },
    centerAt(x, y) { this.center = { x, y }; return this; },
    zoomToFit(duration) {
      const apply = () => { this.scale = 0.12; this.center = { x: 2600, y: 0 }; };
      if (duration) setTimeout(apply, 0);
      else apply();
      return this;
    },
    pauseAnimation() { this.rendering = false; return this; },
    resumeAnimation() { this.rendering = true; this.render(); return this; },
    render() {
      if (!this.rendering) return;
      this.visibleScale = this.scale;
      this.visibleOffset = this.offset;
      this.visiblePositions = new Map(this.nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
    },
  };
  globalThis.window = {
    ForceGraph: libraryAvailable ? class { constructor() { return graph; } } : undefined,
    addEventListener(name, handler) { windowHandlers[name] = handler; },
    fire(name) { windowHandlers[name]?.(); },
  };
  initHeroGraph();
  let libraryHover = null;
  selectors.get("#graph-canvas-host").addEventListener("pointermove", (event) => {
    if (!graph.rendering || !graph.callbacks.hover) return;
    const hit = graph.nodes.find((node) => {
      const screen = graph.graph2ScreenCoords(node.x, node.y);
      return Math.hypot(screen.x - event.clientX, screen.y - event.clientY) <= Math.sqrt(node.val) * 5 * graph.zoom();
    }) || null;
    if (hit !== libraryHover) {
      libraryHover = hit;
      graph.callbacks.hover(hit);
    }
    graph.render();
  });
  graph.render();
  return { graph, stage, panel, selectors, animations };
}

test("hash navigation opens the newly linked node and closes on another section", () => {
  const { panel } = setup(false);
  location.hash = "#node/proj-efa";
  window.fire("hashchange");
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">EFA<\/h2>/);
  location.hash = "#node/proj-virtuwa-hv";
  window.fire("hashchange");
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  location.hash = "#contact";
  window.fire("hashchange");
  assert.equal(panel.hidden, true);
  assert.equal(location.hash, "#contact");
});

test("reduced-motion pointer selects a node even when the library has a stale link hover", () => {
  const { graph, panel, selectors } = setup(false, true, "", true);
  const host = selectors.get("#graph-canvas-host");
  const actual = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  const pointer = { pointerId: 1, clientX: actual.x * graph.zoom(), clientY: 0, button: 0 };
  host.fire("pointerdown", pointer);
  host.fire("pointerup", pointer);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  graph.callbacks.click(graph.nodes.find((node) => node.id === "proj-efa"), pointer);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  const background = { pointerId: 1, clientX: 389, clientY: 450, button: 0 };
  host.fire("pointerdown", background);
  host.fire("pointerup", background);
  assert.equal(panel.hidden, false);
});

test("reduced-motion picking chooses the topmost node at an overlap", () => {
  const { graph, panel, selectors } = setup(false, true, "", true);
  const lower = graph.nodes.find((node) => node.id === "proj-efa");
  const upper = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  lower.x = upper.x - 2;
  const host = selectors.get("#graph-canvas-host");
  const pointer = { pointerId: 1, clientX: lower.x * graph.zoom(), clientY: 0, button: 0 };
  host.fire("pointerdown", pointer);
  host.fire("pointerup", pointer);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
});

test("reduced-motion pan and zoom redraw the view before picking a visible node", () => {
  const { graph, panel, selectors } = setup(false, true, "", true);
  graph.zoom(0.3);
  graph.offset = 14;
  graph.render();
  assert.equal(graph.visibleScale, graph.zoom());
  assert.equal(graph.visibleOffset, graph.offset);
  const actual = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  const pointer = { pointerId: 1, clientX: actual.x * graph.visibleScale + graph.visibleOffset, clientY: 0, button: 0 };
  selectors.get("#graph-canvas-host").fire("pointerdown", pointer);
  selectors.get("#graph-canvas-host").fire("pointerup", pointer);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
});

test("reduced-motion dragging redraws a moved node without selecting it on release", () => {
  const { graph, panel, selectors } = setup(false, true, "", true);
  const host = selectors.get("#graph-canvas-host");
  assert.equal(graph.rendering, true);
  const actual = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  const start = { pointerId: 1, clientX: actual.x * graph.zoom(), clientY: 0, button: 0 };
  host.fire("pointerdown", start);
  actual.x += 50;
  const end = { ...start, clientX: actual.x * graph.zoom() };
  host.fire("pointermove", end);
  graph.render();
  assert.equal(graph.visiblePositions.get(actual.id).x, actual.x);
  host.fire("pointerup", end);
  assert.equal(panel.hidden, true);
  host.fire("pointerdown", end);
  host.fire("pointerup", end);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
});

test("prefers-reduced-motion automatically warms the graph without animated ticks", () => {
  const { graph, selectors } = setup(false, true, "", true);
  assert.equal(graph.cooldown, 0);
  const host = selectors.get("#graph-canvas-host");
  for (const id of ["proj-efa", "proj-virtuwa-hv"]) {
    const node = graph.nodes.find((entry) => entry.id === id);
    host.fire("pointermove", { pointerId: 1, clientX: node.x * graph.zoom(), clientY: 0 });
    assert.equal(graph.color(node), graphInk.selected);
    assert.equal(graph.cooldown, 0);
  }
});

test("list selection reactivates a previously hovered node on canvas return", () => {
  const { graph, selectors } = setup(false, true, "", true);
  const host = selectors.get("#graph-canvas-host");
  const efa = graph.nodes.find((node) => node.id === "proj-efa");
  const virtu = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  host.fire("pointermove", { pointerId: 1, clientX: efa.x * graph.zoom(), clientY: 0 });
  selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: virtu.id } }) } });
  assert.equal(graph.color(virtu), graphInk.selected);
  host.fire("pointermove", { pointerId: 1, clientX: efa.x * graph.zoom(), clientY: 0 });
  assert.equal(graph.color(efa), graphInk.selected);
});

test("list selection clears stale hover but new canvas hover takes precedence", () => {
  const { graph, selectors, panel } = setup(false, true, "", true);
  graph.callbacks.hover(graph.nodes.find((node) => node.id === "proj-efa"));
  const index = selectors.get("#graph-index-wrap");
  index.fire("click", { target: { closest: () => ({ dataset: { node: "proj-virtuwa-hv" } }) } });
  const selected = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  assert.equal(graph.color(selected), graphInk.selected);
  const hovered = graph.nodes.find((node) => node.id === "proj-clinic-flow");
  graph.callbacks.hover(hovered);
  assert.equal(graph.color(hovered), graphInk.selected);
  graph.callbacks.hover(null);
  assert.equal(graph.color(selected), graphInk.selected);
});

test("client security work is described without exposing the original detail", () => {
  const { panel, selectors } = setup(false);
  const index = selectors.get("#graph-index-wrap");
  for (const id of ["proj-virtuwa-hv", "craft-security"]) {
    index.fire("click", { target: { closest: () => ({ dataset: { node: id } }) } });
    assert.match(panel.innerHTML, /session-based bootstrap and short-lived, opaque identifiers/);
    assert.doesNotMatch(panel.innerHTML, /sensitive VM\/connection data|browser URLs/i);
  }
});

test("deployment detail omits private topology and privileged command scope", () => {
  const { panel, selectors } = setup(false);
  const index = selectors.get("#graph-index-wrap");
  for (const id of ["skill-devops", "craft-cicd"]) {
    index.fire("click", { target: { closest: () => ({ dataset: { node: id } }) } });
    assert.doesNotMatch(panel.innerHTML, /443\/6000\/5678|passwordless sudo|\(rm, copy, nginx reload\)/i);
  }
  index.fire("click", { target: { closest: () => ({ dataset: { node: "skill-devops" } }) } });
  assert.match(panel.innerHTML, />Nginx reverse proxy</);
  index.fire("click", { target: { closest: () => ({ dataset: { node: "craft-cicd" } }) } });
  assert.match(panel.innerHTML, /Least-privilege sudo rules scoped to the deployment commands only/);
});

test("keyboard skip and return links expose the list without a controls bar", () => {
  const { selectors, stage } = setup(false);
  const index = selectors.get("#graph-index-wrap");
  let prevented = false;
  selectors.get(".skip-link").fire("click", { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(document.activeElement, index);
  selectors.get("#graph-index-return").fire("click", { preventDefault() { prevented = true; } });
  assert.equal(document.activeElement, stage);
  assert.equal(selectors.has("#btn-list"), false);
});

test("successful graph load does not announce totals and library failure remains announced", () => {
  const { selectors } = setup(false);
  assert.doesNotMatch(selectors.get("#graph-status").textContent, /\d+\s+nodes\s*·\s*\d+\s+connections/);

  const failed = setup(false, false);
  assert.equal(failed.selectors.get("#graph-status").textContent, "Graph unavailable — showing profile list");
});

test("library failure keeps list-selected details visible", () => {
  const { panel, stage, selectors } = setup(false, false);
  assert.equal(stage.hidden, true);
  const index = selectors.get("#graph-index-wrap");
  assert.equal(index.classList.contains("graph-index-hidden"), false);
  index.fire("click", { target: { closest: () => ({ dataset: { node: "proj-efa" } }) } });
  assert.equal(panel.parent, index);
  assert.equal(panel.hidden, false);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">EFA<\/h2>/);
});

test("library failure honors initial and changed deep links with list focus restoration", () => {
  const { panel, selectors, stage } = setup(false, false, "#node/proj-efa");
  assert.equal(stage.hidden, true);
  assert.equal(panel.parent, selectors.get("#graph-index-wrap"));
  assert.equal(panel.hidden, false);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">EFA<\/h2>/);
  location.hash = "#node/proj-virtuwa-hv";
  window.fire("hashchange");
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  document.fire("keydown", { key: "Escape" });
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, selectors.get("#graph-index-wrap").querySelector('[data-node="proj-virtuwa-hv"]'));
  assert.equal(location.hash, "");
});

test("Escape and double-click reset the graph after zoom and pan", async () => {
  for (const mobile of [false, true]) {
    const { graph, panel, selectors } = setup(mobile);
    const opening = { scale: graph.zoom(), center: graph.center };
    graph.zoom(5);
    graph.centerAt(50, 50);
    document.fire("keydown", { key: "Escape" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(graph.zoom(), opening.scale);
    assert.deepEqual(graph.center, opening.center);
    graph.zoom(5);
    selectors.get("#graph-canvas-host").fire("dblclick");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(graph.zoom(), opening.scale);
    assert.deepEqual(graph.center, opening.center);
    const origin = selectors.get("#graph-index-wrap").querySelector('[data-node="me"]');
    location.hash = "#node/me";
    window.fire("hashchange");
    selectors.get("#graph-canvas-host").fire("dblclick");
    assert.equal(panel.hidden, true);
    assert.equal(document.activeElement, origin, "double-click reset restores focus from a closed callout");
  }
});

test("Connect and project details keep their actions, technologies and source notices", () => {
  const { panel, selectors } = setup(false);
  const index = selectors.get("#graph-index-wrap");
  const open = (id) => index.fire("click", { target: { closest: () => ({ dataset: { node: id } }) } });
  open("link-resume");
  assert.match(panel.innerHTML, /<a class="graph-action" href="\.\/assets\/abdelrhmanehab_resume\.pdf" download>Resume \(PDF\)<\/a>/);
  open("link-email");
  assert.match(panel.innerHTML, /<a class="graph-action" href="mailto:abdelrhmanehab047@gmail\.com">Email<\/a>/);
  for (const id of ["link-linkedin", "link-github"]) {
    open(id);
    assert.match(panel.innerHTML, /class="graph-action" href="https:[^"]+" target="_blank" rel="noopener noreferrer"/);
  }
  open("proj-virtuwa-hv");
  assert.match(panel.innerHTML, /Client-owned product; platform walkthrough available on request\./);
  assert.match(panel.innerHTML, /<span>React<\/span>/);
  open("proj-qr-verify");
  assert.match(panel.innerHTML, /Client-owned product; source code is private\./);
  assert.match(panel.innerHTML, /<span>MongoDB \(Mongoose\)<\/span>/);
  open("proj-bleu-blog");
  assert.match(panel.innerHTML, /<span>Eleventy<\/span>/);
  assert.doesNotMatch(panel.innerHTML, /Client-owned product|See in/);
});

test("callout sits beside the node, flips at the edge and drops below on phones", () => {
  const stage = { width: 1000, height: 600, cardWidth: 330, cardHeight: 300 };
  const right = placeCallout({ ...stage, x: 300, y: 300, mobile: false });
  assert.deepEqual([right.side, right.left], ["right", 330]);
  assert.equal(right.top + right.arrow, 300, "arrow points at the node row");
  const left = placeCallout({ ...stage, x: 900, y: 300, mobile: false });
  assert.deepEqual([left.side, left.left + 330 + 30], ["left", 900]);
  const narrow = placeCallout({ ...stage, width: 660, x: 330, y: 150, mobile: false });
  assert.equal(narrow.side, "below");
  assert.equal(narrow.left + narrow.arrow, 330, "arrow points at the node column");
  const phone = placeCallout({ ...stage, width: 358, x: 180, y: 120, mobile: true });
  assert.deepEqual([phone.side, phone.left, phone.top], ["below", 12, 150]);
  assert.ok(phone.top + Math.min(300, phone.maxHeight) <= 600 - 12, "card stays inside the stage");
  const low = placeCallout({ ...stage, width: 358, x: 180, y: 560, mobile: true });
  assert.equal(low.side, "above");
  assert.ok(low.top >= 12 && low.top + Math.min(300, low.maxHeight) <= 560 - 30);
  assert.equal(placeCallout({ ...stage, x: -40, y: 300, mobile: false }).arrow, null, "no arrow for an off-stage node");
});

test("short stages size the callout to available space and hide misaligned arrows", () => {
  const card = { width: 358, cardWidth: 334, cardHeight: 400, mobile: true };
  const below = placeCallout({ ...card, height: 200, x: 180, y: 100 });
  assert.equal(below.side, "below");
  assert.equal(below.maxHeight, 56);
  assert.equal(below.top, 130);
  assert.equal(below.top + below.maxHeight + 2, 188);
  assert.equal(below.left + below.arrow, 180);

  const above = placeCallout({ ...card, height: 200, x: 180, y: 180 });
  assert.equal(above.side, "above");
  assert.equal(above.top + above.maxHeight + 2 + 30, 180);
  assert.equal(above.left + above.arrow, 180);

  const cramped = placeCallout({ ...card, height: 60, x: 180, y: 30 });
  assert.equal(cramped.arrow, null);
  assert.equal(cramped.maxHeight, 0);
  assert.equal(placeCallout({ ...card, height: 200, x: 4, y: 100 }).arrow, null);
  assert.equal(placeCallout({ width: 1000, height: 60, cardWidth: 330, cardHeight: 400, mobile: false, x: 300, y: 0 }).arrow, null);
});

test("each rendered frame keeps the callout and its arrow on the selected node", () => {
  for (const mobile of [false, true]) {
    const { graph, panel, selectors, stage } = setup(mobile);
    const node = graph.nodes.find((entry) => entry.id === "proj-virtuwa-hv");
    node.y = 400;
    panel.querySelector(".graph-panel-scroll").scrollHeight = 240;
    graph.scale = 0.5;
    graph.offset = 60 - node.x * graph.scale;
    selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: node.id } }) } });
    graph.callbacks.frame();
    const arrow = panel.querySelector(".graph-panel-arrow");
    const x = node.x * graph.scale + graph.offset;
    if (mobile) {
      assert.equal(panel.dataset.side, "below");
      assert.equal(parseFloat(panel.style.left) + parseFloat(arrow.style.left), Math.round(x));
    } else {
      assert.equal(panel.dataset.side, "below", "a 390px-wide desktop stage has no room beside the node");
      stage.clientWidth = 1000;
      graph.callbacks.frame();
      assert.equal(panel.dataset.side, "right");
      assert.equal(parseFloat(panel.style.left), Math.round(x) + 30);
      assert.equal(parseFloat(panel.style.top) + parseFloat(arrow.style.top), 200, "the arrow points at the node row");
      stage.clientWidth = 390;
    }
    graph.offset += 40;
    graph.callbacks.frame();
    assert.equal(parseFloat(panel.style.left) + parseFloat(arrow.style.left), Math.round(x + 40), "the arrow follows a pan");
    assert.equal(arrow.hidden, false);
    graph.offset = -5000;
    graph.callbacks.frame();
    assert.equal(arrow.hidden, true, "an off-stage node hides the arrow");
  }
});

test("callout copy: Read more, singular labels, no repeated skill tags, muted Connect URL", () => {
  const { panel, selectors } = setup(false);
  const open = (id) => selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: id } }) } });
  open("role-pro-event");
  assert.match(panel.innerHTML, /<p class="graph-group-name">Experience<\/p>/);
  assert.match(panel.innerHTML, /class="graph-body is-clamped"/);
  const more = panel.querySelector("#graph-panel-more");
  more.fire("click");
  assert.equal(more.getAttribute("aria-expanded"), "true");
  assert.equal(more.textContent, "Show less");
  assert.equal(panel.querySelector("#graph-panel-body").classList.contains("is-clamped"), false);
  more.fire("click");
  assert.equal(more.getAttribute("aria-expanded"), "false");
  assert.equal(panel.querySelector("#graph-panel-body").classList.contains("is-clamped"), true);
  open("skill-devops");
  assert.match(panel.innerHTML, /<p class="graph-group-name">Skill set<\/p>/);
  assert.doesNotMatch(panel.innerHTML, /graph-summary/);
  assert.equal(panel.innerHTML.match(/Nginx reverse proxy/g).length, 1);
  open("link-linkedin");
  assert.match(panel.innerHTML, /<p class="graph-url">https:\/\/www\.linkedin\.com\//);
  assert.doesNotMatch(panel.innerHTML, /graph-panel-more/);
  open("link-resume");
  assert.match(panel.innerHTML, /<p class="graph-summary">Download the full resume\.<\/p>/);
  open("domain-healthcare");
  assert.match(panel.innerHTML, /id="graph-panel-copy"/);
});

test("list-index fallback shows the whole card without the clamp", () => {
  const { panel, selectors } = setup(false, false);
  selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: "role-pro-event" } }) } });
  assert.doesNotMatch(panel.innerHTML, /is-clamped|graph-panel-more/);
  assert.equal(panel.dataset.side, undefined);
});

test("callout footer has no connection count", () => {
  const { panel, selectors } = setup(false);
  for (const id of ["me", "proj-virtuwa-hv", "domain-healthcare"]) {
    selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: id } }) } });
    assert.doesNotMatch(panel.innerHTML, /graph-meta|\d+\s+connections?/);
    assert.match(panel.innerHTML, /<div class="graph-panel-foot">(<a class="graph-action"|<button type="button" id="graph-panel-copy")/);
  }
});

test("Smoke palette: resting nodes use the group greys and focus blends to the selection ink", () => {
  const { graph, selectors } = setup(false, true, "", true);
  const me = graph.nodes.find((node) => node.id === "me");
  const efa = graph.nodes.find((node) => node.id === "proj-efa");
  assert.equal(graph.color(me), "#ededed");
  assert.equal(graph.color(efa), graphGroups.project.color);
  selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: "proj-efa" } }) } });
  assert.equal(graph.color(efa), graphInk.selected);
  assert.equal(graph.color(graph.nodes.find((node) => node.id === "domain-healthcare")), graphInk.dim);
  for (const color of Object.values(graphGroups).map((group) => group.color)) assert.match(color, /^#([0-9a-f]{2})\1\1$/, "group fills are neutral greys");
  assert.equal(mixInk("#000000", "#ffffff", 0.5), "rgba(128,128,128,1)");
  assert.equal(mixInk(graphInk.dim, "#bdbdbd", 1), "#bdbdbd");
  assert.equal(mixInk(graphInk.dim, "#bdbdbd", 0), graphInk.dim);
});

test("highlight changes ease over frames and stop continuous redraw once settled", () => {
  const { graph, selectors } = setup(false);
  const clock = performance.now;
  let now = 1000;
  performance.now = () => now;
  try {
    const efa = graph.nodes.find((node) => node.id === "proj-efa");
    const far = graph.nodes.find((node) => node.id === "domain-healthcare");
    const edge = graph.links.find((link) => link.source === "proj-efa");
    selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: "proj-efa" } }) } });
    assert.equal(graph.autoPause, false, "redraw runs while easing");
    assert.equal(graph.color(far), graphGroups.domain.color, "first focus starts at rest");
    assert.equal(graph.color(efa), graphGroups.project.color);
    assert.equal(graph.edgeColor(edge), graphInk.edge);
    now += 16;
    graph.callbacks.pre();
    const midway = graph.color(far);
    assert.notEqual(graph.edgeColor(edge), graphInk.edge);
    assert.notEqual(graph.edgeColor(edge), graphInk.edgeFocus);
    assert.notEqual(midway, graphInk.dim);
    assert.notEqual(midway, graphGroups.domain.color);
    assert.match(midway, /^rgba\(/);
    for (let frame = 0; frame < 60; frame++) { now += 16; graph.callbacks.pre(); }
    assert.equal(graph.color(far), graphInk.dim);
    assert.equal(graph.color(efa), graphInk.selected);
    assert.equal(graph.autoPause, true, "an idle graph pauses redraw again");
  } finally {
    performance.now = clock;
  }
});

test("initial hash selection eases from resting graph ink", () => {
  const { graph } = setup(false, true, "#node/proj-efa");
  const selected = graph.nodes.find((node) => node.id === "proj-efa");
  const far = graph.nodes.find((node) => node.id === "domain-healthcare");
  assert.equal(graph.color(selected), graphGroups.project.color);
  assert.equal(graph.color(far), graphGroups.domain.color);
  assert.equal(graph.autoPause, false);
});

test("callout exit animates while inert, then hides; reopening mid-exit cancels it", async () => {
  const { panel, selectors, animations } = setup(false, true, "", false, true);
  const open = (id) => selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => Object.assign(element(), { dataset: { node: id } }) } });
  open("proj-efa");
  const entrance = animations.at(-1);
  assert.equal(entrance.element, panel);
  assert.deepEqual(entrance.keyframes.map((frame) => frame.opacity), [0, 1]);
  document.fire("keydown", { key: "Escape" });
  const leaving = animations.at(-1);
  assert.deepEqual(leaving.keyframes.map((frame) => frame.opacity), [1, 0]);
  assert.equal(panel.hidden, false, "the card stays visible for its exit");
  assert.equal(panel.inert, true, "an exiting card takes no input");
  assert.equal(location.hash, "", "state changes immediately");
  leaving.finish();
  await leaving.finished;
  assert.equal(panel.hidden, true);
  assert.equal(panel.inert, false);

  open("proj-efa");
  document.fire("keydown", { key: "Escape" });
  const interrupted = animations.at(-1);
  open("proj-virtuwa-hv");
  assert.equal(interrupted.cancelled, true);
  assert.equal(panel.inert, false);
  assert.equal(panel.hidden, false);
  assert.deepEqual(animations.at(-1).keyframes.map((frame) => frame.opacity), [0, 1], "reopening replays the entrance");
  interrupted.finish();
  await interrupted.finished;
  assert.equal(panel.hidden, false, "a cancelled exit never hides the reopened card");
});

test("a second Escape during exit follows the list focus back to the graph", async () => {
  const { panel, stage, selectors, animations } = setup(false, true, "", false, true);
  const index = selectors.get("#graph-index-wrap");
  index.fire("click", { target: { closest: () => Object.assign(index.querySelector('[data-node="me"]'), { dataset: { node: "me" } }) } });
  document.fire("keydown", { key: "Escape" });
  const leaving = animations.at(-1);
  assert.equal(panel.hidden, false);
  assert.equal(document.activeElement.parent, index);
  document.fire("keydown", { key: "Escape" });
  assert.equal(document.activeElement, stage);
  leaving.finish();
  await leaving.finished;
  assert.equal(panel.hidden, true);
});

test("switching nodes swaps the content in place and Read more glides the card", () => {
  const { graph, panel, selectors, animations } = setup(false, true, "", false, true);
  const open = (id) => selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => Object.assign(element(), { dataset: { node: id } }) } });
  const scroll = panel.querySelector(".graph-panel-scroll");
  scroll.children = [element(), element()];
  open("proj-efa");
  const before = animations.length;
  open("role-pro-event");
  const swapped = animations.slice(before);
  assert.ok(swapped.filter((animation) => scroll.children.includes(animation.element)).length === 2, "each content block fades up");
  assert.ok(swapped.every((animation) => animation.keyframes.every((frame) => Object.keys(frame).every((key) => key === "opacity" || key === "transform"))), "compositor-only keyframes");

  const body = panel.querySelector("#graph-panel-body");
  body.clientHeight = 118;
  body.offsetTop = 0;
  const visible = { ...element(), offsetTop: 0, offsetHeight: 140 };
  const partial = { ...element(), offsetTop: 90, offsetHeight: 60 };
  const folded = { ...element(), offsetTop: 130, offsetHeight: 60 };
  body.children = [visible, partial, folded];
  const node = graph.nodes.find((entry) => entry.id === "role-pro-event");
  node.y = 400;
  graph.callbacks.frame();
  scroll.scrollHeight = 900;
  const more = panel.querySelector("#graph-panel-more");
  const count = animations.length;
  more.fire("click");
  const expanded = animations.slice(count);
  assert.equal(more.textContent, "Show less");
  assert.ok(expanded.some((animation) => animation.element === folded), "folded content fades in");
  assert.ok(!expanded.some((animation) => animation.element === visible), "a summary crossing the fold stays visible");
  assert.ok(!expanded.some((animation) => animation.element === partial), "partially visible content does not flicker");
});

test("summary-only Read more reveals hidden lines without fading the summary", () => {
  const { panel, selectors, animations } = setup(false, true, "", false, true);
  selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => ({ dataset: { node: "hub-experience" } }) } });
  const body = panel.querySelector("#graph-panel-body");
  body.classList.add("is-clamped");
  body.offsetTop = 0;
  Object.defineProperty(body, "clientHeight", { get: () => body.classList.contains("is-clamped") ? 118 : 175 });
  const summary = { ...element(), offsetTop: 0, offsetHeight: 175 };
  body.children = [summary];
  const before = animations.length;
  panel.querySelector("#graph-panel-more").fire("click");
  const reveal = animations.slice(before);
  assert.equal(panel.querySelector("#graph-panel-more").getAttribute("aria-expanded"), "true");
  assert.ok(reveal.some(({ element, keyframes }) => element === body && keyframes[0].clipPath === "inset(0 0 57px 0)"));
  assert.ok(reveal.some(({ element }) => element === panel.querySelector("#graph-panel-more")));
  assert.ok(!reveal.some(({ element }) => element === summary));
});

test("reduced motion changes the callout and highlight instantly", () => {
  const { graph, panel, selectors, animations } = setup(false, true, "", true, true);
  selectors.get("#graph-index-wrap").fire("click", { target: { closest: () => Object.assign(element(), { dataset: { node: "hub-experience" } }) } });
  const body = panel.querySelector("#graph-panel-body");
  body.classList.add("is-clamped");
  Object.defineProperty(body, "clientHeight", { get: () => body.classList.contains("is-clamped") ? 118 : 175 });
  panel.querySelector("#graph-panel-more").fire("click");
  assert.equal(animations.length, 0);
  document.fire("keydown", { key: "Escape" });
  assert.equal(panel.hidden, true);
  assert.equal(animations.length, 0);
  assert.equal(graph.autoPause, undefined, "reduced motion never forces continuous redraw");
  assert.equal(graph.color(graph.nodes.find((node) => node.id === "proj-efa")), graphGroups.project.color);
});
