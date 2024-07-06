import { AutocompleteData, NS } from "@ns";
import { getServerMap } from "/fs/lib/servers";
import { colored } from "/fs/lib/util/print";

export function findServerConnect(ns: NS, name?: string): void {
  if (name === "home") {
    ns.tprint(`\n${colored("yellow", "home")} - connect home;`);
    return;
  }
  const serverMap = getServerMap(ns);
  if (name && !(name in serverMap.parents)) {
    ns.tprint(colored("yellow", `Cannot locate server '${name}'.`));
    return;
  }
  const servers = name
    ? [name]
    : ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"];
  let output = "";

  function recurse(name: string): string {
    const parent = serverMap.parents[name][0];
    return parent === "home" // all roads lead to home
      ? `connect home; connect ${name};`
      : `${recurse(parent)} connect ${name};`;
  }

  servers.forEach((server) => {
    output += `\n${colored("yellow", server)} - ${recurse(server)}`;
  });
  ns.tprint(output);
}

export async function main(ns: NS) {
  const target = ns.args[0] as string;
  findServerConnect(ns, target);
  ns.exit();
}

export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
