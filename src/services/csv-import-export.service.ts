import type { CellValue, IMutationInfo, Workbook } from "@univerjs/core";
import type {
  ISetRangeValuesMutationParams,
  ISetWorksheetColumnCountMutationParams,
  ISetWorksheetRowCountMutationParams,
} from "@univerjs/sheets";
import type { CsvImportMode, CsvTarget, ICsvExportOptions, ICsvImportOptions, ICsvImportResult } from "../types";
import {
  covertCellValues,
  ICommandService,
  Inject,
  Injector,
  IUniverInstanceService,
  IUndoRedoService,
  sequenceExecute,
  UniverInstanceType,
} from "@univerjs/core";
import { IConfigService } from "@univerjs/core";
import { FWorkbook } from "@univerjs/sheets/facade";
import {
  SetRangeValuesMutation,
  SetRangeValuesUndoMutationFactory,
  SetWorksheetColumnCountMutation,
  SetWorksheetColumnCountUndoMutationFactory,
  SetWorksheetRowCountMutation,
  SetWorksheetRowCountUndoMutationFactory,
} from "@univerjs/sheets";
import {
  defaultPluginConfig,
  type IUniverSheetsCsvImportExportConfig,
  CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY,
} from "../config/config";
import { CsvCodecService } from "./csv-codec.service";
import { parseCsv, serializeCsv } from "../utils/csv";

export class CsvImportExportService {
  constructor(
    @Inject(Injector) private readonly _injector: Injector,
    @ICommandService private readonly _commandService: ICommandService,
    @IUndoRedoService private readonly _undoRedoService: IUndoRedoService,
    @Inject(IConfigService) private readonly _configService: IConfigService,
    @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService,
    @Inject(CsvCodecService) private readonly _codecService: CsvCodecService,
  ) {}

  async importCsv(
    source: Parameters<CsvCodecService["decodeSource"]>[0],
    options: ICsvImportOptions = {},
    fallbackTarget?: CsvTarget,
  ): Promise<ICsvImportResult> {
    const config = this._getConfig();
    const decoded = await this._codecService.decodeSource(source, options.charset ?? config.defaultCharset);
    const rows = parseCsv(decoded.text, {
      delimiter: options.delimiter ?? config.defaultDelimiter,
      skipEmptyLines: options.skipEmptyLines ?? config.defaultSkipEmptyLines,
    });

    if (rows.length === 0) {
      throw new Error("CSV contains no rows.");
    }

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const normalizedRows = rows.map((row) => fillRow(row, columnCount));
    const resolved = this._resolveImportTarget(options, fallbackTarget);

    if (resolved.mode === "new-sheet") {
      const workbook = resolved.workbook;
      const created = workbook.create(
        options.newSheetName ?? "Imported CSV",
        Math.max(normalizedRows.length, 1),
        Math.max(columnCount, 1),
      );
      this._applyMutations(created, 0, 0, normalizedRows, false);

      return {
        worksheet: created,
        range: created.getRange(0, 0, normalizedRows.length, columnCount),
        rowCount: normalizedRows.length,
        columnCount,
        charset: decoded.charset,
      };
    }

    const worksheet = resolved.worksheet;
    const startRow = resolved.mode === "replace-range" ? resolved.range.getRow() : 0;
    const startColumn = resolved.mode === "replace-range" ? resolved.range.getColumn() : 0;

    this._applyMutations(worksheet, startRow, startColumn, normalizedRows, resolved.mode === "replace-sheet");

    return {
      worksheet,
      range: worksheet.getRange(startRow, startColumn, normalizedRows.length, columnCount),
      rowCount: normalizedRows.length,
      columnCount,
      charset: decoded.charset,
    };
  }

  exportCsv(options: ICsvExportOptions = {}, fallbackTarget?: CsvTarget) {
    const config = this._getConfig();
    const target = this._resolveExportTarget(options, fallbackTarget);
    const rows = isWorksheetTarget(target)
      ? this._worksheetToRows(target)
      : target.getDisplayValues().map((row) => row.map((value) => value ?? ""));
    const text = serializeCsv(rows, {
      delimiter: options.delimiter ?? config.defaultDelimiter,
      lineBreak: options.lineBreak ?? config.defaultLineBreak,
    });

    return this._codecService.encodeText(text, options.includeBom ?? config.defaultIncludeBom);
  }

