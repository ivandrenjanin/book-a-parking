import { z } from "zod";

export const configSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.coerce.number(),
    name: z.string(),
    user: z.string(),
    password: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function createConfig(overrides?: Partial<Config>) {
  const config = configSchema.safeParse({
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    ...(overrides ? overrides : {}),
  });

  if (!config.success) {
    console.error("failed to parse config: ", config.error);
    process.exit(1);
  }

  return config.data;
}
