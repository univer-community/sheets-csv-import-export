import type { FBlob } from "@univerjs/core/facade";
import type { FRange, FWorksheet } from "@univerjs/sheets/facade";

export type CsvImportMode = "replace-sheet" | "replace-range" | "new-sheet";
export type CsvLineBreak = "\n" | "\r\n";
export type CsvTarget = FWorksheet | FRange;
export type CsvImportSource = string | Blob | File | FBlob;

export interface ICsvImportOptions {
  target?: CsvTarget;
  mode?: CsvImportMode;
  charset?: string;
  delimiter?: string;
  skipEmptyLines?: boolean;
  newSheetName?: string;
}

export interface ICsvExportOptions {
  target?: CsvTarget;
  delimiter?: string;
  lineBreak?: CsvLineBreak;
  includeBom?: boolean;
  fileName?: string;
}

export interface ICsvImportResult {
  worksheet: FWorksheet;
  range: FRange;
  rowCount: number;
  columnCount: number;
  charset: string;
}

export interface ICsvDecodedText {
  text: string;
  charset: string;
  hasBom: boolean;
}
