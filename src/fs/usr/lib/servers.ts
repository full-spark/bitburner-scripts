import { NS, Server } from "@ns";
import { getServerFlatMap, unlockServer } from "/fs/lib/servers";
import { analyzeTarget, scoreTargets } from "fs/usr/lib/targets";
import { measureLocks } from "/fs/sbin/lib/lock";
import type { TargetServer, WorkerServer } from "/fs/lib/types/servers";

export function getServers(ns: NS) {
  return getServerFlatMap(ns, (server: string) => {
    return ns.getServer(server) as Required<Server>;
  });
}

export function getWorkers(ns: NS, minRam: number = 4): WorkerServer[] {
  let largestRam = 0;
  const flatmap = getServerFlatMap(ns, (server: string) => {
    unlockServer(ns, server);
    return ns.getServer(server) as Required<Server>;
  })
    .filter((server) => server.hasAdminRights)
    .map((server) => {
      largestRam = Math.max(largestRam, server.maxRam);
      const reservedRam = measureLocks.byServer(ns, server.hostname);
      return {
        ...server,
        availableRam: server.maxRam - reservedRam,
        locks: { reservedRam },
      };
    })
    .filter((server) => {
      // console.log(server.hostname, server.availableRam);
      return server.availableRam >= minRam && server.maxRam > largestRam * 0.01;
    }) as WorkerServer[];
  scpBinaries(ns, flatmap);
  return flatmap.sort((a, b) => b.availableRam - a.availableRam);
}

export function getTargets(ns: NS, workers: WorkerServer[]): TargetServer[] {
  const player = ns.getPlayer();
  const searchCriteria = (server: Required<Server>) => {
    return (
      !server.purchasedByPlayer &&
      server.hostname !== "home" &&
      server.hasAdminRights &&
      server.moneyMax > 0 &&
      player.skills.hacking >= server.requiredHackingSkill
    );
  };
  const flatmap = getServerFlatMap(ns, (server: string) => {
    unlockServer(ns, server);
    return ns.getServer(server) as Required<Server>;
  })
    .filter(searchCriteria)
    .map((server) => analyzeTarget(ns, server));
  return scoreTargets(ns, flatmap, workers).sort((a, b) => {
    return a.analysis.hasApi
      ? b.analysis.formulaic.score - a.analysis.formulaic.score
      : b.analysis.naive.score - a.analysis.naive.score;
  });
}

export function scpBinaries(ns: NS, servers: Required<Server>[]) {
  servers
    .filter((server) => server.hostname !== "home")
    .forEach((server) => {
      ns.scp(ns.ls("home", "fs/bin/"), server.hostname);
    });
}
