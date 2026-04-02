const sseClients = require('../services/sseClients');

// ─────────────────────────────────────────────
// @desc    SSE байланысын ашу — нақты уақытта хабарлама алу
// @route   GET /api/applications/events
// @access  Жабық (Protected)
// ─────────────────────────────────────────────
const sseConnect = (req, res) => {
  // SSE тақырыптары
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx буферлеуін өшіру
  res.flushHeaders();

  const userId = req.user._id.toString();
  sseClients.add(userId, res);

  // Жалғасты растау хабарламасы
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  // Байланыс үзілгенде клиентті тізімнен алып тастаймыз
  req.on('close', () => {
    sseClients.remove(userId, res);
  });
};

module.exports = { sseConnect };
