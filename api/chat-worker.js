// ============================================================================
// Cloudflare Worker — proxy de chat IA para King Javi  (ARQUITECTURA PRINCIPAL)
// ----------------------------------------------------------------------------
// La web es estática (GitHub Pages) y NO puede ejecutar código de servidor.
// Este Worker es el único sitio donde vive la API key de Anthropic. El cliente
// (js/main.js) hace fetch aquí; este Worker añade el system prompt, llama a la
// API de Claude con streaming y reenvía el stream SSE tal cual al navegador.
//
// Por qué fetch crudo y no el SDK @anthropic-ai/sdk: este Worker es un proxy
// "pasa-bytes" — recibe el stream SSE de Anthropic y lo reenvía sin tocarlo.
// Para eso, encadenar response.body es más simple y ligero que el SDK, y
// permite un `wrangler deploy` de un solo archivo sin más dependencias.
//
// Modelo: claude-haiku-4-5 (rápido y barato, ideal para un FAQ-bot).
//   Precio real (jun-2026): $1 / millón tokens input, $5 / millón output.
//   (El brief decía $0.25/$1.25 — desactualizado; ver api/README.md.)
//
// Deploy y secrets: ver api/README.md.
// ============================================================================

import { SYSTEM_PROMPT } from "./system-prompt.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024; // respuestas de chat cortas → acota coste y latencia

// Límites defensivos sobre lo que manda el cliente (anti-abuso / anti-coste).
const MAX_MESSAGES = 20; // como mucho 10 turnos usuario+bot en el historial
const MAX_CHARS_PER_MSG = 2000; // un mensaje no puede ser un copy-paste enorme
const RATE_LIMIT_PER_DAY = 50; // mensajes/IP/día si hay KV "RATE_LIMIT" enlazado

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const cors = corsHeaders(origin, allowedOrigin);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Servidor mal configurado (falta API key)." }, 500, cors);
    }

    // ---- Parseo y validación del cuerpo --------------------------------
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

    // ---- Rate limiting opcional por IP (requiere KV namespace) ---------
    if (env.RATE_LIMIT) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const key = `rl:${ip}:${new Date().toISOString().slice(0, 10)}`;
      const used = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
      if (used >= RATE_LIMIT_PER_DAY) {
        return json(
          { error: "Has alcanzado el límite de mensajes por hoy. Escríbeme a javi.torralba27@gmail.com 👑" },
          429,
          cors
        );
      }
      // TTL 2 días para que la clave se limpie sola.
      await env.RATE_LIMIT.put(key, String(used + 1), { expirationTtl: 172800 });
    }

    // ---- Llamada a Claude con streaming --------------------------------
    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
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
      // No filtramos el detalle del error de Anthropic al cliente.
      return json({ error: "El asistente no está disponible ahora mismo." }, 502, cors);
    }

    // Reenviamos el stream SSE de Anthropic tal cual. El cliente parsea
    // los eventos content_block_delta para pintar el texto en directo.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...cors,
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Devuelve un array de mensajes saneado, o null si el formato no vale.
// Privacidad: no guardamos nada; solo validamos y reenviamos.
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
  // La API exige que el primer (y último) mensaje sea del usuario.
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") return null;
  return clean;
}

function corsHeaders(origin, allowed) {
  // Si ALLOWED_ORIGIN es "*", reflejamos cualquier origen. Si es una lista
  // separada por comas, solo permitimos los que coincidan.
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
