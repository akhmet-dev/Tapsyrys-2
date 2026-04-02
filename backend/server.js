const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Орта айнымалыларын жүктеу
dotenv.config();

// Мидлвэрлерді импорттау
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Маршруттарды импорттау
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const messageRoutes = require('./routes/messageRoutes');
// Жаңа маршруттар: рейтинг (ашық), админ аналитикасы
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ─────────────────────────────────────────────
// Жалпы мидлвэрлер
// ─────────────────────────────────────────────

// CORS — frontend-тен сұраныстарға рұқсат беру
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// JSON және URL-encoded сұраныс денесін өңдеу
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статикалық файлдар — жүктелген құжаттарды /uploads маршрутынан береді
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────
// API маршруттары
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
// Хабарламалар маршруты қате өңдеу мидлвэрлерінен бұрын тіркелуі керек
app.use('/api/messages', messageRoutes);
// Рейтинг — ашық маршрут (аутентификациясыз)
app.use('/api/rating', ratingRoutes);
// Админ аналитикасы — тек Администратор
app.use('/api/admin', adminRoutes);

// Серверді тексеру үшін негізгі маршрут
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Университеттің қабылдау комиссиясы API — жұмыс істеп тұр ✓',
    version: '2.0.0',
  });
});

// ─────────────────────────────────────────────
// Қате өңдеу мидлвэрлері (ең соңында орналасуы керек)
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────
// MongoDB-ге қосылу және серверді іске қосу
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    // MongoDB байланысын орнату
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB-ге сәтті қосылды');

    // Серверді іске қосу
    app.listen(PORT, () => {
      console.log(`🚀 Сервер http://localhost:${PORT} портында іске қосылды`);
      console.log(`📋 Орта: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ MongoDB-ге қосылу қатесі:', error.message);
    // Байланыс орнамаса — процесті тоқтатамыз
    process.exit(1);
  }
};

// Өңделмеген Promise қателерін ұстау
process.on('unhandledRejection', (err) => {
  console.error('❌ Өңделмеген Promise қатесі:', err.message);
  process.exit(1);
});

startServer();
