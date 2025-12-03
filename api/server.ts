import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyMultipart, { ajvFilePlugin } from "@fastify/multipart";
import Fastify, { FastifyInstance } from "fastify";
import { Server } from "http";
import { AddressInfo } from "net";
import { logger, requestContextPlugin } from "../lib/monitoring";
import { OpenAPIOptions, OpenAPIUIOptions } from "./open-api-options";
import { routes } from "./routes";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { errorMiddleware } from "../lib/error-handling";
import { getConfigValue } from "../lib/config";

let httpServer: Server | undefined;

export async function startWebServer(): Promise<AddressInfo> {
  logger.info(`Starting the web server now`);
  const app = Fastify({
    logger: true,
    ajv: {
      // Adds the file plugin to help @fastify/swagger schema generation
      plugins: [ajvFilePlugin],
    },
  });
  app.setErrorHandler(errorMiddleware);
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
  await app.register(fastifySwagger, OpenAPIOptions);
  await app.register(fastifySwaggerUi, OpenAPIUIOptions);
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
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(fastifyMultipart);
  app.register(requestContextPlugin);
  app.register(cors, {
    origin: "*",
    methods: ["POST"],
  });
}
