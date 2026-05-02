const synth = window.speechSynthesis;
let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPaused = false;

/**
 * Resets the entire audio state.
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
 * Updates the UI state of the buttons.
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
                btn.style.backgroundColor = "#28a745"; // Green
            } else {
                btn.innerHTML = `⏸️ PAUSE AUDIO`;
                btn.style.backgroundColor = "#c5a059"; // Gold
            }
            btn.style.color = "white";
        } else {
            btn.innerHTML = btn.id === 'btn-hi' ? "🔊 शिव महापुराण हिंदी में सुनें" : "🔊 Listen Shiv Mahapuran in English";
            btn.style.background = "transparent";
            btn.style.color = "#d1c4b2";
        }
    });
}

/**
 * Toggles play, pause, and resume.
 */
function toggleAudio(lang) {
    // 1. If the same language is active
    if (currentLang === lang) {
        if (synth.speaking && !isPaused) {
            synth.pause();
            isPaused = true;
            updateButtonUI(lang);
            return;
        } else if (isPaused) {
            isPaused = false;
            updateButtonUI(lang);
            
            // Try official resume first
            synth.resume();

            // MOBILE FIX: If resume fails to start audio within 200ms, force restart the chunk
            setTimeout(() => {
                if (!synth.speaking) {
                    synth.cancel();
                    playChunk();
                }
            }, 200);
            return;
        }
    }

    // 2. Starting fresh or switching languages
    stopAllAudio();
    currentLang = lang;
    
    const selector = lang === 'hi-IN' ? '.point-hi' : '.point-en';
    const elements = document.querySelectorAll(selector);

    // MICRO-CHUNKING: Split long text into sentences to prevent "restart-from-beginning" bugs
    textChunks = [];
    elements.forEach(el => {
        // Splitting by English periods and Hindi Purna Viram
        const sentences = el.innerText.match(/[^.।!?]+[.।!?]*/g) || [el.innerText];
        sentences.forEach(s => {
            const trimmed = s.trim();
            if (trimmed.length > 0) textChunks.push(trimmed);
        });
    });

    if (textChunks.length === 0) return;

    updateButtonUI(lang);
    chunkIndex = 0;
    playChunk();
}

/**
 * Handles the playback of individual sentence chunks.
 */
function playChunk() {
    if (!currentLang || chunkIndex >= textChunks.length) {
        stopAllAudio();
        return;
    }

    // Media Session: This keeps the mobile browser's audio process prioritized
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentLang === 'hi-IN' ? 'शिव महापुराण' : 'Shiv Mahapuran',
            artist: 'Satarudra Samhita',
            album: 'Shiva Puran'
        });

        navigator.mediaSession.setActionHandler('play', () => { 
            if (isPaused) { isPaused = false; synth.resume(); updateButtonUI(currentLang); } 
        });
        navigator.mediaSession.setActionHandler('pause', () => { 
            if (!isPaused) { isPaused = true; synth.pause(); updateButtonUI(currentLang); } 
        });
    }

    const utter = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
    utter.lang = currentLang;
    utter.rate = 0.85; // Optimal speed for mobile clarity

    utter.onend = () => {
        // Only move to next chunk if we didn't hit pause
        if (!isPaused) {
            chunkIndex++;
            playChunk();
        }
    };

    utter.onerror = (e) => {
        // Ignore "interrupted" errors (common on lock screens) and keep going
        if (e.error !== 'interrupted') {
            console.error("Speech Error:", e);
            stopAllAudio();
        }
    };

    synth.speak(utter);
}

/**
 * Tab/Phone Behavior: Pause instead of Stop.
 */
window.addEventListener('blur', () => {
    if (synth.speaking && !isPaused) {
        synth.pause();
        isPaused = true;
        updateButtonUI(currentLang);
    }
});

window.addEventListener('beforeunload', stopAllAudio);