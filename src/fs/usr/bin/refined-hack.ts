import { AutocompleteData, NS } from "@ns";
import { getWorkers, getTargets } from "fs/usr/lib/servers";
import { lockServer, releaseLocks } from "/fs/sbin/lib/lock";
import { getConstants } from "/fs/sbin/lib/constants";
import { distributeThreads } from "/fs/usr/lib/threads";
import { getDefer } from "/fs/lib/util/defer";
// import { colored } from "/fs/lib/util/print";
import { TargetServer } from "/fs/lib/types/servers";
import { convertMSToHHMMSS } from "/fs/lib/util/time";

// RAM COST: 11.35GB

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
    ns.print("[" + convertMSToHHMMSS(target.analysis.naive.weakenTime) + "]");

    last.target = target.hostname;
    last.playerBalance = player.money;
    last.hackDifficulty = target.hackDifficulty;
    last.targetBalance = target.moneyAvailable;
  };
}

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
    // const workersCopy = JSON.parse(JSON.stringify(workers));

    // For now, just reserve all the ram on each worker
    workers.forEach((w) => {
      lockServer(ns, {
        server: w.hostname,
        memory: w.availableRam,
      });
    });
    defer(() => releaseLocks.byProcess(ns));

    const totalAvailableRam = workers.reduce((a, b) => a + b.availableRam, 0);

    const scoredTargets = getTargets(ns, workers);
    const target = targetName
      ? scoredTargets.find((t) => t.hostname === targetName)
      : scoredTargets[0];

    if (!target) {
      ns.print(`Server '${targetName}' not found or not available.`);
      return;
    }

    printStatus(target);

    const fluffCost =
      target.analysis.threads.weaken.cost + target.analysis.threads.fluff.cost;

    const iterationsPossible = Math.min(
      1 +
        (totalAvailableRam - fluffCost) /
          target.analysis.threads.formulaicFarm.cost,
      250 // Hardcoded for now
    );

    const groupDelay = 500;
    const iterationsByTime = target.analysis.formulaic.weakenTime / groupDelay;

    const iterations = Math.floor(
      Math.min(iterationsPossible, iterationsByTime)
    );

    const steps = distributeThreads(ns, workers, target, {
      iterations,
      groupDelay,
    });

    // console.log(iterationsByTime, iterationsPossible);
    // console.log(workersCopy);
    // console.log(steps);
    // return;

    let lastWeakenPid = -1;

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
    await ns.sleep(
      target.analysis.naive.weakenTime + 1000 + groupDelay * iterations
    );
    while (lastWeakenPid > 0 && ns.isRunning(lastWeakenPid)) {
      await ns.sleep(1000);
    }
    purge();
  }
}

export function autocomplete(data: AutocompleteData) {
  return data.servers;
}
