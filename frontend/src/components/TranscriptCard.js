import React, { useState } from 'react';

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TranscriptCard({ transcript }) {
  const [copyStatus, setCopyStatus] = useState('');
  if (!transcript) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Failed');
    }
  };
  const handleDownload = () => downloadText(transcript, 'transcript.txt');

  return (
    <div className="result-section">
      <div className="result-card transcript-card">
        <details className="transcript-details">
          <summary className="card-header">
            <h2 className="card-title">
              <span className="card-icon">📄</span>
              Full Transcript
              <span className="transcript-length">({transcript.length} characters)</span>
            </h2>
            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="action-btn copy-btn" onClick={handleCopy}>
                {copyStatus || 'Copy'}
              </button>
              <button type="button" className="action-btn download-btn" onClick={handleDownload}>
                Download
              </button>
            </div>
          </summary>
          <div className="card-content">
            <div className="transcript-content">
              {transcript.split('\n').map((line, index) => (
                <p key={index} className="transcript-line">
                  {line.trim() || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
