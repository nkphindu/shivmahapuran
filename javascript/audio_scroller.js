const synth = window.speechSynthesis;

let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPlaying = false;

// Default slider language
const defaultLang = "en-US";

// Elements
const btnHi = document.getElementById("btn-hi");
const btnEn = document.getElementById("btn-en");
const slider = document.getElementById("audio-slider");
const sliderLabel = document.getElementById("slider-label");

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    loadTextChunks(defaultLang);

    if (slider) {
        slider.addEventListener("input", handleSliderChange);
        slider.disabled = false;
    }
});

// Load text sections
function loadTextChunks(lang) {
    const selector = lang === "hi-IN"
        ? ".point-hi"
        : ".point-en";

    textChunks = Array.from(
        document.querySelectorAll(selector)
    )
        .map(el => el.innerText.trim())
        .filter(text => text.length > 0);

    if (!textChunks.length) return;

    if (slider) {
        slider.max = textChunks.length - 1;

        if (chunkIndex > textChunks.length - 1) {
            chunkIndex = 0;
        }

        slider.value = chunkIndex;
        slider.disabled = false;
    }

    updateSliderUI();
}

// Main button logic
function toggleAudio(lang) {

    // If same language is playing, STOP
    if (currentLang === lang && isPlaying) {
        stopAllAudio();
        return;
    }

    // Stop existing playback
    synth.cancel();

    // Reset state
    currentLang = lang;
    isPlaying = true;

    // Load selected language
    loadTextChunks(lang);

    updateButtons();

    // Start reading
    speakCurrentChunk();
}

// Start speech
function speakCurrentChunk() {

    if (
        !currentLang ||
        chunkIndex >= textChunks.length ||
        !isPlaying
    ) {
        stopAllAudio();
        return;
    }

    updateSliderUI();

    const utter = new SpeechSynthesisUtterance(
        textChunks[chunkIndex]
    );

    utter.lang = currentLang;
    utter.rate = 0.75;

    utter.onend = () => {
        if (isPlaying) {
            chunkIndex++;
            setTimeout(speakCurrentChunk, 150);
        }
    };

    utter.onerror = () => stopAllAudio();

    synth.speak(utter);
}

// Slider movement
function handleSliderChange() {
    chunkIndex = parseInt(slider.value);

    updateSliderUI();

    if (currentLang && isPlaying) {
        synth.cancel();

        setTimeout(() => {
            speakCurrentChunk();
        }, 150);
    }
}

// Update slider label
function updateSliderUI() {
    if (slider) {
        slider.value = chunkIndex;
    }

    if (sliderLabel) {
        sliderLabel.innerText =
            `Section: ${chunkIndex + 1} / ${textChunks.length}`;
    }
}

// Stop all playback
function stopAllAudio() {
    synth.cancel();

    currentLang = null;
    isPlaying = false;

    resetButtons();

    // Keep slider active
    loadTextChunks(defaultLang);
}

// Reset buttons
function resetButtons() {

    if (btnHi) {
        btnHi.innerHTML =
            "🔊 शिव महापुराण हिंदी में सुनें";
        btnHi.style.background = "transparent";
        btnHi.style.color = "#d1c4b2";
    }

    if (btnEn) {
        btnEn.innerHTML =
            "🔊 Listen Shiv Mahapuran in English";
        btnEn.style.background = "transparent";
        btnEn.style.color = "#d1c4b2";
    }
}

// Update active button
function updateButtons() {
    resetButtons();

    const activeBtn =
        currentLang === "hi-IN"
            ? btnHi
            : btnEn;

    if (!activeBtn) return;

    activeBtn.innerHTML = "🛑 Stop Audio";
    activeBtn.style.backgroundColor = "#c5a059";
    activeBtn.style.color = "white";
}

// Cleanup
window.addEventListener("blur", stopAllAudio);
window.addEventListener("beforeunload", stopAllAudio);
