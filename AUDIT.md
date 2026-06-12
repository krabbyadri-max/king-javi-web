# Auditoría — King Javi Web (`index.html`)

**Fecha:** 2026-06-12 · **Alcance:** `index.html` (941 líneas, HTML+CSS+JS inline) + `assets/img/` · **Origen del código:** agente MiniMax (commit `b51ff85`)

---

## 1. Resumen ejecutivo

Landing page estática de una sola página para clases particulares de 3D/rigging/videojuegos. El diseño visual es coherente (paleta negro/oro/azul, tipografía Montserrat/Inter, animaciones de reveal) y la estructura de secciones es correcta para una landing comercial: hero → stats → sobre mí → servicios → precios → comunidad → FAQ → testimonios → galería → CTA → contacto.

Sin embargo, el sitio **no es publicable en su estado actual** por tres motivos críticos:

1. **Todas las imágenes (8 de 8, incluido el favicon) apuntan al CDN efímero del agente que lo generó** (`agent-cdn.minimax.io`). Esas URLs caducarán y el sitio quedará sin una sola imagen. Irónicamente, las imágenes ya están descargadas en `assets/img/` y no se referencian en ningún sitio.
2. **El formulario de contacto es decorativo**: hace `preventDefault()`, muestra un `alert()` de éxito y descarta el mensaje. En un negocio cuyo único objetivo es captar alumnos, cada envío es un cliente perdido que cree haber contactado.
3. **Restos de generación automática en el contenido**: caracteres chinos en las meta keywords (`desarrollo游戏`), anglicismos sin traducir ("Clases totally prácticas") y frases sin sentido ("aunque te sulpas algo", FAQ que habla de "infantil y preescolar" copiada de una plantilla de clases genéricas).

Además, el fondo Three.js tiene un bug que hace **invisibles las figuras geométricas** (material Phong sin luces en la escena = render negro sobre fondo negro), el chat inyecta HTML del usuario sin sanear, y el acordeón de FAQ no es accesible por teclado.

Con ~1 día de trabajo (arreglar P0s + P1s) el sitio es publicable. La reestructuración propuesta (§5) es recomendable pero no bloqueante.

### Scores (0–10)

| Dimensión | Score | Justificación breve |
|---|---|---|
| Diseño | 7 | Identidad visual coherente y atractiva; iconos emoji y estética de plantilla le restan acabado profesional |
| Accesibilidad | 3 | FAQ inoperable por teclado, labels sin asociar, jerarquía de headings rota, contenido invisible sin JS, sin `prefers-reduced-motion` |
| SEO | 4 | Title/description correctos, pero keywords corruptas, sin canonical, sin `og:image`/`og:url`, sin datos estructurados |
| Performance | 4 | Three.js completo (~600 KB) bloqueando el render, 2000 partículas animando siempre, imágenes remotas sin lazy-load; PNGs locales de 1.3–2.1 MB sin optimizar |
| Responsive | 6 | Breakpoints razonables y `clamp()` bien usado; el menú móvil no se cierra al navegar y el CTA de nav puede desbordar en pantallas pequeñas |
| Mantenibilidad | 3 | Monolito de 941 líneas con CSS y JS inline, assets locales muertos, contenido mezclado con presentación |
| Funcionalidad | 4 | Formulario falso, enlace de WhatsApp muerto, figuras 3D invisibles, imágenes en CDN caducable |

---

## 2. Bugs

### P0 — Bloquean publicación

**P0-1 · Todas las imágenes dependen de un CDN efímero de MiniMax**
- **Archivo:línea:** `index.html:14` (favicon), `:398` (logo), `:452` (foto about), `:693`, `:697`, `:701`, `:705`, `:709`, `:713` (galería)
- **Qué:** Las 9 referencias a imagen usan URLs `https://agent-cdn.minimax.io/mcp/...`, el CDN temporal del agente que generó la página.
- **Por qué:** Esas URLs no están bajo control del propietario y caducarán o serán purgadas; el sitio perdería logo, favicon, retrato y galería completa de golpe. Además filtra a un tercero las visitas de cada usuario.
- **Fix:** Reemplazar por las rutas locales que **ya existen**: `assets/img/favicon.png`, `assets/img/king-javi-hero.png` (logo), `assets/img/javier-torralba.png` (about), y `rigby-robot.png`, `futuristic-3d.png`, `character-rigging.png`, `maya-project.png`, `robot-happy.png`, `rigby-pointing.png` (galería). Verificar la correspondencia imagen↔tarjeta visualmente.

