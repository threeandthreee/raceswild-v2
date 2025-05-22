const express = require('express')
const knex = require('../db/knex')
const asyncRoute = require('../utils/asyncRoute')
const dayjs = require('dayjs')

const router = express.Router()

router.get('/upcoming-events', asyncRoute(async (req, res) => {
  const events = await knex('events')
    .where('end_dtm', '>', knex.raw('NOW()'))
    .orderBy('start_dtm', 'asc')
  res.json(events)
}))

router.get('/events', asyncRoute(async (req, res) => {
  const events = await knex('events').orderBy('start_dtm', 'asc')
  res.json(events)
}))

router.get('/players', asyncRoute(async (req, res) => {
  const players = await knex('players')
    .leftJoin('participations', 'players.id', 'participations.player_id')
    .groupBy('players.id')
    .select(
      'players.id',
      'players.username',
      'players.short',
      'players.avatar_url',
      knex.raw('COUNT(participations.id) AS participations'),
      knex.raw(`COUNT(CASE WHEN participation_level IN ('won', 'raced') THEN 1 END) AS races`),
      knex.raw(`COUNT(CASE WHEN participation_level = 'won' THEN 1 END) AS wins`)
    )
    .orderBy('participations', 'desc')

  res.json(players)
}))

router.get('/games', asyncRoute(async (req, res) => {
  const games = await knex('games').select('id', 'title', 'slug', 'has_leaderboard', 'board_layout')
  res.json(games)
}))

router.get('/docs', asyncRoute(async (req, res) => {
  const docs = await knex('docs').select('slug')
  res.json(docs)
}))

router.get('/next-event', asyncRoute(async (req, res) => {
  const [event] = await knex('events')
    .where('end_dtm', '>', knex.raw('NOW()'))
    .orderBy('start_dtm', 'asc')
    .limit(1)

  if (!event) return res.status(404).json({ error: 'No upcoming event' })

  const participations = await knex('participations as p')
    .join('players as pl', 'p.player_id', 'pl.id')
    .where('p.event_id', event.id)
    .select('p.*', 'pl.username', 'pl.short', 'pl.avatar_url')

  event.participations = participations

  res.json(event)
}))

router.get('/event/:id', asyncRoute(async (req, res) => {
  const { id } = req.params

  const [event] = await knex('events')
    .where('id', id)
    .orderBy('start_dtm')
    .limit(1)

  if (!event) return res.status(404).json({ error: 'Event not found' })

  const participations = await knex('participations as p')
    .join('players as pl', 'p.player_id', 'pl.id')
    .where('p.event_id', event.id)
    .select('p.*', 'pl.username', 'pl.short', 'pl.avatar_url')

  event.participations = participations

  res.json(event)
}))

router.get('/event/:yyyy/:mm/:dd', asyncRoute(async (req, res) => {
  const { yyyy, mm, dd } = req.params

  const requestedDate = dayjs(`${yyyy}-${mm}-${dd}`)
  if (!requestedDate.isValid()) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  const fromDate = requestedDate.subtract(1, 'day').format('YYYY-MM-DD')
  const toDate = requestedDate.add(1, 'day').format('YYYY-MM-DD')

  const events = await knex('events')
    .whereBetween(knex.raw('DATE(start_dtm)'), [fromDate, toDate])
    .orderBy('start_dtm')

  if (!events.length) return res.status(404).json({ error: 'Event not found' })

  // Find event with the smallest time diff from requested date
  const closest = events.reduce((prev, curr) => {
    const prevDiff = Math.abs(dayjs(prev.start_dtm).diff(requestedDate))
    const currDiff = Math.abs(dayjs(curr.start_dtm).diff(requestedDate))
    return currDiff < prevDiff ? curr : prev
  })

  const participations = await knex('participations as p')
    .join('players as pl', 'p.player_id', 'pl.id')
    .where('p.event_id', closest.id)
    .select('p.*', 'pl.username', 'pl.short', 'pl.avatar_url')

  closest.participations = participations

  res.json(closest)
}))

