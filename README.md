# claude-lab — Atelier Claude Code (E00 à E14), version Jàng

Travail réalisé du 29/09 au 05/10/2026 avec le vrai Claude Code (2.1.285), en mode non interactif (`claude -p`), prompt par prompt, dans l'ordre de l'atelier. Sujet : **Jàng** à la place d'ATA suarl ; projet fil rouge : **l'app web Jàng** à la place de PromptLens.

## Contenu

| Dossier | Épisode | Livrables |
|---|---|---|
| `00-installation/` | E00 | `sortie-verifications.txt` (versions, doctor) · `verif-windows.ps1` à lancer sur ton PC |
| `01-hello/` (git) | E01, E02 | `jang-card.html` : carte + thème clair/sombre + bouton WhatsApp (3 commits) |
| `03-landing/` (git) | E03, E04 | `v1-no-skill/index.html`, `v2-skill/index.html` (frontend-design), `v2-skill/CLAUDE.md` (49 lignes), `.claude/settings.local.json` (plugin local) |
| `04-memoire-utilisateur/` | E04 | `CLAUDE.md` = ta mémoire utilisateur |
| `05-brand/` (git) | E05 | skill `jang-brand`, `email-suivi-professeur.html`, `post-linkedin.md`, `flyer-appel-professeurs.html`, `hero.jpg` (capture réelle du MVP) |
| `06-plugins/` (git) | E06 | `sources/`, `competitive-analysis.md`, `marketing-plan.html` |
| `jang-app/` | E07, E08, E09 | `CLAUDE.md` du projet fil rouge, protections des clés (`.gitignore`, `.env.example`, règles `deny`), app React/TypeScript : catalogue des 14 exercices, correction en direct via le relais Dify (phase 2), carnet de progression, export JSON |
| `app/` | E08 | version compilée de l'app, publiée sur GitHub Pages |
| `11-agent/` | E11 | skill externe `claude-api` (anthropics/skills), environnement Python, notebook agent avec/sans mémoire (à lancer avec ta clé API dans `.env`) |
| `.claude/agents/` · `docs/audit-securite-e14.md` | E14 | sous-agent relecteur sécurité (lecture seule) et son rapport ; correctifs appliqués (limitation de débit du relais, règles deny, .gitignore) |
| (hors dépôt) `personal-os/` | E12, E13 | agent personnel (SOUL.md, vault, /ingest, /lint, /morning-brief) — données personnelles, livré à part, **jamais sur un dépôt public** |
| `dify-relay/` | E09 | relais Cloudflare entre la landing et Dify |
| `_prompts/` | tous | les prompts exacts envoyés à Claude Code |
| `_journal/` | tous | transcriptions de chaque session Claude Code, tests, sorties git |
| `_captures/` | tous | captures d'écran des résultats |

## Installer sur ton PC Windows (PowerShell)

```powershell
# 1. Décompresse l'archive dans ton dossier personnel -> C:\Users\<toi>\claude-lab
# 2. Mémoire utilisateur (E04)
New-Item -ItemType Directory -Force "$HOME\.claude" | Out-Null
Copy-Item "$HOME\claude-lab\04-memoire-utilisateur\CLAUDE.md" "$HOME\.claude\CLAUDE.md"
# 3. Skill /jang-brand (E05)
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse "$HOME\claude-lab\05-brand\_a-copier-dans-.claude\skills\jang-brand" "$HOME\.claude\skills\"
# 4. Plugins locaux (E03, E06) : ils se réinstallent depuis chaque dossier
claude plugin marketplace add anthropics/claude-plugins-official
cd "$HOME\claude-lab\03-landing"; claude plugin install frontend-design@claude-plugins-official --scope local
# 5. Vérifications liées à TON compte (E00)
cd "$HOME\claude-lab\00-installation"; .\verif-windows.ps1
```

Si tu as déjà un `$HOME\.claude\CLAUDE.md`, n'écrase pas : ouvre-le et colle le contenu à la fin.

## Ce qui reste à faire par toi

- **E00 / E01** : `/status` et `/usage` dans Claude Code sur ton PC (ils montrent TON compte) → captures.
- **E06** : le réseau de mon espace bloquait les sites concurrents, donc pas de captures Playwright. Pour les ajouter, relance `_prompts/e06a.txt` dans `06-plugins` sur ton PC après `claude plugin install playwright@claude-plugins-official --scope local`.

## Écarts par rapport à l'atelier (et pourquoi)

- Sessions non interactives : Maj+Tab, Échap Échap et les menus 1/2/3 n'existent pas en `-p`. Équivalents utilisés : `--permission-mode plan` puis `acceptEdits`, et `git restore` pour le retour arrière (vérifié par `git status`).
- `/init` est désactivé dans mon environnement : j'ai envoyé la même consigne en prompt.
- E05 : l'identité a été fournie d'un bloc (palette et polices de votre maquette v2 « cahier corrigé ») au lieu des questions-réponses. Tagline, formules de clôture et mots à éviter sont des propositions : à valider avec Adama.
- Les défis optionnels faits : E01 (bouton WhatsApp), E02 (accept edits), E04 (français partout). Non faits : E03 et E05/E06 (facultatifs).
