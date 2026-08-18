export function useMediaQuery(query: string) {
  const matches = ref(false);
  if (import.meta.client) {
    const mq = window.matchMedia(query);
    matches.value = mq.matches;
    const h = (e: MediaQueryListEvent) => (matches.value = e.matches);
    onMounted(() => mq.addEventListener("change", h));
    onBeforeUnmount(() => mq.removeEventListener("change", h));
  }
  return matches;
}
