<template lang="pug">
div
  div(v-if="!layout.type")
    v-divider
    v-card(variant="text")
      v-card-title {{data.segments.find(it => it.id == layout).label}}
      v-card-text
        .text-caption.mb-4(v-if="data.segments.find(it => it.id == layout).notes") {{data.segments.find(it => it.id == layout).notes}}
        .text-body-1(v-if="!data.segments.find(it => it.id == layout).segment_times.length") No times posted.
        .d-flex
          .d-flex.align-center(v-for="(time, index) in data.segments.find(it => it.id == layout).segment_times")
            | {{index+1}}.
            v-img.mx-2(:src="data.players[time.player_id].avatar_url" width=24 height=24)
            a(v-if="time.vod_url" :href="time.vod_url") {{formatSegmentTime(time.segment_time, data.segments.find(it => it.id == layout).timing_type)}}
            span(v-else) {{formatSegmentTime(time.segment_time, data.segments.find(it => it.id == layout).timing_type)}}
    v-divider
  div(v-if="layout.type == 'segment_block'")
    v-card(variant="text" @click="toggleCollapse")
      .text-h4.ma-2 {{layout.title}}
        v-icon(v-if="collapsed") mdi-chevron-up
        v-icon(v-else) mdi-chevron-down
    div(v-if="!collapsed" v-for="segment in layout.segments")
      leaderboard-segments.ml-4(:layout="segment" :data="data")
  div(v-if="layout.type == 'blurb'")
    .markdown.mb-2(v-html="marked(layout.contents)")
</template>

<script setup>
import { marked } from 'marked'
import { formatSegmentTime, formatTimestamp } from '@/utils/formatting'
import LeaderboardSegments from '@/components/LeaderboardSegments.vue'
import { ref } from 'vue'
defineProps(['layout', 'data'])

const collapsed = ref(false)
const toggleCollapse = () => { collapsed.value = !collapsed.value }
</script>