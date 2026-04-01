const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const applicationRoutes = require('./routes/applicationRoutes')

const app = express()

app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API routes
app.use('/api/applications', applicationRoutes)

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут табылмады' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Сервер ${PORT} портта іске қосылды`)
})

module.exports = app
