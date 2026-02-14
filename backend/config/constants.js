const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  QUEUE_NAME: process.env.QUEUE_NAME || 'video-summarizer',
  CHUNK_SIZE_WORDS: 3000,
  TRANSCRIPTION_CHUNK_MINUTES: 10
};
