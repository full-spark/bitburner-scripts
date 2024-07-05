import { NS } from "@ns";

export function readJsonFile(ns: NS, path: string) {
  return JSON.parse(ns.read(path));
}

export function writeJsonFile(ns: NS, path: string, data: any) {
  ns.write(path, JSON.stringify(data, null, 2), "w");
}

export function readTextFile(ns: NS, path: string) {
  return ns.read(path);
}

export function writeTextFile(ns: NS, path: string, data: string) {
  ns.write(path, data);
}
