import type { NS } from "@ns";

export function getDefer(ns: NS) {
  const deferredFunctions: (() => void)[] = [];
  function defer(func: () => void) {
    deferredFunctions.push(func);
    ns.atExit(() => {
      deferredFunctions.forEach((f) => f());
    });
  }
  function purge() {
    while (deferredFunctions.length > 0) {
      deferredFunctions.shift()!();
    }
  }
  return { defer, purge };
}
