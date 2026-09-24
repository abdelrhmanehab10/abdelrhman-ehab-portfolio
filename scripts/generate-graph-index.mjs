// Run after regenerating graph.js; --check compares committed HTML without writing.
// The checked-in index is the no-JS, crawler and keyboard-readable graph layer.
import { readFileSync, writeFileSync } from "node:fs";
import { graphNodes, graphEdges, profileDetails } from "../src/constant/graph.js";
import { projectNotices } from "../src/constant/index.js";
import { nodeLinkHTML } from "../src/hero-graph.js";

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
const details = (node) => `${node.meta ? `<span class="graph-index-meta">${esc(node.meta)}</span>` : ""}<span class="graph-index-summary">${esc(node.summary)}</span>${node.bullets?.length ? `<ul class="graph-index-bullets">${node.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>` : ""}${node.tags?.length ? `<div class="graph-index-tags">${node.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>` : ""}${projectNotices[node.id] ? `<span class="graph-index-summary">${esc(projectNotices[node.id])}</span>` : ""}${nodeLinkHTML(node, "graph-index-link")}`;
const row = (node) => `<li id="graph-node-${esc(node.id)}" tabindex="-1"><button type="button" data-node="${esc(node.id)}">${esc(node.title)}</button>${details(node)}${connections(node)}</li>`;
const root = graphNodes.find((node) => node.id === "me");
const index = `<ul id="graph-index">\n  ${row(root)}\n  ${children("me").map((hub) => `<li id="graph-node-${esc(hub.id)}" tabindex="-1"><h3><button type="button" data-node="${esc(hub.id)}">${esc(hub.title)}</button></h3>${details(hub)}${connections(hub)}<ul>${children(hub.id).map(row).join("\n")}</ul></li>`).join("\n  ")}\n</ul>`;
const base = profileDetails.contact.Portfolio;
const links = Object.fromEntries(graphNodes.filter(node => node.group === 'link').map(node => [node.id, node]));
const person = {
  "@context": "https://schema.org", "@type": "Person", name: root.title,
  jobTitle: profileDetails.jobTitle, description: root.summary, url: base,
  sameAs: [links['link-github'].href, links['link-linkedin'].href],
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
  `<!-- graph-index:start -->\n        ${index}\n        <!-- graph-index:end -->`);
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n    </script>`);
const description = esc(root.summary);
const jobTitle = esc(profileDetails.jobTitle);
const name = esc(root.title);
const pageTitle = `${name} | ${jobTitle}`;
const keywords = esc([root.title, profileDetails.jobTitle, ...nodesById.get('skill-frameworks').tags.slice(0, 4).map(tag => tag.split(' (')[0]), 'Portfolio'].join(', '));
const image = esc(new URL('assets/images/og-graph.png', base.endsWith('/') ? base : `${base}/`).href);
for (const [pattern, value] of [
  [/(<h1\s+id="graph-title"[^>]*>)[\s\S]*?(<\/h1>)/, `${name} · ${jobTitle}`],
  [/(<title>)[\s\S]*?(<\/title>)/, pageTitle],
  [/(<meta\s+name="description"\s+content=")[^"]*(")/, description],
  [/(<meta\s+property="og:description"\s+content=")[^"]*(")/, description],
  [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, description],
  [/(<meta\s+name="keywords"\s+content=")[^"]*(")/, keywords],
  [/(<meta\s+name="author"\s+content=")[^"]*(")/, name],
  [/(<meta\s+property="og:title"\s+content=")[^"]*(")/, pageTitle],
  [/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, pageTitle],
  [/(<meta\s+property="og:url"\s+content=")[^"]*(")/, esc(base)],
  [/(<link\s+rel="canonical"\s+href=")[^"]*(")/, esc(base)],
  [/(<meta\s+property="og:image"\s+content=")[^"]*(")/, image],
  [/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, image],
  [/(<div id="graph-stage" role="group" aria-label=")[^"]*(")/, `Interactive graph of ${name}'s work`],
]) {
  const matches = html.match(pattern);
  if (!matches) throw new Error(`Missing profile HTML target: ${pattern}`);
  html = html.replace(pattern, (_, before, after) => `${before}${value}${after}`);
}
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== html) throw new Error('Committed HTML is stale; run node scripts/generate-graph-index.mjs');
} else writeFileSync(path, html);
console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${graphNodes.length} index nodes, ${graphEdges.length} edges and Person JSON-LD`);
