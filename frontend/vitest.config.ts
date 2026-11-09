import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', include: ['src/testes/**/*.test.ts', 'src/testes/**/*.test.tsx'], clearMocks: true },
});
