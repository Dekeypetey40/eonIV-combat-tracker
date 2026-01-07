# Screenshot Guide for README

This guide will help you create professional screenshots for the README following best practices.

## Screenshots to Take

### 1. Main Panel View (Required)
**File name:** `screenshot-main-panel.png`
**What to capture:**
- The full Eon Phases panel open in Foundry VTT
- Show all 4 phases (Ranged, Melee, Mystic, Ej aktiv) with combatants in different phases
- Include at least 2-3 combatants in the melee phase
- Show the "RUNDA 1" header and "Återställ" button
- **Dimensions:** 700x500px or similar (wide format)
- **Tips:**
  - Use a clean scene background
  - Make sure text is readable
  - Show the panel clearly against the Foundry UI

### 2. Engagement System (Recommended)
**File name:** `screenshot-engagement.png`
**What to capture:**
- Melee phase with 2-3 engaged combatants
- Show engagement indicators (token images linked together)
- Show attacker/defender role icons (sword/shield)
- Show the engagement buttons (toggle role, disengage)
- **Dimensions:** 400x600px or similar (tall format)
- **Tips:**
  - Highlight the engagement visual indicators
  - Show both attacker and defender roles clearly

### 3. Engagement Dialog (Optional but helpful)
**File name:** `screenshot-engage-dialog.png`
**What to capture:**
- The engagement dialog open
- Show radio button selection
- Show multiple combatants available to engage with
- **Dimensions:** 500x400px
- **Tips:**
  - Make sure dialog text is readable
  - Show the "Engagera" and "Avbryt" buttons

### 4. Combat Tracker Button (Optional)
**File name:** `screenshot-combat-tracker-button.png`
**What to capture:**
- Foundry's Combat Tracker sidebar
- Show the layers icon (☰) button in the header
- **Dimensions:** 300x200px
- **Tips:**
  - Highlight the button location
  - Show it's part of the Combat Tracker UI

## How to Take Screenshots

### Method 1: Foundry Built-in Screenshot
1. In Foundry VTT, press **F12** to open browser console
2. Use browser's screenshot tool or:
   - **Windows:** `Win + Shift + S` (Snipping Tool)
   - **Mac:** `Cmd + Shift + 4` (Screenshot tool)
   - **Linux:** Use your system's screenshot tool

### Method 2: Browser Developer Tools
1. Press **F12** to open DevTools
2. Click the device toolbar icon (or press `Ctrl+Shift+M`)
3. Set a custom size (e.g., 1400x900)
4. Take screenshot using browser tools

### Method 3: Screen Recording Tool
1. Use tools like OBS, ShareX, or built-in screen recorders
2. Record a short clip, then extract frames as screenshots

## Image Requirements

### Technical Specs
- **Format:** PNG (preferred) or JPG
- **Quality:** High resolution (at least 1400px wide for main screenshot)
- **File size:** Optimize to under 500KB if possible
- **Naming:** Use descriptive names (see above)

### Content Guidelines
- ✅ Show actual gameplay/usage
- ✅ Include multiple combatants to show functionality
- ✅ Make text readable (zoom in if needed)
- ✅ Use clean, uncluttered scenes
- ✅ Show the module in action (not just empty states)
- ❌ Don't include personal/sensitive information
- ❌ Don't use placeholder images
- ❌ Don't show error messages or bugs

## Where to Place Screenshots

1. Create a `docs/images/` folder in your repository
2. Add all screenshots there
3. Reference them in README.md using:
   ```markdown
   ![Main Panel View](docs/images/screenshot-main-panel.png)
   ```

## README Structure with Screenshots

After taking screenshots, the README should have:

```markdown
## Screenshots

### Main Panel
![Main Panel View](docs/images/screenshot-main-panel.png)
*The Eon Phases panel showing all combat phases with combatants assigned.*

### Engagement System
![Engagement System](docs/images/screenshot-engagement.png)
*Melee engagement with attacker/defender roles and visual indicators.*

### Engagement Dialog
![Engagement Dialog](docs/images/screenshot-engage-dialog.png)
*The engagement dialog for selecting combatants to engage with.*
```

## Quick Checklist

- [ ] Main panel screenshot (required)
- [ ] Engagement system screenshot (recommended)
- [ ] Engagement dialog screenshot (optional)
- [ ] Combat tracker button screenshot (optional)
- [ ] Images optimized and under 500KB each
- [ ] Images placed in `docs/images/` folder
- [ ] README updated with screenshot references
- [ ] Screenshots show actual functionality (not empty states)

## After Taking Screenshots

1. Add images to `docs/images/` folder
2. Update README.md with screenshot sections
3. Commit and push to GitHub
4. Verify images display correctly on GitHub

