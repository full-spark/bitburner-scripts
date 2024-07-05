import { NS } from "@ns";

export function readJsonFile<T>(ns: NS, path: string): T | null {
  const contents = ns.read(path);
  if (contents === "") {
    return null;
  }
  return JSON.parse(contents);
}

export function writeJsonFile<T>(ns: NS, path: string, data: T) {
  ns.write(path, JSON.stringify(data, null, 2), "w");
}

export function readTextFile(ns: NS, path: string) {
  return ns.read(path);
}

export function writeTextFile(ns: NS, path: string, data: string) {
  ns.write(path, data);
}
