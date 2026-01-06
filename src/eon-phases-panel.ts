/**
 * Eon Phases Panel
 * 
 * An ApplicationV2 window that displays combatants organized by phase.
 * Supports drag-and-drop for reordering and phase assignment.
 */

import { MODULE_ID, PHASES, EonPhase } from "./types";
import { getCombatantsByPhase, getFlags, setPhase, resetAllPhases } from "./flags";
import { canViewPanel, canModifyPhases } from "./settings";
import { rollReaction, rollReactionForPhase } from "./reaction-roll";

/**
 * The main panel for managing combat phases in Eon IV
 */
export class EonPhasesPanel extends Application {
  /** Singleton instance */
  static instance: EonPhasesPanel | null = null;
  
  /** Drag and drop controller */
  private _dragDrop: DragDrop[] = [];

  static get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "eon-phases-panel",
      title: "Eon IV - Stridsfaser",
      template: `modules/${MODULE_ID}/templates/phases-panel.hbs`,
      classes: ["eon-phases-panel"],
      width: 400,
      height: 600,
      resizable: true,
      minimizable: true,
      dragDrop: [
        {
          dragSelector: ".eon-combatant-row",
          dropSelector: ".eon-combatant-list",
        },
      ],
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

    // Get round number - Foundry stores it in combat.round
    // Round can be null/undefined before combat starts, or 0-based in some cases
    let roundNumber: number;
    const rawRound = combat.round;
    
    if (typeof rawRound === "number" && !isNaN(rawRound) && isFinite(rawRound)) {
      // Foundry v13: round is 0-based, so add 1 for display
      // But some systems might already be 1-based, so check if it's 0
      roundNumber = rawRound === 0 ? 1 : rawRound;
    } else {
      // Fallback: if round is null/undefined/NaN, default to 1
      roundNumber = 1;
    }
    
    // Ensure it's a valid integer - use parseInt to ensure it's a primitive number
    roundNumber = Math.max(1, Math.floor(roundNumber));
    
    // Force to primitive number (not Number object)
    const roundDisplay = parseInt(String(roundNumber), 10);
    
    // Final validation - if somehow still invalid, default to 1
    const finalRound = (isNaN(roundDisplay) || !isFinite(roundDisplay)) ? 1 : roundDisplay;
    
    // Debug logging
    console.log(`${MODULE_ID} | Combat round value:`, rawRound, "→ Calculated:", roundNumber, "→ Final:", finalRound, "Type:", typeof finalRound);

