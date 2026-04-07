import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { build as tsdownBuild } from "tsdown";

const OUTPUT_DIRECTORY = "lib";

function cleanup() {
  const resolved = path.resolve(OUTPUT_DIRECTORY);
  if (existsSync(resolved)) {
    rmSync(resolved, { force: true, recursive: true });
  }
}

function collectExternalPackages() {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  return [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.peerDependencies ?? {})];
}

function collectEntries() {
  return [
    { key: "index", path: "src/index.ts" },
    { key: "facade", path: "src/facade/index.ts" },
  ];
}

async function buildProject(args) {
  if (args.includes("--cleanup")) {
    cleanup();
  }

  const externalPackages = collectExternalPackages();
  const entries = collectEntries();
  const outputs = [
    { format: "esm", outDir: "lib/es" },
    { format: "cjs", outDir: "lib/cjs" },
  ];

  await Promise.all(
    entries.flatMap((entry) => {
      return outputs.map(({ format, outDir }) =>
        tsdownBuild({
          clean: false,
          dts: false,
          entry: { [entry.key]: entry.path },
          format,
          outDir,
          deps: {
            neverBundle: externalPackages,
          },
          outExtensions: () => ({ js: ".js" }),
          outputOptions: {
            codeSplitting: false,
            entryFileNames: "[name].js",
            minify: true,
          },
        }),
      );
    }),
  );
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "build") {
    await buildProject(args);
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exitCode = 1;
});
