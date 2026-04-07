import { FUniver } from "@univerjs/core/facade";
import { LocaleType, mergeLocales, Univer, UniverInstanceType } from "@univerjs/core";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import { UniverSheetsNumfmtUIPlugin } from "@univerjs/sheets-numfmt-ui";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverSheetsCsvImportExportPlugin } from "../src";

import DesignEnUS from "@univerjs/design/locale/en-US";
import UIEnUS from "@univerjs/ui/locale/en-US";
import DocsUIEnUS from "@univerjs/docs-ui/locale/en-US";
import SheetsEnUS from "@univerjs/sheets/locale/en-US";
import SheetsFormulaUIEnUS from "@univerjs/sheets-formula-ui/locale/en-US";
import SheetsNumfmtUIEnUS from "@univerjs/sheets-numfmt-ui/locale/en-US";
import SheetsUIEnUS from "@univerjs/sheets-ui/locale/en-US";

import { CSV_CONTENT_TYPE } from "../src/constants";

import "@univerjs/design/lib/index.css";
import "@univerjs/ui/facade";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula-ui/lib/index.css";
import "@univerjs/sheets-numfmt-ui/lib/index.css";
import "../src/facade";

const univer = new Univer({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      DesignEnUS,
      UIEnUS,
      DocsUIEnUS,
      SheetsEnUS,
      SheetsUIEnUS,
      SheetsFormulaUIEnUS,
      SheetsNumfmtUIEnUS,
    ),
  },
});

univer.registerPlugin(UniverRenderEnginePlugin);
univer.registerPlugin(UniverFormulaEnginePlugin);
univer.registerPlugin(UniverUIPlugin, { container: "app" });
univer.registerPlugin(UniverDocsPlugin);
univer.registerPlugin(UniverDocsUIPlugin);
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsUIPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);
univer.registerPlugin(UniverSheetsFormulaUIPlugin);
univer.registerPlugin(UniverSheetsNumfmtPlugin);
univer.registerPlugin(UniverSheetsNumfmtUIPlugin);
univer.registerPlugin(UniverSheetsCsvImportExportPlugin);
univer.createUnit(UniverInstanceType.UNIVER_SHEET, {});

const univerAPI = FUniver.newAPI(univer);
const activeWorkbook = univerAPI.getActiveWorkbook();
if (!activeWorkbook) {
  throw new Error("Demo workbook was not created.");
}

const activeSheet = activeWorkbook.getActiveSheet();
activeSheet.getRange("A1:C3").setValues([
  ["name", "city", "score"],
  ["alice", "shanghai", 91],
  ["bob", "singapore", 88],
]);

document.getElementById("facade-import")?.addEventListener("click", async () => {
  await activeSheet.importCsv("product,qty,price\nkeyboard,2,99\nmouse,1,39", {
    mode: "new-sheet",
    newSheetName: "Facade Import",
  });
});

document.getElementById("facade-export")?.addEventListener("click", async () => {
  const blob = activeSheet.exportCsv({ includeBom: true, fileName: "facade-export.csv" });
  const nativeBlob = new Blob([toBlobPart(await blob.getBytes())], { type: CSV_CONTENT_TYPE });
  const url = URL.createObjectURL(nativeBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "facade-export.csv";
  link.click();
  URL.revokeObjectURL(url);
});

function toBlobPart(bytes: Uint8Array): ArrayBuffer {
  if (bytes.buffer instanceof ArrayBuffer) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  return Uint8Array.from(bytes).buffer;
}
