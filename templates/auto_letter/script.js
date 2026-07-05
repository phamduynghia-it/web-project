/* ===============================
   TEXT TYPING EFFECT
================================ */

const text = window.CONFIG && window.CONFIG.message && window.CONFIG.message !== "__MESSAGE__"
    ? window.CONFIG.message
    : `
Gửi tới e Aiin Nguyen

Ngày 8.3 lại đến, anh không biết phải dùng bao nhiêu lời
mới nói hết được cảm xúc của mình, chỉ biết rằng từ khi có em,
những ngày bình thường nhất cũng trở nên đặc biệt.

Em đến nhẹ nhàng như một điều kỳ diệu,
nhưng lại ở lại rất lâu trong tim anh.

Cảm ơn em vì đã xuất hiện trong cuộc đời anh,
vì những nụ cười làm anh quên mệt mỏi,
vì những lúc giận hờn rất đáng yêu,
và vì đã luôn ở đó – theo cách rất riêng của em.
Yêu em
`;

const typingEl = document.getElementById("typing");

let index = 0;
const speed = window.CONFIG && window.CONFIG.speed && window.CONFIG.speed !== "__SPEED__" && window.CONFIG.speed !== ""
    ? parseInt(window.CONFIG.speed, 10)
    : 55; // tốc độ gõ (ms)

/* cursor */
const cursor = document.createElement("span");
cursor.className = "cursor";
cursor.style.background = "#f6a6b2";
typingEl.appendChild(cursor);

function typeText() {
    if (index < text.length) {
        cursor.before(text[index]);
        index++;
        setTimeout(typeText, speed);
    } else {
        onLetterFinished();
    }
}

typeText();

/* ===============================
   AFTER LETTER FINISHED
================================ */

function onLetterFinished() {
    setTimeout(() => {
        startTransitionToSlide();
    }, 3000); // dừng 3s đọc thư
}

/* ===============================
   TRANSITION TO SLIDE
================================ */

function startTransitionToSlide() {
    const card = document.getElementById("letterCard");
    const slide = document.getElementById("slideCard");

    card.style.transition = "all 0.8s ease";
    card.style.opacity = "0";
    card.style.transform = "translate(-50%, -55%) scale(0.95)";

    setTimeout(() => {
        card.classList.add("hidden");
        slide.classList.remove("hidden");

        slide.style.opacity = "0";
        slide.style.transform = "translate(-50%, -50%) scale(0.96)";
        slide.style.transition = "all 0.8s ease";

        requestAnimationFrame(() => {
            slide.style.opacity = "1";
            slide.style.transform = "translate(-50%, -50%) scale(1)";
        });

        startAutoSlide();
        startFloatingHearts();
    }, 800);
}

/* ===============================
   SLIDE IMAGE AUTO
================================ */

let customImages = [];
try {
    if (window.CONFIG && typeof window.CONFIG.images === 'string' && window.CONFIG.images !== '__IMAGES__') {
        // Since we wrap __IMAGES__ in single quotes, it might be replaced to '["url"]' or just the literal.
        // Wait, if it's replaced to '["url"]', it is a valid JSON string.
        customImages = JSON.parse(window.CONFIG.images);
    } else if (window.CONFIG && Array.isArray(window.CONFIG.images)) {
        // Just in case it was not wrapped in quotes
        customImages = window.CONFIG.images;
    }
} catch(e) {
    console.error("Lỗi parse images:", e);
}

const images = customImages.length > 0 
    ? customImages 
    : Array.from({ length: 16 }, (_, i) => `images/a${i + 1}.jpg`);



let slideIndex = 0;
const slideImg = document.getElementById("slideImg");

function startAutoSlide() {
    slideImg.src = images[0];

    setInterval(() => {
        slideImg.style.opacity = "0";

        setTimeout(() => {
            slideIndex = (slideIndex + 1) % images.length;
            slideImg.src = images[slideIndex];
            slideImg.style.opacity = "1";
        }, 600);
    }, 2000);
}

/* ===============================
   FLOATING WHITE HEARTS BACKGROUND
================================ */

/* ================= WHITE FLOATING HEARTS ================= */

const heartCanvas = document.getElementById("hearts");
const hctx = heartCanvas.getContext("2d");

function resizeHearts() {
    heartCanvas.width = innerWidth;
    heartCanvas.height = innerHeight;
}
resizeHearts();
window.addEventListener("resize", resizeHearts);

const whiteHearts = [];

