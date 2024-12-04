# Releasing

## Prerequisites

- See the setup and tools required in CONTRIBUTING.md
- A granular access token for npmjs.com with read and write permissions, scoped
  to the `connectrpc` organization.
- Make sure that the repository is in a good state, without PRs close to merge
  that would ideally be part of the release.

## Steps

1. Choose a new version (e.g. 1.2.3), making sure to follow semver. Note that all
   packages in this repository use the same version number.
2. Make sure you are on the latest main, and create a new git branch.
3. Set the new version for all packages within the monorepo with the following
   commands:

   ```bash
   pnpm --filter "./packages/*" exec pnpm version 1.2.3
   pnpm run all
   ```

4. Commit, push, and open a pull request with the title "Release 1.2.3".
5. Edit the PR description with release notes. See the section below for details.
6. Make sure CI passed on your PR and ask a maintainer for review.
7. After approval, run the following commands to publish to npmjs.com:

   ```bash
   pnpm install && pnpm run all && node scripts/release.mjs
   ```

8. Merge your PR.
9. Create a new release in the GitHub UI
   - Choose "v1.2.3" as a tag and as the release title.
   - Copy and paste the release notes from the PR description.
   - Check the checkbox “Create a discussion for this release”.

## Release notes

- We generate release notes with the GitHub feature, see
  <https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes>
- Only changes that impact users should be listed. No need to list things like
  doc changes (unless it’s something major), dependency version bumps, or similar.
  Remove them from the generated release notes.
- If the release introduces a major new feature or change, add a paragraph at the
  top that explains it for users.
