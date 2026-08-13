import assert from 'node:assert/strict';

const SEMVER_CORE_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const BUILD_METADATA_PATTERN = /^\d{14}$/;
const SUBJECT_PATTERN =
  /^(?<type>[a-z]+)(?:\((?<scope>[^()]+)\))?(?<breaking>!)?: (?<description>.+)$/;

const IMPACT_BY_TYPE = new Map([
  ['feat', 'minor'],
  ['perf', 'minor'],
  ['fix', 'patch'],
  ['revert', 'patch'],
  ['build', 'none'],
  ['chore', 'none'],
  ['ci', 'none'],
  ['docs', 'none'],
  ['refactor', 'none'],
  ['style', 'none'],
  ['test', 'none'],
]);

const RETRIABLE_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

const HTTP_STATUS_PATTERNS = [
  /\b(?:status(?:\s+code)?|HTTP)\D{0,3}(\d{3})\b/i,
  /\bcode\s+E(\d{3})\b/i,
  /\bnpm\s+(?:ERR!|error)\s+(\d{3})\b/i,
  /\b(\d{3})\b(?:\s+\w+){1,4}\s+-\s+(?:GET|PUT|POST|DELETE)\b/,
];

export function parseSemver(value, field = 'version') {
  const match = SEMVER_CORE_PATTERN.exec(value);
  assert(match, `${field} must be a plain SemVer core without v, prerelease, or build metadata`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

export function compareSemver(left, right) {
  const a = typeof left === 'string' ? parseSemver(left) : left;
  const b = typeof right === 'string' ? parseSemver(right) : right;
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

export function parseCommitSubject(subject) {
  assert(typeof subject === 'string' && subject.length > 0, 'commit subject is required');
  const match = SUBJECT_PATTERN.exec(subject.split('\n')[0].trim());
  assert(match, `subject is not a Conventional Commit: ${subject}`);
  const { type, scope, breaking, description } = match.groups;
  assert(IMPACT_BY_TYPE.has(type), `unsupported commit type: ${type}`);
  return { type, scope: scope ?? null, breaking: breaking === '!', description };
}

export function versionImpact(message) {
  const [subject, ...rest] = String(message).split('\n');
  const parsed = parseCommitSubject(subject);
  const declaresBreaking =
    parsed.breaking || rest.some((line) => /^BREAKING[ -]CHANGE:/.test(line.trim()));
  if (declaresBreaking) return 'major';
  return IMPACT_BY_TYPE.get(parsed.type);
}

/**
 * A zero major keeps breaking changes inside a minor bump so 1.0.0 stays an explicit
 * stability decision rather than a side effect of the first breaking change.
 */
export function requiredVersion(previous, impact) {
  const { major, minor, patch } = parseSemver(previous, 'previous version');
  if (impact === 'none') return formatSemver({ major, minor, patch });
  if (impact === 'patch') return formatSemver({ major, minor, patch: patch + 1 });
  if (impact === 'minor') return formatSemver({ major, minor: minor + 1, patch: 0 });
  if (impact === 'major') {
    return major === 0
      ? formatSemver({ major, minor: minor + 1, patch: 0 })
      : formatSemver({ major: major + 1, minor: 0, patch: 0 });
  }
  throw new Error(`unknown version impact: ${impact}`);
}

export function validateVersionBump({ previous, next, subject }) {
  const impact = versionImpact(subject);
  const expected = requiredVersion(previous, impact);
  const headline = String(subject).split('\n')[0];
  assert.equal(
    next,
    expected,
    impact === 'none'
      ? `${headline} must not change the version; expected ${expected} but found ${next}`
      : `${headline} requires a ${impact} bump to ${expected} but found ${next}`,
  );
  return { impact, expected, coreChanged: impact !== 'none' };
}

export function utcBuildTimestamp(epochSeconds) {
  const date = new Date(Number(epochSeconds) * 1000);
  assert(!Number.isNaN(date.valueOf()), 'invalid commit epoch');
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join('');
}

/**
 * The build identifier comes from the commit itself rather than wall-clock time so a
 * retried release always resolves to the tag it already created.
 */
export function resolveTag({ version, coreChanged, commitEpoch }) {
  parseSemver(version);
  if (coreChanged) return `v${version}`;
  return `v${version}+${utcBuildTimestamp(commitEpoch)}`;
}

export function parseTag(tag) {
  assert(typeof tag === 'string' && tag.startsWith('v'), `tag must start with v: ${tag}`);
  const [core, build = null, ...extra] = tag.slice(1).split('+');
  assert(extra.length === 0, `tag must contain at most one build identifier: ${tag}`);
  parseSemver(core, 'tag core');
  if (build !== null) {
    assert(BUILD_METADATA_PATTERN.test(build), `build identifier must be YYYYMMDDHHmmss: ${tag}`);
  }
  return { core, build };
}

/**
 * SemVer excludes build metadata from precedence, so tags are never ordered lexically.
 * Equal cores return 0 and the caller must fall back to commit topology.
 */
export function compareTagPrecedence(left, right) {
  return compareSemver(parseTag(left).core, parseTag(right).core);
}

export function isRetriableFailure(failure = {}) {
  const { status, code } = failure;
  if (typeof status === 'number') return status === 429 || status >= 500;
  if (typeof code === 'string') return RETRIABLE_ERROR_CODES.has(code);
  return false;
}

/**
 * npm reports registry problems as text, so the transport failures worth retrying are
 * recognised explicitly and everything else stays an internal fault that must fail fast.
 */
export function classifyProcessFailure(output) {
  const text = String(output ?? '');
  for (const pattern of HTTP_STATUS_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return { status: Number(match[1]) };
  }
  if (/\b(?:Too Many Requests|rate limit(?:ed|ing)?)\b/i.test(text)) return { status: 429 };
  if (/\b(?:internal server error|bad gateway|service unavailable|gateway timeout)\b/i.test(text)) {
    return { status: 503 };
  }
  const code =
    /\b(EAI_AGAIN|ECONNABORTED|ECONNREFUSED|ECONNRESET|ENOTFOUND|EPIPE|ETIMEDOUT)\b/.exec(text);
  if (code) return { code: code[1] };
  if (/\b(?:socket hang up|network (?:error|timeout)|fetch failed)\b/i.test(text)) {
    return { code: 'ECONNRESET' };
  }
  return {};
}

export function isMissingFromRegistry(output) {
  return /\bE404\b|\b404\b|is not in this registry|no such package available/i.test(
    String(output ?? ''),
  );
}

/**
 * A published version is immutable, so an identical digest is the resumption of an
 * interrupted release and any other digest is a violation that must never self-heal.
 */
export function isAlreadyPublished({ name, version, local, remote }) {
  assert(
    typeof local === 'string' && local.startsWith('sha512-'),
    'the local package digest must be a sha512 integrity value',
  );
  if (remote === null || remote === undefined || remote === '') return false;
  assert.equal(
    remote,
    local,
    `${name}@${version} is already published with a different digest; refusing to republish`,
  );
  return true;
}
