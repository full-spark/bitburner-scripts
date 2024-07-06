import { NS, Server } from "@ns";
import { readJsonFile, writeJsonFile } from "fs/sbin/lib/file";
import { getServerFlatMap } from "/fs/lib/servers";

const SERVER_STATE_FILE = "var/state/servers.json.txt";

type ServerStateFileType = Record<string, Required<Server>>;

export function setServerState(ns: NS): ServerStateFileType {
  const servers = getServerFlatMap(ns, (server: string) => {
    return ns.getServer(server) as Required<Server>;
  }).reduce((acc, server) => {
    acc[server.hostname] = server;
    return acc;
  }, {} as ServerStateFileType);
  writeJsonFile(ns, SERVER_STATE_FILE, servers);
  return servers;
}

export function getServerState(ns: NS): ServerStateFileType {
  // if we did this (I'd love to), we'd always incur the GB cost of the set function.
  //   return readJsonFile(ns, SERVER_STATE_FILE) ?? setServerState(ns);
  const state = readJsonFile<ServerStateFileType>(ns, SERVER_STATE_FILE);
  if (!state) {
    throw new Error(
      "Server state not found. Consider running `setServerState`."
    );
  }
  return state;
}
