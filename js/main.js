        // Mark JS as available so reveal-on-scroll can take effect
        document.documentElement.classList.add('js');
        // Loader
        window.addEventListener('load', () => {
            setTimeout(() => document.getElementById('loader').classList.add('hidden'), 800);
        });
        
        // Nav scroll effect (P2-5: passive listener)
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
        
        // Mobile nav
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
            navLinks.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => navLinks.classList.remove('active'));
            });
        }
        
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(q => {
            q.setAttribute('role', 'button');
            q.setAttribute('tabindex', '0');
            q.setAttribute('aria-expanded', 'false');
            const answer = q.nextElementSibling;
            if (answer) answer.setAttribute('aria-hidden', 'true');
            const toggle = () => {
                const item = q.parentElement;
                const isActive = item.classList.toggle('active');
                q.setAttribute('aria-expanded', isActive);
                if (answer) answer.setAttribute('aria-hidden', !isActive);
            };
            q.addEventListener('click', toggle);
            q.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
        
        // Reveal on scroll (P2-5: IntersectionObserver replaces scroll+getBoundingClientRect)
        const reveals = document.querySelectorAll('.reveal');
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        io.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -80px 0px', threshold: 0 });
            reveals.forEach(el => io.observe(el));
        } else {
            // Fallback para navegadores sin IntersectionObserver
            const revealOnScroll = () => {
                reveals.forEach(el => {
                    const top = el.getBoundingClientRect().top;
                    if (top < window.innerHeight - 80) el.classList.add('active');
                });
            };
            window.addEventListener('scroll', revealOnScroll, { passive: true });
            revealOnScroll();
        }
        
        // Form submission
        document.getElementById('contact-form').addEventListener('submit', async e => {
            e.preventDefault();
            const status = document.getElementById('form-status');
            const submit = e.target.querySelector('button[type="submit"]');
            const originalText = submit.textContent;
            submit.disabled = true;
            submit.textContent = 'Enviando...';
            status.textContent = '';
            try {
                const res = await fetch(e.target.action, {
                    method: 'POST',
                    body: new FormData(e.target),
                    headers: { 'Accept': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    status.textContent = '¡Gracias! Javi te responderá pronto a tu email.';
                    status.style.color = '#4ade80';
                    e.target.reset();
                } else {
                    status.textContent = 'Error: ' + (data.message || 'no se pudo enviar');
                    status.style.color = '#ef4444';
                }
            } catch (err) {
                status.textContent = 'Error de red. Intenta de nuevo o escríbeme directo por WhatsApp.';
                status.style.color = '#ef4444';
            } finally {
                submit.disabled = false;
                submit.textContent = originalText;
            }
        });
        
        // ====================================================================
        // Chat IA — habla COMO Javi vía proxy a Claude (no expone la API key).
        // El endpoint es el Worker de Cloudflare / función de Vercel (ver api/).
        // ⚠️  REEMPLAZA CHAT_ENDPOINT por la URL real tras desplegar el backend.
        //   - Cloudflare: https://kingjavi-chat.<tu-subdominio>.workers.dev
        //   - Vercel:     https://<tu-proyecto>.vercel.app/api/chat
        // ====================================================================
        const CHAT_ENDPOINT = 'https://kingjavi-chat.EXAMPLE.workers.dev';
        const MAX_USER_MESSAGES = 10; // tope por sesión para no quemar presupuesto
        const chatHistory = [];       // [{role:'user'|'assistant', content}] — NO se persiste
        let userMsgCount = 0;
        let chatBusy = false;

        function toggleChat() { document.getElementById('chat-box').classList.toggle('active'); }

        // Crea una burbuja y devuelve su nodo (para poder ir rellenándolo en streaming).
        function appendChat(role, msg) {
            const msgs = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.className = 'chat-message ' + role;
            div.textContent = msg;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
            return div;
        }

        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const msg = input.value.trim();
            if (!msg || chatBusy) return;

            if (userMsgCount >= MAX_USER_MESSAGES) {
                appendChat('bot', 'Hemos hablado un montón 😄 Para seguir, escríbeme directamente a javi.torralba27@gmail.com y te respondo en menos de 24h. 👑');
                return;
            }

            chatBusy = true;
            userMsgCount++;
            appendChat('user', msg);
            input.value = '';
            chatHistory.push({ role: 'user', content: msg });

            const botDiv = appendChat('bot', '…');
            const msgs = document.getElementById('chatMessages');
            let answer = '';

            try {
                const res = await fetch(CHAT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: chatHistory })
                });

                if (!res.ok || !res.body) {
                    let errMsg = 'Ahora mismo no puedo responder. Escríbeme a javi.torralba27@gmail.com 👑';
                    try { const e = await res.json(); if (e && e.error) errMsg = e.error; } catch (_) {}
                    botDiv.textContent = errMsg;
                    chatHistory.pop(); // no dejamos el turno colgado en el historial
                    return;
                }

                // Leemos el stream SSE de Claude (eventos content_block_delta).
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // la última línea puede estar incompleta
                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;
                        const payload = line.slice(5).trim();
                        if (!payload || payload === '[DONE]') continue;
                        try {
                            const evt = JSON.parse(payload);
                            if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
                                answer += evt.delta.text;
                                botDiv.textContent = answer;
                                msgs.scrollTop = msgs.scrollHeight;
                            }
                        } catch (_) { /* línea parcial o evento no-JSON: la ignoramos */ }
                    }
                }

                if (answer.trim()) {
                    chatHistory.push({ role: 'assistant', content: answer });
                } else {
                    botDiv.textContent = 'No me ha llegado respuesta. Prueba de nuevo o escríbeme a javi.torralba27@gmail.com 👑';
                    chatHistory.pop();
                }
            } catch (err) {
                botDiv.textContent = 'Error de conexión. Inténtalo de nuevo o escríbeme a javi.torralba27@gmail.com 👑';
                chatHistory.pop();
            } finally {
                chatBusy = false;
                input.focus();
            }
        }
        document.getElementById('chatInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
        
        // Three.js Background — se omite si el usuario prefiere movimiento reducido
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const canvas = document.getElementById('hero-canvas');
        if (!prefersReducedMotion && typeof THREE !== 'undefined') initThreeBackground();
        function initThreeBackground() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Particles
        const pGeo = new THREE.BufferGeometry();
        const pCount = 2000;
        const pArr = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) pArr[i] = (Math.random() - 0.5) * 12;
        pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
        const pMat = new THREE.PointsMaterial({ size: 0.008, color: 0xD4AF37, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);
        
        // Geometric shapes
        const shapes = [];
        const mat1 = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.25 });
        const mat2 = new THREE.MeshBasicMaterial({ color: 0x1E90FF, wireframe: true, transparent: true, opacity: 0.25 });
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.IcosahedronGeometry(Math.random() * 0.25 + 0.08);
            const mesh = new THREE.Mesh(geo, i % 2 ? mat1 : mat2);
            mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5 - 3);
            mesh.userData = { rotSpeed: (Math.random() - 0.5) * 0.008, floatSpeed: Math.random() * 0.5 + 0.3, floatOff: Math.random() * Math.PI * 2 };
            shapes.push(mesh);
            scene.add(mesh);
        }
        
        camera.position.z = 4;
        
        let mx = 0, my = 0;
        document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = -(e.clientY / window.innerHeight) * 2 + 1; });
        
        function animate() {
            requestAnimationFrame(animate);
            const t = Date.now() * 0.001;
            shapes.forEach(s => {
                s.rotation.x += s.userData.rotSpeed;
                s.rotation.y += s.userData.rotSpeed * 0.5;
                s.position.y += Math.sin(t * s.userData.floatSpeed + s.userData.floatOff) * 0.001;
            });
            particles.rotation.y += 0.0003;
            particles.rotation.x += 0.0001;
            camera.position.x += (mx * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (my * 0.5 - camera.position.y) * 0.02;
            renderer.render(scene, camera);
        }
        animate();
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        } // fin initThreeBackground
