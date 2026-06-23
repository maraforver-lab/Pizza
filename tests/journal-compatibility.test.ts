import { describe, expect, it } from "vitest";
import { newJournalId, type JournalEntry } from "@/lib/pizza-journal";
import { baseSettings } from "./helpers";

describe("pizza journal compatibility", () => {
  it("keeps the current journal entry data shape type-checkable", () => {
    const entry: JournalEntry = {
      id: "journal-2026-06-23",
      createdAt: "2026-06-23T08:00:00.000Z",
      bakedAt: "2026-06-23T18:00:00.000Z",
      name: "Friday test bake",
      settings: baseSettings,
      tasteRating: 4,
      textureRating: 5,
      handlingRating: 3,
      notes: "Good spring, slightly wet centre.",
      nextTime: "Drain mozzarella longer.",
    };

    expect(entry.settings.flourId).toBe("caputo-pizzeria");
    expect(entry.photo).toBeUndefined();
  });

  it("generates non-empty journal ids without opening IndexedDB", () => {
    expect(newJournalId()).toEqual(expect.any(String));
    expect(newJournalId().length).toBeGreaterThan(0);
  });
});
