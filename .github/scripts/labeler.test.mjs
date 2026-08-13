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
    docs: (path) => /\.(?:md|mdx)$/.test(path),
    test: (path) => /^(?:test|tests)\//.test(path),
    build: (path) =>
      /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|astro\.config\.[^/]+|tsconfig\.json)$/.test(
        path,
      ),
    ci: (path) => /^\.github\/(?:workflows|scripts)\//.test(path),
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
    ['release/v0.2.0/package', ['chore', 'release']],
    ['rollback/v0.2.1/package', ['chore', 'release', 'revert']],
    ['docs/release-guide', ['docs']],
    ['refactor/exports', ['refactor']],
    ['style/format', ['style']],
    ['test/package', ['test']],
    ['build/dependencies', ['build']],
    ['ci/actions', ['ci']],
    ['chore/metadata', ['chore']],
    ['dependabot/npm_and_yarn/astro-7.2.1', []],
  ];
  for (const [branch, labels] of fixtures) {
    assert.deepEqual(labelsForBranch(branch), labels.sort(), branch);
  }
});

test('path-only rules use one combined all-files glob', () => {
  const patterns = [...source.matchAll(/any-glob-to-all-files:\s*\[\s*'([^']+)'\s*\]/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(patterns, [
    '**/*.{md,mdx}',
    '{test,tests}/**',
    '{package.json,pnpm-lock.yaml,pnpm-workspace.yaml,astro.config.*,tsconfig.json}',
    '.github/{workflows,scripts}/**',
  ]);

  const fixtures = [
    [['README.md', 'docs/adr/0001.md'], ['docs']],
    [['README.md', 'src/card.ts'], []],
    [['tests/card.test.ts', 'test/theme.test.ts'], ['test']],
    [['tests/card.test.ts', 'src/card.ts'], []],
    [['package.json', 'pnpm-lock.yaml'], ['build']],
    [['package.json', 'README.md'], []],
    [['.github/workflows/ci.yml', '.github/scripts/check.mjs'], ['ci']],
    [['.github/workflows/ci.yml', 'package.json'], []],
  ];
  for (const [paths, labels] of fixtures) {
    assert.deepEqual(labelsForPaths(paths), labels, paths.join(', '));
  }
});
