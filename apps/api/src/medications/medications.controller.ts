import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { MedicationSafetyService } from "./medication-safety.service";
import { MedicationSearchService } from "./medication-search.service";
import { MedicationsService } from "./medications.service";
import { CreatePharmacologySummaryDto } from "./pharmacology-profile.dto";
import { CreateDermatologyFindingDto } from "./dermatology.dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicationsController {
  constructor(
    private readonly medications: MedicationsService,
    private readonly search: MedicationSearchService,
    private readonly safety: MedicationSafetyService
  ) {}

  @Get("medications/families")
  @Permissions("medications.read")
  families() {
    return this.medications.listFamilies();
  }

  @Get("medications/families/:id")
  @Permissions("medications.read")
  family(@Param("id") id: string) {
    return this.medications.getFamily(id);
  }

  @Post("medications/families")
  @Permissions("medications.manage_catalog")
  createFamily(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.createFamily(dto, user);
  }

  @Patch("medications/families/:id")
  @Permissions("medications.manage_catalog")
  updateFamily(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updateFamily(id, dto, user);
  }

  @Get("medications/ingredients")
  @Permissions("medications.read")
  ingredients() {
    return this.medications.listIngredients();
  }

  @Get("medications/ingredients/:id")
  @Permissions("medications.read")
  ingredient(@Param("id") id: string) {
    return this.medications.getIngredient(id);
  }

  @Post("medications/ingredients")
  @Permissions("medications.manage_catalog")
  createIngredient(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.createIngredient(dto, user);
  }

  @Patch("medications/ingredients/:id")
  @Permissions("medications.manage_catalog")
  updateIngredient(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updateIngredient(id, dto, user);
  }

  @Get("medications/products")
  @Permissions("medications.read")
  products() {
    return this.medications.listProducts();
  }

  @Get("medications/products/:id")
  @Permissions("medications.read")
  product(@Param("id") id: string) {
    return this.medications.getProduct(id);
  }

  @Post("medications/products")
  @Permissions("medications.manage_catalog")
  createProduct(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.createProduct(dto, user);
  }

  @Patch("medications/products/:id")
  @Permissions("medications.manage_catalog")
  updateProduct(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updateProduct(id, dto, user);
  }

  @Post("medications/search")
  @Permissions("medications.search")
  searchMedications(@Body() dto: { query?: string }) {
    return this.search.search(dto.query ?? "");
  }

  @Get("pharmacology/search")
  @Permissions("medications.search")
  pharmacologySearch(@Query("q") q: string | undefined) {
    return this.medications.searchPharmacology(q ?? "");
  }

  @Get("pharmacology/generics/:id")
  @Permissions("medications.read")
  pharmacologyProfile(@Param("id") id: string) {
    return this.medications.pharmacologyProfile(id);
  }

  @Post("pharmacology/generics/:id/summaries")
  @Permissions("medications.manage_catalog")
  createPharmacologySummary(@Param("id") id: string, @Body() dto: CreatePharmacologySummaryDto, @CurrentUser() user: AuthUser) {
    return this.medications.createPharmacologySummary(id, dto, user);
  }

  @Get("pharmacology/coverage")
  @Permissions("medications.read")
  pharmacologyCoverage() {
    return this.medications.pharmacologyCoverage();
  }

  @Get("dermatology/search")
  @Permissions("medications.search")
  dermatologySearch(@Query("q") q: string | undefined) { return this.medications.searchDermatology(q ?? ""); }

  @Get("dermatology/conditions/:id")
  @Permissions("medications.read")
  dermatologyCondition(@Param("id") id: string) { return this.medications.dermatologyCondition(id); }

  @Post("patients/:id/clinical-findings")
  @Permissions("clinical_tags.write")
  createClinicalFinding(@Param("id") id: string, @Body() dto: CreateDermatologyFindingDto, @CurrentUser() user: AuthUser) { return this.medications.createClinicalFinding(id, dto, user); }

  @Get("medications/ingredients/:id/label-sections")
  @Permissions("medications.read")
  ingredientLabels(@Param("id") id: string) {
    return this.medications.labelSectionsForIngredient(id);
  }

  @Post("medications/ingredients/:id/label-sections")
  @Permissions("medications.manage_catalog")
  addIngredientLabel(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.addLabelSection({ ingredientId: id }, dto, user);
  }

  @Get("medications/products/:id/label-sections")
  @Permissions("medications.read")
  productLabels(@Param("id") id: string) {
    return this.medications.labelSectionsForProduct(id);
  }

  @Post("medications/products/:id/label-sections")
  @Permissions("medications.manage_catalog")
  addProductLabel(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.addLabelSection({ productId: id }, dto, user);
  }

  @Get("medications/interactions")
  @Permissions("medications.read")
  interactions() {
    return this.medications.listInteractions();
  }

  @Post("medications/interactions")
  @Permissions("medications.manage_catalog")
  createInteraction(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.createInteraction(dto, user);
  }

  @Patch("medications/interactions/:id")
  @Permissions("medications.manage_catalog")
  updateInteraction(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updateInteraction(id, dto, user);
  }

  @Post("medications/safety-check")
  @Permissions("medications.safety_check")
  safetyCheck(@Body() dto: { patientId?: string; prescriptionId?: string; medications?: Array<Record<string, string>> }, @CurrentUser() user: AuthUser) {
    return this.safety.run(dto, user);
  }

  @Get("medications/safety-checks")
  @Permissions("medications.review_alerts")
  safetyChecks(@Query("patientId") patientId: string | undefined, @CurrentUser() user: AuthUser) {
    return this.safety.list(patientId, user);
  }

  @Get("medications/safety-checks/:id")
  @Permissions("medications.review_alerts")
  safetyCheckById(@Param("id") id: string) {
    return this.safety.get(id);
  }

  @Post("medications/safety-alerts/:id/review")
  @Permissions("medications.review_alerts")
  reviewAlert(@Param("id") id: string, @Body() dto: { status?: string }, @CurrentUser() user: AuthUser) {
    return this.safety.reviewAlert(id, dto, user);
  }

  @Post("medications/safety-alerts/:id/override")
  @Permissions("medications.override_alerts")
  overrideAlert(@Param("id") id: string, @Body() dto: { reason?: string }, @CurrentUser() user: AuthUser) {
    return this.safety.overrideAlert(id, dto, user);
  }

  @Get("herbals")
  @Permissions("medications.read")
  herbals() {
    return this.medications.listHerbals();
  }

  @Get("herbals/:id")
  @Permissions("medications.read")
  herbal(@Param("id") id: string) {
    return this.medications.getHerbal(id);
  }

  @Post("herbals")
  @Permissions("medications.manage_catalog")
  createHerbal(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.createHerbal(dto, user);
  }

  @Patch("herbals/:id")
  @Permissions("medications.manage_catalog")
  updateHerbal(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updateHerbal(id, dto, user);
  }

  @Post("herbals/search")
  @Permissions("medications.search")
  searchHerbals(@Body() dto: { query?: string }) {
    return this.search.search(dto.query ?? "");
  }

  @Get("patients/:id/medications")
  @Permissions("patient_medications.read")
  patientMedications(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.medications.listPatientMedications(id, user);
  }

  @Post("patients/:id/medications")
  @Permissions("patient_medications.write")
  addPatientMedication(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.addPatientMedication(id, dto, user);
  }

  @Patch("patients/:id/medications/:medicationId")
  @Permissions("patient_medications.write")
  updatePatientMedication(@Param("id") id: string, @Param("medicationId") medicationId: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updatePatientMedication(id, medicationId, dto, user);
  }

  @Post("patients/:id/medications/:medicationId/stop")
  @Permissions("patient_medications.write")
  stopPatientMedication(@Param("id") id: string, @Param("medicationId") medicationId: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.stopPatientMedication(id, medicationId, dto, user);
  }

  @Get("patients/:id/allergies")
  @Permissions("patient_allergies.read")
  patientAllergies(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.medications.listPatientAllergies(id, user);
  }

  @Post("patients/:id/allergies")
  @Permissions("patient_allergies.write")
  addPatientAllergy(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.addPatientAllergy(id, dto, user);
  }

  @Patch("patients/:id/allergies/:allergyId")
  @Permissions("patient_allergies.write")
  updatePatientAllergy(@Param("id") id: string, @Param("allergyId") allergyId: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) {
    return this.medications.updatePatientAllergy(id, allergyId, dto, user);
  }
}
