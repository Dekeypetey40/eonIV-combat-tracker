/**
 * Eon IV Combat Tracker
 * 
 * A phase-based combat tracker for Eon IV in Foundry VTT.
 * Organizes combatants into Ranged, Melee, and Mystic phases.
 */

import { MODULE_ID } from "./types";
import { EonPhasesPanel, setupPanelHooks } from "./eon-phases-panel";

// Make panel accessible globally for debugging
declare global {
  interface Window {
    EonPhasesPanel: typeof EonPhasesPanel;
  }
}

/**
 * Initialize the module
 */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Eon IV Combat Tracker`);
  
  // Expose panel class globally for debugging/macros
  window.EonPhasesPanel = EonPhasesPanel;
});

/**
 * Module is ready - set up hooks
 */
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Eon IV Combat Tracker ready`);
  
  // Set up hooks for panel updates
  setupPanelHooks();
  
  // Log usage hint
  if (game.user?.isGM) {
    console.log(`${MODULE_ID} | To open the panel, run: EonPhasesPanel.open()`);
  }
});
