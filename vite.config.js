import react from '@vitejs/plugin-react';

// Vite configuration for Render compatibility
export default {
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',  // Allow access from external sources
  },
};
