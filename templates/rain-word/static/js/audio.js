document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("background-music");
    let hasStarted = false;

    // Function to start music
    function startMusic() {
        if (!hasStarted) {
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then((_) => {
                        hasStarted = true;
                        console.log("Music started successfully");
                    })
                    .catch((error) => {
                        console.log("Playback failed:", error);
                    });
            }
        }
    }

    // Add touch event listener to the entire document
    document.addEventListener(
        "touchstart",
        function (e) {
            e.preventDefault();
            startMusic();
        },
        { once: true }
    ); // Only trigger once

    // Add click event listener as fallback for non-touch devices
    document.addEventListener(
        "click",
        function (e) {
            e.preventDefault();
            startMusic();
        },
        { once: true }
    ); // Only trigger once

    // Add event listener for when audio ends to restart it
    audio.addEventListener("ended", function () {
        audio.currentTime = 0;
        audio.play();
    });
});
