import { initHeroGraph } from "./hero-graph.js";
import {
  experiences,
  impactStats,
  profileMeta,
  skills,
  socialLinks,
  works,
} from "./constant/index.js";

const ACTIVE_LINK_CLASSES = ["bg-sky-500/20", "text-white"];
const INACTIVE_LINK_CLASSES = ["text-slate-300"];
const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseExperienceStart(period) {
  if (!period) {
    return Number.POSITIVE_INFINITY;
  }

  const [startToken] = period.split("-").map((part) => part.trim());
  const [monthRaw, yearRaw] = startToken.split(/\s+/);
  const month = MONTH_INDEX[(monthRaw || "").slice(0, 3).toLowerCase()];
  const year = Number.parseInt(yearRaw, 10);

  if (!Number.isFinite(year) || month === undefined) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(year, month, 1).getTime();
}

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

    if (this.heroHeadline) {
      this.heroHeadline.textContent = profileMeta.heroHeadline;
    }

    if (this.heroSummary) {
      this.heroSummary.textContent = profileMeta.heroSummary;
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
            <p class="min-h-10 text-xl leading-tight font-bold text-white md:text-2xl">${value}</p>
            <p class="mt-1 min-h-10 text-sm leading-snug text-slate-300">${label}</p>
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
      imageUrl,
      summary,
      stack,
      visibility,
      visibilityNote,
      liveUrl,
      linkLabel,
    } = project;
    const visibilityLabel =
      visibility === "private" ? "Private product" : "Public project";

    return `
      <article class="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <img src="${imageUrl}" alt="${title} project preview" loading="lazy" class="h-56 w-full rounded-xl border border-slate-700 object-cover" />
        <div class="mt-4 flex flex-wrap items-start justify-between gap-2">
          <h3 class="text-xl font-semibold leading-snug text-white md:text-2xl">${title}</h3>
          <span class="inline-flex shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">${visibilityLabel}</span>
        </div>
        <p class="mt-2 min-h-12 overflow-hidden text-sm leading-relaxed text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] md:text-base">${summary}</p>
        ${
          visibilityNote
            ? `<p class="mt-2 text-xs leading-relaxed text-slate-400">${visibilityNote}</p>`
            : ""
        }
        <div class="mt-4 flex flex-wrap gap-2">
          ${stack
            .map(
              (item) =>
                `<span class="rounded-full border border-sky-900 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">${item}</span>`
            )
            .join("")}
        </div>
        ${
          liveUrl
            ? `<a class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300" href="${liveUrl}" target="_blank" rel="noopener noreferrer">${linkLabel || "Open project"}</a>`
            : ""
        }
      </article>`;
  }

  renderExperience() {
    if (!this.experienceContainer) {
      return;
    }

    const timelineData = [...experiences].sort(
      (a, b) => parseExperienceStart(a.period) - parseExperienceStart(b.period)
    );

    this.experienceContainer.innerHTML = timelineData
      .map(
        ({ company, role, period, location, highlights }) => `
          <article class="relative rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
            <span
              aria-hidden="true"
              class="absolute -left-[33px] top-6 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950"
            ></span>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-white md:text-xl">${role}</h3>
                <p class="mt-1 text-sm font-semibold text-slate-100 md:text-base">${company}</p>
              </div>
              <p class="inline-flex shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 md:ml-auto">
                ${period}
              </p>
            </div>
            <p class="mt-2 text-sm text-slate-300">${location}</p>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300 md:text-base">
              ${highlights.map((item) => `<li>${item}</li>`).join("")}
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
            <h3 class="text-lg font-semibold text-white">${group}</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              ${items
                .map(
                  (item) =>
                    `<span class="rounded-full border border-sky-900 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">${item}</span>`
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
            href="${href}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${label}"
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
