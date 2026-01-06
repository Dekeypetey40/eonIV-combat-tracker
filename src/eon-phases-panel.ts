/**
 * Eon Phases Panel
 * 
 * An ApplicationV2 window that displays combatants organized by phase.
 */

import { MODULE_ID, PHASES, EonPhase } from "./types";
import { getCombatantsByPhase, getFlags } from "./flags";

/**
 * The main panel for managing combat phases in Eon IV
 */
export class EonPhasesPanel extends Application {
  /** Singleton instance */
  static instance: EonPhasesPanel | null = null;

  static get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "eon-phases-panel",
      title: "Eon IV - Stridsfaser",
      template: `modules/${MODULE_ID}/templates/phases-panel.hbs`,
      classes: ["eon-phases-panel"],
      width: 700,
      height: 500,
      resizable: true,
      minimizable: true,
    }) as ApplicationOptions;
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(): EonPhasesPanel {
    if (!EonPhasesPanel.instance) {
      EonPhasesPanel.instance = new EonPhasesPanel();
    }
    return EonPhasesPanel.instance;
  }

  /**
   * Open the panel (singleton pattern)
   */
  static open(): void {
    const panel = EonPhasesPanel.getInstance();
    if (!panel.rendered) {
      panel.render(true);
    } else {
      panel.bringToTop();
    }
  }

  /**
   * Prepare data for the template
   */
  getData(): object {
    const combat = game.combat;
    
    if (!combat) {
      return {
        hasCombat: false,
        round: 0,
        phases: [],
      };
    }

    const combatantsByPhase = getCombatantsByPhase(combat);

    // Transform combatants into template-friendly format
    const phases = PHASES.map((phaseConfig) => {
      const combatants = combatantsByPhase.get(phaseConfig.id) || [];
      
      return {
        ...phaseConfig,
        combatants: combatants.map((c) => ({
          id: c.id,
          name: c.name,
          img: c.token?.texture?.src || c.actor?.img || "icons/svg/mystery-man.svg",
          defeated: c.isDefeated,
          flags: getFlags(c),
        })),
        count: combatants.length,
      };
    });

    return {
      hasCombat: true,
      round: combat.round ?? 1,
      phases,
      isGM: game.user?.isGM ?? false,
    };
  }

  /**
   * Set up event listeners after render
   */
  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Clear all button
    html.find("[data-action='clear-all']").on("click", this._onClearAll.bind(this));

    // Future: drag and drop listeners will be added here
  }

  /**
   * Handle clearing all phase assignments
   */
  async _onClearAll(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    
    const combat = game.combat;
    if (!combat || !game.user?.isGM) return;

    // Import the reset function dynamically to avoid circular deps
    const { resetAllPhases } = await import("./flags");
    await resetAllPhases(combat);
    
    this.render();
  }
}

/**
 * Re-render the panel when relevant combat data changes
 */
export function setupPanelHooks(): void {
  // Re-render when combat changes
  Hooks.on("updateCombat", () => {
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.render();
    }
  });

  // Re-render when combatants change
  Hooks.on("createCombatant", () => {
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.render();
    }
  });

  Hooks.on("deleteCombatant", () => {
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.render();
    }
  });

  Hooks.on("updateCombatant", () => {
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.render();
    }
  });

  // Close panel when combat ends
  Hooks.on("deleteCombat", () => {
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.close();
    }
  });
}

