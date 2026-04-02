/**
 * @fileoverview Рейтинг тізімі контроллері
 * @module controllers/ratingController
 * @description Қабылданған барлық өтінімдерді ҰБТ балы бойынша кему ретімен сұрыптайды.
 *              Бұл маршрут аутентификация талап етпейді — ашық (public).
 */

const Application = require('../models/Application');

// ─────────────────────────────────────────────
// @desc    Рейтинг тізімін алу (ашық маршрут)
// @route   GET /api/rating
// @access  Ашық (Public)
// ─────────────────────────────────────────────
const getRating = async (req, res, next) => {
  try {
    // Тек 'қабылданды' статусындағы өтінімдерді ҰБТ балы бойынша кему ретімен аламыз
    const applications = await Application.find({ status: 'қабылданды' })
      .populate('applicant', 'fullName')
      .sort({ entExamScore: -1 })
      .select('applicant speciality entExamScore fundingType faculty');

    // Рейтинг нөмірін қосамыз
    const ratingList = applications.map((app, index) => ({
      rank: index + 1,
      applicantName: app.applicant?.fullName || 'Белгісіз',
      faculty: app.faculty,
      speciality: app.speciality,
      entExamScore: app.entExamScore,
      fundingType: app.fundingType,
    }));

    res.status(200).json({
      success: true,
      count: ratingList.length,
      data: ratingList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRating };
