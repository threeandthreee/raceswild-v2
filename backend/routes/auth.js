const express = require('express')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const knex = require('../db/knex')
const asyncRoute = require('../utils/asyncRoute')

const router = express.Router()

// GET /login
router.get('/login', (req, res) => {
  const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code`
  res.redirect(redirectUrl)
})

router.get('/auth', asyncRoute(async (req, res) => {
  const code = req.query.code
  if (!code) return res.status(400).json({ error: 'Missing code' })

  try {
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      },
    })

    const { access_token, refresh_token, expires_in } = tokenRes.data

    const userRes = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
      },
    })

    const user = userRes.data.data[0]
    const expiry = new Date(Date.now() + expires_in * 1000)

    const player = await knex('players').where({ id: user.id }).first()

    let sessionId = player.session_id || uuidv4()

    await knex('players')
      .insert({
        id: user.id,
        username: user.display_name,
        avatar_url: user.profile_image_url,
        session_id: sessionId,
      })
      .onConflict('id')
      .merge({ username: user.display_name, avatar_url: user.profile_image_url, session_id: sessionId })

    await knex('oauth_tokens')
      .insert({
        player_id: user.id,
        access_token,
        refresh_token,
        expires_at: expiry,
      })
      .onConflict('player_id')
      .merge({ access_token, refresh_token, expires_at: expiry })

    res.redirect(`${process.env.FRONTEND_ORIGIN}?token=${sessionId}`)
  } catch (err) {
    console.error(err.response?.data || err)
    res.status(500).json({ error: 'OAuth failed' })
  }
}))


// POST /logout
router.post('/logout', asyncRoute(async (req, res) => {
  if (!req.sessionId) return res.status(401).json({ error: 'No session' })

  await knex('players').where({ session_id: req.sessionId }).update({ session_id: null })
  res.clearCookie('session')
  res.json({ success: true })
}))

router.get('/whoami', async (req, res) => {
  if (!req.sessionId) return res.json({ loggedIn: false })

  const [player] = await knex('players')
    .where({ session_id: req.sessionId })
    .select('id', 'username', 'short', 'is_admin', 'avatar_url')
  if (!player) return res.json({ loggedIn: false })

  res.json({
    loggedIn: true,
    player
  })
})


module.exports = router
