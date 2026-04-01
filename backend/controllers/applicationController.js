const path = require('path')
const fs = require('fs')

// In-memory store; replace with DB queries as needed
const applications = []

const getApplications = (req, res) => {
  res.json(applications)
}

const getApplication = (req, res) => {
  const app = applications.find((a) => a.id === req.params.id)
  if (!app) return res.status(404).json({ message: 'Өтінім табылмады' })
  res.json(app)
}

const createApplication = (req, res) => {
  const newApp = { id: Date.now().toString(), ...req.body, documents: [] }
  applications.push(newApp)
  res.status(201).json(newApp)
}

const updateApplication = (req, res) => {
  const idx = applications.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Өтінім табылмады' })
  applications[idx] = { ...applications[idx], ...req.body }
  res.json(applications[idx])
}

const deleteApplication = (req, res) => {
  const idx = applications.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Өтінім табылмады' })
  applications.splice(idx, 1)
  res.json({ message: 'Өтінім жойылды' })
}

const uploadDocument = (req, res) => {
  const app = applications.find((a) => a.id === req.params.id)
  if (!app) return res.status(404).json({ message: 'Өтінім табылмады' })

  if (!req.file) {
    return res.status(400).json({ message: 'Файл жүктелмеді' })
  }

  const document = {
    id: Date.now().toString(),
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
  }

  app.documents = app.documents || []
  app.documents.push(document)

  res.status(201).json(document)
}

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  uploadDocument,
}
