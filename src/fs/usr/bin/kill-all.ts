// import { NS, ScriptArg, AutocompleteData } from "@ns";

// import { getServersApi } from "fs/lib/api/servers";
// export default function killServerProcesses(ns: NS, includeHome = false) {
//   const serversApi = getServersApi(ns);
//   const flatMap = serversApi.get.all.servers;
//   if (!flatMap.length) {
//     return;
//   }
//   flatMap.forEach((server) => {
//     if (server.hostname == "home" && !includeHome) {
//       return;
//     }
//     ns.killall(server.hostname, true);
//   });
// }
// export async function main(ns: NS) {
//   const f = ns.flags([
//     ["i", false],
//     ["includeHome", false],
//   ]);
//   const flagArgs = f._;
//   const s = flagArgs[0] || "";
//   const includeHome = f["i"] || f["includeHome"];
//   s == "" ? killServerProcesses(ns, includeHome) : ns.killall(s, true);
// }
// export function autocomplete(data: AutocompleteData, args: ScriptArg[]) {
//   return data.servers;
// }
