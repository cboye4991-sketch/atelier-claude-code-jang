# ~/.claude/CLAUDE.md — user memory (applies to every project)
- Talk to me in French. Code, comments, commit messages and docs in English, unless the project's own CLAUDE.md says otherwise.
- Before any large or risky change, tell me to commit or branch first.
- Never put secrets, API keys (Dify app-…, Gemini, Firebase service accounts) in client code or in git. Use .env files that are git-ignored and server-side functions.
- When data access or security rules change (Firebase, Supabase, Spring Security), review them with me. Never leave test-mode rules.
- Work in small verifiable steps; after each step, tell me what I should observe.
- If you are unsure a Claude Code feature exists, say so and point to https://code.claude.com/docs.
