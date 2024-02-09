import { Express, Request, Response } from "express";
import middlewares from "../middlewares";
import { handleError } from "./error";

export function registerBookingHandlers(app: Express) {
  app.post(
    "/bookings",
    middlewares.validate(middlewares.bookingsBodySchema),
    async (req: Request, res: Response) => {
      const data = middlewares.bookingsBodySchema.parse({ body: req.body });

      try {
        await req.locator.BookingService.create(
          req.user.id,
          data.body.parkingId,
          data.body.startDate,
          data.body.endDate,
        );
        return res.status(201).json({ success: true });
      } catch (error) {
        handleError(error, res);
      }
    },
  );

  app.get(
    "/bookings/:id",
    middlewares.validate(middlewares.bookingByIdSchema),
    async (req: Request, res: Response) => {
      const { params } = middlewares.bookingByIdSchema.parse({
        params: {
          id: req.params["id"],
        },
      });

      try {
        const booking = await req.locator.BookingService.getById(
          req.user,
          params.id,
        );
        return res.status(200).json({
          data: booking,
        });
      } catch (error) {
        handleError(error, res);
      }
    },
  );

  app.patch(
    "/bookings/:id",
    middlewares.validate(middlewares.updateBookingSchema),
    async (req: Request, res: Response) => {
      const { params, body } = middlewares.updateBookingSchema.parse({
        params: {
          id: req.params["id"],
        },
        body: req.body,
      });

      try {
        await req.locator.BookingService.update(
          req.user,
          params.id,
          body.startDate,
          body.endDate,
        );
        return res.status(200).json({ success: true });
      } catch (error) {
        handleError(error, res);
      }
    },
  );

  app.delete(
    "/bookings/:id",
    middlewares.validate(middlewares.bookingByIdSchema),
    async (req: Request, res: Response) => {
      const { params } = middlewares.bookingByIdSchema.parse({
        params: {
          id: req.params["id"],
        },
      });

      try {
        await req.locator.BookingService.deleteById(req.user, params.id);
        return res.status(200).json({ success: true });
      } catch (error) {
        handleError(error, res);
      }
    },
  );
}
