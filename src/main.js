import { initHeroGraph } from "./hero-graph.js";
import {
  coreTechnologies,
  careerNote,
  experiences,
  impactStats,
  profileMeta,
  skills,
  socialLinks,
  works,
} from "./constant/index.js";

const ACTIVE_LINK_CLASSES = ["bg-sky-500/20", "text-white"];
const INACTIVE_LINK_CLASSES = ["text-slate-300"];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

class App {
  constructor() {
    this.menuLinks = document.querySelectorAll(".menu .nav-link");
    this.impactContainer = document.querySelector("#impact .impact-grid");
    this.featuredWorksContainer = document.querySelector("#featured-works");
    this.moreProjectsHeading = document.querySelector("#more-projects-heading");
    this.moreWorksContainer = document.querySelector("#more-works");
    this.experienceContainer = document.querySelector("#experience-list");
    this.skillsContainer = document.querySelector("#skills-groups");
    this.socialContainer = document.querySelector("#social-links");
    this.footerYear = document.querySelector("#year");
    this.resumeLinks = document.querySelectorAll(".resume-link");
    this.heroBadge = document.querySelector("#hero-badge");
    this.heroHeadline = document.querySelector("#hero-headline");
    this.heroSummary = document.querySelector("#hero-summary");
    this.heroMeta = document.querySelector("#hero-meta");

    this.init();
  }

  init() {
    window.addEventListener("scroll", this.updateActiveClass.bind(this));

    this.setProfileMeta();
    this.updateActiveClass();
    this.renderImpact();
    this.renderWorks();
    this.renderExperience();
    this.renderSkills();
    this.renderSocialLinks();
    this.setYear();
    initHeroGraph();
  }

