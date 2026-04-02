/**
 * @fileoverview Құжат жүктеу контроллері
 * @module controllers/documentController
 * @description Өтінімге файл жүктеу және жою операциялары.
 *              Multer дискке жазу арқылы /uploads қалтасына сақтайды.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Application = require('../models/Application');

// ─────────────────────────────────────────────
// Multer дискке жазу конфигурациясы
// ─────────────────────────────────────────────

// Файлдарды /uploads қалтасына сақтайтын дискке жазу объектісі
const storage = multer.diskStorage({
  // Файл сақталатын қалтаны орнатамыз
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    // Қалта жоқ болса жасаймыз
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  // Файл атауын уникалды етіп жасаймыз (timestamp + random + кеңейтім)
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

// Файл түрін тексеру фильтрі (тек PDF, JPG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Тек PDF, JPG немесе PNG файлдарын жүктеуге болады'), false);
  }
};

// Multer конфигурациясы — максималды өлшем 50MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Multer middleware-ін экспорттаймыз (маршрутта қолдану үшін)
const uploadMiddleware = upload.single('file');
const applicationDocumentsMiddleware = upload.fields([
  { name: 'identityDocument', maxCount: 1 },
  { name: 'diplomaDocument', maxCount: 1 },
  { name: 'photoDocument', maxCount: 1 },
  { name: 'entCertificateDocument', maxCount: 1 },
  { name: 'languageCertificateDocument', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 10 },
]);

const DOCUMENT_SLOT_CONFIG = {
  identityDocument: { slotKey: 'identityDocument', name: 'Жеке куәлік', required: true },
  diplomaDocument: { slotKey: 'diplomaDocument', name: 'Аттестат/Диплом', required: true },
  photoDocument: { slotKey: 'photoDocument', name: 'Фото 3x4', required: true },
  entCertificateDocument: { slotKey: 'entCertificateDocument', name: 'ЕНТ сертификаты', required: true },
  languageCertificateDocument: { slotKey: 'languageCertificateDocument', name: 'IELTS/TOEFL сертификаты', required: false },
  otherDocuments: { slotKey: 'otherDocuments', name: 'Басқа құжаттар', required: false },
};

const removeFileFromDisk = (filePath) => {
  if (!filePath) {
    return;
  }

  fs.unlink(filePath, () => {});
};

const removeUploadedFiles = (filesObject = {}) => {
  Object.values(filesObject)
    .flat()
    .forEach((file) => removeFileFromDisk(file.path));
};

const mapFileToDocument = (file, slotConfig, index = 0) => ({
  name: slotConfig.slotKey === 'otherDocuments'
    ? `${slotConfig.name}: ${index + 1}`
    : slotConfig.name,
  slotKey: slotConfig.slotKey,
  originalName: file.originalname,
  fileName: file.filename,
  mimeType: file.mimetype,
  size: file.size,
  url: `/uploads/${file.filename}`,
  uploadedAt: new Date(),
});

const buildDocumentsFromRequestFiles = (filesObject = {}) => {
  const documents = [];

  Object.entries(DOCUMENT_SLOT_CONFIG).forEach(([fieldName, slotConfig]) => {
    const files = filesObject[fieldName] || [];

    files.forEach((file, index) => {
      documents.push(mapFileToDocument(file, slotConfig, index));
    });
  });

  return documents;
};

const mergeApplicationDocuments = (existingDocuments = [], filesObject = {}, existingDocumentsPayload = []) => {
  const keptDocumentIds = new Set(
    (existingDocumentsPayload || [])
      .map((item) => item.id || item._id)
      .filter(Boolean)
      .map((value) => value.toString())
  );

  const nextDocuments = (existingDocuments || []).filter((document) =>
    keptDocumentIds.has(document._id.toString())
  );

  Object.entries(DOCUMENT_SLOT_CONFIG).forEach(([fieldName, slotConfig]) => {
    const files = filesObject[fieldName] || [];

    if (slotConfig.slotKey !== 'otherDocuments' && files.length > 0) {
      for (let index = nextDocuments.length - 1; index >= 0; index -= 1) {
        if (nextDocuments[index].slotKey === slotConfig.slotKey) {
          nextDocuments.splice(index, 1);
        }
      }
    }

    files.forEach((file, index) => {
      nextDocuments.push(mapFileToDocument(file, slotConfig, index));
    });
  });

  return nextDocuments;
};

const validateRequiredDocuments = (documents = [], certificates = {}) => {
  const requiredSlotKeys = ['identityDocument', 'diplomaDocument', 'photoDocument', 'entCertificateDocument'];

  if (certificates.ielts?.enabled || certificates.toefl?.enabled) {
    requiredSlotKeys.push('languageCertificateDocument');
  }

  const missingSlot = requiredSlotKeys.find((slotKey) =>
    !documents.some((document) => document.slotKey === slotKey)
  );

  if (!missingSlot) {
    return null;
  }

  return DOCUMENT_SLOT_CONFIG[missingSlot]?.name || 'Құжат';
};

// ─────────────────────────────────────────────
// @desc    Өтінімге құжат жүктеу
// @route   POST /api/applications/:id/documents
// @access  Жабық (Protected) — өтінім иесі немесе Админ
// ─────────────────────────────────────────────
const uploadDocument = async (req, res, next) => {
  // Multer middleware-ін қолмен шақырамыз
  uploadMiddleware(req, res, async (err) => {
    // Multer қатесін өңдеу
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Файл өлшемі 50MB-тан аспауы керек',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Файл жүктелмегенін тексеру
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл таңдалмады',
      });
    }

    try {
      const application = await Application.findById(req.params.id);

      if (!application) {
        // Жүктелген файлды жою (өтінім жоқ болса)
        removeFileFromDisk(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Өтінім табылмады',
        });
      }

      // Тек иесі немесе Админ жүктей алады
      if (
        req.user.role !== 'admin' &&
        application.applicant.toString() !== req.user._id.toString()
      ) {
        removeFileFromDisk(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'Бұл өтінімге файл жүктеу рұқсатыңыз жоқ',
        });
      }

      // Құжат атауын req.body-дан аламыз (міндетті өріс)
      const docName = req.body.name || req.file.originalname;

      // Файлдың статикалық URL мекенжайы
      const fileUrl = `/uploads/${req.file.filename}`;

      // Дерекқорға жаңа құжатты қосамыз
      application.documents.push({
        name: docName,
        slotKey: req.body.slotKey || '',
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        uploadedAt: new Date(),
      });

      await application.save();

      // Жаңа қосылған құжатты қайтарамыз
      const addedDoc = application.documents[application.documents.length - 1];

      res.status(201).json({
        success: true,
        message: 'Құжат сәтті жүктелді',
        data: addedDoc,
      });
    } catch (error) {
      // Қате болса жүктелген файлды жоямыз
      if (req.file) {
        removeFileFromDisk(req.file.path);
      }
      next(error);
    }
  });
};

// ─────────────────────────────────────────────
// @desc    Өтінімнен құжатты жою
// @route   DELETE /api/applications/:id/documents/:docId
// @access  Жабық (Protected) — өтінім иесі немесе Админ
// ─────────────────────────────────────────────
const deleteDocument = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Өтінім табылмады',
      });
    }

    // Тек иесі немесе Админ жоя алады
    if (
      req.user.role !== 'admin' &&
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Бұл құжатты жоюға рұқсатыңыз жоқ',
      });
    }

    // Құжатты ID бойынша табамыз
    const document = application.documents.id(req.params.docId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Құжат табылмады',
      });
    }

    // Дискте файлды жоямыз
    const filePath = path.join(
      __dirname,
      '..',
      document.fileName ? path.join('uploads', document.fileName) : document.url.replace(/^\/+/, '')
    );
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        // Файл жоқ болса да операцияны тоқтатпаймыз
        console.warn('⚠️  Файлды дискте жою мүмкін болмады:', unlinkErr.message);
      }
    });

    // Дерекқордан құжатты алып тастаймыз
    application.documents.pull({ _id: req.params.docId });
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Құжат сәтті жойылды',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  deleteDocument,
  applicationDocumentsMiddleware,
  buildDocumentsFromRequestFiles,
  mergeApplicationDocuments,
  validateRequiredDocuments,
  removeUploadedFiles,
};
