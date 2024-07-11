import type { NS } from "@ns";
import { colored } from "fs/lib/util/print";

function getRamOptions(): number[] {
  const options = [];
  for (let i = 1; i <= 10; i++) {
    options.push(4 ** i);
  }
  return options;
}

export async function main(ns: NS) {
  const ram = ns.args[0] as number;
  const maxRam = ns.getPurchasedServerMaxRam();
  const maxPurchasedServers = ns.getPurchasedServerLimit();
  const purchasedServers = ns.getPurchasedServers();
  if (purchasedServers.length >= maxPurchasedServers) {
    ns.tprint(
      `Maximum number of purchased servers reached. (${maxPurchasedServers})`
    );
    return;
  }
  const player = ns.getPlayer();
  const options = getRamOptions();

  function printOptions() {
    options.forEach((option) => {
      if (option > maxRam) return;
      const cost = ns.getPurchasedServerCost(option);
      const nextCost = ns.getPurchasedServerCost(option * 4);
      let printable = `${option}GB => $${ns.formatNumber(cost)}`;
      if (player.money > cost && player.money < nextCost) {
        printable = colored("green", printable);
      }
      ns.tprint(printable);
    });
  }

  if (!ram) {
    printOptions();
    return;
  }

  if (!options.includes(ram)) {
    ns.tprint(`Invalid RAM size. Must be a power of 4.`);
    const lower = Math.min(
      maxRam,
      4 ** Math.floor(Math.log2(Math.max(ram, 1)) / 2)
    );
    const upper = 4 ** Math.ceil(Math.log2(Math.max(ram, 4)) / 2);
    ns.tprint(
      `Closest options: ${lower < 4 ? "" : `${lower}GB <== `}${ram}${
        upper > maxRam ? "" : ` ==> ${upper}GB`
      }`
    );
    return;
  }

  const cost = ns.getPurchasedServerCost(ram);
  if (player.money < cost) {
    ns.tprint(`Not enough money to purchase ${ram}GB server.`);
    return;
  }

  const hostname = ns.purchaseServer(`pserv-${ram}`, ram);
  ns.tprint(`Purchased ${ram}GB server: ${hostname}`);
}

export function autocomplete() {
  return getRamOptions();
}
