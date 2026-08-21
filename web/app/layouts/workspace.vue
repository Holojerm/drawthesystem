<template>
  <div class="h-screen flex flex-col bg-default text-default overflow-hidden">
    <header class="h-12 shrink-0 border-b border-default flex items-center gap-4 px-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight"><span class="text-lg">🧭</span><span>Draw the System</span></NuxtLink>
      <span class="text-xs text-muted hidden md:inline">Drive the interview from your agent · <code>/mock --voice</code> · say “look at the diagram” any time</span>
      <div class="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
    <main class="flex-1 min-h-0"><slot /></main>
  </div>
</template>
