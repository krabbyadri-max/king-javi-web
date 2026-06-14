// ============================================================================
// Vercel Edge Function — proxy de chat IA para King Javi   (FALLBACK / opción B)
// ----------------------------------------------------------------------------
// Alternativa al Worker de Cloudflare por si se prefiere Vercel. Hace
// exactamente lo mismo: añade el system prompt, llama a Claude con streaming
// y reenvía el stream SSE al navegador. Solo se usa UNA de las dos opciones,
// no las dos a la vez.
//
// Si la web se sirviera desde el MISMO dominio de Vercel, el cliente podría
// llamar a "/api/chat" (mismo origen, sin CORS). Como la web está en GitHub
// Pages, igualmente devolvemos cabeceras CORS para permitir el origen de Pages.
//
// Runtime "edge" → soporta streaming nativo y arranca rápido.
// Deploy y secrets (ANTHROPIC_API_KEY, ALLOWED_ORIGIN): ver api/README.md.
// ============================================================================

import { SYSTEM_PROMPT } from "./system-prompt.js";

export const config = { runtime: "edge" };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MSG = 2000;

export default async function handler(request) {
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin, process.env.ALLOWED_ORIGIN || "*");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "Servidor mal configurado (falta API key)." }, 500, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido." }, 400, cors);
  }
  const messages = sanitizeMessages(body && body.messages);
  if (!messages) {
    return json({ error: "Formato de mensajes inválido." }, 400, cors);
  }

  // Nota: Vercel Edge no trae KV de serie. Si quieres rate limiting aquí,
  // usa Vercel KV / Upstash Redis (ver api/README.md). El cliente ya limita
  // a 10 mensajes por sesión, que cubre el caso normal.

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        stream: true,
        messages,
      }),
    });
  } catch {
    return json({ error: "No se pudo conectar con el asistente." }, 502, cors);
  }

  if (!upstream.ok || !upstream.body) {
    return json({ error: "El asistente no está disponible ahora mismo." }, 502, cors);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...cors,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers (idénticos al Worker para mantener el mismo comportamiento)
// ---------------------------------------------------------------------------

function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const trimmed = messages.slice(-MAX_MESSAGES);
  const clean = [];
  for (const m of trimmed) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content !== "string") return null;
    const content = m.content.slice(0, MAX_CHARS_PER_MSG).trim();
    if (!content) continue;
    clean.push({ role: m.role, content });
  }
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") return null;
  return clean;
}

function corsHeaders(origin, allowed) {
  let allowOrigin = "*";
  if (allowed !== "*") {
    const list = allowed.split(",").map((s) => s.trim());
    allowOrigin = list.includes(origin) ? origin : list[0];
  }
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });
}
