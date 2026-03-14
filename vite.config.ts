import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    tailwindcss(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: "release.zip" }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
