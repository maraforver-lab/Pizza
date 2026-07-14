import { permanentRedirect } from "next/navigation";

export default function CoachRedirectPage() {
  permanentRedirect("/guide/pizza-troubleshooting");
}
