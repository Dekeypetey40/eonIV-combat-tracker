/**
 * Eon Phases Panel
 * 
 * An ApplicationV2 window that displays combatants organized by phase.
 * Supports drag-and-drop for reordering and phase assignment.
 */

import { MODULE_ID, PHASES, EonPhase } from "./types";
import { getCombatantsByPhase, getFlags, setPhase } from "./flags";

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
      width: 700,
      height: 500,
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
  }

  /**
   * Handle the start of a drag event
   */
  _onDragStart(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const combatantId = target.dataset.combatantId;
    
    if (!combatantId) return;

    // Set drag data
    const dragData = {
      type: "Combatant",
      combatantId: combatantId,
    };

    event.dataTransfer?.setData("text/plain", JSON.stringify(dragData));
    
    // Add visual feedback
    target.classList.add("dragging");
  }

  /**
   * Handle drag over event (for visual feedback)
   */
  _onDragOver(event: DragEvent): void {
    event.preventDefault();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.add("drag-over");
  }

  /**
   * Handle drag leave event
   */
  _onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove("drag-over");
  }

  /**
   * Handle drop event
   */
  async _onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    
    // Remove visual feedback
    const dropTarget = event.currentTarget as HTMLElement;
    dropTarget.classList.remove("drag-over");
    
    // Only GMs can modify
    if (!game.user?.isGM) return;
    
    // Get combat
    const combat = game.combat;
    if (!combat) return;

    // Parse drag data
    let dragData;
    try {
      const data = event.dataTransfer?.getData("text/plain");
      if (!data) return;
      dragData = JSON.parse(data);
    } catch {
      return;
    }

    if (dragData.type !== "Combatant" || !dragData.combatantId) return;

    // Get the combatant being dragged
    const combatant = combat.combatants.get(dragData.combatantId);
    if (!combatant) return;

    // Get target phase from drop zone
    const targetPhase = dropTarget.dataset.phase as EonPhase;
    if (!targetPhase) return;

    // Calculate new order based on drop position
    const order = this._calculateDropOrder(event, dropTarget, targetPhase);

    // Update the combatant's flags
    await setPhase(combatant, targetPhase, order, combat.round ?? 1);

    // Remove dragging class from source
    document.querySelectorAll(".dragging").forEach((el) => {
      el.classList.remove("dragging");
    });
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
