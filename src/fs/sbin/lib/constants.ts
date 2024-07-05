import { NS } from "@ns";
import { readJsonFile, writeJsonFile } from "fs/sbin/lib/file";

const CONSTANTS_FILE = "var/constants.json.txt";

type ConstantsFileType = {
  securityChanges: {
    weaken: number;
    grow: number;
    hack: number;
  };
};

export function setConstants(ns: NS): ConstantsFileType {
  const securityChanges = {
    weaken: ns.weakenAnalyze(1),
    grow: ns.growthAnalyzeSecurity(1),
    hack: ns.hackAnalyzeSecurity(1),
  };
  const constants: ConstantsFileType = { securityChanges };
  writeJsonFile(ns, CONSTANTS_FILE, constants);
  return constants;
}

export function getConstants(ns: NS) {
  return (
    readJsonFile<ConstantsFileType>(ns, CONSTANTS_FILE) ?? setConstants(ns)
  );
}

export function getSingleThreadSecurityAnalysis(ns: NS) {
  return getConstants(ns).securityChanges;
}
