<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs(:items="breadcrumbItems" :loading="!ready")
      login-status(:ready="ready" :data="login")
  div(v-if="ready && login && login.player")
    div(v-if="!login.player.is_admin")
      p Admins only!
    v-card(v-if="ready && login && login.player && login.player.is_admin")
      v-tabs(v-model="tab")
        v-tab Events
        v-tab Players
        v-tab Leaderboard
        v-tab Docs
      v-tabs-window(v-model="tab")
        v-tabs-window-item
          events

        // players
        v-tabs-window-item
          v-data-table.mt-2(
            :items="data.players"
            :headers="playerHeaders"
            :search="search"
            v-model="selectedPlayers"
            show-select
            @update:model-value="selectPlayer"
          )
            template(#item.avatar_url="{ item }")
              v-img(
                :src="item.avatar_url"
                width=40
                height=40
              )
          v-card(v-if="selectedPlayers.length")
            v-card-title Edit Player
            v-card-text
              v-text-field(
                v-model="editPlayerData.short"
                label="Short"
                variant="outlined"
              )
            v-card-actions
              v-btn(variant="outlined" @click="editPlayer") Edit
              v-btn(variant="outlined" @click="deletePlayer") Delete
              v-checkbox(label="Confirm Delete" hide-details v-model="editPlayerData.confirm")
          .d-flex.align-center.ma-2(v-else)
            v-text-field.mr-2(
              density="compact"
              hide-details
              variant="outlined"
              label="Twitch Username"
              v-model="addPlayerUsername"
            )
            v-btn(@click="addPlayer" variant="outlined") Add player

        // leaderboard
        v-tabs-window-item
          leaderboard

        // docs
        v-tabs-window-item
          v-data-table.mt-2(
            :items="data.docs"
            item-value="slug"
            :headers="docsHeaders"
            :search="search"
            v-model="selectedDocs"
            show-select
            @update:model-value="selectDoc"
          )
          v-card(v-if="selectedDocs.length")
            v-card-title Edit Doc: {{editDocData.slug}}
            v-card-text
              v-textarea(
                v-model="editDocData.content"
                label="Content"
                variant="outlined"
              )
              v-card(variant="outlined")
                v-card-title Preview
                v-card-text
                  .markdown(v-html="editDocMarkdown")
            v-card-actions
              v-btn(variant="outlined" @click="editDoc") Edit
              v-btn(variant="outlined" @click="deleteDoc") Delete
              v-checkbox(label="Confirm Delete" hide-details v-model="editDocData.confirm")
          v-card(v-else)
            v-card-title Add Doc
            v-card-text
              v-text-field(
                v-model="addDocData.slug"
                label="Slug"
                variant="outlined"
              )
              v-textarea(
                v-model="addDocData.content"
                label="Content"
                variant="outlined"
              )
              v-card(variant="outlined")
                v-card-title Preview
                v-card-text
                  .markdown(v-html="addDocMarkdown")
            v-card-actions
              v-btn(variant="outlined" @click="addDoc") Create Doc


</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { marked } from 'marked'
import api from '@/utils/axios'
import Events from '@/views/Admin/Events.vue'
import Leaderboard from '@/views/Admin/Leaderboard.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import LoginStatus from '@/components/LoginStatus'

const breadcrumbItems = [
  { label: "Admin" }
]

const ready = ref(false)
const login = ref({})

const tab = ref(0)
const data = ref({})
const search = ref('')
const search2 = ref('')


onMounted(() => {
  api.get('/whoami').then(response => {
    login.value = response.data
    ready.value = true
    if (response.data.player.is_admin)
      getData()
  })
})

const getData = async () => {
  await getPlayers()
  await getDocs()
}


const getPlayers = async () => {
  let players = (await api.get('/players')).data
  data.value.players = players
}

const getDocs = async () => {
  let docs = (await api.get('/docs')).data
  data.value.docs = docs
}

// players
const playerHeaders = [
  { title: "", value: "avatar_url" },
  { title: "username", value: "username", sortable: true },
  //{ title: "short", value: "short", sortable: true },
  { title: "participations", value: "participations", sortable: true }
]
const addPlayerUsername = ref("")
const editPlayerData = ref({})
const selectedPlayers = ref([])
const addPlayer = async () => {
  await api.post('/admin/player-from-username', {
    username: addPlayerUsername.value
  })
  addPlayerUsername.value = ""
  await getPlayers()
}
const selectPlayer = (val) => {
  selectedPlayers.value = val.length > 0 ? [val[val.length - 1]] : []
  if (selectedPlayers.value.length) {
    let player = data.value.players.find(it => it.id == selectedPlayers.value[0])
    editPlayerData.value = { id: player.id, short: player.short }
  }
}
const editPlayer = async () => {
  let data = editPlayerData.value
  let payload = {}
  if (data.short) payload.short = data.short
  await api.put(`/admin/players/${data.id}`, payload)
  selectedPlayers.value = []
  await getPlayers()
}
const deletePlayer = async () => {
  let data = editPlayerData.value
  if (!data.confirm) return
  await api.delete(`/admin/players/${data.id}`)
  selectedPlayers.value = []
  await getPlayers()
}

// docs
const docsHeaders = [
  { title: "Slug", value: "slug", sortable: true }
]
const addDocData = ref({})
const editDocData = ref({})
const selectedDocs = ref([])
const addDoc = async () => {
  let data = addDocData.value
  let payload = {}
  if (data.slug) payload.slug = data.slug
  if (data.content) payload.content = data.content
  await api.post('/admin/docs', payload)
  addDocData.value = {}
  await getDocs()
}
const selectDoc = async val => {
  selectedDocs.value = val.length > 0 ? [val[val.length - 1]] : []
  if (selectedDocs.value.length) {
    let doc = (await api.get(`/doc/${selectedDocs.value[0]}`)).data
    editDocData.value = doc
  }
}
const editDoc = async () => {
  let data = editDocData.value
  let payload = {}
  if (data.content) payload.content = data.content
  await api.put(`/admin/docs/${data.slug}`, payload)
  selectedDocs.value = []
  await getDocs()
}
const deleteDoc = async () => {
  let data = editDocData.value
  if (!data.confirm) return
  await api.delete(`/admin/docs/${data.slug}`)
  selectedDocs.value = []
  await getDocs()
}
const addDocMarkdown = computed(() => addDocData.value?.content ? marked(addDocData.value.content) : "")
const editDocMarkdown = computed(() => editDocData.value?.content ? marked(editDocData.value.content) : "")
</script>