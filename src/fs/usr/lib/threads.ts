import type { NS, Server } from "@ns";
import { getConstants } from "/fs/sbin/lib/constants";
// import { getServerState } from "/fs/sbin/lib/state/servers";
import type {
  Threads,
  Stages,
  WorkerServer,
  TargetServer,
  Stage,
} from "/fs/lib/types/servers";
import { getMock } from "fs/lib/servers";

export function getThreads(ns: NS, target: string): Stages {
  const constants = getConstants(ns);

  const serverState = ns.getServer(target) as Required<Server>;

  const stages: Stages = {
    weaken: {
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

  stages.weaken.ratios = {
    weaken: 1,
    grow: 0,
    hack: 0,
  };

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
  // Formulaic Farm stage
  if (ns.fileExists("Formulas.exe", "home")) {
    const mock = getMock(ns, serverState);
    const player = ns.getPlayer();
    const hackPercent = ns.formulas.hacking.hackPercent(mock, player);
    const hackThreads = hackPercent > 0 ? Math.floor(0.5 / hackPercent) : 0;
    const actualHackPercent = hackThreads * hackPercent;
    const hackSecurity = hackThreads * constants.securityChanges.hack;
    mock.moneyAvailable = mock.moneyMax * actualHackPercent;
    const growThreads = Math.ceil(
      ns.formulas.hacking.growThreads(mock, player, mock.moneyMax)
    );
    mock.moneyAvailable = mock.moneyMax;
    const growSecurity = growThreads * constants.securityChanges.grow;
    const weakenThreads = Math.ceil(
      (hackSecurity + growSecurity) / constants.securityChanges.weaken
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
  }

  // ============================
  // Farm stage
  stages.farm.threads.hack = Math.floor(
    ns.hackAnalyzeThreads(target, serverState.moneyMax / 2)
  );

  if (stages.farm.threads.hack < 0) {
    // this happens if the server doesn't have at least half funds
    stages.farm.threads.hack = 0;
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
      weaken: 1,
      grow: 0,
      hack: 0,
    };
  }
  const CONSTANTS = getConstants(ns);

  if (hackThreadCount === 0) {
    const weakenThreadCount = Math.ceil(
      (growThreadCount * CONSTANTS.securityChanges.grow) /
        CONSTANTS.securityChanges.weaken
    );
    const growRatio = growThreadCount / weakenThreadCount;
    return {
      weaken: 1,
      grow: Math.ceil(growRatio),
      hack: 0,
    };
  }

  const totalSecIncrease =
    growThreadCount * CONSTANTS.securityChanges.grow +
    hackThreadCount * CONSTANTS.securityChanges.hack;
  const weakenThreadCount = Math.ceil(
    totalSecIncrease / CONSTANTS.securityChanges.weaken
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

export type Step = {
  worker: string;
  action: "HACK" | "GROW" | "WEAKEN";
  threads: number;
  delay: number;
};

/**
 * Distributes threads among workers in a manner that evenly hacks, grows, and weakens
 * @param ns
 * @param workers
 * @param threads
 */
export function distributeThreads(
  ns: NS,
  workers: WorkerServer[],
  target: TargetServer,
  config = {
    iterations: 1,
    groupDelay: 1000,
  }
): Step[] {
  const CONSTANTS = getConstants(ns);
  const steps: Step[] = [];
  const workersCopy = workers.slice();

  for (let i = 0; i < config.iterations; i++) {
    const analysisCopy = JSON.parse(JSON.stringify(target.analysis));
    let totalThreadsLeft =
      analysisCopy.threads.weaken.threads.weaken +
      analysisCopy.threads.fluff.threads.weaken +
      analysisCopy.threads.fluff.threads.grow +
      analysisCopy.threads.farm.threads.weaken +
      analysisCopy.threads.farm.threads.grow +
      analysisCopy.threads.farm.threads.hack;

    while (workersCopy.length > 0 && totalThreadsLeft > 0) {
      const worker = workersCopy.shift();
      if (!worker) break;

      const inWeakenStage = analysisCopy.threads.weaken.threads.weaken > 0;
      const needsFluff =
        analysisCopy.threads.fluff.threads.weaken +
          analysisCopy.threads.fluff.threads.grow >
        0;
      const inFluffStage = !inWeakenStage && needsFluff;

      const chunk: Threads = {
        weaken: 0,
        grow: 0,
        hack: 0,
      };

      function calculateStep(action: "HACK" | "GROW" | "WEAKEN") {
        function getActionInfo(
          action: "HACK" | "GROW" | "WEAKEN",
          threads: Threads
        ) {
          switch (action) {
            case "HACK":
              return {
                cost: CONSTANTS.binaryCosts.hack,
                actionThreads: threads.hack,
              };
            case "GROW":
              return {
                cost: CONSTANTS.binaryCosts.grow,
                actionThreads: threads.grow,
              };
            case "WEAKEN":
              return {
                cost: CONSTANTS.binaryCosts.weaken,
                actionThreads: threads.weaken,
              };
          }
        }
        return (
          worker: WorkerServer,
          threads: Threads,
          delay = 0
        ): { worker: WorkerServer | null; threadsAssigned: number } => {
          const { cost, actionThreads } = getActionInfo(action, threads);
          if (actionThreads === 0) return { worker, threadsAssigned: 0 };
          const workerActionCapacity = Math.floor(worker.availableRam / cost);
          const threadsToAssign = Math.min(workerActionCapacity, actionThreads);
          if (threadsToAssign < 1) return { worker: null, threadsAssigned: 0 };
          steps.push({
            worker: worker.hostname,
            action,
            threads: threadsToAssign,
            delay: delay + config.groupDelay * i,
          });
          worker.availableRam -= threadsToAssign * cost;
          if (workerActionCapacity === actionThreads) {
            return { worker: null, threadsAssigned: threadsToAssign };
          }
          return { worker, threadsAssigned: threadsToAssign };
        };
      }

      if (inWeakenStage) {
        // Work through weaken stage

        // Assign weaken threads to worker. If worker can take all, unshift worker.
        const { worker: weakenWorker, threadsAssigned } = calculateStep(
          "WEAKEN"
        )(worker, analysisCopy.threads.weaken.threads);
        analysisCopy.threads.weaken.threads.weaken -= threadsAssigned;
        if (weakenWorker) {
          workersCopy.unshift(weakenWorker);
        }
      } else if (inFluffStage) {
        // Work through fluff stage

        if (chunk.weaken + chunk.grow <= 0) {
          // Reset chunk
          chunk.weaken = Math.max(
            Math.min(
              analysisCopy.threads.fluff.ratios.weaken,
              analysisCopy.threads.fluff.threads.weaken
            ),
            0
          );
          chunk.grow = Math.max(
            Math.min(
              analysisCopy.threads.fluff.ratios.grow,
              analysisCopy.threads.fluff.threads.grow
            ),
            0
          );
        }

        // Assign weaken threads to worker. If worker can't take all, continue.
        const { worker: weakenWorker, threadsAssigned: weakenThreadsAssigned } =
          calculateStep("WEAKEN")(worker, chunk, config.groupDelay * 0.3);
        chunk.weaken -= weakenThreadsAssigned;
        analysisCopy.threads.fluff.threads.weaken -= weakenThreadsAssigned;
        if (!weakenWorker) continue;

        // Assign grow threads to worker. If worker can take all, unshift worker.
        const { worker: growWorker, threadsAssigned: growThreadsAssigned } =
          calculateStep("GROW")(
            weakenWorker,
            chunk,
            config.groupDelay * 0.25 +
              (target.analysis.naive.weakenTime -
                target.analysis.naive.growTime)
          );
        chunk.grow -= growThreadsAssigned;
        analysisCopy.threads.fluff.threads.grow -= growThreadsAssigned;
        if (growWorker) {
          workersCopy.unshift(growWorker);
        }
      } else {
        // Work through farm stage

        // If we have the formulas API, we can and should use the formulaicFarm
        // If we don't, we shouldn't hack until fluff if fully completed.

        if (chunk.weaken + chunk.grow + chunk.hack <= 0) {
          chunk.weaken = Math.max(
            Math.min(
              analysisCopy.threads.farm.ratios.weaken,
              analysisCopy.threads.farm.threads.weaken
            ),
            0
          );
          chunk.grow = Math.max(
            Math.min(
              analysisCopy.threads.farm.ratios.grow,
              analysisCopy.threads.farm.threads.grow
            ),
            0
          );
          chunk.hack = Math.max(
            Math.min(
              analysisCopy.threads.farm.ratios.hack,
              analysisCopy.threads.farm.threads.hack
            ),
            0
          );
        }

        // Assign weaken threads to worker. If worker can't take all, continue.
        const { worker: weakenWorker, threadsAssigned: weakenThreadsAssigned } =
          calculateStep("WEAKEN")(worker, chunk, config.groupDelay * 0.6);
        chunk.weaken -= weakenThreadsAssigned;
        analysisCopy.threads.farm.threads.weaken -= weakenThreadsAssigned;
        if (!weakenWorker) continue;

        // Assign grow threads to worker. If worker can't take all, continue.
        const { worker: growWorker, threadsAssigned: growThreadsAssigned } =
          calculateStep("GROW")(
            weakenWorker,
            chunk,
            config.groupDelay * 0.55 +
              (target.analysis.naive.weakenTime -
                target.analysis.naive.growTime)
          );
        chunk.grow -= growThreadsAssigned;
        analysisCopy.threads.farm.threads.grow -= growThreadsAssigned;
        if (!growWorker) continue;

        // Assign hack threads to worker. If worker can take all, unshift worker.
        const { worker: hackWorker, threadsAssigned: hackThreadsAssigned } =
          calculateStep("HACK")(
            growWorker,
            chunk,
            config.groupDelay * 0.5 +
              (target.analysis.naive.weakenTime -
                target.analysis.naive.hackTime)
          );
        chunk.hack -= hackThreadsAssigned;
        analysisCopy.threads.farm.threads.hack -= hackThreadsAssigned;
        if (hackWorker) {
          workersCopy.unshift(hackWorker);
        }
      }
      totalThreadsLeft =
        analysisCopy.threads.weaken.threads.weaken +
        analysisCopy.threads.fluff.threads.weaken +
        analysisCopy.threads.fluff.threads.grow +
        analysisCopy.threads.farm.threads.weaken +
        analysisCopy.threads.farm.threads.grow +
        analysisCopy.threads.farm.threads.hack;
    }
  }

  return combineSteps(steps);
}

function combineSteps(steps: Step[]) {
  const combinedSteps: Step[] = [];

  while (steps.length > 0) {
    const step = steps.shift();
    if (!step) continue;

    const matching = [];

    for (let i = 0; i < steps.length; i++) {
      const otherStep = steps[i];
      if (
        step.worker === otherStep.worker &&
        step.action === otherStep.action &&
        step.delay === otherStep.delay
      ) {
        matching.push(otherStep);
        steps.splice(i, 1);
        i--;
      }
    }

    matching.forEach((match) => {
      step.threads += match.threads;
    });

    combinedSteps.push(step);
  }

  return combinedSteps;
}

export function chunkThreads(
  ns: NS,
  target: TargetServer,
  stage: Stage,
  extraDelay: number = 0
) {
  const CONSTANTS = getConstants(ns);
  const _stageState = JSON.parse(JSON.stringify(stage)) as Stage;
  const _chunkState: Threads = {
    weaken: 0,
    grow: 0,
    hack: 0,
  };

  const _createSteps = (worker: WorkerServer, threads: Threads): Step[] => {
    const steps: Step[] = [];
    const addStep = (
      action: "WEAKEN" | "GROW" | "HACK",
      threads: number,
      delay: number
    ) => {
      steps.push({
        worker: worker.hostname,
        action,
        threads,
        delay,
      });
    };
    if (threads.weaken > 0) {
      addStep("WEAKEN", threads.weaken, 100 + extraDelay);
    }
    if (threads.grow > 0) {
      addStep(
        "GROW",
        threads.grow,
        50 +
          extraDelay +
          target.analysis.naive.weakenTime -
          target.analysis.naive.growTime
      );
    }
    if (threads.hack > 0) {
      addStep(
        "HACK",
        threads.hack,
        extraDelay +
          target.analysis.naive.weakenTime -
          target.analysis.naive.hackTime
      );
    }
    return steps;
  };

  const _getThreadsCost = (threads: Threads) => {
    return (
      threads.weaken * CONSTANTS.binaryCosts.weaken +
      threads.grow * CONSTANTS.binaryCosts.grow +
      threads.hack * CONSTANTS.binaryCosts.hack
    );
  };

  const _assignChunkState = (worker: WorkerServer): Step[] => {
    const threadsToAssign = {
      weaken: 0,
      grow: 0,
      hack: 0,
    };

    // === Check weaken threads ===
    if (_chunkState.weaken > 0) {
      // Can the worker take on the chunk's weaken threads?
      const weakenThreadCapacity = Math.floor(
        worker.availableRam / CONSTANTS.binaryCosts.weaken
      );
      if (weakenThreadCapacity >= _chunkState.weaken) {
        // Yes, assign the chunk's weaken threads to the worker
        threadsToAssign.weaken += _chunkState.weaken;
        _stageState.threads.weaken -= _chunkState.weaken;
        _chunkState.weaken = 0;
      } else {
        // No, assign as many weaken threads as possible to the worker
        // then exit
        if (weakenThreadCapacity > 0) {
          threadsToAssign.weaken += weakenThreadCapacity;
          _stageState.threads.weaken -= weakenThreadCapacity;
          _chunkState.weaken -= weakenThreadCapacity;
        }
        return _createSteps(worker, threadsToAssign);
      }
    }

    // === Check grow threads ===
    if (_chunkState.grow > 0) {
      // Can the worker take on the chunk's grow threads?
      const growThreadCapacity = Math.floor(
        worker.availableRam / CONSTANTS.binaryCosts.grow
      );
      if (growThreadCapacity >= _chunkState.grow) {
        // Yes, assign the chunk's grow threads to the worker
        threadsToAssign.grow += _chunkState.grow;
        _stageState.threads.grow -= _chunkState.grow;
        _chunkState.grow = 0;
      } else {
        // No, assign as many grow threads as possible to the worker
        // then exit
        if (growThreadCapacity > 0) {
          threadsToAssign.grow += growThreadCapacity;
          _stageState.threads.grow -= growThreadCapacity;
          _chunkState.grow -= growThreadCapacity;
        }
        return _createSteps(worker, threadsToAssign);
      }
    }

    // === Check hack threads ===
    if (_chunkState.hack > 0) {
      // Can the worker take on the chunk's hack threads?
      const hackThreadCapacity = Math.floor(
        worker.availableRam / CONSTANTS.binaryCosts.hack
      );
      if (hackThreadCapacity >= _chunkState.hack) {
        // Yes, assign the chunk's hack threads to the worker
        threadsToAssign.hack += _chunkState.hack;
        _stageState.threads.hack -= _chunkState.hack;
        _chunkState.hack = 0;
      } else {
        // No, assign as many hack threads as possible to the worker
        // then exit
        if (hackThreadCapacity > 0) {
          threadsToAssign.hack += hackThreadCapacity;
          _stageState.threads.hack -= hackThreadCapacity;
          _chunkState.hack -= hackThreadCapacity;
        }
        return _createSteps(worker, threadsToAssign);
      }
    }

    const steps = _createSteps(worker, threadsToAssign);
    return steps;
  };

  // ================================================

  // EXAMPLE
  // const workers = getWorkers(ns);
  // const steps = [];
  // ...
  // const fluffStage = chunkThreads(ns, analysis.threads.fluff);

  // steps.concat(fluffStage.assignThreads(worker));
  // if (fluffStage.isComplete()) {
  //   workers.unshift(worker);
  // }

  // ================================================

  const assignThreads = (worker: WorkerServer): Step[] => {
    let steps: Step[] = [];

    // if chunk is not empty, assign what it can take,
    // then come back recursively if possible
    if (_getThreadsCost(_chunkState) > 0) {
      steps = steps.concat(_assignChunkState(worker));

      // if chunk is still not empty, return
      // if chunk is empty, return recursive call to this function
      return _getThreadsCost(_chunkState) > 0
        ? steps
        : steps.concat(assignThreads(worker));
    }

    // if chunk is empty, calculate how many chunks worker can take
    // -- if < 1, set chunk at multiple of 1, assign, then return
    // -- if > 1, set chunk at that multuple, assign, then return
    const chunkCost = _getThreadsCost(_stageState.ratios);
    const chunkCount = Math.floor(worker.availableRam / chunkCost);
    const chunkMultiplier = Math.max(1, chunkCount);

    _chunkState.weaken = Math.min(
      _stageState.ratios.weaken * chunkMultiplier,
      _stageState.threads.weaken
    );
    _chunkState.grow = Math.min(
      _stageState.ratios.grow * chunkMultiplier,
      _stageState.threads.grow
    );
    _chunkState.hack = Math.min(
      _stageState.ratios.hack * chunkMultiplier,
      _stageState.threads.hack
    );

    return steps.concat(_assignChunkState(worker));
  };

  const isComplete = () => {
    return _getThreadsCost(_stageState.threads) === 0;
  };

  return {
    assignThreads,
    isComplete,
  };
}
