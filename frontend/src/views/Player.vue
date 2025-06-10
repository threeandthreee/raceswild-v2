<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="player.username")
      .d-flex.align-center
        v-img.flex-grow-0.mr-4(:src="player.avatar_url" width=50 height=50 style="border-radius:3px")
        v-btn.twitch-btn.flex-grow-0(dark depressed :href="`https://twitch.tv/${player.username}`")
          | twitch.tv/{{player.username}}
        v-spacer.flex-grow-1
      div(v-if="Object.keys(personalBests).length")
        v-divider.my-4
        .text-h4 Personal Bests
        v-card.my-2(v-for="(runs, title) in personalBests" variant="text")
          v-card-title
            v-btn.ml-n4(variant="text" color="primary" :to="`/leaderboard/${runs[0].game_slug}`") {{title}}
          v-card-text.ml-4
            div(v-for="run in runs")
              .text-body-1 {{run.label}} -&nbsp;
                a(v-if="run.vod_url" :href="run.vod_url") {{formatSegmentTime(run.segment_time, run.timing_type)}}
                span(v-else) {{formatSegmentTime(run.segment_time, run.timing_type)}}
    div(v-else) not found
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import { formatSegmentTime } from '@/utils/formatting'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import LoginStatus from '@/components/LoginStatus.vue'

const route = useRoute()
const username = route.params.username

const breadcrumbItems = [
  { label: "Players", url: "/players" },
  { label: username }
]

const loading = ref(true)
const player = ref({})
const login = ref({})
const newData = ref({})
const personalBests = ref({})

onMounted(async () => {
  await api.get('/whoami').then(response => {
    login.value = response.data
  })
  api.get(`/player/${username}`).then(response => {
    player.value = response.data
    response.data.runs.forEach(run => {
      if (!(run.game_title in personalBests.value))
        personalBests.value[run.game_title] = []
      personalBests.value[run.game_title].push(run)
    })
  }).finally(() => {
    loading.value = false
  })
})
</script>
