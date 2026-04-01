import React from 'react';

const Header = ({ apiStatus }) => {
    const getStatusText = () => {
        switch (apiStatus) {
            case 'active': return '🟢 Gemini AI Active';
            case 'demo': return '🟡 Demo Mode';
            case 'offline': return '🔴 API Offline';
            default: return 'Connecting…';
        }
    };

    return (
        <header>
            <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
                <div className="logo-icon">🎙️</div>
                <div>
                    <div>VoiceCoach <span style={{ color: 'var(--primary)' }}>AI</span></div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--muted)' }}>
                        Microlearning for Frontline Workers
                    </div>
                </div>
            </div>
            <div className="status-badge">
                <div className={`status-dot ${apiStatus}`}></div>
                <span>{getStatusText()}</span>
            </div>
        </header>
    );
};

export default Header;
