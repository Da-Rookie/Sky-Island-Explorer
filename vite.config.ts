import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          physics: ["@react-three/rapier"],
          motion: ["framer-motion"],
        },
      },
    },
    chunkSizeWarningLimit: 2200,
  },
});
