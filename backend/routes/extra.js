const express = require('express')
const knex = require('../db/knex')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const { createEvents } = require('ics')

dayjs.extend(utc)
dayjs.extend(timezone)

const router = express.Router()

router.get('/next-event-blurb', async (req, res) => {
  const tz = req.query.timezone

  const [event] = await knex('events')
    .where('end_dtm', '>', knex.fn.now())
    .orderBy('start_dtm', 'asc')
    .limit(1)

  if (!event) {
    return res.type('text/plain').send('No upcoming events.')
  }

  const now = dayjs()
  const start = dayjs(event.start_dtm).tz(tz)

  const diffMins = start.diff(now, 'minute')

  let timeDiffStr = ''

  if (diffMins <= 1) {
    timeDiffStr = 'right now!'
  } else if (diffMins >= 1440) {
    const days = Math.floor(diffMins / 1440)
    timeDiffStr = `in ${days} day${days !== 1 ? 's' : ''}`
  } else if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60)
    timeDiffStr = `in ${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    timeDiffStr = `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`
  }

  const formattedDate = start.format('h:mma [on] dddd MMMM D')

  const text = `Next up on Races Wild: ${event.title} @ ${formattedDate} (${timeDiffStr})`
  res.type('text/plain').send(text)
})


// /calendar
router.get('/calendar', async (req, res) => {
  const now = new Date()

  const past = await knex('events')
    .where('start_dtm', '<', now)
    .orderBy('start_dtm', 'desc')
    .limit(3)

  const future = await knex('events')
    .where('start_dtm', '>=', now)
    .orderBy('start_dtm', 'asc')

  const allEvents = [...past.reverse(), ...future]

  const { error, value } = createEvents(
    allEvents.map(event => {
      const start = new Date(event.start_dtm)
      const end = new Date(event.end_dtm)

      return {
        title: event.title,
        description: event.details || '',
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
        end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
        url: 'https://raceswild.3and3.us'
      }
    })
  )

  if (error) {
    return res.status(500).json({ error: 'Failed to generate calendar' })
  }

  res.setHeader('Content-Type', 'text/calendar')
  res.send(value)
})

module.exports = router
