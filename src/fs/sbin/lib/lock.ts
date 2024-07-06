import { NS } from "@ns";
import { readJsonFile, writeJsonFile } from "fs/sbin/lib/file";

const LOCK_FILE_DIR = "var/lock/";
const LOCK_FILE_EXT = ".lock.txt";

type LockType = {
  server: string;
  memory: number;
  process?: number;
};

type LockReceiptType = {
  path: string;
  lock: LockType;
};

export function lockServer(ns: NS, lock: LockType): LockReceiptType {
  // format: /var/lock/{server}.{process}.{index}.lock.txt
  let idx = 0;
  let path = `${LOCK_FILE_DIR}${lock.server}.${
    lock.process || ns.pid
  }.${idx}${LOCK_FILE_EXT}`;
  while (ns.fileExists(path)) {
    idx++;
    path = `${LOCK_FILE_DIR}${lock.server}.${
      lock.process || ns.pid
    }.${idx}${LOCK_FILE_EXT}`;
  }
  writeJsonFile(ns, path, lock);
  return {
    path,
    lock,
  };
}

export function updateLock(ns: NS, path: string, lock: Partial<Lock>) {
  const current = readJsonFile(ns, path);
  if (!current) {
    throw new Error(`Lock file ${path} does not exist`);
  }
  writeJsonFile(ns, path, { ...current, ...lock });
}

export const getLocks = {
  byProcess: (ns: NS, process?: number) => {
    return ns
      .ls("home", LOCK_FILE_DIR)
      .filter((file) =>
        file.match(new RegExp(`.${process || ns.pid}.\\d*.${LOCK_FILE_EXT}`))
      );
  },
  byServer: (ns: NS, server: string, process?: number) => {
    return ns
      .ls("home", LOCK_FILE_DIR)
      .filter((file) => file.startsWith(`${LOCK_FILE_DIR}${server}.`))
      .filter((file) =>
        process
          ? file.match(new RegExp(`.${process}.\\d*.${LOCK_FILE_EXT}`))
          : true
      );
  },
  all: (ns: NS) => {
    return ns.ls("home", LOCK_FILE_DIR);
  },
};

export const releaseLocks = {
  byPath: (ns: NS, path: string) => {
    if (!ns.fileExists(path)) {
      throw new Error(`Lock file ${path} does not exist`);
    }
    ns.rm(path);
  },
  byProcess: (ns: NS, process?: number) => {
    getLocks.byProcess(ns, process).forEach((file) => {
      ns.rm(file);
    });
  },
  byServer: (ns: NS, server: string, process?: number) => {
    (process
      ? getLocks.byServer(ns, server)
      : getLocks.byServer(ns, server, process)
    ).forEach((file) => {
      ns.rm(file);
    });
  },
  all: (ns: NS) => {
    getLocks.all(ns).forEach((file) => {
      ns.rm(file);
    });
  },
};

export const measureLocks = {
  byPath: (ns: NS, path: string) => {
    const lock = readJsonFile<LockType>(ns, path);
    if (!lock) {
      throw new Error(`Lock file ${path} does not exist`);
    }
    return lock.memory;
  },
  byProcess: (ns: NS, process?: number) => {
    return getLocks.byProcess(ns, process).reduce((acc, file) => {
      return acc + measureLocks.byPath(ns, file);
    }, 0);
  },
  byServer: (ns: NS, server: string, process?: number) => {
    return (
      process
        ? getLocks.byServer(ns, server)
        : getLocks.byServer(ns, server, process)
    ).reduce((acc, file) => {
      return acc + measureLocks.byPath(ns, file);
    }, 0);
  },
  all: (ns: NS) => {
    return getLocks.all(ns).reduce((acc, file) => {
      return acc + measureLocks.byPath(ns, file);
    }, 0);
  },
};
