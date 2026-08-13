import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyProcessFailure,
  compareSemver,
  compareTagPrecedence,
  formatSemver,
  isAlreadyPublished,
  isMissingFromRegistry,
  isRetriableFailure,
  parseCommitSubject,
  parseSemver,
  parseTag,
  requiredVersion,
  resolveTag,
  utcBuildTimestamp,
  validateVersionBump,
  versionImpact,
} from './policy-lib.mjs';

test('only a plain SemVer core is accepted as a version', () => {
  assert.deepEqual(parseSemver('1.4.2'), { major: 1, minor: 4, patch: 2 });
  assert.equal(formatSemver(parseSemver('0.10.3')), '0.10.3');
  assert.ok(compareSemver('0.10.0', '0.9.0') > 0);
  assert.equal(compareSemver('1.2.3', '1.2.3'), 0);
  for (const invalid of ['v1.2.3', '01.2.3', '1.2.3-beta.1', '1.2.3+20260813040210', '1.2']) {
    assert.throws(() => parseSemver(invalid), /plain SemVer core/, invalid);
  }
});

test('the commit subject records the type, scope, and breaking marker', () => {
  assert.deepEqual(parseCommitSubject('feat(components): add card'), {
    type: 'feat',
    scope: 'components',
    breaking: false,
    description: 'add card',
  });
  assert.deepEqual(parseCommitSubject('fix!: drop the legacy token'), {
    type: 'fix',
    scope: null,
    breaking: true,
    description: 'drop the legacy token',
  });
  assert.throws(() => parseCommitSubject(''), /commit subject is required/);
  assert.throws(() => parseCommitSubject('feat:no space'), /not a Conventional Commit/);
});

test('conventional commit types map to the intended version impact', () => {
  assert.equal(versionImpact('feat: add a card component'), 'minor');
  assert.equal(versionImpact('perf: shrink the token bundle'), 'minor');
  assert.equal(versionImpact('fix: correct the dark theme contrast'), 'patch');
  assert.equal(versionImpact('revert: undo the card export'), 'patch');
  for (const type of ['docs', 'chore', 'ci', 'test', 'build', 'refactor', 'style']) {
    assert.equal(versionImpact(`${type}: adjust things`), 'none');
  }
  assert.equal(versionImpact('feat(components)!: drop the legacy export'), 'major');
  assert.equal(versionImpact('feat: rework tokens\n\nBREAKING CHANGE: removed'), 'major');
  assert.throws(() => versionImpact('unknown: something'), /unsupported commit type/);
  assert.throws(() => versionImpact('no conventional prefix'), /not a Conventional Commit/);
});

test('a zero major keeps breaking changes inside a minor bump', () => {
  assert.equal(requiredVersion('0.1.0', 'major'), '0.2.0');
  assert.equal(requiredVersion('1.4.2', 'major'), '2.0.0');
  assert.equal(requiredVersion('0.1.0', 'minor'), '0.2.0');
  assert.equal(requiredVersion('0.1.0', 'patch'), '0.1.1');
  assert.equal(requiredVersion('0.1.0', 'none'), '0.1.0');
});

test('the pull request subject decides the required version bump', () => {
  assert.deepEqual(
    validateVersionBump({ previous: '0.1.0', next: '0.2.0', subject: 'feat: add' }),
    {
      impact: 'minor',
      expected: '0.2.0',
      coreChanged: true,
    },
  );
  assert.deepEqual(
    validateVersionBump({ previous: '0.1.0', next: '0.1.0', subject: 'docs: tidy' }),
    { impact: 'none', expected: '0.1.0', coreChanged: false },
  );
  assert.throws(
    () => validateVersionBump({ previous: '0.1.0', next: '0.1.1', subject: 'feat: add' }),
    /requires a minor bump to 0\.2\.0/,
  );
  assert.throws(
    () => validateVersionBump({ previous: '0.1.0', next: '0.2.0', subject: 'docs: tidy' }),
    /must not change the version/,
  );
});

