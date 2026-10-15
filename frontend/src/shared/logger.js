const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = import.meta.env.DEV ? "debug" : "info";

function consoleTransport(level, message, context) {
  console[level](message, context);
}

const transports = [consoleTransport];

export function addTransport(transport) {
  transports.push(transport);
}

function log(level, message, context = {}) {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;
  for (const transport of transports) {
    try {
      transport(level, message, context);
    } catch {
      // A broken transport must never break the app.
    }
  }
}

export const logger = {
  debug: (message, context) => log("debug", message, context),
  info: (message, context) => log("info", message, context),
  warn: (message, context) => log("warn", message, context),
  error: (message, context) => log("error", message, context),
};

let installed = false;

export function installGlobalErrorLogging() {
  if (installed) return;
  installed = true;

  window.addEventListener("error", (event) => {
    logger.error("Uncaught error", {
      error: event.error,
      message: event.message,
      source: event.filename,
      line: event.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", { error: event.reason });
  });
}
