import { permanentRedirect } from "next/navigation";

export default function DoctorLegacyRedirect() {
  permanentRedirect("/guide/pizza-troubleshooting");
}
