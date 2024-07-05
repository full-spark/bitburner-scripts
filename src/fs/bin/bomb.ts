import { NS } from "@ns";

export async function main(ns: NS) {
  // Just like "weaken", but loops forever.
  const target = ns.args[0] as string;
  const threads = ns.args[1] as number;

  while (true) {
    await ns.weaken(target, { threads, stock: true });
  }
}
