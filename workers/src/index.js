/**
 * ============================================================================
 *  KING JAVI — Pasarela de pagos (Cloudflare Worker)
 * ============================================================================
 *
 *  Dos endpoints:
 *    POST /create-checkout-session  → crea una Stripe Checkout Session y
 *                                     devuelve { url } para redirigir al alumno.
 *    POST /webhook                  → recibe eventos de Stripe (firma verificada)
 *                                     y avisa a Javi por email cuando hay un pago.
 *
 *  Principios:
 *    - La SECRET KEY de Stripe NUNCA llega al cliente: solo vive aquí.
 *    - No se guardan datos de tarjeta (lo hace Stripe en su Checkout alojado).
 *    - El webhook verifica la firma de Stripe antes de fiarse de nada.
 *    - CORS restringido a la web de Javi.
 *    - Sin dependencias: se habla con Stripe vía fetch + Web Crypto.
 *
 *  El catálogo NO contiene importes: los precios viven en Stripe (fuente de
 *  verdad) y aquí solo referenciamos el Price ID por variable de entorno.
 *  Así Adri/Javi cambian precios en el panel de Stripe sin tocar código.
 * ============================================================================
 */

// Origen único autorizado a llamar al endpoint de checkout (CORS).
const ALLOWED_ORIGIN = 'https://krabbyadri-max.github.io';

// Catálogo de productos. La clave (p.ej. "clase_unica") es lo que envía el
// frontend; `priceEnv` apunta a la variable de entorno con el Price ID real.
//
// V1: solo pago único, alineado con las tarjetas de precios ya publicadas
// en la web (Clase Única, Bono 5h, Bono 10h). Cuando Javi confirme una
// suscripción mensual, basta con descomentar/añadir una entrada con
// mode: 'subscription' y crear su Price recurrente en Stripe.
const CATALOG = {
  clase_unica: { name: 'Clase Única (1h)', mode: 'payment', priceEnv: 'STRIPE_PRICE_CLASE_UNICA' },
  bono_5:      { name: 'Bono 5 Horas',     mode: 'payment', priceEnv: 'STRIPE_PRICE_BONO_5' },
  bono_10:     { name: 'Bono 10 Horas',    mode: 'payment', priceEnv: 'STRIPE_PRICE_BONO_10' },
  // sub_mensual: { name: 'Suscripción mensual', mode: 'subscription', priceEnv: 'STRIPE_PRICE_SUB_MENSUAL' },
};

// Tolerancia anti-replay para la firma del webhook (segundos).
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }

    if (request.method === 'POST' && url.pathname === '/create-checkout-session') {
      return handleCreateCheckout(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

// ---------------------------------------------------------------------------
//  /create-checkout-session
// ---------------------------------------------------------------------------

async function handleCreateCheckout(request, env) {
  const cors = corsHeaders(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400, cors);
  }

  const product = typeof body.product === 'string' ? body.product : '';
  const item = CATALOG[product];
  if (!item) {
    return json({ error: 'Producto no reconocido' }, 400, cors);
  }

  const priceId = env[item.priceEnv];
  if (!priceId) {
    console.error(`Falta la variable de entorno ${item.priceEnv}`);
    return json({ error: 'Configuración de pago incompleta' }, 500, cors);
  }

  const siteUrl = env.SITE_URL || ALLOWED_ORIGIN;

  // Stripe espera form-urlencoded con claves anidadas entre corchetes.
  const form = new URLSearchParams();
  form.set('mode', item.mode);
  form.set('line_items[0][price]', priceId);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${siteUrl}/cancel.html`);
  form.set('locale', 'es');
  form.set('metadata[product]', product);
  // Email opcional: si el alumno lo indicó, Stripe lo precarga en el checkout.
  if (typeof body.email === 'string' && body.email.includes('@')) {
    form.set('customer_email', body.email);
  }

  let res;
  try {
    res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
  } catch (err) {
    console.error('Error de red al llamar a Stripe:', err);
    return json({ error: 'No se pudo contactar con la pasarela' }, 502, cors);
  }

  const session = await res.json();
  if (!res.ok || !session.url) {
    console.error('Stripe devolvió error al crear la sesión:', session.error && session.error.message);
    return json({ error: 'No se pudo iniciar el pago' }, 502, cors);
  }

  return json({ url: session.url }, 200, cors);
}

// ---------------------------------------------------------------------------
//  /webhook  (Stripe → confirma el pago → avisa a Javi)
// ---------------------------------------------------------------------------

async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error('Firma de webhook inválida o ausente');
    return new Response('Firma inválida', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data && event.data.object ? event.data.object : {};
    await notificarPagoAJavi(session, env);
  }

  // Siempre 200 ante un evento bien firmado: si no, Stripe reintenta en bucle.
  return new Response('ok', { status: 200 });
}

/**
 * Avisa a Javi de un pago reutilizando Web3Forms (el mismo pipeline del
 * formulario de contacto, que el Apps Script de Adri ya reenvía a Javi).
 */
async function notificarPagoAJavi(session, env) {
  if (!env.WEB3FORMS_ACCESS_KEY) {
    console.error('Falta WEB3FORMS_ACCESS_KEY: no se puede avisar del pago');
    return;
  }

  const producto = (session.metadata && session.metadata.product) || 'desconocido';
  const nombreProducto = (CATALOG[producto] && CATALOG[producto].name) || producto;
  const email = session.customer_details && session.customer_details.email
    ? session.customer_details.email
    : (session.customer_email || 'desconocido');
  const importe = typeof session.amount_total === 'number'
    ? (session.amount_total / 100).toFixed(2) + ' ' + String(session.currency || 'eur').toUpperCase()
    : 'desconocido';

  const payload = {
    access_key: env.WEB3FORMS_ACCESS_KEY,
    subject: '[WEB-JAVI] 💳 Nuevo pago recibido',
    from_name: 'King Javi — Pagos',
    // Campos del cuerpo del email:
    Producto: nombreProducto,
    Importe: importe,
    Email_del_alumno: email,
    ID_sesion_Stripe: session.id || 'desconocido',
    Siguiente_paso: 'Contacta al alumno en <24h para agendar la(s) clase(s).',
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Web3Forms respondió con estado', res.status);
    }
  } catch (err) {
    console.error('No se pudo enviar el aviso de pago:', err);
  }
}

// ---------------------------------------------------------------------------
//  Verificación de firma de Stripe (Web Crypto, sin SDK)
// ---------------------------------------------------------------------------

/**
 * Implementa el esquema de firma de Stripe:
 *   Stripe-Signature: t=<timestamp>,v1=<hmac_sha256_hex>
 *   signed_payload = "<timestamp>.<rawBody>"
 * @returns {Promise<boolean>}
 */
async function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false;

  const parts = {};
  for (const piece of header.split(',')) {
    const idx = piece.indexOf('=');
    if (idx === -1) continue;
    parts[piece.slice(0, idx).trim()] = piece.slice(idx + 1).trim();
  }

  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  // Defensa anti-replay: rechaza firmas demasiado viejas.
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || age > WEBHOOK_TOLERANCE_SECONDS) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const computed = toHex(sigBuf);

  return timingSafeEqual(computed, expected);
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparación en tiempo constante para no filtrar info por timing.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
//  CORS
// ---------------------------------------------------------------------------

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const headers = { 'Content-Type': 'application/json' };
  // Solo devolvemos el header de permiso si el origen es exactamente el nuestro.
  if (origin === ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function handlePreflight(request) {
  const origin = request.headers.get('Origin');
  if (origin !== ALLOWED_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}
