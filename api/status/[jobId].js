/**
 * Vercel serverless: GET /api/status/:jobId
 * On serverless we process upload synchronously (no job queue). This returns 404.
 */
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  res.status(404).json({
    error: 'Job not found',
    code: 'JOB_NOT_FOUND',
    message: 'On Vercel serverless, upload returns transcript and summary in one response. No job polling.'
  });
};
