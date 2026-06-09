import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const CORE_DIR = join(here, '..', '..', 'src', 'core');

// createSeed est le SEUL point d'entropie autorisé (Principe I), explicitement isolé.
const ALLOWED_ENTROPY_FILES = ['rng/createSeed.ts'];

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const files = listTsFiles(CORE_DIR);

describe('Pureté du cœur (Principe IV)', () => {
  it('le cœur contient des fichiers à analyser', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("n'importe ni Svelte ni d'API navigateur/DOM", () => {
    const forbidden = [
      /from\s+['"]svelte/,
      /from\s+['"]svelte\/store/,
      /\bdocument\b/,
      /\bwindow\b/,
      /\blocalStorage\b/,
      /\bfetch\s*\(/,
    ];
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const re of forbidden) {
        if (re.test(src)) violations.push(`${relative(CORE_DIR, f)} :: ${re}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("n'utilise ni Math.random, ni Date, ni crypto (hors createSeed)", () => {
    const forbidden = [/Math\.random/, /\bnew\s+Date\b/, /\bDate\.now\b/, /\bcrypto\b/];
    const violations: string[] = [];
    for (const f of files) {
      const rel = relative(CORE_DIR, f).split('\\').join('/');
      if (ALLOWED_ENTROPY_FILES.includes(rel)) continue;
      const src = readFileSync(f, 'utf8');
      for (const re of forbidden) {
        if (re.test(src)) violations.push(`${rel} :: ${re}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
