export const colors = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  boldBlack: "\u001b[30;1m",
  boldRed: "\u001b[31;1m",
  boldGreen: "\u001b[32;1m",
  boldYellow: "\u001b[33;1m",
  boldBlue: "\u001b[34;1m",
  boldMagenta: "\u001b[35;1m",
  boldCyan: "\u001b[36;1m",
  boldWhite: "\u001b[37;1m",
  reset: "\u001b[0m",
} as const;

export type ColorsType = keyof typeof colors;

export const backgroundColors = {
  black: "\u001b[40m",
  red: "\u001b[41m",
  green: "\u001b[42m",
  yellow: "\u001b[43m",
  blue: "\u001b[44m",
  magenta: "\u001b[45m",
  cyan: "\u001b[46m",
  white: "\u001b[47m",
  reset: "\u001b[49m",
} as const;

export type BackgroundColorsType = keyof typeof backgroundColors;
