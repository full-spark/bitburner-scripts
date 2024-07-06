import { NS, Server } from "@ns";
import { getServerFlatMap, unlockServer } from "/fs/lib/servers";
import { analyzeTarget } from "fs/usr/lib/targets";
import { measureLocks } from "/fs/sbin/lib/lock";
import type { TargetServer, WorkerServer } from "/fs/lib/types/servers";

export function getServers(ns: NS) {
  return getServerFlatMap(ns, (server: string) => {
    return ns.getServer(server) as Required<Server>;
  });
}

export function getWorkers(ns: NS, minRam: number = 4): WorkerServer[] {
  const flatmap = getServerFlatMap(ns, (server: string) => {
    unlockServer(ns, server);
    return ns.getServer(server) as Required<Server>;
  })
    .filter((server) => server.hasAdminRights)
    .map((server) => {
      const reservedRam = measureLocks.byServer(ns, server.hostname);
      return {
        ...server,
        availableRam: server.maxRam - reservedRam,
        locks: { reservedRam },
      };
    })
    .filter((server) => server.availableRam >= minRam) as WorkerServer[];
  return flatmap;
}

export function getTargets(ns: NS): TargetServer[] {
  const searchCriteria = (server: Required<Server>) => {
    return (
      !server.purchasedByPlayer &&
      server.hostname !== "home" &&
      server.hasAdminRights &&
      server.moneyMax > 0
    );
  };
  const flatmap = getServerFlatMap(ns, (server: string) => {
    unlockServer(ns, server);
    return ns.getServer(server) as Required<Server>;
  })
    .filter(searchCriteria)
    .map((server) => analyzeTarget(ns, server));
  return flatmap;
}

export function scpBinaries(ns: NS, servers: Required<Server>[]) {
  servers
    .filter((server) => server.hostname !== "home")
    .forEach((server) => {
      ns.scp(ns.ls("home", "fs/bin/"), server.hostname);
    });
}
