/**
 * Vercel serverless: POST /api/upload
 * Accepts AUDIO only (no ffmpeg on serverless). Sync: transcribe + summarize, return in one response.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const formidable = require('formidable');

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.opus', '.flac', '.mp4']);
const AUDIO_MIMES = new Set([
  'audio/mpeg', 'audio/mp4', 'audio/mp3', 'audio/x-m4a', 'audio/wav', 'audio/webm',
  'audio/ogg', 'audio/opus', 'audio/flac', 'video/mp4'
]);
const MAX_FILE_SIZE = 24 * 1024 * 1024; // 24MB (Whisper limit 25MB)

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const IncomingForm = formidable.IncomingForm || formidable;
    const form = new IncomingForm();
    form.maxFileSize = MAX_FILE_SIZE;
    form.uploadDir = os.tmpdir();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = files?.video?.[0] || files?.video;
      resolve({ file, fields });
    });
  });
}

async function transcribe(filePath) {
  const OpenAI = require('openai');
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const client = new OpenAI({ apiKey });
  const stream = fs.createReadStream(filePath);
  const transcription = await client.audio.transcriptions.create({
    file: stream,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text'
  });
  return typeof transcription === 'string' ? transcription : (transcription.text || '');
}

function chunkText(text, maxWords = 3000) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

async function summarize(text) {
  const OpenAI = require('openai');
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const client = new OpenAI({ apiKey });
  const chunks = chunkText(text, 3000);
  const systemPrompt = `You are creating a lecture summary for students who skip the video. Use ## for main sections, ### for subsections, and bullet points. Include a "Key takeaways" section at the end. Output in markdown.`;
  let combined = text;
  if (chunks.length > 1) {
    const summaries = [];
    for (const chunk of chunks) {
      const r = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Summarize this part of a lecture with headings (##, ###) and bullets. Preserve key points and definitions.' },
          { role: 'user', content: chunk }
        ],
        temperature: 0.4,
        max_tokens: 800
      });
      summaries.push(r.choices[0].message.content);
    }
    combined = summaries.join('\n\n');
  }
  const final = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Merge into one structured document with ## and ### and bullets. Add Key takeaways at the end.\n\n${combined}` }
    ],
    temperature: 0.4,
    max_tokens: 2000
  });
  return final.choices[0].message.content;
}

module.exports = async function handler(req, res) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  let tmpPath = null;
  try {
    const { file } = await parseMultipart(req);
    if (!file || !(file.filepath || file.path)) {
      res.status(400).json({ error: 'No file uploaded', code: 'MISSING_FILE' });
      return;
    }
    tmpPath = file.filepath || file.path;
    const ext = path.extname(String(file.originalFilename || file.originalName || file.name || '')).toLowerCase();
    const mimetype = String(file.mimetype || file.type || '').toLowerCase();
    const isAudio = AUDIO_EXT.has(ext) || AUDIO_MIMES.has(mimetype) || mimetype.startsWith('audio/');
    if (!isAudio) {
      res.status(400).json({
        error: 'On Vercel serverless only audio files are supported (mp3, m4a, wav, etc.). For video, deploy the backend to Render.',
        code: 'VIDEO_NOT_SUPPORTED'
      });
      return;
    }
    const transcript = await transcribe(tmpPath);
    const summary = await summarize(transcript);
    res.status(200).json({
      status: 'completed',
      transcript,
      summary,
      message: 'Transcribe and summarize completed (serverless).'
    });
  } catch (e) {
    if (tmpPath && fs.existsSync(tmpPath)) try { fs.unlinkSync(tmpPath); } catch (_) {}
    const code = (e.message || '').includes('OPENAI') ? 'CONFIG_ERROR' : 'PROCESSING_ERROR';
    const status = e.message && e.message.includes('OPENAI_API_KEY') ? 500 : 500;
    res.status(status).json({
      success: false,
      error: e.message || 'Processing failed',
      code
    });
  }
};

module.exports.config = {
  api: { bodyParser: false }
};
