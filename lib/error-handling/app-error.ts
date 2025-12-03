export enum ErrorCodes {
  internal = "internal",
  invalid_request = "invalid_request",
}

// Default HTTP status for each error code, you can override this in the constructor
// if necessary.
const httpStatusForErrorCode: Map<ErrorCodes, number> = new Map([
  [ErrorCodes.internal, 500],
  [ErrorCodes.invalid_request, 400],
]);

export type AppErrorOptions = {
  code: ErrorCodes;
  message: string;
  httpStatus?: number;
  cause?: unknown;
  parameter?: string;
};

export class AppError extends Error {
  code: ErrorCodes;
  httpStatus: number;
  parameter?: string;

  constructor({
    code,
    message,
    httpStatus = httpStatusForErrorCode.get(code) ?? 500,
    cause,
  }: AppErrorOptions) {
    super(message, { cause });
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
