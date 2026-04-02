const Application = require('../models/Application');
const User = require('../models/User');
const { sendStatusChangeEmail } = require('../services/emailService');
const {
  mergeApplicationDocuments,
  validateRequiredDocuments,
  removeUploadedFiles,
} = require('./documentController');

// SSE клиенттер тізімі { userId → [res, ...] }
// sseClients модулі арқылы бөлісіледі
const sseClients = require('../services/sseClients');

const parseBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseExistingDocuments = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const buildCertificatesPayload = (body) => {
  const certificates = {
    ielts: {
      enabled: parseBoolean(body.hasIelts),
      score: parseNullableNumber(body.ieltsScore),
    },
    toefl: {
      enabled: parseBoolean(body.hasToefl),
      score: parseNullableNumber(body.toeflScore),
    },
    olympiad: {
      enabled: parseBoolean(body.hasOlympiad),
      level: body.olympiadLevel || '',
    },
    sports: {
      enabled: parseBoolean(body.hasSports),
    },
    other: {
      enabled: parseBoolean(body.hasOtherCertificates),
    },
  };

  if (!certificates.ielts.enabled) {
    certificates.ielts.score = null;
  }

  if (!certificates.toefl.enabled) {
    certificates.toefl.score = null;
  }

  if (!certificates.olympiad.enabled) {
    certificates.olympiad.level = '';
  }

  return certificates;
};

const buildApplicationPayload = (body) => ({
  faculty: body.faculty,
  speciality: body.speciality,
  entExamScore: Number(body.entExamScore),
  studyType: body.studyType,
  fundingType: body.fundingType,
  priority: Number(body.priority || 1),
  birthDate: body.birthDate,
  citizenship: body.citizenship,
  gender: body.gender,
  address: body.address,
  schoolName: body.schoolName,
  graduationYear: Number(body.graduationYear),
  gpa: Number(body.gpa),
  certificates: buildCertificatesPayload(body),
});

const validateApplicationPayload = (body, certificates) => {
  if (!body.faculty || !body.speciality || body.entExamScore === undefined || !body.studyType || !body.fundingType) {
    return 'Барлық міндетті өрістерді толтырыңыз.';
  }

  if (!body.birthDate || !body.citizenship || !body.gender || !body.address || !body.schoolName || !body.graduationYear || body.gpa === undefined) {
    return 'Барлық міндетті өрістерді толтырыңыз.';
  }

  if (certificates.ielts.enabled && certificates.ielts.score === null) {
    return 'IELTS балын енгізіңіз.';
  }

  if (certificates.toefl.enabled && certificates.toefl.score === null) {
    return 'TOEFL балын енгізіңіз.';
  }

  if (certificates.olympiad.enabled && !certificates.olympiad.level) {
    return 'Олимпиада деңгейін таңдаңыз.';
  }

  return null;
};

const syncApplicantPhone = async (userId, phone) => {
  if (phone === undefined) {
    return;
  }

  await User.findByIdAndUpdate(userId, { phone: phone ? String(phone).trim() : '' });
};

// ─────────────────────────────────────────────
// @desc    Барлық өтінімдерді алу
// @route   GET /api/applications
// @access  Жабық (Protected)
// ─────────────────────────────────────────────
const getApplications = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Application.find().populate('applicant', 'fullName email phone city');
    } else {
      query = Application.find({ applicant: req.user._id });
    }
    const applications = await query.sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Жеке өтінімді ID бойынша алу
