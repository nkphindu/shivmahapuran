const synth = window.speechSynthesis;
let currentLang = null;
let textChunks = [];
let chunkIndex = 0;

function stopAllAudio() {
	synth.cancel();
	currentLang = null;
	textChunks = [];
	chunkIndex = 0;

	const btnHi = document.getElementById('btn-hi');
	const btnEn = document.getElementById('btn-en');
	
	[btnHi, btnEn].forEach(btn => {
		if (btn) {
			btn.innerHTML = btn.id === 'btn-hi' ? "🔊 शिव महापुराण हिंदी में सुनें" : "🔊 Listen Shiv Mahapuran in English";
			btn.style.background = "transparent";
			btn.style.color = "#d1c4b2";
		}
	});
}

function toggleAudio(lang) {
	// 1. Check if we are toggling the same language OFF
	if (synth.speaking && currentLang === lang) {
		stopAllAudio();
		return;
	}

	// 2. Kill current speech and reset UI
	synth.cancel(); 
	
	// Reset buttons manually here for instant feedback
	const btnHi = document.getElementById('btn-hi');
	const btnEn = document.getElementById('btn-en');
	btnHi.innerHTML = "🔊 शिव महापुराण हिंदी में सुनें"; btnHi.style.background = "transparent";
	btnEn.innerHTML = "🔊 Listen Shiv Mahapuran in English"; btnEn.style.background = "transparent";

	// 3. Setup new language
	currentLang = lang;
	const selector = lang === 'hi-IN' ? '.point-hi' : '.point-en';
	const elements = document.querySelectorAll(selector);
	textChunks = Array.from(elements).map(el => el.innerText);

	if (textChunks.length === 0) return;

	// 4. Update Active Button UI
	const activeBtn = document.getElementById(lang === 'hi-IN' ? 'btn-hi' : 'btn-en');
	activeBtn.innerHTML = `🛑 STOP AUDIO`;
	activeBtn.style.backgroundColor = "#c5a059";
	activeBtn.style.color = "white";

	chunkIndex = 0;

	/** * MOBILE CRITICAL FIX: 
	 * We MUST call speak() immediately inside the click event. 
	 * Mobile browsers will block speak() if it's delayed by logic.
	 */
	const firstUtterance = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
	firstUtterance.lang = currentLang;
	firstUtterance.rate = 0.75;

	firstUtterance.onend = () => {
		chunkIndex++;
		speakNext();
	};

	firstUtterance.onerror = () => stopAllAudio();

	// This direct call satisfies the mobile browser's security policy
	synth.speak(firstUtterance);
}

function speakNext() {
	// If user stopped it or we reached the end, quit.
	if (!currentLang || chunkIndex >= textChunks.length) {
		stopAllAudio();
		return;
	}

	const utter = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
	utter.lang = currentLang;
	utter.rate = 0.75;

	utter.onend = () => {
		chunkIndex++;
		setTimeout(speakNext, 100);
	};

	utter.onerror = () => stopAllAudio();

	synth.speak(utter);
}
window.addEventListener('blur', stopAllAudio);
window.addEventListener('beforeunload', stopAllAudio);
