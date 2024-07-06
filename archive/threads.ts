import { NS, Server } from "@ns";
import type { Threads } from "/fs/lib/types/servers";
import { getMock } from "fs/lib/servers";

/**
 * Naive thread calculations.
 * Without access to the Formulas API, we can't calculate the optimal number of threads to farm a server.
 * Until then, we can use these naive calculations to work with current data.
 */
export const calculateThreads = {
  weaken: (ns: NS, target: Required<Server>): Threads => {
    const threads = {
      hack: 0,
      grow: 0,
      weaken: Math.ceil((target.hackDifficulty - target.minDifficulty) / ns.weakenAnalyze(1)),
    };
    return {
      ...threads,
      cost: getThreadCost(ns, threads),
    };
  },
  fluff: (ns: NS, target: Required<Server>): Threads => {
    const growthMultiplier = target.moneyMax / Math.max(target.moneyAvailable, 0.01);
    const growThreads = Math.ceil(ns.growthAnalyze(target.hostname, growthMultiplier));
    const growSecurity = ns.growthAnalyzeSecurity(growThreads); // <============= TODO: Move this to text file
    const weakenThreads = Math.ceil(growSecurity / ns.weakenAnalyze(1)); // <============= TODO: Move this to text file
    const threads = {
      hack: 0,
      grow: growThreads,
      weaken: Math.ceil(weakenThreads),
    };
    return {
      ...threads,
      cost: getThreadCost(ns, threads),
    };
  },
  naiveFarm: (ns: NS, target: Required<Server>): Threads => {
    const hackThreads = Math.floor(ns.hackAnalyzeThreads(target.hostname, target.moneyMax / 2));
    const hackSecurity = ns.hackAnalyzeSecurity(hackThreads); // <============= TODO: Move this to text file
    const growThreads = Math.ceil(ns.growthAnalyze(target.hostname, target.moneyMax / 2));
    const growSecurity = ns.growthAnalyzeSecurity(growThreads);
    const weakenThreads = Math.ceil((hackSecurity + growSecurity) / ns.weakenAnalyze(1));
    const threads = {
      hack: hackThreads,
      grow: growThreads,
      weaken: weakenThreads,
    };
    return {
      ...threads,
      cost: getThreadCost(ns, threads),
    };
  },
  formulaicFarm: (ns: NS, target: Required<Server>): Threads => {
    // Check for formulas.exe
    if (!ns.fileExists("formulas.exe", "home")) {
      return { hack: -1, grow: -1, weaken: -1, cost: -1 };
    }

    const mock = getMock(ns, target);
    const player = ns.getPlayer();
    const hackPercent = ns.formulas.hacking.hackPercent(mock, player);
    const hackThreads = Math.floor(0.5 / hackPercent);
    const actualHackPercent = hackThreads * hackPercent;
    const hackSecurity = ns.hackAnalyzeSecurity(hackThreads);
    const growThreads = Math.ceil(
      ns.formulas.hacking.growThreads(mock, player, target.moneyMax * (1 - actualHackPercent))
    );
    const growSecurity = ns.growthAnalyzeSecurity(growThreads);
    const weakenThreads = Math.ceil((hackSecurity + growSecurity) / ns.weakenAnalyze(1));
    const threads = {
      hack: hackThreads,
      grow: growThreads,
      weaken: weakenThreads,
    };
    return {
      ...threads,
      cost: getThreadCost(ns, threads),
    };
  },
};

export const getThreadCost = (ns: NS, threads: Partial<Threads>) => {
  const costs = {
    hack: ns.getScriptRam("fs/bin/hack.js"),
    grow: ns.getScriptRam("fs/bin/grow.js"),
    weaken: ns.getScriptRam("fs/bin/weaken.js"),
  };
  return (
    (threads.hack || 0) * costs.hack +
    (threads.grow || 0) * costs.grow +
    (threads.weaken || 0) * costs.weaken
  );
};

export const batchThreads = (ns: NS, servers: Required<Server>[], threads: Threads) => {
  /**
   * Batch threads across multiple servers.
   * This function will distribute the threads across the servers in the most optimal way.
   * If there is not enough RAM to run all threads, it will group them such that the most "batches" are run.
   * "Batches" are a group of threads that can be run safely such that, if only some batches are run and not all,
   * the server will still be weakened and fluffed.
   */
};
