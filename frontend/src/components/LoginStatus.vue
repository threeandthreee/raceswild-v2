<template lang="pug">
div
  div(v-if="!ready")
    v-progress-circular(indeterminate color="primary")
  div(v-else)
    v-btn.twitch-btn(v-if="!data.loggedIn" :href="loginUrl") Login
      v-icon.ml-2 mdi-twitch
    v-chip.pr-0(v-else)
      v-img.ml-n2.mr-1(:src="data.player.avatar_url" width=24 height=24 style="border-radius:100%;")
      span.d-none.d-sm-block.mx-1 {{data.player.username}}
      v-btn.ml-1(icon size="x-small" @click="logout")
        v-icon(color="red") mdi-logout
</template>

<script setup>
import { useRouter } from 'vue-router'
import api from '@/utils/axios'

const router = useRouter()
const props = defineProps(['ready', 'data'])
const loginUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${import.meta.env.VITE_TWITCH_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_API_URL}/auth&response_type=code`

const logout = async () => {
  await api.post('/logout')
  router.push('/')
}
</script>