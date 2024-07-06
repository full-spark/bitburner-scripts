import { Server, ScriptArg } from "@ns";

export type IndexableServer = Required<Server> & Record<string, ScriptArg>;

export type WorkerServer = IndexableServer & {
  availableRam: number;
  locks: { reservedRam: number };
};

export type TargetServer = IndexableServer & {
  analysis: {
    hasApi: boolean;
    threads: {
      weaken: Threads;
      fluff: Threads;
      naiveFarm: Threads;
      formulaicFarm: Threads;
    };
    // Only data we have access to with current. Data
    naive: AnalysisData;
    // Data we would have access to with Formulas API.
    formulaic: AnalysisData;
  };
};

export type AnalysisData = {
  hackChance: number;
  weakenTime: number;
};

export type Threads = {
  hack: number;
  grow: number;
  weaken: number;
};

export type Stages = {
  weaken: {
    threads: Threads;
    cost: number;
  };
  fluff: {
    threads: Threads;
    ratios: Threads;
    cost: number;
  };
  farm: {
    threads: Threads;
    ratios: Threads;
    cost: number;
  };
  formulaicFarm: {
    threads: Threads;
    ratios: Threads;
    cost: number;
  };
};
