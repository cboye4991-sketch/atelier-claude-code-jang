# CLAUDE.md — Jàng landing (v2-skill)

## Purpose
One-page landing for **Jàng**, a WhatsApp corrector for physics-chemistry (Bac S2, Sénégal).
It explains the first mistake in a student's answer from a reference corrigé, then sends a similar exercise.
This is `v2-skill` of the `03-landing` experiment (v1 = no skill, v2 = built with frontend-design).
Do not touch sibling directories.

## File layout
- `index.html` is the whole project: one `<style>`, the markup, and one IIFE `<script>`.
- Sections in order: `header.hero`, `#quiz`, `#fonctions`, `#exercices`, `#contact`, `footer`.
- Script: `EX` array (exercises), `CHAPTERS` (quiz step 2), `STRUGGLES` (tips), quiz state machine, form `rules`.
- No build, no dependencies, no backend.

## Design rules
- Theme: French "Seyès" school notebook. Reuse the `:root` tokens, never hard-code new hex values:
  `--paper`, `--seyes` (ruled lines), `--ink` (ballpoint blue), `--text`, `--muted`,
  `--red` (teacher's pen), `--hi` (highlighter), `--cover`, `--wa-dark/--wa-bg/--wa-out` (WhatsApp).
- Fonts: `--display` = Bricolage Grotesque (UI, headings); `--hand` = Kalam (student handwriting, corrections).
- Spacing: `--u: 24px` is one ruled line. Vertical rhythm is a multiple of `--u` (`.copie` uses 48px line-height).
- Breakpoints: mobile first, then `min-width:600px` and `900px`. Keep the `prefers-reduced-motion` block.
- Accessibility is deliberate: `aria-live` on `#quizbox`, `aria-labelledby` on sections, `aria-invalid` + `#e-<field>` on form errors.

## Content rules
- All copy in French, informal "tu".
- **No invented users, schools, testimonials, or figures** (no "1 200 élèves", no ratings, no logos).
- The 6 exercise IDs must stay identical to the Dify knowledge base:
  `JNG-PC-01`, `JNG-PC-03`, `JNG-PC-07`, `JNG-PC-10`, `JNG-PC-12`, `JNG-MA-01`.
  Never rename, renumber, or add one here without the matching entry in Dify.
- `JNG-MA-01` is `ok:false` ("En préparation"): it stays out of `CHAPTERS`, so the quiz never recommends it.
- The volunteer form is not connected to anything. Its success message must keep saying nothing was sent.

## Preview
Open `index.html` in a browser, or run `python3 -m http.server` in this folder.
Fonts come from Google Fonts; offline falls back to system fonts.
Manual check: quiz through all 4 steps, form with valid and invalid input, phone width and ≥900px.

## Do
- Change an exercise in `EX`, then check `CHAPTERS` and the quiz result still line up.
- Build DOM with the `el()` / `icon()` helpers and `textContent`.
- Keep the ES5 style (`var`, no modules, no framework).
- Keep the Senegalese phone regex `^(\+221|00221)?[37]\d{8}$` unless asked.

## Don't
- Don't use `innerHTML`.
- Don't add external scripts, CSS frameworks, or analytics.
- Don't invent social proof, statistics, or pricing.
- Don't add a fake "envoyé" confirmation to the form.
- Don't break the ruled-line grid with off-grid heights.
