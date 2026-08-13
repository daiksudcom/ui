import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function strings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(strings);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

function unpack(tarball, directory) {
  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
  invariant(entries.length > 0, 'package tarball is empty');
  invariant(
    entries.every((entry) => !entry.startsWith('/') && !entry.split('/').includes('..')),
    'package tarball contains an unsafe path',
  );
  execFileSync('tar', ['-xzf', tarball, '-C', directory]);
}

function verifyManifest(packageRoot, expectedVersion) {
  const manifestPath = join(packageRoot, 'package.json');
  invariant(existsSync(manifestPath), 'package.json is missing from the tarball');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  invariant(manifest.name === '@daiksudme/ui', 'packed package name is not @daiksudme/ui');
  invariant(manifest.version === expectedVersion, 'packed package version does not match release');
  invariant(manifest.private !== true, 'private packages cannot be released');
  invariant(
    typeof manifest.license === 'string' && manifest.license.length > 0,
    'license is required',
  );
  invariant(manifest.repository, 'repository metadata is required');
  invariant(
    Array.isArray(manifest.files) &&
      manifest.files.length > 0 &&
      manifest.files.every((entry) => typeof entry === 'string' && entry.length > 0),
    'an explicit non-empty files allowlist is required',
  );
  invariant(
    manifest.exports && typeof manifest.exports === 'object',
    'public exports are required',
  );

  const targets = strings(manifest.exports).filter((target) => !target.includes('*'));
  invariant(targets.length > 0, 'at least one concrete public export is required');
  for (const target of targets) {
    invariant(target.startsWith('./'), `export target must be package-relative: ${target}`);
    const resolved = resolve(packageRoot, target);
    invariant(
      relative(packageRoot, resolved) && !relative(packageRoot, resolved).startsWith('..'),
      `unsafe export target: ${target}`,
    );
    invariant(existsSync(resolved), `export target does not exist: ${target}`);
  }
  return manifest;
}

function packageSmoke(tarball, expectedVersion) {
  const directory = mkdtempSync(join(tmpdir(), 'ui-package-'));
  try {
    unpack(tarball, directory);
    verifyManifest(join(directory, 'package'), expectedVersion);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function consumerSmoke(tarball, expectedVersion) {
  const directory = mkdtempSync(join(tmpdir(), 'ui-consumer-'));
  try {
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ name: 'ui-release-smoke', private: true, type: 'module' }),
    );
    execFileSync('pnpm', ['add', '--offline', '--ignore-scripts', realpathSync(tarball)], {
      cwd: directory,
      stdio: 'inherit',
    });
    const packageRoot = dirname(
      realpathSync(join(directory, 'node_modules/@daiksudme/ui/package.json')),
    );
    const manifest = verifyManifest(packageRoot, expectedVersion);
    for (const exportName of Object.keys(manifest.exports)) {
      const suffix = exportName === '.' ? '' : exportName.slice(1);
      execFileSync(
        process.execPath,
        ['--input-type=module', '--eval', `import.meta.resolve('@daiksudme/ui${suffix}')`],
        { cwd: directory },
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const [mode, tarball, expectedVersion] = process.argv.slice(2);
try {
  invariant(['package', 'consumer'].includes(mode), 'mode must be package or consumer');
  invariant(
    tarball && expectedVersion,
    'usage: package-smoke.mjs <package|consumer> <tarball> <version>',
  );
  if (mode === 'package') {
    packageSmoke(tarball, expectedVersion);
  } else {
    consumerSmoke(tarball, expectedVersion);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
