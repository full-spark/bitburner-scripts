import { NS } from "@ns";
import { getConstants } from "/fs/sbin/lib/constants";
import { getServerState } from "/fs/sbin/lib/state/servers";
import type { Threads, Stages } from "/fs/lib/types/servers";
import { getMock } from "fs/lib/servers";

export function getThreads(ns: NS, target: string): Stages {
  const constants = getConstants(ns);

  const serverState = getServerState(ns)[target];

  const stages: Stages = {
    weaken: {
      threads: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      cost: 0,
    },
    fluff: {
      threads: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      ratios: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      cost: 0,
    },
    farm: {
      threads: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      ratios: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      cost: 0,
    },
    formulaicFarm: {
      threads: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      ratios: {
        weaken: 0,
        grow: 0,
        hack: 0,
      },
      cost: 0,
    },
  };

  // ============================
  // Weaken Stage
  stages.weaken.threads.weaken = Math.ceil(
    (serverState.hackDifficulty - serverState.minDifficulty) /
      constants.securityChanges.weaken
  );

  stages.weaken.cost =
    constants.binaryCosts.weaken * stages.weaken.threads.weaken;

  // ============================
  // Fluff stage
  stages.fluff.threads.grow = Math.ceil(
    ns.growthAnalyze(target, serverState.moneyMax / serverState.moneyAvailable)
  );

  stages.fluff.threads.weaken = Math.ceil(
    (stages.fluff.threads.grow * constants.securityChanges.grow) /
      constants.securityChanges.weaken
  );

  stages.fluff.ratios = getWeakenRatios(ns, 0, stages.fluff.threads.grow);

  stages.fluff.cost =
    constants.binaryCosts.grow * stages.fluff.threads.grow +
    constants.binaryCosts.weaken * stages.fluff.threads.weaken;

  // ============================
  // Farm stage
  stages.farm.threads.hack = Math.ceil(
    ns.hackAnalyzeThreads(
      target,
      Math.ceil((serverState.moneyAvailable - serverState.moneyMax) / 2)
    )
  );

  if (stages.farm.threads.hack < 0) {
    // this happens if the server doesn't have at least half funds
    return stages;
  }

  // Include security offset from hacking in how much to grow
  // since higher security hinders server growth
  stages.farm.threads.grow = Math.ceil(
    ns.growthAnalyze(target, 2) *
      ((serverState.hackDifficulty +
        stages.farm.threads.hack * constants.securityChanges.hack) /
        serverState.hackDifficulty)
  );

  stages.farm.threads.weaken = Math.ceil(
    (stages.farm.threads.grow * constants.securityChanges.grow +
      stages.farm.threads.hack * constants.securityChanges.hack) /
      constants.securityChanges.weaken
  );

  stages.farm.ratios = getWeakenRatios(
    ns,
    stages.farm.threads.hack,
    stages.farm.threads.grow
  );

  stages.farm.cost =
    constants.binaryCosts.grow * stages.farm.threads.grow +
    constants.binaryCosts.weaken * stages.farm.threads.weaken +
    constants.binaryCosts.hack * stages.farm.threads.hack;

  // ============================
  // Formulaic Farm stage

  if (!ns.fileExists("formulas.exe", "home")) {
    return stages;
  }

  const mock = getMock(ns, serverState);
  const player = ns.getPlayer();
  const hackPercent = ns.formulas.hacking.hackPercent(mock, player);
  const hackThreads = Math.floor(0.5 / hackPercent);
  const actualHackPercent = hackThreads * hackPercent;
  const hackSecurity = ns.hackAnalyzeSecurity(hackThreads);
  const growThreads = Math.ceil(
    ns.formulas.hacking.growThreads(
      mock,
      player,
      serverState.moneyMax * (1 - actualHackPercent)
    )
  );
  const growSecurity = ns.growthAnalyzeSecurity(growThreads);
  const weakenThreads = Math.ceil(
    (hackSecurity + growSecurity) / ns.weakenAnalyze(1)
  );
  stages.formulaicFarm.threads = {
    weaken: weakenThreads,
    grow: growThreads,
    hack: hackThreads,
  };

  stages.formulaicFarm.ratios = getWeakenRatios(
    ns,
    stages.formulaicFarm.threads.hack,
    stages.formulaicFarm.threads.grow
  );

  stages.formulaicFarm.cost =
    constants.binaryCosts.grow * stages.formulaicFarm.threads.grow +
    constants.binaryCosts.weaken * stages.formulaicFarm.threads.weaken +
    constants.binaryCosts.hack * stages.formulaicFarm.threads.hack;

  return stages;
}

/**
 * Calculates the ratios in which weaken/grow/hack threads should be
 * distributed to maintain a minimum security level and max growth.
 *
 * @param {NS} ns
 * @param {number} hackThreadCount
 * @param {number} growThreadCount
 * @return {Threads}  thread ratios
 */
function getWeakenRatios(
  ns: NS,
  hackThreadCount: number,
  growThreadCount: number
): Threads {
  if (hackThreadCount === 0 && growThreadCount === 0) {
    return {
      weaken: 0,
      grow: 0,
      hack: 0,
    };
  }
  const constants = getConstants(ns);

  if (hackThreadCount === 0) {
    const weakenThreadCount = Math.ceil(
      (growThreadCount * constants.securityChanges.grow) /
        constants.securityChanges.weaken
    );
    const growRatio = growThreadCount / weakenThreadCount;
    return {
      weaken: 1,
      grow: Math.ceil(growRatio),
      hack: 0,
    };
  }

  const totalSecIncrease =
    growThreadCount * constants.securityChanges.grow +
    hackThreadCount * constants.securityChanges.hack;
  const weakenThreadCount = Math.ceil(
    totalSecIncrease / constants.securityChanges.weaken
  );
  let hackRatio = hackThreadCount / weakenThreadCount;
  let growRatio = growThreadCount / weakenThreadCount;
  let weakenRatio = 1;

  if (hackRatio < 1) {
    growRatio = growRatio / hackRatio;
    weakenRatio = weakenRatio / hackRatio;
    hackRatio = 1;
  }

  return {
    weaken: Math.ceil(weakenRatio),
    grow: Math.ceil(growRatio),
    hack: Math.floor(hackRatio),
  };
}
