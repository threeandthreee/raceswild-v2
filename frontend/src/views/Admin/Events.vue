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
    :items="events"
    v-model="selectedEvents"
    show-select
    @update:model-value="selectEvent"
    :search="search"
    :headers="eventHeaders"
    :sort-by="[{key:'start_dtm', order:'desc'}]"
  )
    template(#item.vod_url="{ item }") {{ item.vod_url ? '✅' : '⬜️' }}
    template(#item.start_dtm="{ item }") {{formatTimestamp(item.start_dtm, 'MMM D, YYYY')}}
  v-expansion-panels(v-model="panel")
    v-expansion-panel(v-if="selectedEvents.length")
      v-expansion-panel-title Edit Event
      v-expansion-panel-text
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
        v-btn(variant="outlined" @click="editEvent") Edit
        v-btn(variant="outlined" @click="deleteEvent") Delete
        v-checkbox(label="Confirm Delete" hide-details v-model="editEventData.confirm")
    v-expansion-panel(v-if="selectedEvents.length")
      v-expansion-panel-title Participants
      v-expansion-panel-text
        v-text-field.mx-2.mt-4.d-none(
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
              :items="players.filter(pl=>!editEventData.participations.find(pa=>pl.id==pa.player_id))"
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

    v-expansion-panel(v-else)
      v-expansion-panel-title Create Event
      v-expansion-panel-text
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
        v-btn(variant="outlined" @click="addEvent") Create
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/axios'
import { formatTimestamp } from '@/utils/formatting'

const loading = ref(false)
const search = ref('')
const search2 = ref('')
const events = ref([])
const players = ref([])
const panel = ref()

onMounted(() => {
  getEvents()
  api.get('/players').then(response => {
    players.value = response.data
  })
})

const getEvents = () => {
  api.get('/events').then(response => {
    events.value = response.data
  })
}

const eventHeaders = [
  { title: 'Title', value: 'title' },
  { title: 'VOD', value: 'vod_url' },
  { title: 'Date', value: 'start_dtm', sortable: true },
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
  panel.value = null
  if(selectedEvents.value.length) {
    loadEvent()
  }
}
const loadEvent = async () => {
  let event = (await api.get(`/event/${selectedEvents.value[0]}`)).data
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

//participants
const participantHeaders = [
  { title: "", value: "avatar_url" },
  { title: "username", value: "username", sortable: true },
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
</script>