import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { errorHandler } from "./error-handler";

export function errorMiddleware(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const appErr = errorHandler.handleError(error);
  reply.status(appErr.httpStatus).send({
    code: appErr.code,
    message: appErr.message,
    parameter: appErr.parameter,
  });
}
