# King Javi — Pasarela de pagos (Cloudflare Worker + Stripe)

Worker serverless que crea **Stripe Checkout Sessions** (pago alojado por
Stripe, sin PCI ni datos de tarjeta en nuestra web) y recibe el **webhook**
de Stripe para avisar a Javi por email cuando alguien paga.

La web (GitHub Pages) llama a este Worker; el Worker habla con Stripe usando
la *secret key*, que **nunca** sale de aquí.

```
Alumno → [Precios en la web] → POST /create-checkout-session → Stripe Checkout
                                                                     │ paga
                                            Stripe → POST /webhook ──┘ → email a Javi (Web3Forms)
```

---

## 0. Decisiones de arquitectura (resumen)

- **Proveedor de pago:** Stripe (solo). PayPal añade fricción (cuenta
  obligatoria) sin ventaja de comisión.
- **Checkout:** alojado por Stripe (`checkout.stripe.com`). Cero PCI, más
  confianza, multimoneda. No usamos Stripe.js: redirigimos a la URL que
  devuelve la sesión.
- **Backend:** Cloudflare Workers (gratis hasta 100k req/día, sin cold start
  notable, Web Crypto incluido).
- **Confirmación (V1):** el webhook manda un email a Javi vía Web3Forms (el
  mismo canal del formulario, que el Apps Script ya reenvía a Javi). Sin base
  de datos (YAGNI). V2 podría añadir Supabase + Calendly.
- **Productos (V1):** solo **pago único**, alineado con las tarjetas ya
  publicadas en la web. La suscripción mensual queda preparada en el catálogo
  (`src/index.js`) para activarla cuando Javi la confirme.

Los **importes NO están en el código**: viven en Stripe. El Worker solo
referencia el *Price ID* por variable de entorno.

---

## 1. Crear los productos en Stripe (lo hace Adri en el Dashboard)

> Empieza en **modo test** (toggle arriba a la derecha del Dashboard) para
> probar sin cobrar de verdad. Repite en modo *live* cuando todo funcione.

Por cada producto: **Dashboard → Catálogo de productos → + Añadir producto**.

| Producto         | Tipo de precio        | Importe (placeholder*) | Moneda |
|------------------|-----------------------|------------------------|--------|
| Clase Única (1h) | Único (one-time)      | 18,00 €                | EUR    |
| Bono 5 Horas     | Único (one-time)      | 85,00 € (17 €/h)       | EUR    |
| Bono 10 Horas    | Único (one-time)      | 160,00 € (16 €/h)      | EUR    |

\* Los importes son los que hoy muestra la web, **pendientes de que Javi los
confirme** (ver `JAVI_STATUS.md`). Cambiarlos es solo editar el precio en
Stripe + el número en la tarjeta de `index.html`; el código no se toca.

Tras crear cada producto, copia su **Price ID** (`price_xxx`, en la sección
de precios del producto). Lo necesitas en el paso 3.

> **Suscripción (cuando Javi la confirme):** crea un producto con precio
> *recurrente mensual*, descomenta `sub_mensual` en `src/index.js`, añade su
> `STRIPE_PRICE_SUB_MENSUAL` como secret y un botón con
> `data-checkout="sub_mensual"` en la web.

---

## 2. Instalar y desplegar el Worker

```bash
cd workers
npm install                 # instala wrangler
npx wrangler login          # abre el navegador para autenticar Cloudflare
npx wrangler deploy         # publica el Worker
```

El deploy imprime la URL pública, p. ej.:
```
https://king-javi-payments.TU-SUBDOMINIO.workers.dev
```

---

## 3. Configurar los secrets

Desde `workers/`, sube cada secret (te pedirá pegar el valor):

```bash
npx wrangler secret put STRIPE_SECRET_KEY        # sk_test_... o sk_live_...
npx wrangler secret put STRIPE_PRICE_CLASE_UNICA # price_... (Clase Única)
npx wrangler secret put STRIPE_PRICE_BONO_5      # price_... (Bono 5 Horas)
npx wrangler secret put STRIPE_PRICE_BONO_10     # price_... (Bono 10 Horas)
npx wrangler secret put WEB3FORMS_ACCESS_KEY     # cheZUKwK-... (la de la web)
# STRIPE_WEBHOOK_SECRET se añade en el paso 4
```

`SITE_URL` ya está en `wrangler.toml` (no es secreto). Tras cambiar secrets,
vuelve a `npx wrangler deploy`.

---

## 4. Conectar el webhook de Stripe

1. **Dashboard de Stripe → Desarrolladores → Webhooks → + Añadir endpoint.**
2. URL del endpoint:
   `https://king-javi-payments.TU-SUBDOMINIO.workers.dev/webhook`
3. Eventos a escuchar: **`checkout.session.completed`**.
4. Guarda. Stripe muestra el **Signing secret** (`whsec_...`). Súbelo:
   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET   # whsec_...
   npx wrangler deploy
   ```

El Worker verifica la firma (`Stripe-Signature`, HMAC-SHA256) y rechaza
firmas inválidas o con más de 5 min de antigüedad (anti-replay).

---

## 5. Apuntar la web al Worker

En `js/payments.js` (raíz del repo, **no** en `workers/`), edita:

```js
var CHECKOUT_ENDPOINT = 'https://king-javi-payments.TU-SUBDOMINIO.workers.dev/create-checkout-session';
```

Cambia `TU-SUBDOMINIO` por el real. Mientras siga el placeholder, los botones
de precios hacen *fallback* al formulario de contacto (no rompe nada).
Commit + push → GitHub Actions reconstruye y despliega la web.

---

## 6. Probar (modo test)

1. Web con `STRIPE_SECRET_KEY = sk_test_...` y Price IDs de test.
2. Clic en "Reservar" → debe redirigir a Stripe Checkout.
3. Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, CVC y CP cualquiera.
4. Tras pagar → vuelve a `success.html` y Javi recibe el email del pago.
5. Comprueba el evento en **Stripe → Webhooks** (debe responder `200`).

Logs del Worker en vivo: `npx wrangler tail`.

---

## Endpoints

| Método | Ruta                       | Qué hace                                            |
|--------|----------------------------|-----------------------------------------------------|
| POST   | `/create-checkout-session` | Body `{ "product": "clase_unica" }` → `{ "url": … }` |
| POST   | `/webhook`                 | Recibe eventos de Stripe (firma verificada)         |

Claves de producto válidas: `clase_unica`, `bono_5`, `bono_10`.

## Seguridad

- La *secret key* solo vive como secret del Worker; jamás llega al navegador.
- CORS restringido a `https://krabbyadri-max.github.io`.
- El webhook verifica firma HMAC-SHA256 + ventana temporal de 5 min.
- No se almacenan datos de tarjeta (los gestiona Stripe).

## Coste estimado

Tráfico *hobby* (decenas-cientos de visitas/día): **0 €/mes**.
- Cloudflare Workers: gratis hasta 100.000 req/día.
- Stripe: sin cuota fija; comisión ~**1,5 % + 0,25 €** por pago con tarjeta
  europea (lo paga el negocio sobre cada cobro, no es coste de infraestructura).
- Web3Forms: plan gratuito (250 envíos/mes) suficiente para los avisos.
