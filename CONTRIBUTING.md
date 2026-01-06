# Contributing to Eon IV Combat Tracker

Thank you for your interest in contributing to the Eon IV Combat Tracker! This document provides guidelines for contributing to this Foundry VTT module.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Foundry VTT](https://foundryvtt.com/) (v13+)
- [Eon RPG System](https://foundryvtt.com/packages/eon-rpg) installed in your Foundry instance

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Dekeypetey40/eonIV-combat-tracker.git
   cd eonIV-combat-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the module**

   ```bash
   npm run build
   ```

4. **Link to Foundry** (for development)

   Create a symbolic link from your Foundry modules folder to this project:

   **Windows (PowerShell as Admin):**

   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\Users\<YOU>\AppData\Local\FoundryVTT\Data\modules\eon-combat-tracker" -Target "C:\path\to\eonIV-combat-tracker"
   ```

   **macOS/Linux:**

   ```bash
   ln -s /path/to/eonIV-combat-tracker ~/.local/share/FoundryVTT/Data/modules/eon-combat-tracker
   ```

5. **Start development build** (watches for changes)
   ```bash
   npm run dev
   ```

## Project Structure

```
eon-combat-tracker/
├── src/                    # TypeScript source files
│   ├── main.ts            # Entry point, hooks registration
│   ├── eon-phases-panel.ts # Main ApplicationV2 panel class
│   ├── flags.ts           # Combatant flag management
│   └── types.ts           # TypeScript interfaces and constants
├── templates/             # Handlebars templates
│   └── phases-panel.hbs   # Panel UI template
├── styles/                # CSS stylesheets
│   └── eon-combat-tracker.css
├── dist/                  # Built output (gitignored)
├── module.json            # Foundry manifest
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

## Code Style

- **TypeScript**: Use strict typing wherever possible
- **Comments**: Document all public functions with JSDoc comments
- **Naming**: Use camelCase for variables/functions, PascalCase for classes
- **Foundry APIs**: Prefer official Foundry APIs over workarounds

## Making Changes

1. **Create a branch** for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test them in Foundry

3. **Commit with clear messages**:

   ```bash
   git commit -m "Add feature: description of what you added"
   ```

4. **Push and create a Pull Request**

## Testing

Before submitting a PR, please test:

1. ✅ Module loads without errors in Foundry v13
2. ✅ Panel opens from Combat Tracker button
3. ✅ Drag and drop works for phase assignment
4. ✅ Phase assignments persist across rounds (no automatic reset)
5. ✅ Reset button clears all assignments
6. ✅ Engagement status preserved when dragging within same phase
7. ✅ Works with multiple combatants
8. ✅ All players can modify by default (GM-only mode is optional setting)

## Reporting Issues

When reporting bugs, please include:

- Foundry VTT version
- Eon RPG system version
- Browser and version
- Console errors (F12 → Console tab)
- Steps to reproduce

## Feature Requests

Feature ideas are welcome! Please open an issue describing:

- What problem does this solve?
- How would you expect it to work?
- Any relevant Eon IV rules references

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Credits

- **Eon IV** is a trademark of Helmgast AB
- This module is a fan project and is not affiliated with Helmgast AB
