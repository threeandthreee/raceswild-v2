const express = require('express')
const axios = require('axios')
const knex = require('../db/knex')
const asyncRoute = require('../utils/asyncRoute')

const router = express.Router()

// Middleware to restrict access to admins
router.use((req, res, next) => {
  if (!req.session?.is_admin) return res.status(403).json({ error: 'Forbidden' })
  next()
})

function crudRoutes(table, key = 'id') {
  // Create
  router.post(`/admin/${table}`, asyncRoute(async (req, res) => {
    const [inserted] = await knex(table).insert(req.body)
    res.json({ [key]: inserted[key] ?? inserted }) // handle raw return or object
  }))

  // Update
  router.put(`/admin/${table}/:${key}`, asyncRoute(async (req, res) => {
    const keyVal = req.params[key]
    const updated = await knex(table).where({ [key]: keyVal }).update(req.body)
    if (!updated) return res.status(404).json({ error: `${table.slice(0, -1)} not found` })
    res.json({ success: true })
  }))

  // Delete
  router.delete(`/admin/${table}/:${key}`, asyncRoute(async (req, res) => {
    const keyVal = req.params[key]
    const deleted = await knex(table).where({ [key]: keyVal }).del()
    if (!deleted) return res.status(404).json({ error: `${table.slice(0, -1)} not found` })
    res.json({ success: true })
  }))
}

// Apply generic CRUD routes
for (const table of ['events', 'players', 'participations', 'games', 'segments']) {
  crudRoutes(table)
}
crudRoutes('docs', 'slug')

// Delete segment_time
router.delete('/admin/segment-times/:id', asyncRoute(async (req, res) => {
  const { id } = req.params
  await knex('games')
    .where('id', knex('segments')
      .select('game_id')
      .where('id', knex('segment_times')
        .select('segment_id')
        .where({ id })
      )
    )
    .update({ board_cache: null })
  await knex('segment_times').where({ id }).del()
  res.json({ success: true })
}))

// Create player from Twitch username
router.post('/admin/player-from-username', asyncRoute(async (req, res) => {
  const { username } = req.body
  if (!username) return res.status(400).json({ error: 'Missing username' })

  // First, get an app access token
  const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }
  })

  const token = tokenRes.data.access_token

  // Now use that token in the request
  const { data } = await axios.get('https://api.twitch.tv/helix/users', {
    params: { login: username },
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  })

  const user = data.data?.[0]
  if (!user) return res.status(404).json({ error: 'Twitch user not found' })

  const id = user.id
  await knex('players').insert({
    id,
    username: user.login,
    avatar_url: user.profile_image_url
  })

  res.json({ id })
}))


module.exports = router
