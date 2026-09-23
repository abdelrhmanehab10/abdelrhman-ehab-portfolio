import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { graphNodes, graphEdges, graphGroups } from "../src/constant/graph.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const ids = graphNodes.map(({ id }) => id);

test("52 nodes and 104 edges with unique, connected endpoints", () => {
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
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const person = JSON.parse(json);
  assert.equal(person.knowsAbout.length, graphNodes.filter((node) => ["skill", "craft", "domain"].includes(node.group)).length);
  assert.equal(person.hasOccupation.length, graphNodes.filter((node) => node.group === "role").length);
  assert.equal(person.subjectOf.length, graphNodes.filter((node) => node.group === "project").length);
});
