import type { ICsvExportOptions, ICsvImportOptions, ICsvImportResult, CsvImportSource } from "../types";
import { FRange } from "@univerjs/sheets/facade";
import { CsvImportExportService } from "../services/csv-import-export.service";

export interface IFRangeCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: Omit<ICsvImportOptions, "target">): Promise<ICsvImportResult>;
  exportCsv(options?: Omit<ICsvExportOptions, "target">): ReturnType<CsvImportExportService["exportCsv"]>;
}

export class FRangeCsvImportExportMixin extends FRange implements IFRangeCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: Omit<ICsvImportOptions, "target">): Promise<ICsvImportResult> {
    return this._injector.get(CsvImportExportService).importCsv(source, options, this);
  }

  exportCsv(options?: Omit<ICsvExportOptions, "target">): ReturnType<CsvImportExportService["exportCsv"]> {
    return this._injector.get(CsvImportExportService).exportCsv(options, this);
  }
}

FRange.extend(FRangeCsvImportExportMixin);

declare module "@univerjs/sheets/facade" {
  interface FRange extends IFRangeCsvImportExportMixin {}
}
