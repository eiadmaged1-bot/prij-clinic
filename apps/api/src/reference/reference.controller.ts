import { Controller, Get, Query, UseGuards } from "@nestjs/common";
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

  @Get("investigations/search")
  async investigationSearch(@Query("q") query = "") {
    return { query, results: await this.reference.searchInvestigations(query) };
  }

  @Get("operations")
  async operations() {
    return { operations: await this.reference.operations() };
  }

  @Get("operations/search")
  async operationSearch(@Query("q") query = "") {
    return { query, results: await this.reference.searchOperations(query) };
  }

  @Get("medications/search")
  async medicationSearch(@Query("q") query = "") {
    return { query, results: await this.reference.searchMedications(query) };
  }

  @Get("medication-tags")
  async medicationTags() {
    return { medicationTags: await this.reference.medicationTags() };
  }

  @Get("medication-classes")
  async medicationClasses() {
    return { medicationClasses: await this.reference.medicationClasses() };
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