    return {
      hasCombat: true,
      round: finalRound,
      phases,
      isGM: game.user?.isGM ?? false,
      canModify: canModifyPhases(),
    };
  }

  /**
   * Set up event listeners after render
   */
  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Fix any NaN display issues in the round number
    const roundElement = html.find("h2");
    if (roundElement.length) {
      const roundText = roundElement.text();
      if (roundText.includes("NaN") || roundText.includes("NAN")) {
        const combat = game.combat;
        const round = combat?.round ?? 1;
        const displayRound = (typeof round === "number" && !isNaN(round)) ? round : 1;
        roundElement.text(`Runda ${displayRound}`);
        console.log(`${MODULE_ID} | Fixed NaN in round display, set to:`, displayRound);
      }
    }

    // Clear all button
    html.find("[data-action='clear-all']").on("click", this._onClearAll.bind(this));

    // Collapsible phase sections
    html.find("[data-action='toggle-phase']").on("click", (event) => {
      event.stopPropagation();
      const toggle = $(event.currentTarget);
      const section = toggle.closest(".eon-phase-section");
      section.toggleClass("collapsed");
    });

    // Reaction roll buttons
    html.find("[data-action='roll-reaction']").on("click", this._onRollReaction.bind(this));
    html.find("[data-action='roll-phase-reaction']").on("click", this._onRollPhaseReaction.bind(this));
    
    // Hide phase reaction button if only 0-1 combatants
    html.find(".eon-roll-phase-btn").each((_index, element) => {
      const btn = $(element);
      const count = parseInt(btn.data("count") || "0", 10);
      if (count <= 1) {
        btn.hide();
      }
    });

    // Check if user can modify (based on settings)
    if (!canModifyPhases()) return;

    // Attach drag handlers to combatant rows
    html.find(".eon-combatant-row[draggable='true']").each((_index, element) => {
      const row = element as HTMLElement;
      row.addEventListener("dragstart", this._onDragStart.bind(this));
    });

    // Attach drop zone handlers to phase lists
    html.find(".eon-combatant-list").each((_index, element) => {
      const list = element as HTMLElement;
      list.addEventListener("dragover", this._onDragOver.bind(this));
      list.addEventListener("dragleave", this._onDragLeave.bind(this));
      list.addEventListener("drop", this._onDrop.bind(this));
    });
  }

  /**
   * Handle the start of a drag event
   */
  _onDragStart(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const combatantId = target.dataset.combatantId;
    
    if (!combatantId) {
      event.preventDefault();
      return;
    }

    // Set drag data
    const dragData = {
      type: "Combatant",
      combatantId: combatantId,
    };

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
    
    // Add visual feedback
    target.classList.add("dragging");
    
    console.log(`${MODULE_ID} | Started dragging combatant: ${combatantId}`);
  }

  /**
   * Handle drag over event (for visual feedback)
   */
  _onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    
    const target = event.currentTarget as HTMLElement;
    target.classList.add("drag-over");
  }

  /**
   * Handle drag leave event
   */
  _onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    // Only remove if we're actually leaving the element (not just moving to a child)
    const rect = target.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      target.classList.remove("drag-over");
    }
  }

  /**
   * Handle drop event
   */
  async _onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove visual feedback
    const dropTarget = event.currentTarget as HTMLElement;
    dropTarget.classList.remove("drag-over");
    
    // Check if user can modify (based on settings)
    if (!canModifyPhases()) {
      console.warn(`${MODULE_ID} | User cannot modify phase assignments`);
      return;
    }
    
    // Get combat
    const combat = game.combat;
    if (!combat) {
      console.warn(`${MODULE_ID} | No active combat`);
      return;
    }

    // Parse drag data
    let dragData;
    try {
      const data = event.dataTransfer?.getData("text/plain");
      if (!data) {
        console.warn(`${MODULE_ID} | No drag data found`);
        return;
      }
      dragData = JSON.parse(data);
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to parse drag data:`, error);
      return;
    }

    if (dragData.type !== "Combatant" || !dragData.combatantId) {
      console.warn(`${MODULE_ID} | Invalid drag data type`);
      return;
    }

    // Get the combatant being dragged
    const combatant = combat.combatants.get(dragData.combatantId);
    if (!combatant) {
      console.warn(`${MODULE_ID} | Combatant not found: ${dragData.combatantId}`);
      return;
    }

    // Get target phase from drop zone
    const targetPhase = dropTarget.dataset.phase as EonPhase;
    if (!targetPhase) {
      console.warn(`${MODULE_ID} | No phase data on drop target`);
      return;
    }

    console.log(`${MODULE_ID} | Moving ${combatant.name} to ${targetPhase} phase`);

    // Calculate new order based on drop position
    const order = this._calculateDropOrder(event, dropTarget, targetPhase);

    // Update the combatant's flags
    await setPhase(combatant, targetPhase, order, combat.round ?? 1);

    // Remove dragging class from source
    document.querySelectorAll(".dragging").forEach((el) => {
      el.classList.remove("dragging");
    });

    // Re-render the panel to show the update
    this.render();
  }

  /**
   * Calculate the order value for a dropped combatant
   */
  private _calculateDropOrder(
    event: DragEvent,
    dropTarget: HTMLElement,
    targetPhase: EonPhase
  ): number {
    const combat = game.combat;
    if (!combat) return 0;

    // Get all combatants currently in the target phase
    const combatantsByPhase = getCombatantsByPhase(combat);
    const phaseList = combatantsByPhase.get(targetPhase) || [];
    
    if (phaseList.length === 0) {
      return 1000; // First item
    }

    // Find the element we're dropping on/near
    const dropY = event.clientY;
    const rows = dropTarget.querySelectorAll(".eon-combatant-row");
    
    let insertIndex = phaseList.length; // Default to end
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as HTMLElement;
      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (dropY < midpoint) {
        insertIndex = i;
        break;
      }
    }

    // Calculate order value between neighbors
    const prevOrder = insertIndex > 0 
      ? getFlags(phaseList[insertIndex - 1]).order 
      : 0;
    const nextOrder = insertIndex < phaseList.length 
      ? getFlags(phaseList[insertIndex]).order 
      : prevOrder + 2000;

    return (prevOrder + nextOrder) / 2;
  }

  /**
   * Handle clearing all phase assignments
   */
  async _onClearAll(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    
    const combat = game.combat;
    if (!combat || !canModifyPhases()) return;

    await resetAllPhases(combat);
    this.render();
  }

  /**
   * Handle rolling Reaction for a single combatant
   */
  async _onRollReaction(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    if (!canModifyPhases()) {
      ui.notifications.warn("You don't have permission to roll reactions");
      return;
    }

    const combatantId = $(event.currentTarget).data("combatant-id");
    const combat = game.combat;
    if (!combat || !combatantId) return;

    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    await rollReaction(combatant);
    // Re-render to show any updates
    this.render();
  }

  /**
   * Handle rolling Reaction for all combatants in a phase
   */
  async _onRollPhaseReaction(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    if (!canModifyPhases()) {
      ui.notifications.warn("You don't have permission to roll reactions");
      return;
    }

    const phase = $(event.currentTarget).data("phase") as EonPhase;
    const combat = game.combat;
    if (!combat || !phase) return;

    await rollReactionForPhase(combat, phase);
    // Re-render to show sorted order
    this.render();
  }
}

/**
 * Re-render the panel when relevant combat data changes
 */
export function setupPanelHooks(): void {
  // Track the last known round to detect round changes
  let lastKnownRound = 0;

  // Re-render when combat changes and reset phases on new round
  Hooks.on("updateCombat", (combat: Combat, change: object) => {
    // Check if round changed
    if ("round" in change && combat.round !== lastKnownRound) {
      const newRound = combat.round ?? 1;
      
      // Only reset on round increase (not on going back)
      if (newRound > lastKnownRound && game.user?.isGM) {
        console.log(`${MODULE_ID} | New round ${newRound} - resetting phase assignments`);
        resetAllPhases(combat);
      }
      
      lastKnownRound = newRound;
    }

    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.render();
    }
  });

  // Initialize lastKnownRound when combat starts
  Hooks.on("createCombat", (combat: Combat) => {
    lastKnownRound = combat.round ?? 0;
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
    lastKnownRound = 0;
    if (EonPhasesPanel.instance?.rendered) {
      EonPhasesPanel.instance.close();
    }
  });
}
