// node scripts/generate-profile.mjs /absolute/path/to/profile.md [--check]
// The external profile is never copied into the repository; only reviewed public text is emitted.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const [source, option] = process.argv.slice(2);
if (!source || (option && option !== '--check')) {
  console.error('Usage: node scripts/generate-profile.mjs /path/to/profile.md [--check]');
  process.exit(2);
}
const layout = JSON.parse(readFileSync(new URL('./graph-layout.json', import.meta.url), 'utf8'));
const raw = readFileSync(resolve(source), 'utf8').replace(/\r\n/g, '\n');
// Central public-copy policy. Apply BEFORE parsing, so every output (including graph,
// no-JS index, JSON-LD, Open Graph and runtime cards) sees the same safe wording.
const publicText = raw
  .replace(/Implemented passwordless sudo rules for controlled deployment commands \(rm, copy, nginx reload\)/gi, 'Least-privilege sudo rules scoped to the deployment commands only')
  .replace(/Nginx reverse proxy \(443\/6000\/5678\)/gi, 'Nginx reverse proxy')
  .replace(/VM console using WebSockets with SSL termination through Nginx; domain\/TLS management and Cloudflare proxy rules/gi, 'VM console with encrypted WebSocket connectivity and managed TLS')
  .replace(/Reworked the console flow after identifying sensitive VM\/connection data in browser URLs, replacing it with session-based bootstrap and opaque, short-lived identifiers/gi, 'Hardened the console session handling with session-based bootstrap and short-lived, opaque identifiers')
  .replace(/VM deployment over SSH to a self-hosted runner/gi, 'private-runner deployment')
  .replace(/a `current` Nginx symlink/gi, 'managed release switching')
  .replace(/Jisir process actions/gi, 'process actions')
  .replace(/private LAN deployments/gi, 'private deployments')
  .replace(/sudoers, file permissions, SCP, SSH troubleshooting/gi, 'least-privilege deployment permissions and Linux troubleshooting');
