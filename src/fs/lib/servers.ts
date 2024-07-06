import { NS } from "@ns";
import { IndexableServer } from "/fs/lib/types/servers";

/**
 * When a user calls the `scan` function on a server, it returns an array of all the servers connected to it.
 * This lists the parent of the current server (if it exists) and the child servers in which the current server is the parent.
 * This function will recursively loop over the connected servers and call the `onPair` function on each parent/child pair if provided.
 * It will also call the `onItself` function on the current server if provided.
 *
 * @param ns The netscript object passed in by the game
 * @param {Function} [onPair] (Optional) A function that will be called on each parent/child pair once
 * @param {Function} [onItself] (Optional) A function that will be called on each server once
 */
export function depthFirstSearch(
  ns: NS,
  // onPair: Function | null = (child: string, parent: string) => {},
  onPair?: ((child: string, parent: string) => void) | null,
  onItself?: ((server: string) => void) | null
) {
  const search = (server: string, parent: string) => {
    onItself && onItself(server);
    ns.scan(server).forEach((child) => {
      if (child != parent) {
        onPair && onPair(child, server);
        search(child, server);
      }
    });
  };
  search("home", "home");
}

/**
 * Brute forces all ports on a server (not home).
 * @param ns The netscript object passed in by the game
 * @param server The name of the server to unlock
 */
export function unlockServer(ns: NS, server: string) {
  if (server === "home") return;
  [
    ns.brutessh,
    ns.ftpcrack,
    ns.relaysmtp,
    ns.sqlinject,
    ns.httpworm,
    ns.nuke,
  ].forEach((porthack) => {
    try {
      porthack(server);
    } catch {
      // Intentionally do nothing
    }
  });
}

/**
 * Attempts to unlock all servers in the game.
 * @param ns The netscript object passed in by the game
 */
export function unlockAllServers(ns: NS) {
  depthFirstSearch(ns, null, (server: string) => {
    unlockServer(ns, server);
  });
}

/**
 * Gathers a flat map of all servers in the game.
 * @param ns The netscript object passed in by the game
 * @param infoFunc (Optional) A function that will be called on each server to get additional information
 * @returns An array of all servers in the game
 */
export function getServerFlatMap<InfoType>(
  ns: NS,
  infoFunc: (server: string) => InfoType = () => {
    return {} as InfoType;
  }
) {
  type ServerFlatMapType = {
    hostname: string;
  } & InfoType;
  const servers: ServerFlatMapType[] = [];
  depthFirstSearch(ns, null, (server: string) => {
    servers.push({ hostname: server, ...infoFunc(server) });
  });
  return servers;
}

/**
 * Gathers a tree of all servers in the game.
 * @param ns The netscript object passed in by the game
 * @param infoFunc (Optional) A function that will be called on each server to get additional information
 * @returns A tree of all servers in the game with any additional information provided by the `infoFunc` argument
 */
export function getServerMap<InfoType>(
  ns: NS,
  infoFunc: (server: string) => InfoType = () => {
    return {} as InfoType;
  }
) {
  type ServerMapType = {
    hostname: string;
  } & InfoType & { children: Record<string, ServerMapType> };
  const parents: Record<string, string[]> = {};
  const children: Record<string, string[]> = {};
  const addToServerDumps = (child: string, parent: string) => {
    // key is parent, value is array of children
    if (parent in children) {
      children[parent].push(child);
    } else {
      children[parent] = [child];
    }
    if (!(child in children)) children[child] = [];

    // key is child, value is parent
    if (child in parents) {
      parents[child].push(parent);
    } else {
      parents[child] = [parent];
    }
    if (!(parent in parents)) parents[parent] = [];
  };

  depthFirstSearch(ns, addToServerDumps);

  const recurse = (server: string) => {
    const output = {
      hostname: server,
      ...infoFunc(server),
      children: {},
    } as ServerMapType;

    if (server in children) {
      children[server].forEach((child: string) => {
        output.children[child] = recurse(child);
      });
    }

    return output;
  };

  return { tree: recurse("home").children, parents, children };
}

export function getMock(ns: NS, server: IndexableServer) {
  const mock = ns.formulas.mockServer() as IndexableServer;

  for (const key in server) {
    mock[key] = server[key];
  }

  mock.hackDifficulty = mock.minDifficulty;
  mock.moneyAvailable = mock.moneyMax;
  return mock;
}
