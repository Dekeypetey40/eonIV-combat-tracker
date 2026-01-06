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
import { registerSettings, canViewPanel, canModifyPhases } from "./settings";
import { getFlags, setPhase } from "./flags";

// Make panel accessible globally for debugging and macros
declare global {
  interface Window {
    EonPhasesPanel: typeof EonPhasesPanel;
    EonDebug: {
      checkCombatants: () => void;
      moveToMelee: (combatantIds?: string[]) => Promise<void>;
      checkButtons: () => void;
    };
  }
}

/**
 * Initialize the module
 * 
 * This hook runs during Foundry's initialization phase, before the game
 * world is fully loaded. We use it to register our panel class globally.
 */
Hooks.once("init", () => {
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
  // Set up hooks for panel updates
  setupPanelHooks();
  
  // Debug: Log module version to verify new code is loaded
  console.log(`${MODULE_ID} | ========================================`);
  console.log(`${MODULE_ID} | Module loaded - Version 0.3.2`);
  console.log(`${MODULE_ID} | Updated: Increased max height, kept narrow width, engagement preserved when dragging within same phase`);
  console.log(`${MODULE_ID} | EonDebug helpers available!`);
  console.log(`${MODULE_ID} | ========================================`);
  
  // Auto-open panel if there's an active combat and user can view it
  if (game.combat && canViewPanel()) {
    // Small delay to ensure UI is fully rendered
    setTimeout(() => {
      EonPhasesPanel.open();
    }, 500);
  }
  
  // Expose debug helpers globally
  window.EonDebug = {
    /**
     * Check the current state of all combatants
     */
    checkCombatants: () => {
      const combat = game.combat;
      if (!combat) {
        console.warn(`${MODULE_ID} | No active combat`);
        return;
      }
      
      console.log(`${MODULE_ID} | Combatant States:`, 
        Array.from(combat.combatants).map(c => {
          const flags = getFlags(c);
          return {
            id: c.id,
            name: c.name,
            phase: flags.phase,
            order: flags.order,
            meleeRole: flags.meleeRole,
            engagedWith: flags.engagedWith,
            reactionRoll: flags.reactionRoll,
          };
        })
      );
    },
    
    /**
     * Move combatants to melee phase for testing
     * If no IDs provided, moves all combatants to melee
     */
    moveToMelee: async (combatantIds?: string[]) => {
      const combat = game.combat;
      if (!combat) {
        console.warn(`${MODULE_ID} | No active combat`);
        return;
      }
      
      const targets = combatantIds 
        ? combatantIds.map(id => combat.combatants.get(id)).filter(Boolean) as Combatant[]
        : Array.from(combat.combatants);
      
      if (targets.length === 0) {
        console.warn(`${MODULE_ID} | No valid combatants found`);
        return;
      }
      
      console.log(`${MODULE_ID} | Moving ${targets.length} combatants to melee phase...`);
      
      for (let i = 0; i < targets.length; i++) {
        const combatant = targets[i];
        await setPhase(combatant, "melee", (i + 1) * 1000, combat.round ?? 1);
        console.log(`${MODULE_ID} | Moved ${combatant.name} to melee phase`);
      }
      
      // Re-render panel if open
      if (EonPhasesPanel.instance?.rendered) {
        EonPhasesPanel.instance.render();
      }
      
      console.log(`${MODULE_ID} | Done! Use EonDebug.checkCombatants() to verify`);
    },
    
    /**
     * Check button visibility in the rendered panel
     */
    checkButtons: () => {
      if (!EonPhasesPanel.instance?.rendered) {
        console.warn(`${MODULE_ID} | Panel is not open. Open it first with EonPhasesPanel.open()`);
        return;
      }
      
      const html = EonPhasesPanel.instance.element;
      const reactionButtons = html.find("[data-action='roll-reaction']");
      const engageButtons = html.find("[data-action='engage']");
      const disengageButtons = html.find("[data-action='disengage']");
      const toggleRoleButtons = html.find("[data-action='toggle-role']");
      const meleeCombatants = html.find(".eon-combatant-row[data-phase='melee']");
      
      console.log(`${MODULE_ID} | Button Visibility Check:`, {
        reactionButtons: {
          total: reactionButtons.length,
          visible: reactionButtons.filter((_i, el) => $(el).is(":visible")).length,
          disabled: reactionButtons.filter((_i, el) => $(el).prop("disabled")).length,
        },
        engageButtons: {
          total: engageButtons.length,
          visible: engageButtons.filter((_i, el) => $(el).is(":visible")).length,
        },
        disengageButtons: {
          total: disengageButtons.length,
          visible: disengageButtons.filter((_i, el) => $(el).is(":visible")).length,
        },
        toggleRoleButtons: {
          total: toggleRoleButtons.length,
          visible: toggleRoleButtons.filter((_i, el) => $(el).is(":visible")).length,
        },
        meleeCombatants: meleeCombatants.length,
        canModify: canModifyPhases(),
      });
      
      // Log each melee combatant's button state
      meleeCombatants.each((_index, element) => {
        const $row = $(element);
        const combatantId = $row.data("combatant-id");
        const combatantName = $row.find(".eon-combatant-name").text();
        const hasEngageBtn = $row.find(".eon-engage-btn").length > 0;
        const hasDisengageBtn = $row.find(".eon-disengage-btn").length > 0;
        const hasToggleRoleBtn = $row.find(".eon-toggle-role-btn").length > 0;
        const hasReactionBtn = $row.find(".eon-roll-reaction-btn").length > 0;
        
        console.log(`${MODULE_ID} | ${combatantName} (${combatantId}):`, {
          hasReactionBtn,
          hasEngageBtn,
          hasDisengageBtn,
          hasToggleRoleBtn,
          isMelee: $row.data("phase") === "melee",
        });
      });
    },
  };
  
  console.log(`${MODULE_ID} | Debug helpers available! Use:`);
  console.log(`  - EonDebug.checkCombatants() - Check all combatant states`);
  console.log(`  - EonDebug.moveToMelee() - Move all combatants to melee phase`);
  console.log(`  - EonDebug.moveToMelee(['id1', 'id2']) - Move specific combatants`);
  console.log(`  - EonDebug.checkButtons() - Check button visibility in panel`);
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
    return;
  }
  
  // Only add if there's an active combat
  if (!game.combat) {
    return;
  }
  
  // Convert html to jQuery if it's not already
  const $html = html instanceof jQuery ? html : $(html);
  
  // Check if button already exists (prevent duplicates on re-render)
  if ($html.find("#eon-phases-button").length > 0) {
    return;
  }
  
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
    } else {
      // Fallback: add directly to header
      header.append(button);
    }
  } else {
    // Last resort: add to the top of the combat tracker
    const tracker = $html.find(".combat-tracker, .sidebar-tab");
    if (tracker.length) {
      tracker.prepend(button);
    }
  }
});
