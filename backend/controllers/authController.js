const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
// Email хабарлама сервисі
const { sendRegistrationEmail } = require('../services/emailService');

// ─────────────────────────────────────────────
// JWT токен генерациялау көмекші функциясы
// ─────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const ensureAvatarUploadDir = () => {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureAvatarUploadDir());
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${extension}`);
  },
});

const avatarFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Аватар үшін тек JPG, PNG немесе WEBP файлын жүктеуге болады'));
};

const avatarUploadMiddleware = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('avatar');

const removeStoredFile = (relativeUrl = '') => {
  if (!relativeUrl) {
    return;
  }

  const normalizedPath = relativeUrl.replace(/^\/+/, '');
  const filePath = path.join(__dirname, '..', normalizedPath);
  fs.unlink(filePath, () => {});
};

const buildPublicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  city: user.city,
  avatarUrl: user.avatarUrl || '',
  createdAt: user.createdAt,
});

const parseBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

// ─────────────────────────────────────────────
// @desc    Жаңа пайдаланушыны тіркеу
// @route   POST /api/auth/register
// @access  Ашық (Public)
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, city, phone } = req.body;

    // Міндетті өрістерді тексеру
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Аты, email және құпия сөз міндетті өрістер.',
      });
    }

    // Email бұрыннан бар-жоқтығын тексеру
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Бұл email-мен пайдаланушы бұрыннан тіркелген.',
      });
    }

    // Жаңа пайдаланушы жасау
    const newUser = await User.create({
      fullName,
      email,
      password,
      city: city ? city.trim() : '',
      phone: phone ? phone.trim() : '',
      role: role === 'admin' ? 'applicant' : (role || 'applicant'),
    });

    // Токен генерациялау
    const token = generateToken(newUser._id);

    // Тіркелу сәтті өткенде email жіберу (try/catch ішінде — қате болса тоқтамайды)
    await sendRegistrationEmail(newUser.email, newUser.fullName);

    res.status(201).json({
      success: true,
      message: 'Тіркелу сәтті аяқталды!',
      token,
      user: buildPublicUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Жүйеге кіру
// @route   POST /api/auth/login
// @access  Ашық (Public)
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Міндетті өрістерді тексеру
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email және құпия сөз енгізіңіз.',
      });
    }

    // Пайдаланушыны табу (select: false болғандықтан құпия сөзді қосамыз)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email немесе құпия сөз қате.',
      });
    }

    // Құпия сөзді тексеру
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email немесе құпия сөз қате.',
      });
    }

    // Токен генерациялау
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Жүйеге сәтті кірдіңіз!',
      token,
      user: buildPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Ағымдағы пайдаланушы туралы ақпарат
// @route   GET /api/auth/me
// @access  Жабық (Protected)
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user — protect мидлвэрі арқылы орнатылған
    res.status(200).json({
      success: true,
      user: buildPublicUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({
        success: false,
        message: 'Пайдаланушы табылмады.',
      });
    }

    const { fullName, phone, city, currentPassword, newPassword } = req.body;
    const shouldRemoveAvatar = parseBoolean(req.body.removeAvatar);

    if (fullName !== undefined) {
      user.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (city !== undefined) {
      user.city = city.trim();
    }

    if (newPassword || currentPassword) {
      if (!currentPassword || !newPassword) {
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
          success: false,
          message: 'Құпия сөзді өзгерту үшін ағымдағы және жаңа құпия сөзді енгізіңіз.',
        });
      }

      const isPasswordCorrect = await user.comparePassword(currentPassword);
      if (!isPasswordCorrect) {
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
          success: false,
          message: 'Ағымдағы құпия сөз қате.',
        });
      }

      user.password = newPassword;
    }

    if (shouldRemoveAvatar && user.avatarUrl) {
      removeStoredFile(user.avatarUrl);
      user.avatarUrl = '';
    }

    if (req.file) {
      if (user.avatarUrl) {
        removeStoredFile(user.avatarUrl);
      }
      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Профиль сәтті жаңартылды.',
      user: buildPublicUser(user),
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  avatarUploadMiddleware,
};
