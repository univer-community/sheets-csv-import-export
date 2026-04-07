import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["unicorn", "typescript", "oxc", "import"],
});
