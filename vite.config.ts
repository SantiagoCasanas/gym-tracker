import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Aliases mirror the `paths` in tsconfig.app.json so `import ... from "models/..."`
// works both in the TS compiler and in the Vite bundler. Relative paths are
// resolved by Vite against the project root — no node:url / import.meta needed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      models: "/src/models",
      services: "/src/services",
    },
  },
});
