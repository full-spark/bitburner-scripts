import { NS } from "@ns";
import { setConstants } from "/fs/sbin/lib/constants";
import { setServerState } from "/fs/sbin/lib/state/servers";

export async function main(ns: NS) {
  setConstants(ns);
  setServerState(ns);
}
