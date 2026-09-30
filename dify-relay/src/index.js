// Jàng relay: a Cloudflare Worker that sits between the public landing page
// and the Dify "jang" workflow, so the Dify API key never reaches the browser.
//
//   POST /corriger  {"query": "JNG-PC-01 : ..."}
//   -> {"type":"correction"|"refus"|"erreur","text":"..."}
//
// Secret (never in git):  DIFY_API_KEY   -> npx wrangler secret put DIFY_API_KEY
// Plain vars:             DIFY_API_URL, ALLOWED_ORIGINS (comma-separated)

const DEFAULT_API_URL = "https://api.dify.ai/v1";
const DEFAULT_ORIGINS =
  "https://cboye4991-sketch.github.io,http://localhost:8000,http://127.0.0.1:8000";

const ROUTE = "/corriger";
const MIN_QUERY = 3;
const MAX_QUERY = 1000;
const MAX_BODY_BYTES = 8192;
const DIFY_TIMEOUT_MS = 60000;

const REFUS_TEXT =
  "Je ne peux pas corriger ce message. Envoie l'ID d'un exercice de la liste suivi de ta réponse.";
const UNAVAILABLE_TEXT =
  "Jàng est indisponible pour le moment — réessaie dans une minute";

function parseOrigins(value) {
  return (value || DEFAULT_ORIGINS)
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function reply(status, body, extraHeaders) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  };
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

const erreur = (text) => ({ type: "erreur", text });

async function callDify(env, query) {
  const base = (env.DIFY_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIFY_TIMEOUT_MS);
  try {
    const res = await fetch(base + "/workflows/run", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.DIFY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { query },
        response_mode: "blocking",
        user: "jang-web-" + crypto.randomUUID(),
      }),
      signal: controller.signal,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (_) {
      json = null;
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function handleCorriger(request, env, cors) {
  if (!env.DIFY_API_KEY) {
    console.error("DIFY_API_KEY is not configured");
    return reply(500, erreur("Le service n'est pas configuré."), cors);
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return reply(413, erreur("Message trop long."), cors);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply(413, erreur("Message trop long."), cors);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return reply(400, erreur("Requête invalide : JSON attendu."), cors);
  }
  const query =
    payload && typeof payload.query === "string" ? payload.query.trim() : "";
  if (query.length < MIN_QUERY) {
    return reply(
      400,
      erreur("Écris au moins " + MIN_QUERY + " caractères."),
      cors
    );
  }
  if (query.length > MAX_QUERY) {
    return reply(
      400,
      erreur("Message trop long : " + MAX_QUERY + " caractères maximum."),
      cors
    );
  }

  let result;
  try {
    result = await callDify(env, query);
  } catch (err) {
    if (err && err.name === "AbortError") {
      console.error("Dify call timed out");
      return reply(
        504,
        erreur("La réponse prend trop de temps — réessaie"),
        cors
      );
    }
    console.error("Dify call failed:", err && err.name);
    return reply(502, erreur(UNAVAILABLE_TEXT), cors);
  }

  const { status, json } = result;
  if (status === 429) {
    return reply(
      429,
      erreur("Trop de demandes en ce moment — réessaie dans une minute"),
      cors
    );
  }
  if (status < 200 || status >= 300 || !json) {
    console.error("Dify returned HTTP", status);
    return reply(502, erreur(UNAVAILABLE_TEXT), cors);
  }

  const data = json.data || {};
  if (data.status && data.status !== "succeeded") {
    console.error("Dify workflow status:", data.status);
    return reply(502, erreur(UNAVAILABLE_TEXT), cors);
  }
  const outputs = data.outputs || {};
  if (typeof outputs.text === "string" && outputs.text.trim()) {
    return reply(200, { type: "correction", text: outputs.text }, cors);
  }
  if (outputs.message_erreur) {
    // Out of scope. The Dify message may contain internal words: never forward it.
    return reply(422, { type: "refus", text: REFUS_TEXT }, cors);
  }
  console.error("Dify returned no usable output");
  return reply(502, erreur(UNAVAILABLE_TEXT), cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.replace(/\/+$/, "") !== ROUTE) {
      return reply(404, erreur("Introuvable."));
    }
    if (request.method !== "POST" && request.method !== "OPTIONS") {
      return reply(405, erreur("Méthode non autorisée."), {
        Allow: "POST, OPTIONS",
      });
    }

    // Browsers always send Origin on cross-origin calls. A present but unlisted
    // Origin is refused without any CORS header. No Origin (curl, tests) passes:
    // this is CORS, not authentication.
    const origin = request.headers.get("Origin");
    let cors = {};
    if (origin !== null) {
      if (!parseOrigins(env.ALLOWED_ORIGINS).includes(origin)) {
        return reply(403, erreur("Origine non autorisée."));
      }
      cors = {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
      };
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return handleCorriger(request, env, cors);
  },
};
