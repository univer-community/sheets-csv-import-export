import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "demo",
  build: {
    outDir: path.resolve(process.cwd(), "demo-dist"),
    emptyOutDir: true,
  },
});
