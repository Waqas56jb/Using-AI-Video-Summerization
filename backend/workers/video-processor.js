const { videoQueue, useRedis } = require('../queue/queue');
const { extractAudioFromVideo } = require('../services/video-file');
const { transcribeAudioChunked } = require('../services/transcribe');
const { summarizeTranscriptMapReduce } = require('../services/summarize');
const fs = require('fs');
const path = require('path');

async function processVideoJob(job) {
  const jobData = job.data || job;
  const videoFilePath = jobData.videoFilePath;
  const jobId = job.id || jobData.jobId || 'memory';
  let audioFile = null;

  if (!jobData.isUploadedFile || !videoFilePath) {
    throw new Error('Invalid job: upload only (no URL).');
  }

  const videoInfo = jobData.videoInfo || { title: 'Uploaded video', duration: null };

  try {
    await updateJobProgress(job, { stage: 'extracting_audio', progress: 20 });
    console.log(`[Job ${jobId}] Extracting audio...`);
    audioFile = await extractAudioFromVideo(videoFilePath);
    console.log(`[Job ${jobId}] Audio: ${audioFile}`);

    await updateJobProgress(job, { stage: 'transcribing', progress: 40 });
    console.log(`[Job ${jobId}] Transcribing (English)...`);
    const transcript = await transcribeAudioChunked(audioFile, (p) => {
      updateJobProgress(job, { stage: 'transcribing', progress: 40 + p * 30 });
    });

    await updateJobProgress(job, { stage: 'summarizing', progress: 70 });
    console.log(`[Job ${jobId}] Summarizing...`);
    const summary = await summarizeTranscriptMapReduce(transcript, (p) => {
      updateJobProgress(job, { stage: 'summarizing', progress: 70 + p * 25 });
    });

    await updateJobProgress(job, { stage: 'completed', progress: 100 });

    if (audioFile && fs.existsSync(audioFile)) {
      try { fs.unlinkSync(audioFile); } catch (_) {}
    }
    if (videoFilePath && fs.existsSync(videoFilePath)) {
      try { fs.unlinkSync(videoFilePath); } catch (_) {}
    }

    return { transcript, summary, videoInfo: { title: videoInfo.title, duration: videoInfo.duration } };
  } catch (error) {
    if (audioFile && fs.existsSync(audioFile)) { try { fs.unlinkSync(audioFile); } catch (_) {} }
    if (videoFilePath && fs.existsSync(videoFilePath)) { try { fs.unlinkSync(videoFilePath); } catch (_) {} }
    throw error;
  }
}

async function updateJobProgress(job, progressData) {
  if (job.updateProgress && typeof job.updateProgress === 'function') {
    await job.updateProgress(progressData);
  } else {
    if (job.progress) Object.assign(job.progress, progressData);
    else job.progress = progressData;
  }
}

const { memoryQueue } = require('../queue/memory-queue');
memoryQueue.registerWorker(processVideoJob);

setTimeout(() => {
  const queueInfo = require('../queue/queue');
  if (queueInfo.useRedis) {
    try {
      const { Worker } = require('bullmq');
      const { connection, QUEUE_NAME } = require('../queue/queue');
      const worker = new Worker(QUEUE_NAME, processVideoJob, { connection, concurrency: 1 });
      worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));
      console.log('🚀 BullMQ worker started (Redis)');
    } catch (e) {
      console.warn('⚠️  BullMQ worker:', e.message);
    }
  } else {
    console.log('🚀 Worker started (In-Memory Queue)');
  }
}, 1000);

module.exports = { processVideoJob };
