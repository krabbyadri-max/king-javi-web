# SETUP — Auto-reenvío de submits del formulario a Javi

Guía paso a paso para **Adri**. Tiempo estimado: 5–10 minutos.
Todo se hace desde la cuenta **krabbyadri@gmail.com** (la que recibe los submits).

> ⚠️ Importante: **NO** hay que tocar Web3Forms ni pedirle nada a Javi.
> Todo el reenvío ocurre dentro de la cuenta de krabbyadri.

---

## 1. Crear las etiquetas en Gmail

Entra en [Gmail](https://mail.google.com) con **krabbyadri@gmail.com** y crea
estas dos etiquetas (menú lateral → *Más* → *Crear etiqueta nueva*):

1. `WEB-JAVI-FORM`  → marca los correos del formulario.
2. `reenviado-javi` → marca los que el script ya reenvió (evita duplicados).

> Los nombres deben coincidir EXACTAMENTE (mayúsculas y guiones incluidos).
> Si te olvidas de crear `reenviado-javi`, el script la crea sola, pero es
> mejor tenerla a mano.

### (Opcional pero recomendado) Filtro que etiqueta automáticamente

Para que los correos del formulario lleven siempre la etiqueta `WEB-JAVI-FORM`:

1. Gmail → barra de búsqueda → icono de filtros (deslizadores).
2. En **De** escribe: `web3forms.com`
   *(o, si configuraste el asunto en Web3Forms, en **Asunto** pon `[WEB-JAVI]`).*
3. *Crear filtro* → marca **Aplicar la etiqueta: `WEB-JAVI-FORM`**.
4. *Crear filtro*.

> El script también detecta los correos por remitente/asunto aunque no haya
> filtro, así que esto es solo un extra de orden.

---

## 2. Crear el proyecto de Apps Script

1. Ve a [script.google.com](https://script.google.com) (logueado como krabbyadri).
2. *Nuevo proyecto*.
3. Borra el contenido de ejemplo y **pega el código completo** de
   [`email-forward.gs`](./email-forward.gs).
4. Ponle nombre al proyecto, p. ej. `Reenvío formulario Javi`.
5. Guarda (icono del disquete o `Ctrl/Cmd + S`).

---

## 3. Autorizar permisos

1. En el desplegable de funciones (arriba) selecciona **`reenviarSubmitsAJavi`**.
2. Pulsa **Ejecutar**.
3. Google pedirá autorización → *Revisar permisos* → elige **krabbyadri@gmail.com**.
4. Aparecerá "Google no ha verificado esta aplicación" → *Configuración avanzada*
   → *Ir a (nombre del proyecto) (no seguro)* → *Permitir*.
   (Es seguro: es tu propio script, solo accede a tu Gmail.)
5. Tras autorizar, la función correrá una vez. Revisa **Ejecuciones** (icono de
   reloj a la izquierda) para ver los logs.

---

## 4. Instalar el trigger (cada 5 minutos)

1. En el desplegable de funciones selecciona **`instalarTrigger`**.
2. Pulsa **Ejecutar**.
3. Listo: ya hay un disparador que ejecuta el reenvío cada 5 minutos.

Puedes comprobarlo en el icono de **Activadores** (reloj/despertador) del menú
lateral: debe aparecer `reenviarSubmitsAJavi` — *Basado en tiempo* — *Cada 5 min*.

> `instalarTrigger` borra cualquier trigger anterior de la misma función antes
> de crear el nuevo, así que puedes ejecutarlo varias veces sin duplicar.

---

## 5. Prueba de fuego

1. Ve a la web y **envía el formulario** con un mensaje de prueba.
2. Espera unos minutos (hasta 5, por el intervalo del trigger) — o ejecuta
   `reenviarSubmitsAJavi` a mano para no esperar.
3. Verifica que el correo llega a **javi.torralba27@gmail.com**.
4. En la cuenta de krabbyadri, el correo del formulario debería quedar:
   - marcado como **leído**,
   - con la etiqueta **`reenviado-javi`**.

Si todo eso ocurre: **funciona**. A partir de ahora es 100% automático.

---

## Resolución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| No llega nada a Javi | El trigger no está instalado | Ejecuta `instalarTrigger` |
| No detecta los correos | Remitente/asunto distintos | Revisa la query en `email-forward.gs` (`DOMINIO_WEB3FORMS`, `TAG_ASUNTO`) |
| Se reenvía dos veces | Falta la etiqueta `reenviado-javi` | Créala (paso 1) o deja que el script la cree |
| Error de permisos | Autorización caducada | Vuelve a ejecutar `reenviarSubmitsAJavi` y reautoriza |

Para ver qué pasó en cada ejecución: menú lateral → **Ejecuciones** → abre la
última y lee los `Logger.log`.
