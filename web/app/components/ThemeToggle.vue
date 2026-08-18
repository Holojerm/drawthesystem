<script setup lang="ts">
const colorMode = useColorMode();
const dark = computed({ get: () => colorMode.value === "dark", set: v => (colorMode.preference = v ? "dark" : "light") });
</script>
<template>
  <ClientOnly>
    <UButton :icon="dark ? 'i-lucide-moon' : 'i-lucide-sun'" color="neutral" variant="ghost" size="sm" aria-label="Toggle theme" @click="dark = !dark" />
    <template #fallback><UButton icon="i-lucide-sun" color="neutral" variant="ghost" size="sm" aria-label="Toggle theme" /></template>
  </ClientOnly>
</template>
