<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="loading")
      login-status(:ready="!loading" :data="login")
  div(v-if="!loading")
    div(v-if="game.board_layout")
      .text-h3 {{game.title}}
      .mt-8(v-for="item in game.board_layout")
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
const game = ref({})
const data = ref({})
const login = ref({})

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
  } catch {}
  loading.value = false
})

</script>