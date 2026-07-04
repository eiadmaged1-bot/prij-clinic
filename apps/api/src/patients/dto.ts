import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import {
  ConsentStatus,
  ConsentType,
  InvestigationCategory,
  InvestigationPriority,
  PaymentMethod,
  PatientStatus,
  PatientType,
  ReportCategory,
  SexualActivityStatus
} from "@prisma/client";

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  medicalRecordNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sex?: string;

  @IsOptional()
  @IsEnum(PatientType)
  patientType?: PatientType;

  @IsOptional()
  @IsEnum(SexualActivityStatus)
  sexualActivityStatus?: SexualActivityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sex?: string;

  @IsOptional()
  @IsEnum(PatientType)
  patientType?: PatientType;

  @IsOptional()
  @IsEnum(SexualActivityStatus)
  sexualActivityStatus?: SexualActivityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PatientContextAppointmentDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appointmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PatientContextQueueDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}

export class PatientContextEncounterDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  examText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assessmentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  planText?: string;
}

export class PatientContextPrescriptionItemDto {
  @IsString()
  @MaxLength(160)
  medicationName!: string;

  @IsOptional()
  @IsUUID()
  medicationProductId?: string;

  @IsOptional()
  @IsUUID()
  drugMarketVariantId?: string;

  @IsOptional()
  @IsUUID()
  medicationGenericId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class PatientContextPrescriptionDto {
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PatientContextPrescriptionItemDto)
  items!: PatientContextPrescriptionItemDto[];
}

export class PatientContextInvestigationItemDto {
  @IsEnum(InvestigationCategory)
  category!: InvestigationCategory;

  @IsString()
  @MaxLength(160)
  testName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class PatientContextInvestigationDto {
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsEnum(InvestigationPriority)
  priority?: InvestigationPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PatientContextInvestigationItemDto)
  items!: PatientContextInvestigationItemDto[];
}

export class PatientContextReportDto {
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsUUID()
  investigationOrderId?: string;

  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultSummary?: string;
}

export class PatientContextUltrasoundDto {
  @IsOptional()
  @IsUUID()
  pregnancyId?: string;

  @IsOptional()
  @IsUUID()
  fetusId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scanType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gestationalAgeDisplay?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(45)
  gestationalAgeWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gestationalAgeDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fetalHeartText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  presentation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  placenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  amnioticFluid?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  bpdMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  hcMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  acMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  flMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7000)
  efwGrams?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  dopplerNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impressionText?: string;
}

export class PatientContextInvoiceItemDto {
  @IsOptional()
  @IsUUID()
  serviceItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitAmount?: number;
}

export class PatientContextInvoiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  discountReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PatientContextInvoiceItemDto)
  items!: PatientContextInvoiceItemDto[];
}

export class PatientContextPaymentDto {
  @IsUUID()
  invoiceId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  referenceNote?: string;
}

export class PatientContextConsentDto {
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @IsEnum(ConsentStatus)
  status!: ConsentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PatientHistorySheetDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsObject()
  menstrualHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  obstetricHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  gynecologicalHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  contraceptionHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  infertilityHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pastMedicalHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  allergyHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  familyHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  socialHistory?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class PatientOperationHistoryDto {
  @IsOptional()
  @IsUUID()
  historySheetId?: string;

  @IsOptional()
  @IsUUID()
  operationCatalogItemId?: string;

  @IsString()
  @MaxLength(180)
  operationNameSnapshot!: string;

  @IsOptional()
  @IsDateString()
  approximateDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class PatientMedicationHistoryDto {
  @IsOptional()
  @IsUUID()
  historySheetId?: string;

  @IsOptional()
  @IsUUID()
  medicationGenericId?: string;

  @IsString()
  @MaxLength(180)
  genericNameSnapshot!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  familyNameSnapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  currentOrPast?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class PatientInvestigationHistoryDto {
  @IsOptional()
  @IsUUID()
  historySheetId?: string;

  @IsOptional()
  @IsUUID()
  investigationCatalogItemId?: string;

  @IsString()
  @MaxLength(180)
  investigationNameSnapshot!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  context?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
