import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const HF_TOKEN = env.VITE_HF_TOKEN || "";

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
          },
        },
      },
    },

    server: {
      proxy: {
        "/api/huggingface": {
          target: "https://api-inference.huggingface.co",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/huggingface/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (HF_TOKEN) {
                proxyReq.setHeader("Authorization", `Bearer ${HF_TOKEN}`);
              }
            });
            proxy.on("error", (err) => {
              console.error("[HuggingFace Proxy Error]", err.message);
            });
          },
        },
      },
    },
  };
});
