import type { DeepReadonly } from "ts-essentials";
import { UserService, createUserService } from "./user";
import { BookingService, createBookingService } from "./booking";
import { createDatabase } from "../database";
import { Database } from "../database/types";
import { Client } from "pg";

export type ServiceLocator = DeepReadonly<{
  Database: Database;
  UserService: UserService;
  BookingService: BookingService;
}>;

export function createLocator(client: Client): ServiceLocator {
  const db = createDatabase(client);

  return {
    Database: db,
    UserService: createUserService(db),
    BookingService: createBookingService(db),
  };
}
