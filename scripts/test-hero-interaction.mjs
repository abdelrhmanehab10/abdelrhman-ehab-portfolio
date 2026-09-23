import assert from "node:assert/strict";
import { test } from "node:test";
import { graphGroups, graphNodes } from "../src/constant/graph.js";
import { coreTechnologies } from "../src/constant/index.js";
import { initHeroGraph } from "../src/hero-graph.js";

function element() {
  const handlers = {};
  const attributes = {};
  return {
    hidden: false, style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    innerHTML: "", textContent: "", clientWidth: 390, clientHeight: 480,
    addEventListener(name, handler) { (handlers[name] ||= []).push(handler); },
    fire(name, event = {}) { handlers[name]?.forEach((handler) => handler(event)); },
    insertBefore(child) { child.parent = this; },
    getAttribute(name) { return attributes[name] ?? null; },
    setAttribute(name, value) { attributes[name] = value; },
    focus() {},
    querySelector(selector) { return selector === "canvas" ? canvas : element(); },
  };
}
const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 480 }) };

function setup(mobile, libraryAvailable = true) {
  const selectors = new Map([
    "#graph-stage", "#graph-canvas-host", "#graph-index-wrap", "#graph-panel", "#graph-status",
    "#btn-list", "#btn-reset", "#btn-motion",
  ].map((key) => [key, element()]));
  const stage = selectors.get("#graph-stage");
  const panel = selectors.get("#graph-panel");
  panel.hidden = true;
  panel.parent = stage;
  const documentHandlers = {};
  globalThis.document = {
    documentElement: { dataset: {} }, activeElement: selectors.get("#btn-list"),
    querySelector: (key) => selectors.get(key),
    getElementById: () => null,
    addEventListener(name, handler) { documentHandlers[name] = handler; },
  };
  const windowHandlers = {};
  globalThis.location = { pathname: "/", search: "", hash: "" };
  globalThis.history = { replaceState(_state, _title, url) { location.hash = url.startsWith("#") ? url : ""; } };
  globalThis.matchMedia = (query) => ({ matches: query.includes("max-width") ? mobile : false, addEventListener() {} });
  globalThis.requestAnimationFrame = (callback) => { callback(); };
  globalThis.ResizeObserver = class { observe() {} };
  const nodes = graphNodes.map((node, i) => ({ ...node, x: i * 100, y: 0, val: graphGroups[node.group].size }));
  const graph = {
    nodes, callbacks: {}, scale: 1, center: null, offset: 0, visibleScale: 1, visibleOffset: 0,
    width() { return this; }, height() { return this; }, backgroundColor() { return this; },
    nodeId() { return this; }, nodeVal() { return this; }, nodeRelSize(value) { return value === undefined ? 5 : this; },
    nodeLabel() { return this; }, nodeColor(callback) { this.color = callback; return this; }, linkColor() { return this; }, linkWidth() { return this; },
    linkCurvature() { return this; }, nodeCanvasObjectMode() { return this; }, nodeCanvasObject() { return this; },
    onNodeHover(callback) { this.callbacks.hover = callback; return this; },
    onNodeClick(callback) { this.callbacks.click = callback; return this; },
    onBackgroundClick(callback) { this.callbacks.background = callback; return this; },
    onNodeDrag(callback) { this.callbacks.drag = callback; return this; },
    onNodeDragEnd(callback) { this.callbacks.dragEnd = callback; return this; },
    onZoom(callback) { this.callbacks.zoom = callback; return this; },
    onZoomEnd(callback) { this.callbacks.zoomEnd = callback; return this; },
    onEngineTick() { return this; }, onEngineStop() { return this; },
    d3Force() { return { strength: () => ({ distanceMax() {} }), distance() {} }; },
    d3VelocityDecay() { return this; }, cooldownTicks() { return this; }, cooldownTime() { return this; },
    graphData(value) { if (value) return this; return { nodes: this.nodes }; },
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
    pauseAnimation() { return this; },
    resumeAnimation() {
      this.visibleScale = this.scale;
      this.visibleOffset = this.offset;
      this.visiblePositions = new Map(this.nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
      return this;
    },
  };
  globalThis.window = {
    ForceGraph: libraryAvailable ? class { constructor() { return graph; } } : undefined,
    addEventListener(name, handler) { windowHandlers[name] = handler; },
    fire(name) { windowHandlers[name]?.(); },
  };
  initHeroGraph();
  return { graph, stage, panel, selectors };
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

test("paused pointer selects a node even when the library has a stale link hover", () => {
  const { graph, panel, selectors } = setup(false);
  selectors.get("#btn-motion").fire("click");
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

test("paused pan and zoom redraw the view before picking a visible node", () => {
  const { graph, panel, selectors } = setup(false);
  selectors.get("#btn-motion").fire("click");
  graph.scale = 0.3;
  graph.offset = 14;
  graph.callbacks.zoom();
  graph.callbacks.zoomEnd();
  assert.equal(graph.visibleScale, graph.zoom());
  assert.equal(graph.visibleOffset, graph.offset);
  const actual = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  const pointer = { pointerId: 1, clientX: actual.x * graph.visibleScale + graph.visibleOffset, clientY: 0, button: 0 };
  selectors.get("#graph-canvas-host").fire("pointerdown", pointer);
  selectors.get("#graph-canvas-host").fire("pointerup", pointer);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
});

test("paused dragging redraws a moved node without selecting it on release", () => {
  const { graph, panel, selectors } = setup(false);
  const host = selectors.get("#graph-canvas-host");
  selectors.get("#btn-motion").fire("click");
  graph.resumeAnimation();
  const actual = graph.nodes.find((node) => node.id === "proj-virtuwa-hv");
  const start = { pointerId: 1, clientX: actual.x * graph.zoom(), clientY: 0, button: 0 };
  host.fire("pointerdown", start);
  actual.x += 50;
  const end = { ...start, clientX: actual.x * graph.zoom() };
  host.fire("pointermove", end);
  graph.callbacks.drag(actual);
  graph.callbacks.dragEnd(actual);
  assert.equal(graph.visiblePositions.get(actual.id).x, actual.x);
  host.fire("pointerup", end);
  assert.equal(panel.hidden, true);
  host.fire("pointerdown", end);
  host.fire("pointerup", end);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
});

test("list selection stays highlighted despite a retained canvas hover", () => {
  const { graph, selectors, panel } = setup(false);
  graph.callbacks.hover(graph.nodes.find((node) => node.id === "proj-efa"));
  const index = selectors.get("#graph-index-wrap");
  index.fire("click", { target: { closest: () => ({ dataset: { node: "proj-virtuwa-hv" } }) } });
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">VirtuWa HV/);
  assert.equal(graph.color(graph.nodes.find((node) => node.id === "proj-virtuwa-hv")), "#67e8f9");
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

test("library failure keeps list-selected details visible", () => {
  const { panel, stage, selectors } = setup(false, false);
  assert.equal(stage.hidden, true);
  const index = selectors.get("#graph-index-wrap");
  index.fire("click", { target: { closest: () => ({ dataset: { node: "proj-efa" } }) } });
  assert.equal(panel.parent, index);
  assert.equal(panel.hidden, false);
  assert.match(panel.innerHTML, /<h2 id="graph-panel-title">EFA<\/h2>/);
});

test("reset restores the same mobile and desktop view after zoom and pan", async () => {
  for (const mobile of [false, true]) {
    const { graph, selectors } = setup(mobile);
    const opening = { scale: graph.zoom(), center: graph.center };
    graph.zoom(5);
    graph.centerAt(50, 50);
    selectors.get("#btn-reset").fire("click");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(graph.zoom(), opening.scale);
    assert.deepEqual(graph.center, opening.center);
  }
});

test("the rendered hero keeps core technologies", async () => {
  const meta = element();
  const callbacks = {};
  globalThis.document = {
    querySelector: (selector) => selector === "#hero-meta" ? meta :
      ["#experience-list", "#skills-groups", "#social-links"].includes(selector) ? element() : null,
    querySelectorAll: () => [],
    addEventListener(name, handler) { callbacks[name] = handler; },
  };
  globalThis.window = { addEventListener() {}, scrollY: 0 };
  await import("../src/main.js");
  callbacks.DOMContentLoaded();
  for (const technology of coreTechnologies) assert.ok(meta.innerHTML.includes(technology));
});
