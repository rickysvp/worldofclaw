import { buildApp } from "./app";
import { env } from "./env";

const start = async (): Promise<void> => {
  const app = buildApp();

  const shutdown = async (): Promise<void> => {
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({
    port: env.APP_PORT,
    host: env.APP_HOST
  });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
