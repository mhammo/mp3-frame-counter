import type { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import type { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

export const openAPIOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: "MPEG File Analysis service",
      description: "MP3 File Analysis service API ",
      version: "0.0.1",
    },

    servers: [{ url: "http://localhost:3000", description: "Local Instance" }],
  },
};

export const openAPIUIOptions: FastifySwaggerUiOptions = {
  routePrefix: "/docs",
};
