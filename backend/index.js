const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const key = process.env.OPENAI_API_KEY;
const keyStatus = key && key.trim()
  ? `loaded (${key.trim().substring(0, 7)}...${key.trim().slice(-4)})`
  : 'not set';
console.log(`📝 OpenAI API key: ${keyStatus}`);

try {
  require('./workers/video-processor');
} catch (error) {
  console.warn('⚠️  Could not start worker:', error.message);
}

const app = require('./app');
const { PORT, QUEUE_NAME } = require('./config/constants');

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔄 Job queue: ${QUEUE_NAME}`);
});
