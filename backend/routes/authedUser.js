const express = require('express')
const knex = require('../db/knex')
const asyncRoute = require('../utils/asyncRoute')

const router = express.Router()

// Edit player.short
router.post('/player/short', asyncRoute(async (req, res) => {
  const { short } = req.body
  const playerId = req.session.id

  if (!playerId || typeof short !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  await knex('players')
    .where({ id: playerId })
    .update({ short })

  res.json({ success: true })
}))

// Delete player and log out
router.delete('/player', asyncRoute(async (req, res) => {
  const playerId = req.session.id
  if (!playerId) return res.status(401).json({ error: 'Not authenticated' })

  await knex('players')
    .where({ id: playerId })
    .del()

  await knex('games').update({ board_cache: null })

  req.session.destroy(() => {
    res.json({ success: true })
  })
}))

router.get('/segment-times/:segment_id', asyncRoute(async (req, res) => {
  const playerId = req.session?.id
  const segmentId = req.params.segment_id

  if (!playerId) return res.status(401).json({ error: 'Unauthorized' })

  // Get player's times for the segment
  const times = await knex('segment_times')
    .where({ player_id: playerId, segment_id: segmentId })
    .orderBy('posted_dtm', 'desc')

  // Get segment and game info
  const segment = await knex('segments')
    .leftJoin('games', 'segments.game_id', 'games.id')
    .where('segments.id', segmentId)
    .select(
      'segments.*',
      'games.title as game_title',
      'games.slug as game_slug'
    )
    .first()

  if (!segment) return res.status(404).json({ error: 'Segment not found' })

  res.json({
    segment,
    times,
  })
}))

// Post a new segment_time
router.post('/segment-time', asyncRoute(async (req, res) => {
  const playerId = req.session.id
  const { segment_id, segment_time, vod_url } = req.body

  if (!playerId || !segment_id || !segment_time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  await knex('segment_times').insert({
    player_id: playerId,
    segment_id,
    segment_time,
    vod_url
  })

  await knex('games')
    .where('id', knex('segments').select('game_id').where({ id: segment_id }))
    .update({ board_cache: null })

  res.json({ success: true })
}))

// Delete one of the player's segment_times
router.delete('/segment-time/:id', asyncRoute(async (req, res) => {
  const playerId = req.session.id
  const segmentTimeId = parseInt(req.params.id)

  if (!playerId || isNaN(segmentTimeId)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  await knex('games')
    .where('id', knex('segments')
      .select('game_id')
      .where('id', knex('segment_times')
        .select('segment_id')
        .where({ id: segmentTimeId })
      )
    )
    .update({ board_cache: null })

  const deleted = await knex('segment_times')
    .where({ id: segmentTimeId, player_id: playerId })
    .del()

  if (deleted) {
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'Segment time not found' })
  }
}))

module.exports = router
