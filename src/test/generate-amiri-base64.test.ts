import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * One-time helper to generate a TS module containing the Amiri TTF base64 string.
 * This is required for jsPDF addFileToVFS/addFont embedding (no runtime fetching).
 */
describe('generate Amiri base64 module', () => {
  it('writes src/lib/pdf-amiri-base64.ts', () => {
    const fontPath = path.join(process.cwd(), 'src/assets/fonts/Amiri-Regular.ttf');
    const outPath = path.join(process.cwd(), 'src/lib/pdf-amiri-base64.ts');

    const base64 = readFileSync(fontPath).toString('base64');

    writeFileSync(
      outPath,
      [
        '/* AUTO-GENERATED FILE: Do not edit by hand. */',
        "/* Generated from src/assets/fonts/Amiri-Regular.ttf */",
        '',
        'export const AMIRI_TTF_BASE64 = `',
        base64,
        '`;',
        '',
      ].join('\n'),
      { encoding: 'utf8' }
    );

    expect(existsSync(outPath)).toBe(true);
    expect(base64.length).toBeGreaterThan(1000);
  });
});
