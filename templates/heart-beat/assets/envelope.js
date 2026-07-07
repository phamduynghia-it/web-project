// =============================================================================
// ENVELOPE — inline letter reveal, triggered by heart tap in scripts.js
// Reads data from window.Heartlove (populated by index.html initWithData)
// Falls back to sane defaults. No rose intro, no music toggle
// (heart page owns music).
// =============================================================================

const ENVELOPE_DEFAULTS = {
  text1: "Dear",
  text:  "My Love",
  text2: "❤",
  name:  "Gửi anh yêu,",
  message:
    "Từ ngày có anh, cuộc sống của em trở nên tươi đẹp hơn bao giờ hết. Cảm ơn anh vì đã luôn ở bên em, yêu thương và che chở cho em.\nYêu anh nhiều lắm!",
  images: [
    "./image1.jpeg",
  ],
};

function pickEnvelopeData() {
  const h = (window.Heartlove && window.Heartlove.data) || {};
  return {
    text1:   ENVELOPE_DEFAULTS.text1,
    text:    h.title || ENVELOPE_DEFAULTS.text,
    text2:   ENVELOPE_DEFAULTS.text2,
    name:    ENVELOPE_DEFAULTS.name,
    message: h.popupMessage || ENVELOPE_DEFAULTS.message,
    images:  (Array.isArray(h.images) && h.images.length > 0) ? h.images : ENVELOPE_DEFAULTS.images,
  };
}

// ---- ELEMENTS ----
let envelopeScene;
let envelopeWrapper;
let envelope;
let card;
let clickInstruction;
let isEnvelopeOpen = false;
let isEnvelopeInitialized = false;

function cacheEnvelopeEls() {
  envelopeScene    = document.getElementById("envelopeScene");
  envelopeWrapper  = document.getElementById("envelopeWrapper");
  envelope         = document.getElementById("envelope");
  card             = document.getElementById("card");
  clickInstruction = document.getElementById("clickInstruction");
}

// ---- ENVELOPE AUTO-OPEN + INTERACTIONS ----
function openEnvelope() {
  if (!envelopeWrapper || isEnvelopeOpen) return;

  envelopeWrapper.classList.add("open");
  isEnvelopeOpen = true;

  if (clickInstruction) clickInstruction.style.opacity = "0";

  setTimeout(() => {
    if (!card) return;
    card.classList.add("animation-done");
  }, 1800);
}

function bindEnvelopeInteractions() {
  if (!envelopeWrapper) return;

  // Click vào thư: đang đóng → mở lại (thiệp bay ra); đã mở xong → hiện modal
  envelopeWrapper.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!isEnvelopeOpen) {
      openEnvelope();
    } else if (card && card.classList.contains("animation-done")) {
      openModal();
    }
  });

  // Hover peek-flip (desktop) → run typewriter, like the original project
  if (card) {
    card.addEventListener("mouseenter", function () {
      if (card.classList.contains("animation-done")) startTypewriterEffect();
    });
  }

  // Click outside envelope-wrapper (but inside scene) → close envelope
  envelopeScene.addEventListener("click", function (e) {
    if (isEnvelopeOpen && envelopeWrapper && !envelopeWrapper.contains(e.target)) {
      envelopeWrapper.classList.remove("open");
      isEnvelopeOpen = false;
      if (card) {
        card.classList.remove("animation-done");
        card.classList.remove("flipped");
      }
      if (clickInstruction) clickInstruction.style.opacity = "1";
    }
  });

  // Click on modal backdrop → close modal
  const modal = document.getElementById("wishModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
  }

  // ESC → close everything
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      if (envelopeWrapper) envelopeWrapper.classList.remove("open");
      isEnvelopeOpen = false;
      if (card) {
        card.classList.remove("animation-done");
        card.classList.remove("flipped");
      }
      if (clickInstruction) clickInstruction.style.opacity = "1";
    }
  });
}

// ---- TYPEWRITER EFFECT ----
let typewriterStarted = false;

