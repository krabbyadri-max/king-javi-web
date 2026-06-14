# DEPLOY.md — Chat IA + Stripe en producción

Guía paso a paso para Adri. Sigue las dos partes en orden.

**Tiempo estimado:** 30–45 min (primera vez).

> ⚠️ **Regla de oro:** empieza SIEMPRE con claves de **test** (`sk_test_…`). Pasa a **live** (`sk_live_…`) solo cuando todo funcione de principio a fin. **Nunca mezcles claves test y live** — es la causa nº1 de errores.

---

## Parte 1 — Chat IA (Vercel)

Es la opción más simple: un click y auto-deploy en cada `git push`.

### Pasos

1. Consigue tu **API key de Anthropic**:
   - Ve a <https://console.anthropic.com> → **API Keys** → crea una nueva.
   - Cópiala (empieza por `sk-ant-…`). Guárdala, no se vuelve a mostrar.

2. Importa el repo en Vercel:
   - Ve a <https://vercel.com/new>
   - Importa el repo `krabbyadri-max/king-javi-web`.

3. Añade la variable de entorno **antes** de desplegar:
   - **Settings → Environment Variables**
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: la clave del paso 1.

4. Pulsa **Deploy**.

5. Cuando termine, anota la URL del endpoint. Será:
   ```
   https://<proyecto>.vercel.app/api/chat
   ```

6. Conecta la web al endpoint real. Edita `js/main.js` (~línea 107):
   ```js
   // Antes:
   const CHAT_ENDPOINT = 'https://kingjavi-chat.EXAMPLE.workers.dev';
   // Después (tu URL real de Vercel):
   const CHAT_ENDPOINT = 'https://<proyecto>.vercel.app/api/chat';
   ```

7. Commit y push:
   ```bash
   git add js/main.js
   git commit -m "feat: wire CHAT_ENDPOINT to live Vercel URL"
   git push
   ```

### Probar el chat

- Vercel **auto-despliega** en cada push. Espera ~1 min y prueba el chat en la web.
- Si el chat devuelve **error 500**, lo más probable es que la cuenta de Anthropic **no tenga saldo**. Añade crédito en <https://console.anthropic.com>.

---

## Parte 2 — Pagos (Stripe + Cloudflare Workers)

El código del Worker ya está en `workers/`. Solo hay que crear las cuentas, configurar Stripe y desplegar.

### A. Crear cuentas

1. Cuenta en Cloudflare (free tier): <https://cloudflare.com>
2. Cuenta en Stripe (España disponible): <https://dashboard.stripe.com/register>

### B. Crear los productos en Stripe

En el **Stripe Dashboard**, crea 3 productos (todos **pago único**):

| Producto         | Precio | Tipo       |
|------------------|--------|------------|
| Clase única      | 18 €   | Pago único |
| Bono 5 horas     | 85 €   | Pago único |
| Bono 10 horas    | 160 €  | Pago único |

Copia los **Price IDs** (empiezan por `price_…`) — los necesitarás en el paso E.

### C. Conseguir las claves de Stripe

1. **Developers → API keys** → copia la **Secret key**.
   - Empieza con `sk_test_…` para pruebas (úsala primero).
   - Más adelante usarás `sk_live_…` para producción.

2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://king-javi-payments.<subdominio>.workers.dev/stripe-webhook`
   - Eventos a escuchar:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
   - Copia el **Signing secret** (empieza por `whsec_…`).

> ⚠️ Un webhook **mal configurado** puede provocar **cobros sin que te lleguen avisos**. Verifica la URL y los eventos con cuidado.

### D. Preparar el Worker

```bash
cd workers
npm install
npx wrangler login    # abre el navegador, autoriza
```

Edita `workers/wrangler.toml` y pon tu **subdominio real** en los campos `name` y `routes`.

### E. Cargar los secretos en Cloudflare

Ejecuta cada comando y pega el valor cuando lo pida:

```bash
npx wrangler secret put STRIPE_SECRET_KEY      # pega sk_test_… (luego sk_live_…)
npx wrangler secret put STRIPE_WEBHOOK_SECRET  # pega whsec_…
npx wrangler secret put PRICE_CLASE_UNICA      # pega price_… (Clase única)
npx wrangler secret put PRICE_BONO_5H          # pega price_… (Bono 5 horas)
npx wrangler secret put PRICE_BONO_10H         # pega price_… (Bono 10 horas)
```

### F. Desplegar

```bash
npx wrangler deploy
```

Devuelve la **URL del Worker**. Anótala.

### G. Conectar la web al checkout

Edita `js/payments.js` (~línea 18):
```js
// Antes:
const CHECKOUT_ENDPOINT = '...';
// Después (tu URL real de Cloudflare):
const CHECKOUT_ENDPOINT = 'https://king-javi-payments.<subdominio>.workers.dev';
```

Commit y push:
```bash
git add js/payments.js
git commit -m "feat: wire CHECKOUT_ENDPOINT to live Cloudflare URL"
git push
```

### Probar los pagos

1. Usa primero las **claves test** (`sk_test_…`).
2. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC.
3. Comprueba el flujo completo: botón → checkout → página de éxito → evento recibido en el webhook (Stripe Dashboard → Developers → Webhooks → logs).
4. Cuando **todo funcione**, repite el paso E con las claves **live** (`sk_live_…` y el `whsec_…` del endpoint live) y vuelve a `npx wrangler deploy`.

---

## Costes (tráfico hobby)

| Servicio                  | Plan / coste                                         |
|---------------------------|------------------------------------------------------|
| Vercel                    | Free tier: 100 GB bandwidth + serverless — sobra     |
| Cloudflare Workers        | Free tier: 100k requests/día — sobra                 |
| Anthropic (Claude Haiku)  | ~$0.001 por conversación de 10 mensajes → **<$1/mes**|
| Stripe (comisión EU)      | 1.5% + 0.25 € por transacción                        |

---

## Riesgos a vigilar

- **Anthropic sin saldo** → el chat devuelve **error 500**. Mantén crédito en la cuenta.
- **CORS** → si en el futuro usas un **dominio propio** (distinto de `github.io`), habrá que añadirlo a los orígenes permitidos en el Worker y en la función de Vercel.
- **Webhook mal configurado** → **cobros sin aviso**. Revisa URL y eventos.
- **Mezclar claves test/live** → errores difíciles de depurar. Usa un solo entorno a la vez.

---

## Resumen rápido

1. **Chat:** Vercel → import repo → `ANTHROPIC_API_KEY` → deploy → editar `js/main.js` → push.
2. **Pagos:** Stripe (3 productos + keys + webhook) → `cd workers` → `wrangler login` → editar `wrangler.toml` → 5 secretos → `wrangler deploy` → editar `js/payments.js` → push.
3. **Test primero, live después.**
