# Jàng web

## What this is
- Web MVP of Jàng: a corrector for Senegalese Bac physics-chemistry exercises (Terminale S2).
- Users: students in regional high schools who revise alone, without a teacher, on entry-level
  Android phones with a small daily data bundle.
- Three pages:
  - **Accueil**: presentation of Jàng.
  - **Exercices**: catalogue of exercises (IDs `JNG-PC-xx`), filters by subject, and a WhatsApp-style
    "Corrige mon exercice" chat.
  - **Contact**: the volunteer teachers.
- The correction is produced by an existing Dify workflow, never by this repo.
- Phase 2 will add a real WhatsApp channel. Do not build it until asked.

## Stack & versions
- Vite + React + TypeScript (strict).
- Firebase Hosting + Cloud Functions 2nd gen; the Dify key lives in a Functions secret.
- Firestore later, for anonymous progress only.
- Node 22 LTS.
- The source of truth for exact versions is `package.json` and `functions/package.json`.
  Update this section whenever a major dependency changes.
- Visual identity: use the `/jang-brand` skill ("le cahier corrigé"). Do not invent colors or fonts.

## Commands
Run from the repo root unless noted. If a script does not exist yet, create it and document it here.
- `npm run dev`: Vite dev server.
- `npm run build`: type-check and production build into `dist/`.
- `npm test`: unit tests (Vitest).
- `npm --prefix functions run build`: compile the Cloud Functions.
- `firebase emulators:start --only functions,hosting`: local Functions and Hosting.
- `firebase deploy --only hosting,functions`: deploy. Only when the user asks.

## Folder structure (target)
```
src/
  pages/        Accueil, Exercices, Contact
  components/   UI pieces (chat, exercise card, filters)
  lib/          API client for the correction endpoint, formatting helpers
  data/         exercises catalogue, mirrors the knowledge base
  styles/       tokens and global CSS from /jang-brand
functions/
  src/          HTTP function that proxies the Dify workflow
docs/
  decisions.md  one entry per decision: date, choice, reason
firebase.json   hosting rewrite /api/** to the function
```

## Conventions
- TypeScript strict. No `any`, no `@ts-ignore` without a comment explaining why.
- Naming: PascalCase for components and types, camelCase for functions and variables,
  kebab-case for non-component files, `UPPER_SNAKE_CASE` for constants.
- Code, comments, commit messages and docs are in English.
- UI copy is in French, informal: always tutoiement for students ("Envoie ton exercice",
  never "Envoyez votre exercice"). Short sentences, simple words.
- Keep the UI usable on a 360 px wide screen and with a slow, unstable connection.
- Every request to the correction endpoint has a visible waiting state, a timeout and a retry.
  Gemini free tier can take 4 to 40 s.

## Domain terms
- **Exercise ID (`JNG-PC-xx`)**: unique ID of an exercise. It must match the knowledge base.
- **Reference answer (corrigé de référence)**: the official solution stored in the knowledge base.
- **First mistake**: the first wrong step in a student's solution. The correction points to it
  before anything else.
- **Similar exercise**: a related exercise suggested after a correction, always taken from the catalogue.
- **Série**: a group of exercises on the same theme, as in the Senegalese Bac papers.
- **Chapitre**: a chapter of the physics-chemistry syllabus. Used for filtering.
- **Knowledge base**: the Dify dataset `Jang_KB_v1`. It holds exercises and reference answers.
- **Workflow**: the Dify workflow called with `POST https://api.dify.ai/v1/workflows/run`,
  sending `inputs.query`. Read the answer in `data.outputs.text`. If the request is out of scope,
  `data.outputs.message_erreur` is set instead: show it to the student as is.

## Data budget rules
- First load of a page: target under 150 KB gzipped (HTML + JS + CSS + fonts).
- No images and no video. Use text, CSS and, if needed, tiny inline SVG.
- System fonts by default. At most one subset web font, and only if the brand requires it.
- A correction message stays under 100 KB. Truncate or refuse above that.
- No polling, no background sync, no auto-play. Fetch only on user action.
- Lazy-load anything not needed for the first screen. Cache the catalogue.
- Check `npm run build` output size before finishing any change that adds a dependency.

## Workflow
1. Plan: state the small step and what to observe when it works.
2. Implement: smallest change that works.
3. Test: run `npm test`, `npm run build`, and check in the emulators when Functions are touched.
4. Update `docs/decisions.md` when a decision was made, then update this file if a rule changed.
- Before any large or risky change, ask the user to commit or branch first.
- Config secrets go in git-ignored `.env*` files or Functions secrets, never in code.

## Never
- Never commit `.env*` or `functions/.secret.local`.
- Never call Dify from the client. Never expose `DIFY_API_KEY` in the bundle, logs or responses.
- Never invent exercises, reference answers, users or figures. Use real data or a clearly
  marked placeholder.
- Never change an exercise ID without updating the knowledge base in the same change.
- Never touch Firebase rules (Firestore, Storage, Hosting headers for access) without asking.
  Never leave test-mode rules.
