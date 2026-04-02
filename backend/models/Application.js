const mongoose = require('mongoose');

// Өтінім схемасы
// Статустар: 'күтілуде' | 'қабылданды' | 'қабылданбады'
const applicationSchema = new mongoose.Schema(
  {
    // Өтінім берген абитуриент (User-ге сілтеме)
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Өтінім иесі міндетті'],
    },

    // Факультет атауы
    faculty: {
      type: String,
      required: [true, 'Факультетті таңдаңыз'],
      trim: true,
      maxlength: [150, 'Факультет атауы 150 таңбадан аспауы керек'],
    },

    // Мамандық
    speciality: {
      type: String,
      required: [true, 'Мамандықты енгізіңіз'],
      trim: true,
      maxlength: [150, 'Мамандық атауы 150 таңбадан аспауы керек'],
    },

    // ҰБТ балы (0–140 аралығында)
    entExamScore: {
      type: Number,
      required: [true, 'ҰБТ балын енгізіңіз'],
      min: [0, 'Бал 0-ден аз болмауы керек'],
      max: [140, 'Бал 140-тан аспауы керек'],
    },

    // Оқу түрі
    studyType: {
      type: String,
      enum: {
        values: ['күндізгі', 'сырттай', 'кешкі'],
        message: 'Оқу түрі дұрыс емес',
      },
      required: [true, 'Оқу түрін таңдаңыз'],
    },

    // Қаржыландыру түрі
    fundingType: {
      type: String,
      enum: {
        values: ['грант', 'ақылы'],
        message: 'Қаржыландыру түрі дұрыс емес',
      },
      required: [true, 'Қаржыландыру түрін таңдаңыз'],
    },

    // Өтінім статусы
    status: {
      type: String,
      enum: {
        values: ['күтілуде', 'қабылданды', 'қабылданбады'],
        message: "Статус 'күтілуде', 'қабылданды' немесе 'қабылданбады' болуы керек",
      },
      default: 'күтілуде',
    },

    // Таңдау басымдылығы (1 — бірінші таңдау, 2 — екінші, т.б.)
    priority: {
      type: Number,
      min: [1, 'Басымдылық 1-ден кем болмауы керек'],
      max: [5, 'Басымдылық 5-тен артық болмауы керек'],
      default: 1,
    },

    birthDate: {
      type: Date,
      required: [true, 'Туған күнді енгізіңіз'],
    },

    citizenship: {
      type: String,
      enum: {
        values: ['kazakhstan', 'other'],
        message: 'Азаматтық мәні дұрыс емес',
      },
      required: [true, 'Азаматтықты таңдаңыз'],
    },

    gender: {
      type: String,
      enum: {
        values: ['male', 'female'],
        message: 'Жыныс мәні дұрыс емес',
      },
      required: [true, 'Жынысты таңдаңыз'],
    },

    address: {
      type: String,
      required: [true, 'Мекенжайды енгізіңіз'],
      trim: true,
      maxlength: [300, 'Мекенжай 300 таңбадан аспауы керек'],
    },

    schoolName: {
      type: String,
      required: [true, 'Мектеп немесе колледж атауын енгізіңіз'],
      trim: true,
      maxlength: [200, 'Оқу орны атауы 200 таңбадан аспауы керек'],
    },

    graduationYear: {
      type: Number,
      required: [true, 'Бітірген жылды таңдаңыз'],
      enum: {
        values: [2020, 2021, 2022, 2023, 2024, 2025],
        message: 'Бітірген жыл 2020-2025 аралығында болуы керек',
      },
    },

    gpa: {
      type: Number,
      required: [true, 'GPA мәнін енгізіңіз'],
      min: [0, 'GPA 0-ден кем болмауы керек'],
      max: [5, 'GPA 5-тен аспауы керек'],
    },

    certificates: {
      ielts: {
        enabled: { type: Boolean, default: false },
        score: {
          type: Number,
          min: [0, 'IELTS балы 0-ден кем болмауы керек'],
          max: [9, 'IELTS балы 9-дан аспауы керек'],
          default: null,
        },
      },
      toefl: {
        enabled: { type: Boolean, default: false },
        score: {
          type: Number,
          min: [0, 'TOEFL балы 0-ден кем болмауы керек'],
          default: null,
        },
      },
      olympiad: {
        enabled: { type: Boolean, default: false },
        level: {
          type: String,
          enum: {
            values: ['', 'international', 'national', 'regional'],
            message: 'Олимпиада деңгейі дұрыс емес',
          },
          default: '',
        },
      },
      sports: {
        enabled: { type: Boolean, default: false },
      },
      other: {
        enabled: { type: Boolean, default: false },
      },
    },

    // Админ қалдырған ескертпе (қосымша)
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Ескертпе 500 таңбадан аспауы керек'],
      default: '',
    },

    // Статус өзгеру тарихы
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['күтілуде', 'қабылданды', 'қабылданбады'],
          required: true,
        },
        oldStatus: {
          type: String,
          enum: ['күтілуде', 'қабылданды', 'қабылданбады', null],
          default: null,
        },
        newStatus: {
          type: String,
          enum: ['күтілуде', 'қабылданды', 'қабылданбады'],
        },
        adminNote: { type: String, default: '' },
        changedAt:  { type: Date, default: Date.now },
        changedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByRole: {
          type: String,
          enum: ['applicant', 'admin'],
          default: 'admin',
        },
      },
    ],

    // Жүктелген құжаттар тізімі
    documents: [
      {
        // Құжат атауы (мысалы: "Жеке куәлік", "Аттестат")
        name: {
          type: String,
          required: true,
          trim: true,
        },
        slotKey: {
          type: String,
          trim: true,
          default: '',
        },
        originalName: {
          type: String,
          trim: true,
          default: '',
        },
        fileName: {
          type: String,
          trim: true,
          default: '',
        },
        mimeType: {
          type: String,
          trim: true,
          default: '',
        },
        size: {
          type: Number,
          default: 0,
        },
        // Файлдың URL мекенжайы (серверде сақталатын жол)
        url: {
          type: String,
          required: true,
        },
        // Жүктелген уақыты
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Бір абитуриент бір мамандыққа тек бір рет өтінім бере алады
applicationSchema.index({ applicant: 1, speciality: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
