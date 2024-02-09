import { Booking, Database, User } from "../database/types";
import { HttpException } from "../errors";

export interface BookingService {
  create(
    userId: number,
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<void>;
  getById(user: User, id: number): Promise<Booking>;
  deleteById(user: User, id: number): Promise<void>;
  update(user: User, id: number, startDate: Date, endDate: Date): Promise<void>;
}

export function createBookingService(db: Database): BookingService {
  const create = async (
    userId: number,
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<void> => {
    const overlaping = await db.selectBookingWithinTimeframe(
      parkingId,
      startDate,
      endDate,
    );

    if (overlaping && overlaping.length > 0) {
      throw new HttpException(422, "Unable to book");
    }

    await db.insertBookingQuery(userId, parkingId, startDate, endDate);
  };

  const getById = async (user: User, id: number): Promise<Booking> => {
    if (user.role === "admin") {
      const booking = await db.selectBookingQuery(id);
      if (!booking) {
        throw new HttpException(404, "Not Found");
      }

      return booking;
    }

    const booking = await db.selectBookingQuery(id, user.id);

    if (!booking) {
      throw new HttpException(404, "Not Found");
    }

    return booking;
  };

  const deleteById = async (user: User, id: number) => {
    const booking = await getById(user, id);
    return await db.deleteBookingQuery(booking.id);
  };

  const update = async (
    user: User,
    id: number,
    startDate: Date,
    endDate: Date,
  ) => {
    const booking = await getById(user, id);
    if (booking.parking === null) {
      throw new HttpException(422, "Unable to update, parking not attached");
    }

    const overlaping = await db.selectBookingWithinTimeframe(
      booking.parking.id,
      startDate,
      endDate,
    );

    if (overlaping && overlaping.length > 0) {
      throw new HttpException(
        422,
        "Unable to update booking, invalid timeframe",
      );
    }

    await db.updateBookingQuery(id, startDate, endDate);
  };

  return {
    create,
    getById,
    deleteById,
    update,
  };
}
