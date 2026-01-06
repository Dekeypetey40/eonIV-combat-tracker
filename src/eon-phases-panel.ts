/**
 * Eon Phases Panel
 * 
 * An ApplicationV2 window that displays combatants organized by phase.
 * Supports drag-and-drop for reordering and phase assignment.
 */

import { MODULE_ID, PHASES, EonPhase } from "./types";
import { getCombatantsByPhase, getFlags, setPhase, resetAllPhases } from "./flags";
import { canViewPanel, canModifyPhases } from "./settings";
import { rollReactionForCombatant } from "./reaction-roll";

/**
 * The main panel for managing combat phases in Eon IV
 */
export class EonPhasesPanel extends Application {
  /** Singleton instance */
  static instance: EonPhasesPanel | null = null;
  
  /** Drag and drop controller */
  protected _dragDrop: DragDrop[] = [];

  static get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "eon-phases-panel",
      title: "Eon IV - Stridsfaser",
      template: `modules/${MODULE_ID}/templates/phases-panel.hbs`,
      classes: ["eon-phases-panel"],
      width: 350,
      height: "auto",
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
    const combat = (game as Game).combat;
    
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
      let combatants = combatantsByPhase.get(phaseConfig.id) || [];
      
      // For melee phase, group engaged combatants together
      if (phaseConfig.id === "melee") {
        combatants = this._sortMeleeCombatants(combatants);
      }
      
      return {
        ...phaseConfig,
        combatants: combatants.map((c) => {
          const flags = getFlags(c);
          // Find engagement group members
          let engagementGroupMembers: string[] = [];
          let engagedWithName: string | null = null;
          
          let engagementGroupMemberImages: Array<{ id: string; name: string; img: string }> = [];
          
          if (flags.engagementGroup) {
            // Get all combatants in the same engagement group with their images
            const combatantsByPhase = getCombatantsByPhase(combat);
            const meleeCombatants = combatantsByPhase.get("melee") || [];
            engagementGroupMemberImages = meleeCombatants
              .filter(other => {
                const otherFlags = getFlags(other);
                return otherFlags.engagementGroup === flags.engagementGroup && other.id !== c.id;
              })
              .map(other => {
                const tokenImg = (other.token as any)?.img || (other.token as any)?.texture?.src;
                return {
                  id: other.id || "",
                  name: other.name || "",
                  img: tokenImg || other.actor?.img || "icons/svg/mystery-man.svg",
                };
              })
              .filter(m => m.id !== ""); // Filter out any with null/empty id
            // Keep text list for backward compatibility
            engagementGroupMembers = engagementGroupMemberImages.map(m => m.name);
          } else if (flags.engagedWith) {
            // Backward compatibility: show old engagedWith
            const engagedCombatant = combat.combatants.get(flags.engagedWith);
            engagedWithName = engagedCombatant?.name ?? null;
          }
          
          // Check if current user can interact with this combatant
          // GM can always interact, non-GM can only interact with owned tokens
          const gameUser = (game as Game).user;
          const isGM = gameUser?.isGM ?? false;
          const isOwner = c.actor?.testUserPermission(gameUser!, "OWNER") ?? false;
          const canInteract = isGM || isOwner;
          
          const tokenImg = (c.token as any)?.img || (c.token as any)?.texture?.src;
          
          return {
            id: c.id,
            name: c.name,
            img: tokenImg || c.actor?.img || "icons/svg/mystery-man.svg",
            defeated: c.isDefeated,
            flags: flags,
            meleeRole: flags.meleeRole,
            isAttacker: flags.meleeRole === "attacker",
            isDefender: flags.meleeRole === "defender",
            reactionRoll: flags.reactionRoll,
            engagedWith: flags.engagedWith,
            engagedWithName: engagedWithName,
            engagementGroup: flags.engagementGroup,
            engagementGroupMembers: engagementGroupMembers,
            engagementGroupMemberImages: engagementGroupMemberImages,
            phase: phaseConfig.id,
            isMelee: phaseConfig.id === "melee", // Add explicit flag for template
            canInteract: canInteract, // Can this user interact with this combatant?
            canModify: canModifyPhases(), // Add canModify to each combatant for template access
          };
        }),
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

    const canModify = canModifyPhases();
    
    // Panel data prepared
    
    // Add canModify to each phase for easier template access
    const phasesWithModify = phases.map(phase => ({
      ...phase,
      canModify, // Add canModify to phase level for ../canModify to work
    }));
    
    const gameUser = (game as Game).user;
    return {
      hasCombat: true,
      round: finalRound,
      phases: phasesWithModify,
      isGM: gameUser?.isGM ?? false,
      canModify,
    };
  }

