# Plan: Web King Javi v2.0 — Metal Hermesmon

**Fecha:** 2026-06-13 · **Estado:** En ejecución
**Objetivo:** La mejor web que Javi pueda pedir, sin parar hasta tenerla.

---

## 0. Contexto heredado (del agente anterior)

- Repo: `https://github.com/krabbyadri-max/king-javi-web`
- Local: `~/projects/king-javi-web/`
- Rama: `main`, 10 commits, todo pusheado
- AUDIT.md previo (195 líneas): P0/P1/P2 priorizados
- HANDOFF.md: workflow documentado
- **Estado funcional:** Web monolítica en `index.html` (941 líneas, CSS+JS inline)
- **Ya fixeado:** P0-1..P0-4, P1-1..P1-8, P2-2, P2-6
- **Pendiente:** P1-5 (WhatsApp), P2-1 (og:image hecho), P2-3 (WebP), P2-4 (headings), P2-5 (scroll), P2-7 (Three.js + emojis)
- **Decisiones tomadas por Javi en emails:**
  - Logo "logo final.png" (recibido)
  - Drive con renders de alumnos (recibido, 10 imágenes)
  - Tusclasesparticulares.com como fuente de textos
  - Colores: azul metálico, plateado, negro mate, dorado
  - Letras 3D: J/T, K/J
  - Chat IA (no con él)
  - Pasarela pagos
  - Blog/comunidad
  - Sección trabajos de alumnos
- **Orden explícita de Javi (email 83): "Basta ya, no me mandes más correos"** → no spam automático

---

## 1. Estructura objetivo

```
king-javi-web/
├── index.html              # solo markup, ~500 líneas
├── css/
│   ├── tokens.css         # variables (colores, tipografía, spacing)
│   ├── base.css           # reset, scrollbar, loader, nav
│   ├── components.css     # botones, cards, formulario
│   ├── sections.css       # hero, sobre-mi, servicios, galería, comunidad
│   └── animations.css     # reveal, 3D, particles
├── js/
│   ├── nav.js             # menú móvil
│   ├── reveal.js          # IntersectionObserver
│   ├── faq.js             # acordeón accesible
│   ├── form.js            # Web3Forms + validación
│   ├── community.js       # blog/comunidad (markdown → HTML, comments)
│   ├── chat.js            # chat IA con Claude/OpenAI
│   ├── payments.js        # Stripe/PayPal
│   ├── gallery.js         # galería lightbox
│   └── main.js            # orquestador
├── assets/
│   ├── img/               # galería optimizada WebP
│   ├── logos/             # logo final.png, variantes SVG
│   ├── renders-alumnos/   # 10 renders de Drive
│   ├── renders-javi/      # (vacío, por ahora)
│   ├── og/                # og-image 1200x630
│   └── icons/             # SVG inline (Lucide)
├── content/               # markdown editable por Javi
│   ├── sobre-mi.md
│   ├── servicios.md
│   ├── precios.md
│   ├── faq.md
│   └── comunidad/         # posts del blog
├── api/                   # serverless functions
│   ├── chat.js            # proxy a Claude/OpenAI para el chat
│   ├── contact.js         # reenvío form a Javi + Adrián
│   ├── community.js       # CRUD posts (Supabase o local)
│   └── payments.js        # Stripe checkout
├── .github/workflows/     # CI: lighthouse, deploy
├── AUDIT.md
├── METAL_HERMESMON_PLAN.md
├── README.md
└── package.json
```

---

## 2. Stack a usar (decisión)

**Frontend:** HTML + CSS + JS vanilla (módulos ES), sin framework.
**Por qué:** Javi no es técnico. HTML estático es lo más fácil de mantener. Astro sería ideal si crece, pero de momento no.
**Backend:** Serverless functions (Vercel/Cloudflare Pages) o Express simple en Node.
**DB comunidad:** Supabase (ya tienes cuenta `krabbyadri-max`) → free tier.
**Chat IA:** Anthropic Claude API o OpenAI. El chat habla EN NOMBRE de Javi (entrenado con su info).
**Pagos:** Stripe Checkout (suscripción mensual de clases + pago único por proyecto freelance).
**Deploy:** Vercel (con `vercel.json` para serverless).
**Dominio:** preguntar a Javi (sugerir `kingjavi.com`, `javieritorralba.com`).

---

## 3. Features nuevas a implementar

### 3.1 — Blog / Comunidad
- Posts en markdown, editables
- Comentarios de usuarios (autenticación email magic link, Supabase Auth)
- Tags: "Animación 3D", "Maya", "Blender", "Proyectos alumnos", etc.
- Moderación: Adrián o Javi aprueban antes de publicar (override)

