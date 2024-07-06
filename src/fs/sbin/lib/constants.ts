import { NS } from "@ns";
import { readJsonFile, writeJsonFile } from "fs/sbin/lib/file";

const CONSTANTS_FILE = "var/constants.json.txt";

type ConstantsFileType = {
  securityChanges: {
    weaken: number;
    grow: number;
    hack: number;
  };
  binaryFiles: {
    weaken: string;
    grow: string;
    hack: string;
    bomb: string;
    share: string;
  };
  binaryCosts: {
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
  const binaryFiles = {
    weaken: "fs/bin/weaken.js",
    grow: "fs/bin/grow.js",
    hack: "fs/bin/hack.js",
    bomb: "fs/bin/bomb.js",
    share: "fs/bin/share.js",
  };
  const binaryCosts = {
    weaken: ns.getScriptRam(binaryFiles.weaken),
    grow: ns.getScriptRam(binaryFiles.grow),
    hack: ns.getScriptRam(binaryFiles.hack),
    bomb: ns.getScriptRam(binaryFiles.bomb),
    share: ns.getScriptRam(binaryFiles.share),
  };
  const constants: ConstantsFileType = {
    securityChanges,
    binaryFiles,
    binaryCosts,
  };
  writeJsonFile(ns, CONSTANTS_FILE, constants);
  return constants;
}

export function getConstants(ns: NS) {
  // if we did this (I'd love to), we'd always incur the GB cost of the set function.
  // return (
  //   readJsonFile<ConstantsFileType>(ns, CONSTANTS_FILE) ?? setConstants(ns)
  // );
  const constants = readJsonFile<ConstantsFileType>(ns, CONSTANTS_FILE);
  if (!constants) {
    throw new Error(
      "Constants file not found. Consider running `setConstants`."
    );
  }
  return constants;
}

export function getSingleThreadSecurityAnalysis(ns: NS) {
  return getConstants(ns).securityChanges;
}
