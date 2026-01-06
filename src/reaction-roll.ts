/**
 * Reaction Roll Functionality
 * 
 * Handles rolling Reaction for combatants and sorting by results.
 * Uses the Eon RPG system's existing dice roller by triggering the same
 * functionality as clicking the reaction roll button in the character sheet.
 */

import { MODULE_ID } from "./types";
import { getCombatantsByPhase, getFlags, setPhase } from "./flags";
import { EonPhase } from "./types";

/**
 * Roll Reaction for a combatant using the Eon system's built-in reaction roll
 * This triggers the same functionality as clicking the reaction roll button in the character sheet
 */
export async function rollReaction(combatant: Combatant): Promise<number | null> {
  const actor = combatant.actor;
  if (!actor) {
    return null;
  }

  try {
    const system = (actor as any).system;
    
    // Method 1: Try to find and trigger the reaction ability's roll method directly
    // The Eon system stores reaction in harleddegenskaper (derived attributes)
    const reaktion = system.harleddegenskaper?.reaktion || system.harleddegenskaper?.reaction;
    
    if (reaktion) {
      // Check if the reaction object has a roll method (most common in Foundry systems)
      if (typeof reaktion.roll === "function") {
        const roll = await reaktion.roll();
        // Store the result for our tracking
        await combatant.setFlag(MODULE_ID, "reactionRoll", roll?.total ?? 0);
        return roll?.total ?? null;
      }
      
      // Method 2: Try to find the roll button in the character sheet and trigger it
      // This is the preferred method - use the system's built-in roll functionality
      const sheet = actor.sheet;
      if (sheet && sheet.rendered) {
        // Try common handler names for reaction roll buttons
        const handlerNames = [
          "_onRollReaction",
          "onRollReaction", 
          "_onClickReaction",
          "onClickReaction",
          "_rollReaction",
          "rollReaction",
          "_onRollAttribute",
          "onRollAttribute"
        ];
        
        for (const handlerName of handlerNames) {
          if (typeof (sheet as any)[handlerName] === "function") {
            try {
              // Try calling with the reaction attribute name
              const event = new MouseEvent("click", { bubbles: true, cancelable: true });
              await (sheet as any)[handlerName](event, "reaktion");
              return 0; // System handles the roll
            } catch (e) {
              // Try without the attribute name
              try {
                const event = new MouseEvent("click", { bubbles: true, cancelable: true });
                await (sheet as any)[handlerName](event);
                return 0;
              } catch (e2) {
                // Continue to next handler
                continue;
              }
            }
          }
        }
        
        // Try to find the button element and click it programmatically
        const sheetElement = sheet.element;
        if (sheetElement && sheetElement.length > 0) {
          // Look for reaction roll buttons in the sheet - try multiple selectors
          const reactionButtonSelectors = [
            'button[data-action="roll-reaction"]',
            'button[data-action="reaction"]',
            'a[data-action="roll-reaction"]',
            'a[data-action="reaction"]',
            '.reaction-roll',
            '[title*="reaktion" i]',
            '[title*="reaction" i]',
            '[title*="Slå Reaktion" i]',
          ];
          
          for (const selector of reactionButtonSelectors) {
            try {
              const reactionButton = sheetElement.find(selector);
              if (reactionButton.length > 0) {
                // Trigger a click event on the button
                reactionButton[0].click();
                return 0; // System handles the roll
              }
            } catch (e) {
              // Some selectors might not work, continue trying others
              continue;
            }
          }
          
          // Also try to find by text content (case-insensitive)
          sheetElement.find('button, a').each((_index, element) => {
            const $el = $(element);
            const text = $el.text().toLowerCase();
            const title = ($el.attr('title') || '').toLowerCase();
            if (text.includes('reaktion') || text.includes('reaction') || 
                text.includes('slå reaktion') || title.includes('reaktion') || title.includes('reaction')) {
              try {
                element.click();
                return false; // Break the loop
              } catch (e) {
                // Continue searching
              }
            }
          });
        }
      }
      
      // Method 3: Try to use the formula from the reaction ability and roll it ourselves
      // This is a fallback if we can't trigger the system's built-in roll
      let formula: string | null = null;
      let diceCount: number | null = null;
      
      // Try different property names for the formula
      if (typeof reaktion === "string") {
        formula = reaktion;
      } else if (reaktion.formula) {
        formula = reaktion.formula;
      } else if (reaktion.value) {
        formula = String(reaktion.value);
      } else if (reaktion.dice) {
        diceCount = typeof reaktion.dice === "number" ? reaktion.dice : parseInt(String(reaktion.dice), 10);
      } else if (reaktion.totalt) {
        formula = String(reaktion.totalt);
      } else if (reaktion.tvarde) {
        // Eon system uses "tvarde" (value) property - this is the actual dice formula
        const tvarde = reaktion.tvarde;
        if (typeof tvarde === "string") {
          formula = tvarde;
        } else if (typeof tvarde === "number") {
          diceCount = tvarde;
        } else if (tvarde && typeof tvarde === "object") {
          // tvarde might be an object with the formula
          formula = tvarde.value || tvarde.formula || String(tvarde);
        }
      }
      
      // If we have a dice count, use it directly
      if (diceCount !== null && !isNaN(diceCount) && diceCount > 0) {
        const roll = new Roll(`${diceCount}d6`);
        await roll.roll({ async: true });
        
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: actor }),
          flavor: `Reaktionsslag - ${actor.name}`,
        });
        
        const total = roll.total ?? null;
        await combatant.setFlag(MODULE_ID, "reactionRoll", total ?? 0);
        return total;
      }
      
      if (formula) {
        // Clean the formula: remove "Ob" prefix, brackets, and other non-roll syntax
        // Eon uses "Ob2T6" format where "Ob" means modifier
        let cleanedFormula = String(formula)
          .replace(/^Ob/gi, "") // Remove "Ob" prefix (Swedish for modifier)
          .replace(/\[.*?\]/g, "") // Remove anything in brackets
          .replace(/\(.*?\)/g, "") // Remove anything in parentheses
          .trim();
        
        // Extract just the dice part (e.g., "2T6" from "Ob2T6" or "2T6+1")
        // Look for pattern like "2T6" or "2d6" or just "2" followed by T6/d6
        const diceMatch = cleanedFormula.match(/(\d+)[TtDd]6/i) || cleanedFormula.match(/(\d+)/);
        if (diceMatch) {
          const diceNum = parseInt(diceMatch[1], 10);
          if (!isNaN(diceNum) && diceNum > 0 && diceNum <= 100) { // Reasonable limit
            try {
              const roll = new Roll(`${diceNum}d6`);
              await roll.roll({ async: true });
              
              await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: `Reaktionsslag - ${actor.name}`,
              });
              
              const total = roll.total ?? null;
              await combatant.setFlag(MODULE_ID, "reactionRoll", total ?? 0);
              return total;
            } catch (rollError) {
              console.error(`${MODULE_ID} | Error creating roll with ${diceNum}d6:`, rollError);
            }
          }
        }
        
        // If we still have a formula, try to normalize T6 to d6 and clean further
        let normalizedFormula = cleanedFormula
          .replace(/T6/gi, "d6")
          .replace(/T/gi, "d")
          .replace(/[^0-9d+\-*/\s().]/g, "") // Remove any remaining invalid characters
          .trim();
        
        // Only try to use the formula if it looks like a valid roll formula
        // Valid patterns: "2d6", "2d6+1", "3d6-1", etc.
        if (/^\d+d\d+([+\-]\d+)*$/.test(normalizedFormula)) {
          try {
            const roll = new Roll(normalizedFormula);
            await roll.roll({ async: true });
            
            await roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor: actor }),
              flavor: `Reaktionsslag - ${actor.name}`,
            });
            
            const total = roll.total ?? null;
            await combatant.setFlag(MODULE_ID, "reactionRoll", total ?? 0);
            return total;
          } catch (rollError) {
            console.error(`${MODULE_ID} | Invalid roll formula after normalization: ${normalizedFormula}`, rollError);
            console.error(`${MODULE_ID} | Original formula: ${formula}`);
          }
        } else {
        }
      }
    }
    
    // Method 4: Try actor-level roll methods
    if (typeof (actor as any).rollReaction === "function") {
      const roll = await (actor as any).rollReaction();
      const total = roll?.total ?? null;
      await combatant.setFlag(MODULE_ID, "reactionRoll", total ?? 0);
      return total;
    }

    if (typeof (actor as any).system?.rollReaction === "function") {
      const roll = await (actor as any).system.rollReaction();
      const total = roll?.total ?? null;
      await combatant.setFlag(MODULE_ID, "reactionRoll", total ?? 0);
      return total;
    }

    // If we get here, we couldn't find a way to roll
    ui.notifications?.warn(`Could not find Reaction roll method for ${actor.name}. Please use the character sheet to roll Reaction.`);
    return null;
  } catch (error) {
    console.error(`${MODULE_ID} | Error rolling Reaction:`, error);
    ui.notifications?.error(`Failed to roll Reaction for ${actor.name}`);
    return null;
  }
}

