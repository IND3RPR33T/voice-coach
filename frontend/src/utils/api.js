export const API_BASE = 'http://localhost:8000';

export async function fetchHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return await res.json();
    } catch (e) {
        return { llm: 'offline' };
    }
}

export async function fetchSessionStats(sessionId) {
    try {
        const res = await fetch(`${API_BASE}/session/${sessionId}`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function generateLesson(topic, sessionId) {
    const res = await fetch(`${API_BASE}/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, session_id: sessionId })
    });
    return await res.json();
}

export async function askQuestion(question, context, sessionId) {
    const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, session_id: sessionId })
    });
    return await res.json();
}

export async function generateQuiz(topic, sessionId) {
    const res = await fetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, num_questions: 3, session_id: sessionId })
    });
    return await res.json();
}

export async function saveScore(sessionId, correct, total, topic = "General") {
    const res = await fetch(`${API_BASE}/session/${sessionId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct, total, topic })
    });
    return await res.json();
}

export function getCertificateUrl(name, topic) {
    return `${API_BASE}/generate-certificate?name=${encodeURIComponent(name)}&topic=${encodeURIComponent(topic)}`;
}
