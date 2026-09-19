/**
 * skills-sync — keeps the Agent Skills provenance artifacts in step with the
 * SKILL.md files they describe (TanStack Intent).
 *
 *   bun run scripts/skills-sync.mts [--check]
 *
 * Reads every skills/<path>/SKILL.md, joins it with skills/_artifacts/domain_map.yaml
 * and writes:
 *   - skills/_artifacts/skill_tree.yaml  the generated inventory `intent stale`
 *     cross-checks against the SKILL.md frontmatter (name, path, sources,
 *     library_version). Generated rather than hand-written so the two can
 *     never disagree.
 *   - skills/_artifacts/skill_spec.md    the human-readable companion: the
 *     domain and skill inventory, and every failure mode with its source.
 *   - skills/sync-state.json             a SHA-256 per declared source, so a
 *     change to a source doc flags its skill for review.
 *
 * `--check` writes nothing and exits 1 when either file is out of date — a
 * changed source doc, a new/removed skill, or edited frontmatter. That is the
 * staleness signal: the skill has to be re-read against its source, not just
 * regenerated.
 *
 * `intent validate` checks the SKILL.md files themselves; this script checks
 * that they still match the docs they were derived from.
 */
/// <reference types="node" />
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "../..");
const SKILLS_DIR = path.join(pkgRoot, "skills");
const ARTIFACTS_DIR = path.join(SKILLS_DIR, "_artifacts");
const DOMAIN_MAP = path.join(ARTIFACTS_DIR, "domain_map.yaml");
const SKILL_TREE = path.join(ARTIFACTS_DIR, "skill_tree.yaml");
const SKILL_SPEC = path.join(ARTIFACTS_DIR, "skill_spec.md");
const SYNC_STATE = path.join(SKILLS_DIR, "sync-state.json");

const checkOnly = process.argv.includes("--check");

type Frontmatter = {
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
  sources?: Array<string>;
  requires?: Array<string>;
};

/** Every SKILL.md under skills/, as a posix path relative to skills/. */
function findSkillFiles(dir: string, acc: Array<string> = []): Array<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (entry.name === "_artifacts") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findSkillFiles(full, acc);
    else if (entry.name === "SKILL.md") acc.push(full);
  }
  return acc;
}

function readFrontmatter(file: string): Frontmatter {
  const match = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match?.[1]) throw new Error(`${path.relative(repoRoot, file)}: missing frontmatter`);
  return parseYaml(match[1]) as Frontmatter;
}

/**
 * A source is `<repo>:<path>`; the path is relative to the repository root and
 * may be a file or a directory (a whole docs folder backs some skills).
 */
function sourcePath(source: string): string {
  const colon = source.indexOf(":");
  return path.join(repoRoot, colon === -1 ? source : source.slice(colon + 1));
}

function hashFile(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** Directory digest: sorted relative paths and their content hashes. */
function hashDir(dir: string): string {
  const hash = createHash("sha256");
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else hash.update(`${path.relative(dir, full)}:${hashFile(full)}\n`);
    }
  };
  walk(dir);
  return hash.digest("hex");
}

function hashSource(source: string): string | null {
  const target = sourcePath(source);
  if (!existsSync(target)) return null;
  return statSync(target).isDirectory() ? hashDir(target) : hashFile(target);
}

// ---------------------------------------------------------------------------

type FailureMode = { mistake: string; mechanism: string; source: string; priority: string; skills?: Array<string> };
type DomainMapSkill = {
  slug: string;
  domain: string;
  type: string;
  name: string;
  description: string;
  covers?: Array<string>;
  failure_modes?: Array<FailureMode>;
  reference_candidates?: Array<{ topic: string; reason: string }>;
};
const domainMap = parseYaml(readFileSync(DOMAIN_MAP, "utf8")) as {
  library: { name: string; version: string; repository: string; description: string };
  domains: Array<{ name: string; slug: string; description: string }>;
  skills: Array<DomainMapSkill>;
  tensions?: Array<{ name: string; skills: Array<string>; implication: string }>;
  cross_references?: Array<{ from: string; to: string; reason: string }>;
};
const bySlug = new Map(domainMap.skills.map((s) => [s.slug, s]));

