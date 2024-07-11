import type { NS } from "@ns";
import type { Step } from "fs/usr/lib/threads";
import { chunkThreads } from "fs/usr/lib/threads";
import { getWorkers, getTargets } from "fs/usr/lib/servers";

export async function main(ns: NS) {
  const workers = getWorkers(ns);
  const targets = getTargets(ns, workers);

  console.log(targets);
}

/** Total cost of just working with getWorkers:
    getServer (fn)	    2GB
    baseCost (misc)	    1.6GB
    rm (fn)	            1GB     (lock files)
    scp (fn)	        0.6GB
    ls (fn)	            0.2GB
    scan (fn)	        0.2GB
    fileExists (fn)	    0.1GB
    brutessh (fn)	    0.05GB
    ftpcrack (fn)	    0.05GB
    relaysmtp (fn)	    0.05GB
    sqlinject (fn)	    0.05GB
    httpworm (fn)	    0.05GB
    nuke (fn)	        0.05GB
    TOTAL:              6GB
 */

/** Total cost of just working with getTargets:
    getServer (fn)	            2GB
    baseCost (misc)	            1.6GB
    rm (fn)	                    1GB         (lock files)
    hackAnalyzeChance (fn)	    1GB
    growthAnalyze (fn)	        1GB
    hackAnalyzeThreads (fn)	    1GB
    getPlayer (fn)	            0.5GB
    ls (fn)	                    0.2GB
    scan (fn)	                0.2GB    
    weaken (fn)	                0.15GB
    grow (fn)	                0.15GB
    fileExists (fn)	            0.1GB
    hack (fn)	                0.1GB    
    brutessh (fn)	            0.05GB
    ftpcrack (fn)	            0.05GB
    relaysmtp (fn)	            0.05GB
    sqlinject (fn)	            0.05GB
    TOTAL:                      9.35GB
 */

/** Total cost of working with both:
    getServer (fn)	            2GB
    baseCost (misc)	            1.6GB
    rm (fn)	                    1GB
    hackAnalyzeChance (fn)	    1GB
    growthAnalyze (fn)	        1GB
    hackAnalyzeThreads (fn)	    1GB
    scp (fn)	                0.6GB
    getPlayer (fn)	            0.5GB
    ls (fn)	                    0.2GB
    scan (fn)	                0.2GB
    weaken (fn)	                0.15GB   
    grow (fn)	                0.15GB  
    fileExists (fn)	            0.15GB 
    hack (fn)	                0.15GB    
    brutessh (fn)	            0.05GB
    ftpcrack (fn)	            0.05GB
    relaysmtp (fn)	            0.05GB
    sqlinject (fn)	            0.05GB
    httpworm (fn)	            0.05GB
    nuke (fn)	                0.05GB   
    getWeakenTime (fn)	        0.05GB
    TOTAL:                      9.95GB
 */
