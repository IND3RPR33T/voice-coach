import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LessonPanel from './panels/LessonPanel';
import ChatPanel from './panels/ChatPanel';
import QuizPanel from './panels/QuizPanel';
import { fetchHealth, fetchSessionStats } from './utils/api';
import './index.css';

const SESSION_KEY = 'voice_coach_session_id';

function App() {
  const [activeMode, setActiveMode] = useState('lesson');
  const [apiStatus, setApiStatus] = useState('connecting');
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const nuevo = 'user_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, nuevo);
    return nuevo;
  });

  const [stats, setStats] = useState({ 
    lessonsDone: 0, 
    quizScore: null,
    xp: 0,
    level: 1,
    streak: 1
  });
  const [topics, setTopics] = useState([]);
  const [quizPrefill, setQuizPrefill] = useState('');

  const refreshStats = async () => {
    const data = await fetchSessionStats(sessionId);
    if (data) {
      setStats({
        lessonsDone: data.lessons_done || 0,
        quizScore: data.score || null,
        xp: data.xp || 0,
        level: data.level || 1,
        streak: data.streak || 1
      });
      setTopics(data.topics || []);
    }
  };

  useEffect(() => {
    const checkApi = async () => {
      const data = await fetchHealth();
      if (data.llm === 'gemini') setApiStatus('active');
      else if (data.llm === 'offline') setApiStatus('offline');
      else setApiStatus('demo');
    };
    checkApi();
    refreshStats();
  }, []);

  const handleUpdate = (sessionData) => {
    if (sessionData) {
      setStats({
        lessonsDone: sessionData.lessons_done || 0,
        quizScore: sessionData.score || null,
        xp: sessionData.xp || 0,
        level: sessionData.level || 1,
        streak: sessionData.streak || 1
      });
      setTopics(sessionData.topics || []);
    }
  };

  const switchToQuiz = (topic) => {
    setQuizPrefill(topic);
    setActiveMode('quiz');
  };

  return (
    <div className="voice-coach-app min-h-screen flex flex-col font-sans transition-all duration-300">
      <Header apiStatus={apiStatus} />
      <div className="app-layout flex-1 flex overflow-hidden">
        <Sidebar
          activeMode={activeMode}
          switchMode={setActiveMode}
          stats={stats}
          topics={topics}
        />
        <main className="chat-area flex-1 flex flex-col overflow-hidden glass-effect">
          {activeMode === 'lesson' && (
            <LessonPanel
              sessionId={sessionId}
              onLessonDone={handleUpdate}
              onSwitchToQuiz={switchToQuiz}
            />
          )}
          {activeMode === 'chat' && (
            <ChatPanel sessionId={sessionId} currentTopic={quizPrefill} />
          )}
          {activeMode === 'quiz' && (
            <QuizPanel
              sessionId={sessionId}
              prefilledTopic={quizPrefill}
              onSwitchToLesson={() => setActiveMode('lesson')}
              onQuizDone={handleUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
