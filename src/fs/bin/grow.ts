import type { NS } from "@ns";

export async function main(ns: NS) {
  const target = ns.args[0] as string;
  const threads = ns.args[1] as number;
  const delay = ns.args[2] as number;

  await ns.grow(target, { threads, stock: true, additionalMsec: delay | 0 });
  ns.exit();
}
