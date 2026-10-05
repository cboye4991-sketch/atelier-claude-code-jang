# .claude/ralph-brief.md — Jàng web polish
Each round:
1. Review the current UI with the frontend-design skill (and the /jang-brand identity in CLAUDE.md: "le cahier corrigé", red only for correction marks): layout, typography, spacing, states, mobile 360 px.
2. List issues, rank them by impact/effort for Aminata (Terminale S2, cheap Android, little data), fix the top 3.
3. Run `npm run build` and `npm test`; fix any error. `npm run check:answers` must still pass.
4. Append a dated entry to docs/decisions.md ("Ralph round n: what changed").

Quality bar: looks like a real product, not a demo. Clear hierarchy, consistent spacing, works at 360 px and on desktop, loading / empty / error states everywhere (search with no result, empty notebook, relay error).
Add if missing: header with the app name and today's date; overall progress visible from the Exercices tab; filter by notebook status (À faire / À revoir / Réussi); fonts declared with fallbacks.

Output <promise>POLISHED</promise> only when every point of the quality bar is genuinely met and the build passes.
Never touch src/data/exercises.ts content, scripts/check-no-answers.mjs, .env*, .claude/settings.json or the relay contract (src/lib/correction-client.ts behaviour). Never add a reference answer to the repo. No new runtime dependency.
