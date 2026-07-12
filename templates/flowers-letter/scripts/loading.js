/**
 * Phase 0 — Loading
 * Preloads all images used in Phase 1 & Phase 2, then resolves.
 * Cycles a list of romantic phrases under the wreath while loading.
 */
window.Loading = (function () {
    const MIN_DISPLAY_MS = 2500;

    const PHRASES = [
        'Yêu thương đang gõ cửa…',
        'Trái tim đang khẽ thì thầm…',
        'Một điều bất ngờ đang đến…',
        'Khẽ chờ thêm chút nhé…',
        'Hoa đang dệt thành lời thương…',
    ];
    const PHRASE_INTERVAL_MS = 1600;
    const PHRASE_FADE_MS = 400;
    let phraseTimer = null;

    function preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url, ok: true });
            img.onerror = () => resolve({ url, ok: false });
            img.src = url;
        });
    }

    function preloadAll() {
        const urls = [
            'background/raw_background.webp',
            'resource_2/pink_rose.webp',
            'resource_2/white_peony.webp',
            ...window.FLOWER_FILES.map(window.flowerUrl),
        ];
        return Promise.all(urls.map(preloadImage));
    }

    function startPhraseRotation() {
        const el = document.querySelector('.loading-text');
        if (!el) return;
        el.textContent = PHRASES[0];
        let i = 0;
        phraseTimer = setInterval(() => {
            i = (i + 1) % PHRASES.length;
            el.classList.add('is-swapping');
            setTimeout(() => {
                el.textContent = PHRASES[i];
                el.classList.remove('is-swapping');
            }, PHRASE_FADE_MS);
        }, PHRASE_INTERVAL_MS);
    }

    function stopPhraseRotation() {
        if (phraseTimer) {
            clearInterval(phraseTimer);
            phraseTimer = null;
        }
    }

    async function run() {
        startPhraseRotation();
        const started = performance.now();
        await preloadAll();
        const elapsed = performance.now() - started;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        stopPhraseRotation();
    }

    return { run };
})();
