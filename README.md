# Eon IV Combat Tracker

[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v13-green)](https://foundryvtt.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Foundry VTT module that provides a **phase-based combat tracker** for the Swedish tabletop RPG **Eon IV**.

![Eon IV Combat Tracker Preview](https://via.placeholder.com/700x400?text=Screenshot+Coming+Soon)

## Overview

Eon IV uses a unique combat system where each round is divided into three phases:

- **Avståndsfasen** (Ranged Phase) - Ranged attacks with bows, crossbows, thrown weapons
- **Närstridsfasen** (Melee Phase) - Melee combat and movement
- **Mystikfasen** (Mystic Phase) - Channeling prayers and mystical abilities

This module provides a dedicated UI panel for managing these phases, allowing the GM to easily organize combatants and track turn order within each phase.

## Features

### ✅ Phase-Based Display
Tall, narrow column layout showing all three combat phases plus an "Ej aktiv" (Not Acting) column for combatants who haven't chosen a phase yet.

### ✅ Drag and Drop
- Drag combatants between phases
- Reorder within phases to establish turn order
- **Engagement status preserved** when dragging within the same phase

### ✅ Automatic Round Reset
When advancing to a new round, all combatants automatically reset to "Not Acting" - matching Eon IV's rule that phase selection happens each round.

### ✅ Combat Tracker Integration
- Opens directly from a button in Foundry's Combat Tracker sidebar
- Auto-opens when combat starts (if enabled)

### ✅ Melee Engagement System
- **Engage Combatants**: Dialog-based engagement system for melee combat
- **Attacker/Defender Roles**: Automatic role assignment based on reaction rolls
- **Team Engagements**: Support for multiple combatants engaging together (e.g., 2v1, 3v1)
- **Visual Indicators**: Token images show who's engaged with whom
- **Role Toggle**: Switch attacker/defender roles (switches both in 1v1 engagements)
- **Join Existing Engagements**: New combatants can join ongoing melee engagements

## Requirements

- **Foundry VTT** v13 or higher
- **[Eon RPG System](https://foundryvtt.com/packages/eon-rpg)** by JohanFalt

## Installation

### Method 1: Foundry Package Browser (Recommended)
1. In Foundry VTT, go to **Add-on Modules** → **Install Module**
2. Search for "Eon IV Combat Tracker"
3. Click **Install**

### Method 2: Manifest URL
1. In Foundry VTT, go to **Add-on Modules** → **Install Module**
2. Paste this manifest URL in the "Manifest URL" field:
   ```
   https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json
   ```
3. Click **Install**

### Method 3: Manual Installation
1. Download the latest release ZIP from [Releases](https://github.com/Dekeypetey40/eonIV-combat-tracker/releases)
2. Extract to `{FoundryData}/Data/modules/eon-combat-tracker/`
3. Restart Foundry VTT

## Usage

### Opening the Panel
1. Start a combat encounter in an Eon IV world
2. Look for the **layers icon** (☰) in the Combat Tracker header
3. Click it to open the Eon Phases panel

**Alternative:** Open the browser console (F12) and run:
```javascript
EonPhasesPanel.open()
```

### Managing Phases
1. All combatants start in the "Ej aktiv" column
2. **Drag combatants** to their chosen phase column
3. **Reorder** within a phase by dragging up/down
4. Click **Återställ** (Reset) to clear all assignments
5. Advancing the round automatically resets all assignments

### Keyboard Shortcut (Optional)
You can create a macro with this script:
```javascript
EonPhasesPanel.open()
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/Dekeypetey40/eonIV-combat-tracker.git
cd eonIV-combat-tracker

# Install dependencies
npm install

# Build (one-time)
npm run build

# Build with watch mode (for development)
npm run dev

# Type check
npm run typecheck
```

### Tech Stack
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tooling
- **Handlebars** - Native Foundry templating
- **Foundry VTT v13 API** - Application class, DragDrop, Hooks

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits & Acknowledgments

- **[Eon IV](https://eonrpg.se/)** - Tabletop RPG by Helmgast AB
- **[Eon RPG System](https://github.com/JohanFalt/Foundry_EON-RPG)** - Foundry system by JohanFalt
- **[Foundry VTT](https://foundryvtt.com/)** - Virtual tabletop platform

### Disclaimer
This is an unofficial fan-made module. **Eon** is a trademark of Helmgast AB. This module is not affiliated with or endorsed by Helmgast AB.

---

*Lycka till i striden!* (Good luck in battle!)
