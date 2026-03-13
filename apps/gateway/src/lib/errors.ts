export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode = 400,
    message?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
