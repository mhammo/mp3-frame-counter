import { errorHandler } from "./lib/error-handling";
import { logger } from "./lib/monitoring";
import { startWebServer } from "./api/server";
import { getConfigValue, initConfigProvider } from "./lib/config";

errorHandler.listenToErrorEvents();
initConfigProvider();
logger.configureLogger(getConfigValue("logger"));

startWebServer()
  .then((startResponses) => {
    logger.info(`The app has started successfully ${startResponses}}`);
  })
  .catch((error) => {
    logger.error(`unable to start app: ${error.message}`, { cause: error });
    process.exit(1);
  });
