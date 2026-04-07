import { Inject, Injector } from "@univerjs/core";
import { FBlob } from "@univerjs/core/facade";
import type { CsvImportSource, ICsvDecodedText } from "../types";
import { decodeCsvBytes, encodeUtf8Csv } from "../utils/csv";

export class CsvCodecService {
  constructor(@Inject(Injector) private readonly _injector: Injector) {}

  async decodeSource(source: CsvImportSource, charset?: string): Promise<ICsvDecodedText> {
    if (typeof source === "string") {
      return {
        text: source,
        charset: charset ?? "utf-8",
        hasBom: false,
      };
    }

    const bytes = await this._readBytes(source);
    return decodeCsvBytes(bytes, charset);
  }

  encodeText(text: string, includeBom: boolean): FBlob {
    return this._injector.createInstance(FBlob, encodeUtf8Csv(text, includeBom));
  }

  private async _readBytes(source: Exclude<CsvImportSource, string>): Promise<Uint8Array> {
    if (isFacadeBlob(source)) {
      return source.getBytes();
    }

    return new Uint8Array(await source.arrayBuffer());
  }
}

function isFacadeBlob(value: Exclude<CsvImportSource, string>): value is FBlob {
  return typeof (value as FBlob).getBytes === "function";
}
