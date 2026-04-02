const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');
const Message = require('../models/Message');

const buildAbsoluteUrl = (req, relativePath = '') => {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${req.protocol}://${req.get('host')}${normalizedPath}`;
};

const getDocumentSize = (document) => {
  if (typeof document.size === 'number' && document.size > 0) {
    return document.size;
  }

  if (!document.url) {
    return null;
  }

  const filePath = path.join(__dirname, '..', document.url.replace(/^\/+/, ''));

  try {
    return fs.statSync(filePath).size;
  } catch {
    return null;
  }
};

const mapHistory = (statusHistory = []) =>
  statusHistory.map((item, index, historyItems) => {
    const previousItem = historyItems[index - 1];
    const previousStatus = item.oldStatus ?? previousItem?.newStatus ?? previousItem?.status ?? null;
    const nextStatus = item.newStatus ?? item.status;

    return {
      id: item._id,
      oldStatus: previousStatus,
      newStatus: nextStatus,
      note: item.adminNote || '',
      changedAt: item.changedAt,
      changedBy: item.changedBy
        ? {
            id: item.changedBy._id,
            fullName: item.changedBy.fullName,
            role: item.changedBy.role,
          }
        : null,
      changedByRole: item.changedByRole || item.changedBy?.role || 'admin',
    };
  });

const mapMessage = (message) => ({
  id: message._id,
  applicationId: message.applicationId,
  senderId: message.senderId?._id || message.senderId,
  senderRole: message.senderRole,
  senderName: message.senderId?.fullName || 'Жүйе',
  text: message.text,
  createdAt: message.createdAt,
  isRead: message.isRead,
});

const getApplicationFull = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('applicant', 'fullName email phone city createdAt')
      .populate('statusHistory.changedBy', 'fullName role')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Өтінім табылмады.',
      });
    }

    const messages = await Message.find({ applicationId: application._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName role')
      .lean();

    const documents = (application.documents || []).map((document) => ({
      id: document._id,
      name: document.name,
      originalName: document.originalName || document.name,
      fileName: document.fileName || '',
      mimeType: document.mimeType || '',
      size: getDocumentSize(document),
      uploadedAt: document.uploadedAt,
      url: document.url,
      openUrl: buildAbsoluteUrl(req, document.url),
      downloadUrl: buildAbsoluteUrl(req, document.url),
    }));

    res.status(200).json({
      success: true,
      data: {
        user: application.applicant
          ? {
              id: application.applicant._id,
              fullName: application.applicant.fullName,
              email: application.applicant.email,
              phone: application.applicant.phone || '',
              city: application.applicant.city || '',
              createdAt: application.applicant.createdAt,
            }
          : null,
        application: {
          id: application._id,
          faculty: application.faculty,
          speciality: application.speciality,
          entExamScore: application.entExamScore,
          studyType: application.studyType,
          fundingType: application.fundingType,
          priority: application.priority,
          status: application.status,
          adminNote: application.adminNote || '',
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        },
        documents,
        history: mapHistory(application.statusHistory || []),
        messages: messages.map(mapMessage),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getApplicationFull };
