import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    optimizeDeps: {
      include: ["pdfjs-dist"],
    },

    assetsInclude: ["**/*.worker.mjs"],

    build: {
      sourcemap: mode !== "production",
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            pdfjs: ["pdfjs-dist"],
            mammoth: ["mammoth"],
            recharts: ["recharts"],
            mui: ["@mui/material", "@mui/icons-material"],
            react: ["react", "react-dom", "react-router-dom"],
            huggingface: ["@huggingface/inference"],
          },
        },
      },
    },
  };
});
