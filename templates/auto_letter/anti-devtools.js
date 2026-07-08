/**
 * Lớp bảo mật chống soi code / f12
 * Có thể nhúng vào bất kỳ dự án nào bằng thẻ:
 * <script src="./anti-devtools.js"></script>
 */

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

// 4. Phát hiện DevTools mở -> Đá về Google
setInterval(function () {
    var start = performance.now();
    debugger;
    var end = performance.now();
    if (end - start > 100) {
        window.location.replace("https://google.com");
    }
}, 100);

// 5. Phát hiện qua độ lệch kích thước màn hình (khi mở DevTools dạng Dock)
setInterval(function () {
    var threshold = 160;
    var widthDiff = window.outerWidth - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
        window.location.replace("https://google.com");
    }
}, 500);
