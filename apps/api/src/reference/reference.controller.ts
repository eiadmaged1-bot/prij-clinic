import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReferenceService } from "./reference.service";

@Controller("reference")
@UseGuards(JwtAuthGuard)
export class ReferenceController {
  constructor(private readonly reference: ReferenceService) {}

  @Get("investigations")
  async investigations() {
    return { investigations: await this.reference.investigations() };
  }

  @Get("operations")
  async operations() {
    return { operations: await this.reference.operations() };
  }

  @Get("services")
  async services() {
    return { services: await this.reference.services() };
  }

  @Get("medication-readiness")
  medicationReadiness() {
    return this.reference.medicationReadiness();
  }
}
