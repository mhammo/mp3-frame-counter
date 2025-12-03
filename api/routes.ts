import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyPluginAsync,
} from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import z from "zod";

export const routes: FastifyPluginAsync = async (base: FastifyInstance) => {
  const app = base.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/file-upload",
    {
      schema: {
        response: {
          ...commonHTTPResponses,
        },
      },
    },
    async function (req, reply) {
      reply.send({ message: "Not implemented.", code: "unimplemented" });
    },
  );
};

const errorSchema = z.object({
  message: z.string(),
  code: z.string(),
  parameter: z.string().optional(),
});

const commonHTTPResponses = {
  400: errorSchema.describe("Invalid request"),
  500: errorSchema.describe("Unknown server error"),
};

export type FastifyWithTypeProvider = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  ZodTypeProvider
>;
