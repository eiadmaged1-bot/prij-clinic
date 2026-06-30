import { IsBoolean } from "class-validator";

export class FileAccessSettingsDto {
  @IsBoolean()
  downloadsAllowed!: boolean;
}
