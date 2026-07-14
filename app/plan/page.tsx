import { permanentRedirect } from "next/navigation";

export default function PlanRedirectPage() {
  permanentRedirect("/session/start");
}
