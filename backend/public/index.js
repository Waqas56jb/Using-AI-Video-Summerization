/**
 * Minimal entrypoint so Vercel accepts the build. All traffic is rewritten to /api (Express).
 */
module.exports = (req, res) => {
  res.status(200).json({ success: true, message: 'Backend API', endpoints: ['GET /', 'POST /api/upload', 'GET /api/status/:jobId'] });
};
