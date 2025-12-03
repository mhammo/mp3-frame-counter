import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

export const openAPIOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: "MPEG File Analysis service",
      description: "MP3 File Analysis service API ",
      version: "0.0.1",
    },
  },
};

export const openAPIUIOptions: FastifySwaggerUiOptions = {
  routePrefix: "/docs",
};
