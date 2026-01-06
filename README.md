# Eon IV Combat Tracker

A Foundry VTT module that provides a phase-based combat tracker for the Swedish RPG **Eon IV**.

## Features

- **Phase-based combat**: Displays combatants organized into three phases:
  - **Ranged Phase** (Avståndsfasen)
  - **Melee Phase** (Närstridsfasen)
  - **Mystic Phase** (Mystikfasen)
- **Drag and drop**: GMs can drag combatants between phases and reorder within phases
- **Round reset**: Phase assignments automatically reset each new round

## Requirements

- Foundry VTT v13+
- [Eon RPG System](https://foundryvtt.com/packages/eon-rpg)

## Installation

### Method 1: Manifest URL (Recommended)
1. In Foundry VTT, go to **Add-on Modules** → **Install Module**
2. Paste this manifest URL:
   ```
   https://github.com/Dekeypetey40/eonIV-combat-tracker/releases/latest/download/module.json
   ```
3. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from [Releases](https://github.com/Dekeypetey40/eonIV-combat-tracker/releases)
2. Extract to `{userData}/Data/modules/eon-combat-tracker/`
3. Restart Foundry VTT

## Usage

1. Start a combat encounter in an Eon IV world
2. Click the **Eon Phases** button in the Combat Tracker header
3. Drag combatants to their chosen phase
4. Reorder within phases as needed

## Development

```bash
# Install dependencies
npm install

# Build (one-time)
npm run build

# Build with watch mode
npm run dev
```

## License

MIT License - See [LICENSE](LICENSE)

## Credits

- **Eon IV** is a trademark of Helmgast AB
- Built for use with the [Eon RPG System](https://github.com/JohanFalt/Foundry_EON-RPG) for Foundry VTT

