import { permanentRedirect } from "next/navigation";

export default function GearLegacyRedirect() {
  permanentRedirect("/ovens#other-equipment");
}
