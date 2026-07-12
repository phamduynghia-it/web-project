/**
 * Phase 2 — Envelope opens → fountain of flowers (burst + parabolic fall) → text
 *
 * Each flower runs ONE continuous animation: pop in, arc up to its apex,
 * gravity-fall to below the viewport, fade out, then auto-remove from the DOM.
 * The envelope stays visible the whole time.
 *
 * Optimisations (so ~400 concurrent flowers stay smooth):
 *   - No filter (no blur, no drop-shadow); depth is z-index only.
 *   - transform + opacity only → composited on GPU.
 *   - contain: layout style paint on .flower-stage isolates paint.
 *   - Auto-remove element on anime complete → DOM never grows unbounded.
 */
window.Phase2 = (function () {
    const envelope = document.getElementById('envelope');
    const stage = document.getElementById('flowerStage');
    const forYou = document.getElementById('forYou');

    // Separate stage for the rain so its compositor context is isolated from
    // the fountain's. Without this, mass-spawning rain CSS layers makes the
    // browser evict lower-z-index fountain layers (they "disappear").
    let rainStage = null;
    function getRainStage() {
        if (!rainStage) {
            rainStage = document.createElement('div');
            rainStage.className = 'flower-stage';
            rainStage.id = 'rainStage';
            rainStage.setAttribute('aria-hidden', 'true');
            stage.parentNode.insertBefore(rainStage, stage.nextSibling);
        }
        return rainStage;
    }

    const PHASE2_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    /**
     * Fountain — PHUN LIÊN TỤC bouquet 2 cánh, kéo dài 5s.
     *   - 25% burst đầu 0-500ms (mở thiệp → bùng nổ ngay)
     *   - 75% trickle 500-5000ms (~95 hoa/s) — phun liên tục từ thiệp
     *   - Dur 12-17s mỗi hoa → bouquet duy trì lâu, từ từ tan
     *   - Cảm giác: thiệp mở ra → hoa nở ra liên tục trong 5s rồi từ từ rơi
     */
    function fountain() {
        return new Promise((resolve) => {
            const viewW = window.innerWidth;
            const viewH = window.innerHeight;
            const reduced = PHASE2_REDUCED;
            const isMobile = viewW < 600;
            // Nhiều hoa hơn để bù cho spawn spread (trickle 95/s × 5s ~ 480 hoa)
            const TOTAL = reduced ? 280 : (isMobile ? 280 : 620);
            const MAX_CONCURRENT = TOTAL;

            // Burst đầu + trickle liên tục
            const waves = [
                { until: TOTAL * 0.25, range: [0,    500]  },   // 25% bùng nổ
                { until: TOTAL,        range: [500, 5000]  },   // 75% phun liên tục
            ];

            const allParams = [];
            for (let i = 0; i < TOTAL; i++) {
                const sizeRoll = Math.random();
                let size;
                if      (sizeRoll < 0.08) size = rand(280, 380);   // 8% hero
                else if (sizeRoll < 0.40) size = rand(180, 280);   // 32% mid
                else if (sizeRoll < 0.75) size = rand(115, 180);   // 35% small
                else                       size = rand(65, 115);   // 25% petals
                if (isMobile) size *= 0.7;

                const layer = size >= 280 ? 'fg' : size >= 160 ? 'mid' : 'bg';

                // 2 đường cong — luân phiên trái/phải
                const side = (i % 2 === 0) ? -1 : 1;

                // Fan RẤT RỘNG: 5°-92° từ thẳng lên (gần như tới phương ngang)
                const angleFromUp = rand(5, 92);
                const angleRad = angleFromUp * Math.PI / 180;

                // refDim = min(viewW, viewH) → vừa khít với chiều ngắn hơn của
                // viewport. Mobile portrait: refDim = viewW → bouquet rộng tới
                // gần mép. Desktop landscape: refDim = viewH → fan cao & rộng
                // theo tỷ lệ màn hình. Không bao giờ vượt quá chiều ngắn.
                const refDim = Math.min(viewW, viewH);
                const peakDist = rand(refDim * 0.35, refDim * 0.95);
                const peakX = side * Math.sin(angleRad) * peakDist;
                const peakY = -Math.cos(angleRad) * peakDist;

                // End drift cũng theo refDim
                const endX = peakX + side * rand(refDim * 0.06, refDim * 0.18);
                const endY = peakY + rand(viewH * 0.60, viewH * 1.10);

                const wave = waves.find((w) => i < w.until);
                allParams.push({
                    size, layer, peakX, peakY, endX, endY,
                    rot: rand(-160, 160),
                    dur: rand(12000, 17000),
                    delay: rand(wave.range[0], wave.range[1]),
                });
            }
            allParams.sort((a, b) => a.delay - b.delay);

            // ===== Pool-based spawning =====
            const queue = allParams;
            let active = 0;
            let done = 0;
            let pendingTimeout = null;
            const START = performance.now();

            function spawn(p) {
                const el = document.createElement('div');
                el.className = 'flower flower--fountain flower--' + p.layer;
                el.style.cssText =
                    '--flower-size:' + p.size + 'px;' +
                    '--fpeak-x:'  + p.peakX + 'px;' +
                    '--fpeak-y:'  + p.peakY + 'px;' +
                    '--fend-x:'   + p.endX  + 'px;' +
                    '--fend-y:'   + p.endY  + 'px;' +
                    '--frot:'     + p.rot   + 'deg;' +
                    '--fdur:'     + p.dur   + 'ms;' +
                    '--fdelay:'   + '0ms;' +              // pump điều khiển timing
                    'background-image:url("' + window.flowerUrl(pick(window.FLOWER_FILES)) + '")';
                el.addEventListener('animationend', (e) => {
                    if (e.animationName !== 'fountain-opacity') return;
                    el.remove();
                    active--;
                    done++;
                    if (done === TOTAL) { resolve(); return; }
                    pump();
                });
                stage.appendChild(el);
                active++;
            }

            function pump() {
                // Spawn tới 80 hoa mỗi frame → burst đầu hiện gần như tức thì
                // (200 hoa / 80 per frame = 2.5 frame ≈ 40ms để rải hết burst)
                let burst = 0;
                while (queue.length && active < MAX_CONCURRENT && burst < 80) {
                    const now = performance.now() - START;
                    const p = queue[0];
                    if (p.delay > now) {
                        // Đợi đến khi param tiếp theo "đến giờ"
                        if (!pendingTimeout) {
                            pendingTimeout = setTimeout(() => {
                                pendingTimeout = null;
                                pump();
                            }, p.delay - now + 5);
                        }
                        return;
                    }
                    queue.shift();
                    spawn(p);
                    burst++;
                }
                // Còn param + còn chỗ trong pool → tiếp tục frame sau
                if (queue.length && active < MAX_CONCURRENT) {
                    requestAnimationFrame(pump);
                }
            }

            requestAnimationFrame(pump);
        });
    }

    /**
     * 2.2 — Rain: 1 ĐỢT single wave, rơi nhẹ nhàng từ từ.
     *
     * Tất cả hoa spawn trong 1.5s (sweep L→R nhanh từ góc trái → góc phải),
     * sau đó rơi chậm trong 12-17s. MAX = TOTAL → không cap, không recycle,
     * toàn bộ wave on-screen cùng lúc tạo canopy dày như phase2.2.png.
     */
    function denseRain() {
        return new Promise((resolve) => {
            const viewW = window.innerWidth;
            const viewH = window.innerHeight;
            const reduced = PHASE2_REDUCED;
            const isMobile = viewW < 600;

            // Grid vừa phải — chiều cao phủ kín do varied startY (xem dưới)
            const cols = reduced ? 8 : (isMobile ? 14 : 24);
            const rows = reduced ? 7 : (isMobile ? 9 : 12);
            const TOTAL = cols * rows;
            // No cap — single wave, all on-screen cùng lúc
            const MAX_CONCURRENT = TOTAL;
            const colWidth = viewW / cols;

            // Sweep TIGHT 1.5s — 1 wave L→R nhanh, không kéo dài.
            // Jitter 10% (±75ms) — L→R order rõ ràng.
            const SPAWN_WINDOW = 1500;
            const SWEEP_PORTION = 0.90;
            const SWEEP_SPAN = SPAWN_WINDOW * SWEEP_PORTION;       // 1350ms
            const JITTER_SPAN = SPAWN_WINDOW * (1 - SWEEP_PORTION); // 150ms

            function pickSize() {
                const r = Math.random();
                let s;
                if (isMobile) {
                    // Hoa nhỏ hơn — không to hơn viewport, giảm GPU pressure
                    if      (r < 0.20) s = rand(210, 290);    // 20% hero
                    else if (r < 0.75) s = rand(150, 210);    // 55% large
                    else               s = rand(110, 150);    // 25% medium
                } else {
                    if      (r < 0.25) s = rand(340, 460);    // 25% hero (nhẹ hơn 520)
                    else if (r < 0.75) s = rand(250, 340);    // 50% large
                    else               s = rand(190, 250);    // 25% medium
                }
                if (reduced) s *= 0.8;
                return s;
            }

            const all = [];
            for (let c = 0; c < cols; c++) {
                // Sweep delay: col 0 → t=0, col last → t=SWEEP_SPAN
                const sweepDelay = (c / Math.max(cols - 1, 1)) * SWEEP_SPAN;

                for (let r = 0; r < rows; r++) {
                    // Jitter ngang rộng hơn (±60% colWidth) → hoa overlap qua
                    // cột bên cạnh, tạo cảm giác dày đặc liên tục thay vì grid.
                    const xStart = (c + 0.5) * colWidth - viewW / 2
                                   + rand(-colWidth * 0.60, colWidth * 0.60);
                    const xEnd   = xStart + rand(-50, 70);

                    // START stagger VERTICAL — startY trải rộng -10% đến -100%
                    // viewH (có hoa sát top viewport, có hoa cao tít trên).
                    // Tất cả hoa rơi cùng tốc độ → tại mỗi thời điểm hoa ở các Y
                    // khác nhau → phủ kín từ top xuống bottom cùng lúc.
                    const startY = -viewH * (0.10 + Math.random() * 0.90);
                    const endY   = viewH * 0.95 + rand(0, 220);

                    const size = pickSize();
                    const wobSign = Math.random() < 0.5 ? -1 : 1;
                    // Dur SCALE theo distance — tất cả hoa cùng tốc độ rơi.
                    // Hoa start sát top → dur ngắn. Hoa start cao tít → dur dài.
                    // Cùng velocity → mỗi thời điểm hoa rải đều mọi Y position
                    // → phủ kín top→bottom suốt quá trình rơi.
                    const travelDist = endY - startY;
                    const FALL_TIME_PER_VIEWH = 9500;  // 9.5s cho 1× viewH rơi
                    const dur = travelDist * FALL_TIME_PER_VIEWH / viewH;
                    all.push({
                        xStart, xEnd, startY, endY,
                        size,
                        dur,
                        delay:    sweepDelay + Math.random() * JITTER_SPAN,
                        rotStart: rand(-20, 20),
                        rotEnd:   rand(-60, 60),
                        wobX:     size * rand(0.14, 0.22) * wobSign,
                        rotTilt:  rand(10, 18) * wobSign,
                    });
                }
            }

            // Sort theo delay → pump() xử lý theo thứ tự chronological,
            // sweep từ trái sang phải vẫn được bảo toàn.
            all.sort((a, b) => a.delay - b.delay);

            // Rain dùng stage riêng (cô lập compositor context với fountain)
            const targetStage = getRainStage();
            const queue = all;
            let active = 0;
            let done = 0;
            let pendingTimeout = null;
            const START = performance.now();

            function spawn(p) {
                const el = document.createElement('div');
                el.className = 'flower flower--rain';
                el.style.cssText =
                    '--flower-size:' + p.size + 'px;' +
                    '--rx-start:'  + p.xStart  + 'px;' +
                    '--rx-end:'    + p.xEnd    + 'px;' +
                    '--ry-start:'  + p.startY  + 'px;' +
                    '--ry-end:'    + p.endY    + 'px;' +
                    '--wob-x:'     + p.wobX    + 'px;' +
                    '--rot-tilt:'  + p.rotTilt + 'deg;' +
                    '--rot-start:' + p.rotStart + 'deg;' +
                    '--rot-end:'   + p.rotEnd   + 'deg;' +
                    '--rdur:'      + p.dur     + 'ms;' +
                    '--rdelay:'    + '0ms;' +
                    'background-image:url("' + window.flowerUrl(pick(window.FLOWER_FILES)) + '")';
                el.addEventListener('animationend', () => {
                    el.remove();
                    active--;
                    done++;
                    if (done === TOTAL) { resolve(); return; }
                    pump();
                }, { once: true });
                targetStage.appendChild(el);
                active++;
            }

            function pump() {
                let burst = 0;
                while (queue.length && active < MAX_CONCURRENT && burst < 25) {
                    const now = performance.now() - START;
                    const p = queue[0];
                    if (p.delay > now) {
                        if (!pendingTimeout) {
                            pendingTimeout = setTimeout(() => {
                                pendingTimeout = null;
                                pump();
                            }, p.delay - now + 5);
                        }
                        return;
                    }
                    queue.shift();
                    spawn(p);
                    burst++;
                }
                if (queue.length && active < MAX_CONCURRENT) {
                    requestAnimationFrame(pump);
                }
            }

            requestAnimationFrame(pump);
        });
    }

    function showForYou() {
        forYou.classList.add('is-visible');
    }

    async function run() {
        // 1. Envelope materialises NHANH (150ms thay vì 700ms)
        envelope.classList.add('is-visible');
        await new Promise((r) => setTimeout(r, 150));

        // 2. PHUN HOA NGAY khi envelope vừa hiện — không đợi shake
        //    Shake chạy song song với burst đầu tiên
        const fountainStart = performance.now();
        const fountainPromise = fountain();

        // 3. Shake ngắn (400ms) song song với burst hoa
        envelope.classList.add('is-shaking');
        await new Promise((r) => setTimeout(r, 400));
        envelope.classList.remove('is-shaking');
        envelope.classList.add('is-idle');

        await new Promise((r) => setTimeout(r, 3000));
        showForYou();

        // Rain bắt đầu sau khi fountain hết spray (0-5s) + 1s buffer.
        // Lúc này bouquet đã thành hình rõ, rain rơi xuống tiếp tục cảm xúc.
        const rainAt = 6000;
        const elapsed = performance.now() - fountainStart;
        if (elapsed < rainAt) {
            await new Promise((r) => setTimeout(r, rainAt - elapsed));
        }
        const rainPromise = denseRain();
        void fountainPromise; void rainPromise;  // fire-and-forget; we don't block on full completion

        // 4. Envelope mở khi rain GẦN RƠI XONG:
        //    - Spawn window 1.5s (single wave L→R)
        //    - Fall dur 15-20s, avg 17.5s
        //    - Hoa đầu rơi xong ở t≈17500ms
        //    → mở envelope ở t=15000ms — peak coverage gần tan
        const openAt = rainAt + 15000;
        const elapsedNow = performance.now() - fountainStart;
        if (elapsedNow < openAt) {
            await new Promise((r) => setTimeout(r, openAt - elapsedNow));
        }

        // (lid lifts → card slides out → cover flips reveal the message)
        envelope.classList.remove('is-idle');
        envelope.classList.add('is-open');

        // Wait for the full open cascade to finish (cover flip lands at ~2750ms
        // after is-open, per the timings in styles/phase2.css), then surface
        // the Phase 3 popup over the open card.
        await new Promise((r) => setTimeout(r, 3200));
        if (window.Phase3) window.Phase3.showPopup();
    }

    return { run };
})();
