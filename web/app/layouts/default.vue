<script setup lang="ts">
const route = useRoute();
const links = computed(() => [
  { label: "Dashboard", icon: "i-lucide-layout-dashboard", to: "/", active: route.path === "/" },
  { label: "Sessions", icon: "i-lucide-pen-tool", to: "/sessions", active: route.path.startsWith("/sessions") },
  { label: "Companies", icon: "i-lucide-building-2", to: "/companies", active: route.path.startsWith("/companies") },
]);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default text-default">
    <header class="h-12 shrink-0 border-b border-default flex items-center gap-4 px-4 bg-default/80 backdrop-blur sticky top-0 z-40">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span class="text-lg">🧭</span><span>sysdesign-prep</span>
      </NuxtLink>
      <UNavigationMenu :items="links" class="hidden sm:flex" />
      <div class="ml-auto flex items-center gap-2">
        <slot name="header-right" />
        <ThemeToggle />
        <UButton to="https://github.com/jeremyettlinger/sysdesign-prep" target="_blank" icon="i-simple-icons-github" color="neutral" variant="ghost" size="sm" aria-label="GitHub" />
      </div>
    </header>
    <main class="flex-1 min-h-0 flex flex-col">
      <slot />
    </main>
  </div>
</template>
