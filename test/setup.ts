import { afterEach, beforeAll, beforeEach } from "vitest";
import { getConfigValue, initConfigProvider, resetConfig } from "../lib/config";
import { logger } from "../lib/monitoring";

beforeAll(() => {
  initConfigProvider();
});

beforeEach(() => {
  logger.configureLogger({
    level: getConfigValue("logger.level"),
    prettyPrint: getConfigValue("logger.prettyPrint"),
  });
});

afterEach(() => {
  resetConfig();
});