const skillFiles = findSkillFiles(SKILLS_DIR);
const problems: Array<string> = [];
const state: Record<string, { sources_sha: Record<string, string> }> = {};

const treeSkills = skillFiles.map((file) => {
  const relName = path.relative(SKILLS_DIR, path.dirname(file)).split(path.sep).join("/");
  const fm = readFrontmatter(file);
  const leaf = relName.split("/").pop()!;
  const entry = bySlug.get(leaf);
  if (!entry) problems.push(`${relName}: no entry with slug "${leaf}" in domain_map.yaml`);

  const version = fm.metadata?.library_version;
  if (version !== domainMap.library.version) {
    problems.push(
      `${relName}: metadata.library_version (${version}) does not match domain_map library.version (${domainMap.library.version})`
    );
  }

  const sources = fm.sources ?? [];
  const shas: Record<string, string> = {};
  for (const source of sources) {
    const sha = hashSource(source);
    if (sha === null) problems.push(`${relName}: source does not exist — ${source}`);
    else shas[source] = sha;
  }
  state[relName] = { sources_sha: shas };

  return {
    name: entry?.name ?? leaf,
    slug: leaf,
    type: fm.metadata?.type ?? entry?.type ?? "sub-skill",
    domain: entry?.domain ?? "",
    path: `skills/${relName}/SKILL.md`,
    package: "@tecton/react",
    packages: ["@tecton/react"],
    description: (fm.description ?? "").replace(/\s+/g, " ").trim(),
    requires: fm.requires ?? [],
    sources,
  };
});

const tree = {
  library: domainMap.library,
  generated_from: {
    domain_map: "skills/_artifacts/domain_map.yaml",
    skill_spec: "skills/_artifacts/skill_spec.md",
  },
  generated_by: "packages/tecton-react/scripts/skills-sync.mts",
  skills: treeSkills,
};

const header =
  "# skill_tree.yaml — GENERATED by scripts/skills-sync.mts, do not edit.\n" +
  "# Regenerate with: pnpm --filter @tecton/react skills:sync\n";
const treeText = header + stringifyYaml(tree, { lineWidth: 0 });
const stateText = `${JSON.stringify({ skills: state }, null, 2)}\n`;

