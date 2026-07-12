/**
 * App state machine — orchestrates Phase 0 → Phase 1 → Phase 2.
 */
(function () {
    // ==== Chặn zoom: pinch (iOS), Ctrl+wheel (desktop), double-tap fallback ====
    // CSS touch-action: manipulation đã xử lý double-tap zoom, đây là layer phụ
    // cho các trường hợp browser vẫn cố zoom (iOS Safari pinch, trackpad zoom).
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
        document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
    });
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    // Fallback double-tap detection (cho iOS bỏ qua touch-action)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 350) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

    const phases = {
        loading: document.getElementById('phase-loading'),
        phase1:  document.getElementById('phase-1'),
        phase2:  document.getElementById('phase-2'),
    };

    function showPhase(name) {
        Object.entries(phases).forEach(([key, el]) => {
            el.classList.toggle('is-active', key === name);
        });
    }

    async function start() {
        // Đợi data từ API (?id=...) hoặc giá trị mặc định nạp xong và bind vào DOM
        if (window.AppData && window.AppData.ready) {
            await window.AppData.ready;
        }

        // Dev shortcuts via URL hash: #skip=phase1 or #skip=phase2
        const skip = new URLSearchParams(location.hash.slice(1)).get('skip');
        if (skip === 'phase2') {
            showPhase('phase2');
            await new Promise((r) => setTimeout(r, 200));
            window.Phase2.run();
            return;
        }

        showPhase('loading');
        await window.Loading.run();
        // crossfade to phase 1
        showPhase('phase1');
        window.Phase1.init({
            onUnlock: async () => {
                showPhase('phase2');
                // Slight delay so the crossfade has time
                await new Promise((r) => setTimeout(r, 400));
                window.Phase2.run();
            },
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
