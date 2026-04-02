/**
 * @fileoverview Өтінімдер маршруттары
 * @module routes/applicationRoutes
 * @description Университетке түсу өтінімдерінің толық CRUD операцияларын анықтайды.
 *              Барлық маршруттар /api/applications префиксімен жұмыс істейді.
 *              Барлық маршруттар JWT аутентификациясын талап етеді.
 */

const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} = require('../controllers/applicationController');
const {
  uploadDocument,
  deleteDocument,
  applicationDocumentsMiddleware,
} = require('../controllers/documentController');
const { generateApplicationPDF } = require('../controllers/pdfController');
const { sseConnect } = require('../controllers/sseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * Барлық өтінім маршруттарына JWT тексеруді қолданамыз.
 * protect мидлвэрі Authorization тақырыбын тексеріп, req.user орнатады.
 */
router.use(protect);

/**
 * @route   GET /api/applications
 * @method  GET
 * @desc    Өтінімдер тізімін алу.
 *          — Абитуриент: тек өзінің өтінімдерін алады
 *          — Админ: барлық абитуриенттердің өтінімдерін алады (populate: fullName, email)
 *          Нәтиже жасалған уақыт бойынша кері ретпен сұрыпталады (жаңасы бірінші).
 * @access  Жабық (Protected) — кез-келген тіркелген пайдаланушы
 * @header  {string} Authorization - "Bearer <token>"
 * @returns {object} 200 - { success, count, data: Application[] }
 */

/**
 * @route   POST /api/applications
 * @method  POST
 * @desc    Жаңа өтінім жасау.
 *          Бір абитуриент бір мамандыққа тек бір өтінім бере алады.
 *          Өтінімнің бастапқы статусы автоматты "күтілуде" болады.
 * @access  Жабық (Protected) — барлық тіркелген пайдаланушылар
 * @header  {string} Authorization - "Bearer <token>"
 * @body    {string} faculty       - Факультет атауы (міндетті)
 * @body    {string} speciality    - Мамандық атауы (міндетті)
 * @body    {number} entExamScore  - ҰБТ балы, 0–140 аралығында (міндетті)
 * @body    {string} studyType     - Оқу түрі: 'күндізгі' | 'сырттай' | 'кешкі' (міндетті)
 * @body    {string} fundingType   - Қаржыландыру: 'грант' | 'ақылы' (міндетті)
 * @returns {object} 201 - { success, message, data: Application }
 * @returns {object} 400 - { success: false, message } — дубликат немесе валидация қатесі
 */
router.route('/').get(getApplications).post(applicationDocumentsMiddleware, createApplication);

/**
 * @route   GET /api/applications/events
 * @desc    SSE байланысы — нақты уақытта статус хабарламалары
 * @access  Жабық (Protected)
 * МАҢЫЗДЫ: /:id параметрлі маршруттардың алдына орналасуы керек
 */
router.get('/events', sseConnect);

/**
 * @route   GET /api/applications/:id
 * @method  GET
 * @desc    Жеке өтінімді MongoDB ObjectId бойынша алу.
 *          Абитуриент тек өзінің өтінімін ала алады.
 *          Админ кез-келген өтінімді ала алады.
 * @access  Жабық (Protected) — өтінім иесі немесе Админ
 * @param   {string} id - MongoDB ObjectId форматындағы өтінім идентификаторы
 * @returns {object} 200 - { success, data: Application }
 * @returns {object} 403 - { success: false, message } — рұқсат жоқ
 * @returns {object} 404 - { success: false, message } — өтінім табылмады
 */

/**
 * @route   PUT /api/applications/:id
 * @method  PUT
 * @desc    Өтінімді толық жаңарту.
 *          Абитуриент тек өзінің өтінімін жаңарта алады.
 *          Абитуриент status және adminNote өрістерін өзгерте алмайды.
 *          Рұқсат етілген өрістер: faculty, speciality, entExamScore, studyType, fundingType.
 *          Схема валидациясы (runValidators: true) міндетті түрде орындалады.
 * @access  Жабық (Protected) — өтінім иесі немесе Админ
 * @param   {string} id - Өтінім идентификаторы
 * @body    {string}  [faculty]      - Факультет атауы
 * @body    {string}  [speciality]   - Мамандық атауы
 * @body    {number}  [entExamScore] - ҰБТ балы (0–140)
 * @body    {string}  [studyType]    - Оқу түрі
 * @body    {string}  [fundingType]  - Қаржыландыру түрі
 * @returns {object} 200 - { success, message, data: Application }
 * @returns {object} 403 - { success: false, message } — рұқсат жоқ
 * @returns {object} 404 - { success: false, message } — өтінім табылмады
 */

/**
 * @route   DELETE /api/applications/:id
 * @method  DELETE
 * @desc    Өтінімді жою.
 *          Абитуриент тек өзінің "күтілуде" статусындағы өтінімін жоя алады.
 *          Админ кез-келген өтінімді жоя алады (статусқа қарамастан).
 * @access  Жабық (Protected) — өтінім иесі (күтілуде ғана) немесе Админ
 * @param   {string} id - Өтінім идентификаторы
 * @returns {object} 200 - { success, message }
 * @returns {object} 400 - { success: false, message } — статус "күтілуде" емес
 * @returns {object} 403 - { success: false, message } — рұқсат жоқ
 * @returns {object} 404 - { success: false, message } — өтінім табылмады
 */
router.route('/:id').get(getApplicationById).put(applicationDocumentsMiddleware, updateApplication).delete(deleteApplication);

/**
 * @route   PATCH /api/applications/:id/status
 * @method  PATCH
 * @desc    Өтінімнің статусын өзгерту — тек Администратор үшін.
 *          Статус 3 мәннің бірі болуы міндетті: 'күтілуде', 'қабылданды', 'қабылданбады'.
 *          Қосымша adminNote — абитуриентке хабарлама ретінде карточкада көрсетіледі.
 * @access  Жабық (Admin Only) — protect + adminOnly мидлвэрлері
 * @header  {string} Authorization - "Bearer <admin_token>"
 * @param   {string} id - Өтінім идентификаторы
 * @body    {string} status     - 'күтілуде' | 'қабылданды' | 'қабылданбады' (міндетті)
 * @body    {string} [adminNote] - Администратордың ескертпесі (қосымша, макс 500 таңба)
 * @returns {object} 200 - { success, message, data: Application }
 * @returns {object} 400 - { success: false, message } — жарамсыз статус
 * @returns {object} 403 - { success: false, message } — Админ рөлі жоқ
 * @returns {object} 404 - { success: false, message } — өтінім табылмады
 */
router.patch('/:id/status', adminOnly, updateApplicationStatus);

/**
 * @route   POST /api/applications/:id/documents
 * @desc    Өтінімге құжат жүктеу (PDF, JPG, PNG, макс 50MB)
 * @access  Жабық — өтінім иесі немесе Админ
 */
router.post('/:id/documents', uploadDocument);

/**
 * @route   DELETE /api/applications/:id/documents/:docId
 * @desc    Өтінімнен құжатты жою
 * @access  Жабық — өтінім иесі немесе Админ
 */
router.delete('/:id/documents/:docId', deleteDocument);

/**
 * @route   GET /api/applications/:id/pdf
 * @desc    Өтінімнің PDF файлын жүктеу
 * @access  Жабық — өтінім иесі немесе Админ
 */
router.get('/:id/pdf', generateApplicationPDF);

module.exports = router;
