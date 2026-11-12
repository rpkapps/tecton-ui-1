/**
 * Prepares a release pull request for @tecton/react (RELEASE.md):
 *
 *   pnpm release <patch|minor|major> [--rc]
 *
 * - Sets the next version in packages/tecton-react/package.json. With --rc, a final version becomes
 *   the bumped version's `-rc.1`, and an existing `-rc.N` becomes `-rc.N+1`.
 * - For a final version, moves `## [Unreleased]` into `## [X.Y.Z] - <today>` in CHANGELOG.md and
 *   updates the link references. Pre-releases leave the changelog alone.
 * - Rebuilds the agent index, which records the version.
 */ import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const PACKAGE_JSON = "packages/tecton-react/package.json"
const CHANGELOG = "CHANGELOG.md"
const REPO_URL = "https://github.com/rpkapps/tecton-ui-1"
const BUMPS = ["patch", "minor", "major"] as const
type Bump = (typeof BUMPS)[number]

function fail(message: string): never {
  console.error(`::error::${message}`)
  process.exit(1)
}

type Version = {
  major: number
  minor: number
  patch: number
  rc: number | null
}

function parse(version: string): Version {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/.exec(version)
  if (!match) fail(`version "${version}" is not X.Y.Z or X.Y.Z-rc.N`)
  const [, major, minor, patch, rc] = match
  return {
    major: +major,
    minor: +minor,
    patch: +patch,
    rc: rc === undefined ? null : +rc,
  }
}

function format({ major, minor, patch, rc }: Version) {
  return `${major}.${minor}.${patch}${rc === null ? "" : `-rc.${rc}`}`
}

/** npm's rules: bumping a pre-release first releases the version it leads up to. */
function bump(current: Version, kind: Bump): Version {
  const { major, minor, patch, rc } = current
  const isPre = rc !== null
  switch (kind) {
    case "patch":
      return { major, minor, patch: isPre ? patch : patch + 1, rc: null }
    case "minor":
      return isPre && patch === 0
        ? { major, minor, patch: 0, rc: null }
        : { major, minor: minor + 1, patch: 0, rc: null }
    case "major":
      return isPre && minor === 0 && patch === 0
        ? { major, minor: 0, patch: 0, rc: null }
        : { major: major + 1, minor: 0, patch: 0, rc: null }
  }
}

export function nextVersion(
  currentVersion: string,
  kind: Bump,
  prerelease: boolean
): string {
  const current = parse(currentVersion)
  if (!prerelease) return format(bump(current, kind))
  if (current.rc !== null) return format({ ...current, rc: current.rc + 1 })
  return format({ ...bump(current, kind), rc: 1 })
}

const escape = (text: string) => text.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")

export function releaseChangelog(
  changelog: string,
  version: string,
  date: string
): string {
  if (new RegExp(`^## \\[${escape(version)}\\]`, "m").test(changelog))
    fail(`${CHANGELOG} already has a "## [${version}]" section`)

  const nl = changelog.includes("\r\n") ? "\r\n" : "\n"
  const unreleased =
    /^## \[Unreleased\][^\S\r\n]*\r?\n([\s\S]*?)(?=^## \[|^\[[^\]]+\]: |(?![\s\S]))/m.exec(
      changelog
    )
  if (!unreleased) fail(`${CHANGELOG} has no "## [Unreleased]" section`)
  const notes = unreleased[1].trim()
  if (!notes)
    fail(
      `the "## [Unreleased]" section of ${CHANGELOG} is empty; add the changes first`
    )

  let next =
    changelog.slice(0, unreleased.index) +
    `## [Unreleased]${nl}${nl}## [${version}] - ${date}${nl}${nl}${notes}${nl}${nl}` +
    changelog.slice(unreleased.index + unreleased[0].length)

  const link =
    /^\[Unreleased\]: \S+\/compare\/(v\S+?)\.\.\.HEAD[^\S\r\n]*$/m.exec(next)
  const versionLink = link
    ? `[${version}]: ${REPO_URL}/compare/${link[1]}...v${version}`
    : `[${version}]: ${REPO_URL}/releases/tag/v${version}`
  const unreleasedLink = `[Unreleased]: ${REPO_URL}/compare/v${version}...HEAD`
  next = link
    ? next.replace(link[0], `${unreleasedLink}${nl}${versionLink}`)
    : `${next.trimEnd()}${nl}${nl}${unreleasedLink}${nl}${versionLink}${nl}`
  return next
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const prerelease = args.includes("--rc")
  const kind = args.find((arg) => arg !== "--rc")
  if (!BUMPS.includes(kind as Bump))
    fail(`usage: pnpm release <${BUMPS.join("|")}> [--rc]`)

  const pkgText = readFileSync(PACKAGE_JSON, "utf8")
  const pkg = JSON.parse(pkgText) as { version: string }
  const version = nextVersion(pkg.version, kind as Bump, prerelease)
  const isPre = parse(version).rc !== null

  const pkgUpdate = pkgText.replace(
    /("version":\s*")[^"]+(")/,
    `$1${version}$2`
  )
  if (pkgUpdate === pkgText)
    fail(`no "version" field to update in ${PACKAGE_JSON}`)

  // Every check runs before the first write, so a failure leaves both files untouched.
  let changelogUpdate: string | null = null
  if (!isPre) {
    const today = new Date().toISOString().slice(0, 10)
    changelogUpdate = releaseChangelog(
      readFileSync(CHANGELOG, "utf8"),
      version,
      today
    )
  }

  writeFileSync(PACKAGE_JSON, pkgUpdate)
  if (changelogUpdate !== null) writeFileSync(CHANGELOG, changelogUpdate)
  execSync("pnpm --filter @tecton/react agent:build", {
    stdio: "inherit",
  })

  console.log(`
${pkg.version} → ${version}. Open a pull request titled "release: v${version}" with these changes;
merging it publishes ${version}${isPre ? " under the `next` dist-tag" : ""}.`)
}
