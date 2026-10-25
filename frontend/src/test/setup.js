import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());

// Keeps the test output quiet. Tests can still import { logger } and assert on it.
vi.mock("../shared/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  addTransport: vi.fn(),
  installGlobalErrorLogging: vi.fn(),
}));

// jsdom does not implement scrollIntoView, which ActionsMenu calls when it opens
Element.prototype.scrollIntoView = vi.fn();

// jsdom does not implement showModal/close, which ConfirmDialog calls
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  configurable: true,
  writable: true,
  value: /** @this {HTMLDialogElement} */ function showModal() {
    this.setAttribute("open", "");
  },
});
Object.defineProperty(HTMLDialogElement.prototype, "close", {
  configurable: true,
  writable: true,
  value: /** @this {HTMLDialogElement} */ function close() {
    this.removeAttribute("open");
  },
});
