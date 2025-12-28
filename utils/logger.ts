/*
 * OttoQuest - Logging Utility
 * Structured logging with timestamps for debugging
 */

const PREFIX = "[OttoQuest]";

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false });
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${PREFIX} [${getTimestamp()}] ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`${PREFIX} [${getTimestamp()}] ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`${PREFIX} [${getTimestamp()}] ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    console.debug(`${PREFIX} [${getTimestamp()}] ${message}`, ...args);
  }
};

export default logger;
