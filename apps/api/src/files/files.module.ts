import { Module } from "@nestjs/common";
import { ImageSanitizerService } from "./image-sanitizer.service";
import { PatientFileStorageService } from "./patient-file-storage.service";

@Module({
  providers: [ImageSanitizerService, PatientFileStorageService],
  exports: [ImageSanitizerService, PatientFileStorageService]
})
export class FilesModule {}
