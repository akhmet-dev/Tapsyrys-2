// ─────────────────────────────────────────────
// Табылмаған маршруттар үшін 404 өңдеуші
// Барлық маршруттардан кейін орналастырылады
// ─────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Маршрут табылмады: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─────────────────────────────────────────────
// Глобалды қате өңдеуші мидлвэр
// Express 4 форматы: (err, req, res, next)
// ─────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Кейде Express 200 статусын қалдырып кетеді — 500-ге ауыстырамыз
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose дубликат кілт қатесі (email қайталанса)
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Бұл ${duplicatedField} бұрыннан тіркелген. Басқа мән енгізіңіз.`,
    });
  }

  // Mongoose валидация қатесі
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
    });
  }

  // Mongoose ObjectId форматы дұрыс емес
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Жарамсыз идентификатор форматы.',
    });
  }

  // Multer файл жүктеу қателері
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Файл өлшемі 50MB-тан аспауы керек'
        : err.message,
    });
  }

  // Барлық басқа қателер
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Сервер ішкі қатесі орын алды.',
    // Өндірісте стек ізін жасырамыз
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
