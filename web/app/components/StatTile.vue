<script setup lang="ts">
defineProps<{ label: string; value: string | number; icon?: string; hint?: string; small?: boolean }>();
</script>
<template>
  <UCard variant="subtle" :ui="{ body: 'p-4 sm:p-4' }">
    <div class="flex items-center gap-2 text-xs text-muted uppercase tracking-wide"><UIcon v-if="icon" :name="icon" /> {{ label }}</div>
    <div class="mt-1 font-semibold tabular-nums truncate" :class="small ? 'text-base' : 'text-2xl'">{{ value }}<span v-if="hint" class="text-sm text-muted font-normal ml-1">{{ hint }}</span></div>
  </UCard>
</template>
