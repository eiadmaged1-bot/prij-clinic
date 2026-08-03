import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  healthAlias() {
    return { status: "up" };
  }

  @Get("live")
  health() {
    return { status: "up" };
  }

  @Get("ready")
  async databaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return { status: "ok", database: "connected" };
    } catch {
      throw new HttpException(
        { status: "error", database: "unavailable" },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get("db")
  databaseHealthAlias() {
    return this.databaseHealth();
  }
}
