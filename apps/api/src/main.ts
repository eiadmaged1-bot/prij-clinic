import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { loadRootEnv, validateRuntimeEnv } from "./config/env";
import { createCorsOptions } from "./config/cors-origins";

async function bootstrap() {
  loadRootEnv();
  validateRuntimeEnv();

  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 3001);
  const host = process.env.API_HOST;

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  app.enableCors(createCorsOptions());

  if (host) {
    await app.listen(port, host);
    return;
  }

  await app.listen(port);
}

void bootstrap();
