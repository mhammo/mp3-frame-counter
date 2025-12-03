import { pino, Logger as PinoLoggerImpl } from "pino";
import { requestContext } from "@fastify/request-context";

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface Logger {
  info(message: string, metadata?: object): void;
  error(message: string, metadata?: object): void;
  debug(message: string, metadata?: object): void;
  warn(message: string, metadata?: object): void;
}

export interface LoggerConfiguration {
  level: LogLevel;
  prettyPrint: boolean;
}

export class LoggerWrapper implements Logger {
  #logger: PinoLoggerImpl | null = null;

  #getInitializeLogger(): PinoLoggerImpl {
    this.configureLogger({});
    return this.#logger!;
  }

  configureLogger({ level, prettyPrint }: Partial<LoggerConfiguration>): void {
    if (this.#logger === null) {
      this.#logger = pino({
        level: level ?? "info",
        transport: prettyPrint
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                sync: true,
              },
            }
          : undefined,
      });
    }
  }

  resetLogger() {
    this.#logger = null;
  }

  debug(message: string, metadata?: object): void {
    this.#getInitializeLogger().debug(
      LoggerWrapper.#insertContextIntoMetadata(metadata),
      message,
    );
  }

  error(message: string, metadata?: object): void {
    this.#getInitializeLogger().error(
      LoggerWrapper.#insertContextIntoMetadata(metadata),
      message,
    );
  }

  info(message: string, metadata?: object): void {
    this.#getInitializeLogger().info(
      LoggerWrapper.#insertContextIntoMetadata(metadata),
      message,
    );
  }

  warn(message: string, metadata?: object): void {
    this.#getInitializeLogger().warn(
      LoggerWrapper.#insertContextIntoMetadata(metadata),
      message,
    );
  }

  static #insertContextIntoMetadata(metadata?: object): object {
    const requestId = requestContext.get("requestId");
    return { requestId, ...(metadata ?? {}) };
  }
}

export const logger = new LoggerWrapper();
