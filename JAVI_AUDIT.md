# Auditoría de requisitos de Javi — 14-jun-2026

Fuentes: emails #78, #79, #80, #81, #83 (todos los correos de Javi). AUDIT.md, HANDOFF.md, METAL_HERMESMON_PLAN.md, JAVI_STATUS.md, contenido del repo.

## ✅ CUMPLIDOS

| # | Requisito | Fuente | Evidencia | Commit/Estado |
|---|---|---|---|---|
| 1 | Página personal + portfolio + clases particulares + freelance | #78.1 | index.html tiene hero, sobre-mi, servicios, precios, contacto | `10aeef1`+ |
| 2 | Blog como portal de comunidad donde todos publican dudas/proyectos | #78.2 | Eleventy blog con seed post en `comunidad/` | `cd36cb7`, `88cb09d` |
| 3 | Colores azul metálico, plateado, negro mate, dorado | #78.3 | Variables CSS: `--blue-metal`, `--silver`, `--black-matte`, `--gold` | `css/styles.css` línea 8-12 |
| 4 | Iniciales 3D J/T y K/J (King Javi) | #78.3 | Three.js con partículas e icosaedros en hero, **PERO** las letras 3D concretas J/T y K/J **no se han renderizado como tales** | parcial |
| 5 | Formulario de contacto | #78.4 | Web3Forms conectado (`cheZUKwK-GFDo0JXCVJhY62Q7xVHstD8qkaSUcaVaeg`) | `index.html:383-384` |
| 6 | Chat en vivo (placeholder básico) | #78.4 | Existe el chat UI + 6 respuestas hardcoded en `getBotResponse()` | `js/main.js:118-126` |
| 7 | Textos basados en TusClasesParticulares | #78.5 | Enlace y datos aplicados, perfil enlazado en contacto | `index.html:377` |
| 8 | Imágenes de ArtStation | #78.5 | Enlace directo al perfil en contacto | `index.html:376` |
| 9 | Zona de trabajos de alumnos | #78.5 | Galería con 10 renders de alumnos (`assets/renders-alumnos/`) | múltiples commits |
| 10 | Web solo en español | #78.6 | `<html lang="es">`, todo el copy en español | `index.html:2` |
| 11 | "Geppetto sin Disney" como tagline | #79.1 | No está textual pero el hero vende "Aprende 3D con un experto" | copy改改改 |
| 12 | Especialidades (rigging, modelado, entornos, animación, iluminación/render) | #79.2 | Servicios cubren modelado, rigging, animación, entornos | `index.html:118-148` |
| 13 | Orgulloso de Nimona | #79.3 | **NO está** en la web, no se ha mencionado a Nimona | GAP |
| 14 | Que le vean como profesional + friki (cine/videojuegos) | #79.4 | Tono general, "videojuegos" en title | parcial |
| 15 | Que quede claro que es web de clases particulares + freelance, no solo portfolio | #79.5 | Sí, "Clases particulares", "Bono 5 horas", CTA "Clase GRATIS" | `index.html` |
| 16 | Trabajos en ArtStation y Vimeo | #79.6 | ArtStation enlazado, **Vimeo no** | parcial |
| 17 | Idiomas (español, inglés, francés) | #79.7 | **NO mencionado** en la web | GAP |
| 18 | Opositando a bombero | #79.7 | **NO mencionado** (decisión correcta: no exponer) | OK no exponer |
| 19 | Apasionado de animación Disney/Pixar/Dreamworks | #79.7 | **NO mencionado** explícitamente | GAP menor |
| 20 | Fan de los animales | #79.7 | **NO mencionado** (decisión correcta) | OK no exponer |
| 21 | Friki de los videojuegos | #79.7 | "videojuegos" en title, sección servicios lo menciona | OK |
| 22 | Logo final (`logo final.png`) | #80 | Recibido y guardado como `assets/logos/logo-final.png` (1.7MB), **PERO NO USADO en el HTML** | **GAP CRÍTICO** |
| 23 | 10 renders de alumnos (Drive) | #81 | Descargados, subidos, renombrados, en galería | múltiples commits |
| 24 | Videos de Drive (en #81) | #81 | **NO descargados** | GAP menor |
| 25 | Respeta orden de "no más correos automáticos" | #83 | Cero emails automáticos enviados a Javi desde el 12-jun | OK |

## ❌ NO CUMPLIDOS / GAPS CRÍTICOS

### G1. **Logo final NO integrado en la web** (#80)
- Javi dijo literalmente: "Quiero que este sea el logo de la pagina web y que tanto esos colores como el diseño del fondo estén bien integrados"
- El archivo está en `assets/logos/logo-final.png` (1.7MB)
- Pero el `<a class="logo">` del nav está VACÍO (no tiene `<img>`)
- Acción: usar el logo en el nav, header, footer, favicon, og:image, schema.org, etc.

### G2. **Logo demasiado pesado (1.7MB)**
- Hay que optimizar a WebP <50KB

### G3. **Chat IA NO es IA real** (#78.4)
- "Chat en Vivo (con una IA, no conmigo)"
- Lo que hay: 6 if/else hardcoded con respuestas fijas
- Hace falta: integración real con Anthropic Claude API o OpenAI, con system prompt cargado con info de Javi

### G4. **Pasarela de pagos NO implementada** (#78.4)
- Javi pidió Stripe/PayPal explícitamente
- Solo aparece como "pendiente" en el plan

### G5. **Nimona no mencionada** (#79.3)
- Es su proyecto del que más orgulloso está
- Merece estar destacado en "Sobre mí" o portafolio

### G6. **Vimeo no enlazado** (#79.6)
- Solo ArtStation está en contacto
- El video `#749765248` debería estar visible (reel/demo reel)

### G7. **Idiomas (inglés, francés) no mencionados** (#79.7)
- Solo español. Si da clases a internacionales, debería indicarlo

### G8. **Falta decisión sobre el dominio propio**
- Está en `krabbyadri-max.github.io/king-javi-web/`
- Javi debería tener algo tipo `kingjavi.com` o similar

### G9. **Falta número WhatsApp real** (#80 anterior contexto)
- El placeholder está puesto pero esperando el número

### G10. **Form va a krabbyadri, no a javi**
- Web3Forms apunta a `krabbyadri@gmail.com`
- Solución en camino: Apps Script que reenvía

### G11. **Videos de Drive no descargados** (#81)
- El enlace drive está: `1myL-PJ-U9FceYx7s0hz8PUZXTrSSZzGj`
- No son bloqueantes, pero el plan mencionaba "sección de videos"

## 🎯 RESUMEN EJECUTIVO

- **15/25 requisitos cumplidos** (60%)
- **5 gaps críticos** (G1, G2, G3, G4 + G10 bloqueante funcional)
- **6 gaps menores** (G5, G6, G7, G8, G9, G11)
- **4 cosas que Javi no quiere** (G18, G20 respetadas — no exponer bombero/animales)

## Plan de acción propuesto (orden de impacto)

1. **G1+G2 — Logo final integrado y optimizado** (CRÍTICO, Javi lo pidió literal)
2. **G10 — Apps Script para reenviar form a Javi** (en curso, Opus ya trabaja)
3. **G3 — Chat IA real con Claude API** (serverless function + system prompt de Javi)
4. **G4 — Stripe Checkout** (clase suelta, pack 4, suscripción)
5. **G5 — Nimona destacada en portafolio**
6. **G6 — Vimeo embed del reel**
7. **G7 — Idiomas mencionados en la bio**
8. **G11 — Descargar videos de Drive (opcional)**
9. **G8 + G9 — Preguntar a Javi** (dominio, WhatsApp)
