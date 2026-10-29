import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { pool: 'threads', environment: 'jsdom', include: ['tests/**/*.test.tsx'], restoreMocks: true } });
