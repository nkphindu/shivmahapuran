const synth = window.speechSynthesis;
let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPaused = false;

/**
 * Completely stops audio and resets all states.
 * Use this for language switching or when audio finishes.
 */
function stopAllAudio() {
    synth.cancel();
    currentLang = null;
    textChunks = [];
    chunkIndex = 0;
    isPaused = false;

    updateButtonUI(null);
}

/**
 * Updates the button appearance based on the current state:
 * - Playing: ⏸️ PAUSE
 * - Paused: ▶️ RESUME
 * - Stopped: 🔊 Listen...
 */
function updateButtonUI(lang) {
    const btnHi = document.getElementById('btn-hi');
    const btnEn = document.getElementById('btn-en');
    const buttons = [btnHi, btnEn];

    buttons.forEach(btn => {
        if (!btn) return;
        
        const isCurrent = (lang === 'hi-IN' && btn.id === 'btn-hi') || (lang === 'en-US' && btn.id === 'btn-en');

        if (isCurrent) {
            if (isPaused) {
                btn.innerHTML = `▶️ RESUME AUDIO`;
                btn.style.backgroundColor = "#28a745"; // Green for resume
            } else {
                btn.innerHTML = `⏸️ PAUSE AUDIO`;
                btn.style.backgroundColor = "#c5a059"; // Gold for pause
            }
            btn.style.color = "white";
        } else {
            // Reset the other button to its original state
            btn.innerHTML = btn.id === 'btn-hi' ? "🔊 शिव महापुराण हिंदी में सुनें" : "🔊 Listen Shiv Mahapuran in English";
            btn.style.background = "transparent";
            btn.style.color = "#d1c4b2";
        }
    });
}

/**
 * Handles the click logic for the audio buttons.
 */
function toggleAudio(lang) {
    // 1. If the same language is already active, toggle Pause/Resume
    if (currentLang === lang) {
        if (synth.speaking && !isPaused) {
            synth.pause();
            isPaused = true;
            updateButtonUI(lang);
            return;
        } else if (isPaused) {
            synth.resume();
            isPaused = false;
            updateButtonUI(lang);
            return;
        }
    }

    // 2. If a different language is clicked or starting new, stop current audio
    stopAllAudio();
    
    currentLang = lang;
    isPaused = false;
    
    // Select text based on language
    const selector = lang === 'hi-IN' ? '.point-hi' : '.point-en';
    const elements = document.querySelectorAll(selector);
    textChunks = Array.from(elements).map(el => el.innerText);

    if (textChunks.length === 0) return;

    updateButtonUI(lang);
    chunkIndex = 0;
    
    // Start playback
    playChunk();
}

/**
 * Plays the current text chunk.
 */
function playChunk() {
    if (!currentLang || chunkIndex >= textChunks.length) {
        stopAllAudio();
        return;
    }

    // "Keep Alive" Metadata for mobile lock screens
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentLang === 'hi-IN' ? 'शिव महापुराण' : 'Shiv Mahapuran',
            artist: 'Satarudra Samhita',
            album: 'Shiva Puran'
        });
        
        // Handle lock-screen play/pause buttons if supported
        navigator.mediaSession.setActionHandler('play', () => { synth.resume(); isPaused = false; updateButtonUI(currentLang); });
        navigator.mediaSession.setActionHandler('pause', () => { synth.pause(); isPaused = true; updateButtonUI(currentLang); });
    }

    const utter = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
    utter.lang = currentLang;
    utter.rate = 0.75;

    utter.onend = () => {
        // Only proceed to next chunk if not intentionally paused
        if (!isPaused) {
            chunkIndex++;
            setTimeout(playChunk, 100);
        }
    };

    utter.onerror = (event) => {
        console.error("Speech Error:", event);
        stopAllAudio();
    };

    synth.speak(utter);
}

/**
 * Event Listeners for Tab/Phone behavior
 */

// PAUSE when screen locks or tab switches (prevents losing progress)
window.addEventListener('blur', () => {
    if (synth.speaking && !isPaused) {
        synth.pause();
        isPaused = true;
        updateButtonUI(currentLang);
    }
});

// KILL audio only when the tab/browser is actually closed
window.addEventListener('beforeunload', stopAllAudio);