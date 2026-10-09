import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const source = readFileSync(new URL("../workflows/auto-merge.yml", import.meta.url), "utf8");
const script = source.split("        run: |\n")[1].replace(/^          /gm, "");

test("legacy auto-merge accepts only successful PR runs and pins the tested SHA", () => {
  assert.match(source, /conclusion == 'success' && github.event.workflow_run.event == 'pull_request'/);
  assert.match(source, /HEAD_SHA: \$\{\{ github.event.workflow_run.head_sha \}\}/);
});

for (const scenario of [
  { name: "validated trusted PR", merge: true },
  { name: "changed head", head: "new-head" },
  { name: "missing tested head", testedHead: "" },
  { name: "fork", repo: "outsider/ccg-builder" },
  { name: "untrusted author", association: "NONE" },
  { name: "draft", draft: true },
  { name: "closed PR", state: "closed" },
  { name: "missing opt-in", labels: [] },
  { name: "run without a PR", noPR: true },
]) {
  test(`legacy auto-merge: ${scenario.name}`, () => {
    const directory = mkdtempSync(join(tmpdir(), "ccg-merge-"));
    try {
      const pr = {
        state: scenario.state ?? "open", draft: scenario.draft ?? false,
        head: { sha: scenario.head ?? "tested-head", repo: { full_name: scenario.repo ?? "cipherfall-tcg/ccg-builder" } },
        author_association: scenario.association ?? "MEMBER",
        labels: scenario.labels ?? [{ name: "automerge" }],
      };
      writeFileSync(join(directory, "pr.json"), JSON.stringify(pr));
      writeFileSync(join(directory, "event.json"), JSON.stringify({ workflow_run: { pull_requests: scenario.noPR ? [] : [{ number: 7 }] } }));
      writeFileSync(join(directory, "gh"), `#!/bin/bash
set -euo pipefail
if [[ "$1" == "api" ]]; then
  cat "$FIXTURE_DIR/pr.json"
else
  printf '%s\\n' "$@" > "$FIXTURE_DIR/merge-args"
fi
`, { mode: 0o700 });
      const result = spawnSync("bash", ["-c", script], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, FIXTURE_DIR: directory,
          GITHUB_EVENT_PATH: join(directory, "event.json"), REPOSITORY: "cipherfall-tcg/ccg-builder",
          HEAD_SHA: scenario.testedHead ?? "tested-head" },
      });
      assert.equal(result.status, 0, result.stderr);
      if (scenario.merge) {
        assert.deepEqual(readFileSync(join(directory, "merge-args"), "utf8").trim().split("\n"),
          ["pr", "merge", "7", "--repo", "cipherfall-tcg/ccg-builder", "--match-head-commit", "tested-head", "--squash", "--delete-branch"]);
      } else {
        assert.throws(() => readFileSync(join(directory, "merge-args")), { code: "ENOENT" });
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
