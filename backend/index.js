require('dotenv').config({path: '.env.local'})
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const knex = require('./db/knex')

const authRoutes = require('./routes/auth')
const publicRoutes = require('./routes/public')
const extraRoutes = require('./routes/extra')
const authedUserRoutes = require('./routes/authedUser')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use(async (req, res, next) => {
  const sessionId = req.cookies?.session
  if (!sessionId) return next()

  const player = await knex('players').where({ session_id: sessionId }).first()
  if (player) req.session = player

  next()
})

app.use(authRoutes)
app.use(publicRoutes)
app.use(extraRoutes)
app.use(authedUserRoutes)
app.use(adminRoutes)

app.use((err, req, res, next) => {
  console.error(err) // Log to console or file
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
