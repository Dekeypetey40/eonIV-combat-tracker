# Testing Guide

This document explains how to test the Eon IV Combat Tracker module.

## Automated Tests (Vitest)

We use [Vitest](https://vitest.dev/) for unit testing the module logic.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### What's Tested

The automated tests cover:

- **`flags.ts`** - Combatant flag management
  - `getFlags()` - Reading flags with defaults
  - `setPhase()` - Setting phase assignment
  - `resetAllPhases()` - Clearing all assignments
  - `getCombatantsByPhase()` - Grouping and sorting combatants

- **`types.ts`** - Constants and configuration
  - Phase definitions
  - Swedish labels

### Test Structure

```
tests/
├── setup.ts          # Foundry API mocks
└── flags.test.ts     # Flag management tests
```

### Mocking Foundry

Since Foundry VTT APIs aren't available outside the browser, we mock them in `tests/setup.ts`:

- `MockCombatant` - Simulates a Foundry Combatant document
- `MockCombat` - Simulates a Foundry Combat encounter
- Global mocks for `game`, `Hooks`, `foundry.utils`

## Manual Testing in Foundry VTT

For full integration testing, you need to test the module in Foundry VTT.

### Setup

1. **Build the module:**
   ```bash
   npm run build
   ```

2. **Link to Foundry modules folder:**

   **Windows (PowerShell as Admin):**
   ```powershell
   $source = "C:\path\to\eon-combat-tracker"
   $target = "$env:LOCALAPPDATA\FoundryVTT\Data\modules\eon-combat-tracker"
   New-Item -ItemType SymbolicLink -Path $target -Target $source
   ```

   **Alternative: Copy files:**
   ```powershell
   Copy-Item -Path "C:\path\to\eon-combat-tracker" -Destination "$env:LOCALAPPDATA\FoundryVTT\Data\modules\eon-combat-tracker" -Recurse
   ```

3. **Enable the module** in Foundry VTT World Settings

### Test Checklist

#### Basic Functionality
- [ ] Module loads without console errors
- [ ] Button appears in Combat Tracker header (GM only)
- [ ] Clicking button opens Eon Phases panel
- [ ] Panel shows "Ingen aktiv strid" when no combat

#### With Active Combat
- [ ] All combatants appear in "Ej aktiv" column initially
- [ ] Drag combatant to "Avståndsfasen" - moves correctly
- [ ] Drag combatant to "Närstridsfasen" - moves correctly
- [ ] Drag combatant to "Mystikfasen" - moves correctly
- [ ] Reorder within a phase - maintains new order
- [ ] "Återställ" button clears all assignments

#### Round Handling
- [ ] Advance round (GM clicks "Next Round")
- [ ] All combatants reset to "Ej aktiv" column
- [ ] Previous round assignments don't persist

#### Multi-User
- [ ] Players see the panel (read-only)
- [ ] Players cannot drag-drop (GM only)
- [ ] GM changes reflect on player screens

#### Edge Cases
- [ ] Adding combatant during combat - appears in "Ej aktiv"
- [ ] Removing combatant - disappears from panel
- [ ] Defeated combatant - shows with strikethrough + skull
- [ ] Combat ends - panel closes automatically

### Debug Commands

Open browser console (F12) in Foundry:

```javascript
// Open the panel
EonPhasesPanel.open()

// Check a combatant's flags
game.combat.combatants.contents[0].getFlag("eon-combat-tracker", "phase")

// View all combatant flags
game.combat.combatants.map(c => ({
  name: c.name,
  phase: c.getFlag("eon-combat-tracker", "phase"),
  order: c.getFlag("eon-combat-tracker", "order")
}))
```

## Coverage Goals

Aim for:
- **80%+** coverage on `flags.ts` (core logic)
- **Manual testing** covers UI interactions

## Continuous Integration

The GitHub Actions workflow runs tests on every push:

```yaml
# In .github/workflows/release.yml
- name: Run tests
  run: npm test
```

This ensures tests pass before releases are created.

