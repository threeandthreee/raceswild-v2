const digest = require('./digest')
const axios = require('axios')

function formatSegmentTime(time, type) {
  let totalSeconds, fractional = '', separator = ''

  switch (type) {
    case 'seconds':
      totalSeconds = time
      break
    case 'centis':
      totalSeconds = Math.floor(time / 100)
      fractional = '.' + (time % 100).toString().padStart(2, '0')
      break
    case 'millis':
      totalSeconds = Math.floor(time / 1000)
      fractional = '.' + (time % 1000).toString().padStart(3, '0')
      break
    case 'frames':
      totalSeconds = Math.floor(time / 60)
      separator = ':' + (time % 60).toString().padStart(2, '0')
      break
    default:
      return time.toString()
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const timeParts = []
  if (hours > 0) timeParts.push(hours)
  if (hours > 0 || minutes > 0) timeParts.push(minutes.toString().padStart(hours > 0 ? 2 : 1, '0'))
  timeParts.push(seconds.toString().padStart((minutes > 0 || hours > 0) ? 2 : 1, '0'))

  return timeParts.join(':') + (separator || fractional)
}

const ordinal = n => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

module.exports = async function digestToDiscord() {
  try {
    const {times, players} = await digest()

    if (!times.length) return

    const lines = times.map(t => {
      let p = players[t.player_id]
      let blurb = `**${p.username}**`
      if (t.tied)
        blurb += " tied"
      else if (t.placement != t.previousPlacement)
        blurb += " took"
      else
        blurb += " improved"
      blurb += ` **${ordinal(t.placement)}** place`
      blurb += ` on **${t.segment_label}** in *${t.game_title}*`
      blurb += ` with a **${formatSegmentTime(t.segment_time, t.timing_type)}**`
      return blurb
    })

    let cursor = 0
    const SIZE = 40
    while (lines.length > cursor) {
      let content = cursor ? '- ' : 'New times posted in the past hour:\n- '
      content += lines.slice(cursor, cursor + SIZE).join('\n- ')
      await axios.post(process.env.DISCORD_WEBHOOK_URL, { content })
      cursor += SIZE
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch(err) { console.log(err) }
}
