# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2025-01-XX

### Changed
- Increased maximum window height to 95vh for better vertical expansion
- Improved layout efficiency with smaller buttons and compact design

### Fixed
- Engagement status now preserved when dragging combatants within the same phase
- Toggle role now only switches both combatants in exactly 2-person engagements

## [0.3.1] - 2025-01-XX

### Fixed
- Reverted to tall, narrow column layout (was accidentally made wide)
- Fixed drag-and-drop to preserve engagement when moving within same phase

## [0.3.0] - 2025-01-XX

### Added
- Token images instead of text for showing engaged combatants
- Banner-style horizontal layout (later reverted to column)

## [0.2.3] - 2025-01-XX

### Fixed
- Toggle role only switches both in exactly 2-person engagements, not in larger groups

## [0.2.2] - 2025-01-XX

### Changed
- Smaller buttons (1.6rem) for better space efficiency
- Auto-height window that adjusts to content
- Improved layout with reduced gaps and padding

### Fixed
- Joining engagement now defaults new combatant to attacker
- Toggle role switches both combatants in 2-person engagements

## [0.2.1] - 2025-01-XX

### Fixed
- Added missing `_joinEngagement` method
- Removed unnecessary Swedish text from engagement dialog

## [0.2.0] - 2025-01-XX

### Added
- Engagement dialog with radio buttons (single target selection)
- Support for joining existing engagements (team-ups like 2v1, 3v1)
- New combatants joining engagements default to attacker role

### Removed
- Reaction roll button (functionality not working, removed for now)

## [0.1.9] - 2025-01-XX

### Fixed
- Engage button visibility - added `canModify` to combatant data

## [0.1.8] - 2025-01-XX

### Added
- Engagement dialog UI for easier combatant engagement

## [0.1.7] - 2025-01-XX

### Fixed
- Reaction roll formula parsing to handle Eon system format
- Improved button clicking to use Eon system's built-in roll

## [0.1.6] - 2025-01-XX

### Fixed
- Crash when moving combatant to melee phase
- Reaction roll now uses Eon system's built-in functionality

## [0.1.5] - 2025-01-XX

### Fixed
- Button clickability - removed disabled states, buttons only visible when clickable
- Permission checks - GM can always click, non-GM only for owned tokens

## [0.1.4] - 2025-01-XX

### Added
- Auto-open panel when combat is active on page load

## [0.1.3] - 2025-01-XX

### Fixed
- Drag and drop blocking button clicks
- Auto-engagement when moving to melee phase removed

## [0.1.2] - 2025-01-XX

### Added
- Multi-combatant engagement groups (up to 5 combatants)
- Multiple distinct engagement groups support

## [0.1.1] - 2025-01-XX

### Added
- Initial release
- Phase-based combat tracker
- Drag and drop functionality
- Manual reset button (Återställ)

