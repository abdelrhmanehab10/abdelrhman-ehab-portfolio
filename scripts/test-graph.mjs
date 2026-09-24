import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from "node:test";
import { graphNodes, graphEdges, graphGroups, profileDetails, profileSourceHash } from "../src/constant/graph.js";
import { projectNotices } from "../src/constant/index.js";

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
  assert.ok(html.includes(`<h1 id="graph-title" class="visually-hidden">${person.name} · ${person.jobTitle}</h1>`), 'page heading matches model');
  for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert.ok(html.includes(`${attribute}\n      content="${person.description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`), `${attribute} matches model`);
  }
});

test('HTML generation follows changed profile contact and identity', () => {
  const dir = mkdtempSync(join(import.meta.dirname, '.index-test-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'src/constant'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    copyFileSync(new URL('./generate-graph-index.mjs', import.meta.url), join(dir, 'scripts/generate-graph-index.mjs'));
    copyFileSync(new URL('../index.html', import.meta.url), join(dir, 'index.html'));
    copyFileSync(new URL('../src/hero-graph.js', import.meta.url), join(dir, 'src/hero-graph.js'));
    copyFileSync(new URL('../src/constant/index.js', import.meta.url), join(dir, 'src/constant/index.js'));
    const changedNodes = structuredClone(graphNodes);
    changedNodes.find(n => n.id === 'me').title = 'Updated Profile Name';
    changedNodes.find(n => n.id === 'link-email').href = 'mailto:updated@example.com';
    changedNodes.find(n => n.id === 'link-github').href = 'https://github.com/updated';
    changedNodes.find(n => n.id === 'link-resume').href = './assets/new-resume.pdf';
    const details = structuredClone(profileDetails);
    details.contact.Portfolio = 'https://example.com/portfolio';
    writeFileSync(join(dir, 'src/constant/graph.js'),
      `export const graphNodes = ${JSON.stringify(changedNodes)};\nexport const graphEdges = ${JSON.stringify(graphEdges)};\nexport const graphGroups = ${JSON.stringify(graphGroups)};\nexport const profileDetails = ${JSON.stringify(details)};\n`);
    const command = [join(dir, 'scripts/generate-graph-index.mjs')];
    assert.throws(() => execFileSync(process.execPath, [...command, '--check'], { stdio: 'pipe' }),
      error => /Committed HTML is stale/.test(error.stderr.toString()));
    execFileSync(process.execPath, command);
    const output = readFileSync(join(dir, 'index.html'), 'utf8');
    assert.match(output, /class="graph-index-link" href="mailto:updated@example.com"/);
    assert.doesNotMatch(output, /mailto:abdelrhmanehab047@gmail.com/);
    assert.match(output, /<title>Updated Profile Name \| Frontend Engineer<\/title>/);
    assert.match(output, /<h1 id="graph-title" class="visually-hidden">Updated Profile Name · Frontend Engineer<\/h1>/);
    assert.match(output, /class="graph-index-link" href="\.\/assets\/new-resume\.pdf" download>/);
    assert.match(output, /content="https:\/\/example.com\/portfolio\/assets\/images\/og-graph.png"/);
    assert.doesNotMatch(output, /content="https:\/\/example.com\/assets\/images\/og-graph.png"/);
    const person = JSON.parse(output.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(person.url, details.contact.Portfolio);
    assert.equal(person.sameAs[0], 'https://github.com/updated');
    execFileSync(process.execPath, [...command, '--check']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the page is only the graph view and its index keeps every Connect action', () => {
  const body = html.slice(html.indexOf('<body>'));
  assert.doesNotMatch(body, /<(?:header|nav|footer|section)\b/);
  assert.doesNotMatch(html, /id="(?:home|impact|projects|experience|skills|contact)"|href="#(?:home|impact|projects|experience|skills|contact)"/);
  assert.ok(graphNodes.every(node => !('sectionId' in node)), 'no node links to a removed page section');
  const index = html.match(/<!-- graph-index:start -->([\s\S]*?)<!-- graph-index:end -->/)[1];
  for (const node of graphNodes.filter(n => n.href)) {
    assert.ok(index.includes(`href="${node.href}"`), `${node.id} link is reachable without JavaScript`);
  }
  assert.match(index, /href="\.\/assets\/abdelrhmanehab_resume\.pdf" download>/);
  for (const [id, notice] of Object.entries(projectNotices)) {
    assert.ok(graphNodes.some(n => n.id === id && n.group === 'project'), `${id} is a project`);
    assert.ok(index.includes(notice), `${id} notice is listed`);
  }
});

test('public copy stays safe', () => {
  assert.deepEqual(profileDetails.industries, ['E-commerce', 'Journalism', 'Medical']);
  assert.equal(profileDetails.languages.length, 2);
  const publicSurfaces = [html, JSON.stringify(graphNodes)].join('\n');
  assert.doesNotMatch(publicSurfaces, /443\/6000|passwordless sudo|rm, copy|sensitive VM\/connection data|Jisir process|`current` Nginx symlink|2\+ years delivering production dashboards/i);
});
