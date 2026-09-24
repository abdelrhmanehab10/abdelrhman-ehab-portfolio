# Profile sync verification

Source checked: `/mnt/d/CVs/source/profile.md` (read-only). Regenerate/check commands are in the README. The generated model includes a SHA-256 of **the entire source**, so even edits to currently unmapped text fail `--check` until the model is regenerated/reviewed. A modified local copy of the profile was rejected by the check.

## Chrome (chrome-devtools-axi)

Served the real page on localhost at 1440 × 900 and 390 × 844 (DPR 3). Compared profile headings, dates, bullets and lists with the generated model and the rendered DOM: 4+ professional years including 2+ framework years; all 8 roles and their highlights/dates; all 16 projects including BLEU and Clinic Flow; all six skill groups (including tools), 3 industries, 2 languages, soft skills and 5 deployment-achievement bullets. Browser checks found no missing card bullet or skill tag; title and document horizontal overflow checks at 390px were clear, including the Riyada role and Cloud Manager project. Contributions are available in expandable card details for readability. These captures predate the repository-backed project chips and the restored featured-project notices; the project screenshots are historical, not evidence of those final card details. Screenshots of each changed section: [desktop home](desktop-home.png), [impact](desktop-impact.png), [projects](desktop-projects.png), [experience](desktop-experience.png), [skills](desktop-skills.png), [contact](desktop-contact.png); [mobile home](mobile-home.png), [impact](mobile-impact.png), [projects](mobile-projects.png), [experience](mobile-experience.png), [skills](mobile-skills.png), [contact](mobile-contact.png).

| Lighthouse navigation | Accessibility | SEO | Best practices | CLS | PR #1 CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 0.0087 | 0.0207 |
| Desktop | 100 | 100 | 100 | 0.0012 | 0.0007 |

[Mobile report](lighthouse-mobile/report.html) · [Desktop report](lighthouse-desktop/report.html). The static generated hero copy and reserved technology-track height avoid a first-paint layout shift.

## Public-copy privacy decisions (for PR description)

The generator transforms these source details **before** graph, rendered cards, no-JS index, JSON-LD or Open Graph are generated:

1. Reverse-proxy topology → approved `Nginx reverse proxy` wording. The generator pins the source bullet; changes require re-approval before generation.
2. Privileged deployment commands → scoped least-privilege sudo wording.
3. HV console exposure detail → session-based bootstrap and short-lived, opaque identifiers.
4. VM-console TLS and domain rule detail → encrypted WebSocket connectivity and managed TLS.
5. Flow Bridge deployment internals → private-runner deployment, managed release switching and generic process actions.
6. Private deployment and Linux troubleshooting details → generalized deployment and permissions wording.

The generator owns the exact approved transformations and rejection checks; public-surface checks guard the committed output. Project links already public in the previous graph remain public. The external profile itself is not copied into the repository.
