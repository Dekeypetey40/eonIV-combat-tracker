# Publishing to Foundry VTT

This guide explains how to publish the Eon IV Combat Tracker to Foundry VTT's official module browser so anyone can install it.

## Prerequisites

- A [Foundry VTT license](https://foundryvtt.com/) (any tier)
- This repository on GitHub with releases enabled
- The module tested and working in Foundry v13

## Step 1: Create a GitHub Release

### Manual Release

1. Build the module:
   ```bash
   npm install
   npm run build
   ```

2. Create a ZIP file containing:
   - `module.json`
   - `dist/` folder (built JS)
   - `styles/` folder
   - `templates/` folder
   - `README.md`
   - `LICENSE`

3. Go to GitHub → Releases → "Create a new release"

4. Create a new tag (e.g., `v0.1.0`)

5. Upload:
   - `module.json` (as a separate file)
   - `module.zip` (the ZIP you created)

6. Publish the release

### Automated Release (Recommended)

This repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that:
- Triggers when you push a tag like `v0.1.0`
- Builds the module
- Creates the ZIP
- Publishes a GitHub Release automatically

To use it:
```bash
git tag v0.1.0
git push origin v0.1.0
```

## Step 2: Verify Your Manifest URL

After creating a release, verify these URLs work:

**Manifest URL** (for installation):
```
https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json
```

**Download URL** (in your module.json):
```
https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.zip
```

Test the manifest URL by pasting it into Foundry's "Install Module" → "Manifest URL" field.

## Step 3: Submit to Foundry Package Browser

1. Go to [Foundry VTT Admin](https://foundryvtt.com/admin) (requires login)

2. Navigate to **Packages** → **Submit a Package**

3. Fill out the form:
   - **Package Type**: Module
   - **Package ID**: `eon-combat-tracker`
   - **Title**: Eon IV Combat Tracker
   - **Description**: A phase-based combat tracker for Eon IV...
   - **Manifest URL**: `https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json`
   - **Project URL**: `https://github.com/Dekeypetey40/eonIV-combat-tracker`

4. Submit for review

5. Wait for approval (usually 1-3 business days)

## Step 4: Managing Updates

Once approved, you can publish updates:

### Option A: Manual Version Update

1. Go to [Foundry Package Management](https://foundryvtt.com/packages/manage)
2. Find your package
3. Add a new version with the updated manifest URL

### Option B: Package Release API (Automated)

Foundry provides an API for automated releases. See the workflow file for implementation.

1. Get your API key from Foundry admin
2. Add it as a GitHub Secret: `FOUNDRY_RELEASE_TOKEN`
3. The workflow will automatically notify Foundry of new releases

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.1.1): Bug fixes

Update the version in:
- `module.json` → `version`
- `package.json` → `version`
- Git tag

## Checklist Before Publishing

- [ ] Version numbers match in `module.json` and `package.json`
- [ ] `npm run build` completes without errors
- [ ] Module loads in Foundry v13
- [ ] All features work as expected
- [ ] README is up to date
- [ ] CHANGELOG updated (if you have one)

## Resources

- [Foundry Module Development](https://foundryvtt.com/article/module-development/)
- [Package Submission](https://foundryvtt.com/article/package-submission/)
- [Package Release API](https://foundryvtt.com/article/package-release-api/)
- [Manifest Schema](https://foundryvtt.com/article/manifest-migration-guide/)

