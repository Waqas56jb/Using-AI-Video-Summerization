import React from 'react';

export function InputSection({
  selectedFile,
  onFileSelect,
  onClearFile,
  loading,
  onSummarize
}) {
  return (
    <div className="input-section">
      <div className="input-wrapper">
        <div className="file-upload-wrapper">
          <label htmlFor="file-upload" className="file-upload-label">
            {selectedFile ? (
              <span className="file-name">📹 {selectedFile.name}</span>
            ) : (
              <span className="file-placeholder">Select video (any format)</span>
            )}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=""
            onChange={onFileSelect}
            className="file-input"
            disabled={loading}
          />
          {selectedFile && (
            <button
              type="button"
              className="clear-file-btn"
              onClick={onClearFile}
              disabled={loading}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onSummarize}
          disabled={loading || !selectedFile}
          className="summarize-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            <>
              <span>✨</span>
              Transcribe & Summarize
            </>
          )}
        </button>
      </div>
    </div>
  );
}
