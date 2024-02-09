import bodyParser from "body-parser";
import { Express, NextFunction, Request, Response } from "express";
import { getUser } from "./get-user";
import { AnyZodObject, z } from "zod";

function register(app: Express) {
  // Register pre-built middlewares
  app.use(bodyParser.json());

  // Register custom middlewares
  app.use(getUser);
}

const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return res.status(400).json(error);
    }
  };

const bookingsBodySchema = z.object({
  body: z.object({
    parkingId: z.number(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }),
});

const bookingByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }),
  params: z.object({
    id: z.coerce.number(),
  }),
});

export default {
  register,
  validate,
  bookingByIdSchema,
  bookingsBodySchema,
  updateBookingSchema,
};
