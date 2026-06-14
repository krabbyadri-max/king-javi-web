# scripts/

Utilidades **fuera del runtime de la web**. Nada de aquí se despliega ni se
ejecuta en producción: son herramientas auxiliares para Adri.

## Auto-reenvío de submits del formulario → Javi

| Fichero | Qué es |
|---|---|
| [`email-forward.gs`](./email-forward.gs) | Código de Google Apps Script (copia documentada). |
| [`email-forward-SETUP.md`](./email-forward-SETUP.md) | Instrucciones de instalación paso a paso. |

### El problema

El formulario de la web usa **Web3Forms**, y su `access_key` está vinculada a
**krabbyadri@gmail.com**. Por eso todos los envíos del formulario llegan a esa
cuenta y no a Javi.

Cambiar el destinatario en Web3Forms exigiría que **Javi verificara su correo**,
y la indicación es **no molestarle con verificaciones**.

### La solución

Un script de **Google Apps Script** que vive en la cuenta de krabbyadri y, cada
5 minutos:

1. Busca correos **no leídos** del formulario (por etiqueta `WEB-JAVI-FORM`,
   por asunto `[WEB-JAVI]` o por remitente `web3forms.com`).
2. Los **reenvía** a `javi.torralba27@gmail.com` conservando el contenido y
   anotando el remitente original.
3. Los marca como **leídos** y les pone la etiqueta `reenviado-javi`.

Así Javi recibe los mensajes automáticamente, **sin verificar nada**.

### Propiedades clave

- **Idempotente**: cada correo se reenvía una sola vez (etiqueta `reenviado-javi`
  + filtro `-label:reenviado-javi` en la búsqueda).
- **Robusto**: un correo malformado se loguea y se salta; no detiene el resto.
- **Seguro**: el código **no contiene** tokens ni access_keys. Solo usa permisos
  de Gmail de la propia cuenta. Nada de Service Accounts ni OAuth externo.

### ¿Dónde se configura?

En **[script.google.com](https://script.google.com)**, con la cuenta
**krabbyadri@gmail.com**. **No** vive en este repo ni en el de Javi: este
directorio solo guarda una copia para poder revisarlo o reinstalarlo.

👉 Sigue [`email-forward-SETUP.md`](./email-forward-SETUP.md) para ponerlo en marcha.
