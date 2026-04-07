import type { ICsvExportOptions, ICsvImportOptions, ICsvImportResult, CsvImportSource } from "../types";
import { FWorksheet } from "@univerjs/sheets/facade";
import { CsvImportExportService } from "../services/csv-import-export.service";

export interface IFWorksheetCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: Omit<ICsvImportOptions, "target">): Promise<ICsvImportResult>;
  exportCsv(options?: Omit<ICsvExportOptions, "target">): ReturnType<CsvImportExportService["exportCsv"]>;
}

export class FWorksheetCsvImportExportMixin extends FWorksheet implements IFWorksheetCsvImportExportMixin {
  importCsv(source: CsvImportSource, options?: Omit<ICsvImportOptions, "target">): Promise<ICsvImportResult> {
    return this._injector.get(CsvImportExportService).importCsv(source, options, this);
  }

  exportCsv(options?: Omit<ICsvExportOptions, "target">): ReturnType<CsvImportExportService["exportCsv"]> {
    return this._injector.get(CsvImportExportService).exportCsv(options, this);
  }
}

FWorksheet.extend(FWorksheetCsvImportExportMixin);

declare module "@univerjs/sheets/facade" {
  interface FWorksheet extends IFWorksheetCsvImportExportMixin {}
}
