import createApp from "./app";
import { User } from "./database/types";
import { ServiceLocator } from "./services";

declare global {
  namespace Express {
    interface Request {
      user: User;
      locator: ServiceLocator;
    }
  }
}

async function init() {
  try {
    await createApp({
      database: {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "postgres",
        name: "postgres",
      },
    });
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  void init();
}
