/**
 * Phase 3 — Popup after the card opens, then finale of love photos + flowers
 * floating up from the bottom of the screen when the popup is dismissed.
 *
 * Popup: cream/beige card matching images/popup.png — header strip with
 * deco icons + horizontal body (photo left, message right). Click X / Esc
 * / backdrop dismisses; clicks inside the message do nothing so the reader
 * can dwell on the love letter without it closing accidentally.
 *
 * Finale: love photos + drifter flowers + heart-formation flowers.
 *   • Photos:   waves of 3 (desktop) / 2 (mobile) at ~3.6 s intervals.
 *   • Drifters: ~270 chunky blooms across 3 staggered waves (0 / 6 s / 14 s)
 *               + a permanent trickle (1–3 every 1.5–3 s) starting at ~16 s
 *               so a few flowers are always drifting past the heart.
 *   • Heart:    ~100 flowers (60 mobile) sampled along the classic heart
 *               curve; rise (0–6 s) → converge (6–9 s) → then sit at their
 *               heart point FOREVER with an infinite heart-pulse on scale.
 * Each element runs 2–3 parallel CSS animations
 * on its own GPU layer:
 *   • finale-rise (translate + rotate, 3-point horizontal sway = breeze drift)
 *   • finale-fade (opacity 0 → max-opacity → 0; --max-opacity per element
 *                  layers a few flowers behind for depth)
 *   • photo:  neon-breathe (soft-red tube + halo intensity pulse, 2.8 s)
 *     flower: flower-pulse  (subtle scale 1 ↔ 1.05 so each bloom feels alive)
 * Rotation behaviour is split: 35 % calm petals (-40°…40°), 50 % moderate
 * (-220°…220°), 15 % tumblers (-540°…540°) for naturalistic variety.
 */