**P0-2 · El formulario de contacto no envía nada pero confirma éxito**
- **Archivo:línea:** `index.html:743-770` (markup), `:850-854` (handler)
- **Qué:** El submit hace `e.preventDefault()`, muestra `alert('¡Gracias por tu mensaje! Javi te responderá pronto...')` y resetea el formulario. No hay backend, ni `action`, ni atributos `name` en los campos.
- **Por qué:** Es el canal de conversión principal del negocio. Cada visitante que lo use cree haber contactado y nunca recibirá respuesta — pérdida directa de clientes y daño de reputación.
- **Fix:** Conectar a un servicio de formularios estáticos (Formspree, Web3Forms, Netlify Forms si se aloja allí): añadir `action`/`method` o `fetch()` al endpoint, atributos `name` a cada campo, y manejar éxito/error real en la UI (no `alert`). Alternativa mínima inmediata: sustituir el formulario por un botón `mailto:`/WhatsApp hasta tener backend.

**P0-3 · Meta keywords con caracteres chinos (residuo del generador)**
- **Archivo:línea:** `index.html:8`
- **Qué:** `content="...videojuegos, desarrollo游戏"` — "游戏" ("videojuego" en chino) pegado a "desarrollo".
- **Por qué:** Texto corrupto visible para crawlers y para cualquiera que vea el código fuente; señal inequívoca de contenido autogenerado sin revisar. (La meta `keywords` además está obsoleta para SEO.)
- **Fix:** Eliminar la meta `keywords` entera, o como mínimo dejar `content="clases 3D, rigging, animación, maya, blender, zbrush, desarrollo de videojuegos"`.

**P0-4 · Texto visible con errores graves de redacción**
- **Archivo:línea:** `index.html:425` ("Clases **totally** prácticas"), `:632` ("aunque te **sulpas** algo"), `:495` ("ayudarte en todo lo que **puedas cumplir** tus objetivos" — frase rota), `:639` (FAQ "De **infantil y preescolar** hasta adultos" — copiada de una plantilla de clases escolares, no encaja con clases de 3D)
- **Qué:** Errores de idioma y contenido de plantilla sin adaptar en texto visible al usuario.
- **Por qué:** Es la web de un profesor: las faltas y frases sin sentido destruyen credibilidad ante el cliente exacto al que quiere convencer.
- **Fix:** `:425` → "Clases totalmente prácticas"; `:632` → "aunque se te escape algo"; `:495` → "Estoy aquí para ayudarte en todo lo que necesites para cumplir tus objetivos."; `:639` → reescribir con los niveles reales (p. ej. "Desde principiantes absolutos hasta universitarios y profesionales que quieren especializarse").

### P1 — Deberían arreglarse antes de publicar

**P1-1 · Las figuras geométricas del hero son invisibles (Phong sin luces)**
- **Archivo:línea:** `index.html:902-903`
- **Qué:** Los 12 icosaedros usan `THREE.MeshPhongMaterial`, pero la escena no tiene ninguna luz (`AmbientLight`/`DirectionalLight`). Un material Phong sin iluminación se renderiza negro; sobre fondo `#0D0D0D` y con `opacity: 0.25`, las figuras no se ven.
- **Por qué:** Se paga el coste de crear y animar 12 meshes en cada frame para un efecto que no aparece en pantalla.
- **Fix:** Cambiar a `THREE.MeshBasicMaterial` (no necesita luces y para wireframes planos es lo correcto), o añadir `scene.add(new THREE.AmbientLight(0xffffff, 1))`.

**P1-2 · Inyección de HTML sin sanear en el chat (self-XSS) + `innerHTML +=`**
- **Archivo:línea:** `index.html:863` y `:867`
- **Qué:** `msgs.innerHTML += \`<div class="chat-message user">${msg}</div>\`` interpola la entrada del usuario directamente como HTML.
- **Por qué:** Escribir `<img src=x onerror=alert(1)>` en el chat ejecuta script. Hoy solo es self-XSS, pero se vuelve XSS real en cuanto los mensajes se persistan o compartan; además `innerHTML +=` re-parsea todo el contenedor en cada mensaje.
- **Fix:** Construir nodos con `document.createElement('div')` + `textContent = msg` y `appendChild`.

