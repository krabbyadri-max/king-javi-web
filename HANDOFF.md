# Session Handoff — Web King Javi + Telegram Setup

## Contexto del proyecto
Estás continuando una sesión de Hermes (la anterior terminó con el límite de
context o se cerró). Esta sesión nueva es la "home" del gateway de Telegram
(@Metal_HermesmonBOT, chat 904320431 con Adrimicod).

## Quién es el usuario
- Adrián López (krabbyadri@gmail.com / adri.lompean@gmail.com / adririemann)
- Trabaja con un amigo suyo, Javi (Javier Torralba Sánchez, javi.torralba27@gmail.com)
- Quiere que Hermes le gestione la web de Javi y se comunique con él por email y Telegram

## Web "King Javi" — Estado al 13 de junio 2026
Repo: https://github.com/krabbyadri-max/king-javi-web
Local: ~/projects/king-javi-web/
Rama: main, 9+ commits, todo pusheado

### Lo que está hecho
- AUDIT.md escrito por Fable (Claude 4.5 con 1M de contexto). 195 líneas.
  P0/P1/P2 priorizados con archivo:línea|qué|por qué|fix.
- Fixes P0 aplicados: 9 imágenes del CDN de MiniMax → assets/img/*.webp locales
  (94% menos peso, 14MB → 756KB), favicon.svg propio, keywords sin chino,
  4 erratas de texto.
- Fixes P1 aplicados: P1-1 (3D figuras visibles con MeshBasicMaterial),
  P1-2 (XSS del chat con createElement), P1-3 (FAQ accesible con teclado),
  P1-6 (menú móvil se cierra al navegar), P1-7 (clase .js para reveal),
  P1-8 (defer en Three.js).
- Fixes P2 aplicados: P2-6 (stats irreales → "50+ alumnos, 4.9 valoracion"),
  og:image 1200×630 generado.
- Formulario de contacto conectado a Web3Forms (access_key:
  cheZUKwK-GFDo0JXCVJhY62Q7xVHstD8qkaSUcaVaeg). **PENDIENTE: email real de
  Javi para que el form le llegue a él**.

### Decisiones pendientes con Javi (esperando respuesta)
- ¿Qué cambiar? ¿Dominio? ¿WhatsApp público? ¿RGPD? ¿Quién da clases? ¿Sistema de reservas?
- Email real para Web3Forms

### Decisiones pendientes con Adrián
- Token de Vercel para deploy (https://vercel.com/account/tokens)
- ¿Email de Javi para que le llegue el form?

## Telegram — Estado
- Bot: @Metal_HermesmonBOT (token en /Users/krabby/.hermes/.env como TELEGRAM_BOT_TOKEN)
- chat_id: 904320431
- Gateway nativo de Hermes: ACTIVO (PID 33186)
- OpenClaw gateway VIEJO: PARADO (era el que monopolizaba el bot)
- /sethome ejecutado: ahora el chat es la home channel
- Sesión Telegram: agent:main:telegram:dm:904320431

### Limitación actual
El gateway nativo arranca sesiones hijas por chat. Para que la CLI sea la
misma sesión que Telegram, hay que dejar esta sesión CLI abierta y hacer
que el gateway le inyecte los mensajes. Eso requiere que esta terminal
sea tmux/hermes-chat y esté siempre activa.

## Bridge Python (legacy, ya no se usa)
~/projects/king-javi-web/bridge/telegram_bridge.py
Mato el proceso. NO usar más.

## Email
- Conectado a krabbyadri@gmail.com vía himalaya CLI (App Password)
- Correo a Javi enviado: "Re: Web Javi — siguiente ronda" con resumen
  de bugs y preguntas

## Skills instaladas / activas
- claude-code (Fable como modelo de subagente)
- himalaya (email)
- github (PR workflow, repo management, code review)
- plan
- requesting-code-review
- claude-design
- dogfood
- humanizer
- simplify-code
- spike
- web de skills de creative (ascii-art, excalidraw, etc — disponibles)

## Claude Code con Fable
- Fable es el nuevo modelo de Anthropic (1M contexto, model id `claude-fable-5`)
- Acceso: `claude -p "..." --model fable --max-turns N --allowedTools "Read,Edit,Write,..."`
- Auth OAuth renovada, expira cada ~24h. Si da 401, lanzar `claude auth login`
  vía PTY y seguir el flujo OAuth.

## Cómo se está comunicando Adrián con esta sesión
1. Por esta terminal (la que ahora mismo está abierta)
2. Por Telegram vía el bot (cuando el handoff esté configurado
   correctamente, los mensajes deberían llegar a esta terminal)

## Importante para esta sesión
- Cuando el usuario (Adrián) escribe por Telegram, el gateway intenta
  hacer handoff a la sesión home. Si está activa, llega aquí. Si no,
  el gateway la procesa con su sesión hija (independiente de esta).
- Si Adrián está físicamente en esta terminal, puede escribir directamente
  y obtener respuestas inmediatas.
- El proyecto king-javi-web es el foco principal de trabajo.
