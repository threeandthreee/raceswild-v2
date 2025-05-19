<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    v-breadcrumbs(:items="breadcrumbs" divider=">")
    login-status(:ready="ready" :data="login")
  v-divider.mb-4
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

        // events
        v-text-field.mx-2.mt-4(
          v-model="search"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          label="Search"
          hide-details
        )
        v-tabs-window-item
          v-data-table.mt-2(
            :items="data.events"
            v-model="selectedEvents"
            show-select
            @update:model-value="selectEvent"
            :search="search"
            :headers="eventHeaders"
          )
            template(#item.vod_url="{ item }") {{ item.vod_url ? '✅' : '⬜️' }}
            template(#item.start_dtm="{ item }") {{new Date(item.start_dtm).toLocaleString()}}
            template(#item.end_dtm="{ item }") {{new Date(item.end_dtm).toLocaleString()}}
          div(v-if="selectedEvents.length")
            v-card.ma-2(variant="outlined")
              v-card-title Edit Event
              v-card-text
                v-text-field(
                  v-model="editEventData.title"
                  label="Title"
                  variant="outlined"
                )
                v-textarea(
                  v-model="editEventData.details"
                  label="Details"
                  variant="outlined"
                )
                .d-flex
                  v-date-picker(v-model="editEventData.date")
                  v-time-picker(v-model="editEventData.time" ampm-in-title)
                v-text-field(
                  v-model="editEventData.duration"
                  type="number"
                  label="Duration (hours)"
                  variant="outlined"
                )
                v-text-field(
                  v-model="editEventData.vod_url"
                  label="Vod Url"
                  variant="outlined"
                )
              v-card-actions
                v-btn(variant="outlined" @click="editEvent") Edit
                v-btn(variant="outlined" @click="deleteEvent") Delete
                v-checkbox(label="Confirm Delete" hide-details v-model="editEventData.confirm")
            hr.mt-8
            .text-h5.mx-4.mt-4 Participants
            v-card
              v-text-field.mx-2.mt-4(
                v-model="search2"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                clearable
                label="Search"
                hide-details
              )
              v-data-table.mt-2(
                :items="editEventData.participations"
                :headers="participantHeaders"
                :search="search2"
                v-model="selectedParticipants"
                show-select
                @update:model-value="selectParticipant"
                :sort-by="[{ key: 'participation_level' }]"
              )
                template(#item.avatar_url="{ item }")
                  v-img(
                    :src="item.avatar_url"
                    width=40
                    height=40
                  )
              v-card(v-if="selectedParticipants.length")
                v-card-title Edit Participant
                v-card-text
                  v-select(
                    v-model="editParticipantData.participation_level"
                    :items="participationLevelOptions"
                    label="Participation Level"
                    variant="outlined"
                    hide-details
                  )
                v-card-actions
                  v-btn(variant="outlined" @click="editParticipant") Edit
                  v-btn(variant="outlined" @click="deleteParticipant") Delete
                  v-checkbox(label="Confirm Delete" hide-details v-model="editParticipantData.confirm")
              v-card(v-else)
                v-card-title Add Participant
                v-card-text
                  v-autocomplete(
                    v-model="addParticipantData.player_id"
                    :items="data.players",
                    label="Player"
                    variant="outlined"
                    item-title="username"
                    item-value="id"
                  )
                  v-select(
                    v-model="addParticipantData.participation_level"
                    :items="participationLevelOptions"
                    label="Participation Level"
                    variant="outlined"
                    hide-details
                  )
                v-card-actions
                  v-btn(variant="outlined" @click="addParticipant") Add participant

          v-card.ma-2(variant="outlined" v-else)
            v-card-title Create Event
            v-card-text
              v-text-field(
                v-model="addEventData.title"
                label="Title"
                variant="outlined"
              )
              v-textarea(
                v-model="addEventData.details"
                label="Details"
                variant="outlined"
              )
              .d-flex
                v-date-picker(v-model="addEventData.date")
                v-time-picker(v-model="addEventData.time" ampm-in-title)
              v-text-field(
                v-model="addEventData.duration"
                type="number"
                label="Duration (hours)"
                variant="outlined"
              )
            v-card-actions
              v-btn(variant="outlined" @click="addEvent") Create

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
          v-data-table.mt-2(
            :items="data.games"
            :headers="gamesHeaders"
            :search="search"
            v-model="selectedGames"
            show-select
            @update:model-value="selectGame"
          )
            template(#item.has_leaderboard="{ item }") {{ item.has_leaderboard ? '✅' : '⬜️' }}
          div(v-if="selectedGames.length")
            v-card
              v-card-title Edit Game
              v-card-text
                v-text-field(
                  v-model="editGameData.title"
                  label="Title"
                  variant="outlined"
                )
                v-text-field(
                  v-model="editGameData.slug"
                  label="Slug"
                  variant="outlined"
                  hide-details
                )
                v-checkbox(
                  hide-details
                  label="Show Leaderboard?"
                  v-model="editGameData.has_leaderboard"
                )
                v-textarea(
                  v-model="editGameData.board_layout"
                  label="Board Layout"
                  variant="outlined"
                  hide-details
                )
              v-card-actions
                v-btn(variant="outlined" @click="editGame") Edit
                v-btn(variant="outlined" @click="deleteGame") Delete
                v-checkbox(label="Confirm Delete" hide-details v-model="editGameData.confirm")
            hr
            .text-h5.mx-4.mt-4 Segments
            v-card
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
          v-card(v-else)
            v-card-title Add Game
            v-card-text
              v-text-field(
                v-model="addGameData.title"
                label="Title"
                variant="outlined"
              )
              v-text-field(
                v-model="addGameData.slug"
                label="Slug"
                variant="outlined"
                hide-details
              )
              v-checkbox(
                hide-details
                label="Show Leaderboard?"
                v-model="addGameData.has_leaderboard"
              )
              v-textarea(
                v-model="addGameData.board_layout"
                label="Board Layout"
                variant="outlined"
                hide-details
              )
            v-card-actions
              v-btn(variant="outlined" @click="addGame") Add Game

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
import LoginStatus from '@/components/LoginStatus'

const breadcrumbs = [
  { title: "Races Wild", href:"/", disabled:false },
  { title: "Admin", disabled: true }
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
    if(response.data.player.is_admin)
      getData()
  })
})

const getData = async () => {
  await getEvents()
  await getPlayers()
  await getGames()
  await getDocs()
}

const getEvents = async () => {
  let events = (await api.get('/events')).data
  data.value.events = events
}

const getPlayers = async () => {
  let players = (await api.get('/players')).data
  data.value.players = players
}

const getGames = async () => {
  let games = (await api.get('/games')).data
  data.value.games = games
}

const getDocs = async () => {
  let docs = (await api.get('/docs')).data
  data.value.docs = docs
}


// events
const eventHeaders = [
  { title: 'title', value: 'title' },
  { title: 'vod url', value: 'vod_url' },
  { title: 'start', value: 'start_dtm', sortable: true },
  { title: 'end', value: 'end_dtm', sortable: true }
]
const addEventData = ref({})
const editEventData = ref({})
const selectedEvents = ref([])
const addEvent = async() => {
  let data = addEventData.value
  let payload = {}
  if (data.title) payload.title = data.title
  if (data.details) payload.details = data.details
  if (data.date && data.time && data.duration) {
    let ts = generateUtcTimestamps(data.date, data.time, data.duration)
    payload.start_dtm = ts.start
    payload.end_dtm = ts.end
  }
  await api.post('/admin/events', payload)
  addEventData.value = {}
  await getEvents()
}
const selectEvent = (val) => {
  selectedEvents.value = val.length > 0 ? [val[val.length - 1]] : []
  if(selectedEvents.value.length) {
    loadEvent()
  }
}
const loadEvent = async () => {
  let event = (await api.get(`/event/${selectedEvents.value[0]}`)).data
  console.log(event)
  let parsed = parseUtcTimestamps(event.start_dtm, event.end_dtm)
    editEventData.value = {
      id: event.id,
      title: event.title,
      details: event.details,
      date: parsed.dateObject,
      time: parsed.timeString,
      duration: parsed.durationHours,
      vod_url: event.vod_url,
      participations: event.participations
    }
}
const editEvent = async() => {
  let data = editEventData.value
  let payload = {}
  if (data.title) payload.title = data.title
  if (data.details) payload.details = data.details
  if (data.date && data.time && data.duration) {
    let ts = generateUtcTimestamps(data.date, data.time, data.duration)
    payload.start_dtm = ts.start
    payload.end_dtm = ts.end
  }
  if (data.vod_url) payload.vod_url = data.vod_url
  await api.put(`/admin/events/${data.id}`, payload)
  selectedEvents.value = []
  await getEvents()
}
const deleteEvent = async() => {
  let data = editEventData.value
  if (!data.confirm) return
  await api.delete(`/admin/events/${data.id}`)
  selectedEvents.value = []
  await getEvents()
}

//participants
const participantHeaders = [
  { title: "username", value: "username", sortable: true },
  { title: "avatar", value: "avatar_url" },
  { title: "participation level", value: "participation_level", sortable: true }
]
const participationLevelOptions = ['attended', 'raced', 'won']
const addParticipantData = ref({})
const editParticipantData = ref({})
const selectedParticipants = ref([])
const addParticipant = async () => {
  let data = addParticipantData.value
  let payload = {}
  payload.event_id = selectedEvents.value[0]
  if (data.player_id) payload.player_id = data.player_id
  payload.participation_level = data.participation_level
  await api.post('/admin/participations', payload)
  addParticipantData.value = {}
  await loadEvent()
}
const selectParticipant = val => {
  selectedParticipants.value = val.length > 0 ? [val[val.length - 1]] : []
  if(selectedParticipants.value.length) {
    let participant = editEventData.value.participations.find(it => it.id == selectedParticipants.value[0])
    editParticipantData.value = { ...participant }
  }
}
const editParticipant = async () => {
  let data = editParticipantData.value
  let payload = {}
  payload.event_id = selectedEvents.value[0]
  payload.player_id = selectedPlayers.value[0]
  payload.participation_level = data.participation_level
  await api.put(`/admin/participations/${data.id}`, payload)
  selectedParticipants.value = []
  await loadEvent()
}
const deleteParticipant = async () => {
  let data = editParticipantData.value
  if (!data.confirm) return
  await api.delete(`/admin/participations/${data.id}`)
  selectedParticipants.value = []
  await loadEvent()
}


// players
const playerHeaders = [
  { title: "username", value: "username", sortable: true },
  { title: "short", value: "short", sortable: true },
  { title: "avatar", value: "avatar_url" }
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
  if(selectedPlayers.value.length) {
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


// leaderboard
// games
const gamesHeaders = [
  { title: "Title", value: "title", sortable: true },
  { title: "Slug", value: "slug", sortable: true },
  { title: "Leaderboard?", value: "has_leaderboard", sortable: true }
]
const addGameData = ref({})
const editGameData = ref({})
const selectedGames = ref([])
const addGame = async () => {
  let data = addGameData.value
  let payload = {}
  if (data.title) payload.title = data.title
  if (data.slug) payload.slug = data.slug
  payload.has_leaderboard = data.has_leaderboard
  if (data.board_layout) payload.board_layout = JSON.stringify(JSON.parse(data.board_layout))
  await api.post('/admin/games', payload)
  addGameData.value = {}
  await getGames()
}
const selectGame = async val => {
  selectedSegments.value = []
  selectedGames.value = val.length > 0 ? [val[val.length - 1]] : []
  if(selectedGames.value.length) {
    let game = data.value.games.find(it => it.id == selectedGames.value[0])
    let segments = (await api.get(`/segments/${game.id}`)).data
    editGameData.value = {
      id: game.id,
      title: game.title,
      slug: game.slug,
      has_leaderboard: game.has_leaderboard,
      board_layout: JSON.stringify(game.board_layout, null, 2),
      segments
    }
    console.log('game', game)
  }
}
const editGame = async () => {
  let data = editGameData.value
  let payload = {}
  payload.board_cache = null
  if (data.title) payload.title = data.title
  if (data.slug) payload.slug = data.slug
  payload.has_leaderboard = data.has_leaderboard
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
const timingOptions = ['millis', 'centis', 'seconds', 'frames']
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
  if(selectedDocs.value.length) {
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


const generateUtcTimestamps = (dateString, timeString, durationHours) => {
  // Parse the input date and time
  const [hours, minutes] = timeString.split(':').map(Number);
  const localDateTime = new Date(dateString);
  localDateTime.setHours(hours);
  localDateTime.setMinutes(minutes);
  localDateTime.setSeconds(0);
  localDateTime.setMilliseconds(0);

  // Get start time in UTC
  const startUtc = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);

  // Calculate end time by adding duration in milliseconds
  const endUtc = new Date(startUtc.getTime() + durationHours * 60 * 60 * 1000);

  // Format for MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
  const formatForMySQL = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

  return {
    start: formatForMySQL(startUtc),
    end: formatForMySQL(endUtc),
  };
}

function parseUtcTimestamps(startUtcStr, endUtcStr) {
  // These will be parsed as UTC automatically
  const startUtc = new Date(startUtcStr);
  const endUtc = new Date(endUtcStr);

  if (isNaN(startUtc) || isNaN(endUtc)) {
    throw new Error('Invalid ISO date strings provided');
  }

  // Convert to local time
  const localDate = new Date(startUtc); // JS will treat this as local when calling getHours(), etc.

  // Format time string
  const pad = (n) => n.toString().padStart(2, '0');
  const timeString = `${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;

  // Duration in hours
  const durationHours = (endUtc - startUtc) / (60 * 60 * 1000);

  return {
    dateObject: localDate,   // local date object
    timeString,              // e.g. "21:30"
    durationHours            // e.g. 3
  };
}
</script>