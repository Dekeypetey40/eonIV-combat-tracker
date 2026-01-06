/**
 * Module Settings
 * 
 * Handles Foundry VTT module settings for Eon IV Combat Tracker.
 */

import { MODULE_ID } from "./types";

/**
 * Register module settings
 */
export function registerSettings(): void {
  // Setting: GM Only Mode
  game.settings.register(MODULE_ID, "gmOnly", {
    name: "GM Only Mode",
    hint: "If enabled, only GMs can view and modify the combat tracker. If disabled, all players can use it.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false, // Default: everyone can use it
  });
}

/**
 * Check if the current user can view the panel
 */
export function canViewPanel(): boolean {
  const gmOnly = game.settings.get(MODULE_ID, "gmOnly") as boolean;
  return !gmOnly || (game.user?.isGM ?? false);
}

/**
 * Check if the current user can modify phase assignments
 */
export function canModifyPhases(): boolean {
  const gmOnly = game.settings.get(MODULE_ID, "gmOnly") as boolean;
  return !gmOnly || (game.user?.isGM ?? false);
}

