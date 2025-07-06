// Console utilities with ANSI color support

// ANSI color codes for console output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Helper function to create colored headers
export function header(text, color = 'cyan') {
  return `${colors[color]}${colors.bright}[${text}]${colors.reset}`;
}

// Helper function to create colored text
export function colored(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to create bold text
export function bold(text) {
  return `${colors.bright}${text}${colors.reset}`;
}

// Predefined colored loggers
export const logger = {
  success: (message) => console.log(`${header('SUCCESS', 'green')} ${message}`),
  error: (message) => console.error(`${header('ERROR', 'red')} ${message}`),
  warning: (message) => console.warn(`${header('WARNING', 'yellow')} ${message}`),
  info: (message) => console.log(`${header('INFO', 'blue')} ${message}`),
  test: (message) => console.log(`${header('TEST', 'cyan')} ${message}`),
  setup: (message) => console.log(`${header('SETUP', 'yellow')} ${message}`),
  users: (message) => console.log(`${header('USERS', 'blue')} ${message}`),
  stock: (message) => console.log(`${header('STOCK', 'yellow')} ${message}`),
  transaction: (message) => console.log(`${header('TRANSACTION', 'magenta')} ${message}`),
  check: (message) => console.log(`${header('CHECK', 'blue')} ${message}`),
  verify: (message) => console.log(`${header('VERIFY', 'cyan')} ${message}`),
  failed: (message) => console.log(`${header('FAILED', 'red')} ${message}`)
};
