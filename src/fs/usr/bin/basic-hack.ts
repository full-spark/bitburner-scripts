import { AutocompleteData, NS, Server } from "@ns";
import { getWorkers } from "fs/usr/lib/servers";
import { getConstants } from "/fs/sbin/lib/constants";

// RAM COST: 7.85GB

export async function main(ns: NS) {
  const targetName = ns.args[0] as string;
  if (targetName === "home") {
    ns.tprint(`Server '${targetName}' is your home server.`);
    return;
  }

  const CONSTANTS = getConstants(ns);
  const workers = getWorkers(ns);

  while (true) {
    const target = ns.getServer(targetName) as Required<Server>;

    if (!target) {
      ns.tprint(`Server '${target}' not found.`);
      return;
    }

    const toWeaken = target.hackDifficulty > target.minDifficulty;
    const toGrow = target.moneyAvailable < target.moneyMax;

    async function applyAction(action: "HACK" | "GROW" | "WEAKEN") {
      let file;
      let wait;

      switch (action) {
        case "HACK":
          file = CONSTANTS.binaryFiles.hack;
          wait = ns.getHackTime(target!.hostname) + 1000;
          break;
        case "GROW":
          file = CONSTANTS.binaryFiles.grow;
          wait = ns.getGrowTime(target!.hostname) + 1000;
          break;
        case "WEAKEN":
          file = CONSTANTS.binaryFiles.weaken;
          wait = ns.getWeakenTime(target!.hostname) + 1000;
          break;
      }

      for (const worker of workers) {
        const threads = Math.floor(
          worker.availableRam / CONSTANTS.binaryCosts.weaken
        );
        if (threads > 0) {
          ns.exec(file, worker.hostname, threads, target!.hostname);
        }
      }
      await ns.sleep(wait);
    }

    if (toWeaken) {
      await applyAction("WEAKEN");
    } else if (toGrow) {
      await applyAction("GROW");
    } else {
      await applyAction("HACK");
    }
  }
}

export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
