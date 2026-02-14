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

/**
 * Renders summary text as structured content: ## headings, ### subheadings, bullets, numbered lists.
 * For students who skip the lecture—full context, readable format.
 */
function renderStructuredSummary(text) {
  if (!text || !text.trim()) return null;
  const lines = text.split(/\r?\n/);
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    i += 1;

    if (!trimmed) {
      elements.push(<div key={key++} className="summary-spacer" />);
      continue;
    }

    // ## Main heading
    if (/^##\s+/.test(trimmed)) {
      const content = trimmed.replace(/^##\s+/, '').trim();
      elements.push(<h2 key={key++} className="summary-h2">{content}</h2>);
      continue;
    }

    // ### Subheading
    if (/^###\s+/.test(trimmed)) {
      const content = trimmed.replace(/^###\s+/, '').trim();
      elements.push(<h3 key={key++} className="summary-h3">{content}</h3>);
      continue;
    }

    // Bullet or numbered list: collect consecutive list lines
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    const numMatch = trimmed.match(/^\d+[.)]\s+(.*)/);
    if (bulletMatch || numMatch) {
      const listItems = [bulletMatch ? bulletMatch[1] : numMatch[1]];
      const isOrdered = !!numMatch;
      while (i < lines.length) {
        const next = lines[i].trim();
        const nextBullet = next.match(/^[-*•]\s+(.*)/);
        const nextNum = next.match(/^\d+[.)]\s+(.*)/);
        if (nextBullet) listItems.push(nextBullet[1]);
        else if (nextNum) listItems.push(nextNum[1]);
        else break;
        i += 1;
      }
      const ListTag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <ListTag key={key++} className="summary-list">
          {listItems.map((item, idx) => (
            <li key={idx} className="summary-list-item">{item}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph
    elements.push(<p key={key++} className="summary-paragraph">{trimmed}</p>);
  }

  return elements;
}

export function SummaryCard({ summary }) {
  const [copyStatus, setCopyStatus] = useState('');
  if (!summary) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Failed');
    }
  };
  const handleDownload = () => downloadText(summary, 'summary.txt');

  return (
    <div className="result-section">
      <div className="result-card summary-card">
        <div className="card-header card-header-with-actions">
          <h2 className="card-title">
            <span className="card-icon">📋</span>
            Lecture summary (full context)
          </h2>
          <div className="card-actions">
            <button type="button" className="action-btn copy-btn" onClick={handleCopy}>
              {copyStatus || 'Copy'}
            </button>
            <button type="button" className="action-btn download-btn" onClick={handleDownload}>
              Download
            </button>
          </div>
        </div>
        <div className="card-content summary-content-structured">
          {renderStructuredSummary(summary)}
        </div>
      </div>
    </div>
  );
}
