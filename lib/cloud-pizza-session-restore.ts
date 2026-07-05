import { type CloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession, type PizzaSession } from "@/lib/pizza-session";
import { savePizzaSession, setActivePizzaSession } from "@/lib/pizza-session-storage";

export function restoreCloudPizzaSessionToLocal(row: CloudPizzaSessionRow): PizzaSession | undefined {
  const session = migratePizzaSession(row.session_data);
  if (!session) return undefined;
  const restored = savePizzaSession(session);
  setActivePizzaSession(restored.id);
  return restored;
}
