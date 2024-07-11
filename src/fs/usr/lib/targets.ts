import { NS, Server } from "@ns";
import type {
  AnalysisData,
  IndexableServer,
  TargetServer,
  WorkerServer,
} from "/fs/lib/types/servers";
import { getThreads } from "fs/usr/lib/threads";
import { getMock } from "fs/lib/servers";

export function analyzeTarget(ns: NS, target: Required<Server>): TargetServer {
  const naiveData = getAnalysisData(ns, target);
  const mockData = getMockData(ns, target);
  const hasApi = ns.fileExists("Formulas.exe", "home");

  return {
    ...target,
    analysis: {
      hasApi,
      threads: getThreads(ns, target.hostname),
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
  if (!ns.fileExists("Formulas.exe", "home"))
    return {
      hackChance: -1,
      weakenTime: -1,
      growTime: -1,
      hackTime: -1,
      score: -1,
    };
  const mock = getMock(ns, target);
  const player = ns.getPlayer();
  return {
    hackChance: ns.formulas.hacking.hackChance(mock, player),
    weakenTime: ns.formulas.hacking.weakenTime(mock, player),
    growTime: ns.formulas.hacking.growTime(mock, player),
    hackTime: ns.formulas.hacking.hackTime(mock, player),
    score: 0,
  };
}

function getAnalysisData(ns: NS, target: IndexableServer): AnalysisData {
  return {
    hackChance: ns.hackAnalyzeChance(target.hostname),
    weakenTime: ns.getWeakenTime(target.hostname),
    growTime: ns.getGrowTime(target.hostname),
    hackTime: ns.getHackTime(target.hostname),
    score: 0,
  };
}

export function scoreTargets(
  ns: NS,
  targets: TargetServer[],
  workers: WorkerServer[]
): TargetServer[] {
  const totalAvailableRam = workers.reduce(
    (acc, cur) => acc + cur.availableRam,
    0
  );
  return targets.map((target) => {
    const { moneyMax } = target;
    const { naive, formulaic, threads, hasApi } = target.analysis;

    const naiveScore = ((moneyMax / 2) * naive.hackChance) / naive.weakenTime;

    const output = {
      ...target,
      analysis: {
        ...target.analysis,
        naive: {
          ...naive,
          score: naiveScore,
        },
        formulaic: {
          ...formulaic,
          score: 0,
        },
      },
    };

    if (!hasApi) return output;

    const requiredRam =
      threads.formulaicFarm.cost + threads.fluff.cost + threads.weaken.cost;
    const ramPercentage = Math.min(1, totalAvailableRam / requiredRam);

    const formulaicScore =
      ((moneyMax / 2) * formulaic.hackChance * ramPercentage) /
      formulaic.weakenTime;

    output.analysis.formulaic.score = formulaicScore;

    return output;
  });
}
