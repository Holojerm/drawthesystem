<script setup lang="ts">
const props = defineProps<{ sessionId: string }>();
const sid = computed(() => props.sessionId);
const v = useVoice(sid);
const typed = ref("");
const scroller = ref<HTMLElement>();

async function sendTyped() {
  const t = typed.value.trim(); if (!t) return;
  typed.value = ""; await v.sendUtterance(t);
}
watch(() => v.transcript.value.length, () => nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: "smooth" })));
const voiceItems = computed(() => v.voices.value.map(x => x.name));
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-3 py-2 border-b border-default flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span v-if="v.connected.value" class="absolute inline-flex h-full w-full rounded-full opacity-60" :class="v.agentWaiting.value ? 'bg-primary animate-ping' : 'bg-success'" />
        <span class="relative inline-flex rounded-full h-2 w-2" :class="!v.connected.value ? 'bg-error' : v.agentWaiting.value ? 'bg-primary' : 'bg-success'" />
      </span>
      <span class="text-xs text-muted flex-1 truncate">
        <template v-if="!v.connected.value">bridge disconnected</template>
        <template v-else-if="v.speaking.value">interviewer speaking…</template>
        <template v-else-if="v.agentWaiting.value">interviewer is listening — your turn</template>
        <template v-else-if="v.listening.value">mic on</template>
        <template v-else>mic off · start your agent's <code>/mock --voice</code></template>
      </span>
      <UPopover>
        <UButton icon="i-lucide-settings-2" color="neutral" variant="ghost" size="xs" aria-label="Voice settings" />
        <template #content>
          <div class="p-3 w-64 space-y-3 text-sm">
            <UFormField label="Voice" size="xs"><USelect v-model="v.voiceName.value" :items="voiceItems" size="xs" class="w-full" /></UFormField>
            <UFormField :label="`Rate ${Number(v.rate.value).toFixed(2)}`" size="xs"><USlider v-model="v.rate.value" :min="0.7" :max="1.4" :step="0.02" size="xs" /></UFormField>
            <UCheckbox v-model="v.pushToTalk.value" label="Push-to-talk (hold Space)" size="xs" />
            <p class="text-xs text-muted">Speech is recognised by the browser (Web Speech API). Chrome sends audio to Google; Safari runs on-device.</p>
          </div>
        </template>
      </UPopover>
    </div>

    <UAlert v-if="v.error.value" color="warning" variant="subtle" :description="v.error.value" class="m-2" :ui="{ description: 'text-xs' }" />

    <div ref="scroller" class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
      <p v-if="!v.transcript.value.length" class="text-xs text-muted italic">Transcript appears here. The interviewer's turns are spoken aloud; yours are transcribed.</p>
      <div v-for="(t, i) in v.transcript.value" :key="i" class="text-sm rounded-lg px-3 py-2 max-w-[92%]" :class="t.who === 'Candidate' ? 'ml-auto bg-primary/10' : 'bg-elevated'">
        <div class="text-[10px] uppercase tracking-wide text-muted mb-0.5">{{ t.who === "Candidate" ? "You" : "Interviewer" }}</div>
        <div class="whitespace-pre-wrap">{{ t.text }}</div>
      </div>
      <div v-if="v.live.value" class="text-sm rounded-lg px-3 py-2 max-w-[92%] ml-auto bg-primary/5 italic text-muted">{{ v.live.value }}</div>
    </div>

    <div class="border-t border-default p-2 space-y-2">
      <div class="flex gap-2">
        <UButton :icon="v.listening.value ? 'i-lucide-mic' : 'i-lucide-mic-off'" :color="v.listening.value ? 'error' : 'neutral'" :variant="v.listening.value ? 'solid' : 'subtle'" size="sm" class="flex-1 justify-center" :disabled="!v.supported.value" @click="v.toggleListening()">
          {{ v.listening.value ? (v.pushToTalk.value ? "Hold Space to talk" : "Listening") : "Start mic" }}
        </UButton>
        <UButton icon="i-lucide-volume-x" color="neutral" variant="subtle" size="sm" aria-label="Stop speaking" :disabled="!v.speaking.value" @click="v.stopSpeaking()" />
      </div>
      <form class="flex gap-2" @submit.prevent="sendTyped">
        <UInput v-model="typed" placeholder="…or type your answer" size="sm" class="flex-1" />
        <UButton type="submit" icon="i-lucide-send" size="sm" color="neutral" variant="subtle" aria-label="Send" />
      </form>
    </div>
  </div>
</template>
