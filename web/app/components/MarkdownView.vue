<script setup lang="ts">
const props = defineProps<{ source: string | null | undefined; empty?: string }>();
const html = computed(() => renderMarkdown(props.source));
</script>
<template>
  <div v-if="html" class="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-base prose-h2:mt-5 prose-table:text-xs" v-html="html" />
  <p v-else class="text-sm text-muted italic">{{ empty ?? "Nothing here yet." }}</p>
</template>
