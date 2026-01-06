/**
 * Eon IV Combat Tracker
 * 
 * A phase-based combat tracker for Eon IV in Foundry VTT.
 * Organizes combatants into Ranged, Melee, and Mystic phases.
 * 
 * @module eon-combat-tracker
 * @author Dekeypetey40
 * @license MIT
 * @see {@link https://github.com/Dekeypetey40/eonIV-combat-tracker}
 */

import { MODULE_ID } from "./types";
import { EonPhasesPanel, setupPanelHooks } from "./eon-phases-panel";
import { registerSettings, canViewPanel } from "./settings";

// Make panel accessible globally for debugging and macros
declare global {
  interface Window {
    EonPhasesPanel: typeof EonPhasesPanel;
  }
}

/**
 * Initialize the module
 * 
 * This hook runs during Foundry's initialization phase, before the game
 * world is fully loaded. We use it to register our panel class globally.
 */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Eon IV Combat Tracker`);
  
  // Register module settings
  registerSettings();
  
  // Expose panel class globally for debugging/macros
  // Users can open the panel with: EonPhasesPanel.open()
  window.EonPhasesPanel = EonPhasesPanel;
});

/**
 * Module is ready - set up hooks and UI integration
 * 
 * This hook runs after the game world is fully loaded and ready.
 * We use it to set up our combat hooks and add UI elements.
 */
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Eon IV Combat Tracker ready`);
  
  // Set up hooks for panel updates and round resets
  setupPanelHooks();
  
  // Log usage hint for GMs
  if (game.user?.isGM) {
    console.log(`${MODULE_ID} | To open the panel, run: EonPhasesPanel.open()`);
    console.log(`${MODULE_ID} | Or use the button in the Combat Tracker header`);
  }
});

/**
 * Add a button to the Combat Tracker header
 * 
 * This hook fires when the Combat Tracker sidebar tab renders.
 * We inject a button that opens our Eon Phases panel.
 */
Hooks.on("renderCombatTracker", (app: Application, html: JQuery | HTMLElement) => {
  // Check if user can view the panel (based on settings)
  if (!canViewPanel()) {
    console.log(`${MODULE_ID} | Skipping button - user cannot view panel`);
    return;
  }
  
  // Only add if there's an active combat
  if (!game.combat) {
    console.log(`${MODULE_ID} | Skipping button - no active combat`);
    return;
  }
  
  // Convert html to jQuery if it's not already
  const $html = html instanceof jQuery ? html : $(html);
  
  // Check if button already exists (prevent duplicates on re-render)
  if ($html.find("#eon-phases-button").length > 0) {
    return;
  }
  
  console.log(`${MODULE_ID} | Adding button to Combat Tracker`);
  
  // Create the button
  const button = $(`
    <a id="eon-phases-button" 
       class="combat-control" 
       title="Öppna Eon IV Stridsfaser"
       data-tooltip="Eon IV Stridsfaser">
      <i class="fas fa-layer-group"></i>
    </a>
  `);
  
  // Add click handler
  button.on("click", (event) => {
    event.preventDefault();
    EonPhasesPanel.open();
  });
  
  // Insert the button into the combat tracker header
  // Try multiple selectors for compatibility with different Foundry versions
  const header = $html.find(".combat-tracker-header, .combat-header");
  
  if (header.length) {
    // Try to find encounter controls first
    const controls = header.find(".encounter-controls, .combat-controls");
    if (controls.length) {
      controls.append(button);
      console.log(`${MODULE_ID} | Button added to encounter controls`);
    } else {
      // Fallback: add directly to header
      header.append(button);
      console.log(`${MODULE_ID} | Button added to header`);
    }
  } else {
    // Last resort: add to the top of the combat tracker
    const tracker = $html.find(".combat-tracker, .sidebar-tab");
    if (tracker.length) {
      tracker.prepend(button);
      console.log(`${MODULE_ID} | Button added to combat tracker (fallback)`);
    } else {
      console.warn(`${MODULE_ID} | Could not find Combat Tracker element to add button`);
    }
  }
});
