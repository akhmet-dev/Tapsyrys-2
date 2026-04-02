/**
 * @fileoverview Құжат маршруттары
 * @module routes/documentRoutes
 * @description Өтінімдерге байланысты файл жүктеу және жою маршруттары.
 *              Барлық маршруттар JWT аутентификациясын талап етеді.
 *              /api/applications/:id/documents префиксімен жұмыс істейді.
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // :id параметрін ата-маршруттан алу үшін
const { uploadDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// Барлық маршруттарға JWT тексеруді қолданамыз
router.use(protect);

/**
 * @route   POST /api/applications/:id/documents
 * @desc    Өтінімге жаңа құжат жүктеу
 * @access  Жабық — өтінім иесі немесе Админ
 * @body    {File}   file - жүктелетін файл (PDF, JPG, PNG, макс 5MB)
 * @body    {string} name - құжат атауы (мысалы: "Жеке куәлік")
 */
router.post('/', uploadDocument);

/**
 * @route   DELETE /api/applications/:id/documents/:docId
 * @desc    Өтінімнен құжатты жою
 * @access  Жабық — өтінім иесі немесе Админ
 */
router.delete('/:docId', deleteDocument);

module.exports = router;
