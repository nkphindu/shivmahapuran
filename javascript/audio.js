const synth = window.speechSynthesis;
let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPaused = false;

function stopAllAudio() {
    synth.cancel();
    currentLang = null;
    textChunks = [];
    chunkIndex = 0;
    isPaused = false;
    updateButtonUI(null);
}

function updateButtonUI(lang) {
    const btnHi = document.getElementById('btn-hi');
    const btnEn = document.getElementById('btn-en');
    const buttons = [btnHi, btnEn];

    buttons.forEach(btn => {
        if (!btn) return;
        const isCurrent = (lang === 'hi-IN' && btn.id === 'btn-hi') || (lang === 'en-US' && btn.id === 'btn-en');

        if (isCurrent) {
            btn.innerHTML = isPaused ? `▶️ RESUME AUDIO` : `⏸️ PAUSE AUDIO`;
            btn.style.backgroundColor = isPaused ? "#28a745" : "#c5a059";
            btn.style.color = "white";
        } else {
            btn.innerHTML = btn.id === 'btn-hi' ? "🔊 शिव महापुराण हिंदी में सुनें" : "🔊 Listen Shiv Mahapuran in English";
            btn.style.background = "transparent";
            btn.style.color = "#d1c4b2";
        }
    });
}

function toggleAudio(lang) {
    if (currentLang === lang) {
        if (synth.speaking && !isPaused) {
            // Logic for Pausing
            synth.pause();
            isPaused = true;
            updateButtonUI(lang);
            return;
        } else if (isPaused) {
            // Logic for Resuming
            isPaused = false;
            updateButtonUI(lang);
            
            /**
             * CRITICAL MOBILE FIX:
             * On mobile, resume() often hangs. We cancel the "frozen" 
             * state and manually trigger a new speak command for the current chunk.
             */
            synth.resume(); // Try official first
            
            setTimeout(() => {
                // If it's still not speaking after 150ms, the engine is dead.
                // We force a restart of the current sentence.
                if (!synth.speaking) {
                    synth.cancel(); 
                    playChunk();
                }
            }, 150);
            return;
        }
    }

    // New Session
    stopAllAudio();
    currentLang = lang;
    const selector = lang === 'hi-IN' ? '.point-hi' : '.point-en';
    const elements = document.querySelectorAll(selector);

    textChunks = [];
    elements.forEach(el => {
        // Sentence splitting ensures that a 'restart' only repeats the current sentence
        const sentences = el.innerText.match(/[^.।!?]+[.।!?]*/g) || [el.innerText];
        sentences.forEach(s => { if(s.trim().length > 0) textChunks.push(s.trim()); });
    });

    if (textChunks.length === 0) return;
    updateButtonUI(lang);
    chunkIndex = 0;
    playChunk();
}

function playChunk() {
    if (!currentLang || chunkIndex >= textChunks.length) {
        stopAllAudio();
        return;
    }

    // Media Session prevents the OS from killing the browser process
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentLang === 'hi-IN' ? 'शिव महापुराण' : 'Shiv Mahapuran',
            artist: 'Satarudra Samhita'
        });
    }

    const utter = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
    utter.lang = currentLang;
    utter.rate = 0.85;

    utter.onend = () => {
        if (!isPaused) {
            chunkIndex++;
            playChunk();
        }
    };

    utter.onerror = (e) => {
        // Interrupted is a common mobile status when screen locks; don't reset index.
        if (e.error !== 'interrupted' && !isPaused) {
            stopAllAudio();
        }
    };

    synth.speak(utter);
}

// Handle lock screen/tab switch by pausing.
window.addEventListener('blur', () => {
    if (synth.speaking && !isPaused) {
        synth.pause();
        isPaused = true;
        updateButtonUI(currentLang);
    }
});

window.addEventListener('beforeunload', stopAllAudio);