test('the build identifier is derived from the commit so retries reuse one tag', () => {
  const commitEpoch = 1786593730;
  assert.equal(utcBuildTimestamp(commitEpoch), '20260813040210');
  assert.equal(utcBuildTimestamp('1786593730'), '20260813040210');
  assert.equal(utcBuildTimestamp(1_000_000), '19700112134640');

  const first = resolveTag({ version: '0.1.0', coreChanged: false, commitEpoch });
  const retry = resolveTag({ version: '0.1.0', coreChanged: false, commitEpoch });
  assert.equal(first, 'v0.1.0+20260813040210');
  assert.equal(first, retry);
  assert.equal(resolveTag({ version: '0.2.0', coreChanged: true, commitEpoch }), 'v0.2.0');
  assert.throws(() => utcBuildTimestamp('not-an-epoch'), /invalid commit epoch/);
});

test('tags are never ordered lexically because build metadata carries no precedence', () => {
  assert.deepEqual(parseTag('v0.2.0'), { core: '0.2.0', build: null });
  assert.deepEqual(parseTag('v0.2.0+20260813040210'), { core: '0.2.0', build: '20260813040210' });
  assert.equal(compareTagPrecedence('v0.2.0+20260813040210', 'v0.2.0'), 0);
  assert.ok(compareTagPrecedence('v0.10.0', 'v0.9.0') > 0);
  assert.ok('v0.10.0' < 'v0.9.0', 'the lexical order this guards against still holds');
  assert.throws(() => parseTag('0.2.0'), /must start with v/);
  assert.throws(() => parseTag('v0.2.0+2026'), /YYYYMMDDHHmmss/);
});

test('only external failures are retried', () => {
  for (const status of [500, 502, 503, 504, 429]) {
    assert.equal(isRetriableFailure({ status }), true, `${status} is transient`);
  }
  for (const status of [400, 401, 403, 404, 409, 422]) {
    assert.equal(isRetriableFailure({ status }), false, `${status} is caused by our own inputs`);
  }
  for (const code of ['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ENOTFOUND']) {
    assert.equal(isRetriableFailure({ code }), true, `${code} is transient`);
  }
  assert.equal(isRetriableFailure({ code: 'ERR_INVALID_ARG_TYPE' }), false);
  assert.equal(isRetriableFailure({}), false);
});

test('npm output is classified before a publication is retried', () => {
  const transient = [
    'npm error 503 Service Unavailable - PUT https://npm.pkg.github.com/@daiksudme%2fui',
    'npm error code E500',
    'npm ERR! 502 Bad Gateway',
    'npm error 429 Too Many Requests - PUT https://npm.pkg.github.com/@daiksudme%2fui',
    'npm error request to https://npm.pkg.github.com/ failed, reason: connect ETIMEDOUT',
    'npm error network request failed, reason: socket hang up',
  ];
  for (const output of transient) {
    assert.equal(
      isRetriableFailure(classifyProcessFailure(output)),
      true,
      `expected a retry for: ${output}`,
    );
  }

  const internal = [
    'npm error code E401\nnpm error 401 Unauthorized - PUT https://npm.pkg.github.com/@daiksudme%2fui',
    'npm error 403 Forbidden - PUT https://npm.pkg.github.com/@daiksudme%2fui',
    'npm error code EPUBLISHCONFLICT',
    'npm error 409 Conflict - PUT https://npm.pkg.github.com/@daiksudme%2fui',
    'ERR_PNPM_NO_MATCHING_VERSION No matching version found',
    'Error: Build failed with 3 errors',
  ];
  for (const output of internal) {
    assert.equal(
      isRetriableFailure(classifyProcessFailure(output)),
      false,
      `expected no retry for: ${output}`,
    );
  }
});

test('an unpublished version is distinguished from a failed lookup', () => {
  assert.equal(
    isMissingFromRegistry('npm error code E404\nnpm error 404 Not Found - GET https://npm.pkg'),
    true,
  );
  assert.equal(isMissingFromRegistry('npm error 503 Service Unavailable'), false);
});

test('an identical digest resumes a release and any other digest is a violation', () => {
  const local = 'sha512-abc';
  const published = { name: '@daiksudme/ui', version: '0.2.0', local };
  assert.equal(isAlreadyPublished({ ...published, remote: null }), false);
  assert.equal(isAlreadyPublished({ ...published, remote: '' }), false);
  assert.equal(isAlreadyPublished({ ...published, remote: local }), true);
  assert.throws(
    () => isAlreadyPublished({ ...published, remote: 'sha512-def' }),
    /already published with a different digest/,
  );
  assert.throws(
    () => isAlreadyPublished({ ...published, local: 'abc' }),
    /must be a sha512 integrity value/,
  );
});
