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
        :items="players"
        :headers="playerHeaders"
        :search="search"
        :sort-by="[{key:'username'}]"
      )
        template(#item.username="{item}")
          router-link(:to="`/player/${item.username}`") {{item.username}}
        template(#item.avatar_url="{item}")
          v-img(
            :src="item.avatar_url"
            width=40
            height=40
          )
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/axios'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const breadcrumbItems = [
  { label: "Players" }
]

const playerHeaders = [
  { title: "", value: "avatar_url" },
  { title: "Username", value: "username", sortable: true },
  { title: "Participations", value: "participations", sortable: true },
  { title: "Races", value: "races", sortable: true },
  { title: "Wins", value: "wins", sortable: true }
]

const loading = ref(false)
const players = ref([])
const search = ref('')

onMounted(() => {
  loading.value = true
  api.get('/players').then(response => {
    players.value = response.data
  }).finally(() => {
    loading.value = false
  })
})
</script>