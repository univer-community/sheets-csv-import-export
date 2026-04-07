import type { CsvLineBreak, ICsvDecodedText } from "../types";

const UTF8_BOM = [0xef, 0xbb, 0xbf];
const UTF16_LE_BOM = [0xff, 0xfe];
const UTF16_BE_BOM = [0xfe, 0xff];

export interface IParseCsvOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
}

export interface ISerializeCsvOptions {
  delimiter?: string;
  lineBreak?: CsvLineBreak;
}

export function parseCsv(text: string, options: IParseCsvOptions = {}): string[][] {
  const delimiter = options.delimiter ?? ",";
  const skipEmptyLines = options.skipEmptyLines ?? true;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r") {
      row.push(field);
      pushCsvRow(rows, row, skipEmptyLines);
      row = [];
      field = "";
      if (nextChar === "\n") {
        index += 1;
      }
      continue;
    }

    if (char === "\n") {
      row.push(field);
      pushCsvRow(rows, row, skipEmptyLines);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  pushCsvRow(rows, row, skipEmptyLines);

  if (inQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  return rows;
}

export function serializeCsv(rows: Array<Array<unknown>>, options: ISerializeCsvOptions = {}): string {
  const delimiter = options.delimiter ?? ",";
  const lineBreak = options.lineBreak ?? "\n";

  return rows.map((row) => row.map((value) => escapeCsvField(value, delimiter)).join(delimiter)).join(lineBreak);
}

export function decodeCsvBytes(bytes: Uint8Array, charset?: string): ICsvDecodedText {
  const bom = detectBom(bytes);
  const resolvedCharset = charset ?? bom.charset ?? "utf-8";
  const start = charset ? 0 : bom.byteLength;
  const text = new TextDecoder(resolvedCharset).decode(bytes.slice(start));

  return {
    text,
    charset: resolvedCharset,
    hasBom: bom.byteLength > 0,
  };
}

export function encodeUtf8Csv(text: string, includeBom: boolean): Blob {
  const encoder = new TextEncoder();
  const payload = encoder.encode(text);

  if (!includeBom) {
    return new Blob([payload], { type: "text/csv;charset=utf-8" });
  }

  const withBom = new Uint8Array(UTF8_BOM.length + payload.length);
  withBom.set(UTF8_BOM, 0);
  withBom.set(payload, UTF8_BOM.length);
  return new Blob([withBom], { type: "text/csv;charset=utf-8" });
}

function escapeCsvField(value: unknown, delimiter: string): string {
  const text = value == null ? "" : String(value);
  if (text.includes('"') || text.includes("\n") || text.includes("\r") || text.includes(delimiter)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function pushCsvRow(rows: string[][], row: string[], skipEmptyLines: boolean): void {
  if (skipEmptyLines && row.every((cell) => cell === "")) {
    return;
  }
  rows.push([...row]);
}

function detectBom(bytes: Uint8Array): { charset?: string; byteLength: number } {
  if (startsWithBytes(bytes, UTF8_BOM)) {
    return { charset: "utf-8", byteLength: UTF8_BOM.length };
  }

  if (startsWithBytes(bytes, UTF16_LE_BOM)) {
    return { charset: "utf-16le", byteLength: UTF16_LE_BOM.length };
  }

  if (startsWithBytes(bytes, UTF16_BE_BOM)) {
    return { charset: "utf-16be", byteLength: UTF16_BE_BOM.length };
  }

  return { byteLength: 0 };
}

function startsWithBytes(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }

  return prefix.every((byte, index) => bytes[index] === byte);
}
