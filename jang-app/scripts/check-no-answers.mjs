// Fails if any answer text from the knowledge-base CSV leaked into src/ or dist/.
// It compares the private columns of the CSV (whole values and sentence-sized pieces)
// and the private column names against every file under src/ and dist/.
// Usage: npm run check:answers [-- path/to/file.csv]

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIVATE_COLUMNS, parseCsv } from './csv.mjs';

const MIN_LENGTH = 20;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = resolve(process.argv[2] ?? resolve(root, '../jang-source/jang_exercices_pc_ts2.csv'));

if (!existsSync(csvPath)) {
  console.warn(`check-no-answers: CSV not found at ${csvPath}, skipped.`);
  process.exit(0);
}

const normalize = (text) => text.replace(/\s+/g, ' ').trim();

const needles = new Set();
for (const record of parseCsv(readFileSync(csvPath, 'utf8'))) {
  for (const column of PRIVATE_COLUMNS) {
    const value = normalize(record[column] ?? '');
    if (value.length >= MIN_LENGTH) needles.add(value);
    for (const piece of value.split(/(?<=[.;:?!])\s+/)) {
      if (piece.length >= MIN_LENGTH) needles.add(piece);
    }
  }
}

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const hits = [];
let scanned = 0;
for (const dir of ['src', 'dist']) {
  for (const file of walk(join(root, dir))) {
    if (!/\.(ts|tsx|js|mjs|css|html|json|txt|map)$/.test(file)) continue;
    scanned += 1;
    const raw = readFileSync(file, 'utf8');
    // Also compare the JSON-unescaped form, since generated data is embedded as JSON strings.
    const haystacks = [normalize(raw), normalize(raw.replace(/\\n/g, ' ').replace(/\\"/g, '"'))];
    for (const column of PRIVATE_COLUMNS) {
      if (raw.includes(column)) hits.push(`${relative(root, file)}: column name "${column}"`);
    }
    for (const needle of needles) {
      if (haystacks.some((h) => h.includes(needle))) {
        hits.push(`${relative(root, file)}: answer text "${needle.slice(0, 40)}…"`);
        break;
      }
    }
  }
}

if (hits.length > 0) {
  console.error('check-no-answers: FAILED, reference answers leaked:');
  for (const hit of hits) console.error(`  - ${hit}`);
  process.exit(1);
}
console.log(`check-no-answers: OK (${needles.size} answer fragments checked in ${scanned} files of src/ and dist/).`);
