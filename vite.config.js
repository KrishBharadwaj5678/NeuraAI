// vite.config.js
export default defineConfig({
  server: {
    host: "0.0.0.0",  // This ensures Vite binds to all network interfaces
    port: process.env.PORT || 3000, // Render assigns a port dynamically
  },
});
