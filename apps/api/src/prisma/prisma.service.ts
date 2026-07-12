import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("PrismaService");

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('query', (e) => {
      if (e.duration >= 1000) {
        this.logger.warn(`Slow query [${e.duration}ms]: ${e.query}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
