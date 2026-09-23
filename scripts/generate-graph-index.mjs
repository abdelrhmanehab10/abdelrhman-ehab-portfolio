// Run after regenerating graph.js; --check compares committed HTML without writing.
// The checked-in index is the no-JS, crawler and keyboard-readable graph layer.
import { readFileSync, writeFileSync } from "node:fs";
import { graphNodes, graphEdges } from "../src/constant/graph.js";

const nodesById = new Map(graphNodes.map((node) => [node.id, node]));
const ids = new Set(nodesById.keys());
if (ids.size !== graphNodes.length || graphNodes.length !== 52 || graphEdges.length !== 104 ||
    graphEdges.some(({ source, target }) => !ids.has(source) || !ids.has(target))) {
  throw new Error("Graph IDs, endpoints or expected node/edge counts are invalid");
}
const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const children = (id) => graphEdges.filter((edge) => edge.type === "contains" && edge.source === id)
  .map((edge) => nodesById.get(edge.target));
const neighbours = new Map(graphNodes.map((node) => [node.id, []]));
for (const { source, target } of graphEdges) {
  neighbours.get(source).push(target);
  neighbours.get(target).push(source);
}
const connections = (node) => `<p class="graph-index-connections">Connected to: ${neighbours.get(node.id)
  .map((id) => `<a href="#graph-node-${esc(id)}">${esc(nodesById.get(id).title)}</a>`).join(", ")}</p>`;
const row = (node) => `<li id="graph-node-${esc(node.id)}" tabindex="-1"><button type="button" data-node="${esc(node.id)}">${esc(node.title)}</button><span class="graph-index-summary">${esc(node.summary)}</span>${connections(node)}</li>`;
const root = graphNodes.find((node) => node.id === "me");
const index = `<ul id="graph-index">\n  ${row(root)}\n  ${children("me").map((hub) => `<li id="graph-node-${esc(hub.id)}" tabindex="-1"><h3><button type="button" data-node="${esc(hub.id)}">${esc(hub.title)}</button></h3><p>${esc(hub.summary)}</p>${connections(hub)}<ul>${children(hub.id).map(row).join("\n")}</ul></li>`).join("\n  ")}\n</ul>`;
const base = "https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/";
const person = {
  "@context": "https://schema.org", "@type": "Person", name: root.title,
  jobTitle: root.summary.split(' with ')[0], description: root.summary, url: base,
  sameAs: ["https://github.com/abdelrhmanehab10/", "https://www.linkedin.com/in/abdelrahman-ehab-87261a244/"],
  knowsAbout: graphNodes.filter((node) => ["skill", "craft", "domain"].includes(node.group)).map((node) => node.title),
  hasOccupation: graphNodes.filter((node) => node.group === "role").map((node) => ({
    "@type": "Occupation", name: node.title, description: node.summary,
  })),
  subjectOf: graphNodes.filter((node) => node.group === "project").map((node) => ({
    "@type": "CreativeWork", name: node.title, description: node.summary,
  })),
};
const path = new URL("../index.html", import.meta.url);
let html = readFileSync(path, "utf8");
html = html.replace(/<!-- graph-index:start -->[\s\S]*?<!-- graph-index:end -->/,
  `<!-- graph-index:start -->\n          ${index}\n          <!-- graph-index:end -->`);
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n    </script>`);
const description = esc(root.summary);
const jobTitle = esc(root.summary.split(' with ')[0]);
for (const [pattern, replacement] of [
  [/(<p\s+id="hero-badge"[^>]*>)[\s\S]*?(<\/p>)/, `$1${esc(root.title)} - ${jobTitle}$2`],
  [/(<h1\s+id="hero-headline"[^>]*>)[\s\S]*?(<\/h1>)/, `$1${esc(root.title)} · <span class="text-cyan-300">${jobTitle}</span>$2`],
  [/(<p\s+id="hero-summary"[^>]*>)[\s\S]*?(<\/p>)/, `$1${description}$2`],
  [/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`],
  [/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`],
  [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${description}$2`],
]) {
  if (!pattern.test(html)) throw new Error(`Missing SEO description: ${pattern}`);
  html = html.replace(pattern, replacement);
}
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== html) throw new Error('Committed HTML is stale; run node scripts/generate-graph-index.mjs');
} else writeFileSync(path, html);
console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${graphNodes.length} index nodes, ${graphEdges.length} edges and Person JSON-LD`);
