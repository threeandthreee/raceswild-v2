<template lang="pug">
v-container
  .d-flex.align-center.justify-space-between
    breadcrumbs
  .markdown(v-if="doc && doc.content" v-html="marked(doc.content)")
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import { marked } from 'marked'

const route = useRoute()
const slug = route.params.slug
const doc = ref({})
onMounted(() => {
  api.get(`/doc/${slug}`).then(response => {
    doc.value = response.data
  })
})
</script>