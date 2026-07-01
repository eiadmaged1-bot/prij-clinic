import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { loadRootEnv, validateRuntimeEnv } from "./config/env";

function configuredOrigins() {
  return (process.env.CORS_ORIGINS ?? process.env.APP_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isLocalDemoLanOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const octets = url.hostname.split(".").map((part) => Number(part));
    const first = octets[0] ?? Number.NaN;
    const second = octets[1] ?? Number.NaN;
    const isWebPort = url.port === "3000";
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isPrivateLan =
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127);

    return isHttp && isWebPort && (isLocalhost || isPrivateLan);
  } catch {
    return false;
  }
}

async function bootstrap() {
  loadRootEnv();
  validateRuntimeEnv();

  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 3001);
  const allowedOrigins = configuredOrigins();
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || (!isProduction && isLocalDemoLanOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  });

  await app.listen(port);
}

void bootstrap();
