/**
 * @fileoverview Email хабарлама сервисі
 * @module services/emailService
 * @description Nodemailer арқылы пайдаланушыларға email хабарламаларын жіберу.
 *              Gmail SMTP пайдаланады. Барлық операциялар try/catch ішінде —
 *              email жіберілмесе де негізгі операция тоқтамайды.
 */

const nodemailer = require('nodemailer');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPreview = (text = '', maxLength = 180) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
};

// ─────────────────────────────────────────────
// Gmail SMTP транспортерін жасау
// ─────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─────────────────────────────────────────────
// Тіркелу сәтті өткенде email жіберу
// @param {string} toEmail   - алушының email мекенжайы
// @param {string} fullName  - алушының толық аты
// ─────────────────────────────────────────────
const sendRegistrationEmail = async (toEmail, fullName) => {
  // EMAIL_USER орнатылмаса — тыныш өткіземіз
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('ℹ️  Email конфигурациясы жоқ — тіркелу email жіберілмеді');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Қабылдау комиссиясы" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Тіркелуіңіз сәтті өтті! | Университет қабылдау комиссиясы',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Университет қабылдау комиссиясы</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Сәлем, ${fullName}!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              <strong>Тіркелуіңіз сәтті өтті!</strong> Сіз университеттің онлайн қабылдау жүйесіне сәтті тіркелдіңіз.
            </p>
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #2e7d32; font-size: 15px;">
                ✅ Енді сіз өтінімдер жіберіп, статустарын бақылай аласыз.
              </p>
            </div>
            <p style="color: #777; font-size: 14px;">
              Сұрақтарыңыз болса, бізге хабарласыңыз.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 Университет қабылдау комиссиясы
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Тіркелу email жіберілді: ${toEmail}`);
  } catch (error) {
    // Email жіберілмесе де негізгі операция тоқтамайды
    console.error('⚠️  Тіркелу email жіберілмеді:', error.message);
  }
};

// ─────────────────────────────────────────────
// Өтінім статусы өзгергенде email жіберу
// @param {string} toEmail      - алушының email мекенжайы
// @param {string} fullName     - алушының толық аты
// @param {string} status       - жаңа статус
// @param {string} speciality   - мамандық атауы
// @param {string} adminNote    - админ ескертпесі (қосымша)
// ─────────────────────────────────────────────
const sendStatusChangeEmail = async (toEmail, fullName, status, speciality, adminNote = '') => {
  // EMAIL_USER орнатылмаса — тыныш өткіземіз
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('ℹ️  Email конфигурациясы жоқ — статус email жіберілмеді');
    return;
  }

  try {
    const transporter = createTransporter();

    // Статуске байланысты түс және белгі
    const statusConfig = {
      'қабылданды':   { color: '#4caf50', bg: '#e8f5e9', icon: '✅', label: 'Қабылданды' },
      'қабылданбады': { color: '#f44336', bg: '#ffebee', icon: '❌', label: 'Қабылданбады' },
      'күтілуде':     { color: '#ff9800', bg: '#fff3e0', icon: '⏳', label: 'Күтілуде' },
    };

    const config = statusConfig[status] || { color: '#607d8b', bg: '#eceff1', icon: '📋', label: status };

    const adminNoteHtml = adminNote
      ? `<div style="background: #f5f5f5; border-left: 4px solid #9e9e9e; padding: 12px; margin: 15px 0; border-radius: 4px;">
           <p style="margin: 0; color: #555; font-size: 14px;"><strong>Админ ескертпесі:</strong> ${adminNote}</p>
         </div>`
      : '';

    const mailOptions = {
      from: `"Қабылдау комиссиясы" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Өтінімніздің статусы өзгерді: ${config.label}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Университет қабылдау комиссиясы</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Сәлем, ${fullName}!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Сіздің <strong>"${speciality}"</strong> мамандығына берген өтінімініздің статусы өзгерді.
            </p>
            <div style="background: ${config.bg}; border-left: 4px solid ${config.color}; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: ${config.color}; font-size: 20px; font-weight: bold;">
                ${config.icon} Өтінімніздің статусы: <strong>${config.label}</strong>
              </p>
            </div>
            ${adminNoteHtml}
            <p style="color: #777; font-size: 14px;">
              Толық ақпарат алу үшін жүйеге кіріңіз.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 Университет қабылдау комиссиясы
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Статус өзгеру email жіберілді: ${toEmail} → ${status}`);
  } catch (error) {
    // Email жіберілмесе де негізгі операция тоқтамайды
    console.error('⚠️  Статус email жіберілмеді:', error.message);
  }
};

const sendApplicantMessageEmail = async (toEmail, fullName, messageText, speciality = '') => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('ℹ️  Email конфигурациясы жоқ — хабарлама email жіберілмеді');
    return;
  }

  try {
    const transporter = createTransporter();
    const preview = buildPreview(messageText);

    const mailOptions = {
      from: `"Қабылдау комиссиясы" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Жаңа хабарлама | Университет қабылдау комиссиясы',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1B4F8A 0%, #2E7D32 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Университет қабылдау комиссиясы</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Сәлем, ${escapeHtml(fullName)}!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Қабылдау комиссиясынан жаңа хабарлама келді${speciality ? ` — <strong>${escapeHtml(speciality)}</strong>` : ''}.
            </p>
            <div style="background: #eef5ff; border-left: 4px solid #1B4F8A; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #234; font-size: 15px; line-height: 1.6;">
                ${escapeHtml(preview)}
              </p>
            </div>
            <p style="color: #777; font-size: 14px;">
              Толық мәтінді көру үшін жеке кабинетіңізге кіріңіз.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Хабарлама email жіберілді: ${toEmail}`);
  } catch (error) {
    console.error('⚠️  Хабарлама email жіберілмеді:', error.message);
  }
};

module.exports = { sendRegistrationEmail, sendStatusChangeEmail, sendApplicantMessageEmail };
