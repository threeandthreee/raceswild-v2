<template lang="pug">
  v-container
    .d-flex.align-center.justify-space-between
      breadcrumbs(:items="breadcrumbItems" :loading="loading")
    v-card
      v-card-text
        v-text-field.mb-4(
          v-model="search"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          label="Search"
          hide-details
        )
        v-data-table(
          :items="events"
          :headers="eventHeaders"
          :search="search"
          :sort-by="[{key:'start_dtm', order:'desc'}]"
        )
          template(#item.title="{item}")
            router-link(:to="getEventPath(item)") {{item.title}}
          template(#item.vod_url="{ item }") {{ item.vod_url ? '✅' : '⬜️' }}
          template(#item.start_dtm="{ item }") {{formatDate(item.start_dtm)}}
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/utils/axios'
  import Breadcrumbs from '@/components/Breadcrumbs.vue'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'

  dayjs.extend(relativeTime)

  const breadcrumbItems = [
    { label: "Archive" }
  ]

  const getEventPath = event => `/event/${dayjs(event.start_dtm).format('YYYY/MM/DD')}`
  const formatDate = date => dayjs(date).format('MMM D, YYYY')

  const eventHeaders = [
    { title: 'Title', value: 'title', sortable: true },
    { title: 'VOD', value: 'vod_url' },
    { title: 'Date', value: 'start_dtm', sortable: true },
  ]

  const loading = ref(false)
  const events = ref([])
  const search = ref('')

  onMounted(() => {
    loading.value = true
    api.get('/events').then(response => {
      events.value = response.data
    }).finally(() => {
      loading.value = false
    })
  })
  </script>