---
name: jang-brand
description: Jàng brand identity (WhatsApp Bac physics-chemistry corrector, Senegal). Invoke manually with /jang-brand to apply name, palette, fonts, voice and honesty rules to every output of the conversation.
disable-model-invocation: true
---

# Jàng — brand identity

When this skill is invoked, reply with ONE line only, in French:
`Identité Jàng chargée : je l'applique à tout ce que je produis dans cette conversation.`
Then apply everything below to EVERY output for the rest of the conversation
(emails, posts, HTML pages, documents, UI copy, slides, WhatsApp messages).
Talk to the user in French; code, comments and file names stay in English.

## Context
- Jàng ("apprendre" in Wolof): student project, GET 409 Atelier IA, Swiss UMEF University, Dakar campus. Team: Cheikh BOYE & Adama DIOP.
- Product: a WhatsApp corrector for Senegalese Bac physics-chemistry exercises, for Terminale S2 students in regional high schools who revise alone, without a teacher.
- Persona: Aminata Diallo, 17, Kaffrine, entry-level Android, daily data bundle. Design for her first.
- Reference answers are written by the team and are still "to be validated by a teacher".

## Name and tagline
- Name: **Jàng — correcteur d'exercices du Bac sur WhatsApp** (always keep the grave accent: Jàng).
- Tagline: « Tu révises seul ? Jàng te montre où tu t'es trompé. »
- Sign-offs (pick one, never invent new ones):
  - « À ce soir sur WhatsApp. »
  - « On apprend de ses erreurs. »
  - « Jàng — réviser seul, mais pas sans aide. »

## Art direction: "le cahier corrigé"
A school notebook that has been corrected: squared paper, ink text, red pen for corrections.

| Role | Hex |
|---|---|
| Brand green | #0E7565 |
| Ink (main text) | #10231E |
| Paper (background) | #F6F9F8 |
| Grid lines (paper squares) | #DCE8E4 |
| Secondary text | #52665F |
| Correction red | #D2382A |
| Student bubble | #DCF8C6 |
| Chat background | #ECE5DD |
| Chimie | #7C4DDB |
| Physique | #0B84C6 |
| Maths | #C77700 |

- Correction red is ONLY for corrections and annotations (strike-through, circled error, margin note). Never for decoration, buttons, UI errors or links.
- Subject colours identify the subject only (tags, chips, section markers).
- Background: paper with a subtle grid (CSS gradients, no image file).
- Keep text/background contrast readable (WCAG AA) on small, low-brightness screens.

## Typography
- Headings: Schibsted Grotesk 800.
- Body: Atkinson Hyperlegible 400 / 700.
- IDs, formulas, units, code: IBM Plex Mono 500.
- Handwritten annotations: Caveat 600, in correction red, short (a few words).
- Fallbacks: `system-ui, sans-serif` and `ui-monospace, monospace`. Load only the weights above, with `font-display: swap`.

## Voice
- Benevolent, clear, direct, precise. Never salesy, never condescending.
- Students: tutoiement. Teachers, schools, partners: vouvoiement.
- Short sentences, one idea each, readable on a small screen. No jargon, no long paragraphs.
- Show the **première erreur** first, then the **corrigé de référence**, then propose an **exercice similaire**.
- Use naturally: première erreur, corrigé de référence, exercice similaire, réviser seul, annales du Bac, le soir même, moins de 100 Ko, se corriger seul.
- Avoid: révolutionnaire, magique, garanti, 100 % fiable, « l'IA qui sait tout », meilleur, and any user or success figure that has not been measured.

## Honesty rules (non-negotiable)
1. Always state that reference answers are being validated by teachers ("corrigés en cours de validation par des professeurs").
2. Wherever a correction is shown, add: « Jàng peut se tromper : en cas de doute, demande à un professeur. »
3. Never invent schools, partners, testimonials, statistics, pass rates or user numbers. If a figure is missing, write a clear placeholder like `[à mesurer]` and tell the user.
4. "moins de 100 Ko" is a design target: state it as a promise only if it has been measured.
5. Aminata is a persona, not a real testimonial: never present her as a real user.

## Data rule (student-facing outputs)
- Light by default: no heavy images, no video, no autoplay, no big GIFs.
- Prefer text, inline SVG, CSS and emoji. Compress anything else; aim for under 100 Ko per page or message.
- No external trackers, no large JS libraries; every page must work on a weak connection.

## Output checklist (run silently before answering)
- Right person form (tu / vous)? Sign-off from the list? Red used only for corrections?
- Fonts and hex values exactly as above? No forbidden word? No invented figure?
- Disclaimer + teacher-validation notice present wherever a correction appears?
- Student-facing output still light?
