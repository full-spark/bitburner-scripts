import { NS, Server } from "@ns";
import type { AnalysisData, IndexableServer, TargetServer } from "/fs/lib/types/servers";
import { calculateThreads } from "fs/usr/lib/threads";
import { getMock } from "fs/lib/servers";

export function analyzeTarget(ns: NS, target: Required<Server>): TargetServer {
  const naiveData = getAnalysisData(ns, target);
  const mockData = getMockData(ns, target);
  return {
    ...target,
    analysis: {
      hasApi: ns.fileExists("formulas.exe", "home"),
      threads: {
        weaken: calculateThreads.weaken(ns, target),
        fluff: calculateThreads.fluff(ns, target),
        naiveFarm: calculateThreads.naiveFarm(ns, target),
        formulaicFarm: calculateThreads.formulaicFarm(ns, target),
      },
      naive: {
        // Only data we have access to with current server/player data.
        ...naiveData,
      },
      formulaic: {
        // Data taken with Formulas API using best-case scenario data.
        ...mockData,
      },
    },
  };
}

function getMockData(ns: NS, target: IndexableServer): AnalysisData {
  if (!ns.fileExists("formulas.exe", "home"))
    return {
      hackChance: -1,
      weakenTime: -1,
    };
  const mock = getMock(ns, target);
  const player = ns.getPlayer();
  return {
    hackChance: ns.formulas.hacking.hackChance(mock, player),
    weakenTime: ns.formulas.hacking.weakenTime(mock, player),
  };
}

function getAnalysisData(ns: NS, target: IndexableServer): AnalysisData {
  return {
    hackChance: ns.hackAnalyzeChance(target.hostname),
    weakenTime: ns.getWeakenTime(target.hostname),
  };
}