window.Phase3 = (function () {
    const overlay = document.getElementById('popupOverlay');
    const popup   = document.getElementById('popup');
    const stage   = document.getElementById('finaleStage');

    const LOVE_PHOTOS_FALLBACK = ['images/love1.jpeg', 'images/love2.jpeg', 'images/love3.jpeg'];
    function getLovePhotos() {
        if (window.AppData && window.AppData.data && Array.isArray(window.AppData.data.images) && window.AppData.data.images.length) {
            return window.AppData.data.images;
        }
        return LOVE_PHOTOS_FALLBACK;
    }
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }

    let dismissed = false;
    let onOverlayClick = null;
    let onKeydown     = null;
    let typeTimer     = null;   // active setTimeout id during the typewriter
    let preparedParas = null;   // [{ p, chars: [span, ...] }, ...]

    /**
     * Run once at script load — split each popup paragraph into single-char
     * <span> elements. CSS keeps every .pt-char at opacity 0 until the
     * typewriter flips it to .is-on, so the popup never flashes the full
     * message between "is-visible" and the type animation starting.
     */
    function prepareMessage() {
        const paragraphs = popup.querySelectorAll('.popup-text p');
        const result = [];
        paragraphs.forEach((p) => {
            const text = p.textContent;
            p.textContent = '';
            const chars = [];
            // Array.from handles surrogate pairs (emoji ❤️) correctly.
            Array.from(text).forEach((ch) => {
                const span = document.createElement('span');
                span.className = 'pt-char';
                span.textContent = ch;
                p.appendChild(span);
                chars.push(span);
            });
            result.push({ p, chars });
        });
        preparedParas = result;
    }

    function showPopup() {
        // Chia ký tự ngay trước khi hiện popup — phải gọi ở đây thay vì
        // lúc script load vì data-loader có thể đã ghi đè .popup-text sau
        // khi nhận response từ API.
        prepareMessage();
        // Force a reflow before adding is-visible so transitions actually run
        // if showPopup is called immediately after the element becomes visible.
        // eslint-disable-next-line no-unused-expressions
        overlay.offsetHeight;
        overlay.classList.add('is-visible');
        overlay.setAttribute('aria-hidden', 'false');

        // Dismiss when: (1) click the X button, (2) click the heart icon,
        // (3) click on the backdrop, (4) press Esc. Clicks inside the body
        // (photo, text, header) do nothing so the reader can dwell on the
        // message without it closing accidentally.
        onOverlayClick = (e) => {
            if (dismissed) return;
            const onAction = e.target.closest('.popup-close, .popup-heart');
            const onPopup  = e.target.closest('.popup');
            if (onAction || !onPopup) tryDismiss();
        };
        onKeydown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') tryDismiss();
        };
        overlay.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKeydown);

        // Kick off the typewriter ~700 ms after the popup card has scaled in.
        typeTimer = setTimeout(typewriteMessage, 700);
    }

    /**
     * Reveal each pre-split paragraph one character at a time, like reading
     * a handwritten letter. Punctuation gets a longer dwell for cadence;
     * spaces fly past so the eye reads word-by-word.
     */
    function typewriteMessage() {
        if (dismissed || !preparedParas || !preparedParas.length) return;

        // Letter-reading pace — slow enough that long Vietnamese paragraphs
        // feel deliberate, fast enough not to overstay the welcome.
        const CHAR_MS_DEFAULT = 55;     // baseline char tick (~18 cps)
        const CHAR_MS_PUNCT   = 360;    // dwell on , . ; : ? !
        const CHAR_MS_SPACE   = 30;     // spaces fly past quickly
        const PARA_PAUSE_MS   = 850;    // breath between paragraphs

        function attachCaret(p) {
            const caret = document.createElement('span');
            caret.className = 'pt-caret';
            p.appendChild(caret);
            return caret;
        }
        function removeCaret(caret) {
            if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
        }

        let paraIdx = 0;
        let charIdx = 0;
        let caret = attachCaret(preparedParas[0].p);

        function tick() {
            if (dismissed) return;
            const current = preparedParas[paraIdx];
            if (charIdx < current.chars.length) {
                const span = current.chars[charIdx];
                span.classList.add('is-on');
                const ch = span.textContent;
                charIdx++;
                let delay = CHAR_MS_DEFAULT;
                if (/\s/.test(ch))                  delay = CHAR_MS_SPACE;
                else if (/[,.;:?!—…]/.test(ch))     delay = CHAR_MS_PUNCT;
                typeTimer = setTimeout(tick, delay);
            } else {
                // Paragraph done — drop the caret here, move to next
                removeCaret(caret);
                paraIdx++;
                charIdx = 0;
                if (paraIdx < preparedParas.length) {
                    caret = attachCaret(preparedParas[paraIdx].p);
                    typeTimer = setTimeout(tick, PARA_PAUSE_MS);
                } else {
                    // All paragraphs done — reveal the heart
                    popup.classList.add('is-ready');
                }
            }
        }
        typeTimer = setTimeout(tick, 0);
    }

    function tryDismiss() {
        if (dismissed) return;
        dismissed = true;
        if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
        overlay.removeEventListener('click', onOverlayClick);
        document.removeEventListener('keydown', onKeydown);
        hidePopup();
    }

    function hidePopup() {
        overlay.classList.add('is-leaving');
        overlay.classList.remove('is-visible');
        overlay.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            overlay.style.display = 'none';
            runFinale();
        }, 500);
    }

    /** Spawn love photos in waves so screens with 5–10 photos don't all
     *  rise at once. Each wave holds 2 photos on mobile / 3 on desktop;
     *  waves are spaced ~3.6 s apart, with a small intra-wave stagger so
     *  the lanes don't lift off in perfect sync. Mobile uses smaller
     *  photos + a narrower lane spread to fit a slim viewport. */
    function spawnPhotos() {
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const isMobile = viewW < 600;

        const LOVE_PHOTOS = getLovePhotos();
        const total       = LOVE_PHOTOS.length;
        const perWave     = isMobile ? 2 : 3;
        const waveGap     = 3600;  // ms between successive waves
        const intraStagger = 700;  // ms between photos within the same wave
        // Horizontal lane spread per wave — narrower on mobile so photos
        // don't clip the viewport edges.
        const laneSpread  = isMobile ? viewW * 0.20 : viewW * 0.24;

        LOVE_PHOTOS.forEach((src, idx) => {
            const waveIdx   = Math.floor(idx / perWave);
            const inWaveIdx = idx % perWave;
            // Count how many photos this particular wave actually has —
            // last wave may be shorter than perWave when total % perWave ≠ 0.
            const remaining = total - waveIdx * perWave;
            const waveSize  = Math.min(perWave, remaining);

            // Lane position: center waveSize evenly. For waveSize=3 → [-1,0,1].
            // For waveSize=2 → [-0.5, 0.5]. For waveSize=1 → [0].
            const laneOffset = inWaveIdx - (waveSize - 1) / 2;

            const el  = document.createElement('div');
            el.className = 'finale-item finale-item--photo';
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.draggable = false;
            el.appendChild(img);

            const size = isMobile ? rand(150, 195) : rand(220, 280);
            const xStart = laneOffset * laneSpread + rand(-26, 26);
            const xEnd   = xStart + rand(-44, 44);
            const fy     = viewH + size + 80;

            const swaySign = Math.random() < 0.5 ? -1 : 1;
            const delay    = 300 + waveIdx * waveGap + inWaveIdx * intraStagger;

            el.style.cssText =
                '--photo-size:' + size + 'px;' +
                '--fx-start:'   + xStart + 'px;' +
                '--fx-end:'     + xEnd   + 'px;' +
                '--fy:'         + fy     + 'px;' +
                '--frot:'       + rand(-6, 6) + 'deg;' +
                '--sway:'       + (swaySign * rand(60, 110)) + 'px;' +
                '--fdur:'       + rand(17000, 22000) + 'ms;' +
                '--fdelay:'     + delay + 'ms;';
            el.addEventListener('animationend', (e) => {
                if (e.animationName === 'finale-fade') el.remove();
            });
            stage.appendChild(el);
        });
    }

    /** Single flower spawn — pulled out so we can call it from multiple
     *  waves to keep the screen continuously full of blooms. */
    function spawnOneFlower(viewW, viewH, isMobile, extraDelay) {
        const el = document.createElement('div');
        el.className = 'finale-item finale-item--flower';

        // Size weighted — chunkier mix so each flower has presence. Hero
        // blooms outsize even the photos for the "garden bursting up" feel.
        const r = Math.random();
        let size;
        if      (r < 0.30) size = rand(360, 520);   // 30% hero
        else if (r < 0.62) size = rand(240, 360);   // 32% large
        else if (r < 0.85) size = rand(150, 240);   // 23% mid
        else               size = rand(90,  150);   // 15% small petals
        if (isMobile) size *= 0.7;

        // Spread across the whole width — start anywhere along the bottom,
        // drift sideways while rising.
        const xStart = rand(-viewW * 0.5, viewW * 0.5);
        const xEnd   = xStart + rand(-260, 260);
        const fy     = viewH + size + rand(40, 240);

        // Two sway points so heavier blooms catch breeze in both directions
        const swaySign = Math.random() < 0.5 ? -1 : 1;
        const swayAmt  = swaySign * (60 + size * 0.45);

        // Rotation behaviour mixes calm + tumbling for naturalism
        const rotRoll = Math.random();
        let frot;
        if      (rotRoll < 0.35) frot = rand(-40,  40);    // 35% gentle (calm petals)
        else if (rotRoll < 0.85) frot = rand(-220, 220);   // 50% moderate
        else                     frot = rand(-540, 540);   // 15% tumblers

        // Layered opacity — a few flowers sit back for depth, most are full
        const maxOpacity = rand(0.68, 1);

        el.style.cssText =
            '--flower-size:'  + size + 'px;' +
            '--fx-start:'     + xStart + 'px;' +
            '--fx-end:'       + xEnd   + 'px;' +
            '--fy:'           + fy     + 'px;' +
            '--frot:'         + frot   + 'deg;' +
            '--sway:'         + swayAmt + 'px;' +
            '--fdur:'         + rand(14000, 24000) + 'ms;' +
            '--fdelay:'       + (extraDelay + rand(0, 2200)) + 'ms;' +
            '--pulse-dur:'    + rand(3000, 5200) + 'ms;' +
            '--pulse-delay:'  + rand(0, 2200) + 'ms;' +
            '--max-opacity:'  + maxOpacity + ';' +
            'background-image:url("' + window.flowerUrl(pick(window.FLOWER_FILES)) + '")';
        el.addEventListener('animationend', (e) => {
            if (e.animationName === 'finale-fade') el.remove();
        });
        stage.appendChild(el);
    }

    /** Multi-wave flower spawn — 3 dense initial waves for the "burst" feel,
     *  then an infinite slow trickle so a few blooms are always drifting up
     *  while the heart holds. Each flower still auto-removes via finale-fade
     *  so the DOM stays bounded (~20–30 trickle blooms concurrent). */
    function spawnFlowers() {
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const isMobile = viewW < 600;

        // 3 waves so element count multiplies over time. Each wave reuses
        // the same DOM creation but with its own delay window, so the
        // screen stays full instead of thinning out 10s in.
        const waves = REDUCED
            ? [{ count: 30, delay: 0 }]
            : isMobile
                ? [
                    { count: 70, delay: 0 },
                    { count: 60, delay: 6000 },
                    { count: 50, delay: 13000 },
                ]
                : [
                    { count: 110, delay: 0 },
                    { count: 90,  delay: 6000 },
                    { count: 70,  delay: 14000 },
                ];

        // Batch spawning across rAF frames so creating 270 elements doesn't
        // freeze the main thread.
        const tasks = [];
        waves.forEach((w) => {
            for (let i = 0; i < w.count; i++) tasks.push(w.delay);
        });

        const BATCH = 40;
        let cursor = 0;
        (function pump() {
            const end = Math.min(cursor + BATCH, tasks.length);
            for (let j = cursor; j < end; j++) {
                spawnOneFlower(viewW, viewH, isMobile, tasks[j]);
            }
            cursor = end;
            if (cursor < tasks.length) requestAnimationFrame(pump);
        })();

        // Continuous trickle — starts after the last burst wave (~14 s) and
        // spawns 1–2 flowers every 1.5–3 s forever. Each flower has its own
        // 14–24 s lifecycle and auto-removes, so concurrent count plateaus.
        if (REDUCED) return;
        const trickleStartMs = 16000;
        setTimeout(function loop() {
            const batchSize = isMobile ? (Math.random() < 0.5 ? 1 : 2)
                                       : (Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3);
            for (let i = 0; i < batchSize; i++) {
                spawnOneFlower(window.innerWidth, window.innerHeight,
                               window.innerWidth < 600, 0);
            }
            setTimeout(loop, rand(1500, 3000));
        }, trickleStartMs);
    }

    /**
     * Sample N points along the classic heart parametric curve and spawn a
     * flower at each. Heart flowers share a 9 s timeline (rise + converge)
     * then sit on their heart-x / heart-y position FOREVER, with heart-pulse
     * infinite providing the heartbeat:
     *   0–6 s  : float up from bottom of viewport (Phase A — RISE)
     *   6–9 s  : drift to assigned heart point    (Phase B — CONVERGE)
     *   9 s →  : permanent hold + infinite pulse  (heart never disperses)
     */
    function spawnHeartFlowers() {
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const isMobile = viewW < 600;
        const TOTAL = REDUCED ? 50 : (isMobile ? 60 : 100);

        // Heart curve is naturally ~32 units wide; pick a scale that fits
        // ~70 % of the shorter viewport dimension.
        const HEART_SCALE = Math.min(viewW, viewH) * (isMobile ? 0.022 : 0.020);

        for (let i = 0; i < TOTAL; i++) {
            const el = document.createElement('div');
            el.className = 'finale-item finale-item--heart';

            // --- Heart point (math y is flipped to screen y) ----------
            const t = (i / TOTAL) * Math.PI * 2;
            const xMath = 16 * Math.pow(Math.sin(t), 3);
            const yMath = 13 * Math.cos(t)
                          - 5 * Math.cos(2 * t)
                          - 2 * Math.cos(3 * t)
                          -     Math.cos(4 * t);
            const heartX =  xMath * HEART_SCALE;
            const heartY = -yMath * HEART_SCALE;  // flip Y for screen coords

            // --- Start: bottom edge, spread across width --------------
            const startX = rand(-viewW * 0.42, viewW * 0.42);
            const startY = viewH * 0.55 + rand(0, 120);

            // --- Midway (Phase A end): arc up halfway toward the heart
            const midX = (startX + heartX) / 2 + rand(-60, 60);
            const midY = Math.min(startY, heartY) - 60 + rand(-50, 30);

            // Smaller, more uniform sizes so the heart pattern reads
            // cleanly (large hero blooms would smear the silhouette).
            const size = isMobile ? rand(50, 95) : rand(85, 145);
            const maxOpacity = rand(0.88, 1);
            // Tiny stagger so the cluster doesn't move in robotic lockstep
            const heartDelay = rand(0, 280);

            el.style.cssText =
                '--flower-size:' + size + 'px;' +
                '--start-x:'     + startX   + 'px;' +
                '--start-y:'     + startY   + 'px;' +
                '--mid-x:'       + midX     + 'px;' +
                '--mid-y:'       + midY     + 'px;' +
                '--heart-x:'     + heartX   + 'px;' +
                '--heart-y:'     + heartY   + 'px;' +
                '--max-opacity:' + maxOpacity + ';' +
                '--heart-delay:' + heartDelay + 'ms;' +
                'background-image:url("' + window.flowerUrl(pick(window.FLOWER_FILES)) + '")';
            // No animationend remove — heart-form ends with `forwards` and
            // heart-pulse is infinite, so the flower stays alive permanently.
            stage.appendChild(el);
        }
    }

    function runFinale() {
        spawnPhotos();
        spawnFlowers();
        spawnHeartFlowers();
    }

    return { showPopup, runFinale };
})();
