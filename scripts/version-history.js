#!/usr/bin/env node
const cp = require('child_process');
const mode = process.argv[2] || 'table';
const tags = cp.execSync('git tag --list --sort=version:refname', { encoding: 'utf8' })
  .trim()
  .split(/\n+/)
  .filter(Boolean)
  .filter((tag) => /^v\d+\.\d+\.\d+(?:-history\.\d+)?$/.test(tag));
const rows = tags.map((tag) => {
  const commit = cp.execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf8' }).trim();
  const short_commit = commit.slice(0, 7);
  const subject = cp.execSync(`git show -s --format=%s ${commit}`, { encoding: 'utf8' }).trim();
  const date = cp.execSync(`git show -s --format=%cs ${commit}`, { encoding: 'utf8' }).trim();
  return { version: tag, commit, short_commit, subject, date };
});
const releaseTags = rows.filter((row) => /^v\d+\.\d+\.\d+$/.test(row.version));
const currentRelease = releaseTags[releaseTags.length - 1]?.version || 'unreleased';
if (mode === 'current') {
  console.log(currentRelease);
  process.exit(0);
}
if (mode === 'json') {
  console.log(JSON.stringify({ current_version: currentRelease.replace(/^v/, ''), release_tag: currentRelease, history: rows }, null, 2));
  process.exit(0);
}
console.log('VERSION | COMMIT | DATE | SUBJECT');
for (const row of rows) {
  console.log(`${row.version} | ${row.short_commit} | ${row.date} | ${row.subject}`);
}
