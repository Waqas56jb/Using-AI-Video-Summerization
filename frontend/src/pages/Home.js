import { useState, useEffect } from 'react';
import {
  Header,
  InputSection,
  LoadingSection,
  ErrorBox,
  SummaryCard,
  TranscriptCard,
  WelcomeSection
} from '../components';
import { api } from '../services/api';

function getErrorMessage(err) {
  const errorData = err.response?.data;
  const status = err.response?.status;
  let msg = errorData?.error || err.message || 'An error occurred';
  if (errorData?.code === 'FILE_TOO_LARGE') msg = 'File too large. Maximum 500MB.';
  else if (errorData?.code === 'MISSING_FILE') msg = 'Please select a video file.';
  else if (errorData?.code === 'VIDEO_NOT_SUPPORTED') msg = errorData?.error || 'On this deployment only audio files are supported (mp3, m4a, wav). For video, use a local backend or deploy to Render.';
  else if (status === 504) msg = 'Request timed out. Try a shorter audio file (e.g. under 2–3 minutes).';
  else if (!err.response) {
    msg = process.env.NODE_ENV === 'development'
      ? `Cannot reach the backend. Start it with: cd backend && node index.js (http://localhost:5000). ${err.message || 'Network error'}`
      : `Cannot reach the backend. Check that the API URL is set and the backend is running. ${err.message || 'Network error'}`;
  }
  return msg;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    api.checkHealth()
      .then(res => {
        if (!res.data?.success) setApiStatus('error');
        else setApiStatus((res.data?.message || '').toLowerCase().includes('running') ? 'running' : 'error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getJobStatus(jobId);
        const status = res.data.status;
        const progressData = res.data.progress ?? 0;
        const stage = res.data.stage || 'processing';
        const progressPercent = typeof progressData === 'number' ? progressData : (progressData.progress ?? 0);
        setProgress(progressPercent);
        setJobStatus({ status, stage });
        if (status === 'completed') {
          setSummary(res.data.summary ?? '');
          setTranscript(res.data.transcript ?? '');
          setLoading(false);
          clearInterval(interval);
        } else if (status === 'failed') {
          setError(res.data.error || 'Job failed');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Job not found.');
          setLoading(false);
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum 500MB.');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    const el = document.getElementById('file-upload');
    if (el) el.value = '';
  };

  const handleSummarize = async () => {
    if (!selectedFile) {
      setError('Please select a video file.');
      return;
    }
    setLoading(true);
    setError('');
    setSummary('');
    setTranscript('');
    setJobId(null);
    setJobStatus(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      const res = await api.createUploadJob(formData);
      const data = res?.data || {};
      if (data.status === 'completed' && data.transcript != null && data.summary != null) {
        setTranscript(data.transcript);
        setSummary(data.summary);
        setLoading(false);
        return;
      }
      const jobIdFromApi = data.jobId;
      if (!jobIdFromApi) {
        setError('Backend did not return a job ID or result.');
        setLoading(false);
        return;
      }
      setJobId(jobIdFromApi);
      setJobStatus({ status: 'processing', stage: 'processing' });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <InputSection
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onClearFile={handleClearFile}
        loading={loading}
        onSummarize={handleSummarize}
      />
      {loading && jobStatus && (
        <LoadingSection jobStatus={jobStatus} progress={progress} />
      )}
      <ErrorBox message={error} />
      <SummaryCard summary={summary} />
      <TranscriptCard transcript={transcript} />
      {(summary || transcript) && (
        <p className="no-storage-notice">Nothing is saved. Refresh the page to clear transcript and summary.</p>
      )}
      {!loading && !summary && !error && <WelcomeSection apiStatus={apiStatus} />}
    </>
  );
}
