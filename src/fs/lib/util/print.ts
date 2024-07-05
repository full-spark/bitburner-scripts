import { NS } from "@ns";

import { localeHHMMSS } from "/fs/lib/util/time";
import { colors, ColorsType, backgroundColors, BackgroundColorsType } from "/fs/lib/util/colors";

export function timePrint(ns: NS, message: string, timeColor: ColorsType = "cyan") {
  const timeStamp = colored(timeColor, `[${localeHHMMSS()}]`);
  ns.print(`${timeStamp} ${message}`);
}

export function timePrintTerminal(ns: NS, message: string, timeColor: ColorsType = "cyan") {
  const timeStamp = colored(timeColor, `[${localeHHMMSS()}]`);
  ns.tprint(`${timeStamp} ${message}`);
}

export function colored(color: ColorsType | null, message: string) {
  if (color == null) {
    return message.replace(/\u001b\[.*?m/g, "");
  }
  if (!Object.keys(colors).includes(color)) {
    return message;
  }

  return `${colors[color]}${message}${colors["reset"]}`;
}

export const colorText: { [K in ColorsType]: Function } = Object.keys(colors).reduce((acc, key) => {
  acc[key] = (message: string) =>
    `${(colors as { [index: string]: string })[key]}${message}${colors["reset"]}` as ColorsType;
  return acc;
}, {} as { [index: string]: Function }) as { [K in ColorsType]: Function };

export const colorBackground: { [K in BackgroundColorsType]: Function } = Object.keys(
  backgroundColors
).reduce((acc, key) => {
  acc[key] = (message: string) =>
    `${(backgroundColors as { [index: string]: string })[key]}${message}${
      backgroundColors["reset"]
    }` as BackgroundColorsType;
  return acc;
}, {} as { [index: string]: Function }) as { [K in BackgroundColorsType]: Function };

export function underlineText(message: string) {
  return `\u001b[4m${message}\u001b[0m`;
}
