        // Mark JS as available so reveal-on-scroll can take effect
        document.documentElement.classList.add('js');
        // Loader
        window.addEventListener('load', () => {
            setTimeout(() => document.getElementById('loader').classList.add('hidden'), 800);
        });
        
        // Nav scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
        
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
        
        // Reveal on scroll
        const reveals = document.querySelectorAll('.reveal');
        const revealOnScroll = () => {
            reveals.forEach(el => {
                const top = el.getBoundingClientRect().top;
                if (top < window.innerHeight - 80) el.classList.add('active');
            });
        };
        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll();
        
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
        
        // Chat
        function toggleChat() { document.getElementById('chat-box').classList.toggle('active'); }
        function appendChat(role, msg) {
            const msgs = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.className = 'chat-message ' + role;
            div.textContent = msg;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
        }
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const msg = input.value.trim();
            if (!msg) return;
            appendChat('user', msg);
            input.value = '';
            setTimeout(() => appendChat('bot', getBotResponse(msg)), 800);
        }
        function getBotResponse(msg) {
            const l = msg.toLowerCase();
            if (l.includes('precio') || l.includes('coste')) return '¡Buena pregunta! Desde 18€/h. Con el Bono 10h ahorras 20€ (16€/h). La primera clase es GRATIS. 🎁';
            if (l.includes('herram') || l.includes('software') || l.includes('maya') || l.includes('blender')) return 'Trabajo con Maya, 3DS Max, Blender, ZBrush, Substance, Unity, Unreal, Photoshop... ¡Lo que necesites!';
            if (l.includes('rigging') || l.includes('rig')) return '¡Mi especialidad! Tengo años de experiencia creando rigs profesionales. Si quieres aprender, estás en el lugar correcto. 🦴';
            if (l.includes('horar') || l.includes('cuando')) return 'Las clases se adaptan a tu horario. Normalmente 9:00 - 21:00. ¡Cuéntame qué días te vienen bien!';
            if (l.includes('gracias')) return '¡De nada! Si tienes más dudas, aquí estoy. También puedes escribir a javi.torralba27@gmail.com';
            return 'Interesante pregunta. Para más detalles, contacta con Javi en javi.torralba27@gmail.com. ¡Él te responde rápido! 👑';
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
