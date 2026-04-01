import React, { useState } from 'react';
import { generateLesson } from '../utils/api';
import { speakText } from '../utils/speech';

const LessonPanel = ({ sessionId, onLessonDone, onSwitchToQuiz }) => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [lessonData, setLessonData] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleGenerate = async (inputTopic) => {
        const t = inputTopic || topic;
        if (!t.trim()) return;

        setLoading(true);
        setLessonData(null);
        try {
            const res = await generateLesson(t, sessionId);
            if (res.success) {
                setLessonData(res.data);
                onLessonDone(res.session);
            }
        } catch (e) {
            console.error(e);
            // Fallback demo data
            setLessonData({
                title: `Quick Guide: ${t}`,
                summary: `A practical microlesson on ${t} for your workplace.`,
                lesson: `Understanding ${t} keeps you and your team safe. Always follow standard procedures.`,
                examples: [`Example 1 for ${t}`, `Example 2 for ${t}`],
                key_takeaway: `Apply ${t} every day!`,
                emoji: '📘'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSpeak = () => {
        const text = lessonData?.lesson || '';
        const started = speakText(
            text,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
        );
        if (started === false) setIsSpeaking(false);
    };

    return (
        <div className="lesson-panel">
            <div className="panel-header">
                <div>
                    <h2>📚 Learn a New Topic</h2>
                    <p>Type any topic and get an instant microlesson in seconds</p>
                </div>
            </div>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="e.g. Fire Safety, PPE, Machine Handling…"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button className="btn-primary" onClick={() => handleGenerate()} disabled={loading}>
                    {loading ? <span className="spinner"></span> : '✨ Generate Lesson'}
                </button>
            </div>

            <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '10px' }}>Quick topics:</p>
                <div className="quick-topics">
                    {['Fire Safety', 'PPE Usage', 'First Aid', 'Machine Safety', 'Food Hygiene'].map(t => (
                        <button key={t} className="quick-btn" onClick={() => { setTopic(t); handleGenerate(t); }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px', borderWidth: '3px' }}></div>
                    <p>Generating your microlesson…</p>
                </div>
            )}

            {lessonData && (
                <div className="lesson-card">
                    <div className="lesson-card-header">
                        <div className="lesson-emoji">{lessonData.emoji || '📖'}</div>
                        <div>
                            <div className="lesson-title">{lessonData.title}</div>
                            <div className="lesson-summary">{lessonData.summary}</div>
                        </div>
                    </div>
                    <div className="lesson-card-body">
                        <div className="lesson-text">{lessonData.lesson}</div>
                        <div className="examples-section">
                            <h4>💡 Real Examples</h4>
                            {(lessonData.examples || []).map((ex, i) => (
                                <div key={i} className="example-item">
                                    <span className="example-num">{i + 1}.</span>
                                    <span>{ex}</span>
                                </div>
                            ))}
                        </div>
                        <div className="takeaway-section">
                            <h4>🎯 Key Takeaway</h4>
                            <div className="takeaway-box">⭐ {lessonData.key_takeaway}</div>
                        </div>
                    </div>
                    <div className="tts-row">
                        <button className={`btn-secondary ${isSpeaking ? 'speaking' : ''}`} onClick={handleSpeak}>
                            {isSpeaking ? '⏹️ Stop Speaking' : '🔊 Listen to this lesson'}
                        </button>
                        <button className="btn-secondary" onClick={() => onSwitchToQuiz(topic)}>
                            🧪 Take a quiz on this
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonPanel;
