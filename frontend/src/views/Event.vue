<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
  div(v-if="!loading")
    div(v-if="event.id")
      .text-h3.text-sm.h2 {{event.title}}
      .text-h5.text-sm.h4 {{dateStr}}
      .text-body-1.mt-2(v-if="event.details") {{event.details}}
      v-divider.my-5
      v-btn.mt-n4.mb-2(variant="icon" size="x-large" v-if="event.vod_url" :href="event.vod_url")
        v-icon.ml-n2.mr-3(size="50" color="red") mdi-youtube
        | {{event.vod_url}}
      v-card(variant="text" v-if="event.participations.length")
        v-card-text
          v-card.mb-4(variant="text" v-for="player in event.participations" :to="`/player/${player.username}`" :class="{winner: revealWinner && player.participation_level == 'won'}")
            .d-flex.align-center
              v-img.flex-grow-0(:src="player.avatar_url" width=50 height=50)
              .text-body-1.ml-4 {{player.username}}
              v-spacer
        v-card-actions
          v-checkbox(label="Reveal Results" v-model="revealWinner")
    div(v-else) not found
</template>

<script setup>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const route = useRoute()

const breadcrumbItems = [
  { label: "Event", url: "/archive" },
  { label: `${route.params.year}/${route.params.month}/${route.params.day}` }
]

const loading = ref(true)
const event = ref({})
const dateStr = ref('')
const revealWinner = ref(false)

onMounted(async () => {
  api.get(`/event/${route.params.year}/${route.params.month}/${route.params.day}`).then(response => {
    let tmp = response.data
    if (tmp.participations && tmp.participations.length)
      tmp.participations.sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }));
    event.value = tmp
    const date = dayjs(event.value.start_dtm)
    dateStr.value = `${date.format('dddd, MMM D @ hA')} (${date.fromNow()})`
  }).finally(() => {
    loading.value = false
  })
})
</script>

<style>
.winner {
  outline: 1px solid gold;
}
</style>
