import { Server } from "@ns";

export type IndexableServer = Required<Server> & Record<string, any>;

export type WorkerServer = IndexableServer & {
  availableRam: number;
  locks: { reservedRam: number };
};

export type TargetServer = IndexableServer & {
  analysis: {
    hasApi: boolean;
    threads: Stages;
    // Only data we have access to with current. Data
    naive: AnalysisData;
    // Data we would have access to with Formulas API.
    formulaic: AnalysisData;
  };
};

export type AnalysisData = {
  hackChance: number;
  weakenTime: number;
  growTime: number;
  hackTime: number;
  score: number;
};

export type Threads = {
  hack: number;
  grow: number;
  weaken: number;
};

export type Stages = {
  weaken: Stage;
  fluff: Stage;
  farm: Stage;
  formulaicFarm: Stage;
};

export type Stage = {
  threads: Threads;
  ratios: Threads;
  cost: number;
};
