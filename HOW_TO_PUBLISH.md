# How to Make Your Module Available to Others

This is a quick guide to publish your module so other Foundry VTT users can install it.

## Two Ways to Distribute

### Option 1: Immediate Distribution (Manifest URL)
**Anyone can install right away using a manifest URL - no approval needed!**

### Option 2: Foundry Package Browser (Official Listing)
**Module appears in Foundry's in-app module browser - requires approval (1-3 days)**

---

## Quick Start: Make It Available NOW (5 minutes)

### Step 1: Create Your First Release

You have two options:

#### A) Automated (Recommended - Uses GitHub Actions)

```bash
# In your project directory
git tag v0.1.0
git push origin v0.1.0
```

This automatically:
- ✅ Builds the module
- ✅ Creates a ZIP file
- ✅ Creates a GitHub Release
- ✅ Uploads module.json and module.zip

**That's it!** After ~2 minutes, your module is available.

#### B) Manual (If you prefer)

1. Build: `npm run build`
2. Create a ZIP with: `module.json`, `dist/`, `styles/`, `templates/`
3. Go to GitHub → Releases → "Create a new release"
4. Tag: `v0.1.0`
5. Upload: `module.json` and `module.zip`
6. Publish

### Step 2: Share the Manifest URL

Once the release is created, share this URL with users:

```
https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json
```

**How users install:**
1. Open Foundry VTT
2. Settings → Add-on Modules → Install Module
3. Paste the manifest URL
4. Click Install

**✅ Done!** Your module is now available to anyone with that URL.

---

## Make It Searchable in Foundry (Optional)

To appear in Foundry's official module browser:

### Step 1: Test Your Manifest URL

1. In Foundry VTT, go to **Add-on Modules** → **Install Module**
2. Paste: `https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json`
3. Click **Install**
4. Verify it installs correctly

### Step 2: Submit to Foundry

1. Go to [Foundry VTT Admin](https://foundryvtt.com/admin) (login required)
2. Navigate to **Packages** → **Submit a Package**
3. Fill out:
   - **Package Type**: Module
   - **Package ID**: `eon-combat-tracker`
   - **Title**: Eon IV Combat Tracker
   - **Description**: 
     ```
     A phase-based combat tracker for Eon IV. Displays combatants in 
     Ranged, Melee, and Mystic phases with drag-and-drop reordering. 
     Automatically resets phase assignments each round.
     ```
   - **Manifest URL**: `https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json`
   - **Project URL**: `https://github.com/Dekeypetey40/eonIV-combat-tracker`
4. Submit for review

### Step 3: Wait for Approval

- Usually takes **1-3 business days**
- You'll get an email when approved
- Then it appears in Foundry's module browser!

---

## Updating Your Module

When you make changes and want to release a new version:

### For Manifest URL Users (Immediate)

```bash
# Update version in module.json and package.json first
git tag v0.1.1  # or v0.2.0 for new features
git push origin v0.1.1
```

Users can update by:
- Foundry will prompt them, or
- They reinstall using the manifest URL

### For Package Browser Users

After approval, updates are automatic:
1. Create a new release (same process)
2. Foundry's system detects the new version
3. Users get update notifications

---

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **v0.1.0** → **v0.1.1** = Bug fix (patch)
- **v0.1.0** → **v0.2.0** = New feature (minor)
- **v0.1.0** → **v1.0.0** = Breaking change (major)

Update in both:
- `module.json` → `"version": "0.1.1"`
- `package.json` → `"version": "0.1.1"`

---

## Checklist Before First Release

- [ ] Module tested and working in Foundry v13
- [ ] Version numbers match in `module.json` and `package.json`
- [ ] `npm run build` succeeds
- [ ] README.md is complete
- [ ] LICENSE file included
- [ ] Manifest URLs in `module.json` point to your GitHub repo

---

## Your Current Setup

✅ **Already configured:**
- GitHub repository: `https://github.com/Dekeypetey40/eonIV-combat-tracker`
- Manifest URL: `https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json`
- Download URL: `https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.zip`
- GitHub Actions workflow for automated releases

**You're ready to publish!** Just create your first release.

