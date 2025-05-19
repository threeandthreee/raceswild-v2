import dayjs from 'dayjs'

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


const formatTimestamp = (timestamp, format) => dayjs(timestamp).format(format)

export {
  formatSegmentTime,
  formatTimestamp
}