function createWhiteHeart() {
    whiteHearts.push({
        x: Math.random() * heartCanvas.width,
        y: heartCanvas.height + 20,
        size: Math.random() * 10 + 6, // nhỏ – rất nhỏ
        speed: Math.random() * 1.2 + 1.5, // bay chậm
        rotate: Math.random() * Math.PI,
        rotateSpeed: (Math.random() - 0.5) * 0.01,
        alpha: Math.random() * 0.35 + 0.15, // mờ
    });
}

function drawHeart(x, y, size, rotation, alpha) {
    hctx.save();
    hctx.translate(x, y);
    hctx.rotate(rotation);
    hctx.scale(size / 20, size / 20);
    hctx.globalAlpha = alpha;
    hctx.fillStyle = "white";

    hctx.beginPath();
    hctx.moveTo(10, 30);
    hctx.bezierCurveTo(40, 0, 60, 40, 10, 80);
    hctx.bezierCurveTo(-40, 40, -20, 0, 10, 30);
    hctx.closePath();
    hctx.fill();

    hctx.restore();
}

function animateWhiteHearts() {
    hctx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);

    whiteHearts.forEach((h, i) => {
        h.y -= h.speed;
        h.rotate += h.rotateSpeed;
        drawHeart(h.x, h.y, h.size, h.rotate, h.alpha);

        if (h.y < -50) whiteHearts.splice(i, 1);
    });

    requestAnimationFrame(animateWhiteHearts);
}

setInterval(createWhiteHeart, 600); // mật độ tim
animateWhiteHearts();
/* ===============================
   HEART PARTICLES AT BUTTON
================================ */

const heartBtn = document.querySelector(".heart-btn");

const particleColors = [
    "#f6a6b2",
    "#ff5e78",
    "#ff8fab",
    "#ffc2d1",
    "#ffd6e0",
    "#ffb3c6",
];

heartBtn.addEventListener("click", () => {
    for (let i = 0; i < 16; i++) {
        createHeartParticle();
    }
});

function createHeartParticle() {
    const heart = document.createElement("div");
    heart.className = "heart-particle";
    heartBtn.appendChild(heart); // ⭐ gắn TRONG nút

    const size = 6 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    const distance = 26 + Math.random() * 18;

    heart.style.width = size + "px";
    heart.style.height = size + "px";
    heart.style.left = "50%";
    heart.style.top = "50%";
    heart.style.background =
        particleColors[Math.floor(Math.random() * particleColors.length)];

    heart.style.setProperty("--x", Math.cos(angle) * distance + "px");
    heart.style.setProperty("--y", Math.sin(angle) * distance + "px");

    setTimeout(() => heart.remove(), 900);
}
/* ===============================
   AUTO FLOAT HEART FROM CENTER BUTTON
================================ */

function startFloatingHearts() {
    const heartBtn = document.querySelector(
        "#slideCard .controls button:nth-child(2)",
    );

    if (!heartBtn) return;

    setInterval(() => {
        createFloatingHeart(heartBtn);
    }, 600); // tốc độ thả tim
}

function createFloatingHeart(btn) {
    const heart = document.createElement("div");
    heart.className = "float-heart";
    btn.appendChild(heart);

    const xOffset = (Math.random() - 0.5) * 30;

    heart.style.left = "50%";
    heart.style.bottom = "10px";
    heart.style.setProperty("--x", xOffset + "px");

    setTimeout(() => heart.remove(), 2200);
}
/* ===============================
   BACKGROUND MUSIC CONTROL
================================ */

const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicToggle");

let musicStarted = false;
let musicMuted = false;

// 👉 Phát nhạc lần đầu khi user chạm màn hình
function startMusicOnce() {
    if (musicStarted) return;

    music
        .play()
        .then(() => {
            musicStarted = true;
            musicBtn.textContent = "🔊";
        })
        .catch(() => {
            // browser block → chờ click nút
        });
}

// Lắng nghe chạm / click lần đầu
document.addEventListener("click", startMusicOnce, { once: true });
document.addEventListener("touchstart", startMusicOnce, { once: true });

// 👉 Nút bật / tắt nhạc
musicBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 

    if (!musicStarted) {
        startMusicOnce();
        return;
    }

    if (musicMuted) {
        music.play();
        musicBtn.textContent = "🔊";
        musicBtn.classList.remove("muted");
    } else {
        music.pause();
        musicBtn.textContent = "🔇";
        musicBtn.classList.add("muted");
    }

    musicMuted = !musicMuted;
});
