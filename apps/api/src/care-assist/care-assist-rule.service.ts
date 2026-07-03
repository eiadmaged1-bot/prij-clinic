import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CareAssistRuleService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.careAssistRule.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ category: "asc" }, { severity: "desc" }, { title: "asc" }]
    });
  }
}
