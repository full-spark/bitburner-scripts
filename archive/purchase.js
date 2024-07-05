import { color } from "fs/lib/util/color";
import { getServersApi } from "fs/lib/api/servers";
const levelOneArgs = ["server"];
const ramOptions = [
    64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576,
];
export async function main(ns) {
    const flags = ns.flags([
        ["l", false],
        ["n", "pserv"],
        ["r", 0],
        ["c", 1], // count of servers to purchase
    ]);
    const choice = ns.args[0];
    if (choice === "server") {
        const name = flags["n"];
        const count = flags["c"];
        if (count < 1) {
            ns.tprint(`Invalid count: ${count}`);
            return;
        }
        const serversApi = getServersApi(ns);
        const purchasedServers = serversApi.get.all.purchasedServers;
        const serverLimit = ns.getPurchasedServerLimit();
        ns.tprint(`Purchased servers: ${purchasedServers.length}/${serverLimit}`);
        purchasedServers.forEach((server, idx) => {
            ns.tprint(`Server ${idx}: ${server} - ${server.maxRam}GB`);
        });
        flags["l"] && listPurchaseCosts(ns, count);
        let ram = flags["r"];
        if (ram <= 0)
            return;
        const max = ns.getPurchasedServerMaxRam();
        if (purchasedServers.length >= serverLimit || count > serverLimit - purchasedServers.length) {
            ns.tprint(`Cannot purchase ${count} ${count > 1 ? "servers" : "server"}`);
            ns.tprint(`Can only buy ${serverLimit - purchasedServers.length} more`);
            return;
        }
        if (ram > max) {
            ram = max;
        }
        if (!ramOptions.includes(ram)) {
            ns.tprint(`Invalid RAM option: ${ram}`);
            return;
        }
        if (ns.getServerMoneyAvailable("home") < ns.getPurchasedServerCost(ram) * count) {
            ns.tprint(`Not enough money to purchase ${count} ${count > 1 ? "servers" : "server"} at ${ram}GB`);
            return;
        }
        ns.tprint(`Purchasing ${count} ${count > 1 ? "servers" : "server"} '${name}' with ${ram}GB of RAM`);
        for (let i = 0; i < count; i++) {
            ns.purchaseServer(name, ram);
        }
    }
}
export function autocomplete(data, args) {
    if (args.length === 0 ||
        (args.length === 1 && typeof args[0] === "string" && !(args[0] in levelOneArgs))) {
        return levelOneArgs;
    }
    let displayRamOpts = args.length > 1 && typeof args[args.length - 1] === "string" && args[args.length - 1] === "-r";
    displayRamOpts =
        displayRamOpts ||
            (args.length > 1 &&
                args[args.length - 2] === "-r" &&
                typeof args[args.length - 1] === "number");
    if (displayRamOpts) {
        return ramOptions.map((r) => r.toString());
    }
    // console.log(args);
    return data.servers;
}
function listPurchaseCosts(ns, count = 1) {
    const max = ns.getPurchasedServerMaxRam();
    const bestAffordable = getLargestAffordable(ns, max);
    for (let i = 64; i <= max; i *= 2) {
        const serverCost = ns.getPurchasedServerCost(i);
        const isBest = i === bestAffordable;
        let msg = `Server cost: ${i}GB${count > 1 ? `x${count}` : ""} - $${ns.formatNumber(serverCost * count)} (${ns.formatNumber(serverCost / i)}/GB)`;
        if (isBest) {
            msg = color("green", msg);
        }
        ns.tprint(msg);
    }
}
function getLargestAffordable(ns, maxRam) {
    const balance = ns.getServerMoneyAvailable("home");
    for (let k = 64; k <= maxRam; k *= 2) {
        if (ns.getPurchasedServerCost(k) > balance) {
            // If 64GB is too expensive, return 0
            return k === 64 ? 0 : (k /= 2);
        }
    }
    return maxRam;
}