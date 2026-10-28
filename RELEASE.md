# Releasing Wardrobe

## Current release

- Display name: Wardrobe
- Stable plugin ID and installation folder: wardrobe
- Version/tag: 1.0.0 (no v prefix)
- Minimum Obsidian version: 1.7.2 (the async revealLeaf API)
- Licence: GPL-3.0-only

## Verify before publishing

Run `npm ci` and `npm run release:prepare` using Node.js 22 or later. The checks cover TypeScript compilation, configured Obsidian lint rules, unit tests and release metadata. They do not replace Obsidian's automated directory review.

Before marking the release public, check it in a test vault on desktop and a physical mobile device:

- Open the wardrobe, refresh and confirm the toast.
- Configure custom property names and filter value; refresh and verify matching notes.
- Select clothing, add and remove layers, drag them, and use up/down controls.
- Restart the plugin and verify the layer order persists.
- Save to a nested destination and to the vault root; verify image order and no duplicate overwrites.
- Save with default and custom templates, dates and notes.
- Check light/dark themes, a narrow pane, keyboard controls and mobile bottom clearance.

Physical device verification and directory review have not yet been performed.

## GitHub repository

Create a public repository containing this plugin folder as its root. Keep the source, README, LICENSE, manifest, versions, lockfile, scripts, tests and workflows. Do not upload local data.json, node_modules, dist or generated main.js as source. These are excluded by .gitignore.

The repository must belong to the GitHub account or organisation used for submission. Before submission, verify the ID `wardrobe` is available in the Community directory. Keep that ID stable after publication.

## GitHub release

Commit the source and push tag `1.0.0`. The included workflow validates the project and creates a **draft** release with main.js, manifest.json and styles.css attached separately. Review and publish the draft after completing the manual checks above.

Alternatively, run `npm run release:prepare`, create a release tagged `1.0.0` manually, and attach the three files from `dist/1.0.0/`. SHA256SUMS is provided for local integrity checks. The built-in GitHub source archives alone are insufficient.

## Submit to Obsidian

Follow the official guide: https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin

1. Sign in to https://community.obsidian.md with an Obsidian account.
2. Connect the GitHub account that owns the public repository.
3. Add the plugin, select its repository, and submit for automated review.
4. Resolve any reported errors, increment the version consistently in manifest.json, package.json, package-lock.json and versions.json, and publish a matching release.

The manifest on the default branch and the published release tag must agree. A published release must exist before the plugin can be installed from the directory. No community-plugins.json pull request is required by the current submission process.

## Privacy and support

Wardrobe works locally inside the vault and makes no network requests. Settings are stored in Obsidian's plugin data. Organise clothing modifies only the selected note's configured type property; saving creates a new note. Removing layers does not delete clothing files.

Use the repository's Issues page for support once the public repository is available. Do not attach private vault data to bug reports.

The project .npmrc uses legacy peer resolution because the Obsidian lint package pins an older Obsidian API peer. Runtime code uses only the external Obsidian API; validation tooling is development-only. The lockfile records the resolved versions.
