import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const workflowDirectory = '.github/workflows';
const workflows = readdirSync(workflowDirectory).filter((name) => name.endsWith('.yml'));

/**
 * The comment beside a pin is the only human-readable record of what was reviewed, so a
 * mislabeled version is treated as a supply chain defect rather than a cosmetic mistake.
 */
const REVIEWED_ACTION_PINS = new Map([
  ['actions/checkout', { sha: '3d3c42e5aac5ba805825da76410c181273ba90b1', version: 'v7.0.1' }],
  ['actions/setup-node', { sha: '53b83947a5a98c8d113130e565377fae1a50d02f', version: 'v6.3.0' }],
  ['pnpm/action-setup', { sha: '0977fd99725f1db4007ccb2928dbb4e90d06cc86', version: 'v6.0.10' }],
  [
    'actions/upload-artifact',
    { sha: '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a', version: 'v7.0.1' },
  ],
  ['actions/labeler', { sha: 'bf12e9b00b37c5c0ca2b87b79b2daf7891dbda13', version: 'v7.0.0' }],
  [
    'actions/attest-build-provenance',
    { sha: '4d101475d8b20a2381f78447822ac1eab6504dd8', version: 'v4.2.2' },
  ],
]);

test('every external action is pinned to a full commit SHA', () => {
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    for (const match of source.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
      if (match[1].startsWith('./')) continue;
      assert.match(match[1], /^[^@]+@[0-9a-f]{40}$/, `${filename}: ${match[1]} is not immutable`);
    }
  }
});

test('pinned SHAs agree with the version recorded beside them', () => {
  const seen = new Set();
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    for (const [, action, sha, comment] of source.matchAll(
      /uses:\s*([^@\s]+)@([0-9a-f]{40})\s*#\s*(\S+)/g,
    )) {
      const reviewed = REVIEWED_ACTION_PINS.get(action);
      assert(reviewed, `${filename}: ${action} has no reviewed pin on record`);
      assert.equal(sha, reviewed.sha, `${filename}: ${action} is pinned to an unreviewed SHA`);
      assert.equal(
        comment,
        reviewed.version,
        `${filename}: ${action}@${sha} is ${reviewed.version}, not ${comment}`,
      );
      seen.add(action);
    }
  }
  assert.ok(seen.size > 0, 'no pinned actions were inspected');
});

test('privileged labeler never checks out or executes pull request code', () => {
  const source = readFileSync(join(workflowDirectory, 'labeler.yml'), 'utf8');
  assert.doesNotMatch(source, /actions\/checkout/);
  assert.doesNotMatch(source, /^\s+run:/m);
  assert.match(source, /pull_request_target:/);
  assert.match(source, /pull-requests: write/);
});

test('the version bump is decided by the pull request title inside one CI workflow', () => {
  assert.equal(
    workflows.includes('policy.yml'),
    false,
    'the policy job belongs to the CI workflow that gates the merge queue',
  );
  const source = readFileSync(join(workflowDirectory, 'ci.yml'), 'utf8');
  assert.match(source, /name: Policy success/);
  assert.match(source, /node --test \.github\/scripts\/\*\.test\.mjs/);
  assert.match(source, /policy\.mjs pull-request/);
  assert.match(source, /PR_TITLE:/, 'the squashed subject is the only durable record of intent');
  assert.match(source, /BASE_SHA:/);
  assert.match(source, /merge_group:/, 'merge queue re-validation prevents version collisions');
});

test('tagging and publishing stay in one workflow and survive a replay', () => {
  const source = readFileSync(join(workflowDirectory, 'release.yml'), 'utf8');
  assert.match(source, /policy\.mjs revision/, 'the tag is derived from the revision');
  assert.match(source, /workflow_dispatch:/, 'a failed release must be retriable by hand');
  assert.match(source, /cancel-in-progress: false/);
  assert.match(source, /already exists for this revision/, 'a replay must not create a second tag');
  assert.match(source, /refusing to move it/, 'an existing tag must never be moved');
  assert.match(source, /already exists; continuing/, 'the release step must be idempotent');
  assert.match(source, /publish-package\.mjs/, 'publication owns the digest and retry policy');
  assert.match(source, /vars\.PUBLISH_ENABLED == 'true'/);
  assert.match(
    source,
    /needs\.tag\.outputs\.core-changed == 'true'/,
    'build identifiers must not publish a package or create a GitHub Release',
  );
  assert.match(
    source,
    /GITHUB_TOKEN never\n# starts another workflow run/,
    'the reason tagging and publishing cannot be split must stay recorded',
  );
});

test('publication retries only external faults and never re-tags', () => {
  const source = readFileSync('.github/scripts/publish-package.mjs', 'utf8');
  assert.match(source, /MAX_ATTEMPTS = 3/);
  assert.match(source, /isRetriableFailure/);
  assert.match(source, /isAlreadyPublished/);
  assert.doesNotMatch(source, /git\b.*tag/, 'a retry must never create or move a tag');
});

test('no release descriptor contract remains in this repository', () => {
  const entries = readdirSync('.github');
  assert.equal(entries.includes('releases'), false);
  assert.equal(entries.includes('release.schema.json'), false);
  for (const filename of readdirSync('.github/scripts')) {
    if (filename.endsWith('.test.mjs')) continue;
    const source = readFileSync(join('.github/scripts', filename), 'utf8');
    assert.doesNotMatch(source, /descriptor/i, `${filename} still reads a release descriptor`);
  }
  for (const filename of workflows) {
    const source = readFileSync(join(workflowDirectory, filename), 'utf8');
    assert.doesNotMatch(source, /descriptor/i, `${filename} still reads a release descriptor`);
    assert.doesNotMatch(
      source,
      /\.github\/releases/,
      `${filename} still reads a missing directory`,
    );
  }
});

test('repository reconciliation is additive and release notes keep the category order', () => {
  const settings = readFileSync('.github/settings.yml', 'utf8');
  assert.match(settings, /labels: additive/);
  assert.match(settings, /rulesets: additive/);
  assert.match(settings, /release_immutability: true/);

  const release = readFileSync('.github/release.yml', 'utf8');
  const titles = [...release.matchAll(/^\s+- title: ['"]([^'"]+)['"]/gm)].map((match) => match[1]);
  assert.deepEqual(titles, [
    '💥 BREAKING CHANGE',
    '⚠️ DEPRECATED',
    '🚀 Features',
    '🐛 Bug Fixes',
    '⏪ Reverts',
    '🚢 Release Operations',
    '📝 Documentation',
    '🧹 Maintenance',
    '🔧 Other Changes',
  ]);
});
