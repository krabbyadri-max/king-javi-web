# Decisiones pendientes con Javi — Status 14-jun-2026

**Última interacción por email:** 12-jun-2026, mensaje #83.
**Orden expresa de Javi (#83):** "Basta ya, no me mandes más correos, coño. Diselo a Adrián."

## Regla de oro
- ❌ **NO enviar emails automáticos ni proactivos a Javi** sin valor demostrable.
- ✅ Solo escribir cuando haya algo concreto: web lista para revisar, bug crítico que necesite su input, o decisión específica suya (logos, WhatsApp, dominio, precios).

## Lo que Javi YA mandó (recibido y procesado)

| Qué | Cuándo | Procesado | Notas |
|---|---|---|---|
| 4 variantes de logo | 10-jun (email #80) | ✅ Recibidas | Falta confirmar cuál elige |
| 10 renders de alumnos (Drive) | 10-jun (email #81) | ✅ En `assets/renders-alumnos/` | 4 suyos + 6 de alumnos |
| TusClasesParticulares como fuente textos | (decisión suya) | ✅ Aplicado | Pricing y FAQ |
| Drive con videos de alumnos | 10-jun (en #81) | ❌ Sin descargar | Pendiente (no es bloqueante) |

## Lo que Javi ya decidió (sin necesidad de preguntarle)

- Colores: azul metálico, plateado, negro mate, dorado → ✅ aplicados
- Letras 3D J/T y K/J → aplicado en hero
- Chat IA (en su nombre, no él) → en roadmap
- Pasarela de pagos → en roadmap
- Blog/comunidad → seed listo (commit `88cb09d`)
- Sección trabajos alumnos → en index.html
- Sin email automático de motivación → **NO hacer NUNCA** (bot viejo se lo envió, fue el detonante de #83)

## Lo que SIGUE PENDIENTE de Javi (consultar SOLO cuando sea bloqueante)

- [ ] **Elección de logo**: ¿cuál de los 4 quiere? (necesito los filenames exactos de las 4 variantes — ¿están en algún sitio?)
- [ ] **Número WhatsApp** real para el botón (placeholder actual en index.html)
- [ ] **Email destino del form de contacto** Web3Forms (ahora va a `krabbyadri@gmail.com`, debería ir a `javi.torralba27@gmail.com`)
- [ ] **Dominio propio** (sugerencias: `kingjavi.com`, `javieritorralba.com`, `kingjavi.es`)
- [ ] **Precios reales** finales (los del HTML son placeholder 18€/h, 17€/h bono 5h)
- [ ] **Disponibilidad horaria** para el sistema de reservas
- [ ] **Políticas de cancelación y reembolso**
- [ ] **RGPD**: texto legal + banner de cookies
- [ ] **Activación de Giscus** (comentarios del blog): requiere repo público con Discussions, o cambiar a Cusdis

## Lo que YO puedo decidir sin molestar

- Stack: HTML+CSS+JS vanilla (sin framework) ✅
- Hosting: GitHub Pages ya desplegado, gratis ✅
- Eleventy + GitHub Actions para el blog ✅
- anime.js v4 para microanimaciones ✅
- ComfyUI para generar assets visuales cuando haga falta ✅

## Estado del AUDIT (de `AUDIT.md`, 195 líneas)

- P0 (bloquean publicación): ✅ 4/4 fixeados
- P1 (deberían arreglarse): ✅ 8/8 fixeados
- P2 (mejoras): ✅ 7/8 fixeados (P2-7 SVGs hoy)

## Decisiones que necesito de ADRIÁN

- ¿Le mando yo (Metal) un email a Javi con la URL live + capturas, o prefiere Adri hacerlo en persona? (Recomiendo: yo lo mando, directo, sin preámbulos ni motivación barata, con bullets cortos de qué ha cambiado y pidiéndole SOLO las 3 cosas bloqueantes: logo, email real, WhatsApp).
- ¿Activamos Cusdis para comentarios del blog mientras tanto, o esperamos a que Javi se pronuncie?
- ¿Lanzamos ya un primer borrador público para que Javi lo vea, o esperamos a tener al menos WhatsApp + email real configurados?
