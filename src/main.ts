/**
 * Eon IV Combat Tracker
 * 
 * A phase-based combat tracker for Eon IV in Foundry VTT.
 * Organizes combatants into Ranged, Melee, and Mystic phases.
 */

import { MODULE_ID } from "./types";

/**
 * Initialize the module
 */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Eon IV Combat Tracker`);
});

/**
 * Module is ready
 */
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Eon IV Combat Tracker ready`);
});

