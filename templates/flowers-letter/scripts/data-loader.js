/**
 * Data Loader — đọc cấu hình từ file config.js để hiển thị nội dung
 */
window.AppData = (function () {
    const config = typeof CONFIG !== 'undefined' ? CONFIG : {};

    // Mặc định an toàn nếu thiếu config
    const data = {
        sender:        config.sender || 'Anh iu',
        recipient:     config.recipient || 'bé ngốc',
        pinCode:       config.pinCode || '0000',
        title:         config.title || 'To my love',
        cardCoverDeco: config.cardCoverDeco || '✿ ❤ ✿',
        forYouLine:    config.forYouLine || 'Gửi yêu thương đến ' + (config.recipient || 'bé ngốc') + ' ❤',
        popupMessage:  config.popupMessage || ['Gửi người yêu của anh ❤'],
        images:        config.images || [],
        popupPhoto:    config.popupPhoto || '',
        music:         config.music || '',
    };

    // Card body bị giới hạn diện tích → cắt ngắn nếu thư quá dài, thêm "…"
    const CARD_MAX_PARAS          = 3;
    const CARD_MAX_CHARS_PER_PARA = 90;

    data.cardBody = data.popupMessage.slice(0, CARD_MAX_PARAS).map(function (p) {
        const t = String(p).trim();
        if (t.length > CARD_MAX_CHARS_PER_PARA) {
            return t.slice(0, CARD_MAX_CHARS_PER_PARA - 1).trim() + '…';
        }
        return t;
    });

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /** Inject dữ liệu vào các vùng DOM của index.html. */
    function applyToDOM(d) {
        // ===== Music =====
        const audio = document.getElementById('bgMusic');
        if (audio && d.music) {
            const src = audio.querySelector('source');
            if (src && src.src !== d.music) {
                src.src = d.music;
                audio.load();
            }
        }

        // ===== Phase 1 — Lock screen (From / For) =====
        const rows = document.querySelectorAll('#lockFrame .lock-info-row');
        if (rows[0]) rows[0].innerHTML = `<span class="label">From:</span> ${escapeHtml(d.sender)}`;
        if (rows[1]) rows[1].innerHTML = `<span class="label">For:</span> ${escapeHtml(d.recipient)}`;

        // ===== Phase 2 — Card cover =====
        const titleMain = document.querySelector('.card-title-main');
        if (titleMain) titleMain.textContent = d.title;

        const titleSubs = document.querySelectorAll('.card-title-secondary');
        if (titleSubs[0]) titleSubs[0].textContent = d.cardCoverDeco;
        if (titleSubs[1]) titleSubs[1].textContent = `~ ${d.recipient} ~`;

        // ===== Phase 2 — Card body (mở thiệp ra) =====
        const cardBody = document.querySelector('.card-body');
        if (cardBody && d.cardBody.length) {
            cardBody.innerHTML = d.cardBody.map(p => `<p>${escapeHtml(p)}</p>`).join('');
        }

        // ===== Phase 2 — "Gửi yêu thương đến…" =====
        const forYou = document.getElementById('forYou');
        if (forYou) forYou.textContent = d.forYouLine;

        // ===== Phase 3 — Popup =====
        const popupTitle = document.querySelector('.popup-title');
        if (popupTitle) popupTitle.textContent = d.title;

        const popupPhoto = document.querySelector('.popup-photo img');
        if (popupPhoto && d.popupPhoto) popupPhoto.src = d.popupPhoto;

        const popupText = document.querySelector('.popup-text');
        if (popupText && d.popupMessage.length) {
            popupText.innerHTML = d.popupMessage.map(p => `<p>${escapeHtml(p)}</p>`).join('');
        }
    }

    /* =========================================================
     * BOOT — apply configs
     * ======================================================= */
    const state = { data: data, isPreview: false };

    const ready = new Promise(function (resolve) {
        applyToDOM(data);
        console.log('[AppData] Đã nạp cấu hình từ config.js:', data);
        resolve(data);
    });

    return {
        ready,
        get data() { return state.data; },
        get isPreview() { return state.isPreview; },
    };
})();