// @route   GET /api/applications/:id
// @access  Жабық (Protected)
// ─────────────────────────────────────────────
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      'applicant', 'fullName email phone city'
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Өтінім табылмады.' });
    }
    if (
      req.user.role !== 'admin' &&
      application.applicant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Бұл өтінімге қол жеткізу рұқсаты жоқ.' });
    }
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Жаңа өтінім жасау
// @route   POST /api/applications
// @access  Жабық — тек Абитуриент
// ─────────────────────────────────────────────
const createApplication = async (req, res, next) => {
  try {
    const certificates = buildCertificatesPayload(req.body);
    const validationError = validateApplicationPayload(req.body, certificates);

    if (validationError) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ success: false, message: validationError });
    }

    const documents = mergeApplicationDocuments([], req.files || {}, []);
    const missingRequiredDocument = validateRequiredDocuments(documents, certificates);

    if (missingRequiredDocument) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `${missingRequiredDocument} құжатын жүктеу міндетті.`,
      });
    }

    const { speciality } = req.body;
    const existingApplication = await Application.findOne({ applicant: req.user._id, speciality });
    if (existingApplication) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Сіз "${speciality}" мамандығына бұрыннан өтінім бергенсіз.`,
      });
    }

    const applicationPayload = buildApplicationPayload(req.body);

    const newApplication = await Application.create({
      applicant: req.user._id,
      ...applicationPayload,
      documents,
      // Алғашқы статус тарихы
      statusHistory: [{
        status: 'күтілуде',
        oldStatus: null,
        newStatus: 'күтілуде',
        changedAt: new Date(),
        changedBy: req.user._id,
        changedByRole: req.user.role,
      }],
    });

    await syncApplicantPhone(req.user._id, req.body.phone);

    res.status(201).json({ success: true, message: 'Өтінім сәтті жіберілді!', data: newApplication });
  } catch (error) {
    removeUploadedFiles(req.files);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Өтінімді жаңарту
// @route   PUT /api/applications/:id
// @access  Жабық — Абитуриент немесе Админ
// ─────────────────────────────────────────────
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Өтінім табылмады.' });
    }
    if (
      req.user.role !== 'admin' &&
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Бұл өтінімді өзгертуге рұқсатыңыз жоқ.' });
    }

    if (req.user.role !== 'admin') {
      delete req.body.status;
      delete req.body.adminNote;
    }

    const certificates = buildCertificatesPayload(req.body);
    const validationError = validateApplicationPayload(req.body, certificates);

    if (validationError) {
      removeUploadedFiles(req.files);
      return res.status(400).json({ success: false, message: validationError });
    }

    const nextDocuments = mergeApplicationDocuments(
      application.documents || [],
      req.files || {},
      parseExistingDocuments(req.body.existingDocuments)
    );

    const missingRequiredDocument = validateRequiredDocuments(nextDocuments, certificates);

    if (missingRequiredDocument) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `${missingRequiredDocument} құжатын жүктеу міндетті.`,
      });
    }

    const updateData = buildApplicationPayload(req.body);

    if (req.user.role === 'admin' && req.body.adminNote !== undefined) {
      updateData.adminNote = req.body.adminNote;
    }

    application.set(updateData);
    application.documents = nextDocuments;
    await application.save();
    await syncApplicantPhone(application.applicant, req.body.phone);

    res.status(200).json({ success: true, message: 'Өтінім сәтті жаңартылды.', data: application });
  } catch (error) {
    removeUploadedFiles(req.files);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Өтінімнің статусын өзгерту
// @route   PATCH /api/applications/:id/status
// @access  Жабық — тек Админ
// ─────────────────────────────────────────────
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['күтілуде', 'қабылданды', 'қабылданбады'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Статус 'күтілуде', 'қабылданды' немесе 'қабылданбады' болуы керек.",
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Өтінім табылмады.' });
    }

    // Статус тарихына жазу
    application.statusHistory.push({
      status,
      oldStatus: application.status,
      newStatus: status,
      adminNote: adminNote || '',
      changedAt: new Date(),
      changedBy: req.user._id,
      changedByRole: req.user.role,
    });

    application.status = status;
    if (adminNote !== undefined) application.adminNote = adminNote;

    await application.save();

    // Email хабарлама
    const populatedApp = await Application.findById(application._id).populate('applicant', 'fullName email');
    if (populatedApp?.applicant) {
      await sendStatusChangeEmail(
        populatedApp.applicant.email,
        populatedApp.applicant.fullName,
        status,
        application.speciality,
        adminNote || ''
      );

      // SSE арқылы нақты уақытта хабарлама жіберу
      const userId = populatedApp.applicant._id.toString();
      sseClients.broadcast(userId, {
        type: 'STATUS_CHANGE',
        applicationId: application._id.toString(),
        status,
        adminNote: adminNote || '',
        speciality: application.speciality,
      });
    }

    res.status(200).json({
      success: true,
      message: `Өтінім статусы "${status}" болып өзгертілді.`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Өтінімді жою
// @route   DELETE /api/applications/:id
// @access  Жабық — Абитуриент (өзінікін) немесе Админ
// ─────────────────────────────────────────────
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Өтінім табылмады.' });
    }
    if (
      req.user.role !== 'admin' &&
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Бұл өтінімді жоюға рұқсатыңыз жоқ.' });
    }
    if (req.user.role !== 'admin' && application.status !== 'күтілуде') {
      return res.status(400).json({
        success: false,
        message: 'Тек "күтілуде" статусындағы өтінімді жоюға болады.',
      });
    }
    await Application.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Өтінім сәтті жойылды.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
};
