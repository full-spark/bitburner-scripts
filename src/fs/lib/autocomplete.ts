import { AutocompleteData, ScriptArg } from "@ns";

type AutocompleteRecord = {
  [key: string]: AutocompleteRecord | ScriptArg | ScriptArg[] | Function;
};

function parseArguments(
  type: "Function" | "Autocompletes",
  args: ScriptArg[],
  tree: AutocompleteRecord
) {
  return (function recurse(
    rtree: AutocompleteRecord,
    rargs: ScriptArg[]
  ): string[] | Function | null {
    if (typeof rtree === "function") {
      return type === "Function" ? rtree : [];
    }
    if (rargs.length === 0) {
      return type === "Function" ? null : Object.keys(rtree);
    }
    const arg = rargs.shift()?.toString() as string;
    if (rtree[arg]) {
      return recurse(rtree[arg] as AutocompleteRecord, rargs);
    }
    return type === "Function" ? null : Object.keys(rtree);
  })(tree, args);
}

export function getAutocomplete(args: ScriptArg[], tree: AutocompleteRecord): string[] {
  return parseArguments("Autocompletes", args, tree) as string[];
}

// export function parseArgumentsFunction(
//   args: ScriptArg[],
//   tree: AutocompleteRecord,
//   defaultFunc: Function = () => {}
// ): Function {
//   const result = parseArguments("Function", args, tree) as Function | null;
//   return result || defaultFunc;
// }
