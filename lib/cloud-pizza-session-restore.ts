import { type CloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import { markCloudBackedPizzaSession } from "@/lib/cloud-pizza-session-client";
import { migratePizzaSession, type PizzaSession } from "@/lib/pizza-session";
import { savePizzaSession, setActivePizzaSession } from "@/lib/pizza-session-storage";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function restoreCloudPizzaSessionToLocal(row: CloudPizzaSessionRow, storage?: StorageLike): PizzaSession | undefined {
  const session = migratePizzaSession(row.session_data);
  if (!session) return undefined;
  const restored = savePizzaSession(session, storage);
  setActivePizzaSession(restored.id, storage);
  markCloudBackedPizzaSession(restored.id, row.id, storage);
  return restored;
}
