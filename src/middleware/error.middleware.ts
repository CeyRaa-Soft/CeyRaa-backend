import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface AppError extends Error {
  status?: number;
  code?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("[❌ ERROR]", err);

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `Invalid value for ${err.path}: "${err.value}"`,
      type: "CastError",
    });
  }

  // Handle Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: (e as any).path,
      message: e.message,
    }));
    return res.status(422).json({
      message: "Validation failed",
      errors,
      type: "ValidationError",
    });
  }

  // Handle Duplicate Key Error (e.g., E11000 for unique fields)
  if (err.code === 11000) {
    const fields = Object.keys((err as any).keyValue);
    return res.status(409).json({
      message: `Duplicate value for field(s): ${fields.join(", ")}`,
      type: "DuplicateKeyError",
    });
  }

  // Default (fallback) error
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    type: "UnhandledError",
  });
};
