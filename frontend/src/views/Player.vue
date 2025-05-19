<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="player.username")
      p short name:
        v-chip.ma-2 {{player.short}}
      v-img(:src="player.avatar_url" width=300 height=300)
      p TODO: this page
      div(v-if="login.player?.username == username")
        v-card(variant="outlined")
          v-card-title Change your short name
          v-card-text
            .d-flex.align-center.ma-2
              v-text-field.mr-2(variant="outlined" v-model="newData.short" label="New Short" hide-details density="compact")
              v-btn(@click="changeShort" variant="outlined") Change
    div(v-else) not found
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
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

const changeShort = async () => {
  await api.post('/player/short', { short: newData.value.short })
  newData.value = {}
  loading.value = true
  api.get(`/player/${username}`).then(response => {
    player.value = response.data
  }).finally(() => {
    loading.value = false
  })
}

onMounted(async () => {
  await api.get('/whoami').then(response => {
    console.log(response.data)
    login.value = response.data
  })
  api.get(`/player/${username}`).then(response => {
    player.value = response.data
  }).finally(() => {
    loading.value = false
  })
})
</script>