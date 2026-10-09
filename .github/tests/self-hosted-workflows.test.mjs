import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const directory = new URL("../workflows/", import.meta.url);
const workflows = readdirSync(directory).filter((name) => /\.ya?ml$/.test(name));

test("every workflow job uses the accessible self-hosted release pool", () => {
  assert.ok(workflows.length > 0);
  for (const name of workflows) {
    const source = readFileSync(new URL(name, directory), "utf8");
    const jobs = source.slice(source.indexOf("\njobs:\n"));
    const jobNames = [...jobs.matchAll(/^  [\w-]+:\s*$/gm)];
    const targets = [...jobs.matchAll(/^    runs-on: (.+)$/gm)];
    assert.equal(targets.length, jobNames.length, name + ": each job needs an explicit pool");
    for (const [, target] of targets) {
      assert.equal(target, "[self-hosted, Linux, X64, cipherfall-release]", name);
    }
    assert.doesNotMatch(source, /runs-on:.*(?:ubuntu-latest|windows-latest|macos-latest)/);
    assert.doesNotMatch(source, /runs-on:.*(?:, repo|, org)/);
  }
});

test("public PR validation uses trusted base configuration and rejects forks", () => {
  const source = readFileSync(new URL("pull-request.yml", directory), "utf8");
  assert.match(source, /^  pull_request_target:$/m);
  assert.doesNotMatch(source, /^  pull_request:$/m);
  const jobSource = source.slice(source.indexOf("\njobs:\n"));
  const jobs = [...jobSource.matchAll(/^  [\w-]+:\n(?<body>[\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm)];
  assert.equal(jobs.length, 4);
  for (const { groups: { body } } of jobs) {
    assert.match(body, /head.repo.full_name == github.repository/);
    assert.match(body, /OWNER.*MEMBER.*COLLABORATOR/);
    if (body.includes("uses: actions/checkout")) {
      assert.match(body, /ref: \$\{\{ github.event.pull_request.head.sha \|\| github.sha \}\}/);
      assert.match(body, /persist-credentials: false/);
      assert.match(body, /repos\/\$REPOSITORY\/check-runs/);
    } else {
      assert.match(body, /--match-head-commit "\$HEAD_SHA"/);
    }
  }
});
