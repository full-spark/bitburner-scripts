import { AutocompleteData, NS, Server } from "@ns";
import { getWorkers } from "fs/usr/lib/servers";

export async function main(ns: NS) {
  const target = ns.args[0] as string;

  const workers = getWorkers(ns);

  const ramCosts = {
    weaken: ns.getScriptRam("fs/bin/weaken.js"),
    grow: ns.getScriptRam("fs/bin/grow.js"),
    hack: ns.getScriptRam("fs/bin/hack.js"),
  };

  while (true) {
    const serverInfo = ns.getServer(target) as Required<Server>;

    if (!serverInfo || serverInfo.hostname === "home") {
      ns.tprint(`Server '${target}' not found or is your home server.`);
      return;
    }

    const toWeaken = serverInfo.hackDifficulty > serverInfo.minDifficulty;
    const toGrow = serverInfo.moneyAvailable < serverInfo.moneyMax;

    console.log(
      toWeaken,
      toGrow,
      serverInfo.hackDifficulty,
      serverInfo.minDifficulty,
      serverInfo.moneyAvailable,
      serverInfo.moneyMax
    );

    if (toWeaken) {
      for (const worker of workers) {
        ns.scp("fs/bin/weaken.js", worker.hostname);
        const threads = Math.floor(worker.availableRam / ramCosts.weaken);
        if (threads > 0) {
          ns.exec("fs/bin/weaken.js", worker.hostname, threads, target);
        }
      }
    } else if (toGrow) {
      for (const worker of workers) {
        ns.scp("fs/bin/grow.js", worker.hostname);
        const threads = Math.floor(worker.availableRam / ramCosts.grow);
        if (threads > 0) {
          ns.exec("fs/bin/grow.js", worker.hostname, threads, target);
        }
      }
    } else {
      for (const worker of workers) {
        ns.scp("fs/bin/hack.js", worker.hostname);
        const threads = Math.floor(worker.availableRam / ramCosts.hack);
        if (threads > 0) {
          ns.exec("fs/bin/hack.js", worker.hostname, threads, target);
        }
      }
    }

    if (toWeaken) {
      await ns.sleep(ns.getWeakenTime(serverInfo.hostname) + 1000);
    } else if (toGrow) {
      await ns.sleep(ns.getGrowTime(serverInfo.hostname) + 1000);
    } else {
      await ns.sleep(ns.getHackTime(serverInfo.hostname) + 1000);
    }
  }
}

export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
