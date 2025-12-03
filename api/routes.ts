import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AppError } from "../lib/error-handling";
import { ErrorCodes } from "../lib/error-handling/app-error";
import { countMp3Frames } from "../domain/mp3-frame-counter";

export const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post(
    "/file-upload",
    {
      schema: {
        tags: ["files"],
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            required: ["frameCount"],
            properties: {
              frameCount: { type: "number" },
            },
          },
          ...commonHTTPResponses,
        },
      },
      config: {
        swagger: {},
        swaggerTransform: ({ schema, url }) => {
          // We don't want to use the Fastify validation for this,
          // we just want to show it on the docs. It's a bit of a hack, I'd
          // resolve this in a cleaner way with more time.
          schema.body = {
            type: "object",
            required: ["document"],
            properties: {
              document: { type: "string", format: "binary" },
            },
          };
          return { schema, url };
        },
      },
    },
    async function (req, reply) {
      const document = await req.file();
      if (!document) {
        throw new AppError({
          code: ErrorCodes.invalid_request,
          message: "document is required",
          parameter: "document",
        });
      }

      if (document.mimetype !== "audio/mpeg") {
        throw new AppError({
          code: ErrorCodes.invalid_request,
          message: "Only MPEG Version 1 Layer III files are supported.",
          parameter: "document",
        });
      }

      const frameCount = await countMp3Frames(document.file);
      reply.status(200).send({ frameCount });
    },
  );
};

const errorSchema = {
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    parameter: { type: "string" },
  },
};

const commonHTTPResponses = {
  400: errorSchema,
  500: errorSchema,
};
