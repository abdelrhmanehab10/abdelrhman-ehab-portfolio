/**
 * Graph model derived from profile.md (read-only source: /mnt/d/CVs/profile.md).
 * Intended destination: src/constant/graph.js, imported by src/main.js the same
 * way `works`, `experiences` and `skills` already are.
 *
 * Node shape
 *   id        stable kebab-case key, also the deep-link hash (#node/<id>)
 *   group     "root" | "hub" | "role" | "project" | "skill" | "domain" | "craft" | "link"
 *   label     short text drawn on the graph (keep <= ~22 chars so it fits a node chip)
 *   title     heading shown in the detail panel
 *   meta      one-line context under the panel heading (period, employer, status)
 *   summary   one sentence, also used as the hover tooltip and as the text in the
 *             no-JS / no-canvas fallback list
 *   bullets   2-4 lines lifted from profile.md; the resume PDF keeps the long form
 *   tags      technology chips (NOT drawn as nodes - see edge policy below)
 *   href      optional outbound link rendered as the panel's primary action
 *   sectionId optional existing page section to scroll to ("projects", "experience", ...)
 */

export const graphNodes = [
  /* ---------------------------------------------------------------- root */
  {
    id: "me",
    group: "root",
    label: "Abdelrhman Ehab",
    title: "Abdelrhman Ehab",
    meta: "Frontend Engineer - Cairo, Egypt (GMT+2) - Arabic native, English professional",
    summary:
      "Frontend Engineer with 4+ years of professional web development, including 2+ years of production React, Angular and Vue with TypeScript.",
    bullets: [
      "Specializes in Arabic-first and bilingual RTL interfaces, complex forms, role-based access control, dashboards and workflow-heavy products.",
      "Works across healthcare, virtualization, regulatory, editorial and e-commerce domains.",
      "Builds Node.js/Express services and ships through GitHub Actions, Docker, Nginx, Linux and Cloudflare.",
    ],
    tags: ["React", "Angular", "Vue", "TypeScript", "Node.js"],
  },

  /* ---------------------------------------------------------------- hubs */
  {
    id: "hub-experience",
    group: "hub",
    label: "Experience",
    title: "Experience",
    meta: "8 engagements, 2022 - present",
    summary:
      "Eight engagements across four employers, with three part-time roles run concurrently with a full-time position.",
    bullets: [
      "Riyada, Virtuwa and Pro Event were part-time engagements held concurrently with the full-time Smartly Techs role.",
      "Dates reflect actual engagement periods, not headline tenure.",
    ],
    sectionId: "experience",
  },
  {
    id: "hub-projects",
    group: "hub",
    label: "Projects",
    title: "Projects",
    meta: "16 shipped or in-development products",
    summary:
      "Sixteen products spanning regulatory portals, hypervisor control planes, clinic operations, editorial CMS admin and e-commerce storefronts.",
    sectionId: "projects",
  },
  {
    id: "hub-skills",
    group: "hub",
    label: "Skills",
    title: "Core Skills",
    meta: "Six clusters",
    summary:
      "Programming and frameworks, e-commerce and CMS, DevOps and infrastructure, databases, cross-cutting skills, and day-to-day tools.",
    sectionId: "skills",
  },
  {
    id: "hub-domains",
    group: "hub",
    label: "Domains",
    title: "Domains",
    meta: "Six industries",
    summary:
      "The problem spaces the work lands in - the same engineering patterns recur across very different industries.",
  },
  {
    id: "hub-craft",
    group: "hub",
    label: "How I Work",
    title: "How I Work",
    meta: "Five cross-cutting practices",
    summary:
      "The themes that repeat across every engagement: deployment automation, bilingual RTL, access control, performance, and how I work with a team.",
  },
  {
    id: "hub-connect",
    group: "hub",
    label: "Connect",
    title: "Connect",
    meta: "Open to remote frontend roles",
    summary: "Ways to reach me and read the long form.",
    sectionId: "contact",
  },

  /* --------------------------------------------------------------- roles */
  {
    id: "role-smartly-fse",
    group: "role",
    label: "Smartly Techs - FSE",
    title: "Full Stack Engineer - Smartly Techs",
    meta: "Jun 2025 - Present - Hybrid - Full-time",
    summary:
      "Promoted to Full Stack Engineer after joining Smartly as a Frontend Web Developer in Feb 2024.",
    bullets: [
      "Delivered features across regulatory, competition, editorial and collaboration products.",
      "Built a secure bidding-wallet flow with Node.js and Next.js, enforcing a minimum 10% balance before bidding and holding funds during active bids.",
    ],
    tags: ["Angular", "React", "Next.js", "Node.js", "TypeScript"],
    sectionId: "experience",
  },
  {
    id: "role-smartly-fe",
    group: "role",
    label: "Smartly Techs - FE",
    title: "Frontend Web Developer - Smartly Techs",
    meta: "Feb 2024 - Nov 2025 - On-site - Full-time",
    summary:
      "First role at Smartly Techs, delivering meeting, association and game products before the promotion to Full Stack Engineer.",
    bullets: [
      "Developed the Faster Meeting platform in Next.js with authenticated scheduling, editing and management of Zoom meetings through custom .NET APIs.",
      "Improved EFA UI/UX and web performance, raising Lighthouse from 61 to 84 by optimizing LCP, FCP and layout shifts.",
      "Enhanced UI/UX and performance in Boots & Ladders using Vue.js.",
    ],
    tags: ["Next.js", "Vue.js", "JavaScript"],
    sectionId: "experience",
  },
  {
    id: "role-virtuwa-freelance",
    group: "role",
    label: "Virtuwa - Freelance",
    title: "Freelance Frontend Engineer - Virtuwa",
    meta: "2026 - Present - Remote - Contract follow-up",
    summary:
      "Continued follow-up frontend development after the part-time engagement ended, maintaining and extending the virtualization products.",
    bullets: [
      "Delivers product improvements across VM consoles, backup/recovery, host management, deployment workflows, bilingual UX and operational interfaces.",
      "Hardening and productizing the frontend so the platform can be adapted and marketed for future clients.",
    ],
    tags: ["React", "TypeScript"],
    sectionId: "experience",
  },
  {
    id: "role-virtuwa-pt",
    group: "role",
    label: "Virtuwa - Part-time",
    title: "Frontend Web Developer - Virtuwa",
    meta: "Oct 2025 - May 2026 - Saudi Arabia (Remote) - Part-time",
    summary:
      "Part-time engagement building Virtuwa's three virtualization products, held concurrently with the full-time Smartly Techs role.",
    bullets: [
      "Delivered VirtuWa HV, VirtuWa Cloud Manager and Virtuwa Flow Bridge.",
      "Mentored a new frontend developer through implementation and delivery.",
    ],
    tags: ["React", "TypeScript", "WebSocket", "GitHub Actions"],
    sectionId: "experience",
  },
  {
    id: "role-riyada",
    group: "role",
    label: "Riyada Al Arabiya",
    title: "Frontend Web Developer - Riyada Al Arabiya For Information Technology",
    meta: "Jan 2026 - Mar 2026 - Saudi Arabia (Remote) - Part-time",
    summary:
      "Short part-time engagement on a healthcare dashboard migration and a university platform, concurrent with the full-time Smartly Techs role.",
    bullets: [
      "Contributed to the Laravel-to-Vue 3 migration of Care Connect Dashboard.",
      "Worked on Watu, a university platform, refactoring the Apply Now flow into a unified multi-step form.",
      "Performed end-to-end QA and prepared prioritized reports and team action plans for delivery.",
    ],
    tags: ["Vue 3", "Pinia", "QA"],
    sectionId: "experience",
  },
  {
    id: "role-pro-event",
    group: "role",
    label: "Pro Event",
    title: "Software Engineer - Pro Event",
    meta: "Jul 2025 - Mar 2026 - Cairo (Remote) - Part-time",
    summary:
      "Proposed creating a dedicated software section in the company and led the migration direction from Salla/Zid to WordPress + WooCommerce.",
    bullets: [
      "Built and standardized the storefront UI across product, category, blog and checkout with a consistent design system and light/dark themes.",
      "Built a full-stack QR-verification service used internally for 1,000,000+ unique product codes.",
    ],
    tags: ["WordPress", "WooCommerce", "Node.js", "MongoDB"],
    sectionId: "experience",
  },
  {
    id: "role-independent-qr",
    group: "role",
    label: "Independent Product",
    title: "Independent Product Development - QR Verification Platform",
    meta: "2026 - Present - Productization",
    summary:
      "Continued improving the QR-verification platform beyond the initial Sara Beauty delivery so it can be reused and marketed for future clients.",
    bullets: [
      "Hardened the service with rate limiting, session revocation, audit events and CORS/security controls.",
      "Added automated unit and Playwright coverage for concurrency, security and performance paths.",
      "Added GitHub Actions CI, Node.js 22 LTS support, accessibility and contrast improvements, and local font delivery.",
    ],
    tags: ["Node.js", "Playwright", "GitHub Actions"],
    sectionId: "experience",
  },
  {
    id: "role-shortcutadv",
    group: "role",
    label: "Shortcutadv",
    title: "WordPress Developer - Shortcutadv",
    meta: "Jan 2022 - Jan 2024 - Saudi Arabia (Remote) - Full-time",
    summary:
      "Two years of WordPress client delivery - the foundation of the 4+ years of professional web development.",
    bullets: [
      "Customized WordPress themes and integrated plugins for diverse client requirements, ensuring responsive design, cross-browser compatibility and optimized performance.",
      "Developed websites from scratch with tailored features, SEO best practices and user-friendly navigation.",
    ],
    tags: ["WordPress", "PHP", "SEO"],
    sectionId: "experience",
  },

  /* ------------------------------------------------------------ projects */
  {
    id: "proj-clinic-flow",
    group: "project",
    label: "Clinic Flow",
    title: "Clinic Flow",
    meta: "Selected product work - shipped to a real clinic",
    summary:
      "An Arabic-first, RTL clinic operations app built around same-day visit intake, doctor queue management, patient files and staff access control.",
    bullets: [
      "Reception workflows create today's queue entries, select returning patient files explicitly, and auto-create files for first-time patients.",
      "Doctor-facing queue and patient-detail screens carry session history, session-charge context and day-scoped queue behaviour.",
      "Protected routes and role-based access across reception, queue, patients, patient detail and staff management.",
      "A doctor adopted it for daily use and praised how directly it solved his day-to-day workflow problem.",
    ],
    tags: [
      "React 19",
      "TypeScript",
      "TanStack Router",
      "TanStack Query",
      "Better Auth",
      "Drizzle",
      "Tailwind CSS",
      "shadcn/ui",
    ],
  },
  {
    id: "proj-bleu-blog",
    group: "project",
    label: "BLEU Blog",
    title: "BLEU Community Blog",
    meta: "Open source contribution - Eleventy/Tailwind tech community site",
    summary:
      "Arabic-first internationalization work across an open-source community website: locale data, localized routes, RTL-aware UI and a language switcher.",
    bullets: [
      "Added and refined Arabic/English translation files for home, blogs, blog details, shared UI copy and contributing flows.",
      "Improved Arabic UX terminology for contributor-facing labels, merge-request wording and category filtering.",
      "Strengthened localization reliability with i18n validation and localized-build verification scripts.",
      "Fixed semantic blog datetime output and moved font loading from CSS import into the document head for performance.",
    ],
    tags: ["Eleventy", "Tailwind CSS", "i18n", "RTL"],
  },
  {
    id: "proj-gas-reg",
    group: "project",
    label: "GAS-REG Portal",
    title: "GAS-REG Portal",
    meta: "Smartly Techs - in development",
    summary:
      "An Angular 21 frontend for complex regulatory and HSE workflows, built with standalone components, routing and Reactive Forms.",
    bullets: [
      "Reusable ControlValueAccessor and signal-based controls assembled into conditional permission-request sections with FormArray-driven dynamic fields.",
      "Bilingual Arabic/English UX with Transloco and RTL/LTR switching.",
      "In-app XLSX editing through Syncfusion Spreadsheet.",
      "Login/session handling, mapping complex frontend form state into backend submission payloads.",
    ],
    tags: ["Angular 21", "Reactive Forms", "Transloco", "Syncfusion", "RTL"],
  },
  {
    id: "proj-competition-admin",
    group: "project",
    label: "Competition Admin",
    title: "Competition Management Admin",
    meta: "Smartly Techs",
    summary:
      "A role-based React/TypeScript administration platform for system admins, supervisors, judges and reviewers.",
    bullets: [
      "Implemented the competition lifecycle from creation and judge assignment through participant/submission review and winner tracking.",
      "State-dependent route and action guards for judging, approvals, eligibility, next-review handling and scoring.",
      "TOTP/MFA, Arabic error handling, winner-rank validation up to 120 and required-score validation up to 300.",
      "Bilingual RTL dashboards, reports, exports and reusable data tables.",
    ],
    tags: [
      "React",
      "TypeScript",
      "TanStack Router",
      "TanStack Query",
      "TanStack Table",
      "Zod",
      "Vitest",
    ],
  },
  {
    id: "proj-akhbar-admin",
    group: "project",
    label: "Akhbar Admin",
    title: "Akhbar AlKhaleej Admin FE",
    meta: "Smartly Techs - led frontend delivery",
    summary:
      "A modular Angular SPA for editorial administration, with standalone components and lazy-loaded routes.",
    bullets: [
      "JWT login/refresh, persistent session hydration, route guards and RBAC scoping by role, section and category.",
      "Create/edit/publish workflows with status tracking, drafts, version history and unsaved-changes protection.",
      "RTL rich-text editing, media-library insertion, image cropping, galleries and reusable dashboard components.",
      "Standardized API integration, shared lookup caching/prefetching and error/toast handling across the dashboard.",
    ],
    tags: ["Angular", "JWT", "RBAC", "RTL"],
  },
  {
    id: "proj-bidding-wallet",
    group: "project",
    label: "Bidding Wallet",
    title: "Bidding Wallet Flow",
    meta: "Smartly Techs",
    summary:
      "A secure bidding-wallet flow enforcing a minimum 10% balance requirement before bidding and placing funds on hold during active bids.",
    tags: ["Node.js", "Next.js"],
  },
  {
    id: "proj-faster-meeting",
    group: "project",
    label: "Faster Meeting",
    title: "Faster Meeting",
    meta: "Smartly Techs",
    summary:
      "A Next.js meeting platform with authenticated scheduling, editing and management of Zoom meetings through custom .NET APIs.",
    tags: ["Next.js", "Zoom API", ".NET APIs"],
  },
  {
    id: "proj-efa",
    group: "project",
    label: "EFA",
    title: "EFA",
    meta: "Smartly Techs - performance work",
    summary:
      "Improved UI/UX and web performance, raising Lighthouse from 61 to 84 by optimizing LCP, FCP and layout shifts.",
    tags: ["Performance", "LCP", "FCP", "CLS"],
  },
  {
    id: "proj-boots-ladders",
    group: "project",
    label: "Boots & Ladders",
    title: "Boots & Ladders",
    meta: "Smartly Techs",
    summary: "Enhanced UI/UX and performance using Vue.js.",
    tags: ["Vue.js"],
  },
  {
    id: "proj-virtuwa-hv",
    group: "project",
    label: "VirtuWa HV",
    title: "VirtuWa HV - Hypervisor Management Interface",
    meta: "Virtuwa - Oct 2025 - Jan 2026 (3 months) - shipped",
    summary:
      "A React/TypeScript hypervisor management console with live monitoring, RBAC and bilingual English/Arabic UX.",
    bullets: [
      "VM lifecycle workflows (power, clone, snapshots, console), storage/network management and backup/restore interfaces with search and filtering.",
      "Hardened the console’s session handling with session-based bootstrap and short-lived, opaque identifiers.",
      "Shipped to a startup environment with early users; mentored a new frontend developer through implementation and delivery.",
    ],
    tags: ["React", "TypeScript", "RBAC", "RTL"],
    href: "https://virtuwa.com/",
    linkLabel: "Visit VirtuWa",
  },
  {
    id: "proj-virtuwa-cloud",
    group: "project",
    label: "Cloud Manager",
    title: "VirtuWa Cloud Manager - Enterprise Hypervisor Control Plane",
    meta: "Virtuwa - in development",
    summary:
      "A React/TypeScript control plane for VMs, hosts, clusters, storage, networking, licensing and events.",
    bullets: [
      "VM lifecycle actions and a browser-based noVNC/WebSocket console, with monitoring dashboards for CPU, memory, network and IOPS.",
      "Searchable, filterable, paginated event/audit logs with CSV/JSON export.",
      "Auth UX for token refresh and inactivity logout.",
      "Documented backend contract improvements that reduced frontend normalization and clarified API integration requirements.",
    ],
    tags: ["React", "TypeScript", "noVNC", "WebSocket"],
  },
  {
    id: "proj-flow-bridge",
    group: "project",
    label: "Flow Bridge",
    title: "Virtuwa Flow Bridge",
    meta: "Virtuwa - in development",
    summary:
      "Target-host management and process orchestration, delivered on a CI/CD pipeline built from scratch.",
    bullets: [
      "GitHub Actions for install, typecheck, tests, build verification and VM deployment over SSH to a self-hosted runner.",
      "Repeatable deployments with versioned releases, a `current` Nginx symlink, protected secrets and setup documentation for future maintainers.",
      "Target-host management, connection testing, Jisir process actions, user management, authentication and activity/dashboard API integrations.",
      "Expanded bilingual localization and RTL support; added a shared typed API client with a standardized Vite proxy configuration.",
    ],
    tags: ["GitHub Actions", "Nginx", "SSH", "Vite", "RTL"],
  },
  {
    id: "proj-care-connect",
    group: "project",
    label: "Care Connect",
    title: "Care Connect Dashboard",
    meta: "Riyada Al Arabiya - Laravel to Vue 3 migration",
    summary:
      "Appointment table and calendar workflows delivered as part of a Laravel-to-Vue 3 migration, with Pinia-managed filters.",
    bullets: [
      "Implemented and validated recurring and overnight scheduling and date/time mapping.",
      "Status-transition rules, disabled actions and same-day check-in gating.",
    ],
    tags: ["Vue 3", "Pinia", "Laravel"],
  },
  {
    id: "proj-watu",
    group: "project",
    label: "Watu",
    title: "Watu",
    meta: "Riyada Al Arabiya - university platform",
    summary:
      "Refactored the Apply Now flow into a unified multi-step form and integrated location and information-request APIs.",
    tags: ["Vue 3", "Multi-step forms"],
  },
  {
    id: "proj-pro-event-storefront",
    group: "project",
    label: "Pro Event Store",
    title: "Pro Event Storefront",
    meta: "Pro Event - Salla/Zid to WordPress + WooCommerce",
    summary:
      "A standardized storefront UI across product, category, blog and checkout, with a consistent design system and light/dark themes.",
    bullets: [
      "Improved product discovery through navigation restructuring, service menu updates, category icon enhancements and WhatsApp CTA integration.",
      "Implemented the blog and SEO-focused sections across key pages.",
      "Delivered homepage/store promotional banners and customer-logo social proof integration.",
    ],
    tags: ["WordPress", "WooCommerce", "SEO", "Design system"],
  },
  {
    id: "proj-qr-verify",
    group: "project",
    label: "QR Verification",
    title: "QR-code Verification Platform (Sara Beauty)",
    meta: "Pro Event, then continued independently - 1,000,000+ codes",
    summary:
      "A full-stack Node.js/Express and MongoDB QR-verification service used internally to generate and manage over a million unique product codes.",
    bullets: [
      "Idempotent batch generation, CSV exports and printable QR-label sheets.",
      "An Arabic/RTL admin dashboard for manufacturing workflows.",
      "A consumer scanner with camera/manual entry and verification rules for first use, repeat scans, revocation and expiry.",
    ],
    tags: ["Node.js", "Express", "MongoDB", "RTL"],
    href: "https://verify.sarabeauty.net/scan",
    linkLabel: "Open live scanner",
  },

  /* -------------------------------------------------------------- skills */
  {
    id: "skill-frameworks",
    group: "skill",
    label: "Frameworks",
    title: "Programming & Frameworks",
    meta: "Core skills",
    summary: "The day-to-day stack across every engagement.",
    tags: [
      "React (Vite, TanStack Router, React Query, shadcn/ui)",
      "Angular (v17-18 migrations, Nx, Metronic)",
      "Vue (Pinia, vue-router)",
      "Node.js",
      "Express",
      "JavaScript",
      "TypeScript",
      "HTML5",
      "CSS3",
      "Bootstrap",
      "Tailwind",
    ],
  },
  {
    id: "skill-ecommerce",
    group: "skill",
    label: "E-commerce & CMS",
    title: "E-commerce & CMS",
    meta: "Core skills",
    summary: "Storefront and content platforms, mostly in the Gulf market.",
    tags: ["OpenCart customizations", "Salla", "Zid", "Shopify", "WordPress", "WooCommerce"],
  },
  {
    id: "skill-devops",
    group: "skill",
    label: "DevOps & Infra",
    title: "DevOps & Infrastructure",
    meta: "Core skills",
    summary:
      "Enough infrastructure to own a deployment end to end, not just hand off a dist folder.",
    tags: [
      "AWS Lightsail",
      "Docker",
      "Docker Compose",
      "GitHub Actions CI/CD (self-hosted runners)",
      "pnpm -> dist -> Nginx pipelines",
      "Nginx reverse proxy (443/6000/5678)",
      "SSL/TLS",
      "WebSocket proxying",
      "Linux administration, sudoers, SCP, SSH",
      "Cloudflare Pages / Workers",
    ],
  },
  {
    id: "skill-data",
    group: "skill",
    label: "Databases",
    title: "Databases & Analytics",
    meta: "Core skills",
    summary: "Data work behind the interfaces.",
    bullets: [
      "File import validation audit and error-handling logic.",
      "MongoDB queries and debugging.",
    ],
    tags: ["SQL Server", "MongoDB", "MongoDB Atlas"],
  },
  {
    id: "skill-other",
    group: "skill",
    label: "Cross-cutting",
    title: "Other Skills",
    meta: "Core skills",
    summary: "Skills that do not fit a stack label but show up in every project.",
    tags: [
      "Bilingual translation (Arabic <-> English)",
      "High-fidelity UI/UX integration with brand guidelines",
      "Performance optimization",
    ],
  },
  {
    id: "skill-tools",
    group: "skill",
    label: "Tools",
    title: "Tools",
    meta: "Daily toolchain",
    summary: "The tools the work actually happens in.",
    tags: [
      "Git",
      "GitHub",
      "Jira",
      "Postman",
      "Visual Studio",
      "VS Code",
      "Docker",
      "Nginx",
      "Mongo Shell",
      "MySQL Workbench",
      "PowerShell",
      "Linux Terminal",
      "Figma (UI integration)",
    ],
  },

  /* ------------------------------------------------------------- domains */
  {
    id: "domain-healthcare",
    group: "domain",
    label: "Healthcare",
    title: "Healthcare",
    meta: "Domain",
    summary:
      "Clinic operations and appointment scheduling, where a wrong status transition is a missed patient.",
  },
  {
    id: "domain-virtualization",
    group: "domain",
    label: "Virtualization",
    title: "Virtualization & Infrastructure",
    meta: "Domain",
    summary:
      "Hypervisor consoles and control planes: VM lifecycle, live monitoring, and browser-based remote consoles.",
  },
  {
    id: "domain-regulatory",
    group: "domain",
    label: "Regulatory",
    title: "Regulatory & Compliance",
    meta: "Domain",
    summary:
      "HSE and permission-request workflows where the form itself is the product and every field is conditional.",
  },
  {
    id: "domain-editorial",
    group: "domain",
    label: "Editorial",
    title: "Editorial & Journalism",
    meta: "Domain",
    summary:
      "Newsroom administration: drafts, version history, publish workflows and RTL rich-text editing.",
  },
  {
    id: "domain-ecommerce",
    group: "domain",
    label: "E-commerce",
    title: "E-commerce & Retail",
    meta: "Domain",
    summary:
      "Storefronts, product verification and the platform migrations that sit behind them.",
  },
  {
    id: "domain-public",
    group: "domain",
    label: "Education & Public",
    title: "Education & Public Programs",
    meta: "Domain",
    summary:
      "University admissions and national competition administration - many roles, strict eligibility rules.",
  },

  /* --------------------------------------------------------------- craft */
  {
    id: "craft-cicd",
    group: "craft",
    label: "CI/CD Automation",
    title: "CI/CD & Deployment Automation",
    meta: "Headline achievement",
    summary:
      "Designed and implemented a self-hosted GitHub Actions runner on a private Linux server to enable CI/CD without exposing SSH publicly.",
    bullets: [
      "Automated frontend pipeline: pnpm install -> build -> dist -> Nginx deployment -> safe reload.",
      "Passwordless sudo rules for controlled deployment commands (rm, copy, nginx reload).",
      "Zero-downtime frontend updates with configuration validation before reload.",
      "Reduced manual deployment effort to a single Git push -> live deployment.",
    ],
    tags: ["GitHub Actions", "Self-hosted runner", "Nginx", "Linux", "sudoers"],
  },
  {
    id: "craft-bilingual",
    group: "craft",
    label: "Bilingual & RTL",
    title: "Bilingual & RTL Engineering",
    meta: "Cross-cutting practice",
    summary:
      "Arabic-first and bilingual RTL interfaces are the through-line of almost every product here, not an afterthought bolted on at the end.",
    bullets: [
      "Arabic native, English professional working proficiency; bilingual translation Arabic <-> English.",
      "Transloco-driven RTL/LTR switching, localized routes, locale data and language switchers.",
      "Arabic UX terminology consistency, Arabic error handling, RTL rich-text editing and RTL admin dashboards.",
      "i18n validation and localized-build verification scripts.",
    ],
    tags: ["Transloco", "i18n", "RTL", "Arabic-first"],
  },
  {
    id: "craft-security",
    group: "craft",
    label: "Access & Security",
    title: "Access Control & Security",
    meta: "Cross-cutting practice",
    summary:
      "Role-based access, session handling and the kind of security review that changes a shipped design.",
    bullets: [
      "RBAC scoping by role, section and category; state-dependent route and action guards.",
      "JWT login/refresh, persistent session hydration, token refresh and inactivity logout; TOTP/MFA.",
      "Hardened session handling with session-based bootstrap and short-lived, opaque identifiers.",
      "Rate limiting, session revocation, audit events and CORS/security controls.",
    ],
    tags: ["RBAC", "JWT", "TOTP/MFA", "Audit logging"],
  },
  {
    id: "craft-performance",
    group: "craft",
    label: "Performance & QA",
    title: "Performance & Quality",
    meta: "Cross-cutting practice",
    summary:
      "Measured performance work and automated coverage, with numbers attached.",
    bullets: [
      "Raised EFA Lighthouse from 61 to 84 by optimizing LCP, FCP and layout shifts.",
      "Moved font loading from CSS import into the document head; local font delivery.",
      "Automated unit and Playwright coverage for concurrency, security and performance paths.",
      "Accessibility and contrast improvements; end-to-end QA with prioritized issue reports.",
    ],
    tags: ["Lighthouse", "Playwright", "Vitest", "Accessibility"],
  },
  {
    id: "craft-ways-of-working",
    group: "craft",
    label: "Ways of Working",
    title: "Ways of Working",
    meta: "Soft skills, with the evidence",
    summary:
      "Team leadership, requirements clarification, documentation and bilingual communication - each backed by something shipped.",
    bullets: [
      "Mentored a new frontend developer at Virtuwa through implementation and delivery.",
      "Proposed creating a dedicated software section at Pro Event and led the migration direction.",
      "Documented backend contract improvements that reduced frontend normalization.",
      "Prepared prioritized QA reports and team action plans for delivery at Riyada.",
      "Wrote setup documentation for future maintainers of the Flow Bridge deployment.",
    ],
  },

  /* --------------------------------------------------------------- links */
  {
    id: "link-email",
    group: "link",
    label: "Email",
    title: "Email",
    meta: "Usually replies within 24 hours",
    summary: "abdelrhmanehab047@gmail.com",
    href: "mailto:abdelrhmanehab047@gmail.com",
    linkLabel: "Send email",
  },
  {
    id: "link-linkedin",
    group: "link",
    label: "LinkedIn",
    title: "LinkedIn",
    meta: "Professional profile",
    summary: "The long-form version of this graph.",
    href: "https://www.linkedin.com/in/abdelrahman-ehab-87261a244/",
    linkLabel: "Open LinkedIn",
  },
  {
    id: "link-github",
    group: "link",
    label: "GitHub",
    title: "GitHub",
    meta: "Open source and personal work",
    summary: "Where the open-source contributions and personal products live.",
    href: "https://github.com/abdelrhmanehab10",
    linkLabel: "Open GitHub",
  },
  {
    id: "link-resume",
    group: "link",
    label: "Resume (PDF)",
    title: "Resume (PDF)",
    meta: "Full detail, including the parts this graph leaves out",
    summary:
      "The complete CV: every bullet, the full tool list, and contact details not published on this page.",
    href: "./assets/abdelrhmanehab_resume.pdf",
    linkLabel: "Download resume",
  },
];

