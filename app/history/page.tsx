import { permanentRedirect } from "next/navigation";

export default function HistoryLegacyRedirect() {
  permanentRedirect("/about");
}
