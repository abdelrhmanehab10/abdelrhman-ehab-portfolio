import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { graphNodes, profileDetails } from '../src/constant/graph.js';

const node = (id) => graphNodes.find(n => n.id === id);
const lines = (heading, items) => [`## ${heading}`, ...items];
const bulletLines = (items) => items.map(item => `- ${item}`);
const devopsSourceBullets = [
  'AWS Lightsail, Docker, Docker Compose',
  'GitHub Actions CI/CD (self-hosted runners, private LAN deployments)',
  'Automated frontend build & deploy pipelines (pnpm -> dist -> Nginx)',
  'Nginx reverse proxy (443/6000/5678), SSL/TLS, WebSocket proxying',
  'Linux administration, sudoers, file permissions, SCP, SSH troubleshooting',
  'Cloudflare Pages / Workers',
];
const roleIds = ['role-smartly-fse', 'role-smartly-fe', 'role-virtuwa-freelance', 'role-virtuwa-pt', 'role-riyada', 'role-pro-event', 'role-independent-qr', 'role-shortcutadv'];
const projectHeadings = [
  ['proj-gas-reg', 'Project: GAS-REG Portal (in development)'],
  ['proj-competition-admin', 'Project: Competition Management Admin'],
  ['proj-akhbar-admin', 'Project: Akhbar AlKhaleej Admin FE'],
  ['proj-virtuwa-hv', 'Project: VirtuWa HV - Hypervisor Management Interface'],
  ['proj-virtuwa-cloud', 'Project: VirtuWa Cloud Manager - Enterprise Hypervisor Control Plane'],
  ['proj-flow-bridge', 'Project: Virtuwa Flow Bridge (in development)'],
  ['proj-qr-verify', 'Project: QR-code verification platform (Sara Beauty)'],
];
const roleSection = (id, extra = [], empty = false) => {
  const role = node(id);
  const [title, employer] = role.title.split(' - ');
  const [date, arrangement] = role.meta.split(' · ');
  return [`### ${title} | ${employer} | ${arrangement}`, date,
    ...bulletLines(empty ? [] : [role.summary, ...extra, ...(role.bullets || [])])];
};
const profile = (roles, extra = {}) => [
  '# Abdelrhman Ehab',
  ...lines('Contact', bulletLines(Object.entries(profileDetails.contact).map(([key, value]) => `${key}: ${value}`))),
  ...lines('Summary', [extra.summary || profileDetails.summary]),
  ...lines('CI/CD & Deployment Automation', bulletLines([node('craft-cicd').summary, ...node('craft-cicd').bullets])),
  ...lines(node('proj-bleu-blog').title, bulletLines([node('proj-bleu-blog').summary, ...(extra.bleuBullets || []), ...node('proj-bleu-blog').bullets])), 
  ...lines('Clinic Flow', bulletLines([node('proj-clinic-flow').summary])),
  ...graphNodes.filter(n => n.group === 'skill').flatMap(n => [`### ${n.title}`, ...bulletLines(n.id === 'skill-devops' ? devopsSourceBullets : n.tags)]),
  ...lines('Additional Highlights', bulletLines(profileDetails.highlights)),
  ...lines('Soft Skills', bulletLines(profileDetails.softSkills)),
  ...lines('Industries', bulletLines(profileDetails.industries)),
  ...lines('Languages', bulletLines(profileDetails.languages)),
  ...lines('Experience', [`> ${profileDetails.careerNote}`]),
  ...roles.flatMap(id => roleSection(id, id === 'role-smartly-fe' ? (extra.smartlyBullets || []) : [], id === extra.emptyRole)),
  ...projectHeadings.flatMap(([id, heading]) => [`#### ${heading}`, ...bulletLines([node(id).summary, ...(node(id).bullets || [])])]),
].join('\n') + '\n';

