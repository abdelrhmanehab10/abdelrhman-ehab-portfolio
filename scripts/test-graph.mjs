import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { graphNodes, graphEdges, graphGroups, profileDetails, profileSourceHash } from "../src/constant/graph.js";
import { works, experiences, skills, impactStats } from "../src/constant/index.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const ids = graphNodes.map(({ id }) => id);

test("52 nodes and 104 edges with unique, connected endpoints", () => {
  assert.match(profileSourceHash, /^[0-9a-f]{64}$/);
  assert.equal(ids.length, 52);
  assert.equal(graphEdges.length, 104);
  assert.equal(new Set(ids).size, ids.length);
  const degrees = new Map(ids.map((id) => [id, 0]));
  for (const { source, target, type } of graphEdges) {
    assert.ok(degrees.has(source) && degrees.has(target));
    assert.ok(type);
    degrees.set(source, degrees.get(source) + 1);
    degrees.set(target, degrees.get(target) + 1);
  }
  assert.ok([...degrees.values()].every(Boolean));
  assert.ok(graphNodes.every(({ group }) => graphGroups[group]));
});

test("the no-JS index and Person metadata stay in sync with graph.js", () => {
  const index = html.match(/<!-- graph-index:start -->([\s\S]*?)<!-- graph-index:end -->/)?.[1];
  assert.ok(index, "checked-in index exists");
  const listed = [...index.matchAll(/data-node="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(new Set(listed), new Set(ids));
  assert.equal(listed.length, ids.length);
  const rows = [...index.matchAll(/<li id="graph-node-([^"]+)" tabindex="-1">[\s\S]*?<p class="graph-index-connections">Connected to: ([\s\S]*?)<\/p>/g)];
  assert.equal(rows.length, ids.length, "each index node exposes its connections");
  assert.deepEqual(new Set(rows.map(([, id]) => id)), new Set(ids));
  const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ({
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  })[entity]);
  const byId = new Map(graphNodes.map((node) => [node.id, node]));
  for (const [, id, content] of rows) {
    const listedConnections = [...content.matchAll(/<a href="#graph-node-([^"]+)">([^<]+)<\/a>/g)]
      .map(([, target, title]) => ({ id: target, title: decode(title) }));
    const expected = graphEdges.filter(({ source, target }) => source === id || target === id)
      .map(({ source, target }) => {
        const neighbour = byId.get(source === id ? target : source);
        return { id: neighbour.id, title: neighbour.title };
      });
    assert.deepEqual(listedConnections, expected, `connections for ${id}`);
  }
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const person = JSON.parse(json);
  assert.equal(person.knowsAbout.length, graphNodes.filter((node) => ["skill", "craft", "domain"].includes(node.group)).length);
  assert.equal(person.hasOccupation.length, graphNodes.filter((node) => node.group === "role").length);
  assert.equal(person.subjectOf.length, graphNodes.filter((node) => node.group === "project").length);
  assert.equal(person.description, graphNodes.find(n => n.id === 'me').summary);
  assert.ok(html.includes(`<p id="hero-summary" class="max-w-3xl text-base text-slate-300 md:text-lg">${person.description}</p>`), 'first paint hero matches model');
  for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert.ok(html.includes(`${attribute}\n      content="${person.description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`), `${attribute} matches model`);
  }
});

test('every page section projects the committed graph and public copy stays safe', () => {
  assert.equal(experiences.length, 8);
  assert.equal(works.length, 16);
  assert.deepEqual(works.map(w => w.id), graphNodes.filter(n => n.group === 'project').map(n => n.id));
  assert.deepEqual(skills.slice(0, 6).map(s => s.group), graphNodes.filter(n => n.group === 'skill').map(n => n.title));
  assert.match(impactStats[0].value, /4\+ Years/);
  assert.deepEqual(profileDetails.industries, ['E-commerce', 'Journalism', 'Medical']);
  assert.equal(profileDetails.languages.length, 2);
  const publicSurfaces = [html, JSON.stringify(graphNodes), JSON.stringify(skills), JSON.stringify(experiences), JSON.stringify(works)].join('\n');
  assert.doesNotMatch(publicSurfaces, /443\/6000|passwordless sudo|rm, copy|sensitive VM\/connection data|Jisir process|`current` Nginx symlink|2\+ years delivering production dashboards/i);
});
