import React from 'react';

const Sidebar = ({ activeMode, switchMode, stats, topics }) => {
    return (
        <aside className="sidebar w-72 flex flex-col border-r border-white/10 bg-slate-900/50 backdrop-blur-xl h-full shadow-2xl relative z-10">
            <div className="sidebar-top p-6 border-b border-white/5 space-y-2">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-4">Navigação</h3>
                <button
                    className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${activeMode === 'lesson' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                    onClick={() => switchMode('lesson')}
                >
                    <span className={`text-lg transition-transform duration-300 group-hover:scale-110`}>📚</span>
                    <span className="text-sm font-medium">Learn a Topic</span>
                </button>
                <button
                    className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${activeMode === 'chat' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                    onClick={() => switchMode('chat')}
                >
                    <span className={`text-lg transition-transform duration-300 group-hover:scale-110`}>💬</span>
                    <span className="text-sm font-medium">Ask a Question</span>
                </button>
                <button
                    className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${activeMode === 'quiz' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                    onClick={() => switchMode('quiz')}
                >
                    <span className={`text-lg transition-transform duration-300 group-hover:scale-110`}>🧪</span>
                    <span className="text-sm font-medium">Take a Quiz</span>
                </button>
            </div>

            <div className="sidebar-progress p-6 border-b border-white/5 bg-slate-900/30">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-6">User Profile</h3>
                
                {/* Level and XP */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Level</span>
                        <span className="text-2xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent">{stats.level}</span>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1 justify-end">
                            <span className="text-xs font-bold text-indigo-400">🔥 {stats.streak} Day Streak</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stats.xp} XP / {stats.level * 1000}</span>
                    </div>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 mb-6">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${(stats.xp % 1000) / 10}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Lessons</span>
                        <span className="text-sm font-bold text-slate-200">{stats.lessonsDone}</span>
                    </div>
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Avg Score</span>
                        <span className="text-sm font-bold text-emerald-400">{stats.quizScore ? `${stats.quizScore}%` : '—'}</span>
                    </div>
                </div>
            </div>

            <div className="sidebar-topics flex-1 overflow-y-auto p-6 scrollbar-hide">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-4">Mastered Skills</h3>
                <div className="flex flex-wrap gap-2">
                    {topics.length > 0 ? (
                        topics.map((t, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium animate-in fade-in slide-in-from-left duration-300" 
                                  style={{ animationDelay: `${i * 100}ms` }}>
                                ✨ {t}
                            </span>
                        ))
                    ) : (
                        <span className="text-[11px] text-slate-500 italic">
                            Launch your first lesson to earn points...
                        </span>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
