# Self-hosted Actions

Every job in this repository uses:

```yaml
runs-on: [self-hosted, Linux, X64, cipherfall-release]
```

There is no GitHub-hosted fallback, including validation, auto-merge,
scheduled monitoring, artifact releases and dependency-update jobs.
Existing job names, dependency graphs, timeouts and permissions are preserved,
except for the public-repository PR security gate described below.

## Runner access

The organization runner must have access to this repository under
**cipherfall-tcg > Settings > Actions > Runner groups**.
A repository runner can execute jobs only for its registered repository.
Content's two repository runners can remain registered there; the organization
runner supplies capacity to the other repositories. Do not unregister a busy runner.

GitHub matches ALL requested labels. The informational `repo` and `org`
labels do not establish priority or fallback, and are deliberately not required
by workflows. Any accessible runner with the shared capability labels can accept
a job. If none is accessible/online, the job queues rather than using billable
GitHub-hosted compute. There is no promise that a repository runner wins over
an idle organization runner.

## Machine prerequisites

Provision tools for the runner service account, not just an interactive shell:

- Git, Bash, tar, zip, unzip, GNU coreutils (including sha256sum).
- GitHub CLI (`gh`) and jq for releases, auto-merge and monitoring.
- Node.js support via actions/setup-node (workflows select Node 22).
- Sufficient writable disk space, a working CA trust store and outbound HTTPS.
- Android SDK/build tools on every runner eligible for coordinated Android jobs;
  the release workflow installs Java 17 and checks Android SDK paths.

On Ubuntu, an administrator can install the base tools once:

```bash
sudo apt-get update
sudo apt-get install -y git bash tar zip unzip coreutils gh jq
```

Restart the service after changing its PATH/environment. Do not install tools
or change runner registrations while an existing job is active. Keep job
checkout/work directories distinct even when multiple executors share a machine.

## Public repository safety

Do not enable arbitrary public fork workflows on credential-bearing runners.
CCG Builder uses `pull_request_target` (the trusted base workflow), allows only
same-repository PRs from OWNER/MEMBER/COLLABORATOR, checks out the exact PR head,
and disables persisted checkout credentials. Fork PR jobs are skipped.
Both auto-merge paths pin the merge to the validated head. The legacy
`workflow_run` path accepts only successful `pull_request` runs; push and merge
queue runs cannot authorize a PR merge.
PR validation workflow changes take effect only after merging into the base
branch; bootstrap this routing change with local policy validation/manual review.

Private repositories must retain disabled fork-workflow execution in
**Settings > Actions > General**. The job guard is not a substitute for that
repository policy. An organization runner group's public-repository access is a
separate explicit opt-in; do not silently widen it. CCG Builder remains independent
of the Cipherfall product release script.

## Verification

```bash
node --test .github/tests/*.test.mjs
```

The Actions policy job checks every workflow's runner targets. Inspect a completed
validation run's runner name to confirm organization access. Configuration tests
cannot prove runner-group access or installed machine tools.
