<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="game.has_leaderboard")
      .text-h3 {{game.title}}
      .mt-8(v-for="item in game.board_layout")
        leaderboard-segments(:layout="item" :data="data")
      div(v-if="login?.player")
        v-divider.my-8
        v-card(variant="outlined")
          v-card-title Manage your segment times
          v-card-text
            v-autocomplete(
              :items="data.segments"
              label="Segment"
              variant="outlined"
              v-model="addSegmentData.id"
              item-title="label"
              item-value="id"
              clearable
            )
            div(v-if="segmentSelection")
              v-form.d-flex(ref="addSegmentForm")
                v-text-field(label="Hours" variant="outlined" v-model="addSegmentData.hours" type="number" :rules="[onlyInts, minZero]")
                v-text-field(label="Minutes" variant="outlined" v-model="addSegmentData.minutes" type="number" :rules="[onlyInts, minZero, max59]")
                v-text-field(label="Seconds" variant="outlined" v-model="addSegmentData.seconds" type="number" :rules="[onlyInts, minZero, max59]")
                v-text-field(label="Hundredths" variant="outlined" v-model="addSegmentData.centis" type="number" :rules="[onlyInts, minZero, max99]" v-if="segmentSelection.timing_type == 'centis'")
                v-text-field(label="Thousandths" variant="outlined" v-model="addSegmentData.millis" type="number" :rules="[onlyInts, minZero, max999]" v-if="segmentSelection.timing_type == 'millis'")
                v-text-field(label="Frames" variant="outlined" v-model="addSegmentData.frames" type="number" :rules="[onlyInts, minZero, max59]" v-if="segmentSelection.timing_type == 'frames'")
              v-text-field(label="Vod Url" variant="outlined" v-model="addSegmentData.vod_url")
              v-btn(variant="outlined" @click="addSegmentSubmit") Submit (refresh to see it)
              v-divider.my-4
              .text-h6 Your submitted times
              .text-caption (you can't edit, delete and resubmit if you must)
              .d-flex.align-center(v-for="time in segmentSelection.segment_times.filter(it => !deletedSegmentsToHide.includes(it.id))")
                span.mx-2 {{ formatSegmentTime(time.segment_time, segmentSelection.timing_type) }}
                a.mx-2(v-if="time.vod_url" :href="time.vod_url") VOD
                span.mx-2 {{ formatTimestamp(time.posted_dtm, 'MMM D, YYYY') }}
                v-btn.mx-2(variant="outlined" @click="deleteSegmentSubmit(time.id)")
                  v-icon mdi-delete
                  | {{confirmedDeletes.includes(time.id) ? 'Are you sure?' : 'Delete'}}
    div(v-else) not found
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import { formatSegmentTime, formatTimestamp } from '@/utils/formatting'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import LeaderboardSegments from '@/components/LeaderboardSegments.vue'
import LoginStatus from '@/components/LoginStatus.vue'

const route = useRoute()
const slug = route.params.slug

const breadcrumbItems = [
  { label: "Leaderboard", url: "/leaderboard" },
  { label: slug }
]

const loading = ref(true)
const game = ref({})
const data = ref({})
const login = ref({})

const addSegmentData = ref({})
const segmentSelection = computed(() => data.value.segments.find(it => it.id == addSegmentData.value.id))
const addSegmentForm = ref()

const addSegmentSubmit = async () => {
  const validation = await addSegmentForm.value.validate()
  if (!validation.valid) return
  let add = addSegmentData.value
  let type = segmentSelection.value.timing_type

  let time = 0
  if (add.hours) time += add.hours * 3600
  if (add.minutes) time += add.minutes * 60
  if (add.seconds) time += +add.seconds
  console.log(time)
  console.log(type)
  if (type == 'centis') {
    time *= 100
    if (add.centis) time += +add.centis
  } else if (type == 'millis') {
    time *= 1000
    if (add.millis) time += +add.millis
  } else if (type == 'frames') {
    console.log('frames')
    time *= 60
    if (add.frames) time += +add.frames
  }
  console.log(time)
  await api.post('/segment-time', {
    segment_id: add.id,
    segment_time: time,
    vod_url: add.vod_url
  })
  addSegmentData.value = {}
}

const deleteSegmentSubmit = async (id) => {
  if(confirmedDeletes.value.includes(id)){
    await api.delete(`/segment-time/${id}`)
    deletedSegmentsToHide.value.push(id)
  } else {
    confirmedDeletes.value.push(id)
  }
}

const deletedSegmentsToHide = ref([])
const confirmedDeletes = ref([])

onMounted(async () => {
  try {
    await api.get('/whoami').then(response => {
      console.log(response.data)
      login.value = response.data
    })
    await api.get(`/game/${slug}`).then(response => {
      game.value = response.data
    })
    await api.get(`/leaderboard/${game.value.id}`).then(response => {
      data.value = response.data
    })
  } catch {}
  loading.value = false
})

const onlyInts = value => !value || value == Math.ceil(value)
const minZero = value => !value || value >= 0
const max59 = value => !value || value <= 59
const max99 = value => !value || value <= 99
const max999 = value => !value || value <= 999
</script>