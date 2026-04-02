const Application = require('../models/Application');
const User = require('../models/User');

// ─────────────────────────────────────────────
// @desc    Аналитика деректерін алу
// @route   GET /api/admin/analytics
// @access  Жабық (Admin Only)
// ─────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const allApplications = await Application.find()
      .populate('applicant', 'fullName email city')
      .sort({ createdAt: -1 });

    const totalApplications = allApplications.length;

    // ── Статус бойынша ──
    const byStatus = {
      pending:  allApplications.filter((a) => a.status === 'күтілуде').length,
      accepted: allApplications.filter((a) => a.status === 'қабылданды').length,
      rejected: allApplications.filter((a) => a.status === 'қабылданбады').length,
    };

    // ── Мамандық бойынша ──
    const specialityMap = {};
    allApplications.forEach((app) => {
      specialityMap[app.speciality] = (specialityMap[app.speciality] || 0) + 1;
    });
    const bySpeciality = Object.entries(specialityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ── Факультет бойынша ──
    const facultyMap = {};
    allApplications.forEach((app) => {
      facultyMap[app.faculty] = (facultyMap[app.faculty] || 0) + 1;
    });
    const byFaculty = Object.entries(facultyMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ── Қаржыландыру бойынша ──
    const byFunding = {
      grant: allApplications.filter((a) => a.fundingType === 'грант').length,
      paid:  allApplications.filter((a) => a.fundingType === 'ақылы').length,
    };

    // ── География (қала бойынша) ──
    // Тек қабылданған пайдаланушылардан емес, барлық өтінім берген қалалар
    const cityMap = {};
    allApplications.forEach((app) => {
      const city = app.applicant?.city?.trim();
      if (city) {
        cityMap[city] = (cityMap[city] || 0) + 1;
      }
    });
    const byCity = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Үздік 15 қала

    // Қала деректері жоқ өтінімдер
    const noCityCount = allApplications.filter((a) => !a.applicant?.city?.trim()).length;

    // ── Соңғы 5 өтінім ──
    const recentApplications = allApplications.slice(0, 5).map((app) => ({
      _id: app._id,
      applicantName: app.applicant?.fullName || 'Белгісіз',
      speciality: app.speciality,
      status: app.status,
      entExamScore: app.entExamScore,
      fundingType: app.fundingType,
      createdAt: app.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalApplications,
        byStatus,
        bySpeciality,
        byFaculty,
        byFunding,
        byCity,
        noCityCount,
        recentApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
