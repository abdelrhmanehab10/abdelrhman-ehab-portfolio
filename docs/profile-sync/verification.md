# Profile sync verification

Source checked: `/mnt/d/CVs/source/profile.md` (read-only). Regenerate/check commands are in the README. The generated model includes a SHA-256 of **the entire source**, so even edits to currently unmapped text fail `--check` until the model is regenerated/reviewed. A modified local copy of the profile was rejected by the check.

## Chrome (chrome-devtools-axi)

Served the real page on localhost at 1440 × 900 and 390 × 844 (DPR 3). Compared profile headings, dates, bullets and lists with the generated model and the rendered DOM: 4+ professional years including 2+ framework years; all 8 roles and their highlights/dates; all 16 projects including BLEU and Clinic Flow; all six core skill clusters, tools, 3 industries, 2 languages, soft skills and 5 deployment-achievement bullets. Browser checks found no missing card bullet or skill tag; title and document horizontal overflow checks at 390px were clear, including the Riyada role and Cloud Manager project. Contributions are available in expandable card details for readability. Screenshots of each changed section: [desktop home](desktop-home.png), [impact](desktop-impact.png), [projects](desktop-projects.png), [experience](desktop-experience.png), [skills](desktop-skills.png), [contact](desktop-contact.png); [mobile home](mobile-home.png), [impact](mobile-impact.png), [projects](mobile-projects.png), [experience](mobile-experience.png), [skills](mobile-skills.png), [contact](mobile-contact.png).

| Lighthouse navigation | Accessibility | SEO | Best practices | CLS | PR #1 CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 0.0087 | 0.0207 |
| Desktop | 100 | 100 | 100 | 0.0012 | 0.0007 |

[Mobile report](lighthouse-mobile/report.html) · [Desktop report](lighthouse-desktop/report.html). The static generated hero copy and reserved technology-track height avoid a first-paint layout shift.

## Public-copy privacy decisions (for PR description)

The generator transforms these source details **before** graph, rendered cards, no-JS index, JSON-LD or Open Graph are generated:

1. Raw reverse-proxy port topology `(443/6000/5678)` → `Nginx reverse proxy`.
2. Passwordless sudo and enumerated privileged deployment commands → `Least-privilege sudo rules scoped to the deployment commands only`.
3. HV console's explicit URL-exposure finding → session handling with session-based bootstrap and short-lived, opaque identifiers; no raw VM/connection-data or browser-URL disclosure.
4. VM-console TLS termination and domain/Cloudflare rule detail → encrypted WebSocket connectivity and managed TLS.
5. Flow Bridge's SSH runner/VM topology → private-runner deployment; the `current` Nginx symlink → managed release switching; internal process name → generic process actions.
6. Private LAN deployment wording → private deployments; Linux sudoers/file permissions/SCP/SSH troubleshooting specifics → least-privilege deployment permissions and Linux troubleshooting.

A source-side rejection guard and public-surface tests cover these details. Project links already public in the previous graph remain public. The external profile itself is not copied into the repository.
