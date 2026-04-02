const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');

const PDF_FONT_PATHS = {
  regular: '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  bold: '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
};

const resolvePdfFont = (variant) => {
  const fontPath = PDF_FONT_PATHS[variant];
  if (fontPath && fs.existsSync(fontPath)) {
    return fontPath;
  }
  return variant === 'bold' ? 'Helvetica-Bold' : 'Helvetica';
};

const PDF_FONTS = {
  regular: resolvePdfFont('regular'),
  bold: resolvePdfFont('bold'),
};

// ─────────────────────────────────────────────
// @desc    Өтінім PDF файлын жасау және жіберу
// @route   GET /api/applications/:id/pdf
// @access  Жабық — өтінім иесі немесе Админ
// ─────────────────────────────────────────────
const generateApplicationPDF = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      'applicant', 'fullName email city'
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Өтінім табылмады.' });
    }

    // Тек өтінім иесі немесе Админ ала алады
    if (
      req.user.role !== 'admin' &&
      application.applicant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Рұқсат жоқ.' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Қазақ және кирилл мәтіндері дұрыс шығуы үшін Unicode қаріпті тіркейміз
    doc.registerFont('AppRegular', PDF_FONTS.regular);
    doc.registerFont('AppBold', PDF_FONTS.bold);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="application-${application._id}.pdf"`
    );
    doc.pipe(res);

    // ── Жоғарғы бөлік: мекеме атауы ──
    doc
      .fontSize(14)
      .font('AppBold')
      .text('UNIVERSITY ADMISSION APPLICATION', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('AppRegular')
      .text('Admission Committee Portal', { align: 'center' })
      .moveDown(1.5);

    // ── Горизонталды сызық ──
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#1B4F8A')
      .lineWidth(2)
      .stroke()
      .moveDown(1);

    // ── Өтінім ID және күн ──
    const createdDate = new Date(application.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    doc.fontSize(9).font('AppRegular').fillColor('#666').text(`Application ID: ${application._id}`, 50);
    doc.text(`Date: ${createdDate}`, 50).moveDown(1);

    // ── Блок: Абитуриент туралы ──
    sectionHeader(doc, '1. APPLICANT INFORMATION');
    row(doc, 'Full Name',    application.applicant?.fullName || '—');
    row(doc, 'Email',        application.applicant?.email    || '—');
    row(doc, 'City / Region', application.applicant?.city   || '—');
    doc.moveDown(0.8);

    // ── Блок: Өтінім деректері ──
    sectionHeader(doc, '2. APPLICATION DETAILS');
    row(doc, 'Faculty',      application.faculty);
    row(doc, 'Speciality',   application.speciality);
    row(doc, 'ENT Score',    `${application.entExamScore} / 140`);
    row(doc, 'Study Type',   studyTypeLabel(application.studyType));
    row(doc, 'Funding Type', fundingTypeLabel(application.fundingType));
    row(doc, 'Priority',     `${application.priority || 1}`);
    doc.moveDown(0.8);

    // ── Блок: Статус ──
    sectionHeader(doc, '3. STATUS');
    const statusLabel = statusLabels[application.status] || application.status;
    doc
      .fontSize(11)
      .font('AppBold')
      .fillColor(statusColor(application.status))
      .text(`  ${statusLabel}`, 50)
      .fillColor('#000')
      .font('AppRegular');

    if (application.adminNote) {
      doc.moveDown(0.4).fontSize(9).font('AppRegular').fillColor('#444')
        .text(`Note: ${application.adminNote}`, 50);
    }
    doc.moveDown(0.8);

    // ── Блок: Статус тарихы ──
    if (application.statusHistory && application.statusHistory.length > 0) {
      sectionHeader(doc, '4. STATUS HISTORY');
      application.statusHistory.forEach((h, i) => {
        const d = new Date(h.changedAt).toLocaleDateString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const label = statusLabels[h.status] || h.status;
        doc.fontSize(9).font('AppRegular').fillColor('#333')
          .text(`  ${i + 1}. ${label}   —   ${d}${h.adminNote ? `   (${h.adminNote})` : ''}`, 50);
      });
      doc.moveDown(0.8);
    }

    // ── Блок: Жүктелген құжаттар ──
    if (application.documents && application.documents.length > 0) {
      sectionHeader(doc, '5. UPLOADED DOCUMENTS');
      application.documents.forEach((d, i) => {
        doc.fontSize(9).font('AppRegular').fillColor('#333')
          .text(`  ${i + 1}. ${d.name}`, 50);
      });
      doc.moveDown(0.8);
    }

    // ── Түбі: Қол қою аймағы ──
    doc
      .moveTo(50, doc.y + 10)
      .lineTo(545, doc.y + 10)
      .strokeColor('#ccc')
      .lineWidth(0.5)
      .stroke()
      .moveDown(1.5);

    doc.fontSize(9).font('AppRegular').fillColor('#999')
      .text('This document is automatically generated by the University Admission Portal.', {
        align: 'center',
      });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ── Helpers ──

const sectionHeader = (doc, title) => {
  doc
    .fontSize(10)
    .font('AppBold')
    .fillColor('#1B4F8A')
    .text(title, 50)
    .fillColor('#000')
    .font('AppRegular')
    .moveDown(0.4);
};

const row = (doc, label, value) => {
  doc.fontSize(9).font('AppBold').fillColor('#333').text(`${label}:`, 60, doc.y, { continued: true, width: 160 });
  doc.font('AppRegular').fillColor('#000').text(`  ${value}`);
};

const statusLabels = {
  'күтілуде':     'Pending / Күтілуде',
  'қабылданды':   'Accepted / Қабылданды',
  'қабылданбады': 'Rejected / Қабылданбады',
};

const statusColor = (status) => {
  if (status === 'қабылданды')   return '#2E7D32';
  if (status === 'қабылданбады') return '#C62828';
  return '#B45309';
};

const studyTypeLabel = (v) => {
  if (v === 'күндізгі') return 'Full-time / Күндізгі';
  if (v === 'сырттай')  return 'Distance / Сырттай';
  if (v === 'кешкі')    return 'Evening / Кешкі';
  return v;
};

const fundingTypeLabel = (v) => {
  if (v === 'грант') return 'State Grant / Мемлекеттік грант';
  if (v === 'ақылы') return 'Paid / Ақылы';
  return v;
};

module.exports = { generateApplicationPDF };
