import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { build as tsdownBuild } from "tsdown";

const OUTPUT_DIRECTORIES = ["lib/es", "lib/cjs"];

function collectEntries() {
  return [
    ["index", "src/index.ts"],
    ["plugin", "src/plugin.ts"],
    ["ui-plugin", "src/ui-plugin.ts"],
    ["facade", "src/facade/index.ts"],
    ["locale/en-US", "src/locale/en-US.ts"],
  ];
}

function cleanup() {
  for (const directory of OUTPUT_DIRECTORIES) {
    const resolved = path.resolve(directory);
    if (existsSync(resolved)) {
      rmSync(resolved, { force: true, recursive: true });
    }
  }
}

function collectExternalPackages() {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  return [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.peerDependencies ?? {})];
}

async function buildProject(args: string[]) {
  if (args.includes("--cleanup")) {
    cleanup();
  }

  const externalPackages = collectExternalPackages();
  const entries = collectEntries();
  const outputs = [
    { format: "esm" as const, outDir: "lib/es" },
    { format: "cjs" as const, outDir: "lib/cjs" },
  ];

  await Promise.all(
    entries.flatMap(([key, entryPath]) => {
      return outputs.map(({ format, outDir }) =>
        tsdownBuild({
          clean: false,
          dts: false,
          entry: { [key]: entryPath },
          format,
          outDir,
          sourcemap: true,
          deps: {
            neverBundle: externalPackages,
          },
          outputOptions: {
            codeSplitting: true,
            minify: true,
          },
        }),
      );
    }),
  );
}

const [command, ...args] = process.argv.slice(2);

if (!command || command === "build") {
  await buildProject(args);
} else {
  process.stderr.write(`Unknown command: ${command}\n`);
  process.exitCode = 1;
}
