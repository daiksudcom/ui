import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../labeler.yml', import.meta.url), 'utf8');

function unquote(value) {
  return value.slice(1, -1);
}

function branchRules() {
  const rules = new Map();
  let label;
  for (const line of source.split('\n')) {
    const labelMatch = /^(?:'([^']+)'|([A-Za-z][A-Za-z ]*)):$/.exec(line);
    if (labelMatch) {
      label = labelMatch[1] ?? labelMatch[2];
      rules.set(label, []);
      continue;
    }
    const branchMatch = /head-branch: \[('[^']+'|"[^"]+")\]/.exec(line);
    if (branchMatch && label) {
      rules.get(label).push(new RegExp(unquote(branchMatch[1])));
    }
  }
  return rules;
}

function labelsForBranch(branch) {
  return [...branchRules()]
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(branch)))
    .map(([label]) => label)
    .sort();
}

function labelsForPaths(paths) {
  const predicates = {
    docs: (path) => /^docs\/|\.(?:md|mdx)$/.test(path),
    test: (path) => /^(?:test|tests)\/|\.(?:test|spec)\./.test(path),
    build: (path) =>
      /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|astro\.config\.[^/]+|tsconfig\.json)$/.test(
        path,
      ),
    ci: (path) => /^\.github\/(?:workflows\/|scripts\/|[^/]+\.yml$)/.test(path),
  };
  return Object.entries(predicates)
    .filter(([, matches]) => paths.every(matches))
    .map(([label]) => label);
}

test('branch fixtures produce the intended synchronized labels', () => {
  const fixtures = [
    ['breaking-change/feat/public-export', ['BREAKING CHANGE', 'feat']],
    ['deprecated/fix/legacy-token', ['DEPRECATED', 'fix']],
    ['feat/card', ['feat']],
    ['perf/css', ['perf']],
    ['fix/contrast', ['fix']],
    ['revert/bad-change', ['revert']],
    ['docs/release-guide', ['docs']],
    ['refactor/exports', ['refactor']],
    ['style/format', ['style']],
    ['test/package', ['test']],
    ['build/dependencies', ['build']],
    ['ci/actions', ['ci']],
    ['chore/metadata', ['chore']],
    // Dependabot writes these prefixes because dependabot.yml sets
    // pull-request-branch-name, so a dependency bump lands in a non-versioning label.
    ['ci/github_actions/actions/setup-node-7.0.0', ['ci']],
    ['build/npm_and_yarn/astro-7.2.1', ['build']],
    ['dependabot/npm_and_yarn/astro-7.2.1', []],
  ];
  for (const [branch, labels] of fixtures) {
    assert.deepEqual(labelsForBranch(branch), labels.sort(), branch);
  }
});

// Release is decided by the flags repository, never by a branch. A branch that merely
// looks like a release must stay inert.
test('abolished release and rollback branches grant no label at all', () => {
  assert.doesNotMatch(source, /rollback/, 'no rule may mention a rollback branch');
  assert.doesNotMatch(source, /head-branch: \[[^\]]*release/, 'no rule may gate on release/');

  for (const branch of [
    'release/v0.2.0/package',
    'release/v1.0.0',
    'rollback/v0.2.1/package',
    'rollback/v1.0.0',
  ]) {
    assert.deepEqual(labelsForBranch(branch), [], branch);
  }
});

test('path-only rules use one combined all-files glob', () => {
  const patterns = [...source.matchAll(/any-glob-to-all-files:\s*\[\s*'([^']+)'\s*\]/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(patterns, [
    '{docs/**,**/*.md,**/*.mdx}',
    '{test/**,tests/**,**/*.test.*,**/*.spec.*}',
    '{package.json,pnpm-lock.yaml,pnpm-workspace.yaml,astro.config.*,tsconfig.json}',
    '.github/{workflows/**,scripts/**,*.yml}',
  ]);

  const fixtures = [
    [['README.md', 'docs/adr/0001.md'], ['docs']],
    [['docs/features/theme.feature'], ['docs']],
    [['README.md', 'src/card.ts'], []],
    [['tests/card.test.ts', 'test/theme.test.ts'], ['test']],
    [['src/card.test.ts', 'src/theme.spec.ts'], ['test']],
    [['tests/card.test.ts', 'src/card.ts'], []],
    [['package.json', 'pnpm-lock.yaml'], ['build']],
    [['package.json', 'README.md'], []],
    [['.github/workflows/ci.yml', '.github/scripts/check.mjs'], ['ci']],
    [['.github/dependabot.yml', '.github/labeler.yml'], ['ci']],
    [['.github/workflows/ci.yml', 'package.json'], []],
    // The .github README is documentation, not automation, so it stays out of ci.
    [['.github/README.md'], ['docs']],
  ];
  for (const [paths, labels] of fixtures) {
    assert.deepEqual(labelsForPaths(paths), labels, paths.join(', '));
  }
});
