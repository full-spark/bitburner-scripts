import type { NS } from "@ns";

export async function main(ns: NS) {
  while (true) {
    await ns.share();
  }
}
