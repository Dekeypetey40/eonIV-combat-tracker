/**
 * Tests for flags.ts - Combatant Flag Management
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MockCombatant, MockCombat } from "./setup";
import { getFlags, setPhase, resetAllPhases, getCombatantsByPhase } from "../src/flags";
import { DEFAULT_FLAGS, MODULE_ID, EonPhase } from "../src/types";

describe("flags.ts", () => {
  describe("getFlags", () => {
    it("should return default flags when combatant has no flags set", () => {
      const combatant = new MockCombatant("test-1", "Test Fighter");
      
      const flags = getFlags(combatant as unknown as Combatant);
      
      expect(flags).toEqual(DEFAULT_FLAGS);
    });

    it("should return stored flags when set", () => {
      const combatant = new MockCombatant("test-1", "Test Fighter");
      combatant._setFlags(MODULE_ID, {
        phase: "melee",
        order: 500,
        round: 2,
      });
      
      const flags = getFlags(combatant as unknown as Combatant);
      
      expect(flags.phase).toBe("melee");
      expect(flags.order).toBe(500);
      expect(flags.round).toBe(2);
    });

    it("should handle partial flags with defaults", () => {
      const combatant = new MockCombatant("test-1", "Test Fighter");
      combatant._setFlags(MODULE_ID, {
        phase: "ranged",
        // order and round not set
      });
      
      const flags = getFlags(combatant as unknown as Combatant);
      
      expect(flags.phase).toBe("ranged");
      expect(flags.order).toBe(DEFAULT_FLAGS.order);
      expect(flags.round).toBe(DEFAULT_FLAGS.round);
    });
  });

  describe("setPhase", () => {
    it("should set all phase flags on a combatant", async () => {
      const combatant = new MockCombatant("test-1", "Test Fighter");
      
      await setPhase(combatant as unknown as Combatant, "mystic", 1500, 3);
      
      const flags = getFlags(combatant as unknown as Combatant);
      expect(flags.phase).toBe("mystic");
      expect(flags.order).toBe(1500);
      expect(flags.round).toBe(3);
    });

    it("should update existing flags", async () => {
      const combatant = new MockCombatant("test-1", "Test Fighter");
      combatant._setFlags(MODULE_ID, {
        phase: "ranged",
        order: 100,
        round: 1,
      });
      
      await setPhase(combatant as unknown as Combatant, "melee", 200, 1);
      
      const flags = getFlags(combatant as unknown as Combatant);
      expect(flags.phase).toBe("melee");
      expect(flags.order).toBe(200);
    });
  });

  describe("resetAllPhases", () => {
    it("should reset all combatants to 'none' phase", async () => {
      const combat = new MockCombat();
      const c1 = new MockCombatant("c1", "Fighter 1");
      const c2 = new MockCombatant("c2", "Fighter 2");
      
      c1._setFlags(MODULE_ID, { phase: "melee", order: 100, round: 1 });
      c2._setFlags(MODULE_ID, { phase: "ranged", order: 200, round: 1 });
      
      combat.addCombatant(c1);
      combat.addCombatant(c2);
      combat.round = 2;
      
      await resetAllPhases(combat as unknown as Combat);
      
      expect(getFlags(c1 as unknown as Combatant).phase).toBe("none");
      expect(getFlags(c2 as unknown as Combatant).phase).toBe("none");
      expect(getFlags(c1 as unknown as Combatant).order).toBe(0);
      expect(getFlags(c2 as unknown as Combatant).order).toBe(0);
    });
  });

  describe("getCombatantsByPhase", () => {
    let combat: MockCombat;
    let melee1: MockCombatant;
    let melee2: MockCombatant;
    let ranged1: MockCombatant;
    let mystic1: MockCombatant;
    let unassigned: MockCombatant;

    beforeEach(() => {
      combat = new MockCombat();
      
      melee1 = new MockCombatant("m1", "Melee Fighter 1");
      melee1._setFlags(MODULE_ID, { phase: "melee", order: 200, round: 1 });
      
      melee2 = new MockCombatant("m2", "Melee Fighter 2");
      melee2._setFlags(MODULE_ID, { phase: "melee", order: 100, round: 1 });
      
      ranged1 = new MockCombatant("r1", "Archer");
      ranged1._setFlags(MODULE_ID, { phase: "ranged", order: 150, round: 1 });
      
      mystic1 = new MockCombatant("y1", "Mystic");
      mystic1._setFlags(MODULE_ID, { phase: "mystic", order: 300, round: 1 });
      
      unassigned = new MockCombatant("u1", "Unassigned");
      // No flags set - defaults to "none"
      
      combat.addCombatant(melee1);
      combat.addCombatant(melee2);
      combat.addCombatant(ranged1);
      combat.addCombatant(mystic1);
      combat.addCombatant(unassigned);
    });

    it("should group combatants by their phase", () => {
      const byPhase = getCombatantsByPhase(combat as unknown as Combat);
      
      expect(byPhase.get("melee")?.length).toBe(2);
      expect(byPhase.get("ranged")?.length).toBe(1);
      expect(byPhase.get("mystic")?.length).toBe(1);
      expect(byPhase.get("none")?.length).toBe(1);
    });

    it("should sort combatants within each phase by order", () => {
      const byPhase = getCombatantsByPhase(combat as unknown as Combat);
      const meleeList = byPhase.get("melee") as MockCombatant[];
      
      // melee2 has order 100, melee1 has order 200
      expect(meleeList[0].id).toBe("m2"); // order 100 first
      expect(meleeList[1].id).toBe("m1"); // order 200 second
    });

    it("should return empty arrays for phases with no combatants", () => {
      const emptyCombat = new MockCombat();
      const byPhase = getCombatantsByPhase(emptyCombat as unknown as Combat);
      
      expect(byPhase.get("melee")).toEqual([]);
      expect(byPhase.get("ranged")).toEqual([]);
      expect(byPhase.get("mystic")).toEqual([]);
      expect(byPhase.get("none")).toEqual([]);
    });
  });
});

describe("types.ts", () => {
  it("should have correct PHASES configuration", async () => {
    const { PHASES } = await import("../src/types");
    
    expect(PHASES).toHaveLength(4);
    expect(PHASES.map(p => p.id)).toEqual(["ranged", "melee", "mystic", "none"]);
  });

  it("should have correct Swedish labels", async () => {
    const { PHASES } = await import("../src/types");
    
    const ranged = PHASES.find(p => p.id === "ranged");
    const melee = PHASES.find(p => p.id === "melee");
    const mystic = PHASES.find(p => p.id === "mystic");
    
    expect(ranged?.label).toBe("Avståndsfasen");
    expect(melee?.label).toBe("Närstridsfasen");
    expect(mystic?.label).toBe("Mystikfasen");
  });
});

