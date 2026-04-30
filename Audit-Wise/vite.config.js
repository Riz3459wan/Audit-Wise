import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    optimizeDeps: {
      include: ["pdfjs-dist", "@huggingface/inference"],
      exclude: ["@huggingface/inference/dist/index.js"],
    },

    assetsInclude: ["**/*.worker.mjs", "**/*.wasm"],

    build: {
      sourcemap: mode !== "production",
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            pdfjs: ["pdfjs-dist"],
            mammoth: ["mammoth"],
            recharts: ["recharts"],
            mui: [
              "@mui/material",
              "@mui/icons-material",
              "@emotion/react",
              "@emotion/styled",
            ],
            react: ["react", "react-dom", "react-router-dom"],
            huggingface: ["@huggingface/inference"],
            tesseract: ["tesseract.js"],
            xlsx: ["xlsx"],
          },
        },
      },
    },

    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  };
});
