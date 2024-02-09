import { Express } from "express";
import { registerBookingHandlers } from "./booking";

function register(app: Express) {
  registerBookingHandlers(app);
}

export default {
  register,
};
