import React from 'react';

const STAGE_MESSAGES = {
  extracting_audio: 'Extracting audio...',
  transcribing: 'Transcribing (English)...',
  summarizing: 'Summarizing...',
  completed: 'Completed!'
};

export function LoadingSection({ jobStatus, progress }) {
  const stage = jobStatus?.stage || 'processing';
  const message = STAGE_MESSAGES[stage] || 'Processing...';

  return (
    <div className="loading-section">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="loading-text">{message}</p>
      <p className="loading-progress">{Math.round(progress)}%</p>
      <div className="loading-steps">
        <div className={`step ${stage === 'extracting_audio' ? 'active' : ['transcribing', 'summarizing', 'completed'].includes(stage) ? 'done' : ''}`}>
          <span className="step-icon">🎵</span>
          <span>Extracting</span>
        </div>
        <div className={`step ${stage === 'transcribing' ? 'active' : ['summarizing', 'completed'].includes(stage) ? 'done' : ''}`}>
          <span className="step-icon">🎤</span>
          <span>Transcribing</span>
        </div>
        <div className={`step ${stage === 'summarizing' ? 'active' : stage === 'completed' ? 'done' : ''}`}>
          <span className="step-icon">📝</span>
          <span>Summarizing</span>
        </div>
      </div>
    </div>
  );
}
