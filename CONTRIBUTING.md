# Contributing

## Making sure your on the right pnpm version

Ensure that you've got corepack enabled:

```console
corepack enable
```

This should only be necessary once.

Verify that `pnpm --version` matches the `packageManager` version in `package.json`.

## Updating dependencies

You can update all dependencies in this project with a single command:

```console
pnpm run update-all
```

This command is just a convenience wrapper around `pnpm update` and `pnpm outdated`.

If everything goes as planned, you should not see any output from the `pnpm outdated` command after the update is complete.
