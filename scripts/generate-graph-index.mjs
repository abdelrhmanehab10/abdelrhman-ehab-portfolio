// Run with `node scripts/generate-graph-index.mjs` after changing graph.js.
// The checked-in index is the no-JS, crawler and keyboard-readable graph layer.
import { readFileSync, writeFileSync } from "node:fs";
import { graphNodes, graphEdges } from "../src/constant/graph.js";

const ids = new Set(graphNodes.map(({ id }) => id));
if (ids.size !== graphNodes.length || graphNodes.length !== 52 || graphEdges.length !== 104 ||
    graphEdges.some(({ source, target }) => !ids.has(source) || !ids.has(target))) {
  throw new Error("Graph IDs, endpoints or expected node/edge counts are invalid");
}
const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const children = (id) => graphEdges.filter((edge) => edge.type === "contains" && edge.source === id)
  .map((edge) => graphNodes.find((node) => node.id === edge.target));
const row = (node) => `<li><button type="button" data-node="${esc(node.id)}">${esc(node.title)}</button><span class="graph-index-summary">${esc(node.summary)}</span></li>`;
const root = graphNodes.find((node) => node.id === "me");
const index = `<ul id="graph-index">\n  ${row(root)}\n  ${children("me").map((hub) => `<li><h3><button type="button" data-node="${esc(hub.id)}">${esc(hub.title)}</button></h3><p>${esc(hub.summary)}</p><ul>${children(hub.id).map(row).join("\n")}</ul></li>`).join("\n  ")}\n</ul>`;
const base = "https://abdelrhmanehab10.github.io/abdelrhman-ehab-portfolio/";
const person = {
  "@context": "https://schema.org", "@type": "Person", name: root.title,
  jobTitle: "Frontend Engineer", url: base,
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
writeFileSync(path, html);
console.log(`Generated ${graphNodes.length} index nodes, ${graphEdges.length} edges and Person JSON-LD`);
