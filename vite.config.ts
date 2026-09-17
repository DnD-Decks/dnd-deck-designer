import path from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    // e2e/*.spec.ts is Playwright's; vitest would otherwise collect it
    exclude: [...configDefaults.exclude, "e2e/**", ".claude/**"],
  },
});
