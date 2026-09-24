// Run after regenerating graph.js; --check compares committed HTML without writing.
// The checked-in index is the no-JS, crawler and keyboard-readable graph layer.
import { readFileSync, writeFileSync } from "node:fs";
import { graphNodes, graphEdges, profileDetails } from "../src/constant/graph.js";

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
  `<!-- graph-index:start -->\n          ${index}\n          <!-- graph-index:end -->`);
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n    </script>`);
const description = esc(root.summary);
const jobTitle = esc(profileDetails.jobTitle);
const name = esc(root.title);
const pageTitle = `${name} | ${jobTitle}`;
const keywords = esc([root.title, profileDetails.jobTitle, ...nodesById.get('skill-frameworks').tags.slice(0, 4).map(tag => tag.split(' (')[0]), 'Portfolio'].join(', '));
const image = esc(new URL('assets/images/pro.png', base.endsWith('/') ? base : `${base}/`).href);
for (const [pattern, value] of [
  [/(<p\s+id="hero-badge"[^>]*>)[\s\S]*?(<\/p>)/, `${name} - ${jobTitle}`],
  [/(<h1\s+id="hero-headline"[^>]*>)[\s\S]*?(<\/h1>)/, `${name} · <span class="text-cyan-300">${jobTitle}</span>`],
  [/(<p\s+id="hero-summary"[^>]*>)[\s\S]*?(<\/p>)/, description],
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
  [/(<a\s+href=")[^"]*("\s+class="resume-link)/g, esc(links['link-resume'].href)],
  [/(<a\s+href=")[^"]*("\s+class="[^"]*"\s*>\s*Send Email)/, esc(links['link-email'].href)],
  [/(<div id="graph-stage" role="group" aria-label=")[^"]*(")/, `Interactive graph of ${name}'s work`],
  [/(&copy; <span id="year"><\/span> )[^.]*?(\. Built with)/, name],
]) {
  const matches = html.match(pattern);
  if (!matches || (pattern.global && matches.length !== 3)) throw new Error(`Missing or ambiguous profile HTML target: ${pattern}`);
  html = html.replace(pattern, (_, before, after) => `${before}${value}${after}`);
}
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== html) throw new Error('Committed HTML is stale; run node scripts/generate-graph-index.mjs');
} else writeFileSync(path, html);
console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${graphNodes.length} index nodes, ${graphEdges.length} edges and Person JSON-LD`);
