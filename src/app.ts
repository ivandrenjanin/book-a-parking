import express, { Request, Response, NextFunction } from "express";
import handlers from "./handlers";
import middlewares from "./middlewares";
import { Config } from "./config";
import { createLocator } from "./services";
import { Client } from "pg";

export default async function createApp(config: Config) {
  const app = express();

  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  });

  try {
    await new Promise((resolve, reject) => {
      client.connect((err) => {
        if (err) {
          console.error("Can not aquire a db connection!");
          reject(err);
        } else {
          console.log("Created a db pool! 🚀");
          resolve(true);
        }
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const locator = createLocator(client);

  try {
    await locator.Database.createTables();
  } catch (err) {
    console.log("can not create tables");
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    req.locator = locator;
    next();
  });

  app.get("/ping", (req: Request, res: Response) => {
    res.status(200).json({
      message: "pong",
    });
  });

  middlewares.register(app);
  handlers.register(app);

  const server = app.listen(3000, () => {
    console.log("App is running on Port 3000");
  });

  return { server, app, locator };
}
