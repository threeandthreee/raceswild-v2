<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
  div(v-if="!loading")
    div(v-if="event.id")
      .text-h2 {{event.title}}
      .text-h4 {{dateStr}}
      p todo vod, participants, details
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

onMounted(async () => {
  api.get(`/event/${route.params.year}/${route.params.month}/${route.params.day}`).then(response => {
    event.value = response.data
    const date = dayjs(event.value.start_dtm)
    dateStr.value = `${date.format('dddd, MMM D @ hA')} (${date.fromNow()})`
  }).finally(() => {
    loading.value = false
  })
})
</script>