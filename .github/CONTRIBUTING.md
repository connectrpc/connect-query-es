# Contributing

We'd love your help making `connect-query` better!

If you'd like to add new exported APIs, please [open an issue][open-issue]
describing your proposal &mdash; discussing API changes ahead of time makes
pull request review much smoother. In your issue, pull request, and any other
communications, please remember to treat your fellow contributors with
respect!

Note that you'll need to sign [Buf's Contributor License Agreement][cla]
before we can accept any of your contributions. If necessary, a bot will remind
you to accept the CLA when you open your pull request.

## Setup

[Fork][fork], then clone the repository:

```bash
git clone git@github.com:your_github_username/connect-query-es.git
cd connect-query-es
git remote add upstream https://github.com/connectrpc/connect-query-es.git
git fetch upstream
```

You will need the latest stable LTS version of Node.js installed.

This project uses `pnpm`. Ensure that you've got corepack enabled with
`corepack enable`. Any `pnpm` command you run in this project will then use
the version of `pnpm` pinned in the `packageManager` property in `package.json`.

Make sure that the tests and linters pass:

```bash
pnpm run all
```

## Making Changes

Start by creating a new branch for your changes:

```bash
git checkout main
git fetch upstream
git rebase upstream/main
git checkout -b cool_new_feature
```

Make your changes, then ensure that `pnpm run all` still passes.
When you're satisfied with your changes, push them to your fork.

```bash
git commit -a
git push origin cool_new_feature
```

Then use the GitHub UI to open a pull request.

At this point, you're waiting on us to review your changes. We *try* to respond
to issues and pull requests within a few business days, and we may suggest some
improvements or alternatives. Once your changes are approved, one of the
project maintainers will merge them.

We're much more likely to approve your changes if you:

- Add tests for new functionality.
- Write a [good commit message][commit-message].
- Maintain backward compatibility.

## Updating dependencies

You can update all dependencies in this project with a single command:

```console
pnpm run update-all
```

This command is just a convenience wrapper around `pnpm update` and `pnpm outdated`.

If everything goes as planned, you should not see any output from the `pnpm outdated` command after the update is complete.

[fork]: https://github.com/connectrpc/connect-query-es/fork
[open-issue]: https://github.com/connectrpc/connect-query-es/issues/new
[cla]: https://cla-assistant.io/connectrpc/connect-query-es
[commit-message]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
