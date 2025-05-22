<template lang="pug">
v-container(style="max-width:600px")
  .text-overline Next Up
  v-card(v-if="data.upcoming && data.upcoming.length" variant="text" :to="getEventPath(data.upcoming[0])")
    .text-h3.text-sm-h2 {{data.upcoming[0].title}}
    .text-h5.text-sm-h4 {{data.dateStr}}
  .d-flex.flex-column.mt-8
    v-btn.my-2.twitch-btn(dark depressed size="x-large" href="https://twitch.tv/acebreakerultra")
      v-icon.mr-2(size="x-large") mdi-twitch
      | Watch Live
    v-btn.my-2.youtube-btn(dark depressed size="x-large" href="https://youtube.com/@raceswild")
      v-icon.mr-2(size="x-large") mdi-youtube
      | Race VODs
    v-btn.my-2.discord-btn(dark depressed size="x-large" href="https://discord.gg/V7caHdC8r3")
      //v-icon.mr-2(size="x-large") mdi-discord
      | Discord Community
    v-btn.my-2(size="x-large" :href="calendarUrl")
      v-icon.mr-2(size="x-large") mdi-calendar
      | ICS Calendar
  v-divider.mt-8
  .d-flex.justify-space-between.flex-column.flex-sm-row.align-center
    v-btn(size="x-large" variant="text" width="33%" color="primary" to="/archive") Archive
    v-divider(vertical)
    v-btn(size="x-large" variant="text" width="33%" color="primary" to="/leaderboard") Leaderboard
    v-divider(vertical)
    v-btn(size="x-large" variant="text" width="33%" color="primary" to="/players") Players
  v-divider.mb-8
  .text-overline Upcoming
  div
    v-card.pa-2.ma-1(
      v-for="event in data.upcoming"
      :key="event.id"
      variant="flat"
      :to="getEventPath(event)"
    )
      .d-flex.align-center
        div(style="width:80px")
          v-chip.mr-2.flex-shrink-0(color="primary") {{formatEventDate(event)}}
        span {{event.title}}
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const calendarUrl = `${import.meta.env.VITE_API_URL}/calendar`
const data = ref({})

const getEventPath = event => `/event/${dayjs(event.start_dtm).format('YYYY/MM/DD')}`
const formatEventDate = event => dayjs(event.start_dtm).format('MMM D')

onMounted(async () => {
  data.value.upcoming = (await api.get('/upcoming-events')).data

  const date = dayjs(data.value.upcoming[0].start_dtm)
  data.value.dateStr = `${date.format('dddd, MMM D @ hA')} (${date.fromNow()})`
})
</script>
