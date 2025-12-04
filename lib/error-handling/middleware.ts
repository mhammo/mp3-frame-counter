import type {
  FastifyInstance,
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import "@fastify/multipart";
import { ErrorCodes } from "./app-error";
import { errorHandler } from "./error-handler";

export function errorMiddleware(app: FastifyInstance) {
  return function errorMiddleware(
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    if (error instanceof app.multipartErrors.RequestFileTooLargeError) {
      return reply.code(400).send({
        code: ErrorCodes.invalid_request,
        message: "The file cannot be larger than 10MB",
      });
    }

    const appErr = errorHandler.handleError(error);
    reply.status(appErr.httpStatus).send({
      code: appErr.code,
      message: appErr.message,
      parameter: appErr.parameter,
    });
  };
}
