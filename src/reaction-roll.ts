/**
 * Reaction Roll Functionality
 * 
 * Handles rolling Reaction for combatants and sorting by results.
 * Uses the Eon RPG system's existing dice roller.
 */

import { MODULE_ID } from "./types";
import { getCombatantsByPhase, getFlags, setPhase } from "./flags";
import { EonPhase } from "./types";

/**
 * Roll Reaction for a combatant using the Eon system's dice roller
 */
export async function rollReaction(combatant: Combatant): Promise<number | null> {
  const actor = combatant.actor;
  if (!actor) {
    console.warn(`${MODULE_ID} | No actor found for combatant`);
    return null;
  }

  try {
    // Try to use the Eon system's dice roller
    // The Eon system typically has a "reaktion" or "reaction" skill/ability
    // Check common paths for the Reaction ability
    
    // Method 1: Try direct roll if the system exposes it
    if ((actor as any).rollReaction) {
      const roll = await (actor as any).rollReaction();
      return roll?.total ?? null;
    }

    // Method 2: Try to use the Eon system's built-in roller if available
    // Check if the system has a rollReaction or similar method
    if ((actor as any).system?.rollReaction) {
      const roll = await (actor as any).system.rollReaction();
      return roll?.total ?? null;
    }

    // Method 3: Try to find and roll the Reaction skill/ability
    // Eon system stores "Reaktion" (Swedish) in harleddegenskaper
    const system = actor.system as any;
    
    // Debug: log the system structure to help find the path
    console.log(`${MODULE_ID} | Searching for Reaktion in actor system:`, actor.name);
    
    // Common paths in Eon system for Reaction (Reaktion in Swedish)
    // Based on the character sheet, it's in "Härledda attribut" (Derived attributes)
    const reactionPaths = [
      system.harleddegenskaper?.reaktion,
      system.harleddegenskaper?.reaction,
      system.reaktion,
      system.reaction,
      system.fardigheter?.reaktion,
      system.fardigheter?.reaction,
      system.egenskaper?.reaktion,
      system.egenskaper?.reaction,
    ];

    let reactionValue: number | null = null;
    let reactionString: string | null = null;
    
    for (const path of reactionPaths) {
      if (!path) continue;
      
      if (typeof path === "object") {
        // Try common property names - Eon stores as "3T6" format
        reactionString = path.value ?? path.total ?? path.mod ?? path.base ?? path.formula ?? path.dice ?? null;
        if (reactionString) {
          // Parse "3T6" or "3d6" format to get the number of dice
          const match = String(reactionString).match(/(\d+)[TtDd]6/);
          if (match) {
            reactionValue = parseInt(match[1], 10);
            console.log(`${MODULE_ID} | Found Reaktion: ${reactionString} → ${reactionValue} dice`);
            break;
          }
          // Try as direct number
          const num = parseFloat(String(reactionString));
          if (!isNaN(num) && isFinite(num)) {
            reactionValue = num;
            console.log(`${MODULE_ID} | Found Reaktion as number: ${reactionValue}`);
            break;
          }
        }
        // Also check if the object itself has numeric properties
        if (typeof path.dice === "number") {
          reactionValue = path.dice;
          console.log(`${MODULE_ID} | Found Reaktion.dice: ${reactionValue}`);
          break;
        }
      } else if (typeof path === "string") {
        // Parse "3T6" format
        const match = path.match(/(\d+)[TtDd]6/);
        if (match) {
          reactionValue = parseInt(match[1], 10);
          console.log(`${MODULE_ID} | Found Reaktion string: ${path} → ${reactionValue} dice`);
          break;
        }
      } else if (typeof path === "number") {
        reactionValue = path;
        console.log(`${MODULE_ID} | Found Reaktion as direct number: ${reactionValue}`);
        break;
      }
    }
    
    // If still not found, try searching the entire system object
    if (reactionValue === null) {
      const systemStr = JSON.stringify(system);
      const reaktionMatch = systemStr.match(/"reaktion":\s*"(\d+)T6"/i) || 
                           systemStr.match(/"reaktion":\s*(\d+)/i);
      if (reaktionMatch) {
        reactionValue = parseInt(reaktionMatch[1], 10);
        console.log(`${MODULE_ID} | Found Reaktion via string search: ${reactionValue}`);
      }
    }

    if (reactionValue === null || reactionValue === undefined) {
      console.warn(`${MODULE_ID} | Could not find Reaction value for ${actor.name}`);
      console.warn(`${MODULE_ID} | System structure:`, JSON.stringify(system, null, 2).substring(0, 500));
      ui.notifications.warn(`Could not find Reaction for ${actor.name}. Check that the actor has a Reaction ability.`);
      return null;
    }

    // Roll using Foundry's standard roll system
    // Eon uses T6 (d6) dice - roll the reaction value as T6
    const rollFormula = `${reactionValue}d6`;
    const roll = new Roll(rollFormula);
    await roll.roll({ async: true });
    
    // Display the roll in chat
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: `Reaktionsslag - ${actor.name}`,
    });

    return roll.total ?? null;
  } catch (error) {
    console.error(`${MODULE_ID} | Error rolling Reaction:`, error);
    ui.notifications.error(`Failed to roll Reaction for ${actor.name}`);
    return null;
  }
}

/**
 * Roll Reaction for a combatant and update their order/role
 * For melee phase, determines attacker/defender based on roll
 */
export async function rollReactionForCombatant(combatant: Combatant): Promise<void> {
  const combat = game.combat;
  if (!combat) return;

  const result = await rollReaction(combatant);
  if (result === null) return;

  const flags = getFlags(combatant);
  const phase = flags.phase;

  // Store the reaction roll result
  await combatant.setFlag(MODULE_ID, "reactionRoll", result);

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

  ui.notifications.info(`${combatant.name}: Reaktion ${result}`);
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