  private _applyMutations(
    worksheet: ReturnType<FWorkbook["getActiveSheet"]>,
    startRow: number,
    startColumn: number,
    rows: string[][],
    clearSheet: boolean,
  ): void {
    const rawWorkbook = worksheet.getWorkbook();
    const unitId = rawWorkbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const redoMutations: IMutationInfo<any>[] = [];
    const undoMutations: IMutationInfo<any>[] = [];

    if (clearSheet && worksheet.getLastRow() >= 0 && worksheet.getLastColumn() >= 0) {
      const currentRange = worksheet.getDataRange().getRange();
      const clearRows = Array.from({ length: currentRange.endRow - currentRange.startRow + 1 }, () =>
        Array.from(
          { length: currentRange.endColumn - currentRange.startColumn + 1 },
          () => null as unknown as CellValue,
        ),
      );
      const clearParams: ISetRangeValuesMutationParams = {
        unitId,
        subUnitId,
        cellValue: covertCellValues(clearRows, currentRange),
      };

      redoMutations.push({ id: SetRangeValuesMutation.id, params: clearParams });
      undoMutations.unshift({
        id: SetRangeValuesMutation.id,
        params: SetRangeValuesUndoMutationFactory(this._injector, clearParams),
      });
    }

    const requiredRowCount = Math.max(worksheet.getMaxRows(), startRow + rows.length);
    const requiredColumnCount = Math.max(worksheet.getMaxColumns(), startColumn + rows[0].length);

    if (requiredRowCount > worksheet.getMaxRows()) {
      const rowParams: ISetWorksheetRowCountMutationParams = {
        unitId,
        subUnitId,
        rowCount: requiredRowCount,
      };
      redoMutations.push({ id: SetWorksheetRowCountMutation.id, params: rowParams });
      undoMutations.unshift({
        id: SetWorksheetRowCountMutation.id,
        params: SetWorksheetRowCountUndoMutationFactory(this._injector, rowParams),
      });
    }

    if (requiredColumnCount > worksheet.getMaxColumns()) {
      const columnParams: ISetWorksheetColumnCountMutationParams = {
        unitId,
        subUnitId,
        columnCount: requiredColumnCount,
      };
      redoMutations.push({ id: SetWorksheetColumnCountMutation.id, params: columnParams });
      undoMutations.unshift({
        id: SetWorksheetColumnCountMutation.id,
        params: SetWorksheetColumnCountUndoMutationFactory(this._injector, columnParams),
      });
    }

    const writeRange = {
      startRow,
      endRow: startRow + rows.length - 1,
      startColumn,
      endColumn: startColumn + rows[0].length - 1,
    };
    const writeParams: ISetRangeValuesMutationParams = {
      unitId,
      subUnitId,
      cellValue: covertCellValues(rows, writeRange),
    };
    redoMutations.push({ id: SetRangeValuesMutation.id, params: writeParams });
    undoMutations.unshift({
      id: SetRangeValuesMutation.id,
      params: SetRangeValuesUndoMutationFactory(this._injector, writeParams),
    });

    const result = sequenceExecute(redoMutations, this._commandService);
    if (!result.result) {
      throw new Error("Failed to apply CSV mutations.");
    }

    this._undoRedoService.pushUndoRedo({
      unitID: unitId,
      undoMutations,
      redoMutations,
    });
  }

  private _resolveImportTarget(options: ICsvImportOptions, fallbackTarget?: CsvTarget) {
    const target = options.target ?? fallbackTarget;
    const workbook = target ? this._getWorkbookFromTarget(target) : this._getActiveWorkbook();
    const mode = options.mode ?? inferImportMode(target);

    if (mode === "new-sheet") {
      return {
        mode,
        workbook,
      };
    }

    const worksheet = target ? this._getWorksheetFromTarget(target) : workbook.getActiveSheet();

    return {
      mode,
      workbook,
      worksheet,
      range: isWorksheetTarget(target) || !target ? worksheet.getRange(0, 0, 1, 1) : target,
    };
  }

  private _resolveExportTarget(options: ICsvExportOptions, fallbackTarget?: CsvTarget): CsvTarget {
    if (options.target) {
      return options.target;
    }

    if (fallbackTarget) {
      return fallbackTarget;
    }

    return this._getActiveWorkbook().getActiveSheet();
  }

  private _getWorkbookFromTarget(target: CsvTarget): FWorkbook {
    const unitId = isWorksheetTarget(target) ? target.getWorkbook().getUnitId() : target.getUnitId();
    const rawWorkbook = this._univerInstanceService.getUnit<Workbook>(unitId, UniverInstanceType.UNIVER_SHEET);
    if (!rawWorkbook) {
      throw new Error("Unable to resolve workbook for the CSV target.");
    }

    return this._injector.createInstance(FWorkbook, rawWorkbook);
  }

  private _getWorksheetFromTarget(target: CsvTarget): ReturnType<FWorkbook["getActiveSheet"]> {
    if (isWorksheetTarget(target)) {
      return target;
    }

    const workbook = this._getWorkbookFromTarget(target);
    const worksheet = workbook.getSheetBySheetId(target.getSheetId());
    if (!worksheet) {
      throw new Error("Unable to resolve worksheet for the CSV range target.");
    }

    return worksheet;
  }

  private _getActiveWorkbook(): FWorkbook {
    const rawWorkbook = this._univerInstanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
    if (!rawWorkbook) {
      throw new Error("No active sheet workbook is available.");
    }

    return this._injector.createInstance(FWorkbook, rawWorkbook);
  }

  private _worksheetToRows(worksheet: ReturnType<FWorkbook["getActiveSheet"]>): string[][] {
    if (worksheet.getLastRow() < 0 || worksheet.getLastColumn() < 0) {
      return [];
    }

    return worksheet.getDataRange().getDisplayValues();
  }

  private _getConfig(): IUniverSheetsCsvImportExportConfig {
    return (
      this._configService.getConfig<IUniverSheetsCsvImportExportConfig>(CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY) ??
      defaultPluginConfig
    );
  }
}

function inferImportMode(target?: CsvTarget): CsvImportMode {
  if (!target) {
    return "replace-sheet";
  }

  return isWorksheetTarget(target) ? "replace-sheet" : "replace-range";
}

function isWorksheetTarget(target: CsvTarget | undefined): target is ReturnType<FWorkbook["getActiveSheet"]> {
  return Boolean(target && typeof (target as ReturnType<FWorkbook["getActiveSheet"]>).getSheet === "function");
}

function fillRow(row: string[], columnCount: number): string[] {
  if (row.length === columnCount) {
    return row;
  }

  return [...row, ...Array.from({ length: columnCount - row.length }, () => "")];
}
