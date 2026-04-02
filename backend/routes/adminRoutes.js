/**
 * @fileoverview Администратор маршруттары
 * @module routes/adminRoutes
 * @description Тек Администраторларға арналған аналитика маршруттары.
 *              /api/admin префиксімен жұмыс істейді.
 */

const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { getApplicationFull } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/admin/analytics
 * @desc    Жүйе аналитикасын алу — барлық өтінімдер статистикасы
 * @access  Жабық (Admin Only) — protect + adminOnly мидлвэрлері
 * @returns {Object} totalApplications, byStatus, bySpeciality, byFunding, recentApplications
 */
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/applications/:id/full', protect, adminOnly, getApplicationFull);

module.exports = router;
