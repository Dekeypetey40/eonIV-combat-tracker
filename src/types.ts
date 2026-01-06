/**
 * Phase types for Eon IV combat
 */
export type EonPhase = "ranged" | "melee" | "mystic" | "none";

/**
 * Flags stored on each Combatant document
 */
export interface EonCombatantFlags {
  /** Which phase this combatant is assigned to */
  phase: EonPhase;
  /** Order within the phase (float for easy insertion) */
  order: number;
  /** Which combat round this assignment belongs to */
  round: number;
}

/**
 * Module constants
 */
export const MODULE_ID = "eon-combat-tracker";

/**
 * Default flag values for a new combatant
 */
export const DEFAULT_FLAGS: EonCombatantFlags = {
  phase: "none",
  order: 0,
  round: 0,
};

/**
 * Phase display configuration
 */
export const PHASES: { id: EonPhase; label: string; icon: string }[] = [
  { id: "ranged", label: "Avståndsfasen", icon: "fa-bow-arrow" },
  { id: "melee", label: "Närstridsfasen", icon: "fa-swords" },
  { id: "mystic", label: "Mystikfasen", icon: "fa-sparkles" },
  { id: "none", label: "Ej aktiv", icon: "fa-user-clock" },
];

