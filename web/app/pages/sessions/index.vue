<script setup lang="ts">
const { data: sessions } = await useFetch("/api/sessions");
const q = ref("");
const filtered = computed(() => (sessions.value ?? []).filter(s => !q.value || `${s.title} ${s.company} ${s.topic}`.toLowerCase().includes(q.value.toLowerCase())));
</script>
<template>
  <UContainer class="py-8 space-y-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">Sessions</h1>
      <UInput v-model="q" icon="i-lucide-search" placeholder="Filter…" size="sm" class="w-64" />
    </div>
    <SessionList :sessions="filtered" />
  </UContainer>
</template>
