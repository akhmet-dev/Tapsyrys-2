const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Өтінім идентификаторы міндетті'],
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Жіберуші идентификаторы міндетті'],
    },

    senderRole: {
      type: String,
      enum: ['admin', 'applicant'],
      required: [true, 'Жіберуші рөлі міндетті'],
    },

    text: {
      type: String,
      required: [true, 'Хабарлама мәтіні міндетті'],
      trim: true,
      maxlength: [2000, 'Хабарлама 2000 таңбадан аспауы керек'],
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ applicationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
