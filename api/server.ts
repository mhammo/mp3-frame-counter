import type { Server } from "http";
import type { AddressInfo } from "net";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { getConfigValue } from "../lib/config";
import { errorMiddleware } from "../lib/error-handling";
import { logger, requestContextPlugin } from "../lib/monitoring";
import { openAPIOptions, openAPIUIOptions } from "./openapi-options";
import { routes } from "./routes";

let httpServer: Server | undefined;

export async function startWebServer(): Promise<AddressInfo> {
  logger.info(`Starting the web server now`);

  const app = Fastify({
    logger: getLoggerConfig(),
    genReqId: function () {
      return randomUUID();
    },
  });

  app.setErrorHandler(errorMiddleware(app));

  await generateOpenAPI(app);
  await registerCommonPlugins(app);
  await registerAllRoutes(app);

  const connectionAddress = await listenToRequests(app);
  httpServer = app.server;

  return connectionAddress;
}

export async function stopWebServer() {
  if (httpServer) {
    await httpServer.close();
    httpServer = undefined;
  }
}

async function generateOpenAPI(app: FastifyInstance) {
  await app.register(fastifySwagger, openAPIOptions);
  await app.register(fastifySwaggerUi, openAPIUIOptions);
}

async function registerAllRoutes(app: FastifyInstance) {
  await app.register(routes);
}

async function listenToRequests(app: FastifyInstance): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    app.listen({ host: "0.0.0.0", port: getConfigValue("port") }, (err) => {
      if (err) {
        reject(err);
      }
      resolve(app.server.address() as AddressInfo);
    });
  });
}

async function registerCommonPlugins(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
  requestContextPlugin(app);
  app.register(cors, {
    origin: "*",
    methods: ["POST"],
  });
}

function getLoggerConfig() {
  if (!getConfigValue("logger.enabled")) {
    return false;
  }

  if (getConfigValue("logger.prettyPrint")) {
    return {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          sync: true,
        },
      },
    };
  }

  return true;
}
