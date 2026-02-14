const path = require('path');
const express = require('express');
const cors = require('cors');
const summarizeRouter = require('./routes/summarize');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// CORS
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    status: 'ok',
    version: '2.0.0',
    endpoints: {
      'POST /api/upload': 'Upload video - transcribe & summarize',
      'GET /api/status/:jobId': 'Get job status and result'
    }
  });
});

app.use('/api', summarizeRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An error occurred'
  });
});

module.exports = app;
