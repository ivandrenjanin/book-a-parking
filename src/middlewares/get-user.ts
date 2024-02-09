import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const userTokenSchema = z.coerce.number();

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // WARNING: Token Format: Token-${user_id} Eg. Token-1
  const token = req.headers["x-user-token"] as string;

  if (!token) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const id = token.split("-")[1];

  const result = userTokenSchema.safeParse(id);
  if (!result.success) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const user = await req.locator.UserService.getById(result.data);
  req.user = user;
  next();
};
