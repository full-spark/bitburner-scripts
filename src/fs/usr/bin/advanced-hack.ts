import type { NS } from "@ns";
import type { Step } from "fs/usr/lib/threads";
import { chunkThreads } from "fs/usr/lib/threads";
import { getWorkers, getTargets } from "fs/usr/lib/servers";
import { TargetServer, WorkerServer } from "/fs/lib/types/servers";
import { getConstants } from "/fs/sbin/lib/constants";
import { getDefer } from "/fs/lib/util/defer";
import { lockServer, releaseLocks } from "/fs/sbin/lib/lock";
import { convertMSToHHMMSS } from "/fs/lib/util/time";

// import * as lib from "/fs/lib/util/index";

export async function main(ns: NS) {
  const targetName = ns.args[0] as string;
  if (targetName && targetName === "home") {
    ns.tprint(`Server '${targetName}' is your home server.`);
    return;
  }

  const CONSTANTS = getConstants(ns);
  const printStatus = getStatusPrinter(ns);
  const { defer, purge } = getDefer(ns);

  while (true) {
    const workers = getWorkers(ns);
    const totalAvailableRam = workers.reduce(
      (total, w) => total + w.availableRam,
      0
    );

    // For now, just reserve all the ram on each worker
    workers.forEach((w) => {
      lockServer(ns, {
        server: w.hostname,
        memory: w.availableRam,
      });
    });
    defer(() => releaseLocks.byProcess(ns));

    const scoredTargets = getTargets(ns, workers);
    const target = targetName
      ? scoredTargets.find((t) => t.hostname === targetName)
      : scoredTargets[0];

    if (!target) {
      ns.print(`Server '${targetName}' not found or not available.`);
      return;
    }
    printStatus(target);
    // console.log(JSON.parse(JSON.stringify(workers)));
    const maxIterations = Math.floor(
      (totalAvailableRam -
        target.analysis.threads.fluff.cost -
        target.analysis.threads.weaken.cost) /
        target.analysis.threads.farm.cost
    );
    let lastWeakenPid = 0;
    let iters = 0;
    for (let i = 0; i < maxIterations; i++) {
      const steps = getSteps(ns, workers, target, 500 * i);
      //   console.log(steps);
      if (steps.length === 0) {
        break;
      }
      iters += 1;

      steps.forEach((step) => {
        let script;
        switch (step.action) {
          case "WEAKEN":
            script = CONSTANTS.binaryFiles.weaken;
            break;
          case "GROW":
            script = CONSTANTS.binaryFiles.grow;
            break;
          case "HACK":
            script = CONSTANTS.binaryFiles.hack;
            break;
        }
        const pid = ns.exec(
          script,
          step.worker,
          step.threads,
          ...[target.hostname, step.threads, step.delay]
        );

        if (step.action === "WEAKEN") {
          lastWeakenPid = pid;
        }
      });
    }
    const waitTime = target.analysis.naive.weakenTime + 500 * iters;
    ns.print(
      `Waiting for ${convertMSToHHMMSS(waitTime)}... (${iters} iterations)`
    );
    await ns.sleep(waitTime);
    while (lastWeakenPid > 0 && ns.isRunning(lastWeakenPid)) {
      await ns.sleep(1000);
    }
    purge();
  }
}

