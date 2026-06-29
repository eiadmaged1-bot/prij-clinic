export class AskGuidelineDto {
  question!: string;
  specialty?: string;
  topic?: string;
  mode?: "concise" | "compare" | "reading_list" | "management_summary";
}