// Tách chuỗi theo cụm grapheme để không cắt đôi emoji (cặp surrogate),
// ký tự có variation selector (❤️) hay chữ có dấu kết hợp (𝒐̛̣).
let _graphemeSegmenter = null;
function splitGraphemes(str) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    if (!_graphemeSegmenter) _graphemeSegmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    const out = [];
    for (const seg of _graphemeSegmenter.segment(str)) out.push(seg.segment);
    return out;
  }
  return Array.from(str); // fallback: ít nhất giữ nguyên cặp surrogate
}

function startTypewriterEffect() {
  if (typewriterStarted) return;
  typewriterStarted = true;

  const cardGreeting = document.querySelector(".card-greeting");
  const cardMessage  = document.querySelector(".card-message");
  const cardEnding   = document.querySelector(".card-ending");

  const elements = [cardGreeting, cardMessage, cardEnding];
  let totalDelay = 0;

  elements.forEach((el) => {
    if (!el) return;
    const text = el.textContent;
    el.innerHTML = "";
    el.classList.add("typewriter");

    splitGraphemes(text).forEach(function (ch, i) {
      const span = document.createElement("span");
      span.textContent = ch === " " ?" " : ch;
      span.style.animationDelay = `${totalDelay + i * 50}ms`;
      el.appendChild(span);
    });
    totalDelay += text.length * 50 + 300;
  });
}

// ---- FLYING HEARTS ----
let flyingHeartsInterval = null;

