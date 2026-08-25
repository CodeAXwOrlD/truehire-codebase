import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[ErrorHandler]", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      data: null,
      error: "Validation error",
      details: err.flatten().fieldErrors,
    });
  }

  const status = typeof err.status === "number" ? err.status : 500;
  const message = err.message || "Internal server error";

  return res.status(status).json({
    data: null,
    error: message,
  });
}
