import type { CsvImportSource, ICsvExportOptions, ICsvImportOptions, ICsvImportResult } from "../types";
import { FUniver } from "@univerjs/core/facade";
import { CsvImportExportService } from "../services/csv-import-export.service";

export interface IFUniverSheetsCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: ICsvImportOptions): Promise<ICsvImportResult>;
  exportCsv(options?: ICsvExportOptions): ReturnType<CsvImportExportService["exportCsv"]>;
}

export class FUniverSheetsCsvImportExportMixin extends FUniver implements IFUniverSheetsCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: ICsvImportOptions): Promise<ICsvImportResult> {
    return this._injector.get(CsvImportExportService).importCsv(source, options);
  }

  exportCsv(options?: ICsvExportOptions): ReturnType<CsvImportExportService["exportCsv"]> {
    return this._injector.get(CsvImportExportService).exportCsv(options);
  }
}

FUniver.extend(FUniverSheetsCsvImportExportMixin);

declare module "@univerjs/core/facade" {
  interface FUniver extends IFUniverSheetsCsvImportExportMixin {}
}
