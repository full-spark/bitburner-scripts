import type { NS } from "@ns";
import { setConstants } from "/fs/sbin/lib/constants";
import { setServerState } from "/fs/sbin/lib/state/servers";
import { lockServer } from "/fs/sbin/lib/lock";

export async function main(ns: NS) {
  setConstants(ns);
  setServerState(ns);
  ns.ls("home", "/var/lock").forEach((file) => {
    ns.rm(file);
  });
  lockServer(ns, {
    server: "home",
    memory: 32,
    process: 0,
  });
}
