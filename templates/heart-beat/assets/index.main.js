
const appStyles = `
html, body {
  background: #000 !important;
  color-scheme: dark;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family: Arial, sans-serif;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}

body {
  background: #000;
  background: radial-gradient(circle, #111 0%, #000 100%);
}

canvas {
  display: block;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

@media screen and (max-width: 768px) {
  canvas {
    max-width: 100vw;
    max-height: 100vh;
  }
  * {
    touch-action: manipulation;
  }
}

@supports (-webkit-touch-callout: none) {
  body {
    -webkit-overflow-scrolling: touch;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}

#musicToggle {
  position: fixed;
  top: 20px;
  right: 20px;
  font-size: 20px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(185, 28, 28, 0.3));
  border: 2px solid rgba(220, 38, 38, 0.6);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4),
              0 0 20px rgba(220, 38, 38, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: #fff;
  backdrop-filter: blur(10px);
}

#musicToggle:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.5));
  border-color: rgba(239, 68, 68, 0.9);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6),
              0 0 30px rgba(239, 68, 68, 0.4);
  transform: scale(1.1);
}

#musicToggle:active {
  transform: scale(0.95);
}

#musicToggle i {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes pulse-heart {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4),
                0 0 20px rgba(220, 38, 38, 0.2);
  }
  50% {
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6),
                0 0 30px rgba(239, 68, 68, 0.4);
  }
}

#musicToggle.playing {
  animation: pulse-heart 2s ease-in-out infinite;
}

/* Shooting Stars Container */
.shooting-stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* Shooting Star Animation */
@keyframes shooting-star-opacity {
  0% { opacity: 0; }
  40% { opacity: 1; }
  60% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes shooting-star-pos {
  0% {
    transform: scale(0) rotate(0) translate3d(0, 0, 0);
  }
  100% {
    transform: scale(1) rotate(0) translate3d(-450px, 450px, 0);
  }
}

.shooting-star {
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  transform-origin: 100% 0;
  animation: shooting-star-opacity 6s infinite ease-in,
             shooting-star-pos 6s infinite ease-in;
  box-shadow: 0 0 8px 3px rgba(255, 255, 255, 0.4);
  opacity: 0;
}

.shooting-star:after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 3px;
  border: 0 solid #fff;
  border-width: 0 80px 1.5px;
  border-color: transparent transparent transparent rgba(255, 255, 255, 0.4);
  transform: rotate(-45deg) translate3d(1px, 2px, 0);
  box-shadow: 0 0 2px 0 rgba(255, 255, 255, 0.2);
  transform-origin: 0% 100%;
}
`;

// Inject styles into the document
const styleElement = document.createElement("style");
styleElement.type = "text/css";
styleElement.innerHTML = appStyles;
document.head.appendChild(styleElement);



// Create shooting stars container
const shootingStarsContainer = document.createElement('div');
shootingStarsContainer.className = 'shooting-stars';
shootingStarsContainer.id = 'shooting-stars';
document.body.appendChild(shootingStarsContainer);

// Function to create shooting stars
function createShootingStars() {
  const numShootingStars = 20; // Number of shooting stars

  for (let i = 0; i < numShootingStars; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';

    // Random starting positions (top-right area for diagonal movement)
    const startX = Math.random() * (window.innerWidth * 0.8) + (window.innerWidth * 0.2);
    const startY = Math.random() * (window.innerHeight * 0.3);

    shootingStar.style.left = startX + 'px';
    shootingStar.style.top = startY + 'px';

    // Random animation delay (0-10 seconds)
    const delay = Math.random() * 10;
    shootingStar.style.animationDelay = delay + 's';

    // Add some size variation
    const size = 3 + Math.random() * 3; // 3-6px
    shootingStar.style.width = size + 'px';
    shootingStar.style.height = size + 'px';

    shootingStarsContainer.appendChild(shootingStar);
  }

  console.log(`Created ${numShootingStars} shooting stars`);
}

// Create shooting stars when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createShootingStars);
} else {
  createShootingStars();
}
// Prevent common developer tools shortcuts
document.addEventListener("keydown", function (event) {
  // Block F12 (DevTools)
  if (
    "F12" === event.key ||
    // Block Ctrl+Shift+I/J (Inspect Element/Console)
    (event.ctrlKey &&
      event.shiftKey &&
      ("I" === event.key || "J" === event.key)) ||
    // Block Ctrl+U (View Source)
    (event.ctrlKey && "U" === event.key)
  ) {
    event.preventDefault();
  }
});

console.log("Heart Message Application - Main entry point loaded successfully");
