import { NS } from "@ns";
import { getTargets } from "fs/usr/lib/servers";

/** @param {NS} ns */
export async function main(ns: NS) {
  const targets = getTargets(ns);
  console.log(targets[0]);
}
