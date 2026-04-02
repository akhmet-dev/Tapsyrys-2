const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────
// JWT токенін тексеру мидлвэрі
// Authorization: Bearer <token> тақырыбын оқиды
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // Токенді тақырыптан немесе query param-нан алу
    // (EventSource API Authorization header қолдамайды — SSE үшін ?token= қолданылады)
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Кіру үшін токен қажет. Жүйеге кіріңіз.',
      });
    }

    // Токенді тексеру және декодтау
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Пайдаланушыны дерекқордан алу (құпия сөзсіз)
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Бұл токенге тіркелген пайдаланушы табылмады.',
      });
    }

    // Пайдаланушыны сұраныс объектіне қосу
    req.user = currentUser;
    next();
  } catch (error) {
    // Токен жарамсыз немесе мерзімі өткен
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Жарамсыз токен. Қайта кіріңіз.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен мерзімі өтті. Қайта кіріңіз.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Сервер қатесі: аутентификация тексеруде мәселе.',
    });
  }
};

// ─────────────────────────────────────────────
// Тек Админге рұқсат беретін мидлвэр
// protect мидлвэрінен кейін қолданылады
// ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Бұл әрекет тек администраторларға рұқсат етілген.',
  });
};

module.exports = { protect, adminOnly };
