import { describe, expect, it } from "vitest";
import { decodeCsvBytes, encodeUtf8Csv, parseCsv, serializeCsv } from "./csv";

describe("csv utils", () => {
  it("parses quoted cells, escaped quotes, and line breaks", () => {
    const rows = parseCsv('name,notes\r\n"alice","line 1\nline ""2"""');

    expect(rows).toEqual([
      ["name", "notes"],
      ["alice", 'line 1\nline "2"'],
    ]);
  });

  it("skips blank rows by default", () => {
    expect(parseCsv("a,b\n\nc,d\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("serializes delimiters and quotes safely", () => {
    const text = serializeCsv([
      ["alpha", "beta,gamma"],
      ['"quoted"', "plain"],
    ]);

    expect(text).toBe('alpha,"beta,gamma"\n"""quoted""",plain');
  });

  it("detects and strips utf-8 bom while decoding", async () => {
    const blob = encodeUtf8Csv("a,b", true);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const decoded = decodeCsvBytes(bytes);

    expect(decoded.charset).toBe("utf-8");
    expect(decoded.hasBom).toBe(true);
    expect(decoded.text).toBe("a,b");
  });

  it("honors explicit charset while decoding utf-16le payloads", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x2c, 0x00, 0x62, 0x00]);
    const decoded = decodeCsvBytes(bytes);

    expect(decoded.charset).toBe("utf-16le");
    expect(decoded.text).toBe("a,b");
  });
});
