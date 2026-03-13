#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'docs', 'version-history.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const mode = process.argv[2] || 'table';
if (mode === 'current') {
  console.log(data.release_tag);
  process.exit(0);
}
if (mode === 'json') {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
console.log('VERSION | COMMIT | DATE | SUBJECT');
for (const row of data.history) {
  console.log(`${row.version} | ${row.short_commit} | ${row.date} | ${row.subject}`);
}
