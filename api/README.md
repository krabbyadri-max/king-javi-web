# Chat IA de King Javi — backend (proxy a Claude)

La web es **estática** (GitHub Pages) y no puede ejecutar código de servidor, así
que la API key de Anthropic **nunca** puede ir en el cliente. Este directorio
contiene un pequeño proxy que vive fuera de Pages: recibe los mensajes del chat,
les añade el system prompt de Javi, llama a Claude **con streaming** y reenvía la
respuesta al navegador token a token.

```
Navegador (js/main.js)  ──POST {messages}──►  Worker/Función  ──►  API de Claude
        ▲                                          │ (aquí vive la API key)
        └───────────  stream SSE de texto  ◄────────┘
```

## Archivos

| Archivo | Qué es |
|---|---|
| `system-prompt.js` | **Fuente única** del system prompt (personalidad + datos de Javi). Lo importan los dos backends. Edita los precios/datos solo aquí. |
| `chat-worker.js` | **Opción A (principal):** Cloudflare Worker. |
| `wrangler.toml` | Config del Worker de Cloudflare. |
| `chat.js` | **Opción B (fallback):** función Edge de Vercel. Misma lógica. |

> Solo se despliega **una** de las dos opciones. Recomendado: **Cloudflare Workers**
> (gratis hasta 100k req/día, deploy de un comando, streaming nativo).

---

## Modelo y coste

- **Modelo:** `claude-haiku-4-5` (rápido y barato, perfecto para un FAQ-bot).
- **Precio real (jun-2026):** **$1 / millón de tokens de entrada**, **$5 / millón de
  salida**. (El brief mencionaba $0.25/$1.25; eso era de un Haiku anterior — el
  vigente es Haiku 4.5.)
- Con `max_tokens: 1024`, system prompt ~900 tokens y el límite de 10 mensajes por
  sesión, cada conversación cuesta **fracciones de céntimo**. Con tráfico de hobby
  (unas cientos de conversaciones al mes) el coste es **prácticamente $0**, muy por
  debajo de $1/mes. El system prompt se reenvía en cada turno, así que el grueso del
  gasto es input de Haiku ($1/M) — sigue siendo calderilla.

---

## Opción A — Cloudflare Workers (recomendada)

Requisitos: cuenta en Cloudflare y `npx wrangler` (no hace falta instalar nada
global).

```bash
cd api

# 1) Login (abre el navegador)
npx wrangler login

# 2) Guardar la API key como secret (NO va en wrangler.toml ni en git)
npx wrangler secret put ANTHROPIC_API_KEY
#    → pega la key cuando lo pida

# 3) Desplegar
npx wrangler deploy
#    → te da la URL pública, p.ej. https://kingjavi-chat.<subdominio>.workers.dev
```

### Ajustes en `wrangler.toml`
- `ALLOWED_ORIGIN`: el origen de la web para CORS. Por defecto
  `https://krabbyadri-max.github.io`. Si se compra dominio propio, añádelo
  (separa varios con comas).

### Rate limiting por IP (opcional pero recomendado)
El cliente ya limita a 10 mensajes/sesión, pero eso se salta recargando. Para un
tope duro por IP/día, crea un KV namespace:

```bash
npx wrangler kv namespace create RATE_LIMIT
#    → copia el "id" que devuelve
```

Descomenta el bloque `[[kv_namespaces]]` en `wrangler.toml`, pega el `id`, y
vuelve a `npx wrangler deploy`. El tope es `RATE_LIMIT_PER_DAY = 50` en
`chat-worker.js`.

---

## Opción B — Vercel (fallback)

Coloca `chat.js` y `system-prompt.js` bajo una carpeta `api/` del proyecto Vercel
(la ruta queda como `/api/chat`).

```bash
# En el dashboard de Vercel → Settings → Environment Variables:
ANTHROPIC_API_KEY = sk-ant-...
ALLOWED_ORIGIN    = https://krabbyadri-max.github.io

# Deploy
npx vercel --prod
```

Para rate limiting en Vercel hace falta Vercel KV / Upstash Redis (no incluido).
El límite de 10 mensajes/sesión del cliente cubre el caso normal.

---

## Conectar la web al backend

En **`js/main.js`** hay una constante:

```js
const CHAT_ENDPOINT = 'https://kingjavi-chat.EXAMPLE.workers.dev';
```

Cámbiala por la URL real del deploy:
- Cloudflare: `https://kingjavi-chat.<subdominio>.workers.dev`
- Vercel: `https://<proyecto>.vercel.app/api/chat`

Commit + push y GitHub Pages servirá la web ya conectada.

---

## Privacidad

No se guarda ningún historial de conversaciones (es la web de Javi; los visitantes
no quieren logs). El proxy valida y reenvía; no escribe a disco ni a base de datos.
El KV de rate limiting solo almacena un contador por IP/día, sin contenido de los
mensajes, y se autoborra a las 48h.

---

## Probar en local (opcional)

```bash
cd api
npx wrangler dev        # levanta el Worker en http://localhost:8787
# Asegúrate de tener la key: export ANTHROPIC_API_KEY=sk-ant-...
#   (o usa: npx wrangler secret put ... y wrangler dev --remote)
```

Apunta temporalmente `CHAT_ENDPOINT` a `http://localhost:8787` para probar el chat
contra el Worker local.
