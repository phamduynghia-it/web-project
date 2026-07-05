const mailbox = document.getElementById("mailbox");
const mailboxWrapper = document.getElementById("mailboxWrapper");
const letter = document.getElementById("letter");
const heartsContainer = document.getElementById("heartsContainer");
const backgroundMusic = document.getElementById("backgroundMusic");
let isOpened = false;
let musicPlayed = false;

// Create hearts on page load
function createHearts() {
    const heartCount = 15; // Number of hearts
    const sizes = ['size-small', 'size-medium', 'size-large', 'size-xlarge'];
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = `heart ${sizes[Math.floor(Math.random() * sizes.length)]}`;
        
        const img = document.createElement('img');
        img.src = 'images/heart.png';
        img.alt = 'heart';
        heart.appendChild(img);
        
        // Random position
        const left = Math.random() * 100; // 0-100%
        const top = Math.random() * 100; // 0-100%
        
        heart.style.left = `${left}%`;
        heart.style.top = `${top}%`;
        
        // Random delay for appearance (0-0.4s) for staggered effect
        const delay = Math.random() * 0.4;
        heart.style.animationDelay = `${delay}s, ${3.5 + delay}s`;
        
        heartsContainer.appendChild(heart);
    }
}

// Initialize hearts when page loads
window.addEventListener('DOMContentLoaded', () => {
    createHearts();
});

// Function to play music
function playMusic() {
    if (!musicPlayed && backgroundMusic) {
        backgroundMusic.play().catch(error => {
            console.log("Audio play failed:", error);
            // Some browsers require user interaction first
        });
        musicPlayed = true;
    }
}

// Play music when clicking anywhere on the screen
document.addEventListener("click", () => {
    playMusic();
});

// Play music on touch for mobile
document.addEventListener("touchstart", () => {
    playMusic();
}, { once: true });

mailbox.addEventListener("click", () => {
    if (isOpened) return; // Prevent multiple clicks
    
    isOpened = true;
    
    // Play music when opening mailbox
    playMusic();
    
    // Add opened class to show open mailbox
    mailbox.classList.add("opened");
    
    // Wait a bit for the mailbox to open, then show letter
    setTimeout(() => {
        letter.classList.add("show");
    }, 300);
    
    // Disable cursor pointer after opening
    mailbox.style.cursor = "default";
});

// Touch event for better mobile support
mailbox.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!isOpened) {
        mailbox.click();
    }
}, { passive: false });
