import type { AutocompleteData, NS } from "@ns";
import { getWorkers } from "fs/usr/lib/servers";
import { colorText, timePrintTerminal } from "/fs/lib/util/print";
import { getServerFlatMap } from "/fs/lib/servers";

export async function main(ns: NS) {
  const target = (ns.args[0] as string) || "n00dles";
  if (
    !getServerFlatMap(ns)
      .map((server) => server.hostname)
      .includes(target)
  ) {
    ns.tprint(
      `${colorText.red("Error:")} ${colorText.yellow(
        target
      )} is not a valid server.`
    );
    return;
  }
  const workers = getWorkers(ns);

  for (const worker of workers) {
    const bombRam = ns.getScriptRam("fs/bin/bomb.js");
    const threads = Math.floor(worker.availableRam / bombRam);
    if (threads > 0)
      ns.exec("fs/bin/bomb.js", worker.hostname, threads, target, threads);
  }
  timePrintTerminal(
    ns,
    `Launching bomb against ${colorText.yellow(target)}...`
  );
}

export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