  /**
   * Set up event listeners after render
   */
  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    
    // Event listeners set up

    // Fix any NaN display issues in the round number
    const roundElement = html.find("h2");
    if (roundElement.length) {
      const roundText = roundElement.text();
      if (roundText.includes("NaN") || roundText.includes("NAN")) {
        const combat = (game as Game).combat;
        const round = combat?.round ?? 1;
        const displayRound = (typeof round === "number" && !isNaN(round)) ? round : 1;
        roundElement.text(`Runda ${displayRound}`);
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

    // Reaction roll buttons (individual only)
    // Reaction roll buttons removed
    
    // Toggle attacker/defender buttons (melee only)
    html.find("[data-action='toggle-role']").on("click", this._onToggleRole.bind(this));
    
    // Engage/disengage buttons (melee only)
    html.find("[data-action='engage']").on("click", this._onEngage.bind(this));
    html.find("[data-action='disengage']").on("click", this._onDisengage.bind(this));
    

    // Check if user can modify (based on settings)
    if (!canModifyPhases()) return;

    // Attach drag handlers to combatant rows
    // But prevent drag when clicking on buttons or controls
    html.find(".eon-combatant-row[draggable='true']").each((_index, element) => {
      const row = element as HTMLElement;
      
      // Prevent drag when clicking on buttons or controls
      row.addEventListener("mousedown", (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, .eon-combatant-controls")) {
          // Temporarily disable dragging on the row
          row.draggable = false;
          // Re-enable after a short delay
          setTimeout(() => {
            row.draggable = true;
          }, 100);
        }
      });
      
      row.addEventListener("dragstart", (event: DragEvent) => {
        // Don't start drag if clicking on a button or control
        const target = event.target as HTMLElement;
        if (target.closest("button, .eon-combatant-controls")) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        this._onDragStart(event);
      });
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
      return;
    }
    
    // Get combat
    const combat = (game as Game).combat;
    if (!combat) {
      return;
    }

    // Parse drag data
    let dragData;
    try {
      const data = event.dataTransfer?.getData("text/plain");
      if (!data) {
        return;
      }
      dragData = JSON.parse(data);
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to parse drag data:`, error);
      return;
    }

    if (dragData.type !== "Combatant" || !dragData.combatantId) {
      return;
    }

    // Get the combatant being dragged
    const combatant = combat.combatants.get(dragData.combatantId);
    if (!combatant) {
      return;
    }

    // Get target phase from drop zone
    const targetPhase = dropTarget.dataset.phase as EonPhase;
    if (!targetPhase) {
      return;
    }


    // Calculate new order based on drop position
    const order = this._calculateDropOrder(event, dropTarget, targetPhase);

    // Get current flags before updating
    const flags = getFlags(combatant);
    const currentPhase = flags.phase;
    
    // Update the combatant's flags
    await setPhase(combatant, targetPhase, order, combat.round ?? 1);
    
    // Only clear engagement when moving to a DIFFERENT phase
    // If staying in the same phase (especially melee), preserve engagement status
    if (currentPhase !== targetPhase) {
      // Moving to a different phase - clear engagement
      if (flags.engagementGroup || flags.engagedWith) {
        await combatant.setFlag(MODULE_ID, "engagementGroup", null);
        await combatant.setFlag(MODULE_ID, "engagedWith", null);
        await combatant.setFlag(MODULE_ID, "meleeRole", null);
      }
    }
    // If staying in the same phase, engagement and role are preserved automatically

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
    const combat = (game as Game).combat;
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
    
    const combat = (game as Game).combat;
    if (!combat || !canModifyPhases()) return;

    await resetAllPhases(combat);
    this.render();
  }


  /**
   * Handle toggling attacker/defender role
   */
  async _onToggleRole(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    const combatantId = $(event.currentTarget).data("combatant-id");
    const combat = (game as Game).combat;
    if (!combat || !combatantId) return;

    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    // Check permissions: GM can always modify, non-GM can only modify owned tokens
    const gameUser = (game as Game).user;
    const isGM = gameUser?.isGM ?? false;
    const isOwner = combatant.actor?.testUserPermission(gameUser!, "OWNER") ?? false;
    
    if (!isGM && !isOwner) {
      ui.notifications?.warn("You don't have permission to modify roles for this combatant");
      return;
    }

    if (!canModifyPhases()) {
      ui.notifications?.warn("You don't have permission to modify phases");
      return;
    }

    const flags = getFlags(combatant);
    if (flags.phase !== "melee" || !flags.meleeRole) {
      ui.notifications?.warn("Can only toggle role for combatants in melee with a role");
      return;
    }

    // Toggle the role
    const newRole = flags.meleeRole === "attacker" ? "defender" : "attacker";
    await combatant.setFlag(MODULE_ID, "meleeRole", newRole);
    
    // Only toggle the other person's role if there are exactly 2 people in the engagement
    // (can't have both be defenders in a 1v1, but in 2v1 or larger, each person switches independently)
    if (flags.engagementGroup) {
      const combatantsByPhase = getCombatantsByPhase(combat);
      const meleeCombatants = combatantsByPhase.get("melee") || [];
      const groupMembers = meleeCombatants.filter(c => {
        const cFlags = getFlags(c);
        return cFlags.engagementGroup === flags.engagementGroup;
      });
      
      // Only toggle both if there are exactly 2 people in the engagement
      if (groupMembers.length === 2) {
        const otherCombatant = groupMembers.find(c => c.id !== combatant.id);
        if (otherCombatant) {
          const otherNewRole = newRole === "attacker" ? "defender" : "attacker";
          await otherCombatant.setFlag(MODULE_ID, "meleeRole", otherNewRole);
        }
      }
      // If more than 2 people, only toggle the selected combatant (already done above)
    } else if (flags.engagedWith) {
      // Backward compatibility: old engagedWith system (always 2 people)
      const otherCombatant = combat.combatants.get(flags.engagedWith);
      if (otherCombatant) {
        const otherNewRole = newRole === "attacker" ? "defender" : "attacker";
        await otherCombatant.setFlag(MODULE_ID, "meleeRole", otherNewRole);
      }
    }

    this.render();
      ui.notifications?.info(`${combatant.name} is now ${newRole === "attacker" ? "Anfallare" : "Försvarare"}`);
  }

  /**
   * Handle engaging combatants in melee
   * Opens a dialog to select which combatants to engage with
   */
  async _onEngage(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    const combatantId = $(event.currentTarget).data("combatant-id");
    const combat = (game as Game).combat;
    if (!combat || !combatantId) return;

    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    // Check permissions: GM can always engage, non-GM can only engage owned tokens
    const gameUser = (game as Game).user;
    const isGM = gameUser?.isGM ?? false;
    const isOwner = combatant.actor?.testUserPermission(gameUser!, "OWNER") ?? false;
    
    if (!isGM && !isOwner) {
      ui.notifications?.warn("You don't have permission to engage this combatant");
      return;
    }

    if (!canModifyPhases()) {
      ui.notifications?.warn("You don't have permission to modify phases");
      return;
    }

    const flags = getFlags(combatant);
    if (flags.phase !== "melee") {
      ui.notifications?.warn("Combatant must be in melee phase to engage");
      return;
    }

    // Get all melee combatants
    const combatantsByPhase = getCombatantsByPhase(combat);
    const meleeCombatants = combatantsByPhase.get("melee") || [];
    
    // Prepare available combatants for the dialog
    // Allow selecting any melee combatant, even if already engaged (to join engagements)
    const availableCombatants = meleeCombatants
      .filter(c => c.id !== combatantId)
      .map(c => {
        const cFlags = getFlags(c);
        const isInSameGroup = cFlags.engagementGroup === flags.engagementGroup;
        const isInDifferentGroup = cFlags.engagementGroup && cFlags.engagementGroup !== flags.engagementGroup;
        
        const tokenImg = (c.token as any)?.img || (c.token as any)?.texture?.src;
        return {
          id: c.id || "",
          name: c.name || "",
          img: tokenImg || c.actor?.img || "icons/svg/mystery-man.svg",
          selected: isInSameGroup,
          engagedWith: !!isInDifferentGroup,
          engagementGroup: cFlags.engagementGroup || null,
        };
      });

    if (availableCombatants.length === 0) {
      ui.notifications?.warn("Inga andra stridande i närstridsfasen att engagera med");
      return;
    }

    // Show engagement dialog
    this._showEngageDialog(combatant, availableCombatants, flags.engagementGroup);
  }
  
  /**
   * Show dialog for selecting combatants to engage with
   */
  private _showEngageDialog(
    combatant: Combatant,
    availableCombatants: Array<{ id: string; name: string; img: string; selected: boolean; engagedWith: boolean }>,
    currentGroupId: string | null | undefined
  ): void {
    const dialogContent = `
      <div class="eon-engage-dialog">
        <div class="eon-engage-header">
          <h3>Engagera ${combatant.name} i närstrid</h3>
          <p class="eon-engage-hint">Välj en stridande att engagera med (du kan gå med i befintliga engagemang):</p>
        </div>
        
        <div class="eon-engage-list">
          ${availableCombatants.map(c => `
            <label class="eon-engage-option">
              <input type="radio" 
                     name="engage-target" 
                     value="${c.id}" 
                     ${c.selected ? 'checked' : ''}>
              <img class="eon-engage-option-img" src="${c.img}" alt="${c.name}">
              <span class="eon-engage-option-name">${c.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    new Dialog({
      title: "Engagera i närstrid",
      content: dialogContent,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Avbryt",
          callback: () => {
            // Cancel - do nothing
          },
        },
        engage: {
          icon: '<i class="fas fa-link"></i>',
          label: "Engagera",
          callback: async (html: HTMLElement | JQuery<HTMLElement>) => {
            // Get selected radio button
            const $html = (html instanceof jQuery ? html : $(html)) as JQuery<HTMLElement>;
            const selectedRadio = $html.find('input[type="radio"]:checked');
            if (selectedRadio.length === 0) {
              ui.notifications?.warn("Du måste välja en stridande att engagera med");
              return false; // Keep dialog open
            }
            
            const targetId = selectedRadio.val() as string;
            if (!targetId) {
              ui.notifications?.warn("Ogiltigt val");
              return false;
            }
            
            // Get the target combatant to check if they're already engaged
            const combat = (game as Game).combat;
            if (!combat) return false;
            
            const targetCombatant = combat.combatants.get(targetId);
            if (!targetCombatant) return false;
            
            const targetFlags = getFlags(targetCombatant);
            
            // If target is already engaged, join their engagement group
            // Otherwise, create a new engagement with just these two
            if (targetFlags.engagementGroup) {
              // Join existing engagement
              await this._joinEngagement(combatant, targetCombatant, targetFlags.engagementGroup);
            } else {
              // Create new engagement
              await this._applyEngagement(combatant, [combatant.id || "", targetId], currentGroupId || null);
            }
          },
        },
      },
      default: "engage",
      close: () => {
        // Cleanup if needed
      },
    }).render(true);
  }
  
  /**
   * Apply engagement to selected combatants
   */
  private async _applyEngagement(
    primaryCombatant: Combatant,
    selectedIds: string[],
    currentGroupId: string | null | undefined
  ): Promise<void> {
    const combat = (game as Game).combat;
    if (!combat) return;

    const groupId = currentGroupId || `group-${Date.now()}`;
    const selectedCombatants = selectedIds
      .map(id => combat.combatants.get(id))
      .filter(Boolean) as Combatant[];

    if (selectedCombatants.length < 2) {
      ui.notifications?.warn("Du måste välja minst två stridande");
      return;
    }

    // Remove all combatants from their current groups first (if changing groups)
    if (currentGroupId) {
      const combatantsByPhase = getCombatantsByPhase(combat);
      const meleeCombatants = combatantsByPhase.get("melee") || [];
      
      for (const c of meleeCombatants) {
        const cFlags = getFlags(c);
        if (currentGroupId && cFlags.engagementGroup === currentGroupId && c.id && !selectedIds.includes(c.id)) {
          await c.setFlag(MODULE_ID, "engagementGroup", null);
          await c.setFlag(MODULE_ID, "meleeRole", null);
        }
      }
    }

    // Sort by reaction roll to determine roles
    const withRolls = selectedCombatants.map(c => ({
      combatant: c,
      roll: getFlags(c).reactionRoll ?? 0,
    }));
    withRolls.sort((a, b) => b.roll - a.roll);

    // Highest roll = attacker, others = defenders
    for (let i = 0; i < withRolls.length; i++) {
      const { combatant: c } = withRolls[i];
      await c.setFlag(MODULE_ID, "engagementGroup", groupId);
      await c.setFlag(MODULE_ID, "meleeRole", i === 0 ? "attacker" : "defender");
    }

    const names = selectedCombatants.map(c => c.name).join(", ");
    ui.notifications?.info(`${names} är nu engagerade i närstrid`);

    this.render();
  }
  
  /**
   * Join an existing engagement group
   */
  private async _joinEngagement(
    joiningCombatant: Combatant,
    targetCombatant: Combatant,
    groupId: string
  ): Promise<void> {
    const combat = (game as Game).combat;
    if (!combat) return;

    // Remove joining combatant from their current group if they have one
    const joiningFlags = getFlags(joiningCombatant);
    if (joiningFlags.engagementGroup && joiningFlags.engagementGroup !== groupId) {
      // They're leaving their old group
      const oldGroupId = joiningFlags.engagementGroup;
      const combatantsByPhase = getCombatantsByPhase(combat);
      const meleeCombatants = combatantsByPhase.get("melee") || [];
      
      // Check if old group still has members
      const oldGroupMembers = meleeCombatants.filter(c => {
        const flags = getFlags(c);
        return flags.engagementGroup === oldGroupId && c.id !== joiningCombatant.id;
      });
      
      // If old group only had 2 members, disengage the other one
      if (oldGroupMembers.length === 1) {
        const other = oldGroupMembers[0];
        await other.setFlag(MODULE_ID, "engagementGroup", null);
        await other.setFlag(MODULE_ID, "meleeRole", null);
      }
    }

    // Get all combatants in the target group
    const combatantsByPhase = getCombatantsByPhase(combat);
    const meleeCombatants = combatantsByPhase.get("melee") || [];
    const groupMembers = meleeCombatants.filter(c => {
      const flags = getFlags(c);
      return flags.engagementGroup === groupId;
    });
    
    // Add joining combatant to the group
    groupMembers.push(joiningCombatant);
    
    // When joining an existing engagement, the new person defaults to attacker
    // Get existing members (excluding the joining one)
    const existingMembers = groupMembers.filter(c => c.id !== joiningCombatant.id);
    
    // Set joining combatant as attacker
    await joiningCombatant.setFlag(MODULE_ID, "engagementGroup", groupId);
    await joiningCombatant.setFlag(MODULE_ID, "meleeRole", "attacker");
    
    // Set all existing members as defenders
    for (const c of existingMembers) {
      await c.setFlag(MODULE_ID, "engagementGroup", groupId);
      await c.setFlag(MODULE_ID, "meleeRole", "defender");
    }

    const names = groupMembers.map(c => c.name).join(", ");
    ui.notifications?.info(`${joiningCombatant.name} gick med i engagemanget med ${names}`);

    this.render();
  }

  /**
   * Handle disengaging from melee
   */
  async _onDisengage(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    const combatantId = $(event.currentTarget).data("combatant-id");
    const combat = (game as Game).combat;
    if (!combat || !combatantId) return;

    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    // Check permissions: GM can always disengage, non-GM can only disengage owned tokens
    const gameUser = (game as Game).user;
    const isGM = gameUser?.isGM ?? false;
    const isOwner = combatant.actor?.testUserPermission(gameUser!, "OWNER") ?? false;
    
    if (!isGM && !isOwner) {
      ui.notifications?.warn("You don't have permission to disengage this combatant");
      return;
    }

    if (!canModifyPhases()) {
      ui.notifications?.warn("You don't have permission to modify phases");
      return;
    }

    const flags = getFlags(combatant);
    if (!flags.engagementGroup && !flags.engagedWith) {
      ui.notifications?.warn("Combatant is not engaged");
      return;
    }

    // Remove from engagement group
    const groupId = flags.engagementGroup;
    await combatant.setFlag(MODULE_ID, "engagementGroup", null);
    await combatant.setFlag(MODULE_ID, "meleeRole", null);
    
    // Also clear old engagedWith for backward compatibility
    if (flags.engagedWith) {
      await combatant.setFlag(MODULE_ID, "engagedWith", null);
      const otherCombatant = combat.combatants.get(flags.engagedWith);
      if (otherCombatant) {
        await otherCombatant.setFlag(MODULE_ID, "engagedWith", null);
        await otherCombatant.setFlag(MODULE_ID, "meleeRole", null);
      }
    }

    // If this was the only member of the group, the group is now empty
    // Otherwise, other members remain engaged

    this.render();
    ui.notifications?.info(`${combatant.name} har avslutat engagemanget`);
  }

  /**
   * Sort melee combatants to group engaged pairs together
   * Attacker comes first, then their defender
   */
  private _sortMeleeCombatants(combatants: Combatant[]): Combatant[] {
    const sorted: Combatant[] = [];
    const processed = new Set<string>();
    
    // First, add all engaged pairs (attacker + defender)
    for (const combatant of combatants) {
      const combatantId = combatant.id;
      if (!combatantId || processed.has(combatantId)) continue;
      
      const flags = getFlags(combatant);
      const engagedId = flags.engagedWith;
      if (engagedId) {
        // This is part of an engagement pair
        const other = combatants.find(c => c.id === engagedId);
        const otherId = other?.id;
        if (other && otherId) {
          // Add attacker first, then defender
          if (flags.meleeRole === "attacker") {
            sorted.push(combatant);
            sorted.push(other);
          } else {
            sorted.push(other);
            sorted.push(combatant);
          }
          processed.add(combatantId);
          processed.add(otherId);
        }
      }
    }
    
    // Then add all unengaged combatants
    for (const combatant of combatants) {
      const combatantId = combatant.id;
      if (combatantId && !processed.has(combatantId)) {
        sorted.push(combatant);
      }
    }
    
    return sorted;
  }
}

/**
 * Re-render the panel when relevant combat data changes
 */
export function setupPanelHooks(): void {
  // Re-render when combat changes (round number, etc.)
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
