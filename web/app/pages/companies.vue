<script setup lang="ts">
const { data: companies } = await useFetch("/api/companies");
</script>
<template>
  <UContainer class="py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Companies</h1>
      <p class="text-sm text-muted mt-1">Profiles produced by <code>/research</code>. Pick a seed and run <code>/scenario &lt;slug&gt; &lt;n&gt;</code>.</p>
    </div>
    <div v-if="companies?.length" class="grid md:grid-cols-2 gap-4">
      <UCard v-for="c in companies" :id="c.slug" :key="c.slug" variant="subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <div><div class="font-medium">{{ c.name }}</div><div class="text-xs text-muted">companies/{{ c.slug }}/profile.md · {{ c.researched ?? "date unknown" }}</div></div>
            <UBadge color="neutral" variant="subtle">{{ (c.seeds?.length ?? 0) }} seeds</UBadge>
          </div>
        </template>
        <ul v-if="c.tldr?.length" class="text-sm space-y-1 mb-4">
          <li v-for="(t, i) in c.tldr" :key="i" class="flex gap-2"><UIcon name="i-lucide-dot" class="shrink-0 mt-0.5" /><span>{{ t }}</span></li>
        </ul>
        <div class="text-xs uppercase tracking-wide text-muted mb-1">Scenario seeds</div>
        <ol class="text-sm space-y-1.5 list-decimal pl-5">
          <li v-for="(s, i) in c.seeds" :key="i">
            <span>{{ s }}</span>
            <code class="ml-2 text-xs text-muted">/scenario {{ c.slug }} {{ i + 1 }}</code>
          </li>
        </ol>
      </UCard>
    </div>
    <UCard v-else variant="subtle"><p class="text-sm text-muted">No profiles yet. From your agent: <code>/research stripe https://…/job</code></p></UCard>
  </UContainer>
</template>