/**
 * Roll Reaction for a combatant and update their order/role
 * For melee phase, determines attacker/defender based on roll
 */
export async function rollReactionForCombatant(combatant: Combatant): Promise<void> {
  const combat = (game as Game).combat;
  if (!combat) return;

  const result = await rollReaction(combatant);
  if (result === null && result !== 0) return; // Allow 0 as a valid result

  const flags = getFlags(combatant);
  const phase = flags.phase;

  // Store the reaction roll result (already stored in rollReaction, but ensure it's there)
  const storedRoll = combatant.getFlag(MODULE_ID, "reactionRoll") as number | null | undefined;
  const finalResult = result ?? storedRoll ?? 0;
  
  if (finalResult === 0 && storedRoll === null) {
    // If we got 0 and there's no stored roll, the system handled it
    // We'll need to wait for the chat message or skip ordering
      ui.notifications?.info(`${combatant.name}: Reaktionsslag utfört (kontrollera chatten)`);
    return;
  }

  // For melee phase, determine attacker/defender
  if (phase === "melee") {
    await determineMeleeRoles(combat, combatant);
  } else {
    // For other phases, just update order based on roll
    const combatantsByPhase = getCombatantsByPhase(combat);
    const phaseCombatants = combatantsByPhase.get(phase) || [];
    
    // Sort all combatants in phase by their reaction rolls
    const rolls: Array<{ combatant: Combatant; result: number }> = [];
    for (const c of phaseCombatants) {
      const cFlags = getFlags(c);
      const roll = cFlags.reactionRoll ?? 0;
      rolls.push({ combatant: c, result: roll });
    }
    
    // Sort by roll (highest first)
    rolls.sort((a, b) => b.result - a.result);
    
    // Update order
    for (let i = 0; i < rolls.length; i++) {
      const { combatant: c } = rolls[i];
      const order = (rolls.length - i) * 1000;
      await setPhase(c, phase, order, combat.round ?? 1);
    }
  }

  if (finalResult > 0) {
    ui.notifications?.info(`${combatant.name}: Reaktion ${finalResult}`);
  }
}

