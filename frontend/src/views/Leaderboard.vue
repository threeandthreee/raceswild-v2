<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="game.board_layout")
      .text-overline.mt-n2(v-if="game.pre_title") {{game.pre_title}}
      .text-h3 {{game.title}}
      .text-overline.mb-n2(v-if="game.post_title") {{game.post_title}}
      .mt-8(v-for="item in boardData")
        leaderboard-segments(:layout="item" :data="data")
    div(v-else) not found
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import LeaderboardSegments from '@/components/LeaderboardSegments.vue'
import LoginStatus from '@/components/LoginStatus.vue'
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()
const route = useRoute()
const slug = route.params.slug

const breadcrumbItems = computed(() => [
  { label: smAndDown.value ? "LB" : "Leaderboard", url: "/leaderboard" },
  { label: slug }
])

const loading = ref(true)
const login = ref({})
const game = ref({})
const data = ref({})
const boardData = ref([])

onMounted(async () => {
  try {
    await api.get('/whoami').then(response => {
      login.value = response.data
    })
    await api.get(`/game/${slug}`).then(response => {
      game.value = response.data
    })
    await api.get(`/leaderboard/${game.value.id}`).then(response => {
      data.value = response.data
    })
    boardData.value = processData(game.value.board_layout, data.value)
  } catch(err) {console.log(err)}
  loading.value = false
})

const typeVals = {
  "seconds": 1,
  "frames": 60,
  "centis": 100,
  "millis": 1000
}
const convTime = (time, from, to) => {
  if(from == to) return time
  return time * typeVals[to] / typeVals[from]
}

const processData = (input, context) => {
  if (Array.isArray(input))
    return input.map(it => processData(it, context))

  if (input.segments)
    input.segments = input.segments.map(it => processData(it, context))

  if (input.type == 'total') {
    let totalled = input.segments.reduce((acc, segment) => {
      let segment_data = segment.type ? segment : context.segments.find(s => s.id == segment)
      segment_data.segment_times.forEach(time => {
        if (!(time.player_id in acc))
          acc[time.player_id] = {
            player_id: time.player_id,
            segment_time: input.base_time || 0,
            segment_count: 0
          }
        acc[time.player_id].segment_time += convTime(time.segment_time, segment_data.timing_type, input.timing_type)
        acc[time.player_id].segment_count += 1
      })
      return acc
    }, {})

    let sorted = Object.values(totalled)
      .sort((a, b) => input.timing_inverted ? b.segment_time - a.segment_time : a.segment_time - b.segment_time)
      .filter(it => input.include_partials || it.segment_count == input.segments.length)

    let position = 1
    for (let i = 0; i < sorted.length; i++) {
      if (i>0 && sorted[i].segment_time === sorted[i-1].segment_time)
        sorted[i].position = sorted[i-1].position
      else
        sorted[i].position = position
      position++
    }
    console.log('total', input.segments[0], sorted)
    input.segment_times = sorted
  }

  if (input.type == 'best') {
    let normalized = input.segments.reduce((acc, segment) => {
      let segment_data = segment.type ? segment : context.segments.find(s => s.id == segment)
      segment_data.segment_times.forEach(time => {
        if (!(time.player_id in acc))
          acc[time.player_id] = {
            player_id: time.player_id,
            segment_time: convTime(time.segment_time, segment_data.timing_type, input.timing_type)
          }
        else if (
          time.segment_time && (
            !acc[time.player_id] ||
            (input.timing_inverted && (time.segment_time > acc[time.player_id].segment_time)) ||
            (!input.timing_inverted && (time.segment_time < acc[time.player_id].segment_time))
          )
        )
          acc[time.player_id].segment_time = time.segment_time
      })
      return acc
    }, {})
    let sorted = Object.values(normalized)
      .sort((a, b) => input.timing_inverted ? b.segment_time - a.segment_time : a.segment_time - b.segment_time)
      .filter(it => it.segment_time)

    let position = 1
    for (let i = 0; i < sorted.length; i++) {
      if (i>0 && sorted[i].segment_time === sorted[i-1].segment_time)
        sorted[i].position = sorted[i-1].position
      else
        sorted[i].position = position
      position++
    }
    console.log('best', input.segments[0], sorted)
    input.segment_times = sorted
  }

  return input
}
</script>
