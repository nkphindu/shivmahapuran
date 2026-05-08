const synth = window.speechSynthesis;

let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPaused = false;
let isPlaying = false;

// Elements
const btnHi = document.getElementById("btn-hi");
const btnEn = document.getElementById("btn-en");
const slider = document.getElementById("audio-slider");
const sliderLabel = document.getElementById("slider-label");

// Initialize slider
document.addEventListener("DOMContentLoaded", () => {
    if (slider) {
        slider.addEventListener("input", handleSliderChange);
        slider.disabled = true;
    }
});

// Setup content for chosen language
function loadTextChunks(lang) {
    const selector = lang === "hi-IN" ? ".point-hi" : ".point-en";

    textChunks = Array.from(document.querySelectorAll(selector))
        .map(el => el.innerText.trim())
        .filter(text => text.length > 0);

    if (slider) {
        slider.max = textChunks.length - 1;
        slider.disabled = false;
    }

    updateSliderUI();
}

// Main button logic
function toggleAudio(lang) {

    // Switching to another language
    if (currentLang && currentLang !== lang) {
        synth.cancel();
        resetPlaybackState();
    }

    // First time start
    if (!currentLang) {
        currentLang = lang;
        loadTextChunks(lang);
        startPlayback();
        return;
    }

    // Same language controls
    if (currentLang === lang) {

        if (isPlaying && !isPaused) {
            pausePlayback();
            return;
        }

        if (isPaused) {
            resumePlayback();
            return;
        }

        if (!isPlaying) {
            startPlayback();
            return;
        }
    }
}

// Start reading
function startPlayback() {
    if (!textChunks.length) return;

    isPaused = false;
    isPlaying = true;

    updateButtons();

    speakCurrentChunk();
}

// Pause reading
function pausePlayback() {
    synth.cancel(); // mobile-safe
    isPaused = true;
    isPlaying = true;

    updateButtons();
}

// Resume reading
function resumePlayback() {
    isPaused = false;
    isPlaying = true;

    updateButtons();

    speakCurrentChunk();
}

// Speak selected section
function speakCurrentChunk() {
    if (
        !currentLang ||
        chunkIndex >= textChunks.length ||
        isPaused
    ) {
        if (chunkIndex >= textChunks.length) {
            stopAllAudio();
        }
        return;
    }

    updateSliderUI();

    const utter = new SpeechSynthesisUtterance(
        textChunks[chunkIndex]
    );

    utter.lang = currentLang;
    utter.rate = 0.75;

    utter.onend = () => {
        if (!isPaused) {
            chunkIndex++;
            setTimeout(speakCurrentChunk, 150);
        }
    };

    utter.onerror = () => stopAllAudio();

    synth.speak(utter);
}

// Slider handler
function handleSliderChange() {
    chunkIndex = parseInt(slider.value);

    updateSliderUI();

    if (currentLang) {
        synth.cancel();

        if (!isPaused) {
            setTimeout(() => {
                speakCurrentChunk();
            }, 150);
        }
    }
}

// Update slider display
function updateSliderUI() {
    if (slider) {
        slider.value = chunkIndex;
    }

    if (sliderLabel) {
        sliderLabel.innerText = `Section: ${chunkIndex + 1} / ${textChunks.length}`;
    }
}

// Stop completely
function stopAllAudio() {
    synth.cancel();
    resetPlaybackState();
    resetButtons();

    if (slider) {
        slider.value = 0;
    }

    if (sliderLabel) {
        sliderLabel.innerText = "Section: 1";
    }
}

// Reset playback variables
function resetPlaybackState() {
    currentLang = null;
    textChunks = [];
    chunkIndex = 0;
    isPaused = false;
    isPlaying = false;
}

// Button UI
function resetButtons() {
    if (btnHi) {
        btnHi.innerHTML = "🔊 शिव महापुराण हिंदी में सुनें";
        btnHi.style.background = "transparent";
        btnHi.style.color = "#d1c4b2";
    }

    if (btnEn) {
        btnEn.innerHTML = "🔊 Listen Shiv Mahapuran in English";
        btnEn.style.background = "transparent";
        btnEn.style.color = "#d1c4b2";
    }
}

// Dynamic button states
function updateButtons() {
    resetButtons();

    const activeBtn =
        currentLang === "hi-IN" ? btnHi : btnEn;

    if (!activeBtn) return;

    if (isPaused) {
        activeBtn.innerHTML = "▶️ Resume Audio";
        activeBtn.style.backgroundColor = "#28a745";
    } else {
        activeBtn.innerHTML = "⏸️ Pause Audio";
        activeBtn.style.backgroundColor = "#c5a059";
    }

    activeBtn.style.color = "white";
}

// Cleanup
window.addEventListener("blur", stopAllAudio);
window.addEventListener("beforeunload", stopAllAudio);