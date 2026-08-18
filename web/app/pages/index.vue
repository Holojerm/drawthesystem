<script setup lang="ts">
const { data: sessions } = await useFetch("/api/sessions");
const { data: companies } = await useFetch("/api/companies");
const { data: progress } = await useFetch("/api/progress");

const recent = computed(() => (sessions.value ?? []).slice(0, 5));
type Row = { date: string; company: string; topic: string; mode: string; overall: number | null; weakest: string; session: string };
const graded = computed<Row[]>(() => ((progress.value?.rows ?? []) as Row[]).filter(r => r.overall));
const avg = computed(() => graded.value.length ? (graded.value.reduce((a: number, r: Row) => a + (r.overall ?? 0), 0) / graded.value.length).toFixed(1) : "—");
const last = computed(() => graded.value.at(-1));
const nextUp = computed(() => (sessions.value ?? []).find(s => !s.hasFeedback));
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-muted text-sm mt-1">Your agent drives the loop from the terminal; this workbench is where you draw, talk, and review.</p>
      </div>
      <div class="flex gap-2">
        <UButton v-if="nextUp" :to="`/sessions/${nextUp.id}`" icon="i-lucide-play" size="sm">Continue: {{ nextUp.title }}</UButton>
        <UButton to="/companies" icon="i-lucide-search" size="sm" color="neutral" variant="subtle">Companies</UButton>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatTile label="Sessions" :value="sessions?.length ?? 0" icon="i-lucide-pen-tool" />
      <StatTile label="Graded" :value="graded.length" icon="i-lucide-clipboard-check" />
      <StatTile label="Avg score" :value="avg" icon="i-lucide-gauge" hint="/ 5" />
      <StatTile label="Last weakest" :value="last?.weakest ?? '—'" icon="i-lucide-target" small />
    </div>

    <UCard v-if="!sessions?.length && !companies?.length" variant="subtle">
      <template #header><div class="font-medium">Get started</div></template>
      <ol class="text-sm space-y-2 list-decimal pl-5">
        <li>In a terminal at the repo root, start your agent (<code>claude</code>, <code>codex</code>, …).</li>
        <li>Run <code>/research &lt;company&gt;</code>, then <code>/scenario &lt;slug&gt;</code>.</li>
        <li>Refresh this page — the session appears below. Open it to draw and talk.</li>
      </ol>
    </UCard>

    <div class="grid lg:grid-cols-5 gap-6">
      <section class="lg:col-span-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Recent sessions</h2>
          <UButton to="/sessions" variant="link" size="xs" trailing-icon="i-lucide-arrow-right">All</UButton>
        </div>
        <SessionList :sessions="recent" />
      </section>
      <section class="lg:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Companies</h2>
          <UButton to="/companies" variant="link" size="xs" trailing-icon="i-lucide-arrow-right">All</UButton>
        </div>
        <div v-if="companies?.length" class="space-y-2">
          <UCard v-for="c in companies.slice(0, 4)" :key="c.slug" variant="subtle" :ui="{ body: 'p-3 sm:p-3' }">
            <NuxtLink :to="`/companies#${c.slug}`" class="flex items-center justify-between">
              <div>
                <div class="font-medium text-sm">{{ c.name }}</div>
                <div class="text-xs text-muted">{{ (c.seeds?.length ?? 0) }} scenario seeds · researched {{ c.researched ?? "?" }}</div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-muted" />
            </NuxtLink>
          </UCard>
        </div>
        <p v-else class="text-sm text-muted">No companies researched yet — <code>/research &lt;company&gt;</code>.</p>
      </section>
    </div>

    <section v-if="graded.length" class="space-y-3">
      <h2 class="font-medium">Score trend</h2>
      <ScoreTrend :rows="graded" />
    </section>
  </UContainer>
</template>
