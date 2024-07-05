import { Server } from "@ns";

export type IndexableServer = Required<Server> & Record<string, any>;

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
  cost: number;
};
