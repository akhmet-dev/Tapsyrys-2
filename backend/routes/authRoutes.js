/**
 * @fileoverview Аутентификация маршруттары
 * @module routes/authRoutes
 * @description Тіркелу, кіру және профиль алу маршруттарын анықтайды.
 *              Барлық маршруттар /api/auth префиксімен жұмыс істейді.
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  avatarUploadMiddleware,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @method  POST
 * @desc    Жаңа пайдаланушыны жүйеге тіркеу.
 *          Сәтті тіркелгенде JWT токені мен пайдаланушы деректері қайтарылады.
 *          Рөл әдепкі бойынша 'applicant' болып орнатылады.
 * @access  Ашық (Public) — токен талап етілмейді
 * @body    {string} fullName  - Пайдаланушының толық аты-жөні (міндетті)
 * @body    {string} email     - Email мекенжайы, бірегей болуы керек (міндетті)
 * @body    {string} password  - Құпия сөз, кемінде 6 таңба (міндетті)
 * @returns {object} 201 - { success, message, token, user }
 * @returns {object} 400 - { success: false, message } — валидация қатесі
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @method  POST
 * @desc    Жүйеге кіру және JWT токені алу.
 *          Email мен құпия сөз тексеріледі, bcrypt арқылы салыстырылады.
 *          Сәтті кіргенде 7 күндік токен беріледі.
 * @access  Ашық (Public) — токен талап етілмейді
 * @body    {string} email    - Тіркелген email мекенжайы (міндетті)
 * @body    {string} password - Пайдаланушы құпия сөзі (міндетті)
 * @returns {object} 200 - { success, message, token, user }
 * @returns {object} 400 - { success: false, message } — өрістер толтырылмаған
 * @returns {object} 401 - { success: false, message } — email немесе құпия сөз қате
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @method  GET
 * @desc    Ағымдағы аутентификацияланған пайдаланушының профилін алу.
 *          JWT токені арқылы пайдаланушы идентификацияланады.
 *          Жауапта құпия сөз қайтарылмайды.
 * @access  Жабық (Protected) — JWT токені міндетті
 * @header  {string} Authorization - "Bearer <token>" форматында
 * @returns {object} 200 - { success, user: { id, fullName, email, role, createdAt } }
 * @returns {object} 401 - { success: false, message } — токен жоқ немесе жарамсыз
 */
router.get('/me', protect, getMe);
router.put('/profile', protect, avatarUploadMiddleware, updateProfile);

module.exports = router;
