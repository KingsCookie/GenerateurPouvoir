import { defineConfig } from 'vitest/config';

// Tests du cœur déterministe : environnement Node (le cœur n'a aucune dépendance navigateur).
// Les imports `?raw` (catalogues, listes de prénoms) sont gérés nativement par Vite/Vitest.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
