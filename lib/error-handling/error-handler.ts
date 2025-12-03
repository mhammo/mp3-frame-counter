import { logger } from "../monitoring";
import { AppError, ErrorCodes } from "./app-error";

const unknownError = new AppError({
  code: ErrorCodes.internal,
  message: "an unknown error occurred",
});

export const errorHandler = {
  listenToErrorEvents: () => {
    process.on("uncaughtException", async (error) => {
      await errorHandler.handleError(error);
    });

    process.on("unhandledRejection", async (reason) => {
      await errorHandler.handleError(reason);
    });
  },

  handleError: (errorToHandle: unknown): AppError => {
    try {
      logError(errorToHandle);
      return errorToHandle instanceof AppError ? errorToHandle : unknownError;
    } catch (handlingError: unknown) {
      process.stdout.write(
        `Unable to handle error: ${JSON.stringify(handlingError)}`,
      );
      process.stdout.write(
        `Error that caused the error handler to fail: ${JSON.stringify(errorToHandle)}`,
      );
      return unknownError;
    }
  },
};

export function logError(errorToHandle: unknown): void {
  if (errorToHandle instanceof Error) {
    logger.error(errorToHandle.message, {
      ...errorToHandle,
      stack: errorToHandle.stack,
    });
  }

  logger.error(
    `thrown value is not an Error: ${JSON.stringify(errorToHandle)}`,
  );
}
