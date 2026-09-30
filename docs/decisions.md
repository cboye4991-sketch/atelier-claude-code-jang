# Decisions

## 1. The landing page talks to Dify through a relay

**Context.** The Jàng landing page (`03-landing/v2-skill/index.html`) is published on GitHub Pages:
public, static, no server. The correction engine is a Dify workflow whose API needs a secret key
(`Authorization: Bearer app-…`).

**Problem.** Anything shipped to a browser is readable by anyone: HTML, JavaScript, network tab.
A key placed in the page (even obfuscated or split) is a leaked key. It would also live forever in
the git history, and anyone could spend the Dify and Gemini quota, or use the workflow for other purposes.

**Decision.** The page never calls Dify. It calls a small relay (`dify-relay/`) that holds the key as a
server-side secret, validates the input, calls Dify and returns only what the page needs
(`correction`, `refus` or `erreur`).

**What the relay gives us.**
- The key exists only in the hosting platform's secret store, never in git or in the page.
- Input validation (3–1000 characters, JSON only, small body) before spending any Dify quota.
- CORS restricted to our own origins (`ALLOWED_ORIGINS`).
- Dify internals (raw errors, the out-of-scope word INSUFFISANT) never reach students: the relay
  returns fixed, friendly French messages.
- One place to add rate limiting, logging or a change of engine later, without touching the page.

**What it does not give us.** CORS only stops other *websites* from using the relay from a browser.
A script can still call the URL directly. So the relay is a quota-protection layer, not authentication.
Mitigations: a rate-limiting rule on the Worker route, quota and spend limits on the Dify/Gemini side,
and key rotation if abuse is seen (`npx wrangler secret put DIFY_API_KEY`).

**Rejected.** Key in the page with a "domain restriction": Dify keys have none, and headers can be forged.
Making the repo private: GitHub Pages on a free plan needs a public repo, and the key would still be
in the browser at runtime.

## 2. The relay runs on Cloudflare Workers

**Needs.** Free or near-free for a student project; no server to maintain; secrets stored properly;
must tolerate a slow upstream, because Gemini's free tier answers in 4 to 40 seconds.

**Why Cloudflare Workers.**
- A generous free tier and no credit card needed to start (check the current limits on Cloudflare's pricing page).
- Waiting for the Dify response is network wait, not CPU time, so a 40 s answer is fine. The relay
  enforces its own 60 s limit with `AbortController`.
- Native secrets (`wrangler secret put`), separate from plain variables in `wrangler.toml`.
- No cold-start server, deploys with one command, and the code is a single file with no dependency.
- Works the same on macOS and Windows with only Node.js and `npx wrangler`.

**Alternatives considered.**
- *Firebase Cloud Functions*: fine technically, but calling external APIs requires the paid Blaze plan
  (billing card on file), which we want to avoid for a class project.
- *Vercel / Netlify functions*: workable, but default function time limits on free plans are short
  relative to a 40 s Gemini answer, and it would add a second hosting account.
- *Own VPS / Node server*: needs patching, uptime and TLS work that is out of scope.

**Consequences.** One more account (Cloudflare) and one more deploy step, documented in
`dify-relay/README.md`. If Cloudflare stops being a good fit, only `dify-relay/` and the single
`RELAIS_URL` constant in the page change; the `{type, text}` contract stays the same.

## 3. Page behaviour when the relay is not configured

`RELAIS_URL` is an empty string by default. In that case the chat shows « Correction en ligne bientôt
disponible » and the send button is disabled, so the published page is safe and honest before the relay
is deployed, and no request is ever sent.
