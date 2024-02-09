import createApp from "../../src/app";
import request from "supertest";
import { ServiceLocator } from "../../src/services";
import { dbCleanup, seedData } from "../helpers/helpers";
import { startOfToday, addHours, subHours } from "date-fns";

describe("Booking API", () => {
  let express: Awaited<ReturnType<typeof createApp>>;
  let locator: ServiceLocator;

  beforeAll(async () => {
    express = await createApp({
      database: {
        host: "localhost",
        port: 5433,
        name: "postgres-test",
        user: "postgres",
        password: "postgres",
      },
    });

    locator = express.locator;
    await locator.Database.client.query(seedData);
  });

  afterAll(async () => {
    try {
      await locator.Database.client.query(dbCleanup);
      await locator.Database.client.end();
      express.server.close();
    } catch (err) {
      console.error(err);
      return;
    }
  });

  const adminToken = "Token-1";
  const standardToken2 = "Token-2";
  const standardToken3 = "Token-3";

  describe("POST /bookings", () => {
    const bookingIds: number[] = [];

    afterEach(async () => {
      if (bookingIds.length > 0) {
        await Promise.all(
          bookingIds.map((id) => locator.Database.deleteBookingQuery(id)),
        );
      }
    });

    it("should return forbidden error if no auth token", async () => {
      // Act
      const res = await request(express.app).post("/bookings").send({});

      // Assert
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });

    it("should return validation error if body does not contain valid data", async () => {
      // Arrange
      const body = {
        invalid_data: 0.0,
      };

      // Act
      const res = await request(express.app)
        .post("/bookings")
        .send(body)
        .set("x-user-token", adminToken);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("should not allow booking creation if parking is already booked for provided time", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const adminUserId = 1;
      const parkingId = 1;
      const existingBooking = await locator.Database.insertBookingQuery(
        adminUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(existingBooking.id);

      // Act
      const res = await request(express.app)
        .post("/bookings")
        .send({
          parkingId,
          startDate,
          endDate,
        })
        .set("x-user-token", standardToken2);

      // Assert
      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty("message", "Unable to book");
    });

    it("should create a booking", async () => {
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const parkingId = 1;

      // Act
      const res = await request(express.app)
        .post("/bookings")
        .send({
          parkingId,
          startDate,
          endDate,
        })
        .set("x-user-token", standardToken2);

      // Assert
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("success", true);
    });
  });

  describe("GET /bookings/:id", () => {
    const bookingIds: number[] = [];

    afterEach(async () => {
      if (bookingIds.length > 0) {
        await Promise.all(
          bookingIds.map((id) => locator.Database.deleteBookingQuery(id)),
        );
      }
    });

    it("should return forbidden error if no auth token", async () => {
      // Act
      const res = await request(express.app).get("/bookings/1");

      // Assert
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });

    it("should return validation error if id is of invalid format", async () => {
      // Act
      const res = await request(express.app)
        .get("/bookings/INVALID_ID")
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("should return not found error if booking does not exist", async () => {
      // Act
      const res = await request(express.app)
        .get("/bookings/123")
        .set("x-user-token", adminToken);

      // Assert
      expect(res.status).toEqual(404);
      expect(res.body).toHaveProperty("message", "Not Found");
    });

    it("should not allow to return booking not owned", async () => {
      // Arrange
      const booking = await locator.Database.insertBookingQuery(
        1,
        1,
        new Date(),
        new Date(),
      );
      bookingIds.push(booking?.id);

      // Act
      const res = await request(express.app)
        .get(`/bookings/${booking?.id}`)
        .set("x-user-token", standardToken2);

      // Assert
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("message", "Not Found");
    });

    it("should return booking", async () => {
      // Arrange
      const booking = await locator.Database.insertBookingQuery(
        1,
        1,
        new Date(),
        new Date(),
      );
      bookingIds.push(booking.id);
      // Act
      const res = await request(express.app)
        .get(`/bookings/${booking.id}`)
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data).toHaveProperty("parking");
    });
  });

  describe("PATCH /bookings/:id", () => {
    const bookingIds: number[] = [];

    afterEach(async () => {
      if (bookingIds.length > 0) {
        await Promise.all(
          bookingIds.map((id) => locator.Database.deleteBookingQuery(id)),
        );
      }
    });

    it("should return forbidden error if no auth token", async () => {
      // Act
      const res = await request(express.app).patch("/bookings/123");

      // Assert
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });

    it("should return validation error if id is of invalid format", async () => {
      // Act
      const res = await request(express.app)
        .patch("/bookings/INVALID_ID")
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("should return validation error if body does not contain valid data", async () => {
      // Arrange
      const body = {
        invalid_data: 0.0,
      };

      // Act
      const res = await request(express.app)
        .patch("/bookings/1")
        .send(body)
        .set("x-user-token", adminToken);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("should not allow an update on non owned booking", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const standardUserId = 2;
      const parkingId = 1;
      const booking = await locator.Database.insertBookingQuery(
        standardUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(booking.id);
      // Act
      const res = await request(express.app)
        .patch(`/bookings/${booking.id}`)
        .send({
          startDate: addHours(startDate, 2),
          endDate: addHours(endDate, 3),
        })
        .set("x-user-token", standardToken3);

      // Assert
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("message", "Not Found");
    });

    it("should not allow an update if time overlap exists from a different booking", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const otherUserId = 2;
      const parkingId = 1;
      const otherUsersBooking = await locator.Database.insertBookingQuery(
        otherUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(otherUsersBooking.id);

      const currentUserId = 3;
      const ownBooking = await locator.Database.insertBookingQuery(
        currentUserId,
        parkingId,
        subHours(startDate, 4),
        subHours(endDate, 3),
      );
      bookingIds.push(ownBooking.id);

      // Act
      const res = await request(express.app)
        .patch(`/bookings/${ownBooking.id}`)
        .set("x-user-token", standardToken3)
        .send({
          startDate: startDate,
          endDate: addHours(endDate, 2),
        });

      expect(res.statusCode).toEqual(422);
      expect(res.body).toHaveProperty(
        "message",
        "Unable to update booking, invalid timeframe",
      );
    });

    it("should allow admin to update a booking", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const standardUserId = 2;
      const parkingId = 1;
      const booking = await locator.Database.insertBookingQuery(
        standardUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(booking.id);

      const newStartDate = addHours(startDate, 3);
      const newEndDate = addHours(endDate, 4);

      // Act
      const res = await request(express.app)
        .patch(`/bookings/${booking.id}`)
        .send({
          startDate: newStartDate,
          endDate: newEndDate,
        })
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);

      const db = await locator.Database.client.query(
        `select * from bookings where id = $1`,
        [booking.id],
      );
      expect(db.rowCount).toEqual(1);
      expect(db.rows[0]).toHaveProperty("start_date_time", newStartDate);
      expect(db.rows[0]).toHaveProperty("end_date_time", newEndDate);
    });

    it("should allow user to update owned booking", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const otherUserId = 2;
      const parkingId = 1;
      const otherUsersBooking = await locator.Database.insertBookingQuery(
        otherUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(otherUsersBooking.id);

      const currentUserId = 3;
      const ownBooking = await locator.Database.insertBookingQuery(
        currentUserId,
        parkingId,
        subHours(startDate, 4),
        subHours(endDate, 3),
      );
      bookingIds.push(ownBooking.id);

      // Act
      const res = await request(express.app)
        .patch(`/bookings/${ownBooking.id}`)
        .set("x-user-token", standardToken3)
        .send({
          startDate: addHours(startDate, 3),
          endDate: addHours(endDate, 4),
        });

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });
  });

  describe("DELETE /bookings/:id", () => {
    const bookingIds: number[] = [];

    afterEach(async () => {
      if (bookingIds.length > 0) {
        await Promise.all(
          bookingIds.map((id) => locator.Database.deleteBookingQuery(id)),
        );
      }
    });

    it("should return forbidden error if no auth token", async () => {
      // Act
      const res = await request(express.app).delete("/bookings/123");

      // Assert
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });

    it("should return validation error if id is of invalid format", async () => {
      // Act
      const res = await request(express.app)
        .delete("/bookings/INVALID_ID")
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("should not allow delete to delete other users bookings if user is standard role", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const standardUserId = 2;
      const parkingId = 1;
      const booking = await locator.Database.insertBookingQuery(
        standardUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(booking.id);

      // Act
      const res = await request(express.app)
        .delete(`/bookings/${booking.id}`)
        .set("x-user-token", standardToken3);

      // Assert
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("message", "Not Found");

      const db = await locator.Database.client.query(
        "select id from bookings where id = $1",
        [booking.id],
      );
      expect(db.rows.length).toEqual(1);
    });

    it("should allow delete to admin user role", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const standardUserId = 2;
      const parkingId = 1;
      const booking = await locator.Database.insertBookingQuery(
        standardUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(booking.id);

      // Act
      const res = await request(express.app)
        .delete(`/bookings/${booking.id}`)
        .set("x-user-token", adminToken);

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);

      const db = await locator.Database.client.query(
        "select id from bookings where id = $1",
        [booking.id],
      );

      expect(db.rowCount).toEqual(0);
    });

    it("should allow delete to owner of the booking", async () => {
      // Arrange
      const startDate = startOfToday();
      const endDate = addHours(startDate, 2);
      const standardUserId = 2;
      const parkingId = 1;
      const booking = await locator.Database.insertBookingQuery(
        standardUserId,
        parkingId,
        startDate,
        endDate,
      );
      bookingIds.push(booking.id);

      // Act
      const res = await request(express.app)
        .delete(`/bookings/${booking.id}`)
        .set("x-user-token", standardToken2);

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);

      const db = await locator.Database.client.query(
        "select id from bookings where id = $1",
        [booking.id],
      );

      expect(db.rowCount).toEqual(0);
    });
  });
});
