/*
 * anime.js v4 — microanimaciones King Javi
 * ---------------------------------------------------------------------------
 * PLAN — 4 microanimaciones discretas (premium, NO "show"):
 *
 *   1. Hero H1 "reveal" por PALABRAS con stagger desde abajo + opacity, al load.
 *      → Se eligió palabra (no letra) a propósito: es más elegante para una
 *        marca profesional y NO rompe el degradado dorado de `.gold`
 *        (un split por letras daría a cada letra el gradiente completo).
 *
 *   2. Stats counter: los 4 números (7+, 50+, 3+, 4.9★) cuentan 0→valor con
 *      ease-out cuando entran en viewport. Refuerza "datos reales".
 *
 *   3. Service icon "float" en hover: SOLO el icono SVG flota (translateY -4px
 *      + leve rotación). El "lift" de la card lo sigue haciendo el CSS
 *      (`.service-card:hover`) — así NO peleamos contra una animación CSS
 *      existente; anime.js complementa, no duplica.
 *
 *   4. SVG icons "draw-on": los trazos de los iconos Lucide se dibujan con
 *      stroke-dashoffset cuando la card entra en viewport (~800ms). Da
 *      sensación de "se está construyendo".
 *
 * REGLAS:
 *   - Todo bajo prefers-reduced-motion: no-preference. Si reduce → nada.
 *   - Low-power (hardwareConcurrency < 4): se omiten las 2 animaciones que
 *     tocan muchos elementos (hero split + svg draw); se mantienen las
 *     baratas y bajo demanda (counter + hover).
 *   - Three.js e IntersectionObserver de reveal NO se tocan: se complementan.
 *   - Sin este bundle (404, JS off): la web se ve y funciona igual — ningún
 *     estado inicial se fija vía CSS, sólo vía JS justo antes de animar.
 *   - Import sólo de lo que se usa → esbuild tree-shake → bundle pequeño.
 * ---------------------------------------------------------------------------
 */

import { animate, stagger, createDrawable } from 'animejs';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Dispositivos de baja potencia: reducimos carga de animación.
const lowPower =
  typeof navigator.hardwareConcurrency === 'number' &&
  navigator.hardwareConcurrency < 4;

// Si el usuario pide movimiento reducido, no animamos absolutamente nada.
if (!reduceMotion) {
  // Cada feature en su propio try/catch: un fallo aislado no tumba el resto.
  const safe = (fn) => {
    try { fn(); } catch (_) { /* fallback: el contenido ya es visible sin JS */ }
  };

  // ---- 1. Hero H1 reveal por palabras --------------------------------------
  // (se omite en low-power: toca muchos nodos nuevos)
  const heroSplit = () => {
    if (lowPower) return;
    const h1 = document.querySelector('.hero h1');
    if (!h1) return;

    // Construimos "tokens": cada palabra de un nodo de texto es un token;
    // el span .gold entero es UN token (mantiene el degradado continuo).
    const tokens = [];
    Array.from(h1.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (part.trim() === '') {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'anim-word';
            span.textContent = part;
            frag.appendChild(span);
            tokens.push(span);
          }
        });
        h1.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.classList.add('anim-word');
        tokens.push(node);
      }
    });
    if (!tokens.length) return;

    // .anim-word es inline-block para poder transformar (regla CSS de fallback).
    tokens.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(0.5em)';
    });
    animate(tokens, {
      opacity: [0, 1],
      translateY: ['0.5em', '0em'],
      duration: 900,
      delay: stagger(70),
      ease: 'out(3)',
    });
  };

  // ---- 2. Stats counter ----------------------------------------------------
  const statsCounter = () => {
    const nums = document.querySelectorAll('.stat-number');
    if (!nums.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);

        const raw = el.textContent.trim();
        const match = raw.match(/^([\d.,]+)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[1].replace(',', '.'));
        const suffix = match[2] || '';
        const decimals = (match[1].split('.')[1] || '').length;
        if (Number.isNaN(target)) return;

        const proxy = { v: 0 };
        el.textContent = '0' + suffix;
        animate(proxy, {
          v: target,
          duration: 1600,
          ease: 'out(3)',
          onUpdate: () => {
            el.textContent = proxy.v.toFixed(decimals) + suffix;
          },
          onComplete: () => {
            el.textContent = target.toFixed(decimals) + suffix;
          },
        });
      });
    }, { threshold: 0.4 });

    nums.forEach((el) => io.observe(el));
  };

  // ---- 3. Service icon float en hover --------------------------------------
  // El "lift" de la card lo hace el CSS; aquí sólo flota el icono.
  const iconHover = () => {
    document.querySelectorAll('.service-card').forEach((card) => {
      const icon = card.querySelector('.service-icon');
      if (!icon) return;
      card.addEventListener('mouseenter', () => {
        animate(icon, {
          translateY: -4,
          rotate: '2deg',
          duration: 260,
          ease: 'out(2)',
        });
      });
      card.addEventListener('mouseleave', () => {
        animate(icon, {
          translateY: 0,
          rotate: '0deg',
          duration: 260,
          ease: 'out(2)',
        });
      });
    });
  };

  // ---- 4. SVG draw-on ------------------------------------------------------
  // (se omite en low-power)
  const svgDraw = () => {
    if (lowPower || !('IntersectionObserver' in window)) return;
    const icons = document.querySelectorAll('.service-icon svg');
    if (!icons.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const svgEl = entry.target;
        io.unobserve(svgEl);

        const shapes = svgEl.querySelectorAll('path, line, circle, rect, polyline, polygon, ellipse');
        if (!shapes.length) return;
        const drawables = createDrawable(shapes);
        animate(drawables, {
          draw: ['0 0', '0 1'],
          duration: 800,
          delay: stagger(60),
          ease: 'inOutSine',
        });
      });
    }, { threshold: 0.3 });

    icons.forEach((el) => io.observe(el));
  };

  // El hero arranca tras load para no tocar FCP; el resto bajo demanda (IO/hover).
  if (document.readyState === 'complete') {
    safe(heroSplit);
  } else {
    window.addEventListener('load', () => safe(heroSplit), { once: true });
  }
  safe(statsCounter);
  safe(iconHover);
  safe(svgDraw);
}
