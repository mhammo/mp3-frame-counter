import { beforeEach, afterEach, beforeAll } from "vitest";
import { getConfigValue, initConfigProvider, resetConfig } from "../lib/config";
import { logger } from "../lib/monitoring";

beforeAll(() => {
  initConfigProvider();
  logger.configureLogger(getConfigValue("logger"));
});

beforeEach(() => {
  initConfigProvider();
});

afterEach(() => {
  resetConfig();
});
