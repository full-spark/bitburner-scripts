const COMMANDS = {
    flushHashes: (ns) => flushHashes(ns),
};
export async function main(ns) {
    const command = ns.args[0];
    if (!(command in COMMANDS)) {
        ns.tprint(`Invalid command: ${command}`);
        return;
    }
    COMMANDS[command](ns);
}
function flushHashes(ns) {
    const upgradeName = "Sell for Money";
    const hashes = ns.hacknet.numHashes();
    if (hashes < ns.hacknet.hashCost(upgradeName))
        return;
    const upgradeCount = Math.floor(hashes / 4);
    ns.tprint(`Flushing ${upgradeCount * 4} hashes for $${ns.formatNumber(upgradeCount * 1e6)}`);
    ns.hacknet.spendHashes(upgradeName, "", upgradeCount);
}
export function autocomplete(data, args) {
    return Object.keys(COMMANDS);
}