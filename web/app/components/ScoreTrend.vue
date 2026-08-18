<script setup lang="ts">
const props = defineProps<{ rows: { date: string; company: string; topic: string; overall: number | null }[] }>();
const W = 640, H = 120, P = 24;
const pts = computed(() => props.rows.map((r, i) => ({ x: P + (i * (W - 2 * P)) / Math.max(1, props.rows.length - 1), y: H - P - ((r.overall ?? 0) - 1) / 4 * (H - 2 * P), r })));
const path = computed(() => pts.value.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" "));
</script>
<template>
  <UCard variant="subtle" :ui="{ body: 'p-3 sm:p-4' }">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto text-primary" role="img" aria-label="Score trend">
      <g v-for="n in [1,2,3,4,5]" :key="n" class="text-muted">
        <line :x1="P" :x2="W-P" :y1="H-P-(n-1)/4*(H-2*P)" :y2="H-P-(n-1)/4*(H-2*P)" stroke="currentColor" stroke-opacity="0.15" />
        <text :x="4" :y="H-P-(n-1)/4*(H-2*P)+4" font-size="10" fill="currentColor">{{ n }}</text>
      </g>
      <path :d="path" fill="none" stroke="currentColor" stroke-width="2" />
      <g v-for="p in pts" :key="p.x"><circle :cx="p.x" :cy="p.y" r="4" fill="currentColor"><title>{{ p.r.date }} · {{ p.r.company }} · {{ p.r.topic }} · {{ p.r.overall }}</title></circle></g>
    </svg>
  </UCard>
</template>
