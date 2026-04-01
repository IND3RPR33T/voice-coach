import React, { useState, useEffect, useRef } from 'react';
import { askQuestion } from '../utils/api';
import { createRecognition } from '../utils/speech';
import VoiceSphere from '../components/sphere';

const ChatPanel = ({ sessionId, currentTopic }) => {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: "👋 Hi! I'm your AI training coach. Ask me anything about workplace safety, procedures, or skills. I'll answer in simple, clear language.\n\nYou can also use the 🎤 microphone to ask with your voice!",
            time: 'Just now'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [sttStatus, setSttStatus] = useState('');
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const [volume, setVolume] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const handleSend = async (overrideInput) => {
        const q = overrideInput || input;
        if (!q.trim()) return;

        const newMsg = {
            role: 'user',
            text: q,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await askQuestion(q, currentTopic, sessionId);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: res.answer || 'No response from AI',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "⚠️ I'm in offline mode. Please check your connection.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const startVolumeDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVolume(average / 128); // Normalize to ~0-1
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
        } catch (err) {
            console.error("Volume detection failed", err);
        }
    };

    const stopVolumeDetection = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        analyserRef.current = null;
        setVolume(0);
    };

    const toggleMic = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            stopVolumeDetection();
            return;
        }

        const rec = createRecognition({
            onStart: () => {
                setIsRecording(true);
                setSttStatus('🎙️ Listening… speak now');
                startVolumeDetection();
            },
            onResult: (text, isFinal) => {
                setInput(text);
                if (isFinal) {
                    setSttStatus('✅ Voice captured!');
                }
            },
            onError: (e) => {
                console.error(e);
                setIsRecording(false);
            },
            onEnd: () => {
                setIsRecording(false);
                setSttStatus('');
                stopVolumeDetection();
            }
        });

        if (rec) {
            recognitionRef.current = rec;
            rec.start();
        } else {
            alert('Speech recognition not supported in this browser.');
        }
    };

    // Trigger auto-send after recording ends if there's content
    useEffect(() => {
        if (!isRecording && input && sttStatus === '✅ Voice captured!') {
            handleSend(input);
        }
    }, [isRecording, sttStatus]);

    return (
        <div className="panel active" id="panel-chat" style={{ position: 'relative', overflow: 'hidden' }}>
            <VoiceSphere isActive={isTyping} volume={isRecording ? volume : 0} />
            
            <div className="chat-messages" style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                        <div className={`avatar ${m.role}`}>{m.role === 'ai' ? '🤖' : '👤'}</div>
                        <div>
                            <div className="bubble" style={{ 
                                whiteSpace: 'pre-wrap', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                {m.text}
                            </div>
                            <div className="bubble-time">{m.time}</div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message ai">
                        <div className="avatar ai">🤖</div>
                        <div>
                            <div className="bubble" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(4px)' }}>
                                <div className="typing-indicator">
                                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '0 20px 4px', position: 'relative', zIndex: 1 }}>
                {sttStatus && <div className="stt-status" style={{ display: 'block' }}>{sttStatus}</div>}
            </div>

            <div className="chat-input-area" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
                <button
                    className={`mic-btn ${isRecording ? 'recording' : ''}`}
                    onClick={toggleMic}
                >
                    {isRecording ? '⏹️' : '🎤'}
                </button>
                <input
                    className="chat-input"
                    placeholder={isRecording ? '🎙️ Listening…' : 'Ask anything about your training…'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="btn-primary" onClick={() => handleSend()}>Send</button>
            </div>
            <div className="voice-hint">🌐 Voice powered by Web Speech API</div>
        </div>
    );
};

export default ChatPanel;
