/**
 * Test Setup - Foundry VTT Mocks
 * 
 * This file provides mock implementations of Foundry VTT APIs
 * so we can test our module logic without running Foundry.
 */

import { vi } from "vitest";

/**
 * Mock Combatant class
 */
export class MockCombatant {
  id: string;
  name: string;
  private flags: Record<string, Record<string, unknown>> = {};
  token: { texture: { src: string } } | null = null;
  actor: { img: string } | null = null;
  isDefeated: boolean = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getFlag(scope: string, key: string): unknown {
    return this.flags[scope]?.[key];
  }

  async setFlag(scope: string, key: string, value: unknown): Promise<void> {
    if (!this.flags[scope]) {
      this.flags[scope] = {};
    }
    this.flags[scope][key] = value;
  }

  // Helper for tests to set flags directly
  _setFlags(scope: string, data: Record<string, unknown>): void {
    this.flags[scope] = data;
  }
}

/**
 * Mock Combat class
 */
export class MockCombat {
  round: number = 1;
  combatants: Map<string, MockCombatant> = new Map();

  constructor() {
    // Create a Map-like interface with get() method
    const combatantsArray: MockCombatant[] = [];
    
    this.combatants = {
      get: (id: string) => combatantsArray.find(c => c.id === id),
      map: (fn: (c: MockCombatant) => unknown) => combatantsArray.map(fn),
      [Symbol.iterator]: () => combatantsArray[Symbol.iterator](),
    } as unknown as Map<string, MockCombatant>;
    
    // Store reference to array for adding combatants
    (this.combatants as unknown as { _array: MockCombatant[] })._array = combatantsArray;
  }

  addCombatant(combatant: MockCombatant): void {
    const arr = (this.combatants as unknown as { _array: MockCombatant[] })._array;
    arr.push(combatant);
  }

  async updateEmbeddedDocuments(
    _type: string,
    updates: Array<{ _id: string; [key: string]: unknown }>
  ): Promise<void> {
    for (const update of updates) {
      const combatant = this.combatants.get(update._id);
      if (combatant) {
        // Apply flag updates
        for (const [key, value] of Object.entries(update)) {
          if (key.startsWith("flags.")) {
            const parts = key.split(".");
            const scope = parts[1];
            const flagKey = parts[2];
            await combatant.setFlag(scope, flagKey, value);
          }
        }
      }
    }
  }
}

/**
 * Mock global Foundry objects
 */
export function setupFoundryMocks(): void {
  // Mock foundry.utils.mergeObject
  (globalThis as unknown as { foundry: unknown }).foundry = {
    utils: {
      mergeObject: (original: object, other: object) => ({ ...original, ...other }),
    },
  };

  // Mock game object
  (globalThis as unknown as { game: unknown }).game = {
    user: { isGM: true },
    combat: null,
  };

  // Mock Hooks
  (globalThis as unknown as { Hooks: unknown }).Hooks = {
    once: vi.fn(),
    on: vi.fn(),
  };

  // Mock console for cleaner test output
  vi.spyOn(console, "log").mockImplementation(() => {});
}

// Run setup before all tests
setupFoundryMocks();

