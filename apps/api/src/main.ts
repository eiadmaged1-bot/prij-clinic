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

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  app.enableCors(createCorsOptions());

  await app.listen(port);
}

void bootstrap();