/**
 * Determine attacker/defender roles for melee combatants
 * Higher reaction roll = attacker, lower = defender
 */
async function determineMeleeRoles(combat: Combat, updatedCombatant: Combatant): Promise<void> {
  const combatantsByPhase = getCombatantsByPhase(combat);
  const meleeCombatants = combatantsByPhase.get("melee") || [];

  if (meleeCombatants.length < 2) {
    // Need at least 2 for melee engagement
    return;
  }

  // Get all reaction rolls for melee combatants
  const rolls: Array<{ combatant: Combatant; result: number }> = [];
  for (const c of meleeCombatants) {
    const flags = getFlags(c);
    const roll = flags.reactionRoll ?? 0;
    rolls.push({ combatant: c, result: roll });
  }

  // Sort by roll (highest first)
  rolls.sort((a, b) => b.result - a.result);

  // Highest roll = attacker, others = defenders
  // In Eon, typically it's 1v1, but can be multiple vs 1
  for (let i = 0; i < rolls.length; i++) {
    const { combatant: c } = rolls[i];
    const role = i === 0 ? "attacker" : "defender";
    await c.setFlag(MODULE_ID, "meleeRole", role);
    
    // Update order based on roll
    const order = (rolls.length - i) * 1000;
    await setPhase(c, "melee", order, combat.round ?? 1);
  }
}
