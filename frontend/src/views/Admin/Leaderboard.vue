<template lang="pug">
div
  v-text-field.mx-2.mt-4(
    v-model="search"
    variant="outlined"
    prepend-inner-icon="mdi-magnify"
    clearable
    label="Search"
    hide-details
  )
  v-data-table.mt-2(
    :items="games"
    :headers="gamesHeaders"
    :search="search"
    v-model="selectedGames"
    show-select
    @update:model-value="selectGame"
  )
    template(#item.board_layout="{ item }") {{ item.board_layout ? '✅' : '⬜️' }}
  v-expansion-panels(v-model="panel")
    v-expansion-panel(v-if="selectedGames.length")
      v-expansion-panel-title Edit Game
      v-expansion-panel-text
        v-text-field(
          v-model="editGameData.pre_title"
          label="Pre-Title"
          variant="outlined"
        )
        v-text-field(
          v-model="editGameData.title"
          label="Title"
          variant="outlined"
        )
        v-text-field(
          v-model="editGameData.post_title"
          label="Post-Title"
          variant="outlined"
        )
        v-text-field(
          v-model="editGameData.slug"
          label="Slug"
          variant="outlined"
        )
        v-textarea(
          v-model="editGameData.board_layout"
          label="Board Layout"
          variant="outlined"
        )
        .d-flex.align-center
          v-btn.mr-4(variant="outlined" @click="editGame") Edit
          v-btn(variant="outlined" @click="deleteGame") Delete
          v-checkbox(label="Confirm Delete" hide-details v-model="editGameData.confirm")
    v-expansion-panel(v-if="selectedGames.length")
      v-expansion-panel-title Segments
      v-expansion-panel-text
        v-text-field.mx-2.mt-4(
          v-model="search2"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          label="Search"
          hide-details
        )
        v-data-table.mt-2(
          :items="editGameData.segments"
          :headers="segmentsHeaders"
          :search="search2"
          v-model="selectedSegments"
          show-select
          @update:model-value="selectSegment"
        )
          template(#item.is_full_run="{ item }") {{ item.is_full_run ? '✅' : '⬜️' }}
          template(#item.timing_inverted="{ item }") {{ item.timing_inverted ? '✅' : '⬜️' }}
        v-card(v-if="selectedSegments.length")
          v-card-title Edit Segment
          v-card-text
            v-text-field(
              v-model="editSegmentData.label"
              label="Label"
              variant="outlined"
            )
            v-textarea(
              v-model="editSegmentData.notes"
              label="Notes"
              variant="outlined"
              hide-details
            )
            v-checkbox(
              v-model="editSegmentData.is_full_run"
              label="Full Run?"
              hide-details
            )
            v-select(
              v-model="editSegmentData.timing_type"
              label="Timing Type"
              hide-details
              :items="timingOptions"
              variant="outlined"
            )
            v-checkbox(
              v-model="editSegmentData.timing_inverted"
              label="Inverted Timing?"
              hide-details
            )
          v-card-actions
            v-btn(variant="outlined" @click="editSegment") Edit
            v-btn(variant="outlined" @click="deleteSegment") Delete
            v-checkbox(label="Confirm Delete" hide-details v-model="editSegmentData.confirm")
        v-card(v-else)
          v-card-title Add Segment
          v-card-text
            v-text-field(
              v-model="addSegmentData.label"
              label="Label"
              variant="outlined"
            )
            v-textarea(
              v-model="addSegmentData.notes"
              label="Notes"
              variant="outlined"
              hide-details
            )
            v-checkbox(
              v-model="addSegmentData.is_full_run"
              label="Full Run?"
              hide-details
            )
            v-select(
              v-model="addSegmentData.timing_type"
              label="Timing Type"
              hide-details
              :items="timingOptions"
              variant="outlined"
            )
            v-checkbox(
              v-model="addSegmentData.timing_inverted"
              label="Inverted Timing?"
              hide-details
            )
          v-card-actions
            v-btn(variant="outlined" @click="addSegment") Add Segment

    v-expansion-panel(v-else)
      v-expansion-panel-title Add Game
      v-expansion-panel-text
        v-text-field(
          v-model="addGameData.pre_title"
          label="Pre-Title"
          variant="outlined"
        )
        v-text-field(
          v-model="addGameData.title"
          label="Title"
          variant="outlined"
        )
        v-text-field(
          v-model="addGameData.post_title"
          label="Post-Title"
          variant="outlined"
        )
        v-text-field(
          v-model="addGameData.slug"
          label="Slug"
          variant="outlined"
        )
        v-btn(variant="outlined" @click="addGame") Add Game
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/axios'

const loading = ref(false)
const search = ref('')
const search2 = ref('')
const games = ref([])
const panel = ref()

onMounted(() => {
  getGames()
})

const getGames = () => {
  api.get('/games').then(response => {
    games.value = response.data
  })
}


// leaderboard
// games
const gamesHeaders = [
  { title: "Title", value: "title", sortable: true },
  { title: "Slug", value: "slug", sortable: true },
  { title: "Leaderboard?", value: "board_layout", sortable: true }
]
const addGameData = ref({})
const editGameData = ref({})
const selectedGames = ref([])
const addGame = async () => {
  let data = addGameData.value
  let payload = {}
  if (data.pre_title) payload.pre_title = data.pre_title
  if (data.title) payload.title = data.title
  if (data.post_title) payload.post_title = data.post_title
  if (data.slug) payload.slug = data.slug
  if (data.board_layout) payload.board_layout = JSON.stringify(JSON.parse(data.board_layout))
  await api.post('/admin/games', payload)
  addGameData.value = {}
  await getGames()
}
const selectGame = async val => {
  selectedSegments.value = []
  selectedGames.value = val.length > 0 ? [val[val.length - 1]] : []
  panel.value = null
  if(selectedGames.value.length) {
    let game = games.value.find(it => it.id == selectedGames.value[0])
    let segments = (await api.get(`/segments/${game.id}`)).data
    editGameData.value = {
      id: game.id,
      pre_title: game.pre_title,
      title: game.title,
      post_title: game.post_title,
      slug: game.slug,
      board_layout: JSON.stringify(game.board_layout, null, 2),
      segments
    }
  }
}
const editGame = async () => {
  let data = editGameData.value
  let payload = {}
  payload.board_cache = null
  if (data.pre_title) payload.pre_title = data.pre_title
  if (data.title) payload.title = data.title
  if (data.post_title) payload.post_title = data.post_title
  if (data.slug) payload.slug = data.slug
  if (data.board_layout) payload.board_layout = JSON.stringify(JSON.parse(data.board_layout))
  await api.put(`/admin/games/${data.id}`, payload)
  selectedGames.value = []
  await getGames()
}
const deleteGame = async () => {
  let data = editGameData.value
  if (!data.confirm) return
  await api.delete(`/admin/games/${data.id}`)
  selectedGames.value = []
  await getGames()
}


// segments
const segmentsHeaders = [
  { title: "ID", value: "id", sortable: true },
  { title: "Label", value: "label", sortable: true },
  { title: "Full Run?", value: "is_full_run", sortable: true },
  { title: "Timing", value: "timing_type", sortable: true },
  { title: "Inverted Timing?", value: "timing_inverted", sortable: true }
]
const timingOptions = ['millis', 'centis', 'seconds', 'frames', 'count']
const addSegmentData = ref({})
const editSegmentData = ref({})
const selectedSegments = ref([])
const addSegment = async () => {
  let data = addSegmentData.value
  let payload = {}
  if (data.label) payload.label = data.label
  if (data.notes) payload.notes = data.notes
  payload.is_full_run = data.is_full_run
  payload.timing_type = data.timing_type
  payload.timing_inverted = data.timing_inverted
  payload.game_id = selectedGames.value[0]
  await api.post('/admin/segments', payload)
  addSegmentData.value = {}
  editGameData.value.segments = (await api.get(`/segments/${selectedGames.value[0]}`)).data
}
const selectSegment = val => {
  selectedSegments.value = val.length > 0 ? [val[val.length - 1]] : []
  if(selectedSegments.value.length) {
    let segment = editGameData.value.segments.find(it => it.id == selectedSegments.value[0])
    editSegmentData.value = { ...segment }
  }
}
const editSegment = async () => {
  let data = editSegmentData.value
  let payload = {}
  if (data.label) payload.label = data.label
  if (data.notes) payload.notes = data.notes
  payload.is_full_run = data.is_full_run
  payload.timing_type = data.timing_type
  payload.timing_inverted = data.timing_inverted
  await api.put(`/admin/segments/${data.id}`, payload)
  selectedSegments.value = []
  editGameData.value.segments = (await api.get(`/segments/${selectedGames.value[0]}`)).data
}
const deleteSegment = async () => {
  let data = editSegmentData.value
  if (!data.confirm) return
  await api.delete(`/admin/segments/${data.id}`)
  selectedSegments.value = []
  editGameData.value.segments = (await api.get(`/segments/${selectedGames.value[0]}`)).data
}
</script>
