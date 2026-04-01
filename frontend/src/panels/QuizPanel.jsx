import React, { useState } from 'react';
import { generateQuiz, saveScore, getCertificateUrl } from '../utils/api';

const QuizPanel = ({ sessionId, prefilledTopic, onSwitchToLesson, onQuizDone }) => {
    const [topic, setTopic] = useState(prefilledTopic || '');
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showScoreCard, setShowScoreCard] = useState(false);
    const [finalScore, setFinalScore] = useState(null);

    const startQuiz = async (providedTopic) => {
        const t = providedTopic || topic;
        if (!t.trim()) return;
        setTopic(t);
        setLoading(true);
        setShowScoreCard(false);
        setAnswers({});
        try {
            const res = await generateQuiz(t, sessionId);
            if (res.success) {
                setQuizData(res.questions);
            }
        } catch (e) {
            setQuizData([
                {
                    question: `What is the primary goal of ${t}?`,
                    options: ['A) Speed', 'B) Safety & compliance', 'C) Cost reduction', 'D) Supervision'],
                    correct: 'B',
                    explanation: 'Safety and compliance protect workers and the workplace.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (qIdx, chosenOption, correctSymbol) => {
        if (answers[qIdx]) return;
        const isCorrect = chosenOption.startsWith(correctSymbol);
        setAnswers(prev => ({ ...prev, [qIdx]: { chosen: chosenOption, isCorrect } }));
    };

    const calculateScore = async () => {
        const total = quizData.length;
        const correct = Object.values(answers).filter(a => a.isCorrect).length;
        const pct = Math.round((correct / total) * 100);
        setFinalScore({ pct, correct, total });
        setShowScoreCard(true);
        try {
            const res = await saveScore(sessionId, correct, total, topic);
            if (res.session && onQuizDone) {
                onQuizDone(res.session);
            }
        } catch (e) { }
    };

    const downloadCertificate = () => {
        const url = getCertificateUrl("Worker", topic);
        window.open(url, '_blank');
    };

    if (showScoreCard) {
        const { pct, correct, total } = finalScore;
        const isPerfect = pct === 100;
        const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👏' : '💪';
        const msg = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!';
        
        return (
            <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-500">
                <div className="max-w-xl mx-auto bg-slate-800/50 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl shadow-2xl">
                    <div className="text-6xl mb-6 animate-bounce">{emoji}</div>
                    <h2 className="text-3xl font-bold text-white mb-2">{pct}%</h2>
                    <p className="text-slate-400 mb-8">{correct}/{total} correct — {msg}</p>
                    
                    {isPerfect && (
                        <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-pulse">
                            <h3 className="text-emerald-400 font-bold mb-2">🎓 Perfect Score Unlocked!</h3>
                            <p className="text-xs text-emerald-300/70 mb-4">You've mastered this topic. You can now download your official certificate.</p>
                            <button 
                                onClick={downloadCertificate}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                📜 Download Certificate
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button 
                            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                            onClick={() => setShowScoreCard(false)}
                        >
                            🔄 Retry
                        </button>
                        <button 
                            className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                            onClick={onSwitchToLesson}
                        >
                            📚 Learn More
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">🧪 Test Your Knowledge</h2>
                <p className="text-slate-400 text-sm">Reinforce what you learned with a quick quiz</p>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md">
                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Quiz topic, e.g. Fire Safety…"
                        value={topic}
                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 transition-all outline-none"
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
                    />
                    <button 
                        className="px-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        onClick={() => startQuiz()} 
                        disabled={loading}
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🎯 Start'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Fire Safety', 'PPE', 'First Aid'].map(t => (
                        <button 
                            key={t} 
                            className="px-4 py-2 bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-300 rounded-full text-xs font-medium transition-all"
                            onClick={() => startQuiz(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {quizData && (
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide pb-20">
                    {quizData.map((q, i) => (
                        <div key={i} className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 animate-in slide-in-from-bottom-5 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Question {i + 1} of {quizData.length}</div>
                            <div className="text-lg font-medium text-white mb-6 leading-relaxed">{q.question}</div>
                            <div className="grid grid-cols-1 gap-3">
                                {q.options.map(opt => {
                                    const answer = answers[i];
                                    const isAnswered = !!answer;
                                    const isCorrect = opt.startsWith(q.correct);
                                    const isChosen = answer?.chosen === opt;

                                    let style = "text-left px-5 py-4 rounded-2xl border transition-all duration-200 font-medium ";
                                    if (!isAnswered) {
                                        style += "bg-white/5 border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-300";
                                    } else {
                                        if (isCorrect) style += "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 scale-[1.01] shadow-lg shadow-emerald-500/10";
                                        else if (isChosen) style += "bg-rose-500/10 border-rose-500/40 text-rose-400 opacity-80";
                                        else style += "bg-white/5 border-transparent text-slate-500 opacity-40";
                                    }

                                    return (
                                        <button
                                            key={opt}
                                            className={style}
                                            onClick={() => handleAnswer(i, opt, q.correct)}
                                            disabled={isAnswered}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {answers[i] && (
                                <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-sm text-indigo-300/80 italic leading-relaxed animate-in fade-in duration-500">
                                    💡 {q.explanation}
                                </div>
                            )}
                        </div>
                    ))}
                    {Object.keys(answers).length === quizData.length && (
                        <div className="flex justify-center pt-8">
                            <button 
                                className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 transform hover:-translate-y-1 active:translate-y-0"
                                onClick={calculateScore}
                            >
                                📊 See My Results
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizPanel;
