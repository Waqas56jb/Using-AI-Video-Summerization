import React from 'react';

export function WelcomeSection({ apiStatus }) {
  return (
    <div className="welcome-section">
      <div className="welcome-card">
        {apiStatus === 'running' && (
          <div className="api-status-banner">✅ Backend is running</div>
        )}
        {apiStatus === 'error' && (
          <div className="api-status-banner error">
            ⚠️ Cannot reach backend. Start it with: <code>cd backend && node index.js</code>
          </div>
        )}
        <h3>🚀 Get Started</h3>
        <p>Upload your English lecture video above and click "Transcribe & Summarize" to get the transcript and summary.</p>
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🎤</span>
            <span>English transcription (Whisper)</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📝</span>
            <span>AI summary</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📁</span>
            <span>Upload your video</span>
          </div>
        </div>
      </div>
    </div>
  );
}
