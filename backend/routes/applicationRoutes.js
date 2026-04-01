const express = require('express')
const multer = require('multer')
const path = require('path')
const { protect } = require('../middleware/authMiddleware')
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  uploadDocument,
} = require('../controllers/applicationController')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const upload = multer({ storage })

router.get('/', protect, getApplications)
router.post('/', protect, createApplication)
router.get('/:id', protect, getApplication)
router.put('/:id', protect, updateApplication)
router.delete('/:id', protect, deleteApplication)

// Document upload — this is the route that was returning 404
router.post('/:id/documents', protect, upload.single('document'), uploadDocument)

module.exports = router