const sandbox = (action) => {
  const dir = mkdtempSync(join(import.meta.dirname, '.profile-test-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'src/constant'), { recursive: true });
    copyFileSync(new URL('./generate-profile.mjs', import.meta.url), join(dir, 'scripts/generate-profile.mjs'));
    copyFileSync(new URL('./graph-layout.json', import.meta.url), join(dir, 'scripts/graph-layout.json'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    const generate = (text) => {
      writeFileSync(join(dir, 'profile.md'), text);
      execFileSync(process.execPath, [join(dir, 'scripts/generate-profile.mjs'), join(dir, 'profile.md')]);
      const url = pathToFileURL(join(dir, 'src/constant/graph.js')).href;
      return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
        `import { graphNodes, profileDetails } from ${JSON.stringify(url)}; console.log(JSON.stringify({ graphNodes, profileDetails }));`], { encoding: 'utf8' }));
    };
    return action({ dir, generate });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('role identities and bilingual and performance evidence survive reordered and inserted bullets', () => sandbox(({ generate }) => {
  const reordered = [...roleIds];
  [reordered[2], reordered[3]] = [reordered[3], reordered[2]];
  const { graphNodes: roles, profileDetails: details } = generate(profile(reordered, {
    smartlyBullets: ['Enhanced UI/UX on another Smartly product.'],
    bleuBullets: ['Assisted contributors with open-source onboarding.'],
    emptyRole: 'role-virtuwa-pt',
  }));
  assert.equal(details.jobTitle, 'Frontend Engineer');
  assert.match(roles.find(n => n.id === 'role-virtuwa-pt').title, /Frontend Web Developer - Virtuwa/);
  assert.match(roles.find(n => n.id === 'role-virtuwa-freelance').title, /Freelance Frontend Engineer - Virtuwa/);
  assert.match(roles.find(n => n.id === 'proj-boots-ladders').summary, /Boots & Ladders/);
  assert.match(roles.find(n => n.id === 'craft-performance').summary, /EFA.*Lighthouse/);
  assert.match(roles.find(n => n.id === 'craft-performance').bullets[0], /semantic blog datetime/);
  assert.match(roles.find(n => n.id === 'role-virtuwa-pt').summary, /VirtuWa HV/);
  assert.equal(roles.find(n => n.id === 'proj-clinic-flow').meta, '', 'a project without profile status has no meta line');
  assert.equal(roles.find(n => n.id === 'proj-gas-reg').meta, '(in development)');
  const bilingual = roles.find(n => n.id === 'craft-bilingual');
  assert.match(bilingual.bullets.join(' '), /Arabic\/English translation files/);
  assert.doesNotMatch(bilingual.bullets.join(' '), /Assisted contributors with open-source onboarding/);
}));

test('missing roles, ambiguous evidence and unrecognized headline fail generation', () => sandbox(({ dir }) => {
  const run = (text) => {
    writeFileSync(join(dir, 'profile.md'), text);
    try {
      execFileSync(process.execPath, [join(dir, 'scripts/generate-profile.mjs'), join(dir, 'profile.md')], { stdio: 'pipe' });
      assert.fail('generation should reject ambiguous or missing evidence');
    } catch (error) {
      if (error.code === 'ERR_ASSERTION') throw error;
      return error.stderr.toString();
    }
  };
  assert.match(run(profile(roleIds).replace('Freelance Frontend Engineer | Virtuwa', 'Frontend Engineer | Virtuwa')), /Expected one role for role-virtuwa-freelance/);
  assert.match(run(profile(roleIds, { smartlyBullets: ['Enhanced UI/UX for Boots & Ladders again.'] })), /Expected one bullet for proj-boots-ladders, got 2/);
  assert.match(run(profile(roleIds, { bleuBullets: ['Improved semantic blog datetime and font loading again.'] })), /Expected one bullet for BLEU performance, got 2/);
  assert.match(run(profile(roleIds, { bleuBullets: ['Added and refined Arabic\/English translation files for contributors.'] })), /Expected one bullet for BLEU Arabic\/English translations, got 2/);
  assert.match(run(profile(roleIds, { emptyRole: 'role-shortcutadv' })), /Missing role evidence: role-shortcutadv/);
  assert.match(run(profile(roleIds, { summary: profileDetails.summary.replace('web-development experience', 'web development') })), /Summary must begin with a job title and professional web-development experience figure/);
  assert.match(run(profile(roleIds, { summary: profileDetails.summary.replace('Frontend Engineer with', 'Frontend Engineer building') })), /Summary must begin with a job title and professional web-development experience figure/);
  assert.match(run(profile(roleIds, { summary: profileDetails.summary.replace('Frontend Engineer with', 'I am a Frontend Engineer with') })), /Unsupported job title: I am a Frontend Engineer/);
  assert.match(run(profile(roleIds).replace('Jan 2022 - Jan 2024 | Saudi Arabia (Remote)', '')), /Invalid role date and location for role-shortcutadv/);
  assert.match(run(profile(roleIds).replace('Nginx reverse proxy (443/6000/5678)', 'Nginx proxy (443, 6000, 5678)')), /DevOps & Infrastructure source bullet changed; re-approve its public wording/);
  assert.match(run(profile(roleIds).replace('Nginx reverse proxy (443/6000/5678)', 'Nginx reverse proxy: 443, 6000, 5678')), /DevOps & Infrastructure source bullet changed; re-approve its public wording/);
  assert.match(run(profile(roleIds).replace('## Contact', '## Contact\n- Home address: private street')), /Unreviewed or duplicate contact field: Home address/);
}));

test('approved DevOps copy is published and a year elsewhere is accepted', () => sandbox(({ dir, generate }) => {
  const source = profile(roleIds)
    .replace('- Cloudflare Pages / Workers', '- Terraform\n- Cloudflare Pages / Workers')
    .replace('## Additional Highlights', '## Additional Highlights\n- Nginx reverse proxy improved in 2025.');
  const { graphNodes: generated } = generate(source);
  const devops = generated.find(n => n.id === 'skill-devops');
  assert.doesNotMatch(JSON.stringify(devops), /443|6000|5678|sudoers|private LAN/);
  assert.ok(devops.tags.includes('Nginx reverse proxy'));
  assert.ok(devops.tags.includes('Terraform'));
  assert.ok(devops.tags.includes('least-privilege deployment permissions and Linux troubleshooting'));
  assert.ok(generated.find(n => n.id === 'me').bullets.includes('Nginx reverse proxy improved in 2025.'));
  execFileSync(process.execPath, [join(dir, 'scripts/generate-profile.mjs'), join(dir, 'profile.md'), '--check']);
}));

test('project and role technology tags follow profile evidence', () => sandbox(({ generate }) => {
  const generated = generate(profile(roleIds)).graphNodes;
  assert.ok(generated.find(n => n.id === 'proj-virtuwa-hv').tags.includes('React'));
  assert.ok(generated.find(n => n.id === 'proj-virtuwa-hv').tags.includes('TypeScript'));
  assert.ok(!generated.find(n => n.id === 'proj-virtuwa-hv').tags.includes('Bootstrap'));
  assert.ok(generated.find(n => n.id === 'proj-qr-verify').tags.includes('MongoDB'));
  assert.ok(generated.find(n => n.id === 'role-riyada').tags.includes('Vue'));
  const updated = generate(profile(roleIds).replace('MongoDB QR-verification service', 'PostgreSQL QR-verification service')).graphNodes;
  assert.ok(!updated.find(n => n.id === 'proj-qr-verify').tags.includes('MongoDB'));
}));

test('project cards show derived technologies and featured source notice', async () => {
  const timeline = { innerHTML: '' };
  const featured = { innerHTML: '' };
  const more = { innerHTML: '', classList: { toggle() {} } };
  let ready;
  globalThis.document = {
    querySelector: selector => ({ '#experience-list': timeline, '#featured-works': featured, '#more-works': more })[selector] || null,
    querySelectorAll: () => [],
    addEventListener: (name, listener) => { if (name === 'DOMContentLoaded') ready = listener; },
  };
  globalThis.window = { addEventListener() {}, scrollY: 0 };
  await import('../src/main.js');
  ready();
  assert.match(featured.innerHTML, /Source code is not publicly linked; contact me for a walkthrough/);
  assert.match(featured.innerHTML, /React<\/span>/);
  assert.match(featured.innerHTML, /MongoDB<\/span>/);
  assert.doesNotMatch(more.innerHTML, /Source code is not publicly linked/);
  const titles = [...timeline.innerHTML.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(match => match[1]);
  assert.equal(titles.length, 8);
  assert.match(titles[0], /WordPress Developer/);
  assert.ok(titles.indexOf('Frontend Web Developer') < titles.indexOf('Full Stack Engineer'));
  assert.equal(titles.at(-1), 'Independent Product Development');
  const periods = [...timeline.innerHTML.matchAll(/<p class="inline-flex shrink-0[^>]*>\s*([^<]+)<\/p>/g)].map(match => match[1].trim());
  assert.deepEqual(periods, ['Jan 2022 - Jan 2024', 'Feb 2024 - Nov 2025', 'Jun 2025 - Present', 'Jul 2025 - Mar 2026', 'Oct 2025 - May 2026', '2026 - Present', 'Jan 2026 - Mar 2026', '2026 - Present']);
});
