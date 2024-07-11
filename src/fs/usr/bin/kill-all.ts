import { NS, AutocompleteData } from "@ns";

import { getServerFlatMap } from "/fs/lib/servers";
export default function killServerProcesses(ns: NS, includeHome = false) {
  const flatMap = getServerFlatMap(ns);
  if (!flatMap.length) {
    return;
  }
  flatMap.forEach((server) => {
    if (server.hostname == "home" && !includeHome) {
      return;
    }
    ns.killall(server.hostname, true);
  });
}
export async function main(ns: NS) {
  const f = ns.flags([
    ["i", false],
    ["includeHome", false],
  ]);
  const flagArgs = f._ as string[];
  const server = flagArgs[0] || "";
  const includeHome =
    (f["i"] as boolean) || (f["includeHome"] as boolean) || false;
  server == ""
    ? killServerProcesses(ns, includeHome)
    : ns.killall(server, true);
}
export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
