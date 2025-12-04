import { fastifyRequestContext } from "@fastify/request-context";
import type { FastifyInstance } from "fastify";

export const requestContextPlugin = async (app: FastifyInstance) => {
  app.register(fastifyRequestContext, {
    defaultStoreValues: { requestId: "" },
  });
  app.addHook("preValidation", async (req) => {
    app.requestContext.set("requestId", req.id);
  });
  app.addHook("onSend", async (req, reply) => {
    reply.headers({ "x-request-id": req.id });
  });
};

declare module "@fastify/request-context" {
  interface RequestContextData {
    requestId: string;
  }
}
