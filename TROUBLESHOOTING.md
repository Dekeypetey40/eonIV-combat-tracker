# Troubleshooting: Can't Find the Module

## Where the Button Should Appear

The **Eon Phases** button appears in the **Combat Tracker** header (left sidebar) when:
1. ✅ You are logged in as **GM**
2. ✅ There is an **active combat encounter**
3. ✅ The module is **enabled**

## Step-by-Step Check

### Step 1: Verify Module is Enabled

1. In Foundry VTT, go to **Settings** (gear icon) → **Manage Modules**
2. Look for **"Eon IV Combat Tracker"** in the list
3. Make sure the checkbox is **checked**
4. Click **"Save Module Settings"**
5. **Reload the world** if prompted

### Step 2: Check Console for Errors

1. Press **F12** to open browser console
2. Look for messages like:
   ```
   eon-combat-tracker | Initializing Eon IV Combat Tracker
   eon-combat-tracker | Eon IV Combat Tracker ready
   ```
3. If you see **errors** (red text), note them down

### Step 3: Start a Combat Encounter

The button **only appears when combat is active**:

1. **Add tokens to a scene** (drag actors from Actors directory)
2. **Select the tokens** on the scene
3. **Right-click** → **"Toggle Combat State"**
   - OR open **Combat Tracker** and click **"Begin Encounter"**
4. The button should now appear in the Combat Tracker header

### Step 4: Find the Button

Once combat is active, look in the **Combat Tracker** (left sidebar):
- The button is a **layers icon** (☰) 
- It should be in the **header area** of the Combat Tracker
- Tooltip says: "Öppna Eon IV Stridsfaser"

## Manual Open (If Button Doesn't Appear)

If the button doesn't appear, you can still open the panel manually:

1. Press **F12** to open console
2. Type: `EonPhasesPanel.open()`
3. Press Enter
4. The panel should open

## Common Issues

### "Module not found in Manage Modules"
- The module files might not be in the right location
- Check: `%LOCALAPPDATA%\FoundryVTT\Data\modules\eon-combat-tracker\`
- Make sure `module.json` exists there

### "Console shows errors"
- Check that `dist/main.js` exists and was built
- Run `npm run build` in the project directory
- Copy the updated files to Foundry modules folder

### "Button doesn't appear even with combat active"
- Make sure you're logged in as **GM** (not Player)
- Check console for JavaScript errors
- Try manually opening: `EonPhasesPanel.open()` in console

### "Module loads but nothing happens"
- Check that you're using **Eon RPG** system (not another system)
- Verify Foundry VTT version is **v13** or higher
- Check console for compatibility errors

## Quick Test

Run this in the browser console (F12):

```javascript
// Check if module loaded
console.log(game.modules.get("eon-combat-tracker"))

// Check if panel class exists
console.log(typeof EonPhasesPanel)

// Try to open panel
EonPhasesPanel.open()
```

If all three work, the module is loaded correctly!

