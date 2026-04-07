# @univer-community/sheets-csv-import-export

A plugin for importing and exporting CSV files in Univer Sheets.

- Extends `FUniver`, `FWorksheet`, and `FRange`
- UTF-8 default with explicit `charset` support on import
- Export returns `FBlob` for callers to download or transform themselves

## Installation

```bash
pnpm add @univer-community/sheets-csv-import-export
```

## Usage

### Register the logic plugin

```ts
import { UniverSheetsCsvImportExportPlugin } from "@univer-community/sheets-csv-import-export";

univer.registerPlugin(UniverSheetsCsvImportExportPlugin);
```

Create the facade API:

```ts
import { FUniver } from "@univerjs/core/facade";

const univerAPI = FUniver.newAPI(univer);
```

### Facade API Methods

#### `FUniver`

```ts
await univerAPI.importCsv(file, {
  mode: "replace-sheet",
  charset: "utf-8",
});

const blob = univerAPI.exportCsv({
  includeBom: true,
  lineBreak: "\r\n",
});
```

#### `FWorksheet`

```ts
const sheet = univerAPI.getActiveWorkbook().getActiveSheet();

await sheet.importCsv("name,city\nalice,shanghai", {
  mode: "new-sheet",
  newSheetName: "Imported CSV",
});

const blob = sheet.exportCsv({
  delimiter: ",",
  includeBom: true,
});
```

#### `FRange`

```ts
const range = univerAPI.getActiveWorkbook().getActiveSheet().getRange("B2:D10");

await range.importCsv(file, {
  mode: "replace-range",
});

const blob = range.exportCsv();
```

#### Download the returned `FBlob` yourself

```ts
const blob = sheet.exportCsv({ fileName: "report.csv", includeBom: true });
const nativeBlob = new Blob([await blob.getBytes()], {
  type: "text/csv;charset=utf-8",
});

const url = URL.createObjectURL(nativeBlob);
const link = document.createElement("a");
link.href = url;
link.download = "report.csv";
link.click();
URL.revokeObjectURL(url);
```

## API Notes

- `importCsv` accepts `string | Blob | File | FBlob`
- Import modes:
  - `replace-sheet`: overwrite from `A1`
  - `replace-range`: overwrite from the target range's top-left cell
  - `new-sheet`: create a new worksheet before writing
- `exportCsv` supports `delimiter`, `lineBreak`, and `includeBom`
- There is no built-in menu mounting or default UI flow in this package

## Local Development

Install dependencies:

```bash
pnpm install
```

Run lint:

```bash
pnpm lint
```

Run tests:

```bash
pnpm test
```

Run type checking:

```bash
pnpm typecheck
```

Build the library:

```bash
pnpm build
```

Build the demo:

```bash
pnpm build:demo
```

Start the demo:

```bash
pnpm dev
```

## Build Output

Running `pnpm build` generates:

- `lib/es`: ESM output
- `lib/cjs`: CommonJS output
- `lib/types`: TypeScript declaration files

## Demo

The `demo/` directory shows a complete CSV import/export flow:

- Initialize a Univer instance with the required Sheets and UI plugins
- Register `UniverSheetsCsvImportExportPlugin`
- Use the facade API to import CSV content into a new sheet
- Export sheet data as an `FBlob` and trigger a browser download

## License

MIT
