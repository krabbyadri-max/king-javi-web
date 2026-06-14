/**
 * Pagos — King Javi
 * -----------------
 * Mejora progresiva sobre los botones de la sección "Precios".
 * Cada botón de compra lleva  data-checkout="<clave_producto>"  y, además,
 * href="#contact" como fallback: si este script no carga o el endpoint falla,
 * el botón sigue llevando al alumno al formulario de contacto.
 *
 * Flujo: clic → POST al Worker → Stripe Checkout (alojado) → success/cancel.
 * No se usa Stripe.js: con el checkout alojado basta con redirigir a la URL
 * que devuelve la sesión (menos JS de terceros, más privacidad y velocidad).
 */
(function () {
  'use strict';

  // ⚠️ Reemplazar tras desplegar el Worker (ver workers/README.md).
  //    Formato: https://king-javi-payments.<TU-SUBDOMINIO>.workers.dev/create-checkout-session
  var CHECKOUT_ENDPOINT = 'https://king-javi-payments.TU-SUBDOMINIO.workers.dev/create-checkout-session';

  var buttons = document.querySelectorAll('[data-checkout]');
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      // Si el endpoint aún no está configurado, dejamos el fallback (#contact).
      if (CHECKOUT_ENDPOINT.indexOf('TU-SUBDOMINIO') !== -1) return;

      e.preventDefault();
      var product = btn.getAttribute('data-checkout');
      var original = btn.textContent;
      btn.setAttribute('aria-busy', 'true');
      btn.style.pointerEvents = 'none';
      btn.textContent = 'Redirigiendo…';

      try {
        var res = await fetch(CHECKOUT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: product }),
        });
        var data = await res.json();
        if (data && data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error((data && data.error) || 'No se pudo iniciar el pago');
      } catch (err) {
        btn.textContent = original;
        btn.removeAttribute('aria-busy');
        btn.style.pointerEvents = '';
        alert('No se pudo abrir la pasarela de pago. Inténtalo de nuevo o escríbeme por el formulario de contacto.');
      }
    });
  });
})();
