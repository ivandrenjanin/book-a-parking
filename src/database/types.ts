import { Client } from "pg";
import { z } from "zod";

export interface Database {
  client: Client;
  createTables(): Promise<void>;

  // Booking Queries
  getCreateTableQueries(): string[];
  insertBookingQuery(
    userId: number,
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Booking>;
  selectBookingQuery(id: number, userId?: number): Promise<Booking | null>;
  deleteBookingQuery(id: number): Promise<void>;
  updateBookingQuery(id: number, startDate: Date, endDate: Date): Promise<void>;
  selectBookingWithinTimeframe(
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Booking[] | null>;

  // User Queries
  selectUserQuery(id: number): Promise<User>;
}

export const roleSchema = z.union([z.literal("admin"), z.literal("standard")]);

export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: roleSchema,
  token: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

export const parkingSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Parking = z.infer<typeof parkingSchema>;

export const bookingSchema = z.object({
  id: z.number(),
  user: userSchema.omit({ token: true }).nullable(),
  parking: parkingSchema.nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Booking = z.infer<typeof bookingSchema>;

export interface BookingRaw {
  booking_id: number;
  created_by_user: number;
  parking_spot: number;
  start_date_time: Date;
  end_date_time: Date;
  created_at: Date;
  updated_at: Date;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  parking_id: number;
  parking_name: string;
}

export interface UserRaw {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  token: string | null;
}
