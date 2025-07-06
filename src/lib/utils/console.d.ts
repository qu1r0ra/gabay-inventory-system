// TypeScript declarations for console utility
export const colors: {
  reset: string;
  bright: string;
  dim: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  gray: string;
};

export function header(text: string, color?: string): string;
export function colored(text: string, color: string): string;
export function bold(text: string): string;

export const logger: {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  test: (message: string) => void;
  setup: (message: string) => void;
  users: (message: string) => void;
  stock: (message: string) => void;
  transaction: (message: string) => void;
  check: (message: string) => void;
  verify: (message: string) => void;
  failed: (message: string) => void;
};
