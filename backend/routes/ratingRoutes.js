/**
 * @fileoverview Рейтинг маршруттары
 * @module routes/ratingRoutes
 * @description Қабылданған өтінімдердің рейтинг тізімін қайтаратын маршрут.
 *              БҰЛ МАРШРУТ АШЫҚ — аутентификация талап ЕТІЛМЕЙДІ.
 *              Кез-келген адам рейтинг тізімін көре алады.
 */

const express = require('express');
const router = express.Router();
const { getRating } = require('../controllers/ratingController');

/**
 * @route   GET /api/rating
 * @desc    Қабылданған өтінімдердің рейтинг тізімі (ҰБТ балы бойынша кему ретімен)
 * @access  Ашық (Public) — аутентификация талап етілмейді
 * @returns {Array} rank, applicantName, speciality, entExamScore, fundingType
 */
router.get('/', getRating);

module.exports = router;