function createFlyingHeart() {
  const container = document.getElementById("flyingHearts");
  if (!container) return;

  const heart = document.createElement("div");
  heart.className = "flying-heart";

  const startPositionX = Math.random() * window.innerWidth;
  const size = Math.random() * 15 + 10;
  const duration = Math.random() * 3 + 4;
  const colors = ["#ff526f", "#ff7a8a", "#ff9a9e", "#fecfef", "#ffb3ba", "#e91e63"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const delay = Math.random() * 2;

  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;
  heart.style.left = `${startPositionX}px`;
  heart.style.backgroundColor = color;
  heart.style.animationDuration = `${duration}s`;
  heart.style.animationDelay = `${delay}s`;
  heart.style.bottom = "-50px";

  container.appendChild(heart);

  setTimeout(() => {
    if (heart.parentNode) heart.remove();
  }, (duration + delay + 2) * 1000);
}

function initializeFlyingHearts() {
  if (flyingHeartsInterval) return;
  const isMobile = window.innerWidth <= 768;
  const initialHearts = isMobile ? 15 : 20;
  const heartInterval = isMobile ? 600 : 500;

  for (let i = 0; i < initialHearts; i++) {
    setTimeout(createFlyingHeart, i * 200);
  }
  flyingHeartsInterval = setInterval(createFlyingHeart, heartInterval);
}

// ---- CONTENT INIT ----
function initializeEnvelopeContent() {
  const data = pickEnvelopeData();

  // Card cover title
  const cardTitleMain = document.querySelector(".card-title-main");
  const cardTitleSecondary = document.querySelectorAll(".card-title-secondary");
  if (cardTitleSecondary[0]) cardTitleSecondary[0].textContent = data.text1;
  if (cardTitleMain)         cardTitleMain.textContent = data.text;
  if (cardTitleSecondary[1]) cardTitleSecondary[1].textContent = data.text2;

  // Card body
  const cardGreeting = document.querySelector(".card-greeting");
  const cardMessage  = document.querySelector(".card-message");
  const cardEnding   = document.querySelector(".card-ending");
  const messageHtml  = String(data.message).replace(/\n/g, "<br>");

  if (cardGreeting) cardGreeting.style.display = "none";
  if (cardMessage)  cardMessage.innerHTML   = messageHtml;
  if (cardEnding)   cardEnding.style.display = "none";

  // Modal
  const modalTitle     = document.querySelector(".polaroid-text h2");
  const modalMessage   = document.querySelector(".polaroid-text p:first-of-type");
  const modalIntro     = document.querySelector(".polaroid-text p:nth-of-type(2)");
  const modalSignature = document.querySelector(".polaroid-text .signature");

  if (modalTitle)     modalTitle.style.display = "none";
  if (modalMessage)   modalMessage.innerHTML = messageHtml;
  if (modalIntro)     modalIntro.style.display = "none";
  if (modalSignature) modalSignature.style.display = "none";

  // Images — API không trả field image (_noImageFromApi) thì không hiển thị ảnh
  const noImage = window._noImageFromApi === true;
  const images = noImage ? [] : data.images;
  window._envelopeImages = images;
  const imageUrl = images[0];
  const cardBack = document.querySelector(".card-back");
  if (cardBack && imageUrl) {
    cardBack.style.backgroundImage = `url('${imageUrl}')`;
    cardBack.classList.add("has-image");
  }
  const polaroidImage = document.querySelector(".polaroid-image");
  const modalImage = document.querySelector(".polaroid-image img");
  if (!imageUrl) {
    if (polaroidImage) polaroidImage.style.display = "none";
  } else {
    if (polaroidImage) polaroidImage.style.display = "";
    if (modalImage) modalImage.src = imageUrl;
  }
}

// ---- MODAL ----
let modalOriginalContent = {};

function saveModalOriginalContent() {
  const modal = document.getElementById("wishModal");
  if (!modal) return;
  const elements = modal.querySelectorAll(
    ".polaroid-text h2, .polaroid-text p, .polaroid-text .signature"
  );
  elements.forEach((el, index) => { modalOriginalContent[index] = el.innerHTML; });
}

function applyTypewriterToElement(el, text, startDelay) {
  el.innerHTML = "";
  el.classList.add("typewriter-modal");

  const tokens = [];
  let i = 0;
  let currentWord = "";
  while (i < text.length) {
    if (text[i] === "<") {
      if (currentWord) { tokens.push({ type: "word", value: currentWord }); currentWord = ""; }
      const end = text.indexOf(">", i);
      if (end !== -1) {
        tokens.push({ type: "tag", value: text.substring(i, end + 1) });
        i = end + 1;
        continue;
      }
    }
    if (text[i] === "&") {
      const end = text.indexOf(";", i);
      if (end !== -1) {
        currentWord += text.substring(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    if (text[i] === " ") {
      if (currentWord) { tokens.push({ type: "word", value: currentWord }); currentWord = ""; }
      tokens.push({ type: "space" });
      i++;
      continue;
    }
    currentWord += text[i];
    i++;
  }
  if (currentWord) tokens.push({ type: "word", value: currentWord });

  let charIndex = 0;
  tokens.forEach((token) => {
    if (token.type === "tag") {
      const node = document.createRange().createContextualFragment(token.value);
      el.appendChild(node);
    } else if (token.type === "space") {
      el.appendChild(document.createTextNode(" "));
    } else {
      splitGraphemes(token.value).forEach(function (ch) {
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.animationDelay = `${startDelay + charIndex * 40}ms`;
        el.appendChild(span);
        charIndex++;
      });
    }
  });
  return charIndex;
}

function openModal() {
  const modal = document.getElementById("wishModal");
  if (!modal) return;
  modal.classList.add("show");

  const polaroidImage = modal.querySelector(".polaroid-image");
  if (polaroidImage) {
    polaroidImage.classList.remove("fade-in");
    setTimeout(() => polaroidImage.classList.add("fade-in"), 200);
  }

  if (Object.keys(modalOriginalContent).length === 0) saveModalOriginalContent();

  const elements = modal.querySelectorAll(
    ".polaroid-text h2, .polaroid-text p, .polaroid-text .signature"
  );
  let totalDelay = 500;
  elements.forEach((el, index) => {
    const text = modalOriginalContent[index] || el.innerHTML;
    const charCount = applyTypewriterToElement(el, text, totalDelay);
    totalDelay += charCount * 40 + 300;
  });
}

function closeModal() {
  const modal = document.getElementById("wishModal");
  if (!modal) return;
  const wasShowing = modal.classList.contains("show");
  modal.classList.remove("show");

  const polaroidImage = modal.querySelector(".polaroid-image");
  if (polaroidImage) polaroidImage.classList.remove("fade-in");

  const elements = modal.querySelectorAll(
    ".polaroid-text h2, .polaroid-text p, .polaroid-text .signature"
  );
  elements.forEach((el, index) => {
    if (modalOriginalContent[index] !== undefined) {
      el.innerHTML = modalOriginalContent[index];
      el.classList.remove("typewriter-modal");
    }
  });

  // Closing the modal (× button, backdrop, ESC) also launches the flying images.
  if (wasShowing) {
    const mainContent = envelopeScene && envelopeScene.querySelector(".main-content");
    if (mainContent) mainContent.classList.add("hidden");

    const images = window._envelopeImages || ENVELOPE_DEFAULTS.images;
    launchFlyingImages(images);
  }
}

// ---- HEART TAP (in modal) → close modal, which launches flying images ----
function onHeartTap() {
  closeModal();
}

function launchFlyingImages(images) {
  const container = document.getElementById("flyingImages");
  if (!container || !images || images.length === 0) return;
  container.innerHTML = "";

  const screenW = window.innerWidth;
  const isMobile = screenW <= 480;

  // Kích thước cố định, đẹp mắt — KHÔNG co lại theo số lượng ảnh.
  const baseSize = isMobile
    ? Math.min(150, Math.floor(screenW * 0.42))
    : Math.min(200, Math.floor(screenW * 0.2));

  const count = images.length;
  // Rải thời điểm phóng ảnh: mỗi ảnh cách nhau ~600ms, gói gọn tối đa ~8s dù nhiều ảnh.
  const launchWindow = count > 1 ? Math.min(count * 600, 8000) : 0;
  const step = count > 1 ? launchWindow / (count - 1) : 0;
  const maxFlight = 7500;

  let lastCenter = -1;

  images.forEach(function (imgSrc, index) {
    setTimeout(function () {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.className = "flying-photo";

      const size = Math.round(baseSize * (0.82 + Math.random() * 0.36));
      const half = size / 2;

      // Vị trí ngang ngẫu nhiên, luôn nằm trọn trong màn hình và tránh trùng ảnh trước.
      let center;
      let tries = 0;
      do {
        center = half + Math.random() * Math.max(0, screenW - size);
        tries++;
      } while (lastCenter >= 0 && Math.abs(center - lastCenter) < size * 0.5 && tries < 6);
      lastCenter = center;

      const duration = 6000 + Math.random() * 1500;

      img.style.width = size + "px";
      img.style.height = size + "px";
      img.style.left = center + "px";
      img.style.animationDuration = duration + "ms";

      container.appendChild(img);
      setTimeout(function () { if (img.parentNode) img.remove(); }, duration + 200);
    }, Math.round(index * step));
  });

  const totalTime = launchWindow + maxFlight + 500;
  setTimeout(function () {
    container.innerHTML = "";
    const mainContent = envelopeScene && envelopeScene.querySelector(".main-content");
    if (mainContent) mainContent.classList.remove("hidden");
    if (envelopeWrapper) envelopeWrapper.classList.remove("open");
    isEnvelopeOpen = false;
    if (card) {
      card.classList.remove("animation-done");
      card.classList.remove("flipped");
    }
    typewriterStarted = false;

    // Re-open automatically for subsequent visits
    setTimeout(openEnvelope, 600);
  }, totalTime);
}

window.onHeartTap = onHeartTap;
window.closeModal = closeModal;

// ---- PUBLIC ENTRY: called by scripts.js after cinematic transition ----
function showEnvelopeScene() {
  cacheEnvelopeEls();
  if (!envelopeScene) return;

  // Only reveal the envelope when the loaded config has a message,
  // or when previewing (?isPreview=true). Otherwise restore the 3D heart.
  const isPreview = (function () {
    try {
      return new URLSearchParams(window.location.search).get("isPreview") === "true";
    } catch (_) { return false; }
  })();
  if (!window._hasEnvelopeMessage && !isPreview) {
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.classList.remove("letter-hidden", "letter-zoom");
    document.body.classList.remove("letter-open");
    return;
  }

  if (!isEnvelopeInitialized) {
    initializeEnvelopeContent();
    bindEnvelopeInteractions();
    initializeFlyingHearts();
    isEnvelopeInitialized = true;
  }

  envelopeScene.classList.add("visible");

  // Auto-open envelope after scene fade-in (no click required)
  setTimeout(openEnvelope, 800);
}

window.showEnvelopeScene = showEnvelopeScene;
