import { permanentRedirect } from "next/navigation";

export default function StartLegacyRedirect() {
  permanentRedirect("/session/start");
}
