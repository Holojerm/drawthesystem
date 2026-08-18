/** Tiny SSR-safe localStorage-backed ref (avoids pulling in @vueuse). */
export function useLocalStorage<T = string | number | boolean>(key: string, initial: T): Ref<T> {
  const r = ref(initial) as Ref<T>;
  if (import.meta.client) {
    const raw = localStorage.getItem(key);
    if (raw != null) { try { r.value = JSON.parse(raw); } catch { r.value = raw as T; } }
    watch(r, v => localStorage.setItem(key, JSON.stringify(v)));
  }
  return r;
}
