import convict from "convict";
import { Config, configSchema } from "./schema";

let convictConfigurationProvider: convict.Config<Config> | undefined;

export function initConfigProvider(envOverrides?: NodeJS.ProcessEnv) {
  convictConfigurationProvider = convict(configSchema, {
    env: { ...process.env, ...envOverrides },
  });
  convictConfigurationProvider.validate();
}

export function resetConfig() {
  convictConfigurationProvider = undefined;
}

export function getConfigValue<T extends convict.Path<Config>>(
  keyName: T,
): convict.PathValue<Config, T> {
  if (convictConfigurationProvider === undefined) {
    throw new Error("Configuration has not been initialized yet");
  }

  return convictConfigurationProvider.get(keyName) as convict.PathValue<
    Config,
    T
  >;
}
