<script setup lang="ts">
import type { SessionSummary } from "~~/server/utils/repo";
defineProps<{ sessions: SessionSummary[] }>();
const scoreColor = (n?: number) => n == null ? "neutral" : n >= 4 ? "success" : n >= 3 ? "warning" : "error";
</script>
<template>
  <div v-if="sessions.length" class="divide-y divide-default rounded-lg border border-default overflow-hidden">
    <NuxtLink v-for="s in sessions" :key="s.id" :to="`/sessions/${s.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-elevated/60 transition-colors">
      <div class="min-w-0 flex-1">
        <div class="font-medium text-sm truncate">{{ s.title }}</div>
        <div class="text-xs text-muted flex gap-2 flex-wrap">
          <span>{{ s.date }}</span><span>·</span><span class="capitalize">{{ s.company }}</span>
          <template v-if="s.mode"><span>·</span><span>{{ s.mode }}</span></template>
          <template v-if="s.minutes"><span>·</span><span>{{ s.minutes }} min</span></template>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <UBadge v-if="s.hasCanvas" color="neutral" variant="subtle" size="sm" icon="i-lucide-pen-line">canvas</UBadge>
        <UBadge v-if="s.hasSolution" color="neutral" variant="subtle" size="sm" icon="i-lucide-lightbulb">solution</UBadge>
        <UBadge v-if="s.hasFeedback" :color="scoreColor(s.overall)" variant="subtle" size="sm" icon="i-lucide-clipboard-check">{{ s.overall ?? "graded" }}</UBadge>
        <UBadge v-else color="primary" variant="subtle" size="sm">open</UBadge>
      </div>
      <UIcon name="i-lucide-chevron-right" class="text-muted shrink-0" />
    </NuxtLink>
  </div>
  <p v-else class="text-sm text-muted">No sessions yet — run <code>/scenario</code> from your agent.</p>
</template>
