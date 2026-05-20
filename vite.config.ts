import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      // iPad Mini 2 caps at iOS 12 / Safari 12. Safari 12 supports <script type="module">
      // but not modern syntax — ship only the legacy SystemJS bundle (no modern chunk).
      targets: ["iOS >= 12", "Safari >= 12"],
      renderModernChunks: false,
      additionalLegacyPolyfills: [
        "regenerator-runtime/runtime",
        "core-js/proposals/global-this",
        "core-js/stable/url",
        "core-js/stable/url-search-params",
      ],
    }),
  ],
});
