const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Пайдаланушы схемасы
// Рөлдер: 'applicant' (абитуриент) немесе 'admin'
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Толық атыңызды енгізіңіз'],
      trim: true,
      minlength: [2, 'Аты кемінде 2 таңбадан тұруы керек'],
      maxlength: [100, 'Аты 100 таңбадан аспауы керек'],
    },

    email: {
      type: String,
      required: [true, 'Email енгізіңіз'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Жарамды email мекенжайы енгізіңіз'],
    },

    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [30, 'Телефон нөмірі 30 таңбадан аспауы керек'],
      validate: {
        validator: (value) => !value || /^[0-9+\-()\s]{7,30}$/.test(value),
        message: 'Телефон нөмірін дұрыс енгізіңіз',
      },
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },

    password: {
      type: String,
      required: [true, 'Құпия сөз енгізіңіз'],
      minlength: [6, 'Құпия сөз кемінде 6 таңбадан тұруы керек'],
      // select: false — сұраныс кезінде автоматты түрде қайтармайды
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ['applicant', 'admin'],
        message: 'Рөл applicant немесе admin болуы керек',
      },
      default: 'applicant',
    },

    // Қаладан/облыстан (аналитика үшін)
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'Қала атауы 100 таңбадан аспауы керек'],
      default: '',
    },
  },
  {
    // createdAt және updatedAt өрістерін автоматты қосады
    timestamps: true,
  }
);

// Сақтаудан бұрын құпия сөзді хэштеу (pre-save hook)
userSchema.pre('save', async function (next) {
  // Егер құпия сөз өзгермесе — хэштемейміз
  if (!this.isModified('password')) return next();

  // bcrypt — 12 раунд тұзбен хэштеу
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Кіру кезінде құпия сөзді тексеру әдісі
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// JSON жауабынан құпия сөзді алып тастау
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
