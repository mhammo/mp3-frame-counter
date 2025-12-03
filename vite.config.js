import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["./**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["node_modules", ".dist"],
  },
});
