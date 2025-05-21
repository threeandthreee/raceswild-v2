<template lang="pug">
.w-100
  .d-flex.align-center.justify-space-between
    .d-flex.justify-start.align-center.flex-wrap
      v-btn.breadcrumb.pa-0(
        to="/"
        variant="text"
        color="primary"
        size="large"
      ) {{raceswild}}
      .d-flex.justify-start.align-center.flex-wrap(
        v-for="item in items"
      )
        v-icon.mx-2(size="x-small") mdi-greater-than
        v-btn.breadcrumb.pa-0(
          v-if="item.url"
          :to="item.url"
          variant="text"
          color="primary"
          size="large"
        ) {{item.label}}
        v-btn.breadcrumb.pa-0(
          v-else
          disabled
          variant="text"
          size="large"
        ) {{item.label}}
    slot
  v-progress-linear.mb-3(indeterminate v-if="loading" color="primary")
  v-divider.mb-4(v-else)
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
defineProps(['items', 'loading'])

const { smAndDown } = useDisplay()
const raceswild = computed(() => smAndDown.value ? 'RW' : 'Races Wild' )
</script>

<style>
.v-btn.breadcrumb {
  min-width: 0 !important;
}
</style>