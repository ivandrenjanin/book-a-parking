import { Response } from "express";
import { HttpException } from "../errors";

export function handleError(error: unknown, res: Response) {
  if (error instanceof HttpException) {
    return res.status(error.status).json({
      message: error.message,
    });
  } else {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
