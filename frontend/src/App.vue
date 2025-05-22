<template lang="pug">
v-app
  router-view
</template>

<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

watch(
  () => route.query.token,
  (token) => {
    if (token) {
      localStorage.setItem('session', token)

      // Remove token from URL
      const newQuery = { ...route.query }
      delete newQuery.token
      router.replace({ query: newQuery })
    }
  },
  { immediate: true }
)
</script>


<style>
.markdown {
  li {
    margin-left: 1.5rem;
  }
}
.w-100 {
  width: 100%;
}
.opa-50 {
  opacity: 50%;
}
a {
  color: #1976D2;
}
.twitch-btn {
  background-color: #9146FF; /* Twitch purple */
}
.youtube-btn {
  background-color: #FF0000; /* YouTube red */
}
.discord-btn {
  background-color: #5865F2; /* Discord blurple */
}
.ordinal-first {
  border-left: 1px solid #FFD700 !important;
}
.ordinal-second {
  border-left: 1px solid #C0C0C0 !important;
}
.ordinal-third {
  border-left: 1px solid #CD7F32 !important;
}
.ordinal-else {
  border-left: 1px solid #4b4b4b !important;
}
</style>