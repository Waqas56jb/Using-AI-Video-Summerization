const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { videoQueue } = require('../queue/queue');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const uploadsDir = process.env.VERCEL
  ? path.join(require('os').tmpdir(), 'uploads')
  : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// On Vercel use memoryStorage and write to /tmp in the route (more reliable in serverless)
const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `video-${uniqueSuffix}${ext}`);
      }
    });

const maxFileSize = 500 * 1024 * 1024; // 500MB – same limit for Vercel and local
const upload = multer({ storage, limits: { fileSize: maxFileSize } });

router.post('/upload', upload.single('video'), async (req, res) => {
  let tmpPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', code: 'MISSING_FILE' });
    }
    const fileName = req.file.originalname;

    if (process.env.VERCEL) {
      // Accept both video and audio – Whisper API supports mp4, mp3, m4a, wav, webm, etc.
      // memoryStorage: write buffer to /tmp so transcribe can read the file
      const ext = path.extname(fileName) || '.mp3';
      tmpPath = path.join(uploadsDir, `audio-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
      fs.writeFileSync(tmpPath, req.file.buffer, { flag: 'w' });
      const { transcribeAudioChunked } = require('../services/transcribe');
      const { summarizeTranscriptMapReduce } = require('../services/summarize');
      let transcript;
      let summary;
      try {
        transcript = await transcribeAudioChunked(tmpPath);
        summary = await summarizeTranscriptMapReduce(transcript);
      } catch (err) {
        console.error('Vercel transcribe/summarize error:', err.message);
        return res.status(500).json({
          error: err.message || 'Transcription or summarization failed',
          code: 'TRANSCRIPTION_ERROR'
        });
      }
      res.json({ status: 'completed', transcript, summary, message: 'Done (Vercel).' });
      return;
    }

    tmpPath = req.file.path;

    const jobId = uuidv4();
    const jobData = {
      videoFilePath: tmpPath,
      isUploadedFile: true,
      jobId,
      videoInfo: { title: fileName, duration: null }
    };
    await videoQueue.add('summarize-video', jobData, { jobId });
    console.log(`✅ Job created: ${jobId} for: "${fileName}"`);
    res.json({
      jobId,
      status: 'processing',
      message: 'Transcribe and summarize job created. Use GET /api/status/:jobId to check progress.',
      videoInfo: { title: fileName, duration: null }
    });
  } catch (error) {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 500MB.', code: 'FILE_TOO_LARGE' });
    }
    console.error('Error creating job:', error.message);
    res.status(500).json({ error: error.message, code: 'JOB_CREATION_ERROR' });
  }
});

router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await videoQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND', message: `No job: ${jobId}` });
    }
    let state = 'waiting';
    if (job.getState) state = await job.getState();
    else state = job.state || 'waiting';
    let progressData = job.progress || {};
    let progressPercent = 0;
    let stage = 'pending';
    if (typeof progressData === 'object') {
      progressPercent = progressData.progress || 0;
      stage = progressData.stage || 'pending';
    } else {
      progressPercent = progressData;
    }
    const response = { jobId, status: state, progress: progressPercent, stage };
    if (state === 'completed') {
      try {
        const result = job.returnvalue || (await job.returnvalue);
        if (result) {
          response.summary = result.summary;
          response.transcript = result.transcript;
          response.videoInfo = result.videoInfo;
        }
      } catch (_) {
        response.error = 'Could not retrieve results';
      }
    }
    if (state === 'failed') response.error = job.failedReason || 'Job failed';
    res.json(response);
  } catch (error) {
    console.error('Error getting status:', error.message);
    res.status(500).json({ error: error.message, code: 'STATUS_ERROR' });
  }
});

module.exports = router;
