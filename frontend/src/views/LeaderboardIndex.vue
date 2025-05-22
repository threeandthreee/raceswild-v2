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
          :items="games"
          :headers="gamesHeaders"
          :search="search"
          :sort-by="[{key:'title'}]"
          hide-headers
          hide-footer
          :items-per-page="-1"
        )
          template(#headers)
          template(#bottom)
          template(#item.title="{item}")
            v-btn(variant="text" color="primary" :to="`/leaderboard/${item.slug}`") {{item.title}}
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/utils/axios'
  import Breadcrumbs from '@/components/Breadcrumbs.vue'

  const breadcrumbItems = [
    { label: "Leaderboard" }
  ]

  const gamesHeaders = [
    { title: "Title", value: "title", sortable: true }
  ]

  const loading = ref(false)
  const games = ref([])
  const search = ref('')

  onMounted(() => {
    loading.value = true
    api.get('/games').then(response => {
      games.value = response.data.filter(it => it.board_layout)
    }).finally(() => {
      loading.value = false
    })
  })
  </script>