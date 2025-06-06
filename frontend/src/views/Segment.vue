<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="!login?.player")
      .text-body1 Log in to submit a time.
    div(v-if="data.segment")
      .text-h3 {{data.segment.game_title}}
      .text-h4 {{data.segment.label}}
      .text-caption(v-if="data.segment.notes") {{data.segment.notes}}
      .mb-4
      v-card
        v-card-title Submit a {{data.segment.timing_type != 'count' ? 'time' : 'score'}}
        v-card-text
          v-form.d-flex(ref="addSegmentForm")
            v-text-field(label="Hours" variant="outlined" v-model="addSegmentData.hours" type="number" :rules="[onlyInts, minZero]" v-if="data.segment.timing_type != 'count'")
            v-text-field(label="Minutes" variant="outlined" v-model="addSegmentData.minutes" type="number" :rules="[onlyInts, minZero, max59]" v-if="data.segment.timing_type != 'count'")
            v-text-field(label="Seconds" variant="outlined" v-model="addSegmentData.seconds" type="number" :rules="[onlyInts, minZero, max59]" v-if="data.segment.timing_type != 'count'")
            v-text-field(label="Hundredths" variant="outlined" v-model="addSegmentData.centis" type="number" :rules="[onlyInts, minZero, max99]" v-if="data.segment.timing_type == 'centis'")
            v-text-field(label="Thousandths" variant="outlined" v-model="addSegmentData.millis" type="number" :rules="[onlyInts, minZero, max999]" v-if="data.segment.timing_type == 'millis'")
            v-text-field(label="Frames" variant="outlined" v-model="addSegmentData.frames" type="number" :rules="[onlyInts, minZero, max59]" v-if="data.segment.timing_type == 'frames'")
            v-text-field(label="Score" variant="outlined" v-model="addSegmentData.seconds" type="number" :rules="[onlyInts, minZero]" v-if="data.segment.timing_type == 'count'")
          v-text-field(label="Vod Url" variant="outlined" v-model="addSegmentData.vod_url")
          v-btn(variant="outlined" @click="addSegmentSubmit") Submit
          v-divider.my-4
          .text-h6 Your submitted {{data.segment.timing_type != 'count' ? 'time' : 'score'}}s
          .text-caption (you can't edit, delete and resubmit if you must)
          .d-flex.align-center(v-for="time in data.times")
            span.mx-2 {{ formatSegmentTime(time.segment_time, data.segment.timing_type) }}
            a.mx-2(v-if="time.vod_url" :href="time.vod_url") VOD
            span.mx-2 {{ formatTimestamp(time.posted_dtm, 'MMM D, YYYY') }}
            v-btn.mx-2(variant="outlined" @click="deleteSegmentSubmit(time.id)")
              v-icon mdi-delete
              | {{confirmedDeletes.includes(time.id) ? 'Are you sure?' : 'Delete'}}
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/axios'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import LoginStatus from '@/components/LoginStatus.vue'
import { formatSegmentTime, formatTimestamp } from '@/utils/formatting'

const router = useRouter()
const route = useRoute()
const segmentId = route.params.id

const loading = ref(true)
const login = ref({})
const data = ref({})

const addSegmentData = ref({})
const addSegmentForm = ref()
const confirmedDeletes = ref([])

const breadcrumbItems = [ { label: "segment" }]

const loadTimes = () => {
  api.get(`/segment-times/${segmentId}`).then(response => {
    data.value = response.data
  })
}

onMounted(async () => {
  try {
    await api.get('/whoami').then(response => {
      login.value = response.data
    })
    await loadTimes()
  } catch {}
  loading.value = false
})

const addSegmentSubmit = async () => {
  const validation = await addSegmentForm.value.validate()
  if (!validation.valid) return
  let add = addSegmentData.value
  let type = data.value.segment.timing_type

  let time = 0
  if (add.hours) time += add.hours * 3600
  if (add.minutes) time += add.minutes * 60
  if (add.seconds) time += +add.seconds
  if (type == 'centis') {
    time *= 100
    if (add.centis) time += +add.centis
  } else if (type == 'millis') {
    time *= 1000
    if (add.millis) time += +add.millis
  } else if (type == 'frames') {
    time *= 60
    if (add.frames) time += +add.frames
  }
  await api.post('/segment-time', {
    segment_id: segmentId,
    segment_time: time,
    vod_url: add.vod_url
  })
  router.push({ name: 'Leaderboard', params: { slug: data.value.segment.game_slug}})
}

const deleteSegmentSubmit = async (id) => {
  if(confirmedDeletes.value.includes(id)){
    await api.delete(`/segment-time/${id}`)
    await loadTimes()
  } else {
    confirmedDeletes.value.push(id)
  }
}

const onlyInts = value => !value || value == Math.ceil(value)
const minZero = value => !value || value >= 0
const max59 = value => !value || value <= 59
const max99 = value => !value || value <= 99
const max999 = value => !value || value <= 999
</script>