**P1-3 · Acordeón FAQ inaccesible por teclado y lector de pantalla**
- **Archivo:línea:** `index.html:607-647` (markup), `:831-836` (handler)
- **Qué:** `.faq-question` son `<div>` con listener de click: no son enfocables, no responden a Enter/Espacio, y no exponen estado (`aria-expanded`).
- **Por qué:** Un usuario de teclado o lector de pantalla no puede abrir ninguna respuesta de la FAQ — contenido clave (precios, metodología, cancelaciones) inaccesible. Incumple WCAG 2.1.1/4.1.2.
- **Fix:** Convertir cada pregunta en `<button aria-expanded="false" aria-controls="faq-N">` (o usar `<details>/<summary>`, que da todo gratis y elimina el JS y el hack de `max-height: 300px` de `:280`, que además recortaría respuestas largas).

**P1-4 · Labels del formulario sin asociar a sus campos**
- **Archivo:línea:** `index.html:745-767`
- **Qué:** Ningún `<label>` tiene `for` ni los inputs `id`/`name`.
- **Por qué:** Lectores de pantalla anuncian campos sin nombre; clicar el label no enfoca el campo; sin `name`, el formulario no podría enviarse ni con backend (relacionado con P0-2).
- **Fix:** `<label for="nombre">` + `<input id="nombre" name="nombre">` en los 4 campos.

**P1-5 · Enlace de WhatsApp muerto**
- **Archivo:línea:** `index.html:736`
- **Qué:** `<a href="#">WhatsApp (disponible para alumnos)</a>` — promete un canal de contacto y lleva al top de la página.
- **Por qué:** Canal de conversión anunciado que no funciona; el usuario percibe la web como rota.
- **Fix:** Enlazar a `https://wa.me/34XXXXXXXXX` o, si el número es privado, convertirlo en `<span>` sin apariencia de enlace.

**P1-6 · El menú móvil no se cierra al pulsar un enlace**
- **Archivo:línea:** `index.html:826-828` (solo hay toggle), `:373-374`
- **Qué:** Al tocar un enlace del menú desplegable, la página hace scroll a la sección pero el panel `nav-links.active` queda abierto tapando el contenido.
- **Por qué:** En móvil (el grueso del tráfico de una landing así) cada navegación deja el menú superpuesto; UX rota en el flujo principal.
- **Fix:** `document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('active')))`.

**P1-7 · Todo el contenido queda invisible si falla el JS**
- **Archivo:línea:** `index.html:365` (`.reveal { opacity: 0; ... }`) + `:839-847`
- **Qué:** Prácticamente cada bloque de contenido lleva la clase `.reveal` (opacidad 0 por CSS); solo el JS la revela. Con JS bloqueado, fallido o un error anterior en el script, la página se ve vacía. Relacionado: si el CDN de Three.js falla, `new THREE.Scene()` (`:884`) lanza `ReferenceError` — los listeners anteriores ya están registrados, pero es un fallo silencioso evitable.
- **Por qué:** Un único punto de fallo (script inline monolítico + CDN externo) deja una página en negro; también penaliza el renderizado para crawlers sin JS.
- **Fix:** Patrón estándar: añadir clase `js` al `<html>` desde JS y aplicar `opacity: 0` solo bajo `.js .reveal`. Envolver la inicialización de Three.js en `if (typeof THREE !== 'undefined')`.

**P1-8 · Script de Three.js bloqueante en `<head>`**
- **Archivo:línea:** `index.html:17`
- **Qué:** `<script src=".../three.min.js">` sin `defer` en el head: ~600 KB de JS que bloquean el primer render de una página cuyo contenido es texto.
- **Por qué:** Daño directo a FCP/LCP en móvil; el 3D es decorativo y no justifica bloquear el contenido. Tampoco lleva atributo `integrity` (SRI).
- **Fix:** Añadir `defer` aquí y mover el `<script>` inline a `defer`/final con la lógica dependiente de `DOMContentLoaded`; añadir SRI. (Mejor aún: ver propuesta §5 — sustituir Three.js.)

