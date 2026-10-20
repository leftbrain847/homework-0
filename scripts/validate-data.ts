/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateDataset } from './validateDataset';

const dataDir = join(__dirname, '..', 'data');
const read = (file: string): unknown => JSON.parse(readFileSync(join(dataDir, file), 'utf8'));

const errors = validateDataset({
  firms: read('firms.json'),
  brands: read('brands.json'),
  locations: read('locations.json'),
});

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.message}`);
  process.exit(1);
}
console.log('Data validation passed.');
