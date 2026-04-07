import { describe, expect, it } from "vitest";
import { UniverSheetsCsvImportExportPlugin } from "../plugin";
import { SHEETS_CSV_IMPORT_EXPORT_PLUGIN } from "../constants";

describe("UniverSheetsCsvImportExportPlugin", () => {
  it("exposes a stable plugin name", () => {
    expect(UniverSheetsCsvImportExportPlugin.pluginName).toBe(SHEETS_CSV_IMPORT_EXPORT_PLUGIN);
  });
});