### P2 — Mejoras recomendadas

**P2-1 · SEO social incompleto**
- **Archivo:línea:** `index.html:10-13`
- **Qué:** Se declara `twitter:card: summary_large_image` pero no existe `og:image`, ni `og:url`, ni `<link rel="canonical">`.
- **Por qué:** Al compartir en WhatsApp/Twitter/Discord (justo los canales de su público) la tarjeta sale sin imagen o no valida.
- **Fix:** Añadir `og:image` (1200×630 con el branding), `og:url` y canonical cuando exista dominio; valorar JSON-LD (`Person` + `Service`/`Course`).

**P2-2 · Animación 3D corre siempre, sin respeto a `prefers-reduced-motion`**
- **Archivo:línea:** `index.html:918-932` (rAF incondicional), `:56-61`, `:132-137` (animaciones CSS)
- **Qué:** El loop de render (2000 partículas) sigue ejecutándose con el hero fuera de pantalla y la pestaña visible; ninguna animación respeta `prefers-reduced-motion`.
- **Por qué:** Gasto de batería/CPU constante en móvil y barrera de accesibilidad para usuarios con sensibilidad al movimiento (WCAG 2.3.3).
- **Fix:** Pausar el rAF con `IntersectionObserver` sobre el hero; envolver animaciones CSS en `@media (prefers-reduced-motion: no-preference)` y no iniciar el loop 3D si el usuario prefiere movimiento reducido.

**P2-3 · Imágenes locales sin optimizar y sin lazy-loading**
- **Archivo:línea:** `assets/img/*.png` (1.3–2.1 MB cada una, ~15 MB total), `index.html:693-713`
- **Qué:** Los PNG locales (que deberían usarse tras P0-1) pesan 1.3–2.1 MB; las imágenes de galería no llevan `loading="lazy"` ni `width`/`height`.
- **Por qué:** ~15 MB de imágenes hunden el tiempo de carga móvil; la falta de dimensiones provoca layout shift (CLS).
- **Fix:** Convertir a WebP (calidad 80 ≈ 100–300 KB cada una), añadir `loading="lazy"`, `decoding="async"` y `width`/`height` explícitos.

**P2-4 · Jerarquía de headings rota**
- **Archivo:línea:** `index.html:437-440` (`<h3>` en stats antes de cualquier `<h2>`), `:343` (h4 en chat), `:694+` (h4 en overlays)
- **Qué:** Tras el `<h1>` del hero aparecen `<h3>` (stats) sin `<h2>` previo; varios `<h4>` cuelgan sin nivel intermedio coherente.
- **Por qué:** Los lectores de pantalla navegan por niveles de heading; los saltos desorientan y penalizan levemente el SEO semántico.
- **Fix:** Los números de stats no son headings — usar `<p class="stat-number">`; revisar niveles del resto.

**P2-5 · Listeners de scroll sin throttle y reveal recalculado por elemento**
- **Archivo:línea:** `index.html:821-823`, `:839-847`
- **Qué:** Dos listeners de `scroll` ejecutan trabajo (toggle de clase + `getBoundingClientRect()` sobre ~40 elementos) en cada evento.
- **Por qué:** Trabajo redundante en el hilo principal durante el scroll, perceptible en móviles modestos.
- **Fix:** Sustituir el reveal por `IntersectionObserver` (elimina el listener) y marcar el del navbar como `{ passive: true }`.

**P2-6 · `alert()` como única retroalimentación y estadística "∞ Proyectos / 100% satisfechos"**
- **Archivo:línea:** `index.html:852`, `:439-440`
- **Qué:** `alert()` nativo para confirmar el formulario; stats "∞ Proyectos realizados" y "100% Alumnos satisfechos".
- **Por qué:** El `alert` bloquea y se percibe anticuado; las cifras "∞" y "100%" leen como relleno y restan credibilidad a las stats verificables (7+ años, 3+ años).
- **Fix:** Mensaje de éxito inline en el formulario; sustituir "∞" por una cifra real ("50+ proyectos") y "100%" por algo verificable (nota media en TusClasesParticulares, nº de alumnos).

