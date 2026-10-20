import {
  faro,
  getWebInstrumentations,
  initializeFaro,
  LogLevel,
} from "@grafana/faro-web-sdk";
import { addTransport } from "./logger.js";

const FARO_LEVELS = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

// Faro only accepts string values in its context object
function stringifyContext(context) {
  const result = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined || value === null) continue;
    result[key] =
      typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  return result;
}

function faroTransport(level, message, context) {
  const { error, ...rest } = context;
  const faroContext = stringifyContext({ message, ...rest });

  if (error instanceof Error) {
    faro.api.pushError(error, { context: faroContext });
  } else {
    faro.api.pushLog([message], {
      level: FARO_LEVELS[level],
      context: faroContext,
    });
  }
}

export function initFaro() {
  const url = import.meta.env.VITE_FARO_URL;
  if (!url) return;

  initializeFaro({
    url,
    app: {
      name: "shelfpal-frontend",
      environment: import.meta.env.MODE,
    },
    instrumentations: [
      //Disabled because our logger already forwards warnings and errors
      ...getWebInstrumentations({ captureConsole: false }),
    ],
  });

  addTransport(faroTransport);
}
