/**
 * Vercel serverless: GET /api (health).
 * Local backend handles full API; this is for serverless health only.
 */
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Server is running',
    status: 'ok',
    serverless: true,
    endpoints: {
      'POST /api/upload': 'Upload audio (mp3, m4a, wav) — transcribe & summarize in one request',
      'GET /api/status/:jobId': 'Not used on serverless (sync response from upload)'
    }
  });
};
