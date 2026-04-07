import type { CsvLineBreak } from "../types";

export const CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY = "CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY";

export interface IUniverSheetsCsvImportExportConfig {
  enabled: boolean;
  defaultCharset: string;
  defaultDelimiter: string;
  defaultLineBreak: CsvLineBreak;
  defaultIncludeBom: boolean;
  defaultSkipEmptyLines: boolean;
}

export const defaultPluginConfig: IUniverSheetsCsvImportExportConfig = {
  enabled: true,
  defaultCharset: "utf-8",
  defaultDelimiter: ",",
  defaultLineBreak: "\n",
  defaultIncludeBom: false,
  defaultSkipEmptyLines: true,
};
