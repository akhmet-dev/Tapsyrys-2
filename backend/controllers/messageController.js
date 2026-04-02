const Application = require('../models/Application');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendApplicantMessageEmail } = require('../services/emailService');
const sseClients = require('../services/sseClients');

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

const loadApplicationWithApplicant = async (applicationId) =>
  Application.findById(applicationId).populate('applicant', 'fullName email');

const ensureApplicationAccess = async (applicationId, user) => {
  const application = await loadApplicationWithApplicant(applicationId);

  if (!application) {
    const error = new Error('Өтінім табылмады.');
    error.statusCode = 404;
    throw error;
  }

  const isOwner =
    application.applicant &&
    application.applicant._id.toString() === user._id.toString();

  if (user.role !== 'admin' && !isOwner) {
    const error = new Error('Бұл өтінімге қол жеткізу рұқсаты жоқ.');
    error.statusCode = 403;
    throw error;
  }

  return application;
};

const getMessages = async (req, res, next) => {
  try {
    await ensureApplicationAccess(req.params.applicationId, req.user);

    const messages = await Message.find({ applicationId: req.params.applicationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName role');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.map(mapMessage),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    if (!['admin', 'applicant'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Хабарлама жіберуге рұқсат жоқ.',
      });
    }

    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Хабарлама мәтінін енгізіңіз.',
      });
    }

    const application = await ensureApplicationAccess(req.params.applicationId, req.user);

    const createdMessage = await Message.create({
      applicationId: application._id,
      senderId: req.user._id,
      senderRole: req.user.role,
      text,
      isRead: false,
    });

    const populatedMessage = await Message.findById(createdMessage._id).populate('senderId', 'fullName role');

    if (req.user.role === 'admin' && application.applicant?.email) {
      await sendApplicantMessageEmail(
        application.applicant.email,
        application.applicant.fullName,
        text,
        application.speciality
      );
    }

    if (req.user.role === 'admin' && application.applicant?._id) {
      sseClients.broadcast(application.applicant._id.toString(), {
        type: 'NEW_MESSAGE',
        applicationId: application._id.toString(),
        message: mapMessage(populatedMessage),
        preview: text.slice(0, 160),
      });
    }

    if (req.user.role === 'applicant') {
      const admins = await User.find({ role: 'admin' }).select('_id');

      admins.forEach((admin) => {
        sseClients.broadcast(admin._id.toString(), {
          type: 'NEW_MESSAGE',
          applicationId: application._id.toString(),
          message: mapMessage(populatedMessage),
          preview: text.slice(0, 160),
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Хабарлама сәтті жіберілді.',
      data: mapMessage(populatedMessage),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

const markMessagesRead = async (req, res, next) => {
  try {
    const application = await ensureApplicationAccess(req.params.applicationId, req.user);

    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Хабарламаны оқылды деп белгілеу тек абитуриентке қолжетімді.',
      });
    }

    const result = await Message.updateMany(
      {
        applicationId: application._id,
        senderRole: 'admin',
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    sseClients.broadcast(req.user._id.toString(), {
      type: 'MESSAGES_READ',
      applicationId: application._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Хабарламалар оқылды деп белгіленді.',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesRead,
};
