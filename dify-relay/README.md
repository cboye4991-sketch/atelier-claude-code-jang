# dify-relay — le relais entre la page Jàng et Dify

Un petit programme (Cloudflare Worker) qui reçoit le texte de l'élève depuis la page publique,
appelle Dify avec la clé secrète, puis renvoie la correction. **La clé reste chez Cloudflare :
elle n'apparaît jamais dans la page, ni dans GitHub.**

```
Navigateur (GitHub Pages)  ──POST /corriger──▶  Worker Cloudflare  ──clé──▶  Dify (workflow "jang")
```

## Ce que fait le relais

| Élément | Valeur |
|---|---|
| Route | `POST /corriger` avec `{"query": "JNG-PC-01 : ..."}` |
| Texte accepté | 3 à 1000 caractères (espaces au début/fin retirés) |
| Réponses | `{"type":"correction","text":"…"}` (200), `{"type":"refus","text":"…"}` (422), `{"type":"erreur","text":"…"}` (400, 403, 404, 405, 413, 429, 500, 502, 504) |
| Délai max vers Dify | 60 secondes (puis erreur 504) |
| CORS | seulement les origines de `ALLOWED_ORIGINS` dans `wrangler.toml` |
| Secret | `DIFY_API_KEY` (jamais dans un fichier du dépôt) |

## Avant de commencer

1. Un compte gratuit Cloudflare : <https://dash.cloudflare.com/sign-up> (pas de carte bancaire nécessaire).
2. **Node.js version LTS** : télécharge-le sur <https://nodejs.org> et installe-le (bouton « LTS »).
3. Ta clé d'application Dify (elle commence par `app-`). Garde-la dans ton gestionnaire de mots de passe.
   Ne la colle **jamais** dans un fichier du projet, dans un message ou dans GitHub.

Ouvre un terminal :
- **macOS** : application « Terminal » (Cmd + Espace, tape « Terminal »).
- **Windows** : « PowerShell » (touche Windows, tape « PowerShell »).

