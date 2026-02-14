/**
 * Vercel serverless entry when Root Directory = backend.
 * Wraps Express app so the full API runs on Vercel.
 */
const serverless = require('serverless-http');
const app = require('../app');
module.exports = serverless(app);
