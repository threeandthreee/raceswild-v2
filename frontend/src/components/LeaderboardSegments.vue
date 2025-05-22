<template lang="pug">
div(v-if="layout")
  div(v-if="!layout.type")
    v-divider
    v-card(variant="text")
      v-card-title.d-flex.align-center {{data.segments.find(it => it.id == layout).label}}
        v-tooltip(text="Submit a time")
          template(v-slot:activator="{ props }")
            v-btn.ml-2.opa-50(v-bind="props" density="compact" size="small" icon="mdi-plus" variant="outlined" :to="`/segment/${layout}`")
      v-card-text
        .text-caption.mb-4(v-if="data.segments.find(it => it.id == layout).notes") {{data.segments.find(it => it.id == layout).notes}}
        .text-body-1(v-if="!data.segments.find(it => it.id == layout).segment_times.length") No times posted.
        .d-flex
          v-card.d-flex.flex-column.align-center.mr-4.pa-1(v-for="(time, index) in data.segments.find(it => it.id == layout).segment_times" :class="{'ordinal-first': index==0, 'ordinal-second': index==1, 'ordinal-third': index==2}")
            | {{ordinal(index+1)}}
            v-img.ma-2(:src="data.players[time.player_id].avatar_url" width=40 height=40)
            a(v-if="time.vod_url" :href="time.vod_url") {{formatSegmentTime(time.segment_time, data.segments.find(it => it.id == layout).timing_type)}}
            span(v-else) {{formatSegmentTime(time.segment_time, data.segments.find(it => it.id == layout).timing_type)}}
    v-divider
  div(v-if="layout.type=='segment_block' || layout.type=='blurb'")
    v-card(variant="text" v-if="layout.title" @click="toggleCollapse")
      .text-h4.ma-2
        v-icon(v-if="collapsed") mdi-chevron-up
        v-icon(v-else) mdi-chevron-down
        | {{layout.title}}
    div(v-if="!collapsed")
      div(v-if="layout.type == 'segment_block'" v-for="segment in layout.segments")
        leaderboard-segments.ml-4(:layout="segment" :data="data")
      div(v-if="layout.type == 'blurb'")
        .markdown.mb-2.ml-4(v-if="layout.content" v-html="marked(layout.content)")
</template>

<script setup>
import { ref } from 'vue'
import { marked } from 'marked'
import { formatSegmentTime, formatTimestamp } from '@/utils/formatting'
import LeaderboardSegments from '@/components/LeaderboardSegments.vue'
const props = defineProps(['layout', 'data'])

const collapsed = ref(props.layout.collapsed)

const toggleCollapse = () => { collapsed.value = !collapsed.value }

const ordinal = n => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
</script>