**P2-7 · Three.js r128 (2021) y emoji como iconografía**
- **Archivo:línea:** `index.html:17`, iconos en `:483/:488/:493/:498/:503/:508` etc.
- **Qué:** Versión de Three.js con 4+ años, previa al cambio a ES Modules; emojis (🎯📹💬🦴🎮🚀) como iconos de servicio, que renderizan distinto en cada SO.
- **Por qué:** r128 funciona pero no recibe fixes; los emoji dan aspecto inconsistente entre plataformas y no son controlables por CSS (color/tamaño exacto).
- **Fix:** Si se conserva Three.js, fijar una versión moderna vía módulos; sustituir emojis por SVG inline (Lucide/Heroicons) con `aria-hidden="true"`.

---

## 3. Observación

El patrón de los defectos cuenta una historia clara: **es output de un agente de IA (MiniMax, según el commit inicial) publicado sin pasada humana**. Las pruebas: imágenes ancladas al CDN interno del agente mientras los assets locales descansan sin usar, caracteres chinos en las meta keywords, anglicismos a medio traducir, una FAQ de plantilla de clases escolares, y un formulario que simula funcionar. Nada de esto es difícil de arreglar — pero ninguno lo arregla la siguiente regeneración: hace falta revisión humana del contenido (idealmente del propio Javi, que es quien conoce sus precios, niveles y canales reales).

Lo positivo también merece mención: la dirección de arte es consistente y vendible, los precios y la propuesta de valor están bien estructurados (el bono destacado, la clase gratis como gancho recurrente), el CSS usa técnicas correctas (`clamp()`, custom properties, `aspect-ratio`) y el sitio es genuinamente una sola petición HTML — buena base para un sitio estático rápido si se ejecutan los fixes de performance.

## 4. Prioridad sugerida de ejecución

1. **Hoy (1–2 h):** P0-1 (imágenes locales), P0-3, P0-4 (textos) — puro buscar/reemplazar.
2. **Antes de publicar (3–4 h):** P0-2 (formulario con Formspree/Web3Forms), P1-1 a P1-6.
3. **Primera iteración post-lanzamiento:** P1-7, P1-8 y los P2 (empezando por imágenes WebP y `og:image`, que son los de mayor impacto/esfuerzo).

## 5. Propuesta de reestructuración

Sin cambiar de stack (sigue siendo un sitio estático sin build, deployable en GitHub Pages/Netlify):

```
king-javi-web/
├── index.html              # solo markup (~450 líneas)
├── css/
│   └── styles.css          # todo el CSS actual (líneas 18-387)
├── js/
│   ├── main.js             # nav, FAQ, reveal (IntersectionObserver), form
│   └── hero-bg.js          # fondo animado, carga diferida
├── assets/
│   └── img/                # ya existe — usar WebP optimizados
├── AUDIT.md
└── CNAME / favicon en raíz
```

Decisiones recomendadas:

1. **Separar CSS y JS a ficheros propios.** Permite caché del navegador entre visitas, diffs legibles, y que un error de sintaxis en JS no viva pegado al contenido. Es la mejora de mantenibilidad de mayor retorno y cero riesgo.
2. **Reconsiderar Three.js.** Se cargan ~600 KB de librería para 2000 puntos dorados y 12 wireframes (hoy invisibles, ver P1-1). El mismo efecto se logra con un canvas 2D propio (~60 líneas, 0 dependencias) o incluso con CSS. Si se mantiene Three.js, cargarlo con `defer` + inicialización perezosa cuando el hero sea visible.
3. **Formulario como decisión de arquitectura, no parche.** Elegir proveedor (Web3Forms y Formspree tienen plan gratuito suficiente) y añadir un honeypot anti-spam. Es el único componente del sitio con estado/backend; merece quedar documentado en el README.
4. **Contenido revisable por el propietario.** Los textos (precios, FAQ, testimonios) están enterrados en 941 líneas. Como mínimo, agrupar las secciones con comentarios claros; si el sitio crece, migrar a un generador estático (Eleventy/Astro) con los textos en Markdown/JSON para que Javi pueda editarlos sin tocar HTML.
5. **Checklist de publicación:** dominio + canonical + `og:image` + favicon local + sitemap.xml/robots.txt + verificación en Search Console. Todo ello depende de decisiones (dominio, hosting) que hoy no están tomadas y conviene fijar antes que cualquier P2.
