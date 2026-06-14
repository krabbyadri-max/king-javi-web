/**
 * ============================================================================
 *  AUTO-REENVÍO DE SUBMITS DEL FORMULARIO WEB → JAVI
 * ============================================================================
 *
 *  ¿QUÉ HACE?
 *  Web3Forms entrega los envíos del formulario de la web a krabbyadri@gmail.com
 *  (porque así está vinculada la access_key). Javi no puede cambiar el
 *  destinatario sin verificar su correo, y la orden es NO molestarle con
 *  verificaciones. Este script de Google Apps Script vive en la cuenta de
 *  krabbyadri y, cada pocos minutos, busca los correos del formulario y los
 *  reenvía automáticamente a javi.torralba27@gmail.com.
 *
 *  ¿DÓNDE VIVE?
 *  En script.google.com, NO en el repositorio de Javi. Este fichero .gs es
 *  solo una copia documentada por si Adri quiere revisar o reinstalar el código.
 *
 *  CARACTERÍSTICAS
 *   - Idempotente: cada correo se reenvía UNA sola vez (se etiqueta al reenviar).
 *   - Robusto: un correo malformado no detiene el procesamiento del resto.
 *   - Seguro: no contiene tokens ni access_keys; usa solo permisos de Gmail.
 *   - Logs claros: usa Logger.log() para poder depurar desde "Ejecuciones".
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
//  CONFIGURACIÓN  (ajusta aquí si algún día cambia algo)
// ---------------------------------------------------------------------------

/** Dirección final a la que queremos que lleguen los submits. */
var DESTINO_JAVI = 'javi.torralba27@gmail.com';

/** Etiqueta de Gmail que marca los correos del formulario a reenviar.
 *  Créala en Gmail con este nombre EXACTO (ver email-forward-SETUP.md).
 *  Puedes asignarla con un filtro de Gmail, o el script la detecta por
 *  remitente/asunto aunque no esté aplicada (ver QUERY_BUSQUEDA). */
var LABEL_ORIGEN = 'WEB-JAVI-FORM';

/** Etiqueta que se aplica DESPUÉS de reenviar, para no duplicar nunca. */
var LABEL_REENVIADO = 'reenviado-javi';

/** Texto que el asunto del correo del formulario suele contener.
 *  Web3Forms permite fijar un "subject"; si lo configuras con [WEB-JAVI]
 *  el script lo detecta aunque no haya filtro de etiqueta. */
var TAG_ASUNTO = '[WEB-JAVI]';

/** Dominio remitente de Web3Forms (los avisos llegan desde aquí). */
var DOMINIO_WEB3FORMS = 'web3forms.com';

/** Máximo de conversaciones a procesar por ejecución (defensa anti-avalancha). */
var MAX_HILOS_POR_EJECUCION = 25;

// ---------------------------------------------------------------------------
//  FUNCIÓN PRINCIPAL  (la que ejecuta el trigger cada 5 minutos)
// ---------------------------------------------------------------------------

/**
 * Busca correos no leídos del formulario, los reenvía a Javi, los marca como
 * leídos y los etiqueta como reenviados para garantizar idempotencia.
 */
function reenviarSubmitsAJavi() {
  Logger.log('=== INICIO reenviarSubmitsAJavi ===');

  // Aseguramos que la etiqueta de "reenviado" exista (la creamos si falta).
  var labelReenviado = obtenerOCrearEtiqueta(LABEL_REENVIADO);

  // Construimos la query de búsqueda de Gmail.
  // Reenviamos solo lo que:
  //   - está sin leer (is:unread)
  //   - NO está ya etiquetado como reenviado (-label:reenviado-javi)
  //   - Y coincide con el formulario por etiqueta, asunto o remitente.
  var query = construirQueryBusqueda();
  Logger.log('Query Gmail: ' + query);

  var hilos = GmailApp.search(query, 0, MAX_HILOS_POR_EJECUCION);
  Logger.log('Conversaciones encontradas: ' + hilos.length);

  var reenviados = 0;
  var omitidos = 0;
  var errores = 0;

  for (var i = 0; i < hilos.length; i++) {
    var hilo = hilos[i];
    try {
      // Doble seguro de idempotencia: si el hilo ya tiene la etiqueta de
      // reenviado, lo saltamos aunque la query lo haya devuelto.
      if (hiloYaReenviado(hilo, LABEL_REENVIADO)) {
        omitidos++;
        continue;
      }

      var mensajes = hilo.getMessages();
      var algunoReenviado = false;

      for (var j = 0; j < mensajes.length; j++) {
        var mensaje = mensajes[j];

        // Solo reenviamos mensajes no leídos (los leídos ya se procesaron antes).
        if (!mensaje.isUnread()) {
          continue;
        }

        if (reenviarMensaje(mensaje)) {
          algunoReenviado = true;
          reenviados++;
        }
      }

      if (algunoReenviado) {
        // Marcamos como leído y etiquetamos: así nunca se vuelve a reenviar.
        hilo.markRead();
        hilo.addLabel(labelReenviado);
        Logger.log('Hilo reenviado y etiquetado: "' + hilo.getFirstMessageSubject() + '"');
      } else {
        omitidos++;
      }

    } catch (e) {
      // Un correo problemático NO debe tumbar el resto del proceso.
      errores++;
      Logger.log('ERROR procesando un hilo: ' + e + ' (continuamos con el siguiente)');
    }
  }

  Logger.log('Resumen -> reenviados: ' + reenviados +
             ' | omitidos: ' + omitidos +
             ' | errores: ' + errores);
  Logger.log('=== FIN reenviarSubmitsAJavi ===');
}

