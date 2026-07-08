/**
 * Lớp bảo mật chống soi code / f12
 * Tích hợp thư viện disable-devtool để chặn mạnh mẽ hơn
 */

(function() {
    // 1. Chống chuột phải (Context Menu)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // 2. Chống bôi đen văn bản bằng chuột trái
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
    });

    // 3. Chống phím tắt F12, Ctrl+U, Ctrl+S, Ctrl+Shift+I/J/C
    document.addEventListener('keydown', function (e) {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase()))
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 4. Tích hợp thư viện disable-devtool từ CDN
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/disable-devtool';
    script.defer = true;
    script.onload = function() {
        if (typeof DisableDevtool === 'function') {
            DisableDevtool({
                url: 'https://google.com', // Chuyển hướng khi phát hiện DevTools
                timeOutUrl: 'https://google.com'
            });
        }
    };
    document.head.appendChild(script);

    // 5. Fallback tự viết phòng khi thư viện ngoài bị lỗi mạng không tải được
    setInterval(function () {
        var start = performance.now();
        debugger;
        var end = performance.now();
        if (end - start > 100) {
            window.location.replace("https://google.com");
        }
    }, 100);

    setInterval(function () {
        var threshold = 160;
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
            window.location.replace("https://google.com");
        }
    }, 500);
})();
