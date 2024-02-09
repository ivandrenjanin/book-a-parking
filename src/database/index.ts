import { Client } from "pg";
import {
  Booking,
  BookingRaw,
  User,
  UserRaw,
  roleSchema,
  Database,
} from "./types";

export function createDatabase(client: Client): Database {
  const getCreateTableQueries = (): string[] => {
    const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(50) NOT NULL UNIQUE,
      role VARCHAR(10) NOT NULL,
      token VARCHAR(50)
    );
    `;

    const createParkingTable = `
    CREATE TABLE IF NOT EXISTS parkings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL
    );
    `;

    const createBookingTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      created_by_user INT,
      parking_spot INT,
      start_date_time TIMESTAMP NOT NULL,
      end_date_time TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT(now()),
      updated_at TIMESTAMP DEFAULT(now()),
      CONSTRAINT fk_users FOREIGN KEY(created_by_user) REFERENCES users(id),
      CONSTRAINT fk_parkings FOREIGN KEY(parking_spot) REFERENCES parkings(id)
    );
    `;

    return [createUserTable, createParkingTable, createBookingTable];
  };

  const createTables = async () => {
    const tables = getCreateTableQueries();
    for (const table of tables) {
      try {
        await client.query(table);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  };

  const insertBookingQuery = async (
    userId: number,
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Booking> => {
    const query = `
    INSERT INTO bookings (
      created_by_user,
      parking_spot,
      start_date_time,
      end_date_time
    ) VALUES ($1, $2, $3, $4)
    RETURNING 
      id as booking_id,
      created_by_user,
      parking_spot,
      start_date_time,
      end_date_time,
      created_at,
      updated_at;
    `;
    const values = [userId, parkingId, startDate, endDate];

    try {
      const result = await client.query(query, values);
      if (result.rowCount === 0) {
        throw new Error("Internal Server Error");
      }

      return serializeBookingResponse(result.rows, {
        user: false,
        parking: false,
      })[0];
    } catch (error) {
      throw new Error("Unprocessable Entity");
    }
  };

  const selectBookingQuery = async (
    id: number,
    userId?: number,
  ): Promise<Booking | null> => {
    let query = `
    SELECT 
      b.id as booking_id,
      b.created_by_user,
      b.parking_spot,
      b.start_date_time,
      b.end_date_time,
      b.created_at,
      b.updated_at,
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      p.id AS parking_id,
      p.name AS parking_name
    FROM 
      bookings b 
    JOIN 
      users u ON b.created_by_user = u.id
    JOIN
      parkings p ON b.parking_spot = p.id
    WHERE b.id = $1
    `;

    const values = [id];
    if (userId) {
      query += " AND u.id = $2 LIMIT 1;";
      values.push(userId);
    } else {
      query += " LIMIT 1;";
    }

    try {
      const result = await client.query<BookingRaw>(query, values);
      if (!result.rowCount) {
        return null;
      }

      return serializeBookingResponse(result.rows, {
        user: true,
        parking: true,
      })[0];
    } catch (error) {
      throw error;
    }
  };

  const updateBookingQuery = async (
    id: number,
    startDate: Date,
    endDate: Date,
  ) => {
    const query = `
    UPDATE bookings 
      SET 
        start_date_time = $1,
        end_date_time = $2
    WHERE id = $3;
    `;
    const values = [startDate, endDate, id];

    try {
      await client.query(query, values);
    } catch (error) {
      throw new Error("Unprocessable Entity");
    }
  };

  const deleteBookingQuery = async (id: number) => {
    const query = `
    DELETE FROM bookings WHERE id = $1;
    `;
    const values = [id];
    try {
      await client.query(query, values);
    } catch (error) {
      throw new Error("Unprocessable Entity");
    }
  };

  const selectBookingWithinTimeframe = async (
    parkingId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Booking[] | null> => {
    const query = `
      SELECT 
        b.id as booking_id,
        b.created_by_user,
        b.parking_spot,
        b.start_date_time,
        b.end_date_time,
        b.created_at,
        b.updated_at,
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        p.id AS parking_id,
        p.name AS parking_name
      FROM 
        bookings b 
      JOIN 
        users u ON b.created_by_user = u.id
      JOIN
        parkings p ON b.parking_spot = p.id
      WHERE 
        b.parking_spot = $1 AND
        (
          (b.start_date_time <= $3 AND b.end_date_time >= $2) OR
          (b.start_date_time >= $2 AND b.start_date_time <= $3)
        );
    `;
    const values = [parkingId, startDate, endDate];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return serializeBookingResponse(result.rows);
  };
  const selectUserQuery = async (id: number): Promise<User> => {
    const query = `
    SELECT * FROM users WHERE id = $1 LIMIT 1;
    `;
    const values = [id];
    try {
      const result = await client.query<UserRaw>(query, values);
      if (!result.rowCount) {
        throw new Error("Not Found");
      }

      return serializeUserResponse(result.rows)[0];
    } catch (error) {
      throw error;
    }
  };

  const serializeUserResponse = (rows: UserRaw[]): User[] => {
    const results: User[] = [];
    for (const row of rows) {
      results.push({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: roleSchema.parse(row.role),
        token: row.token,
      });
    }
    return results;
  };

  const serializeBookingResponse = (
    rows: BookingRaw[],
    includes?: { user: boolean; parking: boolean },
  ): Booking[] => {
    const result: Booking[] = [];
    for (const row of rows) {
      const data: Booking = {
        id: row.booking_id,
        user: null,
        parking: null,
        startDate: row.start_date_time,
        endDate: row.end_date_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      if (includes?.user) {
        data.user = {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: roleSchema.parse(row.role),
        };
      }

      if (includes?.parking) {
        data.parking = {
          id: row.parking_id,
          name: row.parking_name,
        };
      }

      result.push(data);
    }

    return result;
  };

  return {
    client,
    createTables,
    insertBookingQuery,
    selectBookingQuery,
    deleteBookingQuery,
    updateBookingQuery,
    selectUserQuery,
    getCreateTableQueries,
    selectBookingWithinTimeframe,
  };
}
