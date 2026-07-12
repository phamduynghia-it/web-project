/**
 * Phase 1 — PIN lock screen
 * PIN: 1304
 */
window.Phase1 = (function () {
    function getPin() {
        if (window.AppData && window.AppData.data && window.AppData.data.pinCode) {
            return String(window.AppData.data.pinCode);
        }
        return '0000';
    }
    const WRONG_SOUNDS = [
        'sounds/cha_yeu_em_meme_sound_effect-www_tiengdong_com.mp3',
        'sounds/tieng_beep_8211_jvevermind-www_tiengdong_com.mp3',
        'sounds/tieng_vit_keu_meme-www_tiengdong_com.mp3',
    ];
    const wrongAudios = WRONG_SOUNDS.map((src) => {
        const a = new Audio(src);
        a.preload = 'auto';
        a.volume = 0.7;
        return a;
    });

    let entered = '';
    let onUnlockCb = null;
    let locked = false;

    const lockFrame = document.getElementById('lockFrame');
    const keypad = document.getElementById('keypad');
    const heartsEl = document.getElementById('pinHearts');

    function vibrate(ms) {
        if (navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (_) {}
        }
    }

    function playWrongSound() {
        const audio = wrongAudios[Math.floor(Math.random() * wrongAudios.length)];
        try {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } catch (_) {}
    }

    function renderHearts() {
        const hearts = heartsEl.querySelectorAll('.pin-heart');
        hearts.forEach((h, i) => {
            h.classList.remove('is-error', 'is-success');
            h.classList.toggle('is-filled', i < entered.length);
        });
    }

    function flashError() {
        const hearts = heartsEl.querySelectorAll('.pin-heart');
        hearts.forEach((h) => h.classList.add('is-error'));
        lockFrame.classList.add('is-shaking');
        vibrate(80);
        playWrongSound();
        setTimeout(() => {
            lockFrame.classList.remove('is-shaking');
            entered = '';
            renderHearts();
        }, 500);
    }

    function flashSuccess() {
        const hearts = heartsEl.querySelectorAll('.pin-heart');
        hearts.forEach((h) => h.classList.add('is-success'));
        vibrate([20, 60, 20]);
        // Disperse the lock frame and signal success
        setTimeout(() => {
            lockFrame.classList.add('is-unlocking');
            setTimeout(() => {
                if (onUnlockCb) onUnlockCb();
            }, 900);
        }, 450);
    }

    function checkPin() {
        if (entered.length !== 4) return;
        if (entered === getPin()) {
            locked = true;
            flashSuccess();
        } else {
            locked = true;
            flashError();
            setTimeout(() => { locked = false; }, 520);
        }
    }

    function pressKey(key) {
        if (locked) return;
        if (key === 'clear') {
            entered = '';
            renderHearts();
            vibrate(10);
            return;
        }
        if (key === 'backspace') {
            entered = entered.slice(0, -1);
            renderHearts();
            vibrate(10);
            return;
        }
        if (/^[0-9]$/.test(key)) {
            if (entered.length >= 4) return;
            entered += key;
            renderHearts();
            vibrate(10);
            if (entered.length === 4) {
                setTimeout(checkPin, 180);
            }
        }
    }

    function bindKeypad() {
        keypad.addEventListener('click', (e) => {
            const btn = e.target.closest('.keypad-btn');
            if (!btn) return;
            pressKey(btn.dataset.key);
        });

        document.addEventListener('keydown', (e) => {
            const activePhase = document.querySelector('.app-phase.is-active');
            if (!activePhase || activePhase.id !== 'phase-1') return;
            if (/^[0-9]$/.test(e.key)) pressKey(e.key);
            else if (e.key === 'Backspace') pressKey('backspace');
            else if (e.key === 'Escape') pressKey('clear');
        });
    }

    function init({ onUnlock }) {
        onUnlockCb = onUnlock;
        bindKeypad();
    }

    return { init };
})();