### 3.2 — Chat IA
- Widget flotante (esquina inferior derecha)
- Pregunta/responde sobre: precios, metodología, disponibilidad, nivel, herramientas
- EN NOMBRE de Javi, con system prompt que cargue su info
- Si no sabe, dice "Javi te contestará por email, déjame tu contacto"
- Fallback a formulario si falla

### 3.3 — Pasarela de pagos
- Stripe Checkout
- 2 productos:
  - **Clase suelta** (1h, 50€) — pago único
  - **Pack 4 clases** (4h, 180€) — pago único, 10% descuento
  - **Suscripción mensual** (4h/mes, 150€/mes) — recurring
- Webhook de Stripe → actualiza DB
- Confirmación por email a Javi + Adrián

### 3.4 — Galería trabajos alumnos
- Lightbox, navegable con teclado
- Filtros por herramienta (Maya, Blender, etc)
- Cada render con: nombre alumno, herramienta, descripción

### 3.5 — Sobre mí mejorado
- Foto profesional de Javi (pedir o generar)
- Bio expandida (de TusclasesParticulares)
- Timeline: 7+ años 3D, opositando bombero, multilingüe
- ArtStation embed, Vimeo embed

---

## 4. Pendientes reales (P2 del AUDIT)

- [ ] P1-5 — Enlace WhatsApp real (pedir número a Javi)
- [ ] P2-3 — Convertir PNGs a WebP optimizado
- [ ] P2-4 — Headings jerárquicos correctos
- [ ] P2-5 — Throttle scroll listeners (o IntersectionObserver)
- [ ] P2-7 — Sustituir emojis por SVG icons (Lucide), modernizar Three.js
- [ ] Refactor: separar CSS y JS
- [ ] Añadir PWA manifest + service worker (opcional)
- [ ] Accessibility audit (axe, WAVE)
- [ ] Lighthouse score 95+ en mobile

---

## 5. Decisiones pendientes (consultar a Javi)

- [ ] **Email real de Javi** para que el form le llegue a él (no a Adrián): `javi.torralba27@gmail.com` ya conocido, confirmar
- [ ] **Número WhatsApp** para el botón
- [ ] **Dominio** propio (sugerir opciones, comprar)
- [ ] **Precios reales** de las clases
- [ ] **Disponibilidad** horaria
- [ ] **Sistema de reservas** (Calendly, Cal.com, custom)
- [ ] **Políticas de cancelación y reembolso**
- [ ] **RGPD** — texto legal, banner de cookies

---

## 6. Estado de ejecución (live)

| Tarea | Estado | Quién |
|---|---|---|
| Logo y renders descargados | ✓ Hecho | Metal |
| AUDIT.md y HANDOFF.md leídos | ✓ Hecho | Metal |
| OAuth Claude Code (Fable/Opus) | ⏳ Esperando code de Adri | Adri |
| Estructura del proyecto definida | ✓ Hecho | Metal |
| Stack decidido | ✓ Hecho | Metal |
| Refactor CSS/JS a ficheros | Pendiente | Claude Code Opus 4.8 |
| Implementar comunidad (Supabase) | Pendiente | Claude Code Opus 4.8 |
| Implementar chat IA | Pendiente | Claude Code Opus 4.8 |
| Implementar Stripe | Pendiente | Claude Code Opus 4.8 |
| Refactorizar galería | Pendiente | Claude Code Opus 4.8 |
| Refactorizar formulario | Pendiente | Claude Code Opus 4.8 |
| Optimizar imágenes (WebP) | Pendiente | Metal + ComfyUI |
| Generar OG image 1200x630 | Pendiente | Metal + ComfyUI |
| Deploy Vercel | Pendiente | Metal |
| Dominio | Pendiente | Adri/Javi |
| Test E2E | Pendiente | Claude Code Opus 4.8 |
| Aviso a Javi para revisión | Pendiente | Metal (correo) |
| Aviso a Adri (Telegram) milestone | Pendiente | Metal |

---

## 7. Comunicación con Javi

**No spam.** Solo escribir cuando haya valor:
- Web lista para revisión (con URL)
- Bug crítico que necesite su input (ej: precio, número WhatsApp)
- Confirmación de features concretas (después de las decisiones del §5)

**Tono:** español, directo, como un colega que sabe de web.

---

## 8. Skills cargadas para el proyecto

- `software-development/subagent-driven-development` — para delegar a Claude Code
- `software-development/test-driven-development` — para test
- `software-development/writing-plans` — para este plan
- `software-development/requesting-code-review` — auto-review
- `software-development/simplify-code` — limpieza tras implementación
- `software-development/systematic-debugging` — si falla algo
- `github/github-pr-workflow` — para PRs y reviews
- `claude-code` — para invocar el subagente
- `dogfood` — para QA manual
- `creative/comfyui` — para generar imágenes
- `creative/baoyu-article-illustrator` — si hace falta

---

_Generado por Metal Hermesmon — 13 jun 2026_
