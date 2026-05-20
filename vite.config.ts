import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      // iPad Mini 2 and similar devices cap at iOS 12 / Safari 12
      targets: ["iOS >= 12", "Safari >= 12"],
      modernTargets: ["iOS >= 12", "Safari >= 12"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime", "core-js/proposals/global-this"],
    }),
  ],
  build: {
    target: "es2015",
  },
});
