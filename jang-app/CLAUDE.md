# Jàng web

## What this is
- Web MVP of Jàng: a corrector for Senegalese Bac physics-chemistry exercises (Terminale S2).
- Users: students in regional high schools who revise alone, without a teacher, on entry-level
  Android phones with a small daily data bundle.
- Live at https://cboye4991-sketch.github.io/jang-bac-helper/ (repo `cboye4991-sketch/jang-bac-helper`).
- Five pages:
  - **Accueil**: presentation of Jàng and an animated phone demo (`HeroPhoneDemo`, kept isolated
    from the real chat).
  - **Exercices**: catalogue of exercises (IDs `JNG-PC-xx`), filters by subject, and a WhatsApp-style
    "Corrige mon exercice" chat with hints (3 levels), a 15-min mock exam, dictation, read-aloud,
    "Vérifie mon similaire" and a WhatsApp challenge link.
  - **Historique**: the student's past corrections, stored only in the browser (`localStorage`).
  - **Conseils**: revision tips.
  - **Contact**: the volunteer teachers.
- The correction is produced by an existing Dify workflow, never by this repo.
- Phase 2 will add a real WhatsApp channel. Do not build it until asked.

## Stack & versions
- React 19 + TanStack Start/Router + Tailwind CSS 4 + Vite, TypeScript. Generated with Lovable (S4),
  then continued in VS Code and Claude Code.
- Hosting: **GitHub Pages**, static build (`GITHUB_PAGES=1`, routes prerendered), deployed by
  `.github/workflows/pages.yml` on every push to `main`.
- Correction endpoint: the **Supabase Edge Function `corriger`** (`deploy/supabase-corriger/index.ts`).
  It holds `DIFY_API_KEY` as a Supabase secret, checks the origin, calls Dify and returns
  `{kind: "ok", text}`, `{kind: "refus", message}` or `{kind: "erreur", detail}`.
  The site reaches it through `VITE_CORRIGER_URL` (a public URL, set as a GitHub Actions variable).
- Alternative deployment kept in `deploy/README.md`: the whole app on Cloudflare Workers
  (`deployer_jang.command`, secret `DIFY_API_KEY` in Cloudflare). Vercel and Netlify are not allowed
  for this course.
- No database: the history stays in the student's browser.
- Node 22 LTS. The source of truth for exact versions is `package.json`.
  Update this section whenever a major dependency changes.
- Visual identity: use the `/jang-brand` skill ("le cahier corrigé"). Do not invent colors or fonts.

## Commands
Run from the repo root unless noted. If a script does not exist yet, create it and document it here.
- `npm install`: install (use npm, not bun: Lovable's `bun.lock` points to a private registry).
- `npm run dev`: Vite dev server (reads `DIFY_API_KEY` from git-ignored `.env.local`).
- `GITHUB_PAGES=1 VITE_CORRIGER_URL=<url> npm run build`: static build into `dist/client/`,
  the same build as GitHub Pages.
- `npm run lint`: ESLint. There is no test suite yet: test by hand with T1–T15
  (`07-s5plus/tests-t1-t6.md` and `dify/tests-rag.md` in the `jang` repo).
- Deploy = push to `main` (GitHub Pages). Redeploy the Supabase function only when
  `deploy/supabase-corriger/index.ts` changes (`supabase functions deploy corriger`). Only when the user asks.

## Folder structure (target)
```
src/
  routes/       index (Accueil), exercices, historique, conseils, contact, __root (layout, menu)
  components/   ChatJang (real chat), HeroPhoneDemo (scripted demo), Illustrations (inline SVG)
  lib/          corriger-client (Supabase call), corriger.functions (Lovable server function),
                exercices-bac (catalogue, mirrors the knowledge base), historique, dictee, voix, defi
  styles.css    tokens and global CSS
deploy/
  supabase-corriger/index.ts   Edge Function that proxies the Dify workflow
  README.md                    deployment guide (GitHub Pages + Supabase, or Cloudflare)
docs/captures/  screenshots used in the README
.github/workflows/pages.yml    GitHub Pages build and deploy
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
3. Test: run `npm run build`, open the pages at 360 px, and run T1 (JNG-PC-01) on the live site
   when the chat or the Supabase function is touched.
4. Update `docs/decisions.md` when a decision was made, then update this file if a rule changed.
- Before any large or risky change, ask the user to commit or branch first.
- Config secrets go in git-ignored `.env.local` or in Supabase/Cloudflare secrets, never in code.

## Never
- Never commit `.env.local` or any file holding `DIFY_API_KEY`. (`.env` only holds Supabase publishable keys.)
- Never commit `src/routeTree.gen.ts` changes made by a local build.
- Never call Dify from the client. Never expose `DIFY_API_KEY` in the bundle, logs or responses.
- Never invent exercises, reference answers, users or figures. Use real data or a clearly
  marked placeholder.
- Never change an exercise ID without updating the knowledge base in the same change.
- Never change the allowed origins of the Supabase function or its secrets without asking.