router.get('/player/:username', asyncRoute(async (req, res) => {
  const { username } = req.params

  const [player] = await knex('players')
    .where('username', username)
    .select('id', 'username', 'short', 'avatar_url')

  if (!player) return res.status(404).json({ error: 'Player not found' })

  const participations = await knex('participations as p')
    .join('events as e', 'p.event_id', 'e.id')
    .where('p.player_id', player.id)
    .select('p.*', 'e.title', 'e.start_dtm')

  player.participations = participations

  const runsRaw = await knex
    .select('st.*', 's.label', 'g.title as game_title', 'g.slug as game_slug')
    .from('segment_times as st')
    .join('segments as s', 'st.segment_id', 's.id')
    .join('games as g', 's.game_id', 'g.id')
    .where('st.player_id', player.id)
    .andWhere('s.is_full_run', true)
    .orderBy('st.posted_dtm', 'desc')

  // Deduplicate by segment_id, keeping the latest
  const seen = new Set()
  const runs = []
  for (const run of runsRaw) {
    if (!seen.has(run.segment_id)) {
      seen.add(run.segment_id)
      runs.push(run)
    }
  }

  player.runs = runs

  res.json(player)
}))

router.get('/game/:slug', asyncRoute(async (req, res) => {
  const { slug } = req.params
  const [game] = await knex('games').where({ slug }).select('id', 'title', 'slug', 'has_leaderboard', 'board_layout')
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(game)
}))

router.get('/doc/:slug', asyncRoute(async (req, res) => {
  const { slug } = req.params
  const [doc] = await knex('docs').where({ slug })
  if (!doc) return res.status(404).json({ error: 'Doc not found' })
  res.json(doc)
}))

// GET /segments/:id (where :id is a game_id)
router.get('/segments/:id', asyncRoute(async (req, res) => {
  const { id } = req.params
  const segments = await knex('segments').where({ game_id: id })
  res.json(segments)
}))


function extractSegmentIds(layout) {
  const segmentIds = []

  function recurse(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(recurse)
    } else if (obj && typeof obj === 'object') {
      if ('segments' in obj && Array.isArray(obj.segments)) {
        for (const item of obj.segments) {
          if (typeof item === 'number') {
            segmentIds.push(item)
          } else if (typeof item === 'object') {
            recurse(item)
          }
        }
      } else {
        Object.values(obj).forEach(recurse)
      }
    }
  }

  recurse(layout)
  return segmentIds
}

router.get('/leaderboard/:id', asyncRoute(async (req, res) => {
  const gameId = req.params.id

  const game = await knex('games')
    .where({ id: gameId })
    .first()

  if (!game) return res.status(404).json({ error: 'Game not found' })

  if (game.board_cache) {
    return res.json(game.board_cache)
  }

  const layout = game.board_layout
  if (!layout) return res.status(400).json({ error: 'Game has no board layout' })

  const segmentIds = extractSegmentIds(layout)
  if (segmentIds.length === 0) return res.status(400).json({ error: 'No segments found in layout' })

  const segments = await knex('segments')
    .whereIn('id', segmentIds)

  for (const segment of segments) {
    // Get all times for this segment
    const times = await knex('segment_times')
      .where({ segment_id: segment.id })

    // Sort based on timing direction
    times.sort((a, b) => {
      return segment.timing_inverted
        ? b.segment_time - a.segment_time
        : a.segment_time - b.segment_time
    })

    // Keep only the best time per player
    const seenPlayers = new Set()
    const filtered = []
    for (const time of times) {
      if (!seenPlayers.has(time.player_id)) {
        filtered.push(time)
        seenPlayers.add(time.player_id)
      }
    }

    // Assign position with proper tie handling
    let position = 1
    let actualRank = 1
    for (let i = 0; i < filtered.length; i++) {
      if (i > 0 && filtered[i].segment_time !== filtered[i - 1].segment_time) {
        position = actualRank
      }
      filtered[i].position = position
      actualRank++
    }

    segment.segment_times = filtered
  }

  const playerIds = new Set()
  for (const segment of segments) {
    for (const st of segment.segment_times) {
      playerIds.add(st.player_id)
    }
  }

  const players = {}
  if (playerIds.size > 0) {
    const found = await knex('players')
      .whereIn('id', Array.from(playerIds))
      .select('id', 'username', 'avatar_url', 'short')
    for (const p of found) {
      players[p.id] = p
    }
  }

  const boardCache = { segments, players }

  await knex('games')
    .where({ id: gameId })
    .update({ board_cache: JSON.stringify(boardCache) })

  res.json(boardCache)
}))


module.exports = router
