import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

import {
  classifyProcessFailure,
  isAlreadyPublished,
  isMissingFromRegistry,
  isRetriableFailure,
  parseSemver,
} from './policy-lib.mjs';

const MAX_ATTEMPTS = 3;
const REGISTRY = process.env.NPM_REGISTRY ?? 'https://npm.pkg.github.com';

const tarball = process.env.TARBALL;
const version = process.env.VERSION;
assert(tarball, 'TARBALL is required');
assert(version, 'VERSION is required');
parseSemver(version);

const { name } = JSON.parse(readFileSync('package.json', 'utf8'));
assert(name, 'package.json must declare a name');

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', env: process.env });
  if (result.status === 0) return { ok: true, value: (result.stdout ?? '').trim() };
  return { ok: false, output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim() };
}

/**
 * Every registry call funnels through one policy: transient transport faults are retried
 * up to three times and anything we caused ourselves fails immediately, so a broken build
 * is never published and a retry never re-tags the revision.
 */
async function withRetries(label, attempt) {
  let lastOutput = '';
  for (let count = 1; count <= MAX_ATTEMPTS; count += 1) {
    const result = attempt();
    if (result.ok) return result.value;
    lastOutput = result.output;
    if (!isRetriableFailure(classifyProcessFailure(result.output))) {
      throw new Error(
        `${label} failed for an internal reason and was not retried:\n${result.output}`,
      );
    }
    if (count < MAX_ATTEMPTS) {
      process.stderr.write(
        `${label} hit a transient failure (attempt ${count}/${MAX_ATTEMPTS}); retrying.\n`,
      );
      await delay(2_000 * count);
    }
  }
  throw new Error(`${label} still failed after ${MAX_ATTEMPTS} attempts:\n${lastOutput}`);
}

const local = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;

const remote = await withRetries('Registry lookup', () => {
  const result = run('npm', [
    'view',
    `${name}@${version}`,
    'dist.integrity',
    `--registry=${REGISTRY}`,
  ]);
  if (result.ok) return result;
  if (isMissingFromRegistry(result.output)) return { ok: true, value: null };
  return result;
});

if (isAlreadyPublished({ name, version, local, remote })) {
  process.stdout.write(
    `${name}@${version} is already published with an identical digest; continuing the interrupted release.\n`,
  );
} else {
  await withRetries('Package publication', () =>
    run('pnpm', ['publish', tarball, '--access', 'restricted', '--no-git-checks']),
  );
  process.stdout.write(`Published ${name}@${version} with digest ${local}.\n`);
}