// ---------------------------------------------------------------------------
//  FUNCIONES AUXILIARES
// ---------------------------------------------------------------------------

/**
 * Construye la query de Gmail. Combina varias señales para detectar los
 * correos del formulario aunque no tengan la etiqueta aplicada por un filtro.
 * @return {string} query lista para GmailApp.search()
 */
function construirQueryBusqueda() {
  // Cada término entre paréntesis es una forma alternativa de identificar
  // un correo del formulario. Unidos con OR.
  var señales = [
    'label:' + LABEL_ORIGEN,                 // si hay filtro que aplica la etiqueta
    'subject:"' + TAG_ASUNTO + '"',          // si el asunto lleva el tag
    'from:' + DOMINIO_WEB3FORMS              // si llega directamente de Web3Forms
  ];

  return 'is:unread ' +
         '-label:' + LABEL_REENVIADO + ' ' +
         '(' + señales.join(' OR ') + ')';
}

/**
 * Reenvía un único mensaje a Javi conservando lo máximo posible del original.
 * @param {GmailMessage} mensaje  el mensaje a reenviar
 * @return {boolean} true si se reenvió correctamente
 */
function reenviarMensaje(mensaje) {
  try {
    var remitenteOriginal = mensaje.getFrom();   // p.ej. "Web3Forms <...@web3forms.com>"
    var asuntoOriginal = mensaje.getSubject() || '(sin asunto)';

    // Nota informativa que se antepone al cuerpo reenviado, para que Javi
    // sepa de dónde viene y quién lo envió originalmente.
    var nota =
      '— Reenviado automáticamente desde el formulario de la web —\n' +
      'Remitente original: ' + remitenteOriginal + '\n' +
      'Asunto original: ' + asuntoOriginal + '\n' +
      '------------------------------------------------------------\n\n';

    // forward() conserva el cuerpo y los adjuntos del mensaje original.
    // Anteponemos la nota mediante el parámetro htmlBody/ y body.
    mensaje.forward(DESTINO_JAVI, {
      subject: '[Formulario web] ' + asuntoOriginal,
      htmlBody: nota.replace(/\n/g, '<br>') + (mensaje.getBody() || ''),
    });

    Logger.log('  -> reenviado a ' + DESTINO_JAVI + ' | asunto: "' + asuntoOriginal + '"');
    return true;

  } catch (e) {
    // Si un mensaje concreto falla (malformado, adjunto raro...), lo logueamos
    // y devolvemos false; el hilo NO se etiquetará y se reintentará la próxima vez.
    Logger.log('  !! No se pudo reenviar un mensaje: ' + e);
    return false;
  }
}

/**
 * Comprueba si un hilo ya tiene la etiqueta de reenviado.
 * @param {GmailThread} hilo
 * @param {string} nombreLabel
 * @return {boolean}
 */
function hiloYaReenviado(hilo, nombreLabel) {
  try {
    var labels = hilo.getLabels();
    for (var k = 0; k < labels.length; k++) {
      if (labels[k].getName() === nombreLabel) {
        return true;
      }
    }
    return false;
  } catch (e) {
    // Ante la duda, devolvemos false para no perder un reenvío; la query y la
    // etiqueta posterior siguen protegiendo contra duplicados.
    Logger.log('Aviso: no se pudieron leer etiquetas de un hilo: ' + e);
    return false;
  }
}

/**
 * Devuelve la etiqueta indicada, creándola si no existe.
 * @param {string} nombre
 * @return {GmailLabel}
 */
function obtenerOCrearEtiqueta(nombre) {
  var label = GmailApp.getUserLabelByName(nombre);
  if (!label) {
    label = GmailApp.createLabel(nombre);
    Logger.log('Etiqueta creada: ' + nombre);
  }
  return label;
}

// ---------------------------------------------------------------------------
//  INSTALADOR DEL TRIGGER  (ejecútalo UNA sola vez a mano)
// ---------------------------------------------------------------------------

/**
 * Crea el disparador que ejecuta reenviarSubmitsAJavi() cada 5 minutos.
 * Antes de crearlo, elimina cualquier trigger previo de la misma función para
 * evitar duplicados si lo ejecutas más de una vez.
 *
 * CÓMO USARLO: en el editor de Apps Script, selecciona esta función
 * "instalarTrigger" en el desplegable y pulsa "Ejecutar". Autoriza los
 * permisos cuando te los pida. Solo hay que hacerlo una vez.
 */
function instalarTrigger() {
  // Limpiamos triggers antiguos de esta misma función (idempotencia del setup).
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'reenviarSubmitsAJavi') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('Trigger antiguo eliminado.');
    }
  }

  // Creamos el nuevo trigger: cada 5 minutos.
  ScriptApp.newTrigger('reenviarSubmitsAJavi')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Trigger instalado: reenviarSubmitsAJavi cada 5 minutos.');
}