// --- skill_spec.md: the human-readable companion, generated from the map ----
const pathBySlug = new Map(treeSkills.map((s) => [s.slug, s.path]));
const esc = (value: string) => value.replace(/\|/g, "\\|");
const specLines: Array<string> = [
  "<!-- GENERATED by scripts/skills-sync.mts from domain_map.yaml — do not edit. -->",
  "<!-- Regenerate with: pnpm --filter @tecton/react skills:sync -->",
  "",
  `# ${domainMap.library.name} — Skill Spec`,
  "",
  domainMap.library.description,
  "",
  "These skills are shipped inside the package and discovered by AI coding agents",
  "through [TanStack Intent](https://tanstack.com/intent). They exist because an",
  "agent's prior for \"shadcn/ui + Tailwind\" is the Radix build with the stock",
  "palette, and on this design system both halves of that prior are wrong in ways",
  "that fail silently.",
  "",
  "## Domains",
  "",
  "| Domain | Description | Skills |",
  "| ------ | ----------- | ------ |",
];
for (const domain of domainMap.domains) {
  const members = domainMap.skills.filter((s) => s.domain === domain.slug).map((s) => s.slug);
  specLines.push(`| ${esc(domain.name)} | ${esc(domain.description)} | ${members.join(", ")} |`);
}
specLines.push("", "## Skill inventory", "", "| Skill | Type | Domain | Covers | Failure modes |", "| ----- | ---- | ------ | ------ | ------------- |");
for (const skill of domainMap.skills) {
  const target = pathBySlug.get(skill.slug) ?? "—";
  specLines.push(
    `| [\`${skill.slug}\`](../../${target.replace(/^skills\//, "")}) | ${skill.type} | ${skill.domain} | ${esc((skill.covers ?? []).join(", "))} | ${(skill.failure_modes ?? []).length} |`
  );
}
specLines.push("", "## Failure mode inventory", "");
for (const skill of domainMap.skills) {
  const modes = skill.failure_modes ?? [];
  specLines.push(`### \`${skill.slug}\` (${modes.length})`, "", "| # | Mistake | Priority | Source | Also in |", "| - | ------- | -------- | ------ | ------- |");
  modes.forEach((mode, index) => {
    const also = (mode.skills ?? []).filter((s) => !s.endsWith(skill.slug)).join(", ") || "—";
    specLines.push(`| ${index + 1} | ${esc(mode.mistake)} | ${mode.priority} | \`${esc(mode.source)}\` | ${esc(also)} |`);
  });
  specLines.push("");
}
if (domainMap.tensions?.length) {
  specLines.push("## Tensions", "", "| Tension | Skills | What agents get wrong |", "| ------- | ------ | --------------------- |");
  for (const tension of domainMap.tensions) {
    specLines.push(`| ${esc(tension.name)} | ${tension.skills.join(" ↔ ")} | ${esc(tension.implication)} |`);
  }
  specLines.push("");
}
if (domainMap.cross_references?.length) {
  specLines.push("## Cross-references", "", "| From | To | Reason |", "| ---- | -- | ------ |");
  for (const ref of domainMap.cross_references) {
    specLines.push(`| ${ref.from} | ${ref.to} | ${esc(ref.reason)} |`);
  }
  specLines.push("");
}
const referenceRows = domainMap.skills.filter((s) => s.reference_candidates?.length);
if (referenceRows.length) {
  specLines.push("## Reference files", "", "| Skill | Topic | Why it needs its own file |", "| ----- | ----- | ------------------------- |");
  for (const skill of referenceRows) {
    for (const candidate of skill.reference_candidates!) {
      specLines.push(`| ${skill.slug} | ${esc(candidate.topic)} | ${esc(candidate.reason)} |`);
    }
  }
  specLines.push("");
}
const specText = `${specLines.join("\n").replace(/\n+$/, "")}\n`;

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in the skill tree:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const treeStale = !existsSync(SKILL_TREE) || readFileSync(SKILL_TREE, "utf8") !== treeText;
const specStale = !existsSync(SKILL_SPEC) || readFileSync(SKILL_SPEC, "utf8") !== specText;
const stateStale = !existsSync(SYNC_STATE) || readFileSync(SYNC_STATE, "utf8") !== stateText;

if (checkOnly) {
  if (!treeStale && !specStale && !stateStale) {
    console.log(`✅ Skill artifacts up to date — ${treeSkills.length} skills`);
    process.exit(0);
  }
  console.error("✗ Skill artifacts are out of date.\n");
  if (treeStale) console.error("  skills/_artifacts/skill_tree.yaml differs from the SKILL.md files");
  if (specStale) console.error("  skills/_artifacts/skill_spec.md differs from domain_map.yaml");
  if (stateStale) {
    console.error("  skills/sync-state.json differs — a source doc changed since the skills were written");
    const previous = existsSync(SYNC_STATE)
      ? (JSON.parse(readFileSync(SYNC_STATE, "utf8")).skills as typeof state)
      : {};
    for (const [skill, { sources_sha }] of Object.entries(state)) {
      for (const [source, sha] of Object.entries(sources_sha)) {
        if (previous[skill]?.sources_sha?.[source] !== sha) {
          console.error(`    ${skill} ← ${source}`);
        }
      }
    }
  }
  console.error(
    "\n  Re-read each skill against its changed sources, update it, then run:\n" +
      "    pnpm --filter @tecton/react skills:sync"
  );
  process.exit(1);
}

writeFileSync(SKILL_TREE, treeText);
writeFileSync(SKILL_SPEC, specText);
writeFileSync(SYNC_STATE, stateText);
console.log(
  `✅ Wrote skill_tree.yaml, skill_spec.md and sync-state.json — ${treeSkills.length} skills, ` +
    `${Object.values(state).reduce((n, s) => n + Object.keys(s.sources_sha).length, 0)} sources`
);
