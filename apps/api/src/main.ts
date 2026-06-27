import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadRootEnv } from "./config/env";

async function bootstrap() {
  loadRootEnv();

  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 3001);
  const webOrigin = process.env.APP_URL ?? "http://localhost:3000";

  app.enableCors({
    origin: webOrigin,
    credentials: true
  });

  await app.listen(port);
}

void bootstrap();
