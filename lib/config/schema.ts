import { Schema } from "convict";
import { LogLevel } from "../monitoring";

export type Config = {
  port: number;
  logger: { level: LogLevel; prettyPrint: boolean };
};

export const configSchema: Schema<Config> = {
  port: {
    format: "Number",
    default: 3000,
    nullable: true,
    env: "PORT",
  },
  logger: {
    level: {
      format: ["debug", "info", "warn", "error"],
      default: "info",
      nullable: false,
      env: "LOG_LEVEL",
    },
    prettyPrint: {
      format: "Boolean",
      default: true,
      nullable: false,
      env: "PRETTY_PRINT",
    },
  },
};