/**
 * Edge types
 *   contains        hub -> child. The structural backbone the force layout clusters on.
 *   delivered-in    project -> role. Where the work shipped.
 *   in-domain       project -> domain. The cross-cluster tension that makes the graph mean something.
 *   concurrent-with role <-> role. The career note: part-time engagements held during the full-time role.
 *   continued-as    role -> role, or project -> role. Career and product continuity.
 *   evidences       project -> craft. Only where profile.md has a sentence that proves it.
 */
export const graphEdges = [
  /* root -> hubs */
  { source: "me", target: "hub-experience", type: "contains" },
  { source: "me", target: "hub-projects", type: "contains" },
  { source: "me", target: "hub-skills", type: "contains" },
  { source: "me", target: "hub-domains", type: "contains" },
  { source: "me", target: "hub-craft", type: "contains" },
  { source: "me", target: "hub-connect", type: "contains" },

  /* hub -> roles */
  { source: "hub-experience", target: "role-smartly-fse", type: "contains" },
  { source: "hub-experience", target: "role-smartly-fe", type: "contains" },
  { source: "hub-experience", target: "role-virtuwa-freelance", type: "contains" },
  { source: "hub-experience", target: "role-virtuwa-pt", type: "contains" },
  { source: "hub-experience", target: "role-riyada", type: "contains" },
  { source: "hub-experience", target: "role-pro-event", type: "contains" },
  { source: "hub-experience", target: "role-independent-qr", type: "contains" },
  { source: "hub-experience", target: "role-shortcutadv", type: "contains" },

  /* hub -> projects */
  { source: "hub-projects", target: "proj-clinic-flow", type: "contains" },
  { source: "hub-projects", target: "proj-bleu-blog", type: "contains" },
  { source: "hub-projects", target: "proj-gas-reg", type: "contains" },
  { source: "hub-projects", target: "proj-competition-admin", type: "contains" },
  { source: "hub-projects", target: "proj-akhbar-admin", type: "contains" },
  { source: "hub-projects", target: "proj-bidding-wallet", type: "contains" },
  { source: "hub-projects", target: "proj-faster-meeting", type: "contains" },
  { source: "hub-projects", target: "proj-efa", type: "contains" },
  { source: "hub-projects", target: "proj-boots-ladders", type: "contains" },
  { source: "hub-projects", target: "proj-virtuwa-hv", type: "contains" },
  { source: "hub-projects", target: "proj-virtuwa-cloud", type: "contains" },
  { source: "hub-projects", target: "proj-flow-bridge", type: "contains" },
  { source: "hub-projects", target: "proj-care-connect", type: "contains" },
  { source: "hub-projects", target: "proj-watu", type: "contains" },
  { source: "hub-projects", target: "proj-pro-event-storefront", type: "contains" },
  { source: "hub-projects", target: "proj-qr-verify", type: "contains" },

  /* hub -> skills */
  { source: "hub-skills", target: "skill-frameworks", type: "contains" },
  { source: "hub-skills", target: "skill-ecommerce", type: "contains" },
  { source: "hub-skills", target: "skill-devops", type: "contains" },
  { source: "hub-skills", target: "skill-data", type: "contains" },
  { source: "hub-skills", target: "skill-other", type: "contains" },
  { source: "hub-skills", target: "skill-tools", type: "contains" },

  /* hub -> domains */
  { source: "hub-domains", target: "domain-healthcare", type: "contains" },
  { source: "hub-domains", target: "domain-virtualization", type: "contains" },
  { source: "hub-domains", target: "domain-regulatory", type: "contains" },
  { source: "hub-domains", target: "domain-editorial", type: "contains" },
  { source: "hub-domains", target: "domain-ecommerce", type: "contains" },
  { source: "hub-domains", target: "domain-public", type: "contains" },

  /* hub -> craft */
  { source: "hub-craft", target: "craft-cicd", type: "contains" },
  { source: "hub-craft", target: "craft-bilingual", type: "contains" },
  { source: "hub-craft", target: "craft-security", type: "contains" },
  { source: "hub-craft", target: "craft-performance", type: "contains" },
  { source: "hub-craft", target: "craft-ways-of-working", type: "contains" },

  /* hub -> links */
  { source: "hub-connect", target: "link-email", type: "contains" },
  { source: "hub-connect", target: "link-linkedin", type: "contains" },
  { source: "hub-connect", target: "link-github", type: "contains" },
  { source: "hub-connect", target: "link-resume", type: "contains" },

  /* project -> role (delivered-in) */
  { source: "proj-gas-reg", target: "role-smartly-fse", type: "delivered-in" },
  { source: "proj-competition-admin", target: "role-smartly-fse", type: "delivered-in" },
  { source: "proj-akhbar-admin", target: "role-smartly-fse", type: "delivered-in" },
  { source: "proj-bidding-wallet", target: "role-smartly-fse", type: "delivered-in" },
  { source: "proj-faster-meeting", target: "role-smartly-fe", type: "delivered-in" },
  { source: "proj-efa", target: "role-smartly-fe", type: "delivered-in" },
  { source: "proj-boots-ladders", target: "role-smartly-fe", type: "delivered-in" },
  { source: "proj-virtuwa-hv", target: "role-virtuwa-pt", type: "delivered-in" },
  { source: "proj-virtuwa-cloud", target: "role-virtuwa-pt", type: "delivered-in" },
  { source: "proj-flow-bridge", target: "role-virtuwa-pt", type: "delivered-in" },
  { source: "proj-care-connect", target: "role-riyada", type: "delivered-in" },
  { source: "proj-watu", target: "role-riyada", type: "delivered-in" },
  { source: "proj-pro-event-storefront", target: "role-pro-event", type: "delivered-in" },
  { source: "proj-qr-verify", target: "role-pro-event", type: "delivered-in" },
  { source: "proj-qr-verify", target: "role-independent-qr", type: "continued-as" },
  { source: "proj-virtuwa-cloud", target: "role-virtuwa-freelance", type: "continued-as" },

  /* project -> domain */
  { source: "proj-clinic-flow", target: "domain-healthcare", type: "in-domain" },
  { source: "proj-care-connect", target: "domain-healthcare", type: "in-domain" },
  { source: "proj-virtuwa-hv", target: "domain-virtualization", type: "in-domain" },
  { source: "proj-virtuwa-cloud", target: "domain-virtualization", type: "in-domain" },
  { source: "proj-flow-bridge", target: "domain-virtualization", type: "in-domain" },
  { source: "proj-gas-reg", target: "domain-regulatory", type: "in-domain" },
  { source: "proj-akhbar-admin", target: "domain-editorial", type: "in-domain" },
  { source: "proj-bleu-blog", target: "domain-editorial", type: "in-domain" },
  { source: "proj-pro-event-storefront", target: "domain-ecommerce", type: "in-domain" },
  { source: "proj-qr-verify", target: "domain-ecommerce", type: "in-domain" },
  { source: "proj-competition-admin", target: "domain-public", type: "in-domain" },
  { source: "proj-watu", target: "domain-public", type: "in-domain" },

  /* role <-> role: the career note about concurrent part-time engagements */
  { source: "role-virtuwa-pt", target: "role-smartly-fse", type: "concurrent-with" },
  { source: "role-riyada", target: "role-smartly-fse", type: "concurrent-with" },
  { source: "role-pro-event", target: "role-smartly-fse", type: "concurrent-with" },

  /* role -> role: continuity */
  { source: "role-smartly-fe", target: "role-smartly-fse", type: "continued-as" },
  { source: "role-virtuwa-pt", target: "role-virtuwa-freelance", type: "continued-as" },
  { source: "role-pro-event", target: "role-independent-qr", type: "continued-as" },

  /* project -> craft: only where profile.md states the evidence */
  { source: "proj-flow-bridge", target: "craft-cicd", type: "evidences" },
  { source: "proj-qr-verify", target: "craft-cicd", type: "evidences" },
  { source: "proj-virtuwa-hv", target: "craft-security", type: "evidences" },
  { source: "proj-akhbar-admin", target: "craft-security", type: "evidences" },
  { source: "proj-competition-admin", target: "craft-security", type: "evidences" },
  { source: "proj-clinic-flow", target: "craft-security", type: "evidences" },
  { source: "proj-virtuwa-cloud", target: "craft-security", type: "evidences" },
  { source: "proj-gas-reg", target: "craft-bilingual", type: "evidences" },
  { source: "proj-bleu-blog", target: "craft-bilingual", type: "evidences" },
  { source: "proj-akhbar-admin", target: "craft-bilingual", type: "evidences" },
  { source: "proj-clinic-flow", target: "craft-bilingual", type: "evidences" },
  { source: "proj-qr-verify", target: "craft-bilingual", type: "evidences" },
  { source: "proj-efa", target: "craft-performance", type: "evidences" },
  { source: "proj-bleu-blog", target: "craft-performance", type: "evidences" },
  { source: "proj-boots-ladders", target: "craft-performance", type: "evidences" },
  { source: "proj-care-connect", target: "craft-ways-of-working", type: "evidences" },
  { source: "proj-virtuwa-hv", target: "craft-ways-of-working", type: "evidences" },

  /* skill cluster -> craft: two only, where the cluster IS the practice */
  { source: "skill-devops", target: "craft-cicd", type: "evidences" },
  { source: "skill-other", target: "craft-bilingual", type: "evidences" },
];

/** Slate palette; cyan is reserved for hubs and interactive emphasis. */
export const graphGroups = {
  root: { color: "#f8fafc", size: 13, label: "Me" },
  hub: { color: "#67e8f9", size: 9, label: "Sections" },
  role: { color: "#cbd5e1", size: 6.5, label: "Experience" },
  project: { color: "#e2e8f0", size: 6, label: "Projects" },
  skill: { color: "#94a3b8", size: 6, label: "Skills" },
  domain: { color: "#cbd5e1", size: 6, label: "Domains" },
  craft: { color: "#e2e8f0", size: 6, label: "Practices" },
  link: { color: "#94a3b8", size: 5, label: "Connect" },
};
