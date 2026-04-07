import type { Dependency } from "@univerjs/core";
import type { IUniverSheetsCsvImportExportConfig } from "./config/config";
import {
  DependentOn,
  IConfigService,
  Inject,
  Injector,
  merge,
  Plugin,
  registerDependencies,
  UniverInstanceType,
} from "@univerjs/core";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { defaultPluginConfig, CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY } from "./config/config";
import { CsvImportExportService } from "./services/csv-import-export.service";
import { CsvCodecService } from "./services/csv-codec.service";

@DependentOn(UniverSheetsPlugin)
export class UniverSheetsCsvImportExportPlugin extends Plugin {
  static override pluginName = "SHEETS_CSV_IMPORT_EXPORT_PLUGIN";
  static override packageName = "@univer-community/sheets-csv-import-export";
  static override type = UniverInstanceType.UNIVER_SHEET;

  constructor(
    private readonly _config: Partial<IUniverSheetsCsvImportExportConfig> = defaultPluginConfig,
    @Inject(Injector) protected readonly _injector: Injector,
    @IConfigService private readonly _configService: IConfigService,
  ) {
    super();

    const config = merge({}, defaultPluginConfig, this._config);
    this._configService.setConfig(CSV_IMPORT_EXPORT_PLUGIN_CONFIG_KEY, config);
  }

  override onStarting(): void {
    registerDependencies(this._injector, [[CsvCodecService], [CsvImportExportService]] as Dependency[]);
  }
}
