// Projections only: profile facts live in the generated graph.js, never here.
import { graphNodes, profileDetails } from './graph.js';
const ofGroup = (group) => graphNodes.filter((node) => node.group === group);
const root = graphNodes.find((node) => node.id === 'me');
const links = Object.fromEntries(ofGroup('link').map((node) => [node.id, node]));

export const profileMeta = {
  name: root.title,
  title: root.summary.split(' with ')[0],
  heroSummary: profileDetails.summary,
  resumeUrl: links['link-resume'].href,
};
export const impactStats = [
  { label: 'Professional Web Development', value: profileDetails.experienceYears.replace(/ years of professional web-development experience/i, ' Years') },
  { label: 'Professional Roles', value: `${ofGroup('role').length} Engagements` },
  { label: 'Projects & Contributions', value: `${ofGroup('project').length} Products` },
  { label: 'Industries', value: profileDetails.industries.join(' · ') },
];
export const coreTechnologies = [...new Set(ofGroup('skill').flatMap((node) => (node.tags || []).slice(0, 4)).map(s => s.replace(/ \(.*/, '').trim()))];
export const works = ofGroup('project').map((node) => ({
  ...node,
  featured: ['proj-virtuwa-hv', 'proj-qr-verify'].includes(node.id),
  imageUrl: { 'proj-virtuwa-hv': 'assets/images/virtuwa-live.png', 'proj-qr-verify': 'assets/images/qr-verify-live.png' }[node.id],
  stack: node.tags || [],
  liveUrl: node.href,
}));
export const experiences = ofGroup('role').map((node) => {
  const [role, company] = node.title.split(' - ');
  const [period, arrangement] = node.meta.split(' · ');
  const [dates, location] = period.split(' | ');
  return { role, company, period: dates, location: `${location || ''} · ${arrangement || ''}`, highlights: [node.summary, ...(node.bullets || [])] };
});
export const skills = [
  ...ofGroup('skill').map((node) => ({ group: node.title, items: [...(node.tags || []), ...(node.bullets || [])] })),
  { group: 'Industries', items: profileDetails.industries },
  { group: 'Languages', items: profileDetails.languages },
  { group: 'Soft Skills', items: profileDetails.softSkills },
  { group: 'Deployment Achievement', items: [graphNodes.find(n => n.id === 'craft-cicd')].flatMap(n => [n.summary, ...n.bullets]) },
];
export const careerNote = profileDetails.careerNote;
export const socialLinks = [
  { label: 'Email Abdelrhman', iconClass: 'fa-solid fa-envelope', href: links['link-email'].href },
  { label: 'Chat on WhatsApp', iconClass: 'fa-brands fa-whatsapp', href: `https://wa.me/${profileDetails.contact.Phone.replace(/[^\d]/g, '')}` },
  { label: 'LinkedIn Profile', iconClass: 'fa-brands fa-linkedin-in', href: links['link-linkedin'].href },
  { label: 'GitHub Profile', iconClass: 'fa-brands fa-github', href: links['link-github'].href },
];
