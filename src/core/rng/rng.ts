// PRNG déterministe et portable : SplitMix64 pour dériver l'état initial à partir de la
// seed, puis xoshiro256** pour le flux de nombres. Aucune dépendance plateforme : à seed
// égale et même séquence d'appels, la suite produite est identique partout (Principe I).

const MASK64 = (1n << 64n) - 1n;

export interface Rng {
  /** Prochain mot 64 bits brut. */
  nextU64(): bigint;
  /** Flottant dans [0, 1) (53 bits de précision). */
  nextFloat(): number;
  /** Entier dans [0, maxExclusive) sans biais (rejection sampling). */
  nextInt(maxExclusive: number): number;
  /** `true` avec une probabilité pct % (pct ∈ [0..100]). */
  chance(pct: number): boolean;
  /** Choix uniforme dans une liste non vide. */
  pick<T>(items: readonly T[]): T;
  /** Tirage pondéré (poids > 0) dans une liste non vide. */
  pickWeighted<T>(items: readonly T[], weightOf: (t: T) => number): T;
  /** Permutation déterministe (Fisher–Yates) ; renvoie une **nouvelle** copie, ne mute pas l'entrée. */
  shuffle<T>(items: readonly T[]): T[];
  /** État courant du générateur (4 mots xoshiro en décimal) — sérialisable (FR-021). */
  getState(): string[];
}

function splitmix64(state: bigint): { state: bigint; value: bigint } {
  state = (state + 0x9e3779b97f4a7c15n) & MASK64;
  let z = state;
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
  z = z ^ (z >> 31n);
  return { state, value: z & MASK64 };
}

function rotl(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & MASK64;
}

// Construit un Rng autour d'un état xoshiro256** mutable de 4 mots (closure partagée).
function makeRng(s: bigint[]): Rng {
  function nextU64(): bigint {
    const result = (rotl((s[1] * 5n) & MASK64, 7n) * 9n) & MASK64;
    const t = (s[1] << 17n) & MASK64;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 45n);
    return result;
  }

  function nextFloat(): number {
    // 53 bits de poids fort → [0, 1).
    const bits = nextU64() >> 11n;
    return Number(bits) / 2 ** 53;
  }

  function nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`nextInt: maxExclusive doit être un entier > 0 (reçu ${maxExclusive}).`);
    }
    const max = BigInt(maxExclusive);
    // Rejection sampling pour éliminer le biais modulo.
    const limit = ((MASK64 + 1n) / max) * max;
    let x = nextU64();
    while (x >= limit) {
      x = nextU64();
    }
    return Number(x % max);
  }

  function chance(pct: number): boolean {
    if (pct <= 0) return false;
    if (pct >= 100) return true;
    return nextFloat() < pct / 100;
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick: liste vide.');
    return items[nextInt(items.length)];
  }

  function pickWeighted<T>(items: readonly T[], weightOf: (t: T) => number): T {
    if (items.length === 0) throw new Error('pickWeighted: liste vide.');
    let total = 0;
    for (const it of items) {
      const w = weightOf(it);
      if (w > 0) total += w;
    }
    if (total <= 0) throw new Error('pickWeighted: poids total nul.');
    let target = nextFloat() * total;
    for (const it of items) {
      const w = weightOf(it);
      if (w <= 0) continue;
      target -= w;
      if (target < 0) return it;
    }
    // Repli numérique (cumul de flottants) : renvoie le dernier élément de poids > 0.
    for (let i = items.length - 1; i >= 0; i--) {
      if (weightOf(items[i]) > 0) return items[i];
    }
    throw new Error('pickWeighted: aucun élément de poids positif.');
  }

  function shuffle<T>(items: readonly T[]): T[] {
    // Fisher–Yates : du dernier au premier, échange avec un indice tiré sans biais.
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = nextInt(i + 1);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function getState(): string[] {
    return s.map((x) => x.toString());
  }

  return { nextU64, nextFloat, nextInt, chance, pick, pickWeighted, shuffle, getState };
}

/** Crée un générateur déterministe à partir d'une seed 64 bits. */
export function createRng(seed: bigint): Rng {
  // Dérive les 4 mots d'état xoshiro depuis la seed via SplitMix64.
  let sm = seed & MASK64;
  const s: bigint[] = [];
  for (let i = 0; i < 4; i++) {
    const r = splitmix64(sm);
    sm = r.state;
    s.push(r.value);
  }
  return makeRng(s);
}

/** Restitue un générateur à l'état exact capturé par `getState()` (FR-021). */
export function createRngFromState(state: readonly string[]): Rng {
  if (state.length !== 4) {
    throw new Error(`createRngFromState: 4 mots attendus (reçu ${state.length}).`);
  }
  return makeRng(state.map((v) => BigInt(v) & MASK64));
}