function getSteps(
  ns: NS,
  workers: WorkerServer[],
  target: TargetServer,
  extraDelay: number = 0
): Step[] {
  let steps: Step[] = [];
  const CONSTANTS = getConstants(ns);

  const updateWorkerRam = (worker: WorkerServer, steps: Step[]) => {
    steps.forEach((step) => {
      switch (step.action) {
        case "WEAKEN":
          worker.availableRam -=
            step.threads * ns.getScriptRam(CONSTANTS.binaryFiles.weaken);
          break;
        case "GROW":
          worker.availableRam -=
            step.threads * ns.getScriptRam(CONSTANTS.binaryFiles.grow);
          break;
        case "HACK":
          worker.availableRam -=
            step.threads * ns.getScriptRam(CONSTANTS.binaryFiles.hack);
          break;
      }
    });
  };

  // WEAKEN
  const weakenStage = chunkThreads(
    ns,
    target,
    target.analysis.threads.weaken,
    extraDelay
  );
  while (workers.length > 0 && !weakenStage.isComplete()) {
    const worker = workers.shift();
    if (!worker) break;
    // console.log(worker.hostname, worker.availableRam);
    const weakenSteps = weakenStage.assignThreads(worker);
    updateWorkerRam(worker, weakenSteps);
    steps = steps.concat(weakenSteps);
    if (weakenStage.isComplete()) workers.unshift(worker);
  }

  // FLUFF
  const fluffStage = chunkThreads(
    ns,
    target,
    target.analysis.threads.fluff,
    extraDelay
  );
  while (workers.length > 0 && !fluffStage.isComplete()) {
    const worker = workers.shift();
    if (!worker) break;
    // console.log(worker.hostname, worker.availableRam);
    const fluffSteps = fluffStage.assignThreads(worker);
    updateWorkerRam(worker, fluffSteps);
    steps = steps.concat(fluffSteps);
    if (fluffStage.isComplete()) workers.unshift(worker);
  }

  // FARM
  const farmStage = chunkThreads(
    ns,
    target,
    target.analysis.threads.farm,
    extraDelay
  );
  while (workers.length > 0 && !farmStage.isComplete()) {
    const worker = workers.shift();
    if (!worker) break;
    // console.log(worker.hostname, worker.availableRam);
    const farmSteps = farmStage.assignThreads(worker);
    updateWorkerRam(worker, farmSteps);
    steps = steps.concat(farmSteps);
    if (farmStage.isComplete()) workers.unshift(worker);
  }

  return steps;
}

function getStatusPrinter(ns: NS): (target: TargetServer) => void {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const last = {
    target: "",
    playerBalance: -1,
    hackDifficulty: -1,
    targetBalance: -1,
  };

  return (target: TargetServer) => {
    /****
     * $10.00b [+ $]
     * $50.00m / $250.00m (20.00%) [+/- $]
     * 10 / 8 (+0) [+/- sec]
     */
    ns.clearLog();
    const player = ns.getPlayer();
    // const playerProfit = player.money > last.playerBalance;

    const prints = {
      playerBalance: `$${ns.formatNumber(player.money)}`,
      playerBalanceDiff:
        last.playerBalance === -1 || last.target !== target.hostname
          ? ""
          : ` [${
              last.playerBalance > player.money ? "-" : "+"
            }$${ns.formatNumber(Math.abs(last.playerBalance - player.money))}]`,
      hackDifficulty: `${ns.formatNumber(
        target.hackDifficulty
      )} / ${ns.formatNumber(target.minDifficulty)}`,
      hackDifficultyDiff:
        last.hackDifficulty === -1 || last.target !== target.hostname
          ? ""
          : ` [${
              last.hackDifficulty > target.hackDifficulty ? "-" : "+"
            }${ns.formatNumber(
              Math.abs(last.hackDifficulty - target.hackDifficulty)
            )}]`,
      targetBalance: `$${ns.formatNumber(
        target.moneyAvailable
      )} / $${ns.formatNumber(target.moneyMax)} (${ns.formatPercent(
        target.moneyAvailable / target.moneyMax
      )})`,
      targetBalanceDiff:
        last.targetBalance === -1 || last.target !== target.hostname
          ? ""
          : ` [${
              last.targetBalance > target.moneyAvailable ? "-" : "+"
            }$${ns.formatNumber(
              Math.abs(last.targetBalance - target.moneyAvailable)
            )}]`,
    };
    ns.print(`=== ${target.hostname} ===`);
    ns.print(prints.playerBalance + prints.playerBalanceDiff);
    ns.print(prints.targetBalance + prints.targetBalanceDiff);
    ns.print(prints.hackDifficulty + prints.hackDifficultyDiff);
    // ns.print("[" + convertMSToHHMMSS(target.analysis.naive.weakenTime) + "]");

    last.target = target.hostname;
    last.playerBalance = player.money;
    last.hackDifficulty = target.hackDifficulty;
    last.targetBalance = target.moneyAvailable;
  };
}
