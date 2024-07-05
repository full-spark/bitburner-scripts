import { NS, Server } from "@ns";
import { getTargets, getWorkers, scpBinaries } from "fs/usr/lib/servers";
import { colorText, timePrintTerminal } from "/fs/lib/util/print";

export async function main(ns: NS) {
  const workers = getWorkers(ns);
  scpBinaries(ns, workers);
  // console.log(workers);

  const maxSeconds = (ns.args[0] as number) || 1200;
  const targets = getTargets(ns)
    .filter(
      (server) =>
        server.hackDifficulty !== server.minDifficulty &&
        ns.getWeakenTime(server.hostname) < maxSeconds * 1000
    )
    .sort((a, b) => ns.getWeakenTime(a.hostname) - ns.getWeakenTime(b.hostname));
  // console.log(targets);

  for (const target of targets) {
    let currentDifficulty = target.hackDifficulty;
    while (currentDifficulty !== target.minDifficulty) {
      for (const worker of workers) {
        const weakenRam = ns.getScriptRam("fs/bin/weaken.js");
        const threads = Math.floor(worker.availableRam / weakenRam);
        if (threads > 0)
          ns.exec("fs/bin/weaken.js", worker.hostname, threads, target.hostname, threads);
      }
      timePrintTerminal(
        ns,
        `Weakening ${colorText.yellow(target.hostname)}... [${currentDifficulty} / ${
          target.minDifficulty
        }] (${ns.tFormat(ns.getWeakenTime(target.hostname))})`
      );
      await ns.sleep(ns.getWeakenTime(target.hostname) + 1000);
      currentDifficulty = (ns.getServer(target.hostname) as Required<Server>).hackDifficulty;
    }
    timePrintTerminal(ns, `Weakened ${colorText.yellow(target.hostname)}!`);
  }
}