Vérifie que Node est installé (un numéro de version doit s'afficher, par exemple `v22.x.x`) :

```bash
node -v
npm -v
```

## Déployer, pas à pas

Les commandes sont les mêmes sur macOS et Windows, sauf mention contraire.

**1. Va dans le dossier du relais** (adapte le chemin à l'endroit où tu as cloné le dépôt) :

```bash
cd atelier-claude-code-jang/dify-relay
```

**2. Installe les outils** (télécharge `wrangler`, l'outil de Cloudflare, dans `node_modules/`) :

```bash
npm install
```

**3. Connecte-toi à Cloudflare** (un onglet de navigateur s'ouvre, clique sur « Allow ») :

```bash
npx wrangler login
```

**4. Enregistre la clé secrète.** La commande te demande de la coller ; elle ne s'affiche pas
quand tu la colles, c'est normal. Appuie sur Entrée.

```bash
npx wrangler secret put DIFY_API_KEY
```

Wrangler peut proposer de créer le Worker s'il n'existe pas encore : réponds `y`.

**5. Publie le relais :**

```bash
npx wrangler deploy
```

À la fin, Wrangler affiche l'adresse du relais, du type
`https://jang-relay.<ton-sous-domaine>.workers.dev`. Copie-la.

**6. Teste le relais.**

macOS (Terminal) :

```bash
curl -i -X POST "https://jang-relay.<ton-sous-domaine>.workers.dev/corriger" \
  -H "Content-Type: application/json" \
  -d '{"query":"JNG-PC-01 : C = 0,05/500 = 0,0001 mol/L"}'
```

Windows (PowerShell) :

```powershell
Invoke-RestMethod -Method Post -Uri "https://jang-relay.<ton-sous-domaine>.workers.dev/corriger" `
  -ContentType "application/json" `
  -Body (@{ query = "JNG-PC-01 : C = 0,05/500 = 0,0001 mol/L" } | ConvertTo-Json)
```

Tu dois voir `"type": "correction"` avec le texte de la correction (attends jusqu'à 40 secondes).

**7. Branche la page.** Ouvre `03-landing/v2-skill/index.html`, et en haut du `<script>` remplace :

```js
const RELAIS_URL = "";
```

par l'adresse complète **avec `/corriger`** :

```js
const RELAIS_URL = "https://jang-relay.<ton-sous-domaine>.workers.dev/corriger";
```

Puis fais un commit et un push : GitHub Pages met la page à jour.

## Tester en local (facultatif)

1. Dans `dify-relay/`, crée un fichier `.dev.vars` (il est ignoré par git) contenant une seule ligne :

   ```
   DIFY_API_KEY=app-ta-cle-ici
   ```

2. Lance le relais local : `npx wrangler dev` (il écoute sur `http://localhost:8787`).
3. Dans un **autre** terminal, sers la page depuis son dossier :
   - macOS : `cd 03-landing/v2-skill && python3 -m http.server 8000`
   - Windows : `cd 03-landing\v2-skill; py -m http.server 8000`
4. Mets temporairement `const RELAIS_URL = "http://localhost:8787/corriger";`, puis ouvre
   <http://localhost:8000>. Remets la vraie adresse avant de faire un commit.

## Réglages

- **Changer les sites autorisés** : modifie `ALLOWED_ORIGINS` dans `wrangler.toml` (une origine = `https://` + domaine,
  sans chemin ni `/` final), puis `npx wrangler deploy`.
- **Changer la clé** (rotation ou fuite) : régénère-la dans Dify, puis relance `npx wrangler secret put DIFY_API_KEY`.
- **Voir les logs** : `npx wrangler tail`. Le relais n'y écrit jamais la clé ni le texte des élèves.

## Limitation de débit

Le relais limite chaque visiteur (identifié par son adresse IP, `CF-Connecting-IP`) à **5 demandes par 60 secondes**.
Au-delà, il répond `429` avec `{"type":"erreur","text":"Trop de demandes en ce moment — réessaie dans une minute"}`.
La limite est définie par le binding `RATE_LIMITER` (section `[[ratelimits]]` de `wrangler.toml`). En local
(`npx wrangler dev` sans ce binding), la vérification est ignorée.

- **Changer la limite** : modifie `simple = { limit = 5, period = 60 }` dans `wrangler.toml`
  (`period` ne peut valoir que `10` ou `60` secondes), puis redéploie avec `npx wrangler deploy`.

## Si ça ne marche pas

| Symptôme | Cause probable |
|---|---|
| `403 Origine non autorisée` | L'adresse de la page n'est pas dans `ALLOWED_ORIGINS` (vérifie `https`, le port, pas de `/` final). |
| `502 Jàng est indisponible` (alors que Dify fonctionne) | Le secret manque peut-être : refais l'étape 4 puis l'étape 5 (`npx wrangler tail` montre `DIFY_API_KEY is not configured`). |
| `502` | Dify a refusé ou est en panne : vérifie la clé et que le workflow est publié. |
| `504` | Dify a mis plus de 60 s : réessaie. |
| Erreur CORS dans la console du navigateur | Même cause que le 403, ou `RELAIS_URL` sans `/corriger`. |
| `npx : commande introuvable` | Node.js n'est pas installé, ou ferme et rouvre le terminal après l'installation. |
| Windows : « l'exécution de scripts est désactivée » | Utilise `cmd` à la place de PowerShell, ou lance `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |

## Limites à connaître

Le contrôle d'origine (CORS) empêche d'autres **sites** d'utiliser ton relais depuis un navigateur.
Il n'empêche pas quelqu'un d'appeler l'adresse avec `curl`. Pour limiter les abus, ajoute une règle
de limitation de débit dans le tableau de bord Cloudflare (Security → WAF → Rate limiting rules),
et surveille le quota de ton application Dify. Voir `docs/decisions.md`.
