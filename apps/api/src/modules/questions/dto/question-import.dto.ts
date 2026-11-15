import { IsArray } from "class-validator";
import type { QuestionImportPreviewRowDto } from "@fpt-campus/shared";

export class QuestionImportConfirmDto {
  @IsArray()
  rows!: QuestionImportPreviewRowDto[];
}
