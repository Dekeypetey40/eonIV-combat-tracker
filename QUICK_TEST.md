# Quick Testing Checklist

**Time:** ~10 minutes  
**Requirements:** Foundry VTT license + Eon RPG system installed

## Step 1: Build & Install (2 min)

```bash
# In the project directory
npm run build
```

The module is already copied to your Foundry modules folder. If you need to copy it again:

**Windows:**
```powershell
Copy-Item -Path "C:\Users\kmich\OneDrive\Documents\Programming\2026 projects\eon-combat-tracker" -Destination "$env:LOCALAPPDATA\FoundryVTT\Data\modules\eon-combat-tracker" -Recurse -Force
```

## Step 2: Enable in Foundry (1 min)

1. Launch **Foundry VTT**
2. Open a world using **Eon RPG** system
3. **Settings** → **Manage Modules**
4. Check **"Eon IV Combat Tracker"**
5. Click **Save Module Settings**

## Step 3: Basic Test (3 min)

1. **Open a scene** with some tokens
2. **Select tokens** → Right-click → **"Toggle Combat State"**
3. **Open Combat Tracker** (left sidebar)
4. **Look for the button** (☰ layers icon) in Combat Tracker header
5. **Click it** → Panel should open

✅ **Expected:** Panel shows 4 columns with combatants in "Ej aktiv"

## Step 4: Drag & Drop Test (2 min)

1. **Drag a combatant** from "Ej aktiv" to "Avståndsfasen"
2. **Drag another** to "Närstridsfasen"
3. **Reorder** within a phase (drag up/down)

✅ **Expected:** Combatants move and stay in new positions

## Step 5: Round Reset Test (1 min)

1. **Assign combatants** to different phases
2. **Click "Next Round"** in Combat Tracker
3. **Check panel**

✅ **Expected:** All combatants reset to "Ej aktiv"

## Step 6: Reset Button Test (1 min)

1. **Assign combatants** to phases
2. **Click "Återställ"** button in panel
3. **Check panel**

✅ **Expected:** All combatants return to "Ej aktiv"

## Troubleshooting

**Panel doesn't open?**
- Check browser console (F12) for errors
- Verify module is enabled in World Settings
- Try: `EonPhasesPanel.open()` in console

**Button not visible?**
- Make sure you're the GM
- Make sure combat is active
- Check Combat Tracker is open

**Drag & drop not working?**
- Only GMs can drag-drop
- Make sure you're logged in as GM
- Check console for errors

## Success Criteria

If all tests pass:
- ✅ Module loads without errors
- ✅ Panel opens and displays correctly
- ✅ Drag & drop works
- ✅ Round reset works
- ✅ Reset button works

**Ready for Reaction Roll feature!** 🎉

