// Speech Utility for TTS and STT

/* ── TTS — Browser Web Speech API ── */
export function speakText(text, onStart, onEnd) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return false; // Stopped
    }

    if (!('speechSynthesis' in window)) {
        return null; // Not supported
    }

    const clean = text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.92;
    utter.pitch = 1.0;
    utter.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
    if (preferred) utter.voice = preferred;

    utter.onstart = onStart;
    utter.onend = utter.onerror = onEnd;

    window.speechSynthesis.speak(utter);
    return true; // Started
}

/* ── STT — Browser Web Speech API ── */
export function createRecognition({ onStart, onResult, onError, onEnd }) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = onStart;
    recognition.onresult = (event) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t;
            else interim += t;
        }
        onResult(final || interim, !!final);
    };
    recognition.onspeechend = () => recognition.stop();
    recognition.onerror = onError;
    recognition.onend = onEnd;

    return recognition;
}
