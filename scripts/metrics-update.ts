#!/usr/bin/env tsx
/**
 * Fetches live repo metrics and writes metrics/weekly.json.
 * Run via: pnpm metrics:update
 * Also called by .github/workflows/metrics-update.yml on a weekly schedule.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

const repo = "mrpmohiburrahman/rnui.dev";

const repoStats = JSON.parse(
  run(
    `gh api repos/${repo} --jq '{stars: .stargazers_count, forks: .forks_count, watchers: .subscribers_count, open_issues: .open_issues_count}'`,
  ),
);

const contributors: Array<{ login: string; contributions: number }> = JSON.parse(
  run(`gh api repos/${repo}/contributors --jq 'map({login, contributions}) | sort_by(-.contributions)'`),
);

const totalCommits = parseInt(run("git log --oneline | wc -l"), 10);
const maintainerCommits = parseInt(run("git log --author=mrpmohiburrahman --oneline | wc -l"), 10);

const codexTriagedPrs = parseInt(
  run(
    `gh api "repos/${repo}/issues?state=all&labels=codex-triage&per_page=100" --jq 'length'`,
  ),
  10,
);

const metrics = {
  generated_at: new Date().toISOString().slice(0, 10),
  repo,
  stars: repoStats.stars,
  forks: repoStats.forks,
  watchers: repoStats.watchers,
  open_issues: repoStats.open_issues,
  total_commits: totalCommits,
  maintainer_commits: maintainerCommits,
  maintainer_commit_pct: Math.round((maintainerCommits / totalCommits) * 1000) / 10,
  codex_triaged_prs: codexTriagedPrs,
  contributors,
};

const outPath = resolve(process.cwd(), "metrics/weekly.json");
writeFileSync(outPath, JSON.stringify(metrics, null, 2) + "\n");
console.log("metrics/weekly.json updated:", metrics);
