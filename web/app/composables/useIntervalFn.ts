export function useIntervalFn(fn: () => void, ms: number) {
  let t: any = null;
  onMounted(() => { t = setInterval(fn, ms); });
  onBeforeUnmount(() => clearInterval(t));
}
