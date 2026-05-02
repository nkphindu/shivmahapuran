const synth = window.speechSynthesis;
let currentLang = null;
let textChunks = [];
let chunkIndex = 0;
let isPaused = false; // New state tracker

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
            if (isPaused) {
                btn.innerHTML = `▶️ RESUME AUDIO`;
                btn.style.backgroundColor = "#59c5a0"; // Greenish for resume
            } else {
                btn.innerHTML = `⏸️ PAUSE AUDIO`;
                btn.style.backgroundColor = "#c5a059"; // Gold for pause
            }
            btn.style.color = "white";
        } else {
            btn.innerHTML = btn.id === 'btn-hi' ? "🔊 शिव महापुराण हिंदी में सुनें" : "🔊 Listen Shiv Mahapuran in English";
            btn.style.background = "transparent";
            btn.style.color = "#d1c4b2";
        }
    });
}

function toggleAudio(lang) {
    // 1. If speaking and same language, handle Pause/Resume
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

    // 2. If changing language or starting fresh
    stopAllAudio();
    
    currentLang = lang;
    isPaused = false;
    const selector = lang === 'hi-IN' ? '.point-hi' : '.point-en';
    const elements = document.querySelectorAll(selector);
    textChunks = Array.from(elements).map(el => el.innerText);

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

    const utter = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
    utter.lang = currentLang;
    utter.rate = 0.75;

    utter.onend = () => {
        // Only move to next if we aren't currently paused 
        // (onend can trigger when paused on some browsers)
        if (!isPaused) {
            chunkIndex++;
            setTimeout(playChunk, 100);
        }
    };

    utter.onerror = () => stopAllAudio();

    synth.speak(utter);
}

// Global listeners to prevent ghost audio
window.addEventListener('blur', () => {
    // Optional: Use synth.pause() instead of stop if you want it to 
    // resume when they come back to the tab.
    stopAllAudio(); 
});
window.addEventListener('beforeunload', stopAllAudio);