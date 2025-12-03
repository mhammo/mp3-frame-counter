import { afterEach, beforeAll, beforeEach } from "vitest";
import { initConfigProvider, resetConfig } from "../lib/config";
import { logger } from "../lib/monitoring";

beforeAll(() => {
  logger.configureLogger({ enabled: false });
});

beforeEach(() => {
  initConfigProvider({ LOGGING_ENABLED: "false" });
});

afterEach(() => {
  resetConfig();
});
