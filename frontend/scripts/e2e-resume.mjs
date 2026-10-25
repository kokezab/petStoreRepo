#!/usr/bin/env node
// Runs the e2e tests matching a --grep regex one at a time, in order, stopping
// at the first failure. The next run resumes from the test that failed instead
// of rerunning the ones that already passed.
//
//   npm run test:e2e:resume -- <grep> [--reset] [other playwright flags]
//
// Selection works by writing the remaining test ids into a last-run file and
// running `playwright test --last-failed --last-failed-file=<that file>`, so
// tests are picked by exact id rather than by long file:line argument lists.
// Playwright overwrites that file with the non-ok tests when it finishes; the
// earliest of those (in run order) is where the next run starts.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(root, 'node_modules', '.cache', 'e2e-resume');
const stateFile = path.join(stateDir, 'state.json');
const lastRunFile = path.join(stateDir, 'last-run.json');
const playwrightCli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const bddgenCli = path.join(root, 'node_modules', 'playwright-bdd', 'dist', 'cli', 'index.js');

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const grep = args.find((a) => !a.startsWith('-'));
const passthrough = args.filter((a) => a !== '--reset' && a !== grep);

if (!grep) {
  console.error('Usage: npm run test:e2e:resume -- <grep> [--reset] [playwright flags]');
  process.exit(2);
}

function node(script, scriptArgs, options = {}) {
  return spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

// Tests in the order a single worker runs them: files in collection order,
// tests within a file by declaration line (the JSON reporter lists a suite's
// own specs before its nested suites, so it has to be re-sorted).
function listTests() {
  const result = node(playwrightCli, ['test', '--list', '--reporter=json', '--grep', grep, ...passthrough], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const report = JSON.parse(result.stdout.toString());
  if (report.errors?.length) {
    for (const error of report.errors) console.error(error.message);
    process.exit(1);
  }

  const tests = [];
  for (const fileSuite of report.suites) {
    const inFile = [];
    const walk = (suite) => {
      for (const spec of suite.specs ?? []) inFile.push(spec);
      for (const child of suite.suites ?? []) walk(child);
    };
    walk(fileSuite);
    inFile.sort((a, b) => a.line - b.line);
    tests.push(...inFile.map((spec) => ({ id: spec.id, title: `${spec.file}:${spec.line} ${spec.title}` })));
  }
  return tests;
}

if (node(bddgenCli, [], { stdio: 'inherit' }).status !== 0) process.exit(1);

const tests = listTests();
let state = reset ? undefined : readJson(stateFile);
if (state && state.grep !== grep) {
  console.log(`Saved progress is for --grep "${state.grep}"; starting "${grep}" from the beginning.`);
  state = undefined;
}

let start = 0;
if (state) {
  start = tests.findIndex((t) => t.id === state.nextId);
  if (start === -1) {
    console.log('The test to resume from no longer exists; starting from the beginning.');
    start = 0;
  }
}

const remaining = tests.slice(start);
console.log(`\n${tests.length} tests match "${grep}". Running ${start + 1}-${tests.length}, starting at:\n  ${remaining[0].title}\n`);

fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(lastRunFile, JSON.stringify({ status: 'failed', failedTests: remaining.map((t) => t.id) }));

const run = node(
  playwrightCli,
  ['test', '--last-failed', `--last-failed-file=${lastRunFile}`, '--workers=1', '--max-failures=1', ...passthrough],
  { stdio: 'inherit' },
);

const lastRun = readJson(lastRunFile);
if (run.status === 0 && lastRun?.status === 'passed') {
  fs.rmSync(stateFile, { force: true });
  console.log(`\nAll ${tests.length} tests matching "${grep}" passed. Progress cleared.`);
  process.exit(0);
}

const notOk = new Set(lastRun?.failedTests ?? []);
const next = remaining.find((t) => notOk.has(t.id)) ?? remaining[0];
fs.writeFileSync(stateFile, JSON.stringify({ grep, nextId: next.id }, null, 2));
console.log(`\nStopped at test ${tests.indexOf(next) + 1}/${tests.length}:\n  ${next.title}\nThe next run resumes from there (--reset to start over).`);
process.exit(run.status || 1);