  updateActiveClass() {
    let currentActive = null;

    this.menuLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      if (!section) {
        return;
      }

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop - sectionHeight / 2 &&
        window.scrollY < sectionTop + sectionHeight / 2
      ) {
        currentActive = link;
      }
    });

    this.menuLinks.forEach((link) => {
      link.classList.remove("active", ...ACTIVE_LINK_CLASSES);
      link.classList.add(...INACTIVE_LINK_CLASSES);
      link.removeAttribute("aria-current");
    });

    if (currentActive) {
      currentActive.classList.add("active", ...ACTIVE_LINK_CLASSES);
      currentActive.classList.remove(...INACTIVE_LINK_CLASSES);
      currentActive.setAttribute("aria-current", "page");
    }
  }

  setProfileMeta() {
    if (this.heroBadge) {
      this.heroBadge.textContent = `${profileMeta.name} - ${profileMeta.title}`;
    }

    if (this.heroSummary) {
      this.heroSummary.textContent = profileMeta.heroSummary;
    }

    if (this.heroMeta) {
      const sliderItems = coreTechnologies
        .map(
          (item) =>
            `<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-slate-200">
              <span class="h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
              ${escapeHtml(item)}
            </span>`
        )
        .join("");

      this.heroMeta.innerHTML = `
        <div class="tech-slider-track flex w-max items-center gap-2 px-3">
          <div class="flex items-center gap-2">
            ${sliderItems}
          </div>
          <div class="flex items-center gap-2" aria-hidden="true">
            ${sliderItems}
          </div>
        </div>
      `;
    }

    const isExternalResume = /^https?:\/\//i.test(profileMeta.resumeUrl);
    this.resumeLinks.forEach((link) => {
      link.href = profileMeta.resumeUrl;
      if (isExternalResume) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.removeAttribute("download");
        return;
      }

      link.setAttribute("download", "abdelrhmanehab_resume.pdf");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    });
  }

  setYear() {
    if (this.footerYear) {
      this.footerYear.textContent = new Date().getFullYear();
    }
  }

  renderImpact() {
    if (!this.impactContainer) {
      return;
    }

    this.impactContainer.innerHTML = impactStats
      .map(
        ({ value, label }) => `
          <article class="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <p class="min-h-10 text-xl leading-tight font-bold text-white md:text-2xl">${escapeHtml(value)}</p>
            <p class="mt-1 min-h-10 text-sm leading-snug text-slate-300">${escapeHtml(label)}</p>
          </article>
        `
      )
      .join("");
  }

  renderWorks() {
    if (!this.featuredWorksContainer || !this.moreWorksContainer) {
      return;
    }

    const featuredWorks = works.filter((work) => work.featured);
    const otherWorks = works.filter((work) => !work.featured);

    this.featuredWorksContainer.innerHTML = featuredWorks
      .map((work) => this.renderWork(work))
      .join("");

    this.moreWorksContainer.innerHTML = otherWorks
      .map((work) => this.renderWork(work))
      .join("");

    if (this.moreProjectsHeading && this.moreWorksContainer) {
      const hasMore = otherWorks.length > 0;
      this.moreProjectsHeading.classList.toggle("hidden", !hasMore);
      this.moreWorksContainer.classList.toggle("hidden", !hasMore);
    }
  }

  renderWork(project) {
    const {
      title,
      meta,
      imageUrl,
      summary,
      stack,
      bullets = [],
      liveUrl,
      linkLabel,
    } = project;
    return `
      <article class="flex h-full min-w-0 flex-col rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)} project preview" loading="lazy" class="h-56 w-full rounded-xl border border-slate-700 object-cover" />` : ''}
        <h3 class="mt-4 break-words text-xl font-semibold leading-snug text-white md:text-2xl">${escapeHtml(title)}</h3>
        ${meta ? `<p class="mt-2 text-xs font-semibold text-cyan-200">${escapeHtml(meta)}</p>` : ''}
        <p class="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">${escapeHtml(summary)}</p>
        ${bullets.length ? `<details class="mt-3 text-sm text-slate-300"><summary class="min-h-11 cursor-pointer py-2 font-semibold text-cyan-200">Read contributions</summary><ul class="list-disc space-y-2 pl-5">${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>` : ''}
        <div class="mt-4 flex flex-wrap gap-2">
          ${stack.map(item => `<span class="max-w-full break-words rounded-full border border-sky-900 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">${escapeHtml(item)}</span>`).join('')}
        </div>
        ${liveUrl ? `<a class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300" href="${escapeHtml(liveUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel || 'Open project')}</a>` : ''}
      </article>`;
  }

  renderExperience() {
    if (!this.experienceContainer) {
      return;
    }

    this.experienceContainer.innerHTML = `<p class="mb-4 text-sm leading-relaxed text-slate-300">${escapeHtml(careerNote)}</p>` + experiences
      .map(
        ({ company, role, period, location, highlights }) => `
          <article class="relative rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
            <span
              aria-hidden="true"
              class="absolute -left-[33px] top-6 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950"
            ></span>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="break-words text-lg font-semibold text-white md:text-xl">${escapeHtml(role)}</h3>
                <p class="mt-1 text-sm font-semibold text-slate-100 md:text-base">${escapeHtml(company)}</p>
              </div>
              <p class="inline-flex shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 md:ml-auto">
                ${escapeHtml(period)}
              </p>
            </div>
            <p class="mt-2 text-sm text-slate-300">${escapeHtml(location)}</p>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300 md:text-base">
              ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
        `
      )
      .join("");
  }

  renderSkills() {
    if (!this.skillsContainer) {
      return;
    }

    this.skillsContainer.innerHTML = skills
      .map(
        ({ group, items }) => `
          <article class="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <h3 class="text-lg font-semibold text-white">${escapeHtml(group)}</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              ${items
                .map(
                  (item) =>
                    `<span class="rounded-full border border-sky-900 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">${escapeHtml(item)}</span>`
                )
                .join("")}
            </div>
          </article>
        `
      )
      .join("");
  }

  renderSocialLinks() {
    if (!this.socialContainer) {
      return;
    }

    this.socialContainer.innerHTML = socialLinks
      .map(
        ({ label, iconClass, href }) => `
          <a
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(label)}"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg text-white transition hover:border-slate-500"
          >
            <i class="${iconClass}" aria-hidden="true"></i>
          </a>
        `
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  new App();
});
