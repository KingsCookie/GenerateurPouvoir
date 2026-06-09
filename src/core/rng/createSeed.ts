// SEUL point d'entropie non déterministe du projet (Principe I), volontairement isolé
// dans son propre module : l'UI l'appelle pour tirer une NOUVELLE seed. Une fois la seed
// fixée, tout en dérive de façon déterministe (cf. createRng). Ce fichier est explicitement
// exclu des gardes de pureté (eslint + tests/unit/core-purity.test.ts).

const MASK64 = (1n << 64n) - 1n;

/** Tire une nouvelle seed 64 bits via le CSPRNG de la plateforme. */
export function createSeed(): bigint {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return ((BigInt(words[0]) << 32n) | BigInt(words[1])) & MASK64;
}