// Fail closed on newly added deployment/security specifics, rather than silently shipping them.
if (/\b(?:\d{2,5}\/){2}\d{2,5}\b|\b(?:passwordless sudo|sudoers|\brm, copy\b|sensitive VM\/connection data|browser URLs|Jisir process|`current` Nginx symlink)\b/i.test(publicText)) {
  throw new Error('Unreviewed deployment/security detail in public profile copy');
}
const lines = publicText.split('\n');
const blocks = [];
for (const line of lines) {
  const heading = /^(#{1,4}) (.+)$/.exec(line);
  if (heading) blocks.push({ depth: heading[1].length, title: heading[2], lines: [] });
  else if (blocks.length && line.trim()) blocks.at(-1).lines.push(line.trim());
}
const get = (title) => {
  const matches = blocks.filter((b) => b.title === title);
  if (matches.length !== 1) throw new Error(`Expected one profile section: ${title}, got ${matches.length}`);
  return matches[0];
};
const bullets = (block) => block.lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2));
const roleBlocks = blocks.filter((b) => b.depth === 3 && blocks.indexOf(b) > blocks.indexOf(get('Experience')));
const roleIds = ['role-smartly-fse','role-smartly-fe','role-virtuwa-freelance','role-virtuwa-pt','role-riyada','role-pro-event','role-independent-qr','role-shortcutadv'];
if (roleBlocks.length !== roleIds.length) throw new Error(`Expected ${roleIds.length} roles, got ${roleBlocks.length}; review layout`);
const roleIdentity = {
  'role-smartly-fse': 'Full Stack Engineer | Smartly Techs',
  'role-smartly-fe': 'Frontend Web Developer | Smartly Techs',
  'role-virtuwa-freelance': 'Freelance Frontend Engineer | Virtuwa',
  'role-virtuwa-pt': 'Frontend Web Developer | Virtuwa',
  'role-riyada': 'Frontend Web Developer | Riyada Al Arabiya For Information Technology',
  'role-pro-event': 'Software Engineer | Pro Event',
  'role-independent-qr': 'Independent Product Development | QR Verification Platform',
  'role-shortcutadv': 'WordPress Developer | Shortcutadv',
};
const roleMap = new Map(roleIds.map((id) => {
  const matches = roleBlocks.filter((block) => block.title.startsWith(`${roleIdentity[id]} |`) || block.title === roleIdentity[id]);
  if (matches.length !== 1) throw new Error(`Expected one role for ${id} (${roleIdentity[id]}), got ${matches.length}`);
  return [id, matches[0]];
}));
const projectHeading = (prefix) => {
  const matches = blocks.filter(b => b.title.startsWith(prefix));
  if (matches.length !== 1) throw new Error(`Expected one project heading for ${prefix}, got ${matches.length}`);
  return matches[0];
};
const projectMap = new Map([
  ['proj-clinic-flow', get('Clinic Flow')], ['proj-bleu-blog', projectHeading('BLEU Community Blog (')],
  ['proj-gas-reg', projectHeading('Project: GAS-REG Portal')],
  ['proj-competition-admin', get('Project: Competition Management Admin')],
  ['proj-akhbar-admin', get('Project: Akhbar AlKhaleej Admin FE')],
  ['proj-virtuwa-hv', projectHeading('Project: VirtuWa HV -')],
  ['proj-virtuwa-cloud', projectHeading('Project: VirtuWa Cloud Manager -')],
  ['proj-flow-bridge', get('Project: Virtuwa Flow Bridge (in development)')],
  ['proj-qr-verify', get('Project: QR-code verification platform (Sara Beauty)')],
]);
// Standalone products mentioned within role bullets rather than in their own subheadings.
const onlyBullet = (items, matches, label) => {
  const found = items.filter(matches);
  if (found.length !== 1) throw new Error(`Expected one bullet for ${label}, got ${found.length}`);
  return found[0];
};
const inlineProjects = new Map([
  ['proj-bidding-wallet', ['role-smartly-fse', /bidding-wallet/i, 'Bidding Wallet Flow']],
  ['proj-faster-meeting', ['role-smartly-fe', /Faster Meeting/i, 'Faster Meeting']],
  ['proj-efa', ['role-smartly-fe', /\bEFA\b/i, 'EFA']],
  ['proj-boots-ladders', ['role-smartly-fe', /Boots & Ladders/i, 'Boots & Ladders']],
  ['proj-care-connect', ['role-riyada', /Care Connect Dashboard/i, 'Care Connect Dashboard']],
  ['proj-watu', ['role-riyada', /\bWatu\b/i, 'Watu']],
  ['proj-pro-event-storefront', ['role-pro-event', /storefront UI/i, 'Pro Event Storefront']],
]);
for (const [id, [role, identity, name]] of inlineProjects) {
  const text = onlyBullet(bullets(roleMap.get(role)), b => identity.test(b), id);
  projectMap.set(id, { title: name, lines: [`- ${text}`] });
}
if (projectMap.size !== 16 || [...projectMap.values()].some(b => !b)) throw new Error('Project headings changed; review mapping');
const skillBlocks = {
  'skill-frameworks': 'Programming & Frameworks', 'skill-ecommerce': 'E-commerce & CMS',
  'skill-devops': 'DevOps & Infrastructure', 'skill-data': 'Databases & Analytics',
  'skill-other': 'Other', 'skill-tools': 'Tools',
};
const splitTags = (text) => text.flatMap(s => s.split(/, (?=(?:[^()]*\([^()]*\))*[^()]*$)/));
const contact = Object.fromEntries(bullets(get('Contact')).map(s => { const i = s.indexOf(': '); return [s.slice(0, i), s.slice(i + 2)]; }));
const summary = get('Summary').lines.join(' ');
const headline = summary.match(/^(.+?) with (\d+\+ years of professional web-development experience)\b/i);
if (!headline) throw new Error('Summary must begin with a job title and professional web-development experience figure');
const [, jobTitle, experienceYears] = headline;
const achievement = bullets(get('CI/CD & Deployment Automation'));
const bleu = bullets(get('BLEU Community Blog (Eleventy/Tailwind open-source tech community website)'));
const careerNote = get('Experience').lines.find(s => s.startsWith('> '))?.slice(2);
const industries = bullets(get('Industries'));
const languages = bullets(get('Languages'));
const softSkills = bullets(get('Soft Skills'));
const highlights = bullets(get('Additional Highlights'));
const profileDetails = { contact, summary, jobTitle, experienceYears, careerNote, industries, languages, softSkills, highlights };
const nodes = layout.nodes.map((node) => {
  const n = { ...node };
  let sourceBullets = [];
  if (node.group === 'root') {
    n.title = get('Abdelrhman Ehab').title;
    n.meta = `${jobTitle} · ${languages.join(' · ')}`;
    n.summary = summary;
    n.bullets = [...highlights];
    n.tags = splitTags(bullets(get('Programming & Frameworks'))).slice(0, 5);
  } else if (node.group === 'role') {
    const block = roleMap.get(node.id);
    const [role, employer, arrangement] = block.title.split(' | ');
    if (!employer) throw new Error(`Malformed role: ${block.title}`);
    n.title = `${role} - ${employer}`;
    n.meta = `${block.lines[0]} · ${arrangement || ''}`;
    sourceBullets = bullets(block);
    if (!sourceBullets.length && node.id === 'role-virtuwa-pt') sourceBullets = [`Delivered ${layout.edges.filter(e => e.source === node.id || e.target === node.id).filter(e => e.type === 'delivered-in').map(e => projectMap.get(e.source)?.title.replace(/^Project: /, '')).filter(Boolean).join(', ')}.`];
    if (!sourceBullets.length) throw new Error(`Missing role evidence: ${node.id}`);
  } else if (node.group === 'project') {
    const block = projectMap.get(node.id);
    n.title = block.title.replace(/^Project: /, '').replace(/ \((?:in development|Oct 2025[^)]*)\)$/, '');
    n.meta = block.title.match(/\((?:in development|Oct 2025[^)]*)\)/)?.[0] || '';
    sourceBullets = bullets(block);
    if (node.id === 'proj-bleu-blog') sourceBullets = bleu;
  } else if (node.group === 'skill') {
    n.title = skillBlocks[node.id];
    n.meta = node.id === 'skill-tools' ? 'Tools' : 'Core skills';
    n.tags = splitTags(bullets(get(skillBlocks[node.id])));
    n.summary = n.tags.join(' · ');
    if (node.id === 'skill-data') n.bullets = highlights.filter(s => /Data-Driven/.test(s));
  } else if (node.group === 'craft') {
    const data = {
      'craft-cicd': ['CI/CD & Deployment Automation', achievement],
      'craft-bilingual': ['Bilingual & RTL Engineering', [
        ...languages,
        ...bullets(get('Other')).filter(s => /Bilingual/.test(s)),
        onlyBullet(bleu, b => /Arabic-first internationalization/i.test(b), 'BLEU Arabic-first internationalization'),
        onlyBullet(bleu, b => /Arabic\/English translation files/i.test(b), 'BLEU Arabic/English translations'),
      ]],
      'craft-security': ['Access Control & Security', bullets(projectMap.get('proj-virtuwa-hv')).filter(s => /session|RBAC/.test(s))],
      'craft-performance': ['Performance & Quality', [
        onlyBullet(bullets(roleMap.get('role-smartly-fe')), b => /\bEFA\b.*Lighthouse/i.test(b), 'EFA performance'),
        onlyBullet(bleu, b => /semantic blog datetime.*font loading/i.test(b), 'BLEU performance'),
      ]],
      'craft-ways-of-working': ['Ways of Working', softSkills],
    }[node.id];
    n.title = data[0]; n.meta = 'Practice'; sourceBullets = data[1];
  } else if (node.group === 'domain') {
    const domain = {
      'domain-healthcare': 'Medical', 'domain-editorial': 'Journalism', 'domain-ecommerce': 'E-commerce',
      'domain-virtualization': 'Virtualization', 'domain-regulatory': 'Regulatory', 'domain-public': 'Education',
    }[node.id];
    n.title = domain; n.meta = 'Industry / product domain';
    n.summary = industries.includes(domain) ? `${domain} · listed industry` : `${domain} · represented in product work`;
  } else if (node.group === 'hub') {
    n.title = ({'hub-experience':'Experience','hub-projects':'Projects','hub-skills':'Core Skills','hub-domains':'Domains','hub-craft':'How I Work','hub-connect':'Connect'})[node.id];
    n.meta = node.id === 'hub-experience' ? `${roleBlocks.length} engagements` : node.id === 'hub-projects' ? `${projectMap.size} products` : '';
    n.summary = node.id === 'hub-experience' ? careerNote : node.id === 'hub-projects' ? 'Product and open-source work across the profile.' : `${n.title} from the professional profile.`;
  } else if (node.group === 'link') {
    const links = {'link-email':['Email', contact.Email, `mailto:${contact.Email}`], 'link-linkedin':['LinkedIn', contact.LinkedIn, contact.LinkedIn], 'link-github':['GitHub', contact.GitHub, contact.GitHub], 'link-resume':['Resume (PDF)', 'Download the full resume.', './assets/abdelrhmanehab_resume.pdf']};
    [n.title, n.summary, n.href] = links[node.id]; n.meta = 'Connect'; n.linkLabel = n.title;
  }
  if (sourceBullets.length) {
    n.summary = sourceBullets[0];
    n.bullets = sourceBullets.slice(1);
  }
  if (!n.summary) throw new Error(`No summary for ${n.id}`);
  n.label = n.group === 'role'
    ? `${n.title.split(' - ').at(-1).slice(0, 18)} · ${n.title.split(' - ')[0].replace('Frontend Web Developer', 'Frontend').slice(0, 16)}`
    : n.title.split(' - ')[0].slice(0, 28);
  return n;
});
const digest = createHash('sha256').update(raw).digest('hex');
const model = `// GENERATED by scripts/generate-profile.mjs. Do not edit by hand.\n// Source: profile.md (external); public-copy policy lives in the generator.\nexport const profileSourceHash = ${JSON.stringify(digest)};\nexport const graphNodes = ${JSON.stringify(nodes, null, 2)};\nexport const graphEdges = ${JSON.stringify(layout.edges, null, 2)};\nexport const graphGroups = ${JSON.stringify(layout.groups, null, 2)};\nexport const profileDetails = ${JSON.stringify(profileDetails, null, 2)};\n`;
const target = fileURLToPath(new URL('../src/constant/graph.js', import.meta.url));
if (option === '--check') {
  if (readFileSync(target, 'utf8') !== model) throw new Error('Committed graph differs from profile; regenerate with node scripts/generate-profile.mjs <profile.md>');
  console.log('Committed graph matches profile');
} else {
  writeFileSync(target, model);
  console.log(`Generated ${nodes.length} nodes, ${layout.edges.length} edges from profile`);